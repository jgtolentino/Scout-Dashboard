import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from 'observability/log';
import { validateEnv } from 'config/env';
import uploadRouter from './api/routes/upload.ts';
import { createFileValidator } from './api/middleware/fileValidation.ts';
import { authenticateToken } from './api/middleware/auth.ts';

// Load and validate environment variables
dotenv.config();
const env = validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definitions
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected';
    medallion: 'active' | 'inactive';
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  filters?: Record<string, any>;
}

interface ExecutiveKPIs {
  revenue_mtd: number;
  revenue_growth_mom: number;
  active_stores: number;
  top_performing_products: string[];
  market_share: number;
  customer_satisfaction: number;
}

interface StoreAnalytics {
  store_id: string;
  store_name: string;
  region: string;
  revenue: number;
  performance_score: number;
}

interface BrandPerformance {
  brand_id: string;
  brand_name: string;
  category: string;
  performance_score: number;
  market_share: number;
  growth_rate: number;
  revenue: number;
}

interface MarketIntelligence {
  insight_id: string;
  insight_type: string;
  insight_data: Record<string, any>;
  insight_date: string;
  confidence_score: number;
}

// Initialize Express with TypeScript
const app: Application = express();
const PORT: number = env.PORT || 3000;

// Initialize Supabase client with types
const supabase: SupabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  res.locals.requestId = requestId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('info', 'HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint with proper typing
app.get('/health', async (req: Request, res: Response<HealthResponse>) => {
  try {
    // Test database connection
    const { error } = await supabase.from('campaigns').select('id').limit(1);
    const dbStatus = error ? 'disconnected' : 'connected';
    
    const health: HealthResponse = {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: dbStatus,
        medallion: 'active'
      }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    log('error', 'Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: 'disconnected',
        medallion: 'inactive'
      }
    });
  }
});

// Scout v5.0 Medallion Architecture API Routes with proper typing

// Executive KPIs Endpoint
app.get('/api/v5/kpis/executive', async (req: Request, res: Response<ApiResponse<ExecutiveKPIs>>) => {
  try {
    const { data: kpis, error } = await supabase
      .from('gold_executive_kpis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const response: ApiResponse<ExecutiveKPIs> = {
      success: true,
      data: kpis || {
        revenue_mtd: 0,
        revenue_growth_mom: 0,
        active_stores: 0,
        top_performing_products: [],
        market_share: 0,
        customer_satisfaction: 0
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    log('error', 'Executive KPI Error', { error, requestId: res.locals.requestId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch executive KPIs',
      timestamp: new Date().toISOString()
    });
  }
});

// Store Analytics Endpoint
app.get('/api/v5/analytics/stores', async (req: Request, res: Response<ApiResponse<StoreAnalytics[]>>) => {
  try {
    const { region, timeframe = '30d' } = req.query as { region?: string; timeframe?: string };
    
    let query = supabase
      .from('silver_store_analytics')
      .select('*');
    
    if (region) {
      query = query.eq('region', region);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;

    const response: ApiResponse<StoreAnalytics[]> = {
      success: true,
      data: data || [],
      filters: { region, timeframe },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    log('error', 'Store Analytics Error', { error, requestId: res.locals.requestId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Brand Performance Endpoint
app.get('/api/v5/analytics/brands', async (req: Request, res: Response<ApiResponse<BrandPerformance[]>>) => {
  try {
    const { brand_id, category } = req.query as { brand_id?: string; category?: string };
    
    let query = supabase
      .from('gold_brand_performance')
      .select('*');
    
    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('performance_score', { ascending: false })
      .limit(20);
    
    if (error) throw error;

    const response: ApiResponse<BrandPerformance[]> = {
      success: true,
      data: data || [],
      filters: { brand_id, category },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    log('error', 'Brand Analytics Error', { error, requestId: res.locals.requestId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Market Intelligence Endpoint
app.get('/api/v5/intelligence/market', async (req: Request, res: Response<ApiResponse<MarketIntelligence[]>>) => {
  try {
    const { data, error } = await supabase
      .from('gold_market_intelligence')
      .select('*')
      .order('insight_date', { ascending: false })
      .limit(10);
    
    if (error) throw error;

    const response: ApiResponse<MarketIntelligence[]> = {
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    log('error', 'Market Intelligence Error', { error, requestId: res.locals.requestId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market intelligence',
      timestamp: new Date().toISOString()
    });
  }
});

// ZIP Upload Routes with validation
app.use('/api/v5', uploadRouter);

// Serve static files from React build
app.use(express.static(join(__dirname, 'apps/web/build')));

// Fallback to React app for client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, 'apps/web/build', 'index.html'));
});

// Error handling middleware with proper typing
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log('error', 'Server Error', { 
    error: err.message, 
    stack: err.stack,
    requestId: res.locals.requestId,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  log('info', 'Server started', {
    port: PORT,
    environment: env.NODE_ENV,
    version: '5.0.0'
  });
  
  console.log(`
🚀 Scout Dashboard v5.0 Server Running
📍 Port: ${PORT}
🌍 Environment: ${env.NODE_ENV}
🏗️  Medallion Architecture: Active
📊 API Base: http://localhost:${PORT}/api/v5
🔗 Health Check: http://localhost:${PORT}/health
`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  log('info', `${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    log('error', 'Forcing server shutdown');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log('error', 'Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});