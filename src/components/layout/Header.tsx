import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <img 
                src="/lovable-uploads/36a66632-d50f-4480-88ae-74894104308c.png" 
                alt="Al Marid Motors Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Al Marid Motors</h1>
              <p className="text-sm text-muted-foreground">Car Dealership Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-success border-success/20 bg-success/5">
              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
              Google Sheets Connected
            </Badge>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};