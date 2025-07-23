import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";
import { SettingsMenu } from "@/components/layout/SettingsMenu";

export const Header = () => {
  const { stockCars, incomingCars, ksaCars, isLoading } = useGoogleSheets();
  
  const carStats = useMemo(() => {
    const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
    const available = allCars.filter(car => 
      car.status?.toLowerCase() === 'available' || 
      car.status?.toLowerCase() === 'stock'
    ).length;
    const booked = allCars.filter(car => 
      car.status?.toLowerCase() === 'booked' || 
      car.status?.toLowerCase() === 'sold'
    ).length;
    const total = allCars.length;
    
    return { available, booked, total };
  }, [stockCars, incomingCars, ksaCars]);
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
          
          {/* Car Tracker */}
          <div className="flex items-center gap-6 px-6 py-2 bg-muted/30 rounded-lg border">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {isLoading ? '...' : carStats.available}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Available
              </div>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {isLoading ? '...' : carStats.booked}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Booked
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-success border-success/20 bg-success/5">
              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
              Connected to Google Sheets
            </Badge>
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
};