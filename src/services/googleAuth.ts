import { GoogleUser } from '@/types/google-sheets';

// Temporarily use web-based auth until native plugin is installed
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

    // Use a simple mock for now - will be replaced with native auth
    console.log('Initializing Google Auth...');
    this.isInitialized = true;
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting Google sign-in process...');

    // Mock sign-in for now - will be replaced with native auth
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User',
      picture: '',
    };

    // Store mock token
    const expiresAt = Date.now() + (3600 * 1000);
    localStorage.setItem('google_access_token', 'mock_token');
    localStorage.setItem('google_token_expires_at', expiresAt.toString());

    return mockUser;
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
    
    // Mock refresh for now
    const expiresAt = Date.now() + (3600 * 1000);
    localStorage.setItem('google_access_token', 'mock_token');
    localStorage.setItem('google_token_expires_at', expiresAt.toString());
    
    return 'mock_token';
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