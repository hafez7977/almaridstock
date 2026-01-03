import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Auth code exchange failed:', error.message);
          }

          // Persist Google provider token immediately after successful exchange.
          // Supabase often does NOT include provider_token on later refreshes.
          const providerToken = data?.session?.provider_token;
          if (providerToken) {
            await setStorageItem('google_access_token', providerToken);
            await setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
            console.log('✅ Stored Google provider token from auth callback');
          } else {
            console.log('⚠️ No provider token returned in auth callback session');
          }
        }

        // If implicit flow (hash) is used, onAuthStateChange will update the session.
      } catch (e) {
        console.error('Auth callback processing error:', e);
      } finally {
        // Clean URL and redirect
        navigate('/', { replace: true });
      }
    };

    run();
  }, [navigate, location.key]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="sr-only">Authentication Callback</h1>
        <p className="text-lg">Completing authentication...</p>
      </div>
    </main>
  );
};

export default AuthCallback;