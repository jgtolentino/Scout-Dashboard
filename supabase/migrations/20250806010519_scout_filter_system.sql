-- Scout Filter System Migration
-- Complete filterable transaction system for TBWA Scout Dashboard

-- =====================================================
-- MAIN FILTER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_scout_filtered_transactions_scout(
  -- Temporal filters
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_time_of_day text[] DEFAULT NULL,
  p_day_type text DEFAULT 'all',
  
  -- Geographic filters  
  p_regions text[] DEFAULT NULL,
  p_provinces text[] DEFAULT NULL,
  p_cities text[] DEFAULT NULL,
  p_barangays text[] DEFAULT NULL,
  
  -- Product & Brand filters
  p_categories text[] DEFAULT NULL,
  p_brands text[] DEFAULT NULL,
  p_products text[] DEFAULT NULL,
  p_brand_owners text[] DEFAULT NULL,
  p_tbwa_clients_only boolean DEFAULT NULL,
  
  -- Demographic filters
  p_genders text[] DEFAULT NULL,
  p_age_brackets text[] DEFAULT NULL,
  p_economic_classes text[] DEFAULT NULL,
  
  -- Transaction behavior filters
  p_customer_types text[] DEFAULT NULL,
  p_payment_methods text[] DEFAULT NULL,
  p_request_modes text[] DEFAULT NULL,
  p_request_types text[] DEFAULT NULL,
  p_store_types text[] DEFAULT NULL,
  
  -- Range filters
  p_min_basket_size integer DEFAULT NULL,
  p_max_basket_size integer DEFAULT NULL,
  p_min_transaction_value numeric DEFAULT NULL,
  p_max_transaction_value numeric DEFAULT NULL,
  p_min_handshake_score numeric DEFAULT NULL,
  p_max_handshake_score numeric DEFAULT NULL,
  
  -- Boolean filters
  p_suggestion_accepted boolean DEFAULT NULL,
  p_campaign_influenced boolean DEFAULT NULL,
  
  -- Pagination & Limits
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0
)  
RETURNS TABLE(
  transaction_id uuid,
  store_id uuid,
  transaction_timestamp timestamptz,
  transaction_date date,
  time_of_day text,
  is_weekend boolean,
  region_name text,
  province_name text,
  city_name text,
  barangay_name text,
  store_type text,
  product_category text,
  brand_name text,
  sku text,
  is_tbwa_client boolean,
  brand_owner text,
  units_per_transaction integer,
  peso_value numeric,
  basket_size integer,
  handshake_score numeric,
  gender text,
  age_bracket text,
  economic_class text,
  customer_type text,
  payment_method text,
  campaign_influenced boolean,
  suggestion_accepted boolean,
  request_mode text,
  request_type text
) 
LANGUAGE sql 
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    t.transaction_id,
    t.store_id,
    t.timestamp::timestamptz as transaction_timestamp,
    t.timestamp::date as transaction_date,
    t.time_of_day::text,
    t.is_weekend,
    s.region as region_name,
    s.province as province_name,
    s.city as city_name,
    s.barangay as barangay_name,
    s.store_type::text,
    t.product_category,
    t.brand_name,
    t.sku,
    b.is_tbwa_client,
    b.brand_owner,
    t.units_per_transaction,
    t.peso_value,
    t.basket_size,
    t.handshake_score,
    t.gender::text,
    t.age_bracket::text,
    t.economic_class::text,
    t.customer_type::text,
    t.payment_method::text,
    t.campaign_influenced,
    t.suggestion_accepted,
    t.request_mode::text,
    t.request_type::text
  FROM scout.silver_transactions_cleaned t
  JOIN scout.silver_master_stores s ON t.store_id = s.store_id
  LEFT JOIN scout.silver_master_brands b ON t.brand_name = b.brand_name
  WHERE 
    -- Date filters
    (p_date_from IS NULL OR t.timestamp::date >= p_date_from)
    AND (p_date_to IS NULL OR t.timestamp::date <= p_date_to)
    
    -- Time of day filter
    AND (p_time_of_day IS NULL OR t.time_of_day::text = ANY(p_time_of_day))
    
    -- Day type filter
    AND (p_day_type = 'all' OR 
         (p_day_type = 'weekend' AND t.is_weekend = true) OR
         (p_day_type = 'weekday' AND t.is_weekend = false))
    
    -- Geographic filters
    AND (p_regions IS NULL OR s.region = ANY(p_regions))
    AND (p_provinces IS NULL OR s.province = ANY(p_provinces))
    AND (p_cities IS NULL OR s.city = ANY(p_cities))
    AND (p_barangays IS NULL OR s.barangay = ANY(p_barangays))
    
    -- Product & Brand filters
    AND (p_categories IS NULL OR t.product_category = ANY(p_categories))
    AND (p_brands IS NULL OR t.brand_name = ANY(p_brands))
    AND (p_products IS NULL OR t.sku = ANY(p_products))
    AND (p_brand_owners IS NULL OR b.brand_owner = ANY(p_brand_owners))
    AND (p_tbwa_clients_only IS NULL OR b.is_tbwa_client = p_tbwa_clients_only)
    
    -- Demographic filters
    AND (p_genders IS NULL OR t.gender::text = ANY(p_genders))
    AND (p_age_brackets IS NULL OR t.age_bracket::text = ANY(p_age_brackets))
    AND (p_economic_classes IS NULL OR t.economic_class::text = ANY(p_economic_classes))
    
    -- Behavioral filters
    AND (p_customer_types IS NULL OR t.customer_type::text = ANY(p_customer_types))
    AND (p_payment_methods IS NULL OR t.payment_method::text = ANY(p_payment_methods))
    AND (p_request_modes IS NULL OR t.request_mode::text = ANY(p_request_modes))
    AND (p_request_types IS NULL OR t.request_type::text = ANY(p_request_types))
    AND (p_store_types IS NULL OR s.store_type::text = ANY(p_store_types))
    
    -- Range filters
    AND (p_min_basket_size IS NULL OR t.basket_size >= p_min_basket_size)
    AND (p_max_basket_size IS NULL OR t.basket_size <= p_max_basket_size)
    AND (p_min_transaction_value IS NULL OR t.peso_value >= p_min_transaction_value)
    AND (p_max_transaction_value IS NULL OR t.peso_value <= p_max_transaction_value)
    AND (p_min_handshake_score IS NULL OR t.handshake_score >= p_min_handshake_score)
    AND (p_max_handshake_score IS NULL OR t.handshake_score <= p_max_handshake_score)
    
    -- Boolean filters
    AND (p_suggestion_accepted IS NULL OR t.suggestion_accepted = p_suggestion_accepted)
    AND (p_campaign_influenced IS NULL OR t.campaign_influenced = p_campaign_influenced)
    
  ORDER BY t.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- =====================================================
