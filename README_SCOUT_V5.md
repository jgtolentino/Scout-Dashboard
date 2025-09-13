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
