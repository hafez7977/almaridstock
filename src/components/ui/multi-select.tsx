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
  options, 
  selected, 
  onChange, 
  placeholder,
  className 
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleClear = () => {
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
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selected.length === 1 ? (
              <span>{selected[0]}</span>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {selected.length} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <X 
                className="h-3 w-3 opacity-50 hover:opacity-100" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => handleSelect(option)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option) ? "opacity-100" : "opacity-0"
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