-- FILTER OPTIONS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_scout_filter_options_scout()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := jsonb_build_object(
    'temporal', jsonb_build_object(
      'timeOfDay', ARRAY['morning', 'afternoon', 'evening', 'night'],
      'dayTypes', ARRAY['all', 'weekday', 'weekend']
    ),
    'geographic', jsonb_build_object(
      'regions', COALESCE((
        SELECT jsonb_agg(DISTINCT region ORDER BY region) 
        FROM scout.silver_master_stores 
        WHERE region IS NOT NULL
      ), '[]'::jsonb),
      'provinces', COALESCE((
        SELECT jsonb_agg(DISTINCT province ORDER BY province)
        FROM scout.silver_master_stores 
        WHERE province IS NOT NULL
      ), '[]'::jsonb),
      'cities', COALESCE((
        SELECT jsonb_agg(DISTINCT city ORDER BY city)
        FROM scout.silver_master_stores 
        WHERE city IS NOT NULL
      ), '[]'::jsonb),
      'storeTypes', COALESCE((
        SELECT jsonb_agg(DISTINCT store_type::text ORDER BY store_type::text)
        FROM scout.silver_master_stores 
        WHERE store_type IS NOT NULL
      ), '[]'::jsonb)
    ),
    'products', jsonb_build_object(
      'categories', COALESCE((
        SELECT jsonb_agg(DISTINCT product_category ORDER BY product_category)
        FROM scout.silver_transactions_cleaned
        WHERE product_category IS NOT NULL
      ), '[]'::jsonb),
      'brands', COALESCE((
        SELECT jsonb_agg(DISTINCT 
          jsonb_build_object(
            'name', b.brand_name,
            'owner', b.brand_owner,
            'isTbwaClient', b.is_tbwa_client
          ) ORDER BY b.brand_name
        )
        FROM scout.silver_master_brands b
        WHERE b.brand_name IS NOT NULL
      ), '[]'::jsonb)
    ),
    'demographics', jsonb_build_object(
      'genders', ARRAY['male', 'female', 'other', 'unknown'],
      'ageBrackets', ARRAY['<18', '18-24', '25-34', '35-44', '45-54', '55+'],
      'economicClasses', ARRAY['A', 'B', 'C', 'D', 'E', 'unknown']
    ),
    'behaviors', jsonb_build_object(
      'customerTypes', ARRAY['walkin', 'regular', 'vip', 'other'],
      'paymentMethods', ARRAY['cash', 'gcash', 'maya', 'credit_card', 'other'],
      'requestModes', ARRAY['in_person', 'phone', 'sms', 'point', 'other'],
      'requestTypes', ARRAY['branded', 'unbranded', 'unsure']
    )
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- GEOGRAPHIC CASCADE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_scout_geographic_cascade_scout(
  p_region text DEFAULT NULL,
  p_province text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT jsonb_build_object(
    'regions', COALESCE((
      SELECT jsonb_agg(DISTINCT region ORDER BY region)
      FROM scout.silver_master_stores
      WHERE region IS NOT NULL
    ), '[]'::jsonb),
    'provinces', COALESCE((
      SELECT jsonb_agg(DISTINCT province ORDER BY province)
      FROM scout.silver_master_stores
      WHERE (p_region IS NULL OR region = p_region)
      AND province IS NOT NULL
    ), '[]'::jsonb),
    'cities', COALESCE((
      SELECT jsonb_agg(DISTINCT city ORDER BY city)
      FROM scout.silver_master_stores
      WHERE (p_region IS NULL OR region = p_region)
      AND (p_province IS NULL OR province = p_province)
      AND city IS NOT NULL
    ), '[]'::jsonb),
    'barangays', COALESCE((
      SELECT jsonb_agg(DISTINCT barangay ORDER BY barangay)
      FROM scout.silver_master_stores
      WHERE (p_region IS NULL OR region = p_region)
      AND (p_province IS NULL OR province = p_province)
      AND (p_city IS NULL OR city = p_city)
      AND barangay IS NOT NULL
    ), '[]'::jsonb)
  );
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_scout_filtered_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_scout_filter_options TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_scout_geographic_cascade TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION get_scout_filtered_transactions IS 'Main filterable transaction data function for Scout Dashboard with 25+ filter dimensions';
COMMENT ON FUNCTION get_scout_filter_options IS 'Returns all available filter options from Scout master data tables';
COMMENT ON FUNCTION get_scout_geographic_cascade IS 'Returns cascading geographic options based on parent selection';

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for filter performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_scout_trans_date ON scout.silver_transactions_cleaned(timestamp);
CREATE INDEX IF NOT EXISTS idx_scout_trans_store ON scout.silver_transactions_cleaned(store_id);
CREATE INDEX IF NOT EXISTS idx_scout_trans_brand ON scout.silver_transactions_cleaned(brand_name);
CREATE INDEX IF NOT EXISTS idx_scout_trans_category ON scout.silver_transactions_cleaned(product_category);
CREATE INDEX IF NOT EXISTS idx_scout_stores_region ON scout.silver_master_stores(region);
CREATE INDEX IF NOT EXISTS idx_scout_stores_province ON scout.silver_master_stores(province);
CREATE INDEX IF NOT EXISTS idx_scout_stores_city ON scout.silver_master_stores(city);
CREATE INDEX IF NOT EXISTS idx_scout_brands_tbwa ON scout.silver_master_brands(is_tbwa_client);

-- =====================================================
-- FILTER USAGE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS scout_filter_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    filter_config JSONB NOT NULL,
    results_count INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filter_analytics_user ON scout_filter_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_analytics_created ON scout_filter_analytics(created_at);

-- Track filter usage
CREATE OR REPLACE FUNCTION track_filter_usage_scout(
  p_user_id UUID,
  p_filters JSONB,
  p_results_count INTEGER,
  p_execution_time_ms INTEGER
) RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
AS $$
  INSERT INTO scout_filter_analytics (user_id, filter_config, results_count, execution_time_ms)
  VALUES (p_user_id, p_filters, p_results_count, p_execution_time_ms);
$$;

GRANT EXECUTE ON FUNCTION track_filter_usage TO authenticated;
GRANT INSERT ON scout_filter_analytics TO authenticated;
