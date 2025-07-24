import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthState, GoogleUser } from '@/types/google-sheets';
import { googleAuthService } from '@/services/googleAuth';
import { supabase } from '@/integrations/supabase/client';

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
        
        // Set up Supabase auth state listener for real-time updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change event:', event, 'Session:', !!session);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in via auth state change');
              const user = {
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email || '',
                picture: session.user.user_metadata?.avatar_url || '',
              };
              
              // Store the access token and user info
              if (session.provider_token) {
                localStorage.setItem('google_access_token', session.provider_token);
                localStorage.setItem('google_token_expires_at', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
                console.log('Stored Google access token from auth state change');
              }
              localStorage.setItem('google_user', JSON.stringify(user));
              
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
                error: null,
              });
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out via auth state change');
              localStorage.removeItem('google_access_token');
              localStorage.removeItem('google_token_expires_at');
              localStorage.removeItem('google_user');
              
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
              });
            }
          }
        );
        
        // Check for OAuth callback parameters (mobile-specific)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const isCapacitor = window.location.protocol === 'capacitor:';
        
        // Mobile OAuth callback detection
        const hasOAuthParams = urlParams.has('code') || 
                              hashParams.has('access_token') || 
                              hashParams.has('refresh_token') ||
                              urlParams.has('state') ||
                              hashParams.has('state');
        
        console.log('OAuth callback check:', {
          hasOAuthParams,
          isCapacitor,
          url: window.location.href,
          search: window.location.search,
          hash: window.location.hash
        });
        
        if (hasOAuthParams || isCapacitor) {
          console.log('Mobile OAuth callback detected, waiting for session...');
          
          // Give Supabase time to process the OAuth callback
          let retryCount = 0;
          const maxRetries = 10;
          const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('OAuth callback session error:', error);
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying session check (${retryCount}/${maxRetries})...`);
                setTimeout(checkSession, 1000);
                return;
              }
              throw error;
            }
            
            if (session?.user) {
              console.log('OAuth callback successful after', retryCount, 'retries');
              // The auth state listener will handle the rest
              return;
            }
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Session not ready, retrying (${retryCount}/${maxRetries})...`);
              setTimeout(checkSession, 1000);
            } else {
              console.log('Session not available after maximum retries');
              // Continue with normal initialization
              await normalInitialization();
            }
          };
          
          await checkSession();
          setIsInitialized(true);
          return;
        }
        
        await normalInitialization();
        
        async function normalInitialization() {
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
    
    // Cleanup subscription on unmount
    return () => {
      // The subscription cleanup will be handled by the auth state listener
    };
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