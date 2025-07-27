import * as ExcelJS from 'exceljs';
import { Car } from '@/types/car';
import { sortCarsWithPriority, isAvailable, isBooked } from '@/utils/carFilters';

class ExcelExportService {
  async exportCarsToExcel(cars: Car[], filename: string, sheetName: string): Promise<void> {
    // Apply the same sorting used in reports
    const sortedCars = sortCarsWithPriority(cars);
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Define columns with proper widths
    worksheet.columns = [
      { header: 'SN', key: 'sn', width: 8 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Bar Code', key: 'barCode', width: 15 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'Spec Code', key: 'specCode', width: 12 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Colour Ext', key: 'colourExt', width: 18 },
      { header: 'Colour Int', key: 'colourInt', width: 18 },
      { header: 'Chassis No', key: 'chassisNo', width: 20 },
      { header: 'Engine No', key: 'engineNo', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 15 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Place', key: 'place', width: 15 },
      { header: 'Customer Details', key: 'customerDetails', width: 25 },
      { header: 'SP', key: 'sp', width: 12 },
      { header: 'SD', key: 'sd', width: 12 },
      { header: 'Inv No', key: 'invNo', width: 15 },
      { header: 'AMPI', key: 'ampi', width: 12 },
      { header: 'Paper', key: 'paper', width: 12 },
      { header: 'Deal', key: 'deal', width: 12 },
      { header: 'Received Date', key: 'receivedDate', width: 15 },
      { header: 'Aging', key: 'aging', width: 8 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Add borders to header
    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows with the same sorting as reports
    sortedCars.forEach((car, index) => {
      const row = worksheet.addRow({
        sn: car.sn,
        status: car.status,
        name: car.name,
        barCode: car.barCode,
        model: car.model,
        specCode: car.specCode,
        description: car.description,
        colourExt: car.colourExt,
        colourInt: car.colourInt,
        chassisNo: car.chassisNo,
        engineNo: car.engineNo,
        supplier: car.supplier,
        branch: car.branch,
        place: car.place,
        customerDetails: car.customerDetails,
        sp: car.sp,
        sd: car.sd,
        invNo: car.invNo,
        ampi: car.ampi,
        paper: car.paper,
        deal: car.deal,
        receivedDate: car.receivedDate,
        aging: car.aging
      });

      // Add borders to data rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Color-code rows based on status using the same scheme as reports
      if (isAvailable(car.status)) {
        // Light green for Available (same as reports)
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E8' } // Light green
        };
      } else if (isBooked(car.status) || 
                 car.status?.toLowerCase() === 'unreceived' || 
                 car.status === 'UNRECEIVED' ||
                 car.status?.toLowerCase().includes('received adv') ||
                 car.status?.toLowerCase().includes('receved adv') ||
                 car.status?.toLowerCase().includes('received advance') ||
                 car.status?.toLowerCase().includes('recieved adv') ||
                 (car.status?.toLowerCase().includes('received') && car.status?.toLowerCase().includes('adv'))) {
        // Yellow for Booked/Unreceived (same as reports)
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' } // Light yellow
        };
      } else if (car.status?.toLowerCase().includes('sold') || 
                 car.status?.toLowerCase() === 'sol' || 
                 car.status?.toLowerCase() === 'sould') {
        // Red for Sold
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE6E6' } // Light red
        };
      } else if (car.status?.toLowerCase().includes('received') && 
                 car.status?.toLowerCase().includes('full')) {
        // Light blue for Received Full
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' } // Light blue
        };
      } else if (car.status?.toLowerCase().includes('invoiced') || 
                 car.status?.toLowerCase() === 'invocied' || 
                 car.status?.toLowerCase() === 'invoicd') {
        // Light purple for Invoiced
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0E6FF' } // Light purple
        };
      } else {
        // Light gray for other statuses
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' } // Light gray
        };
      }
    });

    // Auto-filter on all columns
    worksheet.autoFilter = {
      from: 'A1',
      to: worksheet.getCell(1, worksheet.columns.length).address
    };

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  generateFilename(tabName: string, filters?: any): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const hasFilters = filters && (
      filters.search || 
      filters.statuses?.length > 0 || 
      filters.models?.length > 0 ||
      filters.years?.length > 0 ||
      filters.branches?.length > 0 ||
      filters.colorsExt?.length > 0 ||
      filters.barcodes?.length > 0 ||
      filters.specCodes?.length > 0 ||
      filters.sp?.length > 0
    );
    
    const suffix = hasFilters ? '-filtered' : '';
    return `${tabName.toLowerCase()}-inventory${suffix}-${timestamp}.xlsx`;
  }
}

export const excelExportService = new ExcelExportService();