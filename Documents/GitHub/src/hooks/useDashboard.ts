import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardFilters } from '@/services/dashboardService';

export const useDashboardMetrics = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => dashboardService.getDashboardMetrics(filters),
    staleTime: 30000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBrandPerformance = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: ['brand-performance', filters],
    queryFn: () => dashboardService.getBrandPerformance(filters),
    staleTime: 30000,
  });
};

export const useTopBrand = () => {
  return useQuery({
    queryKey: ['top-brand'],
    queryFn: () => dashboardService.getTopBrand(),
    staleTime: 60000, // 1 minute
  });
};

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: () => dashboardService.getFilterOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 