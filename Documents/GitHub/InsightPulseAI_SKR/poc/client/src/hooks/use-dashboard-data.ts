import { useQuery } from "@tanstack/react-query";
import type { KPIMetrics, LocationData, CategoryData, BrandData, TrendData, AIInsight } from "@shared/schema";

export function useDashboardData() {
  const { 
    data: kpiMetrics, 
    isLoading: kpiLoading 
  } = useQuery<KPIMetrics>({
    queryKey: ["/api/dashboard/kpi"],
  });

  const { 
    data: locationData, 
    isLoading: locationLoading 
  } = useQuery<LocationData[]>({
    queryKey: ["/api/dashboard/locations"],
  });

  const { 
    data: categoryData, 
    isLoading: categoryLoading 
  } = useQuery<CategoryData[]>({
    queryKey: ["/api/dashboard/categories"],
  });

  const { 
    data: brandData, 
    isLoading: brandLoading 
  } = useQuery<BrandData[]>({
    queryKey: ["/api/dashboard/brands"],
  });

  const { 
    data: trendData, 
    isLoading: trendLoading 
  } = useQuery<TrendData[]>({
    queryKey: ["/api/dashboard/trends"],
  });

  const { 
    data: aiInsights, 
    isLoading: insightsLoading 
  } = useQuery<AIInsight[]>({
    queryKey: ["/api/dashboard/insights"],
  });

  const isLoading = kpiLoading || locationLoading || categoryLoading || brandLoading || trendLoading || insightsLoading;

  return {
    kpiMetrics,
    locationData,
    categoryData,
    brandData,
    trendData,
    aiInsights,
    isLoading,
  };
}
