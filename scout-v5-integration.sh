#!/bin/bash

# Scout Dashboard v5.0 Integration Script
# Transforms MockifyCreator into Scout v5.0 with Medallion Architecture

echo "🚀 Scout Dashboard v5.0 Integration Starting..."

# 1. Create backup of existing files
echo "📦 Creating backups..."
[ -f server.js ] && cp server.js server.js.backup
[ -f package.json ] && cp package.json package.json.backup

# 2. Create Scout v5.0 directory structure
echo "📁 Setting up Scout v5.0 architecture..."
mkdir -p apps/web/{src,public,components,lib,hooks}
mkdir -p apps/api/{routes,middleware,lib}
mkdir -p apps/shared/{types,utils}

# 3. Create enhanced package.json with v5.0 dependencies
cat > package.json << 'EOL'
{
  "name": "scout-dashboard-v5",
  "version": "5.0.0",
  "description": "TBWA Scout Dashboard v5.0 - Medallion Architecture",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "start:prod": "NODE_ENV=production node server.js",
    "dev": "NODE_ENV=development nodemon server.js",
    "build": "cd apps/web && npm run build",
    "install:all": "npm install && cd apps/web && npm install",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "compression": "^1.7.4",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.2.0",
    "@supabase/supabase-js": "^2.45.0",
    "node-cron": "^3.0.3",
    "winston": "^3.13.0",
    "joi": "^17.13.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0",
    "jest": "^29.7.0",
    "eslint": "^8.57.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOL

# 4. Create Scout v5.0 Enhanced Server with Medallion API
cat > server.js << 'EOL'
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
EOL

# 5. Create React Client package.json
mkdir -p apps/web
cat > apps/web/package.json << 'EOL'
{
  "name": "scout-dashboard-web",
  "version": "5.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.1",
    "recharts": "^2.12.7",
    "lucide-react": "^0.396.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.3.1"
  }
}
EOL

# 6. Create environment template
cat > .env.example << 'EOL'
# Scout Dashboard v5.0 Environment Variables

# Supabase Configuration
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=production

# API Configuration
API_VERSION=v5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Medallion Architecture
BRONZE_SCHEMA=bronze
SILVER_SCHEMA=silver
GOLD_SCHEMA=gold

# Feature Flags
ENABLE_LEGACY_API=true
ENABLE_CACHE=true
CACHE_TTL_SECONDS=300
EOL

# 7. Create Vite configuration for React
cat > apps/web/vite.config.ts << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
EOL

# 8. Create basic React app structure
cat > apps/web/src/main.tsx << 'EOL'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
EOL

# 9. Create deployment configuration for Replit
cat > .replit << 'EOL'
run = "npm run start:prod"
hidden = [".build", ".config"]

[packager]
language = "nodejs"

[packager.features]
enabledForHosting = true
packageSearch = true
guessImports = true

[env]
XDG_CONFIG_HOME = "/home/runner/$REPL_SLUG/.config"

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "npm run start:prod"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80
EOL

# 10. Create README for Scout v5.0
cat > README_SCOUT_V5.md << 'EOL'
# Scout Dashboard v5.0

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Build the client
npm run build

# 4. Start the server
npm run start:prod
```

## 📍 API Endpoints

### Executive Dashboard
- `GET /api/v5/kpis/executive` - Executive KPIs
- `GET /api/v5/analytics/stores` - Store performance data
- `GET /api/v5/analytics/brands` - Brand analytics
- `GET /api/v5/intelligence/market` - Market insights

### Legacy Support
- `GET /api/brands/kpis` - MockifyCreator compatibility

## 🏗️ Architecture

```
scout-dashboard-v5/
├── server.js           # Express server with medallion API
├── apps/
│   ├── web/           # React dashboard
│   ├── api/           # API routes
│   └── shared/        # Shared types/utils
└── .env               # Environment configuration
```

## 🔧 Environment Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `PORT` - Server port (default: 3000)

## 🚢 Deployment

### Replit
1. Import repository
2. Set environment variables
3. Deploy → Autoscale

### Manual
```bash
npm run build
npm run start:prod
```
EOL

echo "✅ Scout v5.0 integration complete!"
echo ""
echo "Next steps:"
echo "1. cp .env.example .env"
echo "2. Edit .env with your Supabase credentials"
echo "3. npm run install:all"
echo "4. npm run build"
echo "5. npm run start:prod"
echo ""
echo "Dashboard will be available at http://localhost:3000"
EOL