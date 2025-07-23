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
    const variants = {
      'Available': 'default',
      'Booked': 'secondary',
      'Sold': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
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
                <TableHead>Barcode</TableHead>
                <TableHead>Chassis No</TableHead>
                <TableHead>Color Ext.</TableHead>
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
                  <TableCell className="font-mono text-sm">{car.barCode || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassisNo}</TableCell>
                  <TableCell>
                    {car.colourExt || '-'}
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