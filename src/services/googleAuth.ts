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
  private isRefreshing = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Google Auth for web...');
      await this.loadGoogleScript();
      console.log('Google script loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      throw error;
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Since script is loaded in HTML, just wait for API to be available
      console.log('Waiting for Google API to initialize...');
      
      const checkAPI = (attempts = 0) => {
        if (window.google?.accounts) {
          console.log('Google API initialized successfully');
          resolve();
          return;
        }

        if (attempts > 50) { // 5 seconds timeout
          console.error('Google API failed to initialize after 5 seconds');
          reject(new Error('Google API failed to initialize - script may not have loaded properly'));
          return;
        }

        setTimeout(() => checkAPI(attempts + 1), 100);
      };
      
      checkAPI();
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting Google sign-in process for web...');

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
    console.log('getAccessToken - token exists:', !!token);
    
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('Token is expired');
      return null;
    }

    console.log('Token is valid');
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
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      throw new Error('Token refresh already in progress');
    }

    this.isRefreshing = true;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Attempting to refresh token...');
      
      // For web, automatic refresh is not supported
      console.log('Web platform detected - automatic token refresh not supported');
      throw new Error('Token expired - user must sign in again');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear invalid tokens on failure
      this.signOut();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    console.log('getValidAccessToken called');
    
    // First check if we have a valid non-expired token
    const token = this.getAccessToken();
    console.log('Current token exists:', !!token);
    console.log('Token expired:', this.isTokenExpired());
    
    if (token && !this.isTokenExpired()) {
      console.log('Returning valid existing token');
      return token;
    }

    console.log('Token expired or missing, user needs to sign in again');
    
    // For web, we cannot automatically refresh tokens
    // Clear invalid tokens and require user to sign in again
    this.signOut();
    return null;
  }
}

export const googleAuthService = new GoogleAuthService();