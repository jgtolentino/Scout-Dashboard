-- Function to get brand performance data
CREATE OR REPLACE FUNCTION get_brand_performance(
  filter_categories text[] DEFAULT NULL,
  filter_brands int[] DEFAULT NULL,
  filter_locations text[] DEFAULT NULL,
  date_from timestamp DEFAULT NULL,
  date_to timestamp DEFAULT NULL,
  limit_count int DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    WITH filtered_transactions AS (
      SELECT DISTINCT t.*, b.id as brand_id, b.name as brand_name, b.category
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      JOIN brands b ON p.brand_id = b.id
      WHERE 
        (filter_categories IS NULL OR b.category = ANY(filter_categories))
        AND (filter_brands IS NULL OR b.id = ANY(filter_brands))
        AND (filter_locations IS NULL OR t.store_location = ANY(filter_locations))
        AND (date_from IS NULL OR t.created_at >= date_from)
        AND (date_to IS NULL OR t.created_at <= date_to)
    )
    SELECT json_agg(brand_data)
    FROM (
      SELECT 
        brand_id,
        brand_name,
        category,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue,
        ROUND(AVG(total_amount)::numeric, 2) as avg_transaction,
        ROUND((SUM(total_amount) / NULLIF((SELECT SUM(total_amount) FROM filtered_transactions), 0) * 100)::numeric, 2) as market_share
      FROM filtered_transactions
      GROUP BY brand_id, brand_name, category
      ORDER BY total_revenue DESC
      LIMIT limit_count
    ) brand_data
  );
END;
$$;

-- Function to get top brands
CREATE OR REPLACE FUNCTION get_top_brand()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'id', b.id,
      'name', b.name,
      'revenue', SUM(t.total_amount),
      'transactionCount', COUNT(DISTINCT t.id)
    )
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    GROUP BY b.id, b.name
    ORDER BY SUM(t.total_amount) DESC
    LIMIT 1
  );
END;
$$;

-- Function to get filter options
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'categories', (
      SELECT json_agg(DISTINCT category ORDER BY category)
      FROM brands
      WHERE category IS NOT NULL
    ),
    'brands', (
      SELECT json_agg(json_build_object(
        'id', id,
        'name', name,
        'category', category
      ) ORDER BY name)
      FROM brands
    ),
    'locations', (
      SELECT json_agg(DISTINCT store_location ORDER BY store_location)
      FROM transactions
      WHERE store_location IS NOT NULL
    )
  );
END;
$$;

-- Create a comprehensive dashboard metrics function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  filter_categories text[] DEFAULT NULL,
  filter_brands text[] DEFAULT NULL,
  filter_locations text[] DEFAULT NULL,
  date_from timestamp DEFAULT NULL,
  date_to timestamp DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  filtered_transactions RECORD;
  total_revenue numeric;
  total_transactions bigint;
  avg_transaction numeric;
  top_bundle json;
  daily_stats json;
BEGIN
  -- Get filtered transactions
  WITH filtered_transactions AS (
    SELECT DISTINCT t.*
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN brands b ON p.brand_id = b.id
    WHERE 
      -- Apply category filter
      (filter_categories IS NULL OR b.category = ANY(filter_categories))
      -- Apply brand filter
      AND (filter_brands IS NULL OR b.id::text = ANY(filter_brands))
      -- Apply location filter
      AND (filter_locations IS NULL OR t.location = ANY(filter_locations))
      -- Apply date range filter
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  ),
  -- Calculate bundle data
  bundle_data AS (
    SELECT 
      t.id,
      string_agg(p.name, ' + ' ORDER BY p.name) as bundle_name,
      COUNT(DISTINCT p.id) as product_count
    FROM filtered_transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    GROUP BY t.id
    HAVING COUNT(DISTINCT p.id) >= 2
  ),
  -- Get top bundle
  top_bundle_data AS (
    SELECT 
      bundle_name,
      COUNT(*) as bundle_count
    FROM bundle_data
    GROUP BY bundle_name
    ORDER BY bundle_count DESC
    LIMIT 1
  ),
  -- Calculate daily stats
  daily_stats_data AS (
    SELECT 
      date_trunc('day', created_at) as date,
      SUM(total_amount) as revenue,
      COUNT(*) as transactions
    FROM filtered_transactions
    GROUP BY date_trunc('day', created_at)
    ORDER BY date
  )
  SELECT 
    SUM(total_amount) as total_revenue,
    COUNT(*) as total_transactions,
    AVG(total_amount) as avg_transaction,
    (
      SELECT json_build_object(
        'name', COALESCE(bundle_name, 'No bundles found'),
        'count', COALESCE(bundle_count, 0),
        'percentage', COALESCE(ROUND(bundle_count::float / COUNT(*) * 100, 1), 0)
      )
      FROM top_bundle_data, filtered_transactions
    ) as top_bundle,
    (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'revenue', revenue,
          'transactions', transactions
        )
      )
      FROM daily_stats_data
    ) as daily_stats
  INTO filtered_transactions
  FROM filtered_transactions;

  -- Return the results
  RETURN json_build_object(
    'totalRevenue', COALESCE(filtered_transactions.total_revenue, 0),
    'totalTransactions', COALESCE(filtered_transactions.total_transactions, 0),
    'avgTransaction', COALESCE(filtered_transactions.avg_transaction, 0),
    'topBundle', filtered_transactions.top_bundle,
    'dailyStats', COALESCE(filtered_transactions.daily_stats, '[]'::json)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_brand_performance(text[], int[], text[], timestamp, timestamp, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_performance(text[], int[], text[], timestamp, timestamp, int) TO anon;
GRANT EXECUTE ON FUNCTION get_top_brand() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_brand() TO anon;
GRANT EXECUTE ON FUNCTION get_filter_options() TO authenticated;
GRANT EXECUTE ON FUNCTION get_filter_options() TO anon;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(text[], text[], text[], timestamp, timestamp) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(text[], text[], text[], timestamp, timestamp) TO anon; 