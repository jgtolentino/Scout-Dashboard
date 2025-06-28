import { Request, Response } from 'express';
import pool from '../config/database';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, search } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.sku,
        p.product_name,
        p.brand,
        p.unit_price,
        c.category_name,
        p.is_active
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    
    const params: any[] = [];
    
    if (category) {
      query += ' AND c.category_name = ?';
      params.push(category);
    }
    
    if (brand) {
      query += ' AND p.brand = ?';
      params.push(brand);
    }
    
    if (search) {
      query += ' AND (p.product_name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.product_name';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductPerformance = async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query;
    
    const [performance] = await pool.query(`
      SELECT 
        p.sku,
        p.product_name,
        p.brand,
        c.category_name,
        COUNT(DISTINCT sd.transaction_id) as transactions,
        SUM(sd.quantity) as units_sold,
        SUM(sd.total_price) as revenue,
        AVG(sd.unit_price) as avg_price,
        (SUM(sd.total_price) - SUM(sd.quantity * p.cost)) as profit
      FROM products p
      JOIN sales_details sd ON p.id = sd.product_id
      JOIN sales_transactions st ON sd.transaction_id = st.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY p.id
      ORDER BY revenue DESC
    `, [period]);
    
    res.json(performance);
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ error: 'Failed to fetch product performance' });
  }
};

export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const { limit = '10', metric = 'revenue' } = req.query;
    
    let orderBy = 'revenue';
    if (metric === 'quantity') orderBy = 'units_sold';
    if (metric === 'transactions') orderBy = 'transaction_count';
    
    const [topProducts] = await pool.query(`
      SELECT 
        p.sku,
        p.product_name,
        p.brand,
        c.category_name,
        COUNT(DISTINCT sd.transaction_id) as transaction_count,
        SUM(sd.quantity) as units_sold,
        SUM(sd.total_price) as revenue
      FROM products p
      JOIN sales_details sd ON p.id = sd.product_id
      JOIN sales_transactions st ON sd.transaction_id = st.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE st.transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY p.id
      ORDER BY ${orderBy} DESC
      LIMIT ?
    `, [parseInt(limit as string)]);
    
    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};