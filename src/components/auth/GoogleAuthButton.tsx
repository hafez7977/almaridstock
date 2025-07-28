import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { Loader2, LogOut, User } from 'lucide-react';

export const GoogleAuthButton: React.FC = () => {
  const { 
    user, 
    isLoading, 
    signIn, 
    signOut, 
    spreadsheetId, 
    setSpreadsheetId 
  } = useGoogleAuth();

  const isAuthenticated = !!user;

  const predefinedSheets = [
    { id: '1Q15AaOfDXixE07fmFUsymkHAcWaa0XhUxq1mOVzrgk4', name: 'Default Inventory Sheet' },
  ];

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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Welcome, {user?.user_metadata?.full_name || user?.email}
        </CardTitle>
        <CardDescription>
          Connected to Google Sheets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spreadsheet-select">Select Google Sheets</Label>
          <Select
            value={spreadsheetId}
            onValueChange={async (value) => {
              if (value === 'custom') {
                await setSpreadsheetId('');
              } else {
                await setSpreadsheetId(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a spreadsheet" />
            </SelectTrigger>
            <SelectContent>
              {predefinedSheets.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom Spreadsheet ID</SelectItem>
            </SelectContent>
          </Select>
          
          {(!spreadsheetId || !predefinedSheets.some(sheet => sheet.id === spreadsheetId)) && (
            <>
              <Label htmlFor="spreadsheet-id">Custom Google Sheets ID</Label>
              <Input
                id="spreadsheet-id"
                placeholder="Enter your Google Sheets ID"
                value={spreadsheetId}
                onChange={async (e) => await setSpreadsheetId(e.target.value)}
              />
            </>
          )}
          
          <p className="text-xs text-muted-foreground">
            You can find this in your Google Sheets URL: 
            https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={user?.user_metadata?.avatar_url} 
              alt={user?.user_metadata?.full_name || user?.email} 
              className="h-8 w-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
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