import { supabase } from '@/integrations/supabase/client';

export interface DashboardFilters {
  categories?: string[];
  brands?: number[];
  locations?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  dailyStats: Array<{
    date: string;
    transactionCount: number;
    revenue: number;
  }>;
  topBundle: {
    name: string;
    count: number;
    percentage: number;
  };
}

export interface BrandPerformance {
  brand_id: number;
  brand_name: string;
  category: string;
  transaction_count: number;
  total_revenue: number;
  avg_transaction: number;
  market_share: number;
}

export interface TopBrand {
  id: number;
  name: string;
  revenue: number;
  transactionCount: number;
}

export interface FilterOptions {
  categories: string[];
  brands: Array<{
    id: number;
    name: string;
    category: string;
  }>;
  locations: string[];
}

export const dashboardService = {
  // Get main dashboard metrics using the RPC function
  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    console.log('📊 Fetching dashboard metrics with filters:', filters);
    
    const { data, error } = await supabase.rpc('get_dashboard_metrics', {
      filter_categories: filters?.categories?.length ? filters.categories : null,
      filter_brands: filters?.brands?.length ? filters.brands : null,
      filter_locations: filters?.locations?.length ? filters.locations : null,
      date_from: filters?.dateFrom?.toISOString() || null,
      date_to: filters?.dateTo?.toISOString() || null
    });

    if (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      throw error;
    }

    console.log('✅ Dashboard metrics received:', data);
    return data;
  },

  // Get brand performance data
  async getBrandPerformance(filters?: DashboardFilters): Promise<BrandPerformance[]> {
    const { data, error } = await supabase.rpc('get_brand_performance', {
      filter_categories: filters?.categories || null,
      filter_brands: filters?.brands || null,
      filter_locations: filters?.locations || null,
      date_from: filters?.dateFrom?.toISOString() || null,
      date_to: filters?.dateTo?.toISOString() || null,
      limit_count: 10
    });

    if (error) {
      console.error('❌ Error fetching brand performance:', error);
      throw error;
    }

    return data || [];
  },

  // Get top brand
  async getTopBrand(): Promise<TopBrand> {
    const { data, error } = await supabase.rpc('get_top_brand');

    if (error) {
      console.error('❌ Error fetching top brand:', error);
      throw error;
    }

    return data;
  },

  // Get filter options
  async getFilterOptions(): Promise<FilterOptions> {
    const { data, error } = await supabase.rpc('get_filter_options');

    if (error) {
      console.error('❌ Error fetching filter options:', error);
      throw error;
    }

    return data;
  },
  
  async getRecentTransactions(limit = 1000, filters: DashboardFilters = {}) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          quantity,
          price,
          products (
            name,
            brand_id,
            brands (
              name,
              is_tbwa
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filters.categories?.length) {
      query = query.in('transaction_items.products.brands.category', filters.categories);
    }
    if (filters.brands?.length) {
      query = query.in('transaction_items.products.brand_id', filters.brands);
    }
    if (filters.locations?.length) {
      query = query.in('store_location', filters.locations);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }
      
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
    
    return {
      transactions: data,
      displayCount: data.length,
      hasMore: data.length === limit
    };
  }
}; 