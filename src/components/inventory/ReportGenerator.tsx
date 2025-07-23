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

  const getStatusColor = (status: string): string => {
    const cleanStatus = status.toLowerCase().trim();
    
    // Available - Light Green
    if (cleanStatus === 'available' || 
        cleanStatus === 'availabe' || 
        cleanStatus === 'availble' || 
        cleanStatus === 'avaliable' ||
        cleanStatus.includes('available')) {
      return '#dcfce7'; // Light green background
    }
    
    // Booked - Yellow
    if (cleanStatus === 'booked' || 
        cleanStatus === 'bookd' || 
        cleanStatus === 'booket' ||
        cleanStatus.includes('booked')) {
      return '#fef3c7'; // Light yellow background
    }
    
    // UNRECEIVED - Purple
    if (status === 'UNRECEIVED') {
      return '#e9d5ff'; // Light purple background
    }
    
    // Received ADV - Light yellow
    if (cleanStatus.includes('received adv') ||
        cleanStatus.includes('receved adv') ||
        cleanStatus.includes('received advance') ||
        cleanStatus.includes('recieved adv') ||
        (cleanStatus.includes('received') && cleanStatus.includes('adv'))) {
      return '#fef3c7'; // Light yellow background
    }
    
    return '#f3f4f6'; // Default gray
  };

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
      
      // Booked cars (including RECEIVED ADV, but exclude UNRECEIVED for KSA)
      const isBooked = cleanStatus === 'booked' || 
                      cleanStatus === 'bookd' || 
                      cleanStatus === 'booket' ||
                      cleanStatus.includes('booked') ||
                      cleanStatus.includes('received adv') ||
                      cleanStatus.includes('receved adv') ||
                      cleanStatus.includes('received advance') ||
                      cleanStatus.includes('recieved adv') ||
                      (cleanStatus.includes('received') && cleanStatus.includes('adv'));
      
      // For KSA, exclude UNRECEIVED status
      if (tabName === 'KSA' && car.status === 'UNRECEIVED') {
        return false;
      }
      
      // For Stock, include UNRECEIVED in booked category
      if (tabName === 'Stock' && car.status === 'UNRECEIVED') {
        return true;
      }
      
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

    // Sort cars: Booked first, then Available
    const sortedCars = [...availableAndBookedCars].sort((a, b) => {
      const aStatus = a.status.toLowerCase().trim();
      const bStatus = b.status.toLowerCase().trim();
      
      const aIsBooked = aStatus === 'booked' || aStatus.includes('booked') || 
                       aStatus.includes('received adv') || a.status === 'UNRECEIVED';
      const bIsBooked = bStatus === 'booked' || bStatus.includes('booked') || 
                       bStatus.includes('received adv') || b.status === 'UNRECEIVED';
      
      if (aIsBooked && !bIsBooked) return -1;
      if (!aIsBooked && bIsBooked) return 1;
      
      return 0;
    });

    // Create HTML content with styled table
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tabName} Available & Booked Cars Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .date { text-align: center; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${tabName} Available & Booked Cars Report</h1>
          <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>SN</th>
                <th>Status</th>
                <th>Name</th>
                <th>Model</th>
                <th>Barcode</th>
                <th>Chassis No</th>
                <th>Spec Code</th>
                <th>Color Ext</th>
                <th>Color Int</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>SP</th>
                <th>AMPI #</th>
                <th>Received Date</th>
                <th>Location</th>
                <th>Aging (Days)</th>
              </tr>
            </thead>
            <tbody>
              ${sortedCars.map(car => `
                <tr style="background-color: ${getStatusColor(car.status)};">
                  <td>${car.sn}</td>
                  <td><strong>${car.status}</strong></td>
                  <td>${car.name || '-'}</td>
                  <td>${car.model || '-'}</td>
                  <td>${car.barCode || '-'}</td>
                  <td>${car.chassisNo || '-'}</td>
                  <td>${car.specCode || '-'}</td>
                  <td>${car.colourExt || '-'}</td>
                  <td>${car.colourInt || '-'}</td>
                  <td>${car.branch || '-'}</td>
                  <td>${car.customerDetails || '-'}</td>
                  <td>${car.sp || '-'}</td>
                  <td>${car.ampi || '-'}</td>
                  <td>${car.receivedDate || '-'}</td>
                  <td>${car.place || '-'}</td>
                  <td>${car.aging}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: center; color: #666;">
            Total Cars: ${sortedCars.length}
          </div>
        </body>
      </html>
    `;

    // Create and download file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${tabName}_Available_Booked_Report_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Generated",
      description: `Exported ${sortedCars.length} available and booked cars from ${tabName} tab.`
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