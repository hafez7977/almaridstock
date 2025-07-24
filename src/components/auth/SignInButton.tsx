import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

const PREDEFINED_SHEETS = [
  { id: '1Q15AaOfDXixE07fmFUsymkHAcWaa0XhUxq1mOVzrgk4', name: 'Main Inventory Sheet' },
];

export const SignInButton: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, signIn, signOut, spreadsheetId, setSpreadsheetId } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
          <Button onClick={signIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in with Google'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Signed In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.picture} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sheet-select">Google Sheet</Label>
          <Select value={spreadsheetId} onValueChange={setSpreadsheetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a spreadsheet" />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_SHEETS.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom Spreadsheet ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {spreadsheetId === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-id">Custom Spreadsheet ID</Label>
            <Input
              id="custom-id"
              placeholder="Enter spreadsheet ID"
              value={spreadsheetId === 'custom' ? '' : spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
          </div>
        )}

        <Button onClick={signOut} variant="outline" className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};