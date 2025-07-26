import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface GoogleAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setSpreadsheetId: (id: string) => void;
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

  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => {
    return localStorage.getItem('google_spreadsheet_id') || '';
  });

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        console.log('Session details:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasProviderToken: !!session?.provider_token,
          provider: session?.user?.app_metadata?.provider,
          userEmail: session?.user?.email
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Store Google access token if available
        if (session?.provider_token) {
          localStorage.setItem('google_access_token', session.provider_token);
          console.log('Stored Google provider token:', session.provider_token.substring(0, 20) + '...');
        }
        
        // Close browser if we're on mobile and got a successful session
        if (Capacitor.isNativePlatform() && session && event === 'SIGNED_IN') {
          Browser.close().catch(e => console.log('Browser already closed or not open'));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', !!session, error);
      if (error) {
        console.error('Session retrieval error:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.provider_token) {
        localStorage.setItem('google_access_token', session.provider_token);
        console.log('Stored Google provider token from initial session');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    console.log('Sign-in button clicked');
    setIsLoading(true);
    
    try {
      // Different approach for mobile vs web
      if (Capacitor.isNativePlatform()) {
        // Mobile: Use app scheme redirect
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            redirectTo: 'app.alamaridstock://login-callback/'
          }
        });

        if (error) {
          console.error('Mobile OAuth error:', error);
          setIsLoading(false);
          throw error;
        }

        if (data.url) {
          console.log('Opening OAuth URL in in-app browser:', data.url);
          await Browser.open({
            url: data.url,
            presentationStyle: 'popover',
            windowName: '_self'
          });
        }
      } else {
        // Web: Use current domain redirect
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            redirectTo: window.location.origin + window.location.pathname
          }
        });

        if (error) {
          console.error('Web OAuth error:', error);
          setIsLoading(false);
          throw error;
        }
        
        console.log('Web OAuth initiated, redirecting...');
      }

      console.log('OAuth sign-in initiated successfully');
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_spreadsheet_id');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const setSpreadsheetId = (id: string) => {
    // Remove trailing slash to prevent API URL issues
    const cleanId = id.replace(/\/$/, '');
    setSpreadsheetIdState(cleanId);
    // Persist to localStorage
    localStorage.setItem('google_spreadsheet_id', cleanId);
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

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};