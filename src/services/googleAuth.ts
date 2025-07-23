import { GoogleUser } from '@/types/google-sheets';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '1035920558332-dv9nk30ftjn4gfhvtdr6i3ld8j96cm0h.apps.googleusercontent.com';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'profile',
  'email'
].join(' ');

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

class GoogleAuthService {
  private isInitialized = false;
  private gapi: any = null;
  private tokenClient: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be used in browser environment'));
        return;
      }

      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = async () => {
        try {
          await this.initializeGoogleAuth();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  private async initializeGoogleAuth(): Promise<void> {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID is not configured');
    }

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: this.handleCredentialResponse.bind(this),
    });

    // Initialize token client for OAuth
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: () => {}, // Will be set dynamically
    });
  }

  private handleCredentialResponse(response: any): void {
    // Handle the JWT token from Google
    const token = response.credential;
    // You can decode the JWT token here to get user info
    console.log('Google credential response:', token);
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting Google sign-in process...');
    console.log('Current origin:', window.location.origin);
    console.log('Client ID:', GOOGLE_CLIENT_ID);

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (tokenResponse: any) => {
          console.log('Token response:', tokenResponse);
          
          if (tokenResponse.error) {
            console.error('OAuth error:', tokenResponse.error);
            reject(new Error(tokenResponse.error));
            return;
          }

          // Store the access token and expiration time
          const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
          localStorage.setItem('google_access_token', tokenResponse.access_token);
          localStorage.setItem('google_token_expires_at', expiresAt.toString());
          
          // Get user info
          this.getUserInfo(tokenResponse.access_token)
            .then(resolve)
            .catch(reject);
        };
        
        console.log('Requesting access token...');
        this.tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Error during sign-in:', error);
        reject(error);
      }
    });
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    const userInfo = await response.json();
    return {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  }

  async signOut(): Promise<void> {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      // Revoke the token
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    }
    
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
    
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token refresh error:', tokenResponse.error);
            // Clear invalid tokens
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expires_at');
            reject(new Error(tokenResponse.error));
            return;
          }

          // Store the new access token and expiration time
          const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
          localStorage.setItem('google_access_token', tokenResponse.access_token);
          localStorage.setItem('google_token_expires_at', expiresAt.toString());
          
          console.log('Token refreshed successfully');
          resolve(tokenResponse.access_token);
        };
        
        this.tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Error during token refresh:', error);
        reject(error);
      }
    });
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