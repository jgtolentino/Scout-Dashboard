import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Filters {
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  brands?: string[];
  storeTypes?: string[];
}

interface FilterContextType {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  updateFilter: (key: keyof Filters, value: any) => void;
  clearFilters: () => void;
  isFilterActive: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>({});

  const updateFilter = useCallback((key: keyof Filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Cascading logic: clear dependent filters
      if (key === 'region') {
        delete newFilters.province;
        delete newFilters.city;
        delete newFilters.barangay;
      } else if (key === 'province') {
        delete newFilters.city;
        delete newFilters.barangay;
      } else if (key === 'city') {
        delete newFilters.barangay;
      }
      
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const isFilterActive = Object.keys(filters).length > 0;

  const value: FilterContextType = {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    isFilterActive
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

// Helper hook for building filter queries
export const useFilterQuery = () => {
  const { filters } = useFilters();
  
  return useCallback((baseQuery: any) => {
    let query = baseQuery;
    
    if (filters.region) query = query.eq('region', filters.region);
    if (filters.province) query = query.eq('province', filters.province);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.barangay) query = query.eq('barangay', filters.barangay);
    
    if (filters.dateRange) {
      query = query
        .gte('business_date', filters.dateRange.start)
        .lte('business_date', filters.dateRange.end);
    }
    
    if (filters.brands?.length) {
      query = query.in('brand_id', filters.brands);
    }
    
    if (filters.storeTypes?.length) {
      query = query.in('store_type', filters.storeTypes);
    }
    
    return query;
  }, [filters]);
};