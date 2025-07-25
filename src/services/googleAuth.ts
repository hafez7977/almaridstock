import { GoogleUser } from '@/types/google-sheets';
import { supabase } from '@/integrations/supabase/client';

// Mobile-compatible Google Auth using Supabase
class GoogleAuthService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing Google Auth for mobile (Supabase)...');
      
      // Check if Supabase is properly configured
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session check during init:', !!session);
      
      this.isInitialized = true;
      console.log('Google Auth initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
      throw new Error(`Google Auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async signIn(): Promise<GoogleUser> {
    console.log('Starting Google sign-in process for mobile (Supabase OAuth)...');
    
    try {
      // For mobile apps, we need to use the custom URL scheme
      const isCapacitor = window.location.protocol === 'capacitor:';
      const redirectTo = isCapacitor 
        ? 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://oauth/callback'
        : window.location.origin;

      console.log('Detected environment:', isCapacitor ? 'mobile' : 'web');
      console.log('Using redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        console.error('OAuth error details:', {
          message: error.message,
          status: error.status,
          details: error
        });
        throw new Error(`Google auth error: ${error.message}`);
      }

      console.log('OAuth request initiated successfully, data:', data);

      // In mobile environment, the OAuth flow will redirect and we need to handle the callback
      // For now, we'll check if we already have a session from a completed OAuth flow
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session?.user) {
        // This is expected in OAuth flow - the user will be redirected and come back
        console.log('No immediate session - OAuth redirect in progress');
        throw new Error('OAuth redirect in progress. Please complete sign-in in the opened window.');
      }

      console.log('Session found after OAuth:', !!session);
      console.log('User found in session:', !!session.user);
      console.log('Provider token available:', !!session.provider_token);

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
        console.log('Stored Google access token successfully');
      } else {
        console.warn('No provider token in session - Google Sheets access may not work');
      }

      console.log('Sign-in completed successfully for user:', user.email);
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.error('Sign-in error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
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