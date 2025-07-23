export interface Car {
  id: string;
  sn: number;
  status: 'Available' | 'Booked' | 'Sold' | 'UNRECEIVED';
  name: string;
  barCode: string;
  model: string;
  specCode: string;
  description: string;
  colourExt: string;
  colourInt: string;
  chassisNo: string;
  engineNo: string;
  supplier: string;
  branch: string;
  place: string;
  customerDetails: string;
  sp: string;
  sd: string;
  invNo: string;
  ampi: string;
  paper: string;
  deal: string;
  receivedDate: string;
  aging: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  sn: number;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

export type Tab = 'Stock' | 'Incoming' | 'KSA';