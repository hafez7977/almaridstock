import { Car } from "@/types/car";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Calendar, Clock, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileCarCardProps {
  car: Car;
  onViewDetails: (car: Car) => void;
  onSpecCodeClick?: (specCode: string) => void;
  isKsaTab?: boolean;
}

export const MobileCarCard = ({ car, onViewDetails, onSpecCodeClick, isKsaTab = false }: MobileCarCardProps) => {
  const getStatusColor = (status: string) => {
    let displayStatus = status;
    const statusLower = status.toLowerCase();
    
    // KSA tab specific logic for incoming cars
    if (isKsaTab && car.place?.toLowerCase() === 'incoming') {
      // If car is available, show as UNRECEIVED
      if (statusLower.includes('available')) {
        displayStatus = 'UNRECEIVED';
      }
      // For all other statuses, keep original status from sheets
    }
    
    const displayStatusLower = displayStatus.toLowerCase();
    
    if (displayStatusLower.includes('available')) return 'bg-light-green text-light-green-foreground';
    if (displayStatusLower.includes('booked')) return 'bg-yellow text-yellow-foreground';
    if (displayStatusLower.includes('sold')) return 'bg-dark-blue text-dark-blue-foreground';
    if (displayStatusLower.includes('shipped')) return 'bg-dark-orange text-dark-orange-foreground';
    if (displayStatusLower.includes('unreceived')) return 'bg-light-yellow text-light-yellow-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        {/* Header with name and status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">{car.name}</h3>
            <p className="text-sm text-gray-500">SN: {car.sn}</p>
          </div>
          <Badge className={cn("ml-2 shrink-0 text-xs px-2 py-1", getStatusColor(car.status))}>
            {isKsaTab && car.place?.toLowerCase() === 'incoming' && car.status.toLowerCase().includes('available') ? 'UNRECEIVED' : car.status}
          </Badge>
        </div>

        {/* Key information grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500 block">Model</span>
            <p className="font-medium text-gray-900 truncate">{car.model || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Color</span>
            <p className="font-medium text-gray-900 truncate">{car.colourExt || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Branch</span>
            <p className="font-medium text-gray-900 truncate">{car.branch || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Chassis</span>
            <p className="font-medium text-gray-900 truncate font-mono text-xs">{car.chassisNo || 'N/A'}</p>
          </div>
        </div>

        {/* Description if available */}
        {car.description && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <span className="text-gray-500 text-xs block">Description</span>
            <p className="font-medium text-gray-900 text-sm">{car.description}</p>
          </div>
        )}

        {/* Customer info if available */}
        {car.customerDetails && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <span className="text-gray-500 text-xs block">Customer</span>
            <p className="font-medium text-gray-900 text-sm truncate">{car.customerDetails}</p>
          </div>
        )}

        {/* Spec code with download */}
        {car.specCode && (
          <div className="mb-3">
            <span className="text-gray-500 text-xs block mb-1">Spec Code</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => onSpecCodeClick?.(car.specCode)}
            >
              {car.specCode}
              <Download className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Aging indicator */}
        {car.aging !== undefined && car.aging > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {car.aging} days old
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(car)}
            className="w-full h-9 text-sm bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};