import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportGeneratorProps {
  cars: Car[];
  tabName: string;
}

export const ReportGenerator = ({ cars, tabName }: ReportGeneratorProps) => {
  const { toast } = useToast();

  const generateReport = () => {
    // Filter for available and booked cars only
    const availableAndBookedCars = cars.filter(car => {
      const cleanStatus = car.status.toLowerCase().trim();
      
      // Available cars
      const isAvailable = cleanStatus === 'available' || 
                         cleanStatus === 'availabe' || 
                         cleanStatus === 'availble' || 
                         cleanStatus === 'avaliable' ||
                         cleanStatus.includes('available');
      
      // Booked cars (including UNRECEIVED and RECEIVED ADV)
      const isBooked = cleanStatus === 'booked' || 
                      cleanStatus === 'bookd' || 
                      cleanStatus === 'booket' ||
                      cleanStatus.includes('booked') ||
                      car.status === 'UNRECEIVED' ||
                      cleanStatus.includes('received adv') ||
                      cleanStatus.includes('receved adv') ||
                      cleanStatus.includes('received advance') ||
                      cleanStatus.includes('recieved adv') ||
                      (cleanStatus.includes('received') && cleanStatus.includes('adv'));
      
      return isAvailable || isBooked;
    });

    if (availableAndBookedCars.length === 0) {
      toast({
        title: "No Data",
        description: "No available or booked cars found to export.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = [
      'SN', 'Status', 'Name', 'Model', 'Barcode', 'Chassis No', 'Spec Code',
      'Color Ext', 'Color Int', 'Branch', 'Customer', 'SP', 'AMPI #', 
      'Received Date', 'Location', 'Aging (Days)'
    ];

    const csvContent = [
      headers.join(','),
      ...availableAndBookedCars.map(car => [
        car.sn,
        `"${car.status}"`,
        `"${car.name || ''}"`,
        `"${car.model || ''}"`,
        `"${car.barCode || ''}"`,
        `"${car.chassisNo || ''}"`,
        `"${car.specCode || ''}"`,
        `"${car.colourExt || ''}"`,
        `"${car.colourInt || ''}"`,
        `"${car.branch || ''}"`,
        `"${car.customerDetails || ''}"`,
        `"${car.sp || ''}"`,
        `"${car.ampi || ''}"`,
        `"${car.receivedDate || ''}"`,
        `"${car.place || ''}"`,
        car.aging
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${tabName}_Available_Booked_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Generated",
      description: `Exported ${availableAndBookedCars.length} available and booked cars from ${tabName} tab.`
    });
  };

  return (
    <Button
      onClick={generateReport}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export Available & Booked ({tabName})
    </Button>
  );
};