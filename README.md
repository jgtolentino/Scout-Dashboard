# Scout Analytics - AI-Powered Retail Intelligence Platform

A next-generation analytics platform for retail businesses with autonomous AI agents, natural language chat interface, and comprehensive recommendation system. Built on a modern Supabase-centric lakehouse architecture.

## 🏗️ Architecture Overview

**Supabase-Centric Lakehouse**: Bronze → Silver → Gold → **Platinum (AI Layer)**

- **Bronze**: Raw data landings with minimal processing
- **Silver**: Conformed, clean data with proper typing  
- **Gold**: Business-ready marts (facts, dimensions, KPIs)
- **Platinum**: AI/ML features, recommendations, and autonomous insights

## 🤖 AI-Powered Capabilities

### 7-Tier Recommendation System
| Tier | Horizon | Owner | Example |
|------|---------|-------|---------|
| **Operational** | Hours-7d | Store Lead | Replenish SKU-123 (OOS in 26h) |
| **Tactical** | 2-12 weeks | Brand Mgr | Shift 20% budget to TikTok |
| **Strategic** | 1-4 quarters | BU Head | Exit bottom 15% SKUs |
| **Transformational** | 1-3 years | CTO/COO | Deploy edge AI nodes |
| **Governance** | Continuous | Compliance | Block unsafe creative |
| **Financial** | 1-12 months | Finance | Optimize pricing (+3%) |
| **Experimentation** | 2-10 weeks | Growth | A/B test 4 CTA variants |

### Autonomous Analytics Agents
- **Sales Performance Agent**: Trend analysis, anomaly detection
- **Inventory Optimization Agent**: Stock forecasting, replenishment
- **Customer Behavior Agent**: Segmentation, churn prediction
- **Geographic Analysis Agent**: Regional performance insights
- **Anomaly Detection Agent**: Real-time issue identification

### Floating RAG Chat Interface
- Natural language queries: *"Show me underperforming stores in Mindanao"*
- Context-aware responses with current dashboard filters
- Multi-turn conversations with session memory
- Export insights directly to dashboard visualizations

## 🚀 Tech Stack

### Frontend (Next.js 15 + App Router)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts for data visualization
- **Maps**: React SVG Maps (Philippines)
- **State**: SWR for server state management
- **AI Chat**: OpenAI/Anthropic integration

### Backend (Supabase + PostgreSQL)
- **Database**: Supabase PostgreSQL with pgvector
- **Real-time**: Supabase subscriptions
- **Auth**: Supabase Auth (optional)
- **Storage**: Supabase Storage for assets
- **Edge Functions**: Server-side API routes
- **Vector Store**: pgvector for RAG embeddings

### AI/ML Stack
- **LLMs**: OpenAI GPT-4, Anthropic Claude
- **Embeddings**: OpenAI ada-002 for RAG
- **Vector Search**: pgvector with cosine similarity
- **Analytics Modes**: Descriptive, Diagnostic, Predictive, Prescriptive

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- OpenAI or Anthropic API key (for AI features)
- Git

## 🏗️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/jgtolentino/agentic-suqi.git
cd scout-dashboard
pnpm install
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Deploy Platinum Layer** (Bruno-orchestrated):
   ```bash
   # Set your Supabase connection URL in environment
   export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   
   # Run the installation script
   ./scripts/install-platinum-layer.sh
   ```

3. **Alternative: Manual Installation**:
   - Go to your Supabase SQL Editor
   - Run the migration from `supabase/migrations/[timestamp]_platinum_layer_complete.sql`
   - Run the seed data from `supabase/seeds/seed_platinum_complete.sql`

4. **Get your Supabase credentials**:
   - Go to Settings → API
   - Copy your Project URL and anon public key
   - Copy your service role key (server-side only)

### 3. Environment Configuration

