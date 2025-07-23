import { useState, useMemo } from "react";
import { Car } from "@/types/car";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { MultiFilters } from "@/utils/carFilters";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  cars: Car[];
  onFilterChange: (filters: MultiFilters) => void;
}

export const FilterBar = ({ cars, onFilterChange }: FilterBarProps) => {
  const [filters, setFilters] = useState<MultiFilters>({
    search: '',
    statuses: [],
    models: [],
    branches: [],
    colorsExt: [],
    barcodes: []
  });

  // Extract unique values from cars data
  const uniqueValues = useMemo(() => {
    const statuses = [...new Set(cars.map(car => car.status).filter(Boolean))];
    const models = [...new Set(cars.map(car => car.model).filter(Boolean))];
    const branches = [...new Set(cars.map(car => car.branch).filter(Boolean))];
    const colorsExt = [...new Set(cars.map(car => car.colourExt).filter(Boolean))];
    const barcodes = [...new Set(cars.map(car => car.barCode).filter(Boolean))];

    return {
      statuses: statuses.sort(),
      models: models.sort(),
      branches: branches.sort(),
      colorsExt: colorsExt.sort(),
      barcodes: barcodes.sort(),
    };
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
      branches: [],
      colorsExt: [],
      barcodes: []
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.search !== '' || 
    filters.statuses.length > 0 || 
    filters.models.length > 0 || 
    filters.branches.length > 0 || 
    filters.colorsExt.length > 0 ||
    filters.barcodes.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Chassis No, BarCode, or Name..."
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
              placeholder="Model"
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
                filters.models.length > 0 && `Model: ${filters.models.length} selected`,
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