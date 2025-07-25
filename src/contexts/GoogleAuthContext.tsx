import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('🔄 Setting up auth state listener...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📍 Initial session:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        error: error?.message 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.provider_token) {
        localStorage.setItem('google_access_token', session.provider_token);
        console.log('✅ Stored Google provider token');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth state change:', { 
          event, 
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.provider_token) {
          localStorage.setItem('google_access_token', session.provider_token);
          console.log('✅ Updated Google provider token');
        } else {
          localStorage.removeItem('google_access_token');
          console.log('🗑️ Removed Google provider token');
        }
      }
    );

    return () => {
      console.log('🔌 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    console.log('🚀 Starting Google sign-in...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
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
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_spreadsheet_id');
      
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

  const setSpreadsheetId = (id: string) => {
    const cleanId = id.replace(/\/$/, '');
    setSpreadsheetIdState(cleanId);
    localStorage.setItem('google_spreadsheet_id', cleanId);
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