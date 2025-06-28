import { Request, Response } from 'express';
import pool from '../config/database';

export const getDashboardData = async (_req: Request, res: Response) => {
  try {
    // Get key metrics
    const [metrics] = await pool.query(`
      SELECT 
        (SELECT SUM(total_amount) FROM sales_transactions WHERE DATE(transaction_date) = CURRENT_DATE) as today_sales,
        (SELECT SUM(total_amount) FROM sales_transactions WHERE YEARWEEK(transaction_date) = YEARWEEK(CURRENT_DATE)) as week_sales,
        (SELECT SUM(total_amount) FROM sales_transactions WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE) AND YEAR(transaction_date) = YEAR(CURRENT_DATE)) as month_sales,
        (SELECT COUNT(DISTINCT customer_id) FROM sales_transactions WHERE DATE(transaction_date) = CURRENT_DATE) as today_customers,
        (SELECT COUNT(id) FROM sales_transactions WHERE DATE(transaction_date) = CURRENT_DATE) as today_transactions,
        (SELECT COUNT(id) FROM stores WHERE is_active = true) as active_stores
    `);
    
    // Get sales trend for last 7 days
    const [salesTrend] = await pool.query(`
      SELECT 
        DATE(transaction_date) as date,
        SUM(total_amount) as revenue,
        COUNT(id) as transactions
      FROM sales_transactions
      WHERE transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
      GROUP BY DATE(transaction_date)
      ORDER BY date ASC
    `);
    
    // Get top performing stores
    const [topStores] = await pool.query(`
      SELECT 
        s.store_name,
        s.store_type,
        g.city_municipality,
        SUM(st.total_amount) as revenue,
        COUNT(st.id) as transactions
      FROM sales_transactions st
      JOIN stores s ON st.store_id = s.id
      JOIN geography g ON s.geography_id = g.id
      WHERE st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY s.id
      ORDER BY revenue DESC
      LIMIT 5
    `);
    
    // Get category distribution
    const [categoryDistribution] = await pool.query(`
      SELECT 
        c.category_name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(sd.quantity) as units_sold,
        SUM(sd.total_price) as revenue
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN sales_details sd ON p.id = sd.product_id
      JOIN sales_transactions st ON sd.transaction_id = st.id
      WHERE st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY c.id
      ORDER BY revenue DESC
    `);
    
    res.json({
      metrics: (metrics as any)[0],
      salesTrend,
      topStores,
      categoryDistribution
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getGeographicAnalytics = async (req: Request, res: Response) => {
  try {
    const { level = 'region' } = req.query;
    
    let groupBy = 'g.region';
    if (level === 'city') groupBy = 'g.region, g.city_municipality';
    if (level === 'barangay') groupBy = 'g.region, g.city_municipality, g.barangay';
    
    const [geographic] = await pool.query(`
      SELECT 
        g.region,
        ${level !== 'region' ? 'g.city_municipality,' : ''}
        ${level === 'barangay' ? 'g.barangay,' : ''}
        COUNT(DISTINCT s.id) as store_count,
        COUNT(DISTINCT st.customer_id) as customer_count,
        SUM(st.total_amount) as total_revenue,
        COUNT(st.id) as transaction_count,
        AVG(st.total_amount) as avg_transaction_value
      FROM geography g
      JOIN stores s ON g.id = s.geography_id
      JOIN sales_transactions st ON s.id = st.store_id
      WHERE st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY ${groupBy}
      ORDER BY total_revenue DESC
    `);
    
    res.json(geographic);
  } catch (error) {
    console.error('Error fetching geographic analytics:', error);
    res.status(500).json({ error: 'Failed to fetch geographic analytics' });
  }
};

export const getCustomerAnalytics = async (_req: Request, res: Response) => {
  try {
    // Customer segments
    const [segments] = await pool.query(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'High Value'
          WHEN total_spent >= 5000 THEN 'Medium Value'
          ELSE 'Low Value'
        END as segment,
        COUNT(*) as customer_count,
        SUM(total_spent) as total_revenue,
        AVG(total_spent) as avg_revenue,
        AVG(transaction_count) as avg_transactions
      FROM (
        SELECT 
          customer_id,
          COUNT(id) as transaction_count,
          SUM(total_amount) as total_spent
        FROM sales_transactions
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_stats
      GROUP BY segment
      ORDER BY total_revenue DESC
    `);
    
    // Repeat purchase rate
    const [repeatRate] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN transaction_count > 1 THEN 1 END) as repeat_customers,
        COUNT(*) as total_customers,
        COUNT(CASE WHEN transaction_count > 1 THEN 1 END) * 100.0 / COUNT(*) as repeat_rate
      FROM (
        SELECT customer_id, COUNT(id) as transaction_count
        FROM sales_transactions
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_transactions
    `);
    
    res.json({
      segments,
      repeatRate: (repeatRate as any)[0]
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
};