-- Add columns needed for comprehensive TBWA client seeding
-- Only adds if they don't already exist

DO $$
BEGIN
  -- Add sku_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scout_transactions' 
    AND column_name = 'sku_name'
  ) THEN
    ALTER TABLE public.scout_transactions ADD COLUMN sku_name TEXT;
  END IF;

  -- Add location columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scout_transactions' 
    AND column_name = 'location_city'
  ) THEN
    ALTER TABLE public.scout_transactions ADD COLUMN location_city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scout_transactions' 
    AND column_name = 'location_barangay'
  ) THEN
    ALTER TABLE public.scout_transactions ADD COLUMN location_barangay TEXT;
  END IF;

  -- Add is_jti_brand if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'scout_transactions' 
    AND column_name = 'is_jti_brand'
  ) THEN
    ALTER TABLE public.scout_transactions ADD COLUMN is_jti_brand BOOLEAN DEFAULT false;
  END IF;

  -- Create index on is_jti_brand for performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'scout_transactions' 
    AND indexname = 'idx_scout_transactions_is_jti_brand'
  ) THEN
    CREATE INDEX idx_scout_transactions_is_jti_brand ON public.scout_transactions(is_jti_brand);
  END IF;

  -- Create composite index for market share queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'scout_transactions' 
    AND indexname = 'idx_scout_transactions_market_share'
  ) THEN
    CREATE INDEX idx_scout_transactions_market_share 
    ON public.scout_transactions(is_tbwa_client, is_jti_brand, product_category);
  END IF;

END $$;

-- Create a view for market share analysis
CREATE OR REPLACE VIEW public.v_market_share_analysis AS
WITH category_totals AS (
  SELECT 
    CASE 
      WHEN product_category = 'Tobacco' THEN 'Tobacco'
      ELSE 'FMCG'
    END as market_segment,
    COUNT(*) as total_transactions,
    SUM(peso_value) as total_revenue
  FROM public.scout_transactions
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY 1
),
tbwa_totals AS (
  SELECT 
    CASE 
      WHEN product_category = 'Tobacco' THEN 'Tobacco'
      ELSE 'FMCG'
    END as market_segment,
    COUNT(*) FILTER (WHERE is_tbwa_client = true) as tbwa_transactions,
    SUM(peso_value) FILTER (WHERE is_tbwa_client = true) as tbwa_revenue,
    COUNT(*) FILTER (WHERE is_jti_brand = true) as jti_transactions,
    SUM(peso_value) FILTER (WHERE is_jti_brand = true) as jti_revenue
  FROM public.scout_transactions
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY 1
)
SELECT 
  ct.market_segment,
  ct.total_transactions,
  ct.total_revenue,
  COALESCE(tt.tbwa_transactions, 0) as tbwa_transactions,
  COALESCE(tt.tbwa_revenue, 0) as tbwa_revenue,
  CASE 
    WHEN ct.market_segment = 'FMCG' THEN 
      ROUND(100.0 * COALESCE(tt.tbwa_transactions, 0) / NULLIF(ct.total_transactions, 0), 1)
    ELSE 
      ROUND(100.0 * COALESCE(tt.jti_transactions, 0) / NULLIF(ct.total_transactions, 0), 1)
  END as market_share_pct,
  CASE 
    WHEN ct.market_segment = 'FMCG' THEN 19.0
    ELSE 39.0
  END as target_share_pct
FROM category_totals ct
LEFT JOIN tbwa_totals tt ON ct.market_segment = tt.market_segment;

-- Create a function to_scout check seeding data quality
CREATE OR REPLACE FUNCTION public.check_seeding_quality_scout()
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      COUNT(DISTINCT location_region) as regions_count,
      COUNT(DISTINCT location_city) as cities_count,
      COUNT(DISTINCT brand_name) as brands_count,
      COUNT(DISTINCT sku) as skus_count,
      AVG(CASE WHEN is_tbwa_client AND product_category != 'Tobacco' THEN 1 ELSE 0 END) * 100 as fmcg_share,
      AVG(CASE WHEN is_jti_brand THEN 1 ELSE 0 END) * 100 as jti_share
    FROM public.scout_transactions
    WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
  )
  SELECT 'Regions Covered'::TEXT, regions_count::NUMERIC, 
    CASE WHEN regions_count >= 15 THEN 'GOOD' ELSE 'NEEDS IMPROVEMENT' END
  FROM metrics
  UNION ALL
  SELECT 'Cities Covered'::TEXT, cities_count::NUMERIC,
    CASE WHEN cities_count >= 50 THEN 'GOOD' ELSE 'NEEDS IMPROVEMENT' END
  FROM metrics
  UNION ALL
  SELECT 'Unique Brands'::TEXT, brands_count::NUMERIC,
    CASE WHEN brands_count >= 8 THEN 'GOOD' ELSE 'NEEDS IMPROVEMENT' END
  FROM metrics
  UNION ALL
  SELECT 'Unique SKUs'::TEXT, skus_count::NUMERIC,
    CASE WHEN skus_count >= 40 THEN 'GOOD' ELSE 'NEEDS IMPROVEMENT' END
  FROM metrics
  UNION ALL
  SELECT 'TBWA FMCG Share %'::TEXT, ROUND(fmcg_share, 1),
    CASE WHEN fmcg_share BETWEEN 17 AND 21 THEN 'GOOD' ELSE 'NEEDS ADJUSTMENT' END
  FROM metrics
  UNION ALL
  SELECT 'JTI Tobacco Share %'::TEXT, ROUND(jti_share, 1),
    CASE WHEN jti_share BETWEEN 37 AND 41 THEN 'GOOD' ELSE 'NEEDS ADJUSTMENT' END
  FROM metrics;
END;
$$ LANGUAGE plpgsql;