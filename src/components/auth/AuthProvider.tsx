import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthUser } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();
  const [spreadsheetId, setSpreadsheetIdState] = React.useState<string>(() => {
    return localStorage.getItem('google_spreadsheet_id') || '';
  });

  const setSpreadsheetId = (id: string) => {
    const cleanId = id.replace(/\/$/, '');
    setSpreadsheetIdState(cleanId);
    localStorage.setItem('google_spreadsheet_id', cleanId);
  };

  const value: AuthContextType = {
    ...auth,
    spreadsheetId,
    setSpreadsheetId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};