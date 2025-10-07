import { useState, useCallback, useMemo } from 'react';
import { FilterValue, FilterConfig } from '@/components/HierarchicalFilter/types';

interface UseHierarchicalFilterProps {
  config: FilterConfig;
  onFilterChange?: (filters: FilterValue[]) => void;
}

interface UseHierarchicalFilterReturn {
  filters: FilterValue[];
  setFilter: (level: string, value: any) => void;
  clearFilter: (level: string) => void;
  clearAllFilters: () => void;
  getFilterValue: (level: string) => any;
  getFilterQuery: () => Record<string, any>;
  isFilterActive: (level: string) => boolean;
}

export function useHierarchicalFilter({
  config,
  onFilterChange
}: UseHierarchicalFilterProps): UseHierarchicalFilterReturn {
  const [filters, setFilters] = useState<FilterValue[]>([]);

  // Set a filter value
  const setFilter = useCallback((level: string, value: any) => {
    setFilters(currentFilters => {
      const newFilters = [...currentFilters];
      const existingIndex = newFilters.findIndex(f => f.level === level);

      if (existingIndex >= 0) {
        newFilters[existingIndex] = { level, value };
      } else {
        newFilters.push({ level, value });
      }

      // Clear child filters when parent changes
      const levelIndex = config.hierarchy.findIndex(h => h.name === level);
      const childLevels = config.hierarchy.slice(levelIndex + 1).map(h => h.name);
      
      const filteredFilters = newFilters.filter(
        f => !childLevels.includes(f.level)
      );

      if (onFilterChange) {
        onFilterChange(filteredFilters);
      }

      return filteredFilters;
    });
  }, [config.hierarchy, onFilterChange]);

  // Clear a specific filter
  const clearFilter = useCallback((level: string) => {
    setFilters(currentFilters => {
      const levelIndex = config.hierarchy.findIndex(h => h.name === level);
      const childLevels = config.hierarchy.slice(levelIndex).map(h => h.name);
      
      const newFilters = currentFilters.filter(
        f => !childLevels.includes(f.level)
      );

      if (onFilterChange) {
        onFilterChange(newFilters);
      }

      return newFilters;
    });
  }, [config.hierarchy, onFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters([]);
    if (onFilterChange) {
      onFilterChange([]);
    }
  }, [onFilterChange]);

  // Get filter value for a specific level
  const getFilterValue = useCallback((level: string) => {
    const filter = filters.find(f => f.level === level);
    return filter?.value;
  }, [filters]);

  // Generate query object for API calls
  const getFilterQuery = useCallback(() => {
    const query: Record<string, any> = {};

    filters.forEach(filter => {
      const levelConfig = config.hierarchy.find(h => h.name === filter.level);
      if (levelConfig) {
        query[levelConfig.valueColumn] = filter.value[levelConfig.valueColumn];
      }
    });

    return query;
  }, [filters, config.hierarchy]);

  // Check if a filter is active
  const isFilterActive = useCallback((level: string) => {
    return filters.some(f => f.level === level);
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilterValue,
    getFilterQuery,
    isFilterActive
  };
}

// Preset filter configurations
export const filterPresets = {
  currentQuarter: (config: FilterConfig): FilterValue[] => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();

    return [
      {
        level: 'year',
        value: { year }
      },
      {
        level: 'quarter',
        value: {
          quarter_id: `${year}Q${quarter}`,
          quarter_name: `Q${quarter} ${year}`,
          year,
          quarter_number: quarter
        }
      }
    ];
  },

  currentMonth: (config: FilterConfig): FilterValue[] => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = now.toLocaleString('default', { month: 'long' });

    return [
      {
        level: 'year',
        value: { year }
      },
      {
        level: 'month',
        value: {
          month_id: `${year}-${month.toString().padStart(2, '0')}`,
          month_name: monthName,
          month_number: month
        }
      }
    ];
  },

  lastYear: (config: FilterConfig): FilterValue[] => {
    const year = new Date().getFullYear() - 1;
    return [
      {
        level: 'year',
        value: { year }
      }
    ];
  }
};