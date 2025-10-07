import { supabase } from '../lib/supabaseClient'

export type SortKey = 'txn_ts:desc' | 'amount:desc' | 'amount:asc'
export type TxFilters = { region?: string; brand?: string; dateFrom?: string; dateTo?: string }

export async function listRecentTx(opts: { limit?: number; offset?: number; sort?: SortKey; filters?: TxFilters } = {}) {
  const { data, error } = await supabase.rpc('get_gold_recent_transactions', {
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
    sort: opts.sort ?? 'txn_ts:desc',
    filters_json: opts.filters ?? {}
  })
  if (error) throw error
  return data as any[]
}

export async function countRecentTx(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_gold_recent_transactions_count', { filters_json: filters })
  if (error) throw error
  return Number(data)
}

export async function getBrandPerformance(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_gold_brand_performance', { filters_json: filters })
  if (error) throw error
  return data as Array<{ brand_id: string; brand: string; d: string; revenue: number; units: number; transactions: number }>
}

export async function getPriceBands(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_gold_price_bands', { filters_json: filters })
  if (error) throw error
  return data as Array<{ price_band: string; units: number; revenue: number }>
}

export async function getPromoHeatmap(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_gold_promo_heatmap', { filters_json: filters })
  if (error) throw error
  return data as Array<{ d: string; region: string; influenced: number; total: number; pct: number }>
}

export async function getOOS(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_gold_oos', { filters_json: filters })
  if (error) throw error
  return data as Array<{ region: string; brand: string; oos_events: number; txns: number; oos_rate: number }>
}

export async function getGeographicInsights(filters: TxFilters = {}) {
  const { data, error } = await supabase.rpc('get_geographic_insights', { 
    p_region_id: filters.region || null,
    p_date_from: filters.dateFrom || null,
    p_date_to: filters.dateTo || null
  })
  if (error) throw error
  return data as Array<{
    location_id: string;
    location_name: string;
    region_name: string;
    latitude: number;
    longitude: number;
    total_revenue: number;
    transaction_count: number;
    unique_customers: number;
    average_basket_size: number;
    top_category: string;
  }>
}