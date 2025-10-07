import { Request, Response } from 'express';
import pool from '../config/database';

export const getStores = async (req: Request, res: Response) => {
  try {
    const { region, city, storeType } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.store_code,
        s.store_name,
        s.store_type,
        s.address,
        g.region,
        g.city_municipality,
        g.barangay,
        s.is_active
      FROM stores s
      JOIN geography g ON s.geography_id = g.id
      WHERE s.is_active = true
    `;
    
    const params: any[] = [];
    
    if (region) {
      query += ' AND g.region = ?';
      params.push(region);
    }
    
    if (city) {
      query += ' AND g.city_municipality = ?';
      params.push(city);
    }
    
    if (storeType) {
      query += ' AND s.store_type = ?';
      params.push(storeType);
    }
    
    query += ' ORDER BY s.store_name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

export const getStoreDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const store = await pool.query(`
      SELECT 
        s.*,
        g.region,
        g.city_municipality,
        g.barangay,
        g.latitude,
        g.longitude
      FROM stores s
      JOIN geography g ON s.geography_id = g.id
      WHERE s.id = ?
    `, [id]);
    
    if (!store.rows[0]) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    return res.json(store.rows[0]);
  } catch (error) {
    console.error('Error fetching store details:', error);
    return res.status(500).json({ error: 'Failed to fetch store details' });
  }
};

export const getStorePerformance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query;
    
    const performance = await pool.query(`
      SELECT 
        DATE(st.transaction_date) as date,
        COUNT(st.id) as transactions,
        SUM(st.total_amount) as revenue,
        COUNT(DISTINCT st.customer_id) as unique_customers,
        AVG(st.total_amount) as avg_transaction
      FROM sales_transactions st
      WHERE st.store_id = ? 
        AND st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE(st.transaction_date)
      ORDER BY date DESC
    `, [id, period]);
    
    const topProducts = await pool.query(`
      SELECT 
        p.product_name,
        p.brand,
        SUM(sd.quantity) as units_sold,
        SUM(sd.total_price) as revenue
      FROM sales_transactions st
      JOIN sales_details sd ON st.id = sd.transaction_id
      JOIN products p ON sd.product_id = p.id
      WHERE st.store_id = ?
        AND st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `, [id, period]);
    
    res.json({
      dailyPerformance: performance.rows,
      topProducts: topProducts.rows
    });
  } catch (error) {
    console.error('Error fetching store performance:', error);
    res.status(500).json({ error: 'Failed to fetch store performance' });
  }
};