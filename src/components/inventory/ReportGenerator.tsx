import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

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
      return 'FFFFFF99'; // Light yellow
    }
    
    // UNRECEIVED - Purple
    if (status === 'UNRECEIVED') {
      return 'FFDDA0DD'; // Plum purple
    }
    
    // Received ADV - Light orange
    if (cleanStatus.includes('received adv') ||
        cleanStatus.includes('receved adv') ||
        cleanStatus.includes('received advance') ||
        cleanStatus.includes('recieved adv') ||
        (cleanStatus.includes('received') && cleanStatus.includes('adv'))) {
      return 'FFFFE4B5'; // Light orange
    }
    
    return 'FFFFFFFF'; // White
  };

  const generateReport = async () => {
    console.log('Generating report for tab:', tabName);
    console.log('Total cars before filtering:', cars.length);
    // Filter for available and booked cars only
    const availableAndBookedCars = cars.filter(car => {
      const cleanStatus = car.status.toLowerCase().trim();
      const cleanPlace = (car.place || '').toLowerCase().trim();
      
      console.log(`Car ${car.sn}: status="${car.status}", place="${car.place}", cleanStatus="${cleanStatus}", cleanPlace="${cleanPlace}"`);
      
      // For KSA, ALWAYS exclude cars with incoming location regardless of case
      if (tabName === 'KSA' && cleanPlace.includes('incoming')) {
        console.log(`Excluding car ${car.sn} - incoming location (place: "${car.place}")`);
        return false;
      }
      
      // For KSA, exclude UNRECEIVED status
      if (tabName === 'KSA' && car.status === 'UNRECEIVED') {
        console.log(`Excluding car ${car.sn} - UNRECEIVED status`);
        return false;
      }
      
      // Available cars
      const isAvailable = cleanStatus === 'available' || 
                         cleanStatus === 'availabe' || 
                         cleanStatus === 'availble' || 
                         cleanStatus === 'avaliable' ||
                         cleanStatus.includes('available');
      
      // Booked cars (including RECEIVED ADV)
      const isBooked = cleanStatus === 'booked' || 
                      cleanStatus === 'bookd' || 
                      cleanStatus === 'booket' ||
                      cleanStatus.includes('booked') ||
                      cleanStatus.includes('received adv') ||
                      cleanStatus.includes('receved adv') ||
                      cleanStatus.includes('received advance') ||
                      cleanStatus.includes('recieved adv') ||
                      (cleanStatus.includes('received') && cleanStatus.includes('adv'));
      
      // For Stock, include UNRECEIVED in booked category
      if (tabName === 'Stock' && car.status === 'UNRECEIVED') {
        console.log(`Including car ${car.sn} - Stock tab UNRECEIVED`);
        return true;
      }
      
      const shouldInclude = isAvailable || isBooked;
      console.log(`Car ${car.sn}: isAvailable=${isAvailable}, isBooked=${isBooked}, shouldInclude=${shouldInclude}`);
      
      return shouldInclude;
    });

    console.log('Cars after filtering:', availableAndBookedCars.length);

    if (availableAndBookedCars.length === 0) {
      toast({
        title: "No Data",
        description: "No available or booked cars found to export.",
        variant: "destructive"
      });
      return;
    }

    // Sort cars: First by description, then by status (Booked first, then Available) within each description group
    const sortedCars = [...availableAndBookedCars].sort((a, b) => {
      // First, group by description (case-insensitive)
      const aDescription = (a.description || '').toLowerCase().trim();
      const bDescription = (b.description || '').toLowerCase().trim();
      
      if (aDescription !== bDescription) {
        return aDescription.localeCompare(bDescription);
      }
      
      // Within same description group, sort by status (booked first)
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

    // Create new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${tabName} Report`);

    // Define headers (removed SN column)
    const headers = [
      '#', 'Status', 'Name', 'Model', 'Description', 'Barcode', 'Chassis No', 'Spec Code',
      'Color Ext', 'Color Int', 'Branch', 'Customer', 'SP', 'AMPI #', 
      'Received Date', 'Location', 'Aging (Days)'
    ];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    
    // Style header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      cell.font = { bold: true, color: { argb: 'FF000000' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add data rows with status-based coloring
    sortedCars.forEach((car, index) => {
      const rowData = [
        index + 1, // Sequential numbering
        car.status,
        car.name || '',
        car.model || '',
        car.description || '',
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
      ];

      const dataRow = worksheet.addRow(rowData);
      dataRow.height = 20;
      
      // Get status color for this row
      const statusColor = getStatusColor(car.status);
      
      // Apply color and border to each cell in the row
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: statusColor }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Auto-fit column widths
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length;
      
      // Check each row for the longest content in this column
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const cell = row.getCell(index + 1);
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        }
      });
      
      // Special handling for barcode column (index 5, after adding description)
      if (index === 5) { // Barcode column
        column.width = Math.max(maxLength + 3, 15); // Ensure minimum 15 width for barcodes
      } else {
        // Set column width with some padding for other columns
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `${tabName}_Available_Booked_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Check if running on mobile device
    if (Capacitor.isNativePlatform()) {
      try {
        // Convert buffer to base64 for mobile file system
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        
        // Save file to Documents directory on mobile
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        toast({
          title: "Report Saved",
          description: `Report saved to Documents folder: ${fileName}`
        });
      } catch (error) {
        console.error('Error saving file on mobile:', error);
        toast({
          title: "Save Failed",
          description: "Could not save file to device storage",
          variant: "destructive"
        });
      }
    } else {
      // Web browser download
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Generated",
        description: `Exported ${sortedCars.length} available and booked cars from ${tabName} tab with colored rows.`
      });
    }

  };

  return (
    <Button
      onClick={generateReport}
      variant="outline"
      size="sm"
      className="gap-1 px-2 sm:px-3 text-xs sm:text-sm w-full sm:w-auto"
    >
      <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      <span className="truncate">
        <span className="hidden sm:inline">Export Available & Booked ({tabName})</span>
        <span className="sm:hidden">Export A&B ({tabName})</span>
      </span>
    </Button>
  );
};