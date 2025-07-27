import { Car } from "@/types/car";

export interface MultiFilters {
  search: string;
  statuses: string[];
  models: string[]; // This will now be car names
  barcodes: string[];
  descriptions: string[];
  years: string[];  // This will be the model/year data
  colorsExt: string[];
  colorsInt: string[]; // Interior colors
  specCodes: string[];
  branches: string[];
  sp: string[];
  deals: string[]; // Deal codes
}

// Helper functions to check status types with misspelling tolerance
export const isAvailable = (status: string): boolean => {
  if (!status) return false;
  const cleanStatus = status.toLowerCase().trim();
  
  // Handle exact matches and common typos
  const availableVariants = [
    'available',
    'availabe', 
    'availble', 
    'avaliable',
    'availabel',
    'avalable',
    'avaible',
    'aviable',
    'avialable'
  ];
  
  return availableVariants.some(variant => cleanStatus === variant) ||
         cleanStatus.includes('available') ||
         cleanStatus.includes('availab');
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
  if (isBooked(status) || 
      status?.toLowerCase() === 'unreceived' || 
      status === 'UNRECEIVED' ||
      status?.toLowerCase().includes('received adv') ||
      status?.toLowerCase().includes('receved adv') ||
      status?.toLowerCase().includes('received advance') ||
      status?.toLowerCase().includes('recieved adv') ||
      (status?.toLowerCase().includes('received') && status?.toLowerCase().includes('adv'))) return 2;
  return 3; // Everything else
};

export const filterCars = (cars: Car[], filters: MultiFilters): Car[] => {
  return cars.filter(car => {
    // Search filter
    const matchesSearch = !filters.search || 
      car.chassisNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      car.barCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
      car.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      car.specCode?.toLowerCase().includes(filters.search.toLowerCase());
    
    // Status filter with normalization
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.some(selectedStatus => {
      switch (selectedStatus) {
        case 'Available':
          return isAvailable(car.status);
        case 'Booked':
          return isBooked(car.status) || 
                 car.status?.toLowerCase() === 'unreceived' || 
                 car.status === 'UNRECEIVED' ||
                 car.status?.toLowerCase().includes('received adv') ||
                 car.status?.toLowerCase().includes('receved adv') ||
                 car.status?.toLowerCase().includes('received advance') ||
                 car.status?.toLowerCase().includes('recieved adv') ||
                 (car.status?.toLowerCase().includes('received') && car.status?.toLowerCase().includes('adv'));
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
    
    // All filter checks in the new order: status, name, barcode, description, year, color, interior, spec code, branch, sp, deal
    const matchesModel = filters.models.length === 0 || filters.models.includes(car.name || '');
    const matchesBarcode = filters.barcodes.length === 0 || filters.barcodes.includes(car.barCode || '');
    const matchesDescription = filters.descriptions.length === 0 || filters.descriptions.includes(car.description || '');
    const matchesYear = filters.years.length === 0 || filters.years.includes(car.model || '');
    const matchesColor = filters.colorsExt.length === 0 || filters.colorsExt.includes(car.colourExt || '');
    const matchesInterior = filters.colorsInt.length === 0 || filters.colorsInt.includes(car.colourInt || '');
    const matchesSpecCode = filters.specCodes.length === 0 || filters.specCodes.includes(car.specCode || '');
    const matchesBranch = filters.branches.length === 0 || filters.branches.includes(car.branch || '');
    const matchesSP = filters.sp.length === 0 || filters.sp.includes(car.sp || '');
    const matchesDeal = filters.deals.length === 0 || filters.deals.includes(car.deal || '');
    
    return matchesSearch && matchesStatus && matchesModel && matchesBarcode && matchesDescription && 
           matchesYear && matchesColor && matchesInterior && matchesSpecCode && matchesBranch && 
           matchesSP && matchesDeal;
  });
};

export const sortCarsWithPriority = (cars: Car[], tabType?: string): Car[] => {
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