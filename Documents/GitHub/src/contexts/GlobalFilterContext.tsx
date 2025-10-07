import React, { createContext, useContext, useState, useCallback } from 'react';
import { DashboardFilters } from '@/services/dashboardService';

interface GlobalFilters extends DashboardFilters {
  dateRange: 'all' | 'today' | '7days' | '30days' | '90days' | 'custom';
}

interface GlobalFilterContextType {
  filters: GlobalFilters;
  setFilter: (key: keyof GlobalFilters, value: any) => void;
  resetFilters: () => void;
  getFilteredQuery: () => DashboardFilters;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | null>(null);

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilters>({
    categories: [],
    brands: [],
    locations: [],
    dateRange: 'all'
  });

  const setFilter = useCallback((key: keyof GlobalFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      brands: [],
      locations: [],
      dateRange: 'all'
    });
  }, []);

  const getFilteredQuery = useCallback(() => {
    const query: DashboardFilters = {};
    
    // Add active filters to query
    if (filters.categories?.length) {
      query.categories = filters.categories;
    }
    if (filters.brands?.length) {
      query.brands = filters.brands;
    }
    if (filters.locations?.length) {
      query.locations = filters.locations;
    }
    
    // Add date range
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        query.dateFrom = new Date(now.setHours(0, 0, 0, 0));
        query.dateTo = new Date(now.setHours(23, 59, 59, 999));
        break;
      case '7days':
        query.dateFrom = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        query.dateFrom = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        query.dateFrom = new Date(now.setDate(now.getDate() - 90));
        break;
    }
    
    return query;
  }, [filters]);

  return (
    <GlobalFilterContext.Provider value={{ filters, setFilter, resetFilters, getFilteredQuery }}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilters = () => {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within GlobalFilterProvider');
  }
  return context;
}; 