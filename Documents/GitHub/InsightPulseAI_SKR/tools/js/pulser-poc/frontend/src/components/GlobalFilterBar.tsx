import React, { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  barangay: string;
  category: string;
  dateRange: string;
  search: string;
}

const barangayOptions = [
  { value: 'all', label: 'All Barangays' },
  { value: 'poblacion', label: 'Poblacion' },
  { value: 'san-antonio', label: 'San Antonio' },
  { value: 'santo-nino', label: 'Santo Niño' },
  { value: 'san-isidro', label: 'San Isidro' },
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'food-snacks', label: 'Food & Snacks' },
  { value: 'personal-care', label: 'Personal Care' },
  { value: 'household', label: 'Household' },
  { value: 'dairy', label: 'Dairy' },
];

const dateRangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

export default function GlobalFilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    barangay: 'all',
    category: 'all',
    dateRange: '30d',
    search: '',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Barangay Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Barangay
          </label>
          <select
            value={filters.barangay}
            onChange={(e) => handleFilterChange('barangay', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          >
            {barangayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[300px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search brands, insights..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Clear All Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              const resetFilters = {
                barangay: 'all',
                category: 'all',
                dateRange: '30d',
                search: '',
              };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}