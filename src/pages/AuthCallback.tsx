import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const AuthCallback = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasRunRef = useRef(false);

  useEffect(() => {
    // React 18 StrictMode runs effects twice in dev; guard to prevent double PKCE exchange.
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const setStorageItem = async (key: string, value: string) => {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    };

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const returnTo = url.searchParams.get('returnTo');
        const hasAccessTokenHash = window.location.hash.includes('access_token');

        const getSafeReturnTo = (raw: string | null) => {
          if (!raw) return null;
          try {
            const parsed = new URL(raw);
            if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

            // Prevent open redirects: only allow known app hosts.
            const host = parsed.hostname;
            const allowed =
              host.endsWith('.lovable.app') ||
              host.endsWith('.lovableproject.com') ||
              host === 'almaridstock.com' ||
              host === 'www.almaridstock.com';

            // Defensive: some environments can surface an origin ending with ':'
            // which would later produce URLs like https://host:/ (404 + redirect loops).
            const cleanedOrigin = parsed.origin.replace(/:$/, '');
            return allowed ? cleanedOrigin : null;
          } catch {
            return null;
          }
        };

        const safeReturnOrigin = getSafeReturnTo(returnTo);
        const currentOrigin = window.location.origin;
        const redirectHome = (originOverride?: string | null) => {
          const origin = originOverride ?? safeReturnOrigin;
          if (origin) {
            window.location.replace(`${origin}/`);
            return;
          }
          window.location.replace('/');
        };

        const redirectToOriginWithSession = (targetOrigin: string, session: {
          access_token: string;
          refresh_token: string;
          expires_in?: number;
          token_type?: string;
          provider_token?: string | null;
        }) => {
          // We must set the session on the SAME origin that will use it.
          // Since preview + published are different origins, we forward the session via hash
          // to /auth/callback on the target origin, then immediately persist it there.
          const params = new URLSearchParams();
          params.set('access_token', session.access_token);
          params.set('refresh_token', session.refresh_token);
          if (session.expires_in != null) params.set('expires_in', String(session.expires_in));
          if (session.token_type) params.set('token_type', session.token_type);
          if (session.provider_token) params.set('provider_token', session.provider_token);

          window.location.replace(`${targetOrigin}/auth/callback#${params.toString()}`);
        };

        console.log('🔐 Auth callback detected', {
          hasCode: !!code,
          hasAccessTokenHash,
          fullUrl: window.location.href,
          hasReturnTo: !!safeReturnOrigin,
        });

        // Prevent loops if the page reloads while still carrying the same OAuth code.
        if (code) {
          const lastCode = sessionStorage.getItem('supabase_oauth_last_code');
          if (lastCode && lastCode === code) {
            console.log('🛑 OAuth code already processed in this tab, redirecting home');
            redirectHome();
            return;
          }
          sessionStorage.setItem('supabase_oauth_last_code', code);

          // Strip the code from the URL early so reload/back doesn't re-trigger the exchange.
          try {
            url.searchParams.delete('code');
            window.history.replaceState({}, document.title, url.pathname + url.search);
          } catch {
            // ignore
          }

          console.log('📤 Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Auth code exchange failed:', error.message);

            // If the exchange fails because the code was already used, we may still have a valid session.
            const { data: sessionAfterError } = await supabase.auth.getSession();
            if (sessionAfterError.session) {
              console.log('✅ Session already exists despite exchange error; redirecting home');
              setStatus('success');
              await new Promise((resolve) => setTimeout(resolve, 400));
              redirectHome();
              return;
            }

            setStatus('error');
            setErrorMessage(error.message);
            return;
          }

          console.log('✅ Session exchange successful:', {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            userEmail: data.session?.user?.email,
            hasProviderToken: !!data.session?.provider_token,
          });

          // If the exchange happened on a different origin than where the user started
          // (e.g. Published domain -> Preview), forward the session to the target origin
          // so it can be persisted there.
          if (safeReturnOrigin && safeReturnOrigin !== currentOrigin && data.session) {
            console.log('🔁 Forwarding session to return origin for persistence', {
              from: currentOrigin,
              to: safeReturnOrigin,
            });

            redirectToOriginWithSession(safeReturnOrigin, {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_in: data.session.expires_in,
              token_type: data.session.token_type,
              provider_token: data.session.provider_token,
            });
            return;
          }

          // Persist Google provider token immediately after successful exchange.
          const providerToken = data?.session?.provider_token;
          if (providerToken) {
            await setStorageItem('google_access_token', providerToken);
            await setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
            console.log('✅ Stored Google provider token from auth callback');
          } else {
            console.log('⚠️ No provider token returned in auth callback session');
          }

          setStatus('success');

          // Give onAuthStateChange time to propagate globally
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Use window.location for a full page reload to ensure context reinitializes
          console.log('📍 Redirecting to home with full reload...');
          redirectHome();
          return;
        }

        // Handle implicit flow (hash-based tokens)
        if (hasAccessTokenHash) {
          console.log('🔐 Hash-based token detected, attempting to persist session...');

          const hash = window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hash);
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          const provider_token = hashParams.get('provider_token');

          if (access_token && refresh_token) {
            const { data: setData, error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (setErr) {
              console.error('❌ Failed to set session from hash:', setErr.message);
              setStatus('error');
              setErrorMessage(setErr.message);
              return;
            }

            console.log('✅ Session persisted from hash', {
              hasSession: !!setData.session,
              userEmail: setData.session?.user?.email,
            });

            if (provider_token) {
              await setStorageItem('google_access_token', provider_token);
              await setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
            }

            setStatus('success');

            // Strip hash then redirect
            try {
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            } catch {
              // ignore
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
            redirectHome();
            return;
          }

          // Fallback: let Supabase try to parse the hash itself
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession.session) {
            console.log('✅ Session established from hash (fallback)');
            setStatus('success');

            // Store provider token if available
            if (currentSession.session.provider_token) {
              await setStorageItem('google_access_token', currentSession.session.provider_token);
              await setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
            }

            // Strip hash then redirect
            try {
              window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            } catch {
              // ignore
            }

            redirectHome();
            return;
          }
        }

        // No code or hash - just redirect home
        console.log('⚠️ No auth code or hash found, redirecting home');
        redirectHome();
      } catch (e) {
        console.error('💥 Auth callback processing error:', e);
        setStatus('error');
        setErrorMessage(e instanceof Error ? e.message : 'Unknown error');
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="sr-only">Authentication Callback</h1>
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-lg text-foreground">Completing authentication...</p>
          </>
        )}
        {status === 'success' && (
          <p className="text-lg text-foreground">Signed in successfully. Redirecting…</p>
        )}
        {status === 'error' && (
          <div className="space-y-3 max-w-md">
            <p className="text-lg text-destructive">❌ Authentication failed</p>
            <p className="text-sm text-muted-foreground break-words">{errorMessage}</p>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Common fix:</p>
              <p>
                In Supabase → Authentication → URL Configuration, add your app URL and
                <span className="font-mono"> /auth/callback</span> to Redirect URLs.
              </p>
              <a
                className="underline underline-offset-4"
                href="https://supabase.com/dashboard/project/hjclvjxpufulxinxmnul/auth/url-configuration"
                target="_blank"
                rel="noreferrer"
              >
                Open Supabase URL settings
              </a>
            </div>

            <button
              onClick={() => window.location.replace('/')}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default AuthCallback;