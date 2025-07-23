import { useState, useMemo } from "react";
import { Car } from "@/types/car";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  cars: Car[];
  onFilterChange: (filters: any) => void;
}

export const FilterBar = ({ cars, onFilterChange }: FilterBarProps) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    model: 'all',
    colorExt: 'all',
    colorInt: 'all',
    branch: 'all',
    supplier: 'all'
  });

  // Extract unique values from cars data
  const uniqueValues = useMemo(() => {
    const statuses = [...new Set(cars.map(car => car.status).filter(Boolean))];
    const models = [...new Set(cars.map(car => car.model).filter(Boolean))];
    const branches = [...new Set(cars.map(car => car.branch).filter(Boolean))];
    const colorsExt = [...new Set(cars.map(car => car.colourExt).filter(Boolean))];
    const suppliers = [...new Set(cars.map(car => car.supplier).filter(Boolean))];

    return {
      statuses: statuses.sort(),
      models: models.sort(),
      branches: branches.sort(),
      colorsExt: colorsExt.sort(),
      suppliers: suppliers.sort(),
    };
  }, [cars]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      model: 'all',
      colorExt: 'all',
      colorInt: 'all',
      branch: 'all',
      supplier: 'all'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.search !== '' || 
    filters.status !== 'all' || 
    filters.model !== 'all' || 
    filters.colorExt !== 'all' || 
    filters.branch !== 'all';

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Chassis No or BarCode..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueValues.statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueValues.models.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.branch} onValueChange={(value) => handleFilterChange('branch', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {uniqueValues.branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.colorExt} onValueChange={(value) => handleFilterChange('colorExt', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {uniqueValues.colorsExt.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};