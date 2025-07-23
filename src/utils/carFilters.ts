import { Car } from "@/types/car";

export interface MultiFilters {
  search: string;
  statuses: string[];
  models: string[];
  branches: string[];
  colorsExt: string[];
  barcodes: string[];
}

// Helper functions to check status types with misspelling tolerance
export const isAvailable = (status: string): boolean => {
  if (!status) return false;
  const cleanStatus = status.toLowerCase().trim();
  return cleanStatus === 'available' || 
         cleanStatus === 'availabe' || 
         cleanStatus === 'availble' || 
         cleanStatus === 'avaliable' ||
         cleanStatus.includes('available');
};

export const isBooked = (status: string): boolean => {
  if (!status) return false;
  const cleanStatus = status.toLowerCase().trim();
  return cleanStatus === 'booked' || 
         cleanStatus === 'bookd' || 
         cleanStatus === 'booket' ||
         cleanStatus.includes('booked');
};

export const getStatusPriority = (status: string): number => {
  if (isAvailable(status)) return 1;
  if (isBooked(status)) return 2;
  return 3; // Everything else
};

export const filterCars = (cars: Car[], filters: MultiFilters): Car[] => {
  return cars.filter(car => {
    // Search filter
    const matchesSearch = !filters.search || 
      car.chassisNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      car.barCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
      car.name?.toLowerCase().includes(filters.search.toLowerCase());
    
    // Multi-select filters
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(car.status);
    const matchesModel = filters.models.length === 0 || filters.models.includes(car.model || '');
    const matchesBranch = filters.branches.length === 0 || filters.branches.includes(car.branch || '');
    const matchesColor = filters.colorsExt.length === 0 || filters.colorsExt.includes(car.colourExt || '');
    const matchesBarcode = filters.barcodes.length === 0 || filters.barcodes.includes(car.barCode || '');
    
    return matchesSearch && matchesStatus && matchesModel && matchesBranch && matchesColor && matchesBarcode;
  });
};

export const sortCarsWithPriority = (cars: Car[]): Car[] => {
  return [...cars].sort((a, b) => {
    const aPriority = getStatusPriority(a.status);
    const bPriority = getStatusPriority(b.status);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort by SN
    return (a.sn || 0) - (b.sn || 0);
  });
};

export const getAvailableCars = (cars: Car[]): Car[] => {
  return cars.filter(car => isAvailable(car.status));
};

export const getBookedCars = (cars: Car[]): Car[] => {
  return cars.filter(car => isBooked(car.status));
};