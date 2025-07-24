import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
}

class AuthService {
  async signInWithGoogle(): Promise<{ user?: AuthUser; error?: string }> {
    try {
      console.log('Starting Google OAuth sign-in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        return { error: error.message };
      }

      console.log('OAuth initiated successfully');
      return {};
    } catch (error) {
      console.error('Sign-in error:', error);
      return { error: error instanceof Error ? error.message : 'Sign-in failed' };
    }
  }

  async signOut(): Promise<void> {
    console.log('Signing out...');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_user');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('google_access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    return session;
  }
}

export const authService = new AuthService();