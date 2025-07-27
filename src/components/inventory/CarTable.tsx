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
import { Eye, Edit, Calendar, Clock, Download } from "lucide-react";
import { CarDetailModal } from "./CarDetailModal";
import { MobileCarCard } from "./MobileCarCard";
import { ReportGenerator } from "./ReportGenerator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CarTableProps {
  cars: Car[];
  title: string;
  onCarUpdate: (car: Car) => void;
  isKsaTab?: boolean;
}

export const CarTable = ({ cars, title, onCarUpdate, isKsaTab = false }: CarTableProps) => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const { toast } = useToast();

  const handleSpecCodeClick = async (specCode: string) => {
    try {
      // Check if there's a spec file for this spec code
      const { data: specs, error } = await supabase
        .from('specs')
        .select('*')
        .eq('spec_code', specCode)
        .limit(1);

      if (error) {
        console.error('Error checking for spec file:', error);
        toast({
          title: "Error",
          description: "Failed to check for spec file.",
          variant: "destructive",
        });
        return;
      }

      if (!specs || specs.length === 0) {
        toast({
          title: "No spec file found",
          description: `No specification file found for code: ${specCode}`,
          variant: "destructive",
        });
        return;
      }

      const spec = specs[0];

      // Get signed URL for download
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('spec_files')
        .createSignedUrl(spec.file_path, 60); // 60 seconds expiry

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        toast({
          title: "Download error",
          description: "Failed to generate download link.",
          variant: "destructive",
        });
        return;
      }

      // Download the file
      const response = await fetch(signedUrlData.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = spec.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${spec.file_name}`,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, car?: Car, isKsaTab?: boolean) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    let displayStatus = status;
    const cleanStatus = status.toLowerCase().trim();
    
    // KSA tab logic for incoming cars
    if (isKsaTab && car?.place?.toLowerCase() === 'incoming') {
      // If car is available, show as UNRECEIVED
      if (cleanStatus === 'available' || 
          cleanStatus === 'availabe' || 
          cleanStatus === 'availble' || 
          cleanStatus === 'avaliable' ||
          cleanStatus.includes('available')) {
        displayStatus = 'UNRECEIVED';
      }
      // If car is not available, keep original status
    }
    
    const cleanDisplayStatus = displayStatus.toLowerCase().trim();
    
    // Check for Available (with misspellings)
    if (cleanDisplayStatus === 'available' || 
        cleanDisplayStatus === 'availabe' || 
        cleanDisplayStatus === 'availble' || 
        cleanDisplayStatus === 'avaliable' ||
        cleanDisplayStatus.includes('available')) {
      return (
        <Badge className="bg-light-green text-light-green-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Check for Booked (with misspellings)
    if (cleanDisplayStatus === 'booked' || 
        cleanDisplayStatus === 'bookd' || 
        cleanDisplayStatus === 'booked' ||
        cleanDisplayStatus.includes('booked')) {
      return (
        <Badge className="bg-yellow text-yellow-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Check for Sold (with misspellings)
    if (cleanDisplayStatus === 'sold' || 
        cleanDisplayStatus === 'sol' || 
        cleanDisplayStatus === 'sld' ||
        cleanDisplayStatus.includes('sold')) {
      return (
        <Badge className="bg-dark-blue text-dark-blue-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Check for Shipped (with misspellings)
    if (cleanDisplayStatus === 'shipped' || 
        cleanDisplayStatus === 'shipd' || 
        cleanDisplayStatus === 'shiped' ||
        cleanDisplayStatus.includes('shipped')) {
      return (
        <Badge className="bg-dark-orange text-dark-orange-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Check for UNRECEIVED
    if (cleanDisplayStatus === 'unreceived' || 
        cleanDisplayStatus === 'unrcv' || 
        cleanDisplayStatus === 'unrec' ||
        cleanDisplayStatus.includes('unreceived')) {
      return (
        <Badge className="bg-light-yellow text-light-yellow-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Check for Invoiced (with misspellings)
    if (cleanDisplayStatus === 'invoiced' || 
        cleanDisplayStatus === 'invoiced' || 
        cleanDisplayStatus === 'invocied' || 
        cleanDisplayStatus === 'invoicd' ||
        cleanDisplayStatus.includes('invoiced')) {
      return (
        <Badge className="bg-dark-blue text-dark-blue-foreground">
          {displayStatus}
        </Badge>
      );
    }
    
    // Default variants for other statuses
    return (
      <Badge variant="outline">
        {displayStatus}
      </Badge>
    );
  };

  const getAgingColor = (aging: number) => {
    if (aging > 30) return 'text-destructive';
    if (aging > 14) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getCarPdfs = (carId: string) => {
    const stored = localStorage.getItem(`car_pdfs_${carId}`);
    const pdfs = stored ? JSON.parse(stored) : [];
    // Debug logging specifically for SN 1356
    if (carId.includes('1356')) {
      console.log(`DEBUG: Car ID for SN 1356: ${carId}`);
      console.log(`DEBUG: localStorage key: car_pdfs_${carId}`);
      console.log(`DEBUG: Raw stored data: ${stored}`);
      console.log(`DEBUG: Parsed PDFs: `, pdfs);
    }
    return pdfs;
  };

  const downloadPdf = (pdf: any) => {
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = pdf.name;
    link.click();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg lg:text-xl">{title}</CardTitle>
            <Badge variant="outline">{cars.length} cars</Badge>
          </div>
          <ReportGenerator cars={cars} tabName={title} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile View */}
        <div className="lg:hidden">
          {cars.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cars found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cars.map((car) => (
                <MobileCarCard
                  key={car.id}
                  car={car}
                  onViewDetails={setSelectedCar}
                  onSpecCodeClick={handleSpecCodeClick}
                  isKsaTab={isKsaTab}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name/Model</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Chassis No</TableHead>
                <TableHead>Color Ext.</TableHead>
                <TableHead>Color Int.</TableHead>
                <TableHead>Spec. Code</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>SP</TableHead>
                <TableHead>AMPI #</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => {
                // Debug logging for SN 1356 specifically
                if (car.sn === 1356) {
                  console.log(`DEBUG: Found car SN 1356 - Car object:`, car);
                  console.log(`DEBUG: Car ID: ${car.id}`);
                  
                  // Check all localStorage keys that contain "pdf"
                  console.log(`DEBUG: All localStorage keys containing 'pdf':`);
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes('pdf')) {
                      console.log(`  ${key}: ${localStorage.getItem(key)}`);
                    }
                  }
                }
                
                return (
                <TableRow key={car.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{car.sn}</TableCell>
                  <TableCell>{getStatusBadge(car.status, car, isKsaTab)}</TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{car.name}</div>
                      <div className="text-sm text-muted-foreground">{car.model || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{car.description || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.barCode || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{car.chassisNo || '-'}</TableCell>
                  <TableCell>{car.colourExt || '-'}</TableCell>
                  <TableCell>{car.colourInt || '-'}</TableCell>
                  <TableCell>
                    {car.specCode ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={() => handleSpecCodeClick(car.specCode)}
                      >
                        {car.specCode}
                        <Download className="h-3 w-3 ml-1" />
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{car.branch || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{car.customerDetails || '-'}</TableCell>
                  <TableCell>{car.sp || '-'}</TableCell>
                  <TableCell>{car.ampi || '-'}</TableCell>
                  <TableCell>{car.receivedDate || '-'}</TableCell>
                  <TableCell>{car.place || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {car.aging !== undefined && car.aging > 0 && (
                        <>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={getAgingColor(car.aging)}>
                            {car.aging}d
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCar(car)}
                        title="View/Edit details"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {getCarPdfs(car.id).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pdfs = getCarPdfs(car.id);
                            if (pdfs.length === 1) {
                              downloadPdf(pdfs[0]);
                            } else {
                              // For multiple PDFs, for now just download the first one
                              downloadPdf(pdfs[0]);
                            }
                          }}
                          title={`Download PDF${getCarPdfs(car.id).length > 1 ? 's' : ''}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
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