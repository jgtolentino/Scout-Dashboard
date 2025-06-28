import { Request, Response } from 'express';
import pool from '../config/database';

export const getSalesData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId, region } = req.query;
    
    let query = `
      SELECT 
        DATE(st.transaction_date) as date,
        s.store_name,
        s.store_type,
        g.region,
        g.city_municipality,
        COUNT(st.id) as transactions,
        SUM(st.total_amount) as total_sales,
        AVG(st.total_amount) as avg_transaction
      FROM sales_transactions st
      JOIN stores s ON st.store_id = s.id
      JOIN geography g ON s.geography_id = g.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (startDate) {
      query += ' AND st.transaction_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND st.transaction_date <= ?';
      params.push(endDate);
    }
    
    if (storeId) {
      query += ' AND st.store_id = ?';
      params.push(storeId);
    }
    
    if (region) {
      query += ' AND g.region = ?';
      params.push(region);
    }
    
    query += ' GROUP BY DATE(st.transaction_date), s.id ORDER BY date DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export const getSalesSummary = async (_req: Request, res: Response) => {
  try {
    const [summary] = await pool.query(`
      SELECT 
        COUNT(DISTINCT DATE(transaction_date)) as days_active,
        COUNT(id) as total_transactions,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_transaction_value,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(DISTINCT store_id) as active_stores
      FROM sales_transactions
      WHERE transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    `);
    
    res.json((summary as any)[0]);
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
};

export const getSalesTrends = async (req: Request, res: Response) => {
  try {
    const { period = '7' } = req.query;
    
    const [trends] = await pool.query(`
      SELECT 
        DATE(transaction_date) as date,
        COUNT(id) as transactions,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT customer_id) as customers
      FROM sales_transactions
      WHERE transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE(transaction_date)
      ORDER BY date ASC
    `, [period]);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ error: 'Failed to fetch sales trends' });
  }
};