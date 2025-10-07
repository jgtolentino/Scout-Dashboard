import { supabase } from '@/integrations/supabase/client';
import type { DashboardFilters, DashboardMetrics } from '@/types/dashboard';

export const dashboardService = {
  async getDashboardData(filters: DashboardFilters = {}) {
    console.log('🔍 Fetching dashboard data with filters:', filters);
    
    // Check if we have active filters
    const hasFilters = filters.categories?.length > 0 || 
                      filters.brands?.length > 0 || 
                      filters.locations?.length > 0;
    
    if (hasFilters) {
      // Use the RPC function with filters
      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        filter_categories: filters.categories?.length > 0 ? filters.categories : null,
        filter_brands: filters.brands?.length > 0 ? filters.brands : null,
        filter_locations: filters.locations?.length > 0 ? filters.locations : null,
        date_from: filters.dateFrom || null,
        date_to: filters.dateTo || null
      });

      if (error) {
        console.error('❌ Error fetching filtered data:', error);
        throw error;
      }

      console.log('✅ Filtered data received:', data);
      
      // Transform the RPC response to match your component's expected format
      return {
        totalRevenue: data.totalRevenue,
        totalTransactions: data.totalTransactions,
        avgTransaction: data.avgTransaction,
        topBrands: [], // You'll need to fetch this separately or add to RPC
        topBundle: data.topBundle || { name: 'No bundles found', count: 0, percentage: 0 },
        dailyStats: data.dailyStats || []
      };
    } else {
      // No filters - use the existing logic
      return this.getAllDashboardData();
    }
  },

  async getAllDashboardData() {
    // Use the RPC function without filters
    const { data, error } = await supabase.rpc('get_dashboard_metrics');
    
    if (error) {
      console.error('❌ Error fetching all data:', error);
      throw error;
    }
    
    console.log('✅ All data received:', data);
    
    return {
      totalRevenue: data.totalRevenue,
      totalTransactions: data.totalTransactions,
      avgTransaction: data.avgTransaction,
      topBrands: [],
      topBundle: data.topBundle || { name: 'No bundles found', count: 0, percentage: 0 },
      dailyStats: data.dailyStats || []
    };
  },

  // Add a specific function for category metrics
  async getCategoryMetrics(categoryName: string) {
    console.log('🔍 Fetching metrics for category:', categoryName);
    
    const { data, error } = await supabase.rpc('get_category_metrics', {
      category_name: categoryName
    });

    if (error) {
      console.error('❌ Error fetching category metrics:', error);
      throw error;
    }

    console.log('✅ Category metrics received:', data);
    return data;
  }
}; 