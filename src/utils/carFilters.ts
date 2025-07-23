import { Car } from "@/types/car";

export interface MultiFilters {
  search: string;
  statuses: string[];
  models: string[]; // This will now be car names
  years: string[];  // This will be the model/year data
  branches: string[];
  colorsExt: string[];
  barcodes: string[];
  specCodes: string[];
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
    
    // Status filter with normalization
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.some(selectedStatus => {
      switch (selectedStatus) {
        case 'Available':
          return isAvailable(car.status);
        case 'Booked':
          return isBooked(car.status);
        case 'Sold':
          return car.status?.toLowerCase().includes('sold') || 
                 car.status?.toLowerCase() === 'sol' || 
                 car.status?.toLowerCase() === 'sould';
        case 'Received Full':
          return car.status?.toLowerCase().includes('received') && 
                 car.status?.toLowerCase().includes('full');
        case 'Received ADV':
          return car.status?.toLowerCase().includes('received') && 
                 car.status?.toLowerCase().includes('adv');
        case 'Invoiced':
          return car.status?.toLowerCase().includes('invoiced') || 
                 car.status?.toLowerCase() === 'invocied' || 
                 car.status?.toLowerCase() === 'invoicd';
        default:
          return car.status === selectedStatus;
      }
    });
    
    // Other filters - models now filters by car names, years filters by model data
    const matchesModel = filters.models.length === 0 || filters.models.includes(car.name || '');
    const matchesYear = filters.years.length === 0 || filters.years.includes(car.model || '');
    const matchesBranch = filters.branches.length === 0 || filters.branches.includes(car.branch || '');
    const matchesColor = filters.colorsExt.length === 0 || filters.colorsExt.includes(car.colourExt || '');
    const matchesBarcode = filters.barcodes.length === 0 || filters.barcodes.includes(car.barCode || '');
    const matchesSpecCode = filters.specCodes.length === 0 || filters.specCodes.includes(car.specCode || '');
    
    return matchesSearch && matchesStatus && matchesModel && matchesYear && matchesBranch && matchesColor && matchesBarcode && matchesSpecCode;
  });
};

export const sortCarsWithPriority = (cars: Car[]): Car[] => {
  return [...cars].sort((a, b) => {
    const aPriority = getStatusPriority(a.status);
    const bPriority = getStatusPriority(b.status);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Within Available cars (priority 1), put Toyota at the end
    if (aPriority === 1) {
      const aIsToyota = a.name?.toLowerCase().includes('toyota') || false;
      const bIsToyota = b.name?.toLowerCase().includes('toyota') || false;
      
      if (aIsToyota && !bIsToyota) return 1;  // Toyota goes after non-Toyota
      if (!aIsToyota && bIsToyota) return -1; // Non-Toyota goes before Toyota
    }
    
    // Sort by name first (group same names together)
    const aName = a.name?.toLowerCase() || '';
    const bName = b.name?.toLowerCase() || '';
    if (aName !== bName) {
      return aName.localeCompare(bName);
    }
    
    // Within same name, sort by model (year) - higher first
    const aModel = a.model?.toLowerCase() || '';
    const bModel = b.model?.toLowerCase() || '';
    if (aModel !== bModel) {
      return bModel.localeCompare(aModel); // Reversed to get higher model first
    }
    
    // If same name and model, sort by SN
    return (a.sn || 0) - (b.sn || 0);
  });
};

export const getAvailableCars = (cars: Car[]): Car[] => {
  return cars.filter(car => isAvailable(car.status));
};

export const getBookedCars = (cars: Car[]): Car[] => {
  return cars.filter(car => isBooked(car.status));
};