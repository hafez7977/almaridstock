import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';

interface GoogleAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setSpreadsheetId: (id: string) => Promise<void>;
  spreadsheetId: string;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [spreadsheetId, setSpreadsheetIdState] = useState<string>('');

  // Helper functions for cross-platform storage
  const setStorageItem = async (key: string, value: string) => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  };

  const getStorageItem = async (key: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  };

  const removeStorageItem = async (key: string) => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  };

  // Initialize spreadsheet ID from storage
  useEffect(() => {
    const initializeSpreadsheetId = async () => {
      const storedId = await getStorageItem('google_spreadsheet_id');
      if (storedId) {
        setSpreadsheetIdState(storedId);
      }
    };
    initializeSpreadsheetId();
  }, []);

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');

    const authInitialized = { current: false };

    // Listen for auth changes FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state change:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        providerToken: !!session?.provider_token,
      });

      authInitialized.current = true;

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Handle storage async operations using setTimeout to avoid blocking
      if (session?.provider_token) {
        setTimeout(async () => {
          await setStorageItem('google_access_token', session.provider_token!);
          console.log('✅ Updated Google provider token');
        }, 0);
      }
      // Don't clear the token on every auth change - only clear on explicit sign out
      // This preserves tokens across page refreshes where provider_token isn't returned
    });

    // THEN get initial session (but don't overwrite state if the listener already fired)
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        console.log('📍 Initial session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message,
          providerToken: !!session?.provider_token,
        });

        // Store token if available from initial session
        if (session?.provider_token) {
          await setStorageItem('google_access_token', session.provider_token);
          console.log('✅ Stored Google provider token from initial session');
        } else if (session?.user) {
          // If user is logged in but no provider_token, check if we have a stored one
          const storedToken = await getStorageItem('google_access_token');
          if (!storedToken) {
            console.log('⚠️ User authenticated but no stored token - may need re-auth for Google API');
          } else {
            console.log('✅ Using stored Google access token');
          }
        }

        if (!authInitialized.current) {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('❌ Failed to get initial session:', err);
        setIsLoading(false);
      });

    return () => {
      console.log('🔌 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    console.log('🚀 Starting Google sign-in...');
    setIsLoading(true);

    try {
      const redirectTo = Capacitor.isNativePlatform()
        ? 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://auth/callback'
        : `${window.location.origin}/auth/callback`;

      // Use explicit redirects everywhere.
      // This is more reliable in embedded/preview contexts and gives us a URL to open on native.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes:
            'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('❌ OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL returned from Supabase');
      }

      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.url, windowName: '_self' });
      } else {
        window.location.assign(data.url);
      }

      console.log('✅ OAuth initiated successfully');
    } catch (error) {
      console.error('💥 Sign-in error:', error);
      throw error;
    } finally {
      // If we didn't navigate away (e.g., due to an error), ensure UI isn't stuck.
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    setIsLoading(true);
    
    try {
      // Only clear tokens on explicit sign out
      await removeStorageItem('google_access_token');
      await removeStorageItem('google_spreadsheet_id');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
      setSpreadsheetIdState('');
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('💥 Sign-out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setSpreadsheetId = async (id: string) => {
    const cleanId = id.replace(/\/$/, '');
    setSpreadsheetIdState(cleanId);
    await setStorageItem('google_spreadsheet_id', cleanId);
    console.log('📋 Updated spreadsheet ID:', cleanId);
  };

  const value: GoogleAuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    setSpreadsheetId,
    spreadsheetId,
  };

  console.log('🔍 Current auth state:', {
    isAuthenticated: !!user,
    isLoading,
    hasSession: !!session,
    userEmail: user?.email
  });

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};