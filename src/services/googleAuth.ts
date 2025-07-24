import { GoogleUser } from '@/types/google-sheets';
import { supabase } from '@/integrations/supabase/client';

// Mobile-compatible Google Auth using Supabase
class GoogleAuthService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing Google Auth for mobile (Supabase)...');
    this.isInitialized = true;
  }

  async signIn(): Promise<GoogleUser> {
    console.log('Starting Google sign-in process for mobile...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw new Error(`Google auth error: ${error.message}`);
      }

      // Wait for the auth state change
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No user session after OAuth');
      }

      const user: GoogleUser = {
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email || '',
        picture: session.user.user_metadata?.avatar_url || '',
      };

      // Store the access token for Google API calls
      if (session.provider_token) {
        localStorage.setItem('google_access_token', session.provider_token);
        // Set a far future expiration since Supabase handles refresh
        localStorage.setItem('google_token_expires_at', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      }

      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    console.log('Signing out...');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('google_access_token');
    console.log('getAccessToken - token exists:', !!token);
    
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }

    // For Supabase OAuth, we don't need to check expiration as it's handled automatically
    console.log('Token is valid (Supabase managed)');
    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async refreshToken(): Promise<string | null> {
    console.log('Refreshing token via Supabase...');
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Token refresh error:', error);
        throw error;
      }

      if (session?.provider_token) {
        localStorage.setItem('google_access_token', session.provider_token);
        return session.provider_token;
      }

      throw new Error('No provider token in refreshed session');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.signOut();
      throw error;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    console.log('getValidAccessToken called');
    
    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token) {
      localStorage.setItem('google_access_token', session.provider_token);
      console.log('Returning valid token from Supabase session');
      return session.provider_token;
    }

    // Try to get stored token
    const token = this.getAccessToken();
    if (token) {
      console.log('Returning stored token');
      return token;
    }

    console.log('No valid token available');
    return null;
  }
}

export const googleAuthService = new GoogleAuthService();