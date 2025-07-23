import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthState, GoogleUser } from '@/types/google-sheets';
import { googleAuthService } from '@/services/googleAuth';

interface GoogleAuthContextType extends GoogleAuthState {
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
  const [authState, setAuthState] = useState<GoogleAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const [spreadsheetId, setSpreadsheetIdState] = useState<string>('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await googleAuthService.initialize();
        const isAuthenticated = googleAuthService.isAuthenticated();
        
        if (isAuthenticated) {
          // Try to get user info if already authenticated
          const token = googleAuthService.getAccessToken();
          if (token) {
            // We'll need to store user info in localStorage or get it from token
            const savedUser = localStorage.getItem('google_user');
            if (savedUser) {
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: JSON.parse(savedUser),
                error: null,
              });
            }
          }
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: error instanceof Error ? error.message : 'Failed to initialize Google Auth',
        });
      }
    };

    initializeAuth();
  }, []);

  const signIn = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await googleAuthService.signIn();
      localStorage.setItem('google_user', JSON.stringify(user));
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        error: null,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: error instanceof Error ? error.message : 'Failed to sign in',
      });
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await googleAuthService.signOut();
      localStorage.removeItem('google_user');
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
    }
  };

  const setSpreadsheetId = (id: string) => {
    // Remove trailing slash to prevent API URL issues
    const cleanId = id.replace(/\/$/, '');
    setSpreadsheetIdState(cleanId);
  };

  const value: GoogleAuthContextType = {
    ...authState,
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