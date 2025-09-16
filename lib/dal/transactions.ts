/**
 * Transaction Data Access Layer
 * Handles all transaction-related database operations
 */

import BaseDAL from './base'
import type { TrendData, BehaviorData, ProductMixData, ProfilingData, GeoData, TimeHeatmapData, CompetitiveData } from '@/lib/types/transactions'

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  regions?: string[]
  provinces?: string[]
  stores?: string[]
  brands?: string[]
  categories?: string[]
  genders?: string[]
  ageBrackets?: string[]
  paymentMethods?: string[]
  customerTypes?: string[]
}

class TransactionDAL extends BaseDAL {

  /**
   * Get daily transaction trends with optional filters
   */
  async getTrends(filters: TransactionFilters = {}): Promise<{ data: TrendData[] | null; error: string | null }> {
    const cacheKey = `trends_${JSON.stringify(filters)}`
    
    return this.executeQuery<TrendData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_trends_daily')
          .select('day, tx_count, sales, avg_transaction')
          .order('day', { ascending: true })

        // Apply date filters
        if (filters.dateFrom) {
          query = query.gte('day', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('day', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      300000 // 5 minutes cache
    )
  }

  /**
   * Get consumer behavior patterns
   */
  async getBehaviorData(filters: TransactionFilters = {}): Promise<{ data: BehaviorData[] | null; error: string | null }> {
    const cacheKey = `behavior_${JSON.stringify(filters)}`
    
    return this.executeQuery<BehaviorData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_behavior_patterns')
          .select('request_type, n, acceptance_rate')
          .order('n', { ascending: false })

        // Apply filters if needed
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Get product mix analysis
   */
  async getProductMix(filters: TransactionFilters = {}): Promise<{ data: ProductMixData[] | null; error: string | null }> {
    const cacheKey = `product_mix_${JSON.stringify(filters)}`
    
    return this.executeQuery<ProductMixData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_product_mix')
          .select('product_category, brand_name, n, total_sales')
          .order('total_sales', { ascending: false })

        // Apply filters
        if (filters.categories?.length) {
          query = query.in('product_category', filters.categories)
        }
        if (filters.brands?.length) {
          query = query.in('brand_name', filters.brands)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      300000 // 5 minutes cache
    )
  }

  /**
   * Get consumer profiling data
   */
  async getProfiling(filters: TransactionFilters = {}): Promise<{ data: ProfilingData[] | null; error: string | null }> {
    const cacheKey = `profiling_${JSON.stringify(filters)}`
    
    return this.executeQuery<ProfilingData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_consumer_profiling')
          .select('gender, age_bracket, n, avg_spend')
          .order('n', { ascending: false })

        // Apply filters
        if (filters.genders?.length) {
          query = query.in('gender', filters.genders)
        }
        if (filters.ageBrackets?.length) {
          query = query.in('age_bracket', filters.ageBrackets)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Get geographic distribution data
   */
  async getGeoData(filters: TransactionFilters = {}): Promise<{ data: GeoData[] | null; error: string | null }> {
    const cacheKey = `geo_${JSON.stringify(filters)}`
    
    return this.executeQuery<GeoData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_geo_province')
          .select('province, tx_count, sales, avg_transaction, region_name, province_code')
          .order('tx_count', { ascending: false })

        // Apply filters
        if (filters.regions?.length) {
          query = query.in('region_name', filters.regions)
        }
        if (filters.provinces?.length) {
          query = query.in('province', filters.provinces)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      300000 // 5 minutes cache
    )
  }

  /**
   * Get time-based heatmap data
   */
  async getTimeHeatmap(filters: TransactionFilters = {}): Promise<{ data: TimeHeatmapData[] | null; error: string | null }> {
    const cacheKey = `time_heatmap_${JSON.stringify(filters)}`
    
    return this.executeQuery<TimeHeatmapData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_time_heatmap')
          .select('time_of_day, day_of_week, tx_count, avg_value')
          .order('day_of_week', { ascending: true })
          .order('time_of_day', { ascending: true })

        // Apply date filters
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Get competitive analysis data
   */
  async getCompetitiveData(filters: TransactionFilters = {}): Promise<{ data: CompetitiveData[] | null; error: string | null }> {
    const cacheKey = `competitive_${JSON.stringify(filters)}`
    
    return this.executeQuery<CompetitiveData[]>(
      async (client) => {
        let query = (client as any)
          .from('v_competitive_analysis')
          .select(`
            brand_name, 
            product_category, 
            market_share, 
            total_revenue, 
            avg_price_point, 
            acceptance_rate,
            is_tbwa_client,
            tier_classification
          `)
          .order('market_share', { ascending: false })

        // Apply filters
        if (filters.categories?.length) {
          query = query.in('product_category', filters.categories)
        }
        if (filters.brands?.length) {
          query = query.in('brand_name', filters.brands)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
        return { data, error }
      },
      cacheKey,
      600000 // 10 minutes cache
    )
  }

  /**
   * Get advanced analytics with custom SQL
   */
  async getAdvancedAnalytics(
    analysisType: 'cohort' | 'funnel' | 'retention' | 'attribution',
    params: Record<string, any> = {}
  ): Promise<{ data: any[] | null; error: string | null }> {
    const cacheKey = `advanced_${analysisType}_${JSON.stringify(params)}`

    const queries = {
      cohort: `
        WITH cohorts AS (
          SELECT 
            DATE_TRUNC('month', timestamp::date) as cohort_month,
            store_id,
            COUNT(*) as tx_count,
            AVG(peso_value) as avg_spend
          FROM transactions 
          WHERE timestamp >= $1 AND timestamp <= $2
          GROUP BY cohort_month, store_id
        )
        SELECT * FROM cohorts ORDER BY cohort_month
      `,
      funnel: `
        SELECT 
          'awareness' as stage, COUNT(DISTINCT store_id) as count
        FROM transactions WHERE campaign_influenced = true
        UNION ALL
        SELECT 
          'consideration' as stage, COUNT(DISTINCT store_id) as count
        FROM transactions WHERE request_type != 'indirect'
        UNION ALL
        SELECT 
          'purchase' as stage, COUNT(DISTINCT store_id) as count
        FROM transactions WHERE peso_value > 0
      `,
      retention: `
        WITH user_activity AS (
          SELECT 
            store_id,
            DATE_TRUNC('month', timestamp::date) as activity_month,
            COUNT(*) as tx_count
          FROM transactions 
          WHERE timestamp >= $1 AND timestamp <= $2
          GROUP BY store_id, activity_month
        )
        SELECT 
          activity_month,
          COUNT(DISTINCT store_id) as active_stores,
          AVG(tx_count) as avg_transactions
        FROM user_activity
        GROUP BY activity_month
        ORDER BY activity_month
      `,
      attribution: `
        SELECT 
          CASE WHEN campaign_influenced THEN 'Campaign' ELSE 'Organic' END as source,
          COUNT(*) as transactions,
          SUM(peso_value) as revenue,
          AVG(peso_value) as avg_order_value
        FROM transactions 
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY campaign_influenced
      `
    }

    const query = queries[analysisType]
    if (!query) {
      return { data: null, error: 'Invalid analysis type' }
    }

    return this.executeRawQuery(
      query,
      [params.dateFrom || '2024-01-01', params.dateTo || '2024-12-31'],
      cacheKey,
      900000 // 15 minutes cache
    )
  }

  /**
   * Invalidate all transaction-related caches
   */
  invalidateCache(): void {
    this.clearCache()
  }
}

export default TransactionDAL