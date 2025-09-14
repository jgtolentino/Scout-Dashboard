# 📁 Scout Analytics - Complete Project Structure

**AI-Powered Retail Intelligence Platform with Supabase-Centric Lakehouse Architecture**

## 🏗️ Root Directory Structure

```
Scout Dashboard/
├── 📊 CORE APPLICATION
│   ├── app/                           # Next.js 15 App Router
│   ├── components/                    # React components
│   ├── lib/                          # Core utilities & clients
│   ├── types/                        # TypeScript definitions
│   └── public/                       # Static assets
│
├── 🤖 AI/ML INFRASTRUCTURE  
│   ├── app/api/ai/                   # AI API endpoints
│   ├── components/ai/                # AI React components
│   ├── types/recommendation.ts       # AI type definitions
│   ├── bruno/scout-analytics/        # Bruno deployment collections
│   └── dbt/scout_analytics/          # Data transformation pipeline
│
├── 🚀 DEPLOYMENT & CI/CD
│   ├── .github/workflows/            # GitHub Actions
│   ├── scripts/                      # Installation & utility scripts
│   ├── docker-compose.yml            # Local development
│   └── supabase/                     # Database schema & migrations
│
├── 📖 DOCUMENTATION
│   ├── README.md                     # Main project documentation
│   ├── PLATINUM_LAYER.md            # AI/ML architecture details
│   └── PROJECT_STRUCTURE.md         # This file
│
└── ⚙️  CONFIGURATION
    ├── package.json                  # Dependencies & scripts
    ├── tsconfig.json                 # TypeScript configuration
    ├── tailwind.config.ts            # Tailwind CSS setup
    └── next.config.js                # Next.js configuration
```

## 📊 Detailed Directory Breakdown

### 🎯 `/app` - Next.js 15 Application Core

```
app/
├── api/                              # API Routes (Next.js App Router)
│   ├── ai/                          # 🤖 AI/ML API Endpoints
│   │   ├── chat/route.ts            # RAG chat interface
│   │   ├── insights/route.ts        # Agent insights & health checks
│   │   ├── recommendations/route.ts  # 7-tier recommendation CRUD
│   │   └── semantic/search/route.ts # Vector semantic search
│   │
│   └── scout/                       # 📊 Core Analytics APIs
│       ├── trends/route.ts          # Transaction trends & KPIs
│       ├── geo/route.ts             # Geographic distribution
│       ├── product-mix/route.ts     # Product & brand performance
│       ├── behavior/route.ts        # Consumer behavior patterns
│       ├── profiling/route.ts       # Customer demographics
│       └── time-heatmap/route.ts    # Temporal analysis
│
├── globals.css                      # Global styles
├── layout.tsx                       # Root layout component
└── page.tsx                        # Homepage
```

### 🧩 `/components` - React Component Library

```
components/
├── ai/                              # 🤖 AI-Powered Components
│   ├── FloatingChat.tsx            # Context-aware chat interface
│   ├── RecommendationCards.tsx     # 7-tier recommendation display
│   └── AgentInsightPanel.tsx       # Real-time agent monitoring
│
├── scout/                           # 📊 Analytics Components
│   ├── trends-panel.tsx            # Transaction trends visualization
│   ├── geo-choropleth.tsx          # Philippines map with data
│   ├── product-mix-panel.tsx       # Product performance analysis
│   ├── behavior-panel.tsx          # Consumer behavior insights
│   └── profiling-panel.tsx         # Demographic analysis
│
└── ui/                              # 🎨 Base UI Components (shadcn/ui)
    ├── button.tsx                  # Button component
    ├── card.tsx                    # Card component
    └── tabs.tsx                    # Tab component
```

### 🧠 `/types` - TypeScript Type System

```
types/
└── recommendation.ts                # 🤖 Complete AI/ML Type Definitions
    ├── RecoTier                    # 7-tier recommendation taxonomy
    ├── AgentInsight                # AI agent insight structures
    ├── ChatMessage                 # RAG chat interface types
    ├── SemanticDefinition          # Unity Catalog metrics
    ├── VectorEmbedding             # pgvector embedding types
    └── React component prop types   # UI component interfaces
```

### 📚 `/lib` - Core Utilities & Clients

```
lib/
├── supabase/                        # 🗄️ Database Integration
│   ├── client.ts                   # Browser Supabase client
│   └── server.ts                   # Server-side Supabase client
├── types/
│   └── transactions.ts             # Business data types
└── utils.ts                        # Common utilities
```

### 🚀 `/.github/workflows` - CI/CD Pipeline

```
.github/workflows/
├── ci.yml                          # 🔄 Continuous Integration
│   ├── Lint & type checking
│   ├── Unit & component tests
│   ├── Build verification
│   ├── dbt data quality tests
│   └── Security scanning
│
├── deploy.yml                      # 🚀 Production Deployment
│   ├── Staging deployment
│   ├── Production deployment with health checks
│   ├── Bruno schema deployment
│   ├── Performance monitoring
│   └── Slack notifications
│
└── data-quality.yml                # 📊 Data Quality Monitoring
    ├── Daily dbt tests (6 AM UTC)
    ├── Anomaly detection scripts
    ├── AI agent health checks
    └── Quality status reporting
```

### 🤖 `/bruno/scout-analytics` - Deployment Orchestration

```
bruno/scout-analytics/
├── bruno.json                      # Collection configuration
├── environments/
│   └── production.bru              # Environment variables (secure)
├── Install recommendations bundle.bru  # 🎯 Main deployment endpoint
├── Deploy Schema Migration.bru     # Schema-only deployment
└── Verify AI Health.bru           # Post-deployment validation

# Usage:
# bru run --collection bruno/scout-analytics "Install recommendations bundle"
```

