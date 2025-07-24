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
      console.log('Checking if Google script is loaded in HTML...');
      console.log('User agent:', navigator.userAgent);
      console.log('Current origin:', window.location.origin);
      
      // Check if script tag exists
      const scriptTag = document.querySelector('script[src*="gsi/client"]');
      console.log('Google script tag found:', !!scriptTag);
      
      if (scriptTag) {
        console.log('Script src:', scriptTag.getAttribute('src'));
        console.log('Script loaded:', scriptTag.hasAttribute('data-loaded'));
      }
      
      // Check current state of window.google
      console.log('window.google exists:', !!window.google);
      console.log('window.google.accounts exists:', !!window.google?.accounts);
      
      // Check for script loading errors
      const scripts = document.querySelectorAll('script[src*="gsi/client"]');
      scripts.forEach((script, index) => {
        const htmlScript = script as HTMLScriptElement;
        console.log(`Script ${index + 1} error state:`, htmlScript.onerror);
        htmlScript.addEventListener('error', (e) => {
          console.error('Google script loading error:', e);
        });
      });
      
      const checkAPI = (attempts = 0) => {
        console.log(`Attempt ${attempts + 1}: Checking Google API availability...`);
        console.log('window.google:', !!window.google);
        console.log('window.google.accounts:', !!window.google?.accounts);
        
        // More detailed logging
        if (window.google) {
          console.log('Google object keys:', Object.keys(window.google));
          if (window.google.accounts) {
            console.log('Google accounts object keys:', Object.keys(window.google.accounts));
          }
        }
        
        if (window.google?.accounts?.oauth2) {
          console.log('Google OAuth2 API available');
          resolve();
          return;
        }

        if (attempts >= 50) { // 5 seconds timeout for mobile
          const debugInfo = {
            scriptTagExists: !!scriptTag,
            windowGoogleExists: !!window.google,
            accountsExists: !!window.google?.accounts,
            oauth2Exists: !!window.google?.accounts?.oauth2,
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            protocol: window.location.protocol
          };
          
          console.error('Google API failed to initialize. Debug info:', debugInfo);
          
          const errorMsg = `Google API failed to initialize after ${attempts + 1} attempts. Debug: ${JSON.stringify(debugInfo)}`;
          reject(new Error(errorMsg));
          return;
        }

        setTimeout(() => checkAPI(attempts + 1), 100);
      };
      
      // Start checking immediately
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