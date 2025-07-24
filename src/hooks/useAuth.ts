import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authService, AuthUser } from '@/services/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const session = await authService.getCurrentSession();
      
      if (session?.user && session.provider_token) {
        const user: AuthUser = {
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          picture: session.user.user_metadata?.avatar_url || '',
        };

        // Store tokens
        localStorage.setItem('google_access_token', session.provider_token);
        localStorage.setItem('google_token_expires_at', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
        localStorage.setItem('google_user', JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user && session.provider_token) {
          const user: AuthUser = {
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email || '',
            picture: session.user.user_metadata?.avatar_url || '',
          };

          localStorage.setItem('google_access_token', session.provider_token);
          localStorage.setItem('google_token_expires_at', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
          localStorage.setItem('google_user', JSON.stringify(user));

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_token_expires_at');
          localStorage.removeItem('google_user');

          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.provider_token) {
          localStorage.setItem('google_access_token', session.provider_token);
        }
      }
    );

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await authService.signInWithGoogle();
    
    if (result.error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Sign-in failed',
      }));
    }
    // Success case will be handled by the auth state listener
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    await authService.signOut();
    // Sign out success will be handled by the auth state listener
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
};