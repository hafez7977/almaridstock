import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
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

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth state change:', { 
          event, 
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          providerToken: !!session?.provider_token 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Handle storage async operations using setTimeout to avoid blocking
        if (session?.provider_token) {
          setTimeout(async () => {
            await setStorageItem('google_access_token', session.provider_token!);
            console.log('✅ Updated Google provider token');
          }, 0);
        } else {
          setTimeout(async () => {
            await removeStorageItem('google_access_token');
            console.log('🗑️ Removed Google provider token');
          }, 0);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📍 Initial session check:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message,
        providerToken: !!session?.provider_token
      });
      
      // Store token if available
      if (session?.provider_token) {
        setStorageItem('google_access_token', session.provider_token);
        console.log('✅ Stored Google provider token from initial session');
      }
      
      // Set initial state only if auth listener hasn't fired yet
      if (isLoading) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    }).catch(err => {
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
      // Use custom URL scheme for native app OAuth
      const redirectTo = Capacitor.isNativePlatform() 
        ? 'app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://auth/callback'
        : `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          queryParams: {
            access_type: 'offline',
            // Only prompt consent if user is not already authenticated
            // This allows for persistent sessions without re-authentication
          }
        }
      });

      if (error) {
        console.error('❌ OAuth error:', error);
        setIsLoading(false);
        throw error;
      }

      console.log('✅ OAuth initiated successfully');
    } catch (error) {
      console.error('💥 Sign-in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    setIsLoading(true);
    
    try {
      await removeStorageItem('google_access_token');
      await removeStorageItem('google_spreadsheet_id');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('💥 Sign-out error:', error);
      setIsLoading(false);
      throw error;
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