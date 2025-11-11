import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const next = url.searchParams.get('next') || '/';
        const hasAccessTokenHash = window.location.hash.includes('access_token');

        console.log('🔐 Auth callback detected', { hasCode: !!code, hasAccessTokenHash });

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Auth code exchange failed:', error.message);
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