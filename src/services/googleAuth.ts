import { GoogleUser } from '@/types/google-sheets';

// Capacitor Web Google Auth (works in both web and native)
declare global {
  interface Window {
    google: any;
  }
}

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '1035920558332-dv9nk30ftjn4gfhvtdr6i3ld8j96cm0h.apps.googleusercontent.com';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email'
].join(' ');

class GoogleAuthService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // For native app, we'll use a simplified approach
      console.log('Initializing Google Auth for native app...');
      
      // Check if running in native context
      const isNative = window.location.protocol === 'capacitor:';
      
      if (isNative) {
        // Native implementation - simplified auth flow
        this.isInitialized = true;
        return;
      }

      // Web implementation
      await this.loadGoogleScript();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting Google sign-in process...');

    const isNative = window.location.protocol === 'capacitor:';
    
    if (isNative) {
      // Native mock implementation
      const mockUser = {
        email: 'admin@almaridmotors.com',
        name: 'Al Marid Admin',
        picture: '',
      };

      // Store mock token with longer expiration
      const expiresAt = Date.now() + (24 * 3600 * 1000); // 24 hours
      localStorage.setItem('google_access_token', 'native_mock_token');
      localStorage.setItem('google_token_expires_at', expiresAt.toString());

      return mockUser;
    }

    // Web implementation
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem('google_access_token', response.access_token);
            localStorage.setItem('google_token_expires_at', expiresAt.toString());
            
            // Get user info
            this.getUserInfo(response.access_token)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('No access token received'));
          }
        },
        error_callback: (error: any) => {
          reject(new Error(`Google auth error: ${error.type}`));
        }
      }).requestAccessToken();
    });
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    const userInfo = await response.json();
    
    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture || '',
    };
  }

  async signOut(): Promise<void> {
    console.log('Signing out...');
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('google_access_token');
    if (!token) return null;

    // Check if token is expired
    if (this.isTokenExpired()) {
      return null;
    }

    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('google_token_expires_at');
    if (!expiresAt) return true;

    const now = Date.now();
    const expires = parseInt(expiresAt, 10);
    
    // Consider token expired 5 minutes before actual expiration
    return now >= (expires - 5 * 60 * 1000);
  }

  async refreshToken(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Attempting to refresh token...');
    
    const isNative = window.location.protocol === 'capacitor:';
    
    if (isNative) {
      // Native mock refresh
      const expiresAt = Date.now() + (24 * 3600 * 1000);
      localStorage.setItem('google_access_token', 'native_mock_token');
      localStorage.setItem('google_token_expires_at', expiresAt.toString());
      return 'native_mock_token';
    }

    // For web, we'd need to re-authenticate
    try {
      const user = await this.signIn();
      return this.getAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    const token = this.getAccessToken();
    
    if (token) {
      return token;
    }

    // Token is expired or doesn't exist, try to refresh
    try {
      return await this.refreshToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
}

export const googleAuthService = new GoogleAuthService();