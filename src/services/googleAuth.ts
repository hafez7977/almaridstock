import { GoogleUser } from '@/types/google-sheets';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Mobile-compatible Google Auth using Supabase
class GoogleAuthService {
  private isInitialized = false;

  // Cross-platform storage helpers (Capacitor Preferences on native, localStorage on web)
  private async setStorageItem(key: string, value: string) {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  private async getStorageItem(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value ?? null;
    }
    return localStorage.getItem(key);
  }

  private async removeStorageItem(key: string) {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Google Auth (Supabase)...');

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session check during init:', !!session);

      this.isInitialized = true;
      console.log('Google Auth initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error,
      });
      throw new Error(
        `Google Auth initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async signIn(): Promise<GoogleUser> {
    console.log('Starting Google sign-in process (Supabase OAuth)...');

    try {
      const redirectTo = Capacitor.isNativePlatform()
        ? 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://auth/callback'
        : `${window.location.origin}/auth/callback`;

      console.log('Detected environment:', Capacitor.isNativePlatform() ? 'native' : 'web');
      console.log('Using redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        console.error('OAuth error details:', {
          message: error.message,
          status: error.status,
          details: error,
        });
        throw new Error(`Google auth error: ${error.message}`);
      }

      console.log('OAuth request initiated successfully, data:', data);

      // In OAuth flow, a redirect usually happens. If we already have a session, return it.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session?.user) {
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
        await this.setStorageItem('google_access_token', session.provider_token);
        // Keep a reasonable expiry marker; actual refresh is handled by Supabase.
        await this.setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
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
        type: typeof error,
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    console.log('Signing out...');
    await this.removeStorageItem('google_access_token');
    await this.removeStorageItem('google_token_expires_at');

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    const token = await this.getStorageItem('google_access_token');
    const expiresAtRaw = await this.getStorageItem('google_token_expires_at');

    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;
    const isExpired = expiresAt ? Date.now() > expiresAt : false;

    console.log('getAccessToken:', { hasToken: !!token, hasExpiresAt: !!expiresAtRaw, isExpired });

    if (!token) return null;

    // If we know it's expired, treat as missing so callers can refresh/re-auth.
    if (isExpired) {
      await this.removeStorageItem('google_access_token');
      await this.removeStorageItem('google_token_expires_at');
      return null;
    }

    return token;
  }

  async isAuthenticated(): Promise<boolean> {
    return !!(await this.getAccessToken());
  }

  async refreshToken(): Promise<string | null> {
    console.log('Refreshing token via Supabase...');

    try {
      // If we don't have a refresh_token in the current session, refreshSession() will
      // throw ("refresh_token_not_found"). Avoid the noisy loop and let callers
      // trigger re-auth instead.
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!existingSession?.refresh_token) {
        console.warn('No refresh_token available; cannot refresh session.');
        return null;
      }

      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Token refresh error:', error);
        throw error;
      }

      if (session?.provider_token) {
        await this.setStorageItem('google_access_token', session.provider_token);
        await this.setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
        return session.provider_token;
      }

      throw new Error('No provider token in refreshed session');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // If storage got partially wiped, Supabase may report refresh_token_not_found.
      // Cleanly sign out locally and let the UI prompt for sign-in again.
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Refresh Token Not Found') || message.includes('refresh_token_not_found')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.auth.signOut({ scope: 'local' } as any);
        await this.removeStorageItem('google_access_token');
        await this.removeStorageItem('google_token_expires_at');
        return null;
      }

      await this.signOut();
      throw error;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    console.log('getValidAccessToken called');

    // First try stored token (persists across refreshes)
    const storedToken = await this.getAccessToken();
    if (storedToken) {
      console.log('Returning stored token from storage');
      return storedToken;
    }

    // Then check current session for provider_token (often only present right after OAuth)
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.provider_token) {
      await this.setStorageItem('google_access_token', session.provider_token);
      await this.setStorageItem('google_token_expires_at', (Date.now() + 3600 * 1000).toString());
      console.log('Returning valid token from Supabase session');
      return session.provider_token;
    }

    if (session?.user) {
      console.log('User authenticated but no Google token - re-authentication required');
    }

    console.log('No valid token available');
    return null;
  }
}

export const googleAuthService = new GoogleAuthService();
