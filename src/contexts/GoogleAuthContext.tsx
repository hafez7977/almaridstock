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

  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => {
    // Load from localStorage on initialization
    return localStorage.getItem('google_spreadsheet_id') || '';
  });

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth context...');
      
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
        await googleAuthService.initialize();
        
        // Check if we have a valid token
        const validToken = await googleAuthService.getValidAccessToken();
        console.log('Valid token available:', !!validToken);
        
        if (validToken) {
          // We have a valid token, check for saved user info
          const savedUser = localStorage.getItem('google_user');
          console.log('Saved user available:', !!savedUser);
          
          if (savedUser) {
            const user = JSON.parse(savedUser);
            console.log('Setting authenticated state with user:', user.email);
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user,
              error: null,
            });
          } else {
            // Token exists but no user info, clear auth state
            console.log('Token exists but no user info - clearing auth');
            await googleAuthService.signOut();
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: null,
            });
          }
        } else {
          // No valid token, ensure we're signed out
          console.log('No valid token - setting unauthenticated state');
          await googleAuthService.signOut();
          localStorage.removeItem('google_user');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Clear everything on initialization error
        await googleAuthService.signOut();
        localStorage.removeItem('google_user');
        
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
    // Persist to localStorage
    localStorage.setItem('google_spreadsheet_id', cleanId);
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