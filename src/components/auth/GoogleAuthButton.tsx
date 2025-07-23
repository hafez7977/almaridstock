import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { Loader2, LogOut, User } from 'lucide-react';

export const GoogleAuthButton: React.FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error, 
    signIn, 
    signOut, 
    spreadsheetId, 
    setSpreadsheetId 
  } = useGoogleAuth();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect to Google Sheets</CardTitle>
          <CardDescription>
            Sign in to your Google account to access your car inventory sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn} className="w-full">
            Sign in with Google
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Welcome, {user?.name}
        </CardTitle>
        <CardDescription>
          Connected to Google Sheets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spreadsheet-id">Google Sheets ID</Label>
          <Input
            id="spreadsheet-id"
            placeholder="Enter your Google Sheets ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            You can find this in your Google Sheets URL: 
            https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={user?.picture} 
              alt={user?.name} 
              className="h-8 w-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};