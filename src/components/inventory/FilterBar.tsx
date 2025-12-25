import { useState, useMemo } from "react";
import { Car } from "@/types/car";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { MultiFilters, isAvailable, isBooked } from "@/utils/carFilters";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  cars: Car[];
  onFilterChange: (filters: MultiFilters) => void;
}

export const FilterBar = ({ cars, onFilterChange }: FilterBarProps) => {
  console.log('FilterBar rendered with cars:', cars);
  console.log('FilterBar cars type:', typeof cars, 'isArray:', Array.isArray(cars));
  
  const [filters, setFilters] = useState<MultiFilters>({
    search: '',
    statuses: [],
    models: [], // Will contain car names
    barcodes: [],
    descriptions: [],
    years: [],  // Will contain model/year data
    colorsExt: [],
    colorsInt: [], // Interior colors
    specCodes: [],
    branches: [],
    sp: [],
    deals: [], // Deal codes
    locations: [], // Location/place filter
    customers: [] // Customer filter
  });

  // Helper function to apply filters to get the current filtered dataset
  const getFilteredCars = (currentFilters: MultiFilters, safeCars: Car[]): Car[] => {
    return safeCars.filter(car => {
      // Search filter
      const matchesSearch = !currentFilters.search || 
        car.chassisNo?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        car.barCode?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        car.name?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        car.specCode?.toLowerCase().includes(currentFilters.search.toLowerCase());
      
      // Status filter with normalization
      const matchesStatus = currentFilters.statuses.length === 0 || currentFilters.statuses.some(selectedStatus => {
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
      
      // All other filter checks
      const matchesModel = currentFilters.models.length === 0 || currentFilters.models.includes(car.name || '');
      const matchesBarcode = currentFilters.barcodes.length === 0 || currentFilters.barcodes.includes(car.barCode || '');
      const matchesDescription = currentFilters.descriptions.length === 0 || currentFilters.descriptions.includes(car.description || '');
      const matchesYear = currentFilters.years.length === 0 || currentFilters.years.includes(car.model || '');
      const matchesColor = currentFilters.colorsExt.length === 0 || currentFilters.colorsExt.includes(car.colourExt || '');
      const matchesInterior = currentFilters.colorsInt.length === 0 || currentFilters.colorsInt.includes(car.colourInt || '');
      const matchesSpecCode = currentFilters.specCodes.length === 0 || currentFilters.specCodes.includes(car.specCode || '');
      const matchesBranch = currentFilters.branches.length === 0 || currentFilters.branches.includes(car.branch || '');
      const matchesSP = currentFilters.sp.length === 0 || currentFilters.sp.includes(car.sp || '');
      const matchesDeal = currentFilters.deals.length === 0 || currentFilters.deals.includes(car.deal || '');
      const matchesLocation = currentFilters.locations.length === 0 || currentFilters.locations.includes(car.place || '');
      const matchesCustomer = currentFilters.customers.length === 0 || currentFilters.customers.includes(car.customerDetails || '');
      
      return matchesSearch && matchesStatus && matchesModel && matchesBarcode && matchesDescription && 
             matchesYear && matchesColor && matchesInterior && matchesSpecCode && matchesBranch && 
             matchesSP && matchesDeal && matchesLocation && matchesCustomer;
    });
  };

  // Extract unique values from filtered cars data (Excel-like cascading filters)
  const uniqueValues = useMemo(() => {
    console.log('Computing uniqueValues with cars:', cars);
    
    // Ensure cars is a valid array
    const safeCars = Array.isArray(cars) ? cars : [];
    console.log('SafeCars:', safeCars.length, 'items');
    
    // Normalize statuses - group variations under standard names
    const normalizeStatus = (status: string): string => {
      if (!status) return status;
      
      if (isAvailable(status)) return 'Available';
      if (isBooked(status)) return 'Booked';
      
      // For other statuses, check common patterns
      const cleanStatus = status.toLowerCase().trim();
      
      if (cleanStatus.includes('sold') || cleanStatus === 'sol' || cleanStatus === 'sould') {
        return 'Sold';
      }
      if (cleanStatus.includes('received') && cleanStatus.includes('full')) {
        return 'Received Full';
      }
      if (cleanStatus.includes('received') && cleanStatus.includes('adv')) {
        return 'Received ADV';
      }
      if (cleanStatus.includes('invoiced') || cleanStatus === 'invocied' || cleanStatus === 'invoicd') {
        return 'Invoiced';
      }
      
      // Return original status if no pattern matches
      return status;
    };

    // For cascading filters, we need to compute available options for each filter
    // based on the current state of other filters (excluding the filter we're computing)
    const computeAvailableOptions = (excludeFilter: string) => {
      // Create a temporary filter state excluding the current filter being computed
      const tempFilters = { ...filters };
      (tempFilters as any)[excludeFilter] = excludeFilter === 'search' ? '' : [];
      
      // Get cars filtered by all filters except the one we're computing
      const filteredCars = getFilteredCars(tempFilters, safeCars);
      
      return {
        statuses: [...new Set(filteredCars.map(car => car?.status).filter(Boolean).map(normalizeStatus))].sort(),
        models: [...new Set(filteredCars.map(car => car?.name).filter(Boolean))].sort(),
        barcodes: [...new Set(filteredCars.map(car => car?.barCode).filter(Boolean))].sort(),
        descriptions: [...new Set(filteredCars.map(car => car?.description).filter(Boolean))].sort(),
        years: [...new Set(filteredCars.map(car => car?.model).filter(Boolean))].sort(),
        colorsExt: [...new Set(filteredCars.map(car => car?.colourExt).filter(Boolean))].sort(),
        colorsInt: [...new Set(filteredCars.map(car => car?.colourInt).filter(Boolean))].sort(),
        specCodes: [...new Set(filteredCars.map(car => car?.specCode).filter(Boolean))].sort(),
        branches: [...new Set(filteredCars.map(car => car?.branch).filter(Boolean))].sort(),
        sp: [...new Set(filteredCars.map(car => car?.sp).filter(Boolean))].sort(),
        deals: [...new Set(filteredCars.map(car => car?.deal).filter(Boolean))].sort(),
        locations: [...new Set(filteredCars.map(car => car?.place).filter(Boolean))].sort(),
        customers: [...new Set(filteredCars.map(car => car?.customerDetails).filter(Boolean))].sort(),
      };
    };

    const result = {
      statuses: computeAvailableOptions('statuses').statuses,
      models: computeAvailableOptions('models').models,
      barcodes: computeAvailableOptions('barcodes').barcodes,
      descriptions: computeAvailableOptions('descriptions').descriptions,
      years: computeAvailableOptions('years').years,
      colorsExt: computeAvailableOptions('colorsExt').colorsExt,
      colorsInt: computeAvailableOptions('colorsInt').colorsInt,
      specCodes: computeAvailableOptions('specCodes').specCodes,
      branches: computeAvailableOptions('branches').branches,
      sp: computeAvailableOptions('sp').sp,
      deals: computeAvailableOptions('deals').deals,
      locations: computeAvailableOptions('locations').locations,
      customers: computeAvailableOptions('customers').customers,
    };
    
    console.log('UniqueValues result (cascading):', result);
    return result;
  }, [cars, filters]);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMultiSelectChange = (key: keyof Omit<MultiFilters, 'search'>, values: string[]) => {
    const newFilters = { ...filters, [key]: values };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: MultiFilters = {
      search: '',
      statuses: [],
      models: [],
      barcodes: [],
      descriptions: [],
      years: [],
      colorsExt: [],
      colorsInt: [],
      specCodes: [],
      branches: [],
      sp: [],
      deals: [],
      locations: [],
      customers: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.search !== '' || 
    filters.statuses.length > 0 || 
    filters.models.length > 0 || 
    filters.barcodes.length > 0 ||
    filters.descriptions.length > 0 ||
    filters.years.length > 0 ||
    filters.colorsExt.length > 0 ||
    filters.colorsInt.length > 0 ||
    filters.specCodes.length > 0 ||
    filters.branches.length > 0 || 
    filters.sp.length > 0 ||
    filters.deals.length > 0 ||
    filters.locations.length > 0 ||
    filters.customers.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Chassis No, BarCode, Name, or Spec Code..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-2">
            <MultiSelect
              options={uniqueValues.statuses}
              selected={filters.statuses}
              onChange={(values) => handleMultiSelectChange('statuses', values)}
              placeholder="Status"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.models}
              selected={filters.models}
              onChange={(values) => handleMultiSelectChange('models', values)}
              placeholder="Name"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.barcodes}
              selected={filters.barcodes}
              onChange={(values) => handleMultiSelectChange('barcodes', values)}
              placeholder="Barcode"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.descriptions}
              selected={filters.descriptions}
              onChange={(values) => handleMultiSelectChange('descriptions', values)}
              placeholder="Description"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.years}
              selected={filters.years}
              onChange={(values) => handleMultiSelectChange('years', values)}
              placeholder="Year"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.colorsExt}
              selected={filters.colorsExt}
              onChange={(values) => handleMultiSelectChange('colorsExt', values)}
              placeholder="Color"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.colorsInt}
              selected={filters.colorsInt}
              onChange={(values) => handleMultiSelectChange('colorsInt', values)}
              placeholder="Interior"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.specCodes}
              selected={filters.specCodes}
              onChange={(values) => handleMultiSelectChange('specCodes', values)}
              placeholder="Spec Code"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.branches}
              selected={filters.branches}
              onChange={(values) => handleMultiSelectChange('branches', values)}
              placeholder="Branch"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.sp}
              selected={filters.sp}
              onChange={(values) => handleMultiSelectChange('sp', values)}
              placeholder="SP"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.deals}
              selected={filters.deals}
              onChange={(values) => handleMultiSelectChange('deals', values)}
              placeholder="Deal"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.locations}
              selected={filters.locations}
              onChange={(values) => handleMultiSelectChange('locations', values)}
              placeholder="Location"
              className="w-full lg:w-40"
            />

            <MultiSelect
              options={uniqueValues.customers}
              selected={filters.customers}
              onChange={(values) => handleMultiSelectChange('customers', values)}
              placeholder="Customer"
              className="w-full lg:w-40"
            />

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="col-span-2 sm:col-span-1">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-4 text-sm text-muted-foreground">
            Active filters: {
              [
                filters.search && `Search: "${filters.search}"`,
                filters.statuses.length > 0 && `Status: ${filters.statuses.length} selected`,
                filters.models.length > 0 && `Name: ${filters.models.length} selected`,
                filters.barcodes.length > 0 && `Barcode: ${filters.barcodes.length} selected`,
                filters.descriptions.length > 0 && `Description: ${filters.descriptions.length} selected`,
                filters.years.length > 0 && `Year: ${filters.years.length} selected`,
                filters.colorsExt.length > 0 && `Color: ${filters.colorsExt.length} selected`,
                filters.colorsInt.length > 0 && `Interior: ${filters.colorsInt.length} selected`,
                filters.specCodes.length > 0 && `Spec Code: ${filters.specCodes.length} selected`,
                filters.branches.length > 0 && `Branch: ${filters.branches.length} selected`,
                filters.sp.length > 0 && `SP: ${filters.sp.length} selected`,
                filters.deals.length > 0 && `Deal: ${filters.deals.length} selected`,
                filters.locations.length > 0 && `Location: ${filters.locations.length} selected`,
                filters.customers.length > 0 && `Customer: ${filters.customers.length} selected`,
              ].filter(Boolean).join(', ')
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};