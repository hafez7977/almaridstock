import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

export const MultiSelect = ({ 
  options = [], 
  selected = [], 
  onChange, 
  placeholder,
  className 
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);

  // Ensure we have valid arrays
  const safeOptions = Array.isArray(options) ? options : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  const handleSelect = (option: string) => {
    if (safeSelected.includes(option)) {
      onChange(safeSelected.filter(item => item !== option));
    } else {
      onChange([...safeSelected, option]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {safeSelected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : safeSelected.length === 1 ? (
              <span>{safeSelected[0]}</span>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {safeSelected.length} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {safeSelected.length > 0 && (
              <X 
                className="h-3 w-3 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-background border z-50">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => handleSelect(option)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    safeSelected.includes(option) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};