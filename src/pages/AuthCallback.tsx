import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
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
        const hasAccessTokenHash = window.location.hash.includes('access_token');

        console.log('🔐 Auth callback detected', { hasCode: !!code, hasAccessTokenHash });

        if (code) {
          console.log('📤 Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Auth code exchange failed:', error.message);
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

          // Wait a moment for onAuthStateChange to propagate
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Verify session is set before navigating
          const { data: currentSession } = await supabase.auth.getSession();
          console.log('📍 Verified session before redirect:', {
            hasSession: !!currentSession.session,
            userEmail: currentSession.session?.user?.email,
          });

          navigate('/', { replace: true });
          return;
        }

        // Handle implicit flow (hash-based tokens)
        if (hasAccessTokenHash) {
          console.log('🔐 Hash-based token detected, waiting for auth state change...');
          // Give onAuthStateChange time to process the hash
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession.session) {
            console.log('✅ Session established from hash');
            setStatus('success');
            navigate('/', { replace: true });
            return;
          }
        }

        // No code or hash - just redirect home
        console.log('⚠️ No auth code or hash found, redirecting home');
        navigate('/', { replace: true });
      } catch (e) {
        console.error('💥 Auth callback processing error:', e);
        setStatus('error');
        setErrorMessage(e instanceof Error ? e.message : 'Unknown error');
      }
    };

    run();
  }, [navigate, location.key]);

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
          <p className="text-lg text-green-600">✅ Signed in successfully! Redirecting...</p>
        )}
        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-lg text-destructive">❌ Authentication failed</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
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