export interface GoogleAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GoogleUser | null;
  error: string | null;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  ranges: {
    stock: string;
    incoming: string;
    ksa: string;
    logs: string;
  };
}

export interface SheetData {
  range: string;
  values: any[][];
}

export interface GoogleSheetsService {
  authenticate: () => Promise<void>;
  signOut: () => Promise<void>;
  readSheet: (spreadsheetId: string, range: string) => Promise<any[][]>;
  writeSheet: (spreadsheetId: string, range: string, values: any[][]) => Promise<void>;
  appendSheet: (spreadsheetId: string, range: string, values: any[][]) => Promise<void>;
  createSheet: (spreadsheetId: string, title: string) => Promise<void>;
}