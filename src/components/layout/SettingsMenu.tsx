import { useState } from 'react';
import { Settings, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { useToast } from '@/hooks/use-toast';

export const SettingsMenu = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { isAdmin, logout } = useAdmin();
  const { toast } = useToast();

  const handleAdminLogout = () => {
    logout();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            User Settings
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {isAdmin ? (
            <>
              <DropdownMenuItem className="text-green-600">
                <Shield className="mr-2 h-4 w-4" />
                Admin Mode Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAdminLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout Admin
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setShowLogin(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Admin Login
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AdminLogin open={showLogin} onOpenChange={setShowLogin} />
    </>
  );
};