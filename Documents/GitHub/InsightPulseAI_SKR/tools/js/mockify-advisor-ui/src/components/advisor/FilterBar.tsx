import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  organizations?: string[];
  regions?: string[];
  categories?: string[];
}

interface FilterState {
  period: string;
  dateRange?: { from: Date; to: Date };
  organization: string;
  region: string;
  category: string;
  search: string;
}

export function FilterBar({ 
  onFilterChange,
  organizations = ["All", "TBWA", "AllianceOne", "Reebok", "NCC Bank"],
  regions = ["All", "North America", "APAC", "EMEA", "LATAM"],
  categories = ["All", "Brand", "Competitors", "Retail", "ROI"],
}: FilterBarProps) {
  // Default filter state
  const [filters, setFilters] = useState<FilterState>({
    period: "30",
    organization: "All",
    region: "All",
    category: "All",
    search: "",
  });
  
  // Date range state
  const [date, setDate] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: new Date(),
  });
  
  // Function to handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | { from: Date; to: Date }) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // If the URL parameters should be updated
    const searchParams = new URLSearchParams(window.location.search);
    if (typeof value === 'string') {
      searchParams.set(key, value);
    } else if (key === 'dateRange') {
      searchParams.set('from', value.from.toISOString().split('T')[0]);
      searchParams.set('to', value.to.toISOString().split('T')[0]);
    }
    
    // Update URL without refreshing
    const newUrl = window.location.pathname + '?' + searchParams.toString();
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Store in localStorage
    localStorage.setItem('advisorFilters', JSON.stringify(newFilters));
    
    // Notify parent component
    onFilterChange(newFilters);
  };
  
  // Function to reset all filters
  const resetFilters = () => {
    const defaultFilters = {
      period: "30",
      organization: "All",
      region: "All",
      category: "All",
      search: "",
    };
    setFilters(defaultFilters);
    
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    
    // Clear localStorage
    localStorage.removeItem('advisorFilters');
    
    // Notify parent component
    onFilterChange(defaultFilters);
  };
  
  // Load filters from localStorage or URL on initial mount
  useEffect(() => {
    // Try to load from localStorage first
    const savedFilters = localStorage.getItem('advisorFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      setFilters(parsedFilters);
      onFilterChange(parsedFilters);
      return;
    }
    
    // If not found in localStorage, try URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilters: Partial<FilterState> = {};
    
    if (searchParams.has('period')) urlFilters.period = searchParams.get('period') || "30";
    if (searchParams.has('organization')) urlFilters.organization = searchParams.get('organization') || "All";
    if (searchParams.has('region')) urlFilters.region = searchParams.get('region') || "All";
    if (searchParams.has('category')) urlFilters.category = searchParams.get('category') || "All";
    if (searchParams.has('search')) urlFilters.search = searchParams.get('search') || "";
    
    // Handle date range
    if (searchParams.has('from') && searchParams.has('to')) {
      const from = new Date(searchParams.get('from') || '');
      const to = new Date(searchParams.get('to') || '');
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        urlFilters.dateRange = { from, to };
        setDate({ from, to });
      }
    }
    
    if (Object.keys(urlFilters).length > 0) {
      const newFilters = { ...filters, ...urlFilters };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }, []);

  return (
    <div className="bg-white border rounded-lg p-3 mb-4 sticky top-0 z-10">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
      
        {/* Time Period */}
        <Select
          value={filters.period}
          onValueChange={(value) => handleFilterChange('period', value)}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Range Picker (shown when custom period is selected) */}
        {filters.period === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 justify-start text-left font-normal w-[200px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date.from && date.to ? (
                  format(date.from, 'PPP') + " - " + format(date.to, 'PPP')
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(value) => {
                  if (value?.from && value?.to) {
                    setDate(value);
                    handleFilterChange('dateRange', { from: value.from, to: value.to });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
        
        {/* Organization */}
        <Select
          value={filters.organization}
          onValueChange={(value) => handleFilterChange('organization', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org} value={org}>{org}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Region */}
        <Select
          value={filters.region}
          onValueChange={(value) => handleFilterChange('region', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="h-8 pl-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8"
              onClick={() => handleFilterChange('search', '')}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Reset Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="h-8"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}