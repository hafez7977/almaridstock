import { GoogleUser } from '@/types/google-sheets';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = ''; // You'll need to add your client ID here
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

    return new Promise((resolve, reject) => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error));
            return;
          }

          // Store the access token
          localStorage.setItem('google_access_token', tokenResponse.access_token);
          
          // Get user info
          this.getUserInfo(tokenResponse.access_token)
            .then(resolve)
            .catch(reject);
        },
      }).requestAccessToken();
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
  }

  getAccessToken(): string | null {
    return localStorage.getItem('google_access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const googleAuthService = new GoogleAuthService();