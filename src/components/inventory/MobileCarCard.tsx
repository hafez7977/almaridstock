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
}

export const MobileCarCard = ({ car, onViewDetails, onSpecCodeClick }: MobileCarCardProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('available')) return 'bg-light-green text-light-green-foreground';
    if (statusLower.includes('booked')) return 'bg-yellow text-yellow-foreground';
    if (statusLower.includes('sold')) return 'bg-dark-blue text-dark-blue-foreground';
    if (statusLower.includes('shipped')) return 'bg-dark-orange text-dark-orange-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{car.name}</h3>
            <p className="text-sm text-muted-foreground">SN: {car.sn}</p>
          </div>
          <Badge className={cn("ml-2 shrink-0", getStatusColor(car.status))}>
            {car.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Model:</span>
            <p className="font-medium truncate">{car.model || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Spec:</span>
            <p className="font-medium truncate">{car.specCode || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Color:</span>
            <p className="font-medium truncate">{car.colourExt || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Branch:</span>
            <p className="font-medium truncate">{car.branch || 'N/A'}</p>
          </div>
        </div>

        {car.specCode && (
          <div className="mb-3">
            <span className="text-muted-foreground text-sm">Spec Code:</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-2 text-primary"
              onClick={() => onSpecCodeClick?.(car.specCode)}
            >
              {car.specCode}
              <Download className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {car.aging !== undefined && car.aging > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {car.aging} days old
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(car)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};