-- Get metrics for specific category
CREATE OR REPLACE FUNCTION get_category_metrics(category_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    WITH category_transactions AS (
      SELECT DISTINCT t.*
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      JOIN brands b ON p.brand_id = b.id
      WHERE b.category = category_name
    ),
    bundle_data AS (
      SELECT 
        t.id,
        string_agg(p.name, ' + ' ORDER BY p.name) as bundle_name,
        COUNT(DISTINCT p.id) as product_count
      FROM category_transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      GROUP BY t.id
      HAVING COUNT(DISTINCT p.id) >= 2
    ),
    top_bundle AS (
      SELECT 
        bundle_name,
        COUNT(*) as bundle_count
      FROM bundle_data
      GROUP BY bundle_name
      ORDER BY bundle_count DESC
      LIMIT 1
    )
    SELECT json_build_object(
      'totalRevenue', COALESCE(SUM(total_amount), 0),
      'totalTransactions', COUNT(*),
      'avgTransaction', COALESCE(AVG(total_amount), 0),
      'topBundle', (
        SELECT json_build_object(
          'name', COALESCE(bundle_name, 'No bundles in ' || category_name),
          'count', COALESCE(bundle_count, 0),
          'percentage', COALESCE(ROUND(bundle_count::float / COUNT(*) * 100, 1), 0)
        )
        FROM top_bundle, category_transactions
      )
    )
    FROM category_transactions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_category_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_metrics(text) TO anon; 