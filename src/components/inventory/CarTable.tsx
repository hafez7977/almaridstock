import { useState } from "react";
import { Car } from "@/types/car";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Calendar, Clock } from "lucide-react";
import { CarDetailModal } from "./CarDetailModal";

interface CarTableProps {
  cars: Car[];
  title: string;
  onCarUpdate: (car: Car) => void;
}

export const CarTable = ({ cars, title, onCarUpdate }: CarTableProps) => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const cleanStatus = status.toLowerCase().trim();
    
    // Check for Available (with misspellings)
    if (cleanStatus === 'available' || 
        cleanStatus === 'availabe' || 
        cleanStatus === 'availble' || 
        cleanStatus === 'avaliable' ||
        cleanStatus.includes('available')) {
      return (
        <Badge className="bg-light-green text-light-green-foreground">
          {status}
        </Badge>
      );
    }
    
    // Check for Booked (with misspellings)
    if (cleanStatus === 'booked' || 
        cleanStatus === 'bookd' || 
        cleanStatus === 'booket' ||
        cleanStatus.includes('booked')) {
      return (
        <Badge className="bg-yellow text-yellow-foreground">
          {status}
        </Badge>
      );
    }
    
    // Check for Received Full (with misspellings)
    if (cleanStatus === 'received full' || 
        cleanStatus === 'receved full' || 
        cleanStatus === 'received ful' || 
        cleanStatus === 'recieved full' ||
        cleanStatus.includes('received') && cleanStatus.includes('full')) {
      return (
        <Badge className="bg-dark-orange text-dark-orange-foreground">
          {status}
        </Badge>
      );
    }
    
    // Check for Sold (with misspellings)
    if (cleanStatus === 'sold' || 
        cleanStatus === 'sol' || 
        cleanStatus === 'sould' ||
        cleanStatus.includes('sold')) {
      return (
        <Badge className="bg-dark-blue text-dark-blue-foreground">
          {status}
        </Badge>
      );
    }
    
    // Check for Received ADV (with misspellings)
    if (cleanStatus === 'received adv' || 
        cleanStatus === 'receved adv' || 
        cleanStatus === 'received advance' || 
        cleanStatus === 'recieved adv' ||
        (cleanStatus.includes('received') && cleanStatus.includes('adv'))) {
      return (
        <Badge className="bg-light-yellow text-light-yellow-foreground">
          {status}
        </Badge>
      );
    }
    
    // Check for Invoiced (with misspellings)
    if (cleanStatus === 'invoiced' || 
        cleanStatus === 'invoiced' || 
        cleanStatus === 'invocied' || 
        cleanStatus === 'invoicd' ||
        cleanStatus.includes('invoiced')) {
      return (
        <Badge className="bg-dark-blue text-dark-blue-foreground">
          {status}
        </Badge>
      );
    }
    
    // Default variants for other statuses
    return (
      <Badge variant="outline">
        {status}
      </Badge>
    );
  };

  const getAgingColor = (aging: number) => {
    if (aging > 30) return 'text-destructive';
    if (aging > 14) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline">{cars.length} cars</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name/Model</TableHead>
                <TableHead>Spec. Code</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Chassis No</TableHead>
                <TableHead>Color Ext.</TableHead>
                <TableHead>Color Int.</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{car.sn}</TableCell>
                  <TableCell>{getStatusBadge(car.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{car.name}</div>
                      <div className="text-sm text-muted-foreground">{car.model}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{car.specCode || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.barCode || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassisNo}</TableCell>
                  <TableCell>
                    {car.colourExt || '-'}
                  </TableCell>
                  <TableCell>
                    {car.colourInt || '-'}
                  </TableCell>
                  <TableCell>{car.branch}</TableCell>
                  <TableCell className="max-w-32 truncate">{car.customerDetails || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {car.receivedDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 text-sm font-medium ${getAgingColor(car.aging)}`}>
                      <Clock className="h-3 w-3" />
                      {car.aging} days
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCar(car)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCar(car)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onUpdate={onCarUpdate}
        />
      )}
    </Card>
  );
};