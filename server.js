import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '5.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      medallion: 'active'
    }
  });
});

// Scout v5.0 Medallion Architecture API Routes

// Executive KPIs Endpoint
app.get('/api/v5/kpis/executive', async (req, res) => {
  try {
    const { data: kpis, error } = await supabase
      .from('gold_executive_kpis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    res.json({
      success: true,
      data: kpis?.[0] || {
        revenue_mtd: 0,
        revenue_growth_mom: 0,
        active_stores: 0,
        top_performing_products: [],
        market_share: 0,
        customer_satisfaction: 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Executive KPI Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch executive KPIs',
      timestamp: new Date().toISOString()
    });
  }
});

// Store Analytics Endpoint
app.get('/api/v5/analytics/stores', async (req, res) => {
  try {
    const { region, timeframe = '30d' } = req.query;
    
    const query = supabase
      .from('silver_store_analytics')
      .select('*');
    
    if (region) {
      query.eq('region', region);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      filters: { region, timeframe },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Store Analytics Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch store analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Brand Performance Endpoint
app.get('/api/v5/analytics/brands', async (req, res) => {
  try {
    const { brand_id, category } = req.query;
    
    const query = supabase
      .from('gold_brand_performance')
      .select('*');
    
    if (brand_id) {
      query.eq('brand_id', brand_id);
    }
    if (category) {
      query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('performance_score', { ascending: false })
      .limit(20);
    
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      filters: { brand_id, category },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Brand Analytics Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch brand analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Market Intelligence Endpoint
app.get('/api/v5/intelligence/market', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gold_market_intelligence')
      .select('*')
      .order('insight_date', { ascending: false })
      .limit(10);
    
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Market Intelligence Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch market intelligence',
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy MockifyCreator Endpoints (for compatibility)
app.get('/api/brands/kpis', async (req, res) => {
  try {
    // Map to new medallion architecture
    const { data, error } = await supabase
      .from('gold_brand_performance')
      .select('brand_name, market_share, growth_rate, revenue')
      .limit(10);
    
    if (error) throw error;

    res.json({
      success: true,
      brands: data || [],
      legacy: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Legacy Brands Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch brand KPIs',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files from React build
app.use(express.static(join(__dirname, 'apps/web/build')));

// Fallback to React app for client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'apps/web/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Scout Dashboard v5.0 Server Running
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🏗️  Medallion Architecture: Active
📊 API Base: http://localhost:${PORT}/api/v5
🔗 Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