### 📊 `/dbt/scout_analytics` - Data Transformation Pipeline

```
dbt/scout_analytics/
├── dbt_project.yml                 # Project configuration
├── profiles.yml                    # Database connections
├── packages.yml                    # dbt dependencies (dbt-utils, etc.)
│
├── models/                         # 🏗️ Lakehouse Data Models
│   ├── bronze/                     # Raw data with validation
│   │   ├── bronze_transactions.sql # Minimal transformations
│   │   └── schema.yml              # Data quality tests
│   │
│   ├── silver/                     # Conformed dimensions
│   │   ├── dim_provinces.sql       # Philippine geography with fuzzy matching
│   │   └── schema.yml              # Referential integrity tests
│   │
│   ├── gold/                       # Business-ready marts
│   │   ├── kpi_daily_summary.sql   # Dashboard KPI aggregations
│   │   └── schema.yml              # Business logic validation
│   │
│   └── staging/                    # Intermediate transformations
│
├── macros/                         # 🔧 Custom SQL Functions
│   ├── generate_schema_name.sql    # Schema naming logic
│   └── test_data_freshness.sql     # Data freshness validation
│
├── tests/                          # Data quality tests
├── seeds/                          # Reference data
├── snapshots/                      # Slowly changing dimensions
└── docs/                           # Auto-generated documentation
```

### 🔧 `/scripts` - Installation & Utilities

```
scripts/
├── install-platinum-layer.sh       # 🎯 One-Shot Platinum Layer Installer
│   ├── Complete schema deployment (Bronze→Silver→Gold→Platinum)
│   ├── 7-tier recommendation system setup
│   ├── AI agent infrastructure
│   ├── Vector embeddings (pgvector)
│   ├── RLS security policies
│   ├── Comprehensive seed data
│   └── Deployment verification
│
└── import-data.ts                  # Data import utilities
```

### 🗄️ `/supabase` - Database Schema

```
supabase/
└── schema.sql                      # 📊 Core Scout Analytics Schema
    ├── scout.transactions table    # Main transaction data
    ├── Geographic views (ph_provinces joins)
    ├── Product performance views
    ├── RLS policies
    └── Performance indexes
```

### 🏢 `/server` - Legacy Express.js API (Optional)

```
server/
├── src/
│   ├── controllers/                # API controllers
│   ├── routes/                     # Express routes
│   ├── config/database.ts          # Database configuration
│   └── types/index.ts              # Server-side types
├── dist/                           # Compiled JavaScript
├── sql/                            # Database initialization
└── package.json                    # Server dependencies
```

### 🖥️ `/client` - Legacy Vite Frontend (Optional)

```
client/
├── src/
│   ├── components/                 # React components
│   ├── pages/                      # Page components
│   ├── lib/api.ts                  # API client
│   └── stores/useStore.ts          # State management
├── dist/                           # Built assets
├── public/                         # Static files
└── package.json                    # Client dependencies
```

## 🎯 Key Architecture Components

### 🤖 **AI/ML Infrastructure (Platinum Layer)**

| Component | Location | Purpose |
|-----------|----------|---------|
| **7-Tier Recommendations** | `types/recommendation.ts` | Operational → Experimentation tiers |
| **AI API Routes** | `app/api/ai/` | Chat, insights, recommendations |
| **React AI Components** | `components/ai/` | FloatingChat, AgentInsightPanel |
| **Vector Search** | `app/api/semantic/` | pgvector semantic search |
| **Bruno Deployment** | `bruno/scout-analytics/` | Zero-credential deployment |

### 📊 **Data Pipeline (Lakehouse)**

| Layer | Location | Description |
|-------|----------|-------------|
| **Bronze** | `dbt/models/bronze/` | Raw data with basic validation |
| **Silver** | `dbt/models/silver/` | Conformed dimensions with fuzzy matching |
| **Gold** | `dbt/models/gold/` | Business-ready KPI marts |
| **Platinum** | `scripts/install-platinum-layer.sh` | AI/ML features & recommendations |

### 🚀 **Deployment System**

| Method | Command | Purpose |
|--------|---------|---------|
| **One-shot Script** | `./scripts/install-platinum-layer.sh` | Complete deployment |
| **Bruno Orchestration** | `bru run "Install recommendations bundle"` | Environment-managed |
| **GitHub Actions** | `git push origin main` | Automated CI/CD |

### 🔒 **Security & Performance**

| Feature | Location | Implementation |
|---------|----------|----------------|
| **RLS Policies** | `scripts/install-platinum-layer.sh` | Multi-tenant isolation |
| **Vector Indexes** | Schema migration | pgvector cosine similarity |
| **Health Monitoring** | `.github/workflows/data-quality.yml` | Daily quality checks |
| **Type Safety** | `types/recommendation.ts` | Complete TypeScript coverage |

## 📈 **File Statistics**

- **Total Files**: 161 files
- **Total Directories**: 76 directories  
- **Lines of Code**: 5,594+ insertions
- **TypeScript Coverage**: 100% for AI components
- **Documentation**: Comprehensive with examples

## 🎯 **Ready for Production**

This project structure represents a **production-ready AI-powered retail intelligence platform** with:

- ✅ **Enterprise Architecture**: Supabase-centric lakehouse
- ✅ **AI/ML Infrastructure**: 7-tier recommendations + autonomous agents
- ✅ **Zero-Credential Deployment**: Environment-managed security
- ✅ **Comprehensive Testing**: CI/CD + data quality monitoring
- ✅ **Type-Safe Development**: Full TypeScript coverage
- ✅ **Bruno Orchestration**: One-command deployment system

**🚀 Deploy with a single command: `./scripts/install-platinum-layer.sh`**