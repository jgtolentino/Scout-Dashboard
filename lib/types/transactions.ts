import { z } from "zod"

export const Location = z.object({
  barangay: z.string(),
  city: z.string(),
  province: z.string(),
  region: z.string(),
})

export const Transaction = z.object({
  id: z.string(),
  store_id: z.string(),
  timestamp: z.string().datetime(),
  time_of_day: z.enum(["morning","afternoon","evening","night"]),
  region: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  barangay: z.string().optional(),
  product_category: z.string().optional(),
  brand_name: z.string().optional(),
  sku: z.string().optional(),
  units_per_transaction: z.number().int().nonnegative().optional(),
  peso_value: z.number().nonnegative().optional(),
  basket_size: z.number().int().nonnegative().optional(),
  combo_basket: z.array(z.string()).optional(),
  request_mode: z.enum(["verbal","pointing","indirect"]).optional(),
  request_type: z.enum(["branded","unbranded","point","indirect"]).optional(),
  suggestion_accepted: z.boolean().default(false),
  gender: z.enum(["male","female","unknown"]).optional(),
  age_bracket: z.enum(["18-24","25-34","35-44","45-54","55+","unknown"]).optional(),
  substitution_occurred: z.boolean().default(false),
  substitution_from: z.string().optional(),
  substitution_to: z.string().optional(),
  substitution_reason: z.string().optional(),
  duration_seconds: z.number().int().nonnegative().default(0),
  campaign_influenced: z.boolean().default(false),
  handshake_score: z.number().min(0).max(1).default(0),
  is_tbwa_client: z.boolean().default(false),
  payment_method: z.string().optional(),
  customer_type: z.string().optional(),
  store_type: z.string().optional(),
  economic_class: z.string().optional(),
  created_at: z.string().datetime().optional(),
})

export type Transaction = z.infer<typeof Transaction>

// Dashboard view types
export type TrendData = {
  day: string
  tx_count: number
  sales: number
  avg_transaction: number
}

export type BehaviorData = {
  request_type: string
  n: number
  acceptance_rate: number
}

export type ProductMixData = {
  product_category: string
  brand_name: string
  n: number
  total_sales: number
}

export type ProfilingData = {
  gender: string
  age_bracket: string
  n: number
  avg_spend: number
}

export type GeoData = {
  province: string
  tx_count: number
  sales: number
  avg_transaction: number
  region_name?: string
  province_code?: string
}

export type TimeHeatmapData = {
  time_of_day: string
  day_of_week: number
  tx_count: number
  avg_value: number
}

export type CompetitiveData = {
  brand_name: string
  product_category: string
  market_share: number
  total_revenue: number
  avg_price_point: number
  acceptance_rate: number
  is_tbwa_client?: boolean
  tier_classification?: string
}