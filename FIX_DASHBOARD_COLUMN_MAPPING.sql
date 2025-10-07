-- FIX SCOUT DASHBOARD COLUMN MAPPING ISSUES
-- This script creates views and updates to support both old and new column naming conventions
-- Run in Supabase SQL Editor: https://app.supabase.com/project/cxzllzyxwpyptfretryc/sql/new

-- 1. First ensure we have the correct table structure in scout schema
DO $$
BEGIN
    -- Check if silver_transactions_cleaned exists in scout schema
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'scout' 
        AND table_name = 'silver_transactions_cleaned'
    ) THEN
        -- Add missing columns if they don't exist
        ALTER TABLE scout.silver_transactions_cleaned 
        ADD COLUMN IF NOT EXISTS transaction_date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED;
        
        ALTER TABLE scout.silver_transactions_cleaned 
        ADD COLUMN IF NOT EXISTS category TEXT GENERATED ALWAYS AS (COALESCE(product_category, 'Unknown')) STORED;
        
        ALTER TABLE scout.silver_transactions_cleaned 
        ADD COLUMN IF NOT EXISTS total_price NUMERIC GENERATED ALWAYS AS (peso_value) STORED;
    END IF;
END $$;

-- 2. Create or replace the public view with both naming conventions
CREATE OR REPLACE VIEW public.silver_transactions_cleaned AS
SELECT 
    id,
    store_id,
    timestamp,
    DATE(timestamp) as transaction_date,  -- Add expected column
    time_of_day,
    location,
    product_category,
    product_category as category,  -- Duplicate as 'category'
    brand_name,
    sku,
    units_per_transaction,
    peso_value,
    peso_value as total_price,  -- Duplicate as 'total_price'
    basket_size,
    combo_basket,
    request_mode,
    request_type,
    suggestion_accepted,
    gender,
    age_bracket,
    substitution_event,
    duration_seconds,
    campaign_influenced,
    handshake_score,
    is_tbwa_client,
    payment_method,
    customer_type,
    store_type,
    economic_class,
    created_at,
    updated_at,
    COALESCE(data_quality_score, 0.8) as data_quality_score,
    COALESCE(basket_group, 'default') as basket_group,
    EXTRACT(DOW FROM timestamp) IN (0, 6) as is_weekend
FROM scout.silver_transactions_cleaned;

-- 3. Grant permissions
GRANT SELECT ON public.silver_transactions_cleaned TO anon;

-- 4. Create the same for gold_daily_metrics if needed
CREATE OR REPLACE VIEW public.gold_daily_metrics AS
SELECT 
    id,
    metric_date,
    metric_date as date,  -- Alternative naming
    region_code,
    province_code,
    city_code,
    brand_id,
    store_type,
    economic_class,
    total_transactions,
    total_revenue,
    total_revenue as revenue,  -- Alternative naming
    unique_customers,
    avg_basket_size,
    avg_handshake_score,
    campaign_influenced_pct,
    created_at,
    COALESCE(tenant_id, 'default') as tenant_id,
    COALESCE(subscriber_id, 'default') as subscriber_id
FROM scout.gold_daily_metrics;

-- Grant permissions
GRANT SELECT ON public.gold_daily_metrics TO anon;

-- 5. Update RPC functions to handle both column names
CREATE OR REPLACE FUNCTION public.get_category_performance()
RETURNS TABLE (
    category TEXT,
    total_sales NUMERIC,
    transaction_count BIGINT,
    avg_transaction_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(product_category, 'Unknown')::TEXT as category,
        COALESCE(SUM(peso_value), 0) as total_sales,
        COUNT(*)::BIGINT as transaction_count,
        COALESCE(AVG(peso_value), 0) as avg_transaction_value
    FROM public.silver_transactions_cleaned
    WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY product_category
    ORDER BY total_sales DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a catch-all function for flexible queries
CREATE OR REPLACE FUNCTION public.query_silver_transactions(
    filters JSONB DEFAULT '{}',
    columns TEXT[] DEFAULT NULL,
    order_by TEXT DEFAULT 'timestamp DESC',
    limit_rows INT DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
    query TEXT;
    result JSONB;
BEGIN
    -- Build dynamic query
    query := 'SELECT json_agg(row_to_json(t.*)) FROM (SELECT ';
    
    -- Select columns
    IF columns IS NULL OR array_length(columns, 1) IS NULL THEN
        query := query || '*';
    ELSE
        query := query || array_to_string(columns, ', ');
    END IF;
    
    query := query || ' FROM public.silver_transactions_cleaned WHERE true';
    
    -- Apply filters
    IF filters->>'transaction_date' IS NOT NULL THEN
        query := query || format(' AND DATE(timestamp) = %L', (filters->>'transaction_date')::DATE);
    END IF;
    
    IF filters->>'category' IS NOT NULL THEN
        query := query || format(' AND product_category = %L', filters->>'category');
    END IF;
    
    IF filters->>'is_weekend' IS NOT NULL THEN
        query := query || format(' AND is_weekend = %L', (filters->>'is_weekend')::BOOLEAN);
    END IF;
    
    -- Add order and limit
    query := query || format(' ORDER BY %s LIMIT %s) t', order_by, limit_rows);
    
    -- Execute query
    EXECUTE query INTO result;
    
    RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_category_performance() TO anon;
GRANT EXECUTE ON FUNCTION public.query_silver_transactions(JSONB, TEXT[], TEXT, INT) TO anon;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silver_timestamp ON scout.silver_transactions_cleaned(timestamp);
CREATE INDEX IF NOT EXISTS idx_silver_category ON scout.silver_transactions_cleaned(product_category);
CREATE INDEX IF NOT EXISTS idx_silver_weekend ON scout.silver_transactions_cleaned((EXTRACT(DOW FROM timestamp) IN (0, 6)));

-- 8. Verify the fix
DO $$
DECLARE
    view_count INT;
    perm_count INT;
BEGIN
    -- Count views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public' 
    AND table_name IN ('silver_transactions_cleaned', 'gold_daily_metrics');
    
    -- Count permissions
    SELECT COUNT(*) INTO perm_count
    FROM information_schema.table_privileges
    WHERE grantee = 'anon' 
    AND table_schema = 'public'
    AND privilege_type = 'SELECT';
    
    RAISE NOTICE '✅ Column Mapping Fix Complete!';
    RAISE NOTICE '📊 Views created: %', view_count;
    RAISE NOTICE '🔓 Permissions granted: %', perm_count;
    RAISE NOTICE '🎯 Dashboard should now work with both column naming conventions';
    RAISE NOTICE '💡 Test URL: https://cxzllzyxwpyptfretryc.supabase.co/rest/v1/silver_transactions_cleaned?transaction_date=eq.2025-08-03&select=transaction_date,category,total_price';
END $$;