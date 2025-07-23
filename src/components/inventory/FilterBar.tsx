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
    years: [],  // Will contain model/year data
    branches: [],
    colorsExt: [],
    barcodes: [],
    specCodes: []
  });

  // Extract unique values from cars data with safety checks
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
    
    const rawStatuses = safeCars.map(car => car?.status).filter(Boolean);
    const normalizedStatuses = [...new Set(rawStatuses.map(normalizeStatus))];
    
    // Models filter will now show car names
    const carNames = [...new Set(safeCars.map(car => car?.name).filter(Boolean))];
    // Years filter will show model data  
    const years = [...new Set(safeCars.map(car => car?.model).filter(Boolean))];
    const branches = [...new Set(safeCars.map(car => car?.branch).filter(Boolean))];
    const colorsExt = [...new Set(safeCars.map(car => car?.colourExt).filter(Boolean))];
    const barcodes = [...new Set(safeCars.map(car => car?.barCode).filter(Boolean))];
    const specCodes = [...new Set(safeCars.map(car => car?.specCode).filter(Boolean))];

    const result = {
      statuses: normalizedStatuses.sort(),
      models: carNames.sort(), // Now contains car names
      years: years.sort(),     // Now contains model/year data
      branches: branches.sort(),
      colorsExt: colorsExt.sort(),
      barcodes: barcodes.sort(),
      specCodes: specCodes.sort(),
    };
    
    console.log('UniqueValues result:', result);
    return result;
  }, [cars]);

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
      years: [],
      branches: [],
      colorsExt: [],
      barcodes: [],
      specCodes: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.search !== '' || 
    filters.statuses.length > 0 || 
    filters.models.length > 0 || 
    filters.years.length > 0 ||
    filters.branches.length > 0 || 
    filters.colorsExt.length > 0 ||
    filters.barcodes.length > 0 ||
    filters.specCodes.length > 0;

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

          <div className="flex flex-wrap gap-2">
            <MultiSelect
              options={uniqueValues.statuses}
              selected={filters.statuses}
              onChange={(values) => handleMultiSelectChange('statuses', values)}
              placeholder="Status"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.models}
              selected={filters.models}
              onChange={(values) => handleMultiSelectChange('models', values)}
              placeholder="Name"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.years}
              selected={filters.years}
              onChange={(values) => handleMultiSelectChange('years', values)}
              placeholder="Year"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.specCodes}
              selected={filters.specCodes}
              onChange={(values) => handleMultiSelectChange('specCodes', values)}
              placeholder="Spec. Code"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.branches}
              selected={filters.branches}
              onChange={(values) => handleMultiSelectChange('branches', values)}
              placeholder="Branch"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.barcodes}
              selected={filters.barcodes}
              onChange={(values) => handleMultiSelectChange('barcodes', values)}
              placeholder="Barcode"
              className="w-40"
            />

            <MultiSelect
              options={uniqueValues.colorsExt}
              selected={filters.colorsExt}
              onChange={(values) => handleMultiSelectChange('colorsExt', values)}
              placeholder="Color"
              className="w-40"
            />

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
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
                filters.years.length > 0 && `Year: ${filters.years.length} selected`,
                filters.specCodes.length > 0 && `Spec. Code: ${filters.specCodes.length} selected`,
                filters.branches.length > 0 && `Branch: ${filters.branches.length} selected`,
                filters.colorsExt.length > 0 && `Color: ${filters.colorsExt.length} selected`,
                filters.barcodes.length > 0 && `Barcode: ${filters.barcodes.length} selected`,
              ].filter(Boolean).join(', ')
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};