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

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initialization attempts
      if (isInitialized) {
        console.log('Auth already initialized, skipping...');
        return;
      }

      console.log('Starting auth context initialization...');
      
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Initialize the auth service
        await googleAuthService.initialize();
        console.log('Auth service initialized successfully');
        
        // Check if we have a valid token and session
        const validToken = await googleAuthService.getValidAccessToken();
        console.log('Valid token available:', !!validToken);
        
        if (validToken) {
          // We have a valid token, check for saved user info
          const savedUser = localStorage.getItem('google_user');
          console.log('Saved user available:', !!savedUser);
          
          if (savedUser) {
            try {
              const user = JSON.parse(savedUser);
              console.log('Setting authenticated state with user:', user.email);
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
                error: null,
              });
            } catch (parseError) {
              console.error('Failed to parse saved user data:', parseError);
              // Clear corrupted data
              localStorage.removeItem('google_user');
              await googleAuthService.signOut();
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
              });
            }
          } else {
            // Token exists but no user info, this shouldn't happen in normal flow
            console.log('Token exists but no user info - clearing auth state');
            await googleAuthService.signOut();
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: null,
            });
          }
        } else {
          // No valid token, set clean unauthenticated state
          console.log('No valid token found - setting clean unauthenticated state');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
        }
        
        setIsInitialized(true);
        console.log('Auth context initialization completed successfully');
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        
        // Detailed error logging
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Non-Error object:', error);
        }
        
        // Clear everything on initialization error
        try {
          await googleAuthService.signOut();
          localStorage.removeItem('google_user');
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : `Auth initialization failed: ${String(error)}`;
        
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: errorMessage,
        });
        
        setIsInitialized(true); // Mark as initialized even on error to prevent retry loops
      }
    };

    initializeAuth();
  }, [isInitialized]);

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