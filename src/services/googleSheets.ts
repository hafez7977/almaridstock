import { Car, LogEntry } from '@/types/car';
import { googleAuthService } from './googleAuth';

class GoogleSheetsService {
  private readonly baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  private async makeRequest(url: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    console.log('Making request to:', url);
    
    const token = await googleAuthService.getValidAccessToken();
    
    if (!token) {
      console.error('No valid access token available');
      throw new Error('No access token available. Please sign in again.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('Response status:', response.status, response.statusText);

    if (response.status === 401) {
      console.log('Got 401 - authentication failed');
      let errorMessage = 'Authentication failed. Please sign in again.';
      try {
        const error = await response.json();
        errorMessage = `Google Sheets API error: ${error.error?.message || 'Invalid credentials'}`;
        console.error('API Error details:', error);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = `Google Sheets API error: ${error.error?.message || response.statusText}`;
        console.error('API Error details:', error);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async readSheet(spreadsheetId: string, range: string): Promise<any[][]> {
    const cleanSpreadsheetId = spreadsheetId.replace(/\/$/, ''); // Remove trailing slash
    const url = `${this.baseUrl}/${cleanSpreadsheetId}/values/${range}`;
    const response = await this.makeRequest(url);
    return response.values || [];
  }

  async writeSheet(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const cleanSpreadsheetId = spreadsheetId.replace(/\/$/, ''); // Remove trailing slash
    const url = `${this.baseUrl}/${cleanSpreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    await this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify({
        values,
      }),
    });
  }

  async appendSheet(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const cleanSpreadsheetId = spreadsheetId.replace(/\/$/, ''); // Remove trailing slash
    const url = `${this.baseUrl}/${cleanSpreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        values,
      }),
    });
  }

  async createSheet(spreadsheetId: string, title: string): Promise<void> {
    const cleanSpreadsheetId = spreadsheetId.replace(/\/$/, ''); // Remove trailing slash
    const url = `${this.baseUrl}/${cleanSpreadsheetId}:batchUpdate`;
    await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title,
              },
            },
          },
        ],
      }),
    });
  }

  
  // Parse KSA data with special handling for its unique structure
  parseKSAData(rows: any[][]): Car[] {
    if (!rows || rows.length < 2) return [];

    console.log('Parsing KSA data, total rows:', rows.length);
    console.log('First few rows:', rows.slice(0, 5));

    const cars: Car[] = [];
    let carCounter = 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }

      // Skip reference rows (like "CMA-KSA-50-MAR-24")
      if (row.length === 1 && row[0] && typeof row[0] === 'string' && row[0].includes('-')) {
        continue;
      }

      // Skip header rows (containing "STATUS" and other headers)
      if (row[0] === 'STATUS' || (row.includes('STATUS') && row.includes('MODEL'))) {
        continue;
      }

      // This should be a data row
      if (row.length >= 5 && row[0] && row[0] !== '') {
        // Check if location contains "incoming" (case insensitive with misspelling tolerance)
        const location = (row[13] || '').toLowerCase().trim();
        const isIncomingLocation = location.includes('incoming') || 
                                 location.includes('incomming') || 
                                 location.includes('incomig') || 
                                 location.includes('incomming') ||
                                 location === 'incoming';
        
        const car: any = {
          id: `ksa_${carCounter}`,
          sn: carCounter++,
          status: isIncomingLocation ? 'UNRECEIVED' : (row[0] || 'Available'),
          name: row[1] || '',
          barCode: row[2] || '',
          model: row[3] || '',
          specCode: row[5] || '', // Usually at index 5 in KSA data
          description: row[6] || '',
          colourExt: row[7] || '',
          colourInt: row[8] || '',
          chassisNo: row[9] || '',
          engineNo: row[10] || '',
          supplier: row[11] || '',
          branch: row[12] || '',
          place: row[13] || '',
          customerDetails: row[14] || '',
          sp: row[15] || '',
          sd: row[16] || '',
          invNo: row[17] || '',
          ampi: row[18] || '',
          paper: row[19] || '',
          deal: row[20] || '',
          receivedDate: row[21] || '',
          aging: parseInt(row[22]) || 0
        };

        // Only add cars with meaningful data
        if (car.status && car.status !== 'STATUS') {
          cars.push(car as Car);
          console.log(`Added KSA car ${carCounter - 1}:`, car);
        }
      }
    }

    console.log(`Parsed ${cars.length} cars from KSA data`);
    return cars;
  }

  // Convert Google Sheets rows to Car objects
  parseCarData(rows: any[][]): Car[] {
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log('Headers from Google Sheets:', headers);
    console.log('First data row:', dataRows[0]);
    
    // Show all headers with their indexes for debugging
    headers.forEach((header, index) => {
      console.log(`Header ${index}: "${header}" (lowercase: "${header.toLowerCase()}")`);
    });

    return dataRows
      .filter((row, index) => {
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.trim() === '')) {
          return false;
        }
        return true;
      })
      .map((row, index) => {
        const car: any = { id: `sheet_${index}` };
        
        // Only log first row for debugging
        if (index === 0) {
          console.log(`Processing first row:`, row);
        }
      
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || '';
          const headerLower = header.toLowerCase().trim();
          
          // Debug: show all header processing for first row
          if (index === 0) {
            console.log(`  Column ${colIndex}: header="${header}" -> value="${value}"`);
          }
          
          // More flexible column matching using includes() for better compatibility
          if (headerLower.includes('sn') || headerLower.includes('serial')) {
            // Use row number if SN is empty or invalid, starting from 1
            car.sn = parseInt(value) || (index + 1);
          } else if (headerLower.includes('status')) {
            car.status = value || 'Available';
          } else if (headerLower.includes('name')) {
            car.name = value;
          } else if (headerLower.includes('barcode') || headerLower.includes('bar code')) {
            car.barCode = value;
          } else if (headerLower.includes('model')) {
            car.model = value;
          } else if (headerLower.includes('spec') && headerLower.includes('code')) {
            car.specCode = value;
          } else if (headerLower.includes('description') || headerLower.includes('desc') || 
                     headerLower.includes('details') || headerLower.includes('specs') || 
                     headerLower.includes('specification') || headerLower.includes('info') || 
                     headerLower.includes('notes') || headerLower.includes('comment') || 
                     headerLower.includes('remarks')) {
            car.description = value;
          } else if ((headerLower.includes('colour') || headerLower.includes('color')) && 
                     (headerLower.includes('ext') || headerLower.includes('exterior') || headerLower.includes('external'))) {
            car.colourExt = value;
            console.log('Found colourExt:', value, 'from header:', header);
          } else if ((headerLower.includes('colour') || headerLower.includes('color')) && 
                     (headerLower.includes('int') || headerLower.includes('interior') || headerLower.includes('internal'))) {
            car.colourInt = value;
            console.log('Found colourInt:', value, 'from header:', header);
          } else if (headerLower.includes('chassis')) {
            car.chassisNo = value;
          } else if (headerLower.includes('engine')) {
            car.engineNo = value;
          } else if (headerLower.includes('supplier')) {
            car.supplier = value;
          } else if (headerLower.includes('branch')) {
            car.branch = value;
          } else if (headerLower.includes('place') || headerLower.includes('location')) {
            car.place = value;
          } else if (headerLower.includes('customer')) {
            car.customerDetails = value;
          } else if (headerLower === 'sp') {
            car.sp = value;
          } else if (headerLower === 'sd' || headerLower === 's/d') {
            car.sd = value;
          } else if (headerLower.includes('inv') && (headerLower.includes('no') || headerLower.includes('#'))) {
            car.invNo = value;
          } else if (headerLower.includes('ampi')) {
            car.ampi = value;
          } else if (headerLower.includes('paper')) {
            car.paper = value;
          } else if (headerLower.includes('deal')) {
            car.deal = value;
          } else if (headerLower.includes('receiv') && headerLower.includes('date')) {
            car.receivedDate = value;
          } else if (headerLower.includes('aging')) {
            car.aging = parseInt(value) || 0;
          }
        });

        // Debug: show final car object for first row
        if (index === 0) {
          console.log('Final car object for first row:', car);
        }

        return car as Car;
      });
  }

  // Convert Car objects to Google Sheets rows
  carToRows(cars: Car[]): any[][] {
    if (!cars.length) return [];

    const headers = [
      'SN', 'Status', 'Name', 'Bar Code', 'Model', 'Spec Code', 'Description',
      'Colour Ext', 'Colour Int', 'Chassis No', 'Engine No', 'Supplier',
      'Branch', 'Place', 'Customer Details', 'SP', 'SD', 'Inv No', 'AMPI',
      'Paper', 'Deal', 'Received Date', 'Aging'
    ];

    const rows = cars.map(car => [
      car.sn, car.status, car.name, car.barCode, car.model, car.specCode,
      car.description, car.colourExt, car.colourInt, car.chassisNo, car.engineNo,
      car.supplier, car.branch, car.place, car.customerDetails, car.sp, car.sd,
      car.invNo, car.ampi, car.paper, car.deal, car.receivedDate, car.aging
    ]);

    return [headers, ...rows];
  }

  // Parse log entries from Google Sheets
  parseLogData(rows: any[][]): LogEntry[] {
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map((row, index) => {
      const log: any = { id: `log_${index}` };
      
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || '';
        
        switch (header.toLowerCase()) {
          case 'timestamp':
            log.timestamp = value;
            break;
          case 'sn':
            log.sn = parseInt(value) || 0;
            break;
          case 'oldstatus':
          case 'old status':
            log.oldStatus = value;
            break;
          case 'newstatus':
          case 'new status':
            log.newStatus = value;
            break;
          case 'changedby':
          case 'changed by':
            log.changedBy = value;
            break;
        }
      });

      return log as LogEntry;
    });
  }

  // Convert log entries to Google Sheets rows
  logToRows(logs: LogEntry[]): any[][] {
    if (!logs.length) return [];

    const headers = ['Timestamp', 'SN', 'Old Status', 'New Status', 'Changed By'];
    const rows = logs.map(log => [
      log.timestamp, log.sn, log.oldStatus, log.newStatus, log.changedBy
    ]);

    return [headers, ...rows];
  }

  // Create a new log entry
  async addLogEntry(spreadsheetId: string, logEntry: LogEntry): Promise<void> {
    const cleanSpreadsheetId = spreadsheetId.replace(/\/$/, ''); // Remove trailing slash
    const logRows = this.logToRows([logEntry]);
    // Skip header row when appending
    await this.appendSheet(cleanSpreadsheetId, 'Logs!A:E', logRows.slice(1));
  }
}

export const googleSheetsService = new GoogleSheetsService();