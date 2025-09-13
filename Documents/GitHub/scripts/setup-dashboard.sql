-- First, create the exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;

-- Now create the dashboard metrics function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  filter_categories text[] DEFAULT NULL,
  filter_brands int[] DEFAULT NULL,
  filter_locations text[] DEFAULT NULL,
  date_from timestamp DEFAULT NULL,
  date_to timestamp DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH filtered_transactions AS (
    SELECT t.*
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE 
      (filter_categories IS NULL OR b.category = ANY(filter_categories))
      AND (filter_brands IS NULL OR b.id = ANY(filter_brands))
      AND (filter_locations IS NULL OR t.store_location = ANY(filter_locations))
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  ),
  daily_stats AS (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as daily_revenue
    FROM filtered_transactions
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  ),
  top_bundle AS (
    SELECT 
      string_agg(p.name, ' + ' ORDER BY p.name) as bundle_name,
      COUNT(*) as bundle_count
    FROM (
      SELECT t.id, array_agg(p.name ORDER BY p.name) as products
      FROM filtered_transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      GROUP BY t.id
      HAVING COUNT(*) >= 2
    ) bundles
    GROUP BY products
    ORDER BY bundle_count DESC
    LIMIT 1
  )
  SELECT json_build_object(
    'totalRevenue', COALESCE(SUM(total_amount), 0),
    'totalTransactions', COUNT(DISTINCT id),
    'avgTransaction', COALESCE(AVG(total_amount), 0),
    'dailyStats', (
      SELECT json_agg(json_build_object(
        'date', date,
        'transactionCount', transaction_count,
        'revenue', daily_revenue
      ))
      FROM daily_stats
    ),
    'topBundle', (
      SELECT json_build_object(
        'name', bundle_name,
        'count', bundle_count,
        'percentage', ROUND((bundle_count::float / COUNT(DISTINCT id) * 100)::numeric, 1)
      )
      FROM top_bundle, filtered_transactions
    )
  ) INTO result
  FROM filtered_transactions;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(text[], int[], text[], timestamp, timestamp) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(text[], int[], text[], timestamp, timestamp) TO anon;

-- Test the function
SELECT get_dashboard_metrics(); 