import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

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
      return 'FF90EE90'; // Light green
    }
    
    // Booked - Yellow
    if (cleanStatus === 'booked' || 
        cleanStatus === 'bookd' || 
        cleanStatus === 'booket' ||
        cleanStatus.includes('booked')) {
      return 'FFFFFF00'; // Yellow
    }
    
    // UNRECEIVED - Purple
    if (status === 'UNRECEIVED') {
      return 'FFE6E6FA'; // Light purple
    }
    
    // Received ADV - Light yellow
    if (cleanStatus.includes('received adv') ||
        cleanStatus.includes('receved adv') ||
        cleanStatus.includes('received advance') ||
        cleanStatus.includes('recieved adv') ||
        (cleanStatus.includes('received') && cleanStatus.includes('adv'))) {
      return 'FFFFFFE0'; // Light yellow
    }
    
    return 'FFFFFFFF'; // White
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

    // Create worksheet data
    const headers = [
      'SN', 'Status', 'Name', 'Model', 'Barcode', 'Chassis No', 'Spec Code',
      'Color Ext', 'Color Int', 'Branch', 'Customer', 'SP', 'AMPI #', 
      'Received Date', 'Location', 'Aging (Days)'
    ];

    const data = [
      headers,
      ...sortedCars.map(car => [
        car.sn,
        car.status,
        car.name || '',
        car.model || '',
        car.barCode || '',
        car.chassisNo || '',
        car.specCode || '',
        car.colourExt || '',
        car.colourInt || '',
        car.branch || '',
        car.customerDetails || '',
        car.sp || '',
        car.ampi || '',
        car.receivedDate || '',
        car.place || '',
        car.aging
      ])
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Apply styling
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        fill: { fgColor: { rgb: 'FFD3D3D3' } }, // Light gray
        font: { bold: true },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }

    // Style data rows with status colors
    for (let row = 1; row <= sortedCars.length; row++) {
      const car = sortedCars[row - 1];
      const statusColor = getStatusColor(car.status);
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          fill: { fgColor: { rgb: statusColor } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }

    // Set column widths
    ws['!cols'] = [
      { width: 8 },   // SN
      { width: 12 },  // Status
      { width: 20 },  // Name
      { width: 15 },  // Model
      { width: 15 },  // Barcode
      { width: 20 },  // Chassis No
      { width: 12 },  // Spec Code
      { width: 12 },  // Color Ext
      { width: 12 },  // Color Int
      { width: 12 },  // Branch
      { width: 20 },  // Customer
      { width: 10 },  // SP
      { width: 12 },  // AMPI #
      { width: 15 },  // Received Date
      { width: 15 },  // Location
      { width: 12 }   // Aging
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `${tabName} Report`);

    // Generate Excel file and download
    const fileName = `${tabName}_Available_Booked_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

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