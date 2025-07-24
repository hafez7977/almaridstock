import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { isAvailable, isBooked } from "@/utils/carFilters";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Header = () => {
  const { stockCars, incomingCars, ksaCars, isLoading } = useGoogleSheets();
  
  const carStats = useMemo(() => {
    const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
    const available = allCars.filter(car => isAvailable(car.status)).length;
    const booked = allCars.filter(car => isBooked(car.status)).length;
    const total = allCars.length;
    
    return { available, booked, total };
  }, [stockCars, incomingCars, ksaCars]);
  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and Title - Simplified for mobile */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <img 
                src="/lovable-uploads/36a66632-d50f-4480-88ae-74894104308c.png" 
                alt="Al Marid Motors Logo" 
                className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-foreground truncate">
                Al Marid Motors
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Stock System</p>
            </div>
          </div>
          
          {/* Car Tracker - Mobile Optimized */}
          <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-muted rounded-lg border flex-shrink-0">
            <div className="text-center">
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-emerald-600">
                {isLoading ? '...' : carStats.available}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Available
              </div>
            </div>
            <div className="w-px h-4 sm:h-6 lg:h-8 bg-border"></div>
            <div className="text-center">
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-amber-600">
                {isLoading ? '...' : carStats.booked}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Booked
              </div>
            </div>
          </div>
          
          {/* Settings */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
};