Create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# AI Configuration
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Scout Analytics"
```

### 4. Start Development Server

```bash
pnpm run dev
```

Visit http://localhost:3000 to see your AI-powered dashboard!

## 🎯 Key Features

### Dashboard Analytics
- **📊 Real-time KPI Tiles**: Sales, transactions, inventory levels
- **🗺️ Philippines Choropleth Map**: Interactive province-level analytics
- **📈 Transaction Trends**: Time-series analysis with forecasting
- **🎯 Product Mix Analysis**: Category/brand performance with Pareto optimization
- **👥 Consumer Profiling**: Demographic analysis and spending patterns
- **⚡ Performance Insights**: Load times, conversion rates, operational metrics

### AI-Powered Intelligence
- **🤖 Autonomous Agents**: 5 specialized agents for continuous monitoring
- **💬 Floating Chat**: Natural language queries with context awareness
- **🎯 Smart Recommendations**: 7-tier system from operational to transformational
- **🔍 Semantic Search**: Vector-powered search across all business data
- **📊 Predictive Analytics**: Forecasting, anomaly detection, trend analysis

### Enterprise Features
- **🔒 Multi-tenant Architecture**: Tenant isolation with RLS policies
- **🏗️ Lakehouse Design**: Bronze→Silver→Gold→Platinum data layers
- **📋 Unity Catalog**: Centralized semantic definitions and metadata
- **🔄 Real-time Updates**: Live data streaming with Supabase subscriptions
- **📱 Mobile Responsive**: Optimized for all device types

## 🚀 Deployment (Bruno-Orchestrated)

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Scout Analytics Platinum layer"
   git push origin main
   ```

2. **Deploy via Bruno** (zero credentials in code):
   ```bash
   # Bruno handles all secrets and deployment
   :bruno run "deploy-scout-vercel"
   ```

3. **Manual Vercel Setup**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

### Environment Variables (Vercel)
Add these in Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### Alternative Platforms
The app works on any Next.js-compatible platform:
- **Netlify**: Full support with serverless functions
- **Railway**: Docker deployment ready
- **DigitalOcean App Platform**: Zero-config deployment
- **AWS Amplify**: Enterprise-grade hosting

## 📡 API Documentation

### Dashboard Analytics APIs
- `GET /api/scout/trends` - Transaction trends and KPIs
- `GET /api/scout/geo` - Geographic distribution data  
- `GET /api/scout/product-mix` - Product and brand performance
- `GET /api/scout/behavior` - Consumer behavior patterns
- `GET /api/scout/profiling` - Customer demographic analysis

### AI/ML APIs
- `POST /api/ai/chat` - Natural language chat interface
- `GET /api/ai/recommendations` - Get recommendations by tier
- `POST /api/ai/recommendations` - Create/update recommendations
- `GET /api/ai/insights` - Agent-generated insights
- `POST /api/semantic/search` - Vector-powered semantic search

### Platinum Layer APIs
- `GET /api/platinum/metrics` - Semantic metric definitions
- `POST /api/platinum/embeddings` - Generate embeddings
- `GET /api/platinum/models` - Model registry information

## 🗄️ Database Schema (Supabase PostgreSQL)

### Lakehouse Architecture
- **`bronze.*`** - Raw data landings (JSONB, flexible schema)
- **`silver.*`** - Conformed dimensions (ph_provinces, master_brands, master_categories)
- **`gold.*`** - Business marts (fact_transactions, aggregated views)
- **`platinum.*`** - AI/ML tables (recommendations, embeddings, agents)

### Core Tables
- **`scout.transactions`** - Main transaction records with RLS
- **`scout.recommendations`** - 7-tier recommendation system
- **`platinum.agent_insights`** - AI agent discoveries
- **`platinum.chat_conversations`** - RAG chat history
- **`platinum.embeddings`** - Vector store (pgvector)
- **`platinum.semantic_definitions`** - Unity Catalog metrics

### Production Integration
- Leverages existing dimensional tables (`ph_provinces`, `master_brands`)
- Views automatically join with master data for consistency
- RLS policies ensure tenant isolation and security

## 📚 Additional Documentation

- **[Platinum Layer Architecture](./PLATINUM_LAYER.md)** - AI/ML system details
- **[Lakehouse Guide](./LAKEHOUSE_ARCHITECTURE.md)** - Data architecture patterns
- **[AI Chat Interface](./AI_CHAT_INTERFACE.md)** - RAG system implementation
- **[Setup Guide](./SETUP.md)** - Detailed installation instructions
- **[API Reference](./API.md)** - Complete API documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/ai-enhancement`)
3. Commit your changes (`git commit -m 'feat: add semantic search'`)
4. Push to the branch (`git push origin feature/ai-enhancement`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Credits

- Built with [Next.js 15](https://nextjs.org/) and [Supabase](https://supabase.com/)
- AI powered by [OpenAI](https://openai.com/) and [Anthropic](https://anthropic.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Philippines map data from [@svg-maps/philippines](https://github.com/VictorCazanave/svg-maps)
- Charts powered by [Recharts](https://recharts.org/)

---

**🎉 Ready to transform your retail analytics with AI!**

For questions or support, please create an issue in the repository or contact the development team.