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
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50 pt-safe-top">
      <div className="w-full px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and Title - Mobile First Design */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
              <img 
                src="/lovable-uploads/36a66632-d50f-4480-88ae-74894104308c.png" 
                alt="Al Marid Motors Logo" 
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                Al Marid Motors
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Stock Management System</p>
            </div>
          </div>
          
          {/* Car Stats - Condensed for Mobile */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-muted/50 rounded-lg border flex-shrink-0">
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-emerald-600">
                {isLoading ? '-' : carStats.available}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide leading-none">
                Available
              </div>
            </div>
            <div className="w-px h-6 bg-border mx-1"></div>
            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-amber-600">
                {isLoading ? '-' : carStats.booked}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide leading-none">
                Booked
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
};