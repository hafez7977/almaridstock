import * as ExcelJS from 'exceljs';
import { Car } from '@/types/car';

class ExcelExportService {
  async exportCarsToExcel(cars: Car[], filename: string, sheetName: string): Promise<void> {
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

    // Add data rows
    cars.forEach((car, index) => {
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

      // Color-code rows based on status
      if (car.status === 'Available') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E8' }
        };
      } else if (car.status === 'Booked') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' }
        };
      } else if (car.status === 'Sold') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE6E6' }
        };
      } else if (car.status === 'UNRECEIVED') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
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