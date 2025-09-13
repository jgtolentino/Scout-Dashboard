import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase';
import { FilterConfig, FilterValue, DimensionTable } from './types';
import { generateFilterTypes } from './typeGenerator';
import { ChevronDown, X, Search } from 'lucide-react';
import clsx from 'clsx';

interface HierarchicalFilterProps {
  config: FilterConfig;
  onChange: (filters: FilterValue[]) => void;
  className?: string;
}

export const HierarchicalFilter: React.FC<HierarchicalFilterProps> = ({
  config,
  onChange,
  className
}) => {
  const supabase = useSupabase();
  const [dimensions, setDimensions] = useState<Record<string, DimensionTable[]>>({});
  const [selectedFilters, setSelectedFilters] = useState<FilterValue[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch dimension data
  useEffect(() => {
    const fetchDimensions = async () => {
      setLoading(true);
      const dimensionData: Record<string, DimensionTable[]> = {};

      for (const level of config.hierarchy) {
        const { data, error } = await supabase
          .from(level.table)
          .select(level.columns.join(','))
          .order(level.displayColumn);

        if (!error && data) {
          dimensionData[level.name] = data;
        }
      }

      setDimensions(dimensionData);
      setLoading(false);
    };

    fetchDimensions();
  }, [config, supabase]);

  // Generate TypeScript types for dimensions
  useEffect(() => {
    if (Object.keys(dimensions).length > 0) {
      generateFilterTypes(config, dimensions);
    }
  }, [dimensions, config]);

  // Handle filter selection
  const handleFilterSelect = useCallback((level: string, value: any) => {
    const newFilters = [...selectedFilters];
    const existingIndex = newFilters.findIndex(f => f.level === level);

    if (existingIndex >= 0) {
      newFilters[existingIndex] = { level, value };
    } else {
      newFilters.push({ level, value });
    }

    // Clear child selections when parent changes
    const levelIndex = config.hierarchy.findIndex(h => h.name === level);
    const childLevels = config.hierarchy.slice(levelIndex + 1).map(h => h.name);
    
    const filteredFilters = newFilters.filter(
      f => !childLevels.includes(f.level)
    );

    setSelectedFilters(filteredFilters);
    onChange(filteredFilters);
  }, [selectedFilters, config.hierarchy, onChange]);

  // Get filtered options based on parent selections
  const getFilteredOptions = useCallback((level: string) => {
    const levelConfig = config.hierarchy.find(h => h.name === level);
    if (!levelConfig || !dimensions[level]) return [];

    let options = dimensions[level];

    // Apply parent filters
    const parentLevels = config.hierarchy.slice(
      0,
      config.hierarchy.findIndex(h => h.name === level)
    );

    parentLevels.forEach(parentLevel => {
      const parentFilter = selectedFilters.find(f => f.level === parentLevel.name);
      if (parentFilter && levelConfig.parentKey) {
        options = options.filter(
          opt => opt[levelConfig.parentKey!] === parentFilter.value[parentLevel.valueColumn]
        );
      }
    });

    // Apply search filter
    const searchTerm = searchTerms[level]?.toLowerCase();
    if (searchTerm) {
      options = options.filter(opt =>
        opt[levelConfig.displayColumn].toLowerCase().includes(searchTerm)
      );
    }

    return options;
  }, [config.hierarchy, dimensions, selectedFilters, searchTerms]);

  // Toggle expanded state
  const toggleExpanded = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  // Clear filter
  const clearFilter = (level: string) => {
    const levelIndex = config.hierarchy.findIndex(h => h.name === level);
    const childLevels = config.hierarchy.slice(levelIndex).map(h => h.name);
    
    const newFilters = selectedFilters.filter(
      f => !childLevels.includes(f.level)
    );
    
    setSelectedFilters(newFilters);
    onChange(newFilters);
  };

  // Check if level should be disabled
  const isLevelDisabled = (level: string) => {
    const levelIndex = config.hierarchy.findIndex(h => h.name === level);
    if (levelIndex === 0) return false;

    const parentLevel = config.hierarchy[levelIndex - 1];
    return !selectedFilters.some(f => f.level === parentLevel.name);
  };

  if (loading) {
    return (
      <div className={clsx('flex items-center justify-center p-4', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {config.hierarchy.map((level, index) => {
        const isDisabled = isLevelDisabled(level.name);
        const isExpanded = expandedLevels.has(level.name);
        const selectedValue = selectedFilters.find(f => f.level === level.name)?.value;
        const options = getFilteredOptions(level.name);

        return (
          <div key={level.name} className="relative">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {level.displayName}
              </label>
              {selectedValue && (
                <button
                  onClick={() => clearFilter(level.name)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-1 relative">
              <button
                onClick={() => !isDisabled && toggleExpanded(level.name)}
                disabled={isDisabled}
                className={clsx(
                  'relative w-full bg-white border rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm',
                  isDisabled
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-900'
                )}
              >
                <span className="block truncate">
                  {selectedValue
                    ? selectedValue[level.displayColumn]
                    : `Select ${level.displayName}`}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown
                    className={clsx(
                      'h-5 w-5 transition-transform',
                      isExpanded && 'transform rotate-180',
                      isDisabled ? 'text-gray-400' : 'text-gray-600'
                    )}
                  />
                </span>
              </button>

              {isExpanded && !isDisabled && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {/* Search input */}
                  <div className="sticky top-0 bg-white px-2 py-1.5 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={`Search ${level.displayName}...`}
                        value={searchTerms[level.name] || ''}
                        onChange={(e) =>
                          setSearchTerms({ ...searchTerms, [level.name]: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {options.length === 0 ? (
                      <div className="text-center py-2 text-sm text-gray-500">
                        No options available
                      </div>
                    ) : (
                      options.map((option) => (
                        <div
                          key={option[level.valueColumn]}
                          className={clsx(
                            'cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50',
                            selectedValue?.[level.valueColumn] === option[level.valueColumn]
                              ? 'bg-primary-50 text-primary-900'
                              : 'text-gray-900'
                          )}
                          onClick={() => {
                            handleFilterSelect(level.name, option);
                            toggleExpanded(level.name);
                          }}
                        >
                          <span className="block truncate">
                            {option[level.displayColumn]}
                          </span>
                          {level.additionalDisplay && (
                            <span className="block text-xs text-gray-500 truncate">
                              {level.additionalDisplay
                                .map(col => option[col])
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Selected filters summary */}
      {selectedFilters.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter) => {
              const level = config.hierarchy.find(h => h.name === filter.level);
              return (
                <span
                  key={filter.level}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {level?.displayName}: {filter.value[level?.displayColumn || '']}
                  <button
                    onClick={() => clearFilter(filter.level)}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalFilter;