-- Create function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN json_build_object(
    'totalRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM transactions),
    'totalTransactions', (SELECT COUNT(*) FROM transactions),
    'avgTransaction', (SELECT COALESCE(AVG(total_amount), 0) FROM transactions),
    'totalBrands', (SELECT COUNT(*) FROM brands),
    'totalProducts', (SELECT COUNT(*) FROM products),
    'tbwaBrands', (SELECT COUNT(*) FROM brands WHERE is_tbwa = true),
    'nonTbwaBrands', (SELECT COUNT(*) FROM brands WHERE is_tbwa = false)
  );
END;
$$; 