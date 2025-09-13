
import { cn } from "@/lib/utils";
import React from "react";
import { X, Filter } from "lucide-react";

interface FilterItemProps {
  label: string;
  value: string;
  onRemove: () => void;
}

const FilterItem = ({ label, value, onRemove }: FilterItemProps) => {
  return (
    <div className="inline-flex items-center bg-white border border-azure-grayLight/30 rounded-md px-2 py-1 mr-2 animate-scale-in">
      <span className="text-sm text-azure-gray mr-1">{label} equals</span>
      <span className="text-sm font-medium">{value}</span>
      <button 
        onClick={onRemove}
        className="ml-1.5 text-azure-gray hover:text-azure-blueDark rounded-full p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface FilterBarProps {
  filters: Array<{id: string; label: string; value: string}>;
  onRemoveFilter: (id: string) => void;
  className?: string;
}

const FilterBar = ({ filters, onRemoveFilter, className }: FilterBarProps) => {
  return (
    <div className={cn("flex flex-wrap items-center py-3", className)}>
      {filters.map((filter) => (
        <FilterItem 
          key={filter.id}
          label={filter.label}
          value={filter.value}
          onRemove={() => onRemoveFilter(filter.id)}
        />
      ))}
      
      <button className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-white border border-azure-grayLight/30 text-sm hover:bg-azure-blue/5 transition-colors">
        <Filter size={14} className="mr-1.5" />
        Add filter
      </button>
    </div>
  );
};

export default FilterBar;
