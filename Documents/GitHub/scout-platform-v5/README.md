# Scout Platform v5.2 🚀

**Production-ready retail analytics dashboard with comprehensive mock data and automatic database fallback.**

![Scout Platform](https://img.shields.io/badge/Scout-v5.2-blue) ![Status](https://img.shields.io/badge/Status-Development%20Ready-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## **Current Status** 

🚧 **DEVELOPMENT MODE**: Dashboard fully functional with comprehensive mock data  
✅ **Frontend**: Production-ready Next.js 14 application  
✅ **Database**: Supabase connected with automatic fallback system  
✅ **Build**: TypeScript compilation successful, ready for deployment  

---

## **Quick Start**

### **Prerequisites**
- Node.js 18+ installed
- Access to Supabase project (optional - works with mock data)

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd scout-platform-v5

# Install dependencies
npm install

# Set up environment (optional - works without database)
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### **Access Dashboard**
🌐 **Dashboard URL**: http://localhost:3002/dashboard

The dashboard will automatically detect if database views are available and fall back to comprehensive mock data if not.

---

## **Features**

### **✅ Currently Working**
- **Executive Overview Dashboard** with 8 interactive charts
- **KPI Cards**: Revenue, transactions, market share, customer satisfaction
- **Time-series Charts**: Transaction trends, performance metrics
- **Bar Charts**: Regional performance, campaign ROI, brand comparison
- **Real-time Status Indicators**: System health, data freshness
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Handling**: Graceful degradation with mock data fallback
- **TypeScript**: Full type safety and IntelliSense support

### **🚧 In Development**
- **Database Views**: Gold and Platinum layer views (schema designed)
- **Data Ingestion**: ETL pipeline for real data (architecture complete)
- **SUQI Ask Bar**: Natural language query interface (planned)

---

## **Architecture**

### **Frontend Stack**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Components**: Custom dashboard components with loading states

### **Backend Stack**
- **Database**: Supabase PostgreSQL
- **Schema**: Single `scout.*` consolidated schema
- **Data Layers**: Bronze → Silver → Gold → Platinum (Medallion+ Architecture)
- **API Pattern**: Direct view queries with automatic fallback

### **Data Flow**
```
[Source Data] → [Bronze Tables] → [Silver Views] → [Gold Views] → [Platinum Views] → [Dashboard]
                                                                        ↓
                                                             [Mock Data Fallback]
```

---

## **Dashboard Screenshots**

### **Executive Overview**
The dashboard displays:
- **Revenue Metrics**: ₱125.6M total revenue, 45,238 transactions
- **Market Performance**: 34.2% TBWA market share, 8.7 customer satisfaction
- **Regional Analysis**: 12 regions covered, 1,847 active stores
- **Campaign Performance**: ROI tracking, impression delivery, conversion rates

### **Data Status Indicator**
- 🟢 **OPERATIONAL**: Real database data
- 🔵 **Development Mode**: Using mock data (current state)
- 🔴 **DEGRADED**: Database issues detected

---

## **Development**

### **Available Scripts**
```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Data validation
node scripts/validate-scout-data.js

# Lint code
npm run lint
```

### **Project Structure**
```
scout-platform-v5/
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx       # Main dashboard route
│   │   ├── layout.tsx               # Root layout with metadata
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   └── dashboard/
│   │       └── ExecutiveDashboard.tsx # Main dashboard component
│   ├── lib/
│   │   └── scoutFetch.ts            # API client with fallback
├── docs/
│   ├── SCOUT_V5_ARCHITECTURE.md    # Complete architecture docs
│   └── SCOUT_API_SPECIFICATION.yaml # OpenAPI specification
├── scripts/
│   └── validate-scout-data.js       # Data validation utility
├── .env.local                       # Environment variables
└── README.md                        # This file
```

### **Key Components**

#### **ExecutiveDashboard.tsx**
Main dashboard component with:
- Automatic database connectivity testing
- Mock data fallback system
- 8 interactive charts and KPI cards
- Real-time loading states
- Error boundary with user-friendly messages

#### **scoutFetch.ts**
API client utility with:
- Direct Supabase view queries
- Retry logic and timeout handling
- Comprehensive error handling
- Connection testing methods

---

## **Environment Configuration**

### **Required Environment Variables**
```bash
# Supabase Configuration (optional - works with mock data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=5.2.0
```

### **Database Schema (Planned)**
- `scout.brands` - Brand master data
- `scout.products` - Product catalog
- `scout.stores` - Store directory
- `scout.transactions` - Transaction records
- `scout.user_profiles` - Customer profiles
- **Gold Views**: Analytical aggregations
- **Platinum Views**: Executive KPIs

---

## **Deployment**

### **Vercel Deployment** (Recommended)
```bash
# Build project
npm run build

# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
# Deploy to production
vercel deploy --prod
```

### **Self-Hosted Deployment**
```bash
# Build project
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

---

## **Data Validation**

### **Automatic Validation**
The dashboard includes built-in data validation:
- Database connectivity testing
- View availability checking  
- Automatic fallback to mock data
- User notification of data source

### **Manual Validation**
```bash
# Run comprehensive validation
node scripts/validate-scout-data.js

# Expected output (current state):
# ✅ Supabase connection successful
# ❌ Critical views: 0/5 available
# 🔵 Dashboard: Using mock data
```

---

## **Mock Data**

### **Executive KPIs** (Current Mock Data)
- **Revenue**: ₱125.6M total
- **Transactions**: 45,238 total
- **Market Share**: 34.2% TBWA
- **Satisfaction**: 8.7/10 average
- **Coverage**: 12 regions, 1,847 stores

### **Campaign Data**
- 5 active campaigns with ROI 126%-245%
- Brands: Nike, Adidas, Samsung, Unilever, L'Oreal
- Conversion tracking and impression delivery

### **Regional Performance**
- Metro Manila, Cebu, Davao, Baguio regions
- Revenue growth rates 5.8%-15.2%
- Market share distribution

---

## **API Documentation**

### **Available Endpoints** (When Database Ready)
- `GET /gold_basket_analysis_api` - Daily basket analysis
- `GET /gold_customer_activity_api` - Customer transaction patterns
- `GET /gold_campaign_effect_api` - Campaign performance metrics
- `GET /gold_regional_performance_api` - Regional business metrics
- `GET /platinum_executive_dashboard_api` - Executive KPIs

### **OpenAPI Specification**
See: [`docs/SCOUT_API_SPECIFICATION.yaml`](docs/SCOUT_API_SPECIFICATION.yaml)

---

## **Monitoring & Health Checks**

### **Built-in Health Monitoring**
- Database connectivity testing
- View availability checking
- Response time measurement
- Data freshness validation
- Automatic fallback handling

### **System Status Indicators**
- 🟢 **OPERATIONAL**: All systems working
- 🔵 **DEVELOPMENT**: Using mock data
- 🟡 **DEGRADED**: Partial functionality
- 🔴 **ERROR**: System issues

---

## **Contributing**

### **Development Workflow**
1. Create feature branch from `main`
2. Make changes with TypeScript types
3. Test with `npm run dev`
4. Run validation with `node scripts/validate-scout-data.js`
5. Build and test with `npm run build`
6. Submit pull request

### **Code Style**
- TypeScript required for all new code
- Tailwind CSS for styling
- Component-based architecture
- Error boundary patterns
- Loading state management

---

## **Support & Documentation**

### **Documentation**
- 📖 [Complete Architecture](docs/SCOUT_V5_ARCHITECTURE.md)
- 🔧 [API Specification](docs/SCOUT_API_SPECIFICATION.yaml)
- 🧪 [Data Validation Report](validation-report.json)

### **Troubleshooting**
- **Dashboard not loading**: Check browser console for errors
- **Build failures**: Run `npm run type-check` for TypeScript errors
- **Database issues**: Dashboard will show mock data automatically
- **Environment issues**: Verify `.env.local` configuration

### **Contact**
- **Team**: Scout Platform Team
- **Repository**: GitHub repository
- **Issues**: Create GitHub issue for bugs/features

---

## **Roadmap**

### **Phase 1: Database Layer** (Weeks 1-2)
- [ ] Create database tables and views
- [ ] Implement data ingestion pipeline
- [ ] Test real data integration

### **Phase 2: Production Deployment** (Week 3)
- [ ] Deploy to Vercel production
- [ ] Configure monitoring and alerts
- [ ] Set up automated testing

### **Phase 3: Advanced Features** (Month 2)
- [ ] SUQI Ask Bar (natural language queries)
- [ ] Real-time data refresh
- [ ] Advanced analytics features
- [ ] Mobile app integration

---

**Last Updated**: January 6, 2025  
**Version**: 5.2.0  
**Status**: Development Ready with Mock Data ✅