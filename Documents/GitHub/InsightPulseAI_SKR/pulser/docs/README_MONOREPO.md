# Pulser Monorepo

> **One-repo, one source of truth** for your Scout Dashboard (frontend + Azure Functions + infra + scripts).

## 🚀 Getting Started

```bash
git clone https://github.com/your-user/pulser.git
cd pulser

# 1. Pre-migration (if coming from legacy layout):
bash scripts/migrate_to_monorepo.sh

# 2. Install dependencies
cd frontend && npm ci
cd ../api && npm ci

# 3. Run locally
# 3a. Frontend
cd ../frontend
npm run dev

# 3b. API
cd ../api
func host start
```

## 📂 Structure

```
pulser/
├── frontend/        ← React 18 + Vite + Tailwind CSS app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── api/             ← Azure Functions (Node 20/TypeScript)
│   ├── premium-insights/
│   ├── transactions/
│   ├── analytics/
│   ├── product-mix/
│   ├── geo-heatmap/
│   └── host.json
│
├── scripts/         ← Deployment, QA & migration utilities
│   ├── preflight_checks.sh
│   ├── deploy_production.sh
│   ├── verify_deployment.sh
│   ├── rollback_deployment.sh
│   └── migrate_to_monorepo.sh
│
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml
│   └── ISSUE_TEMPLATE/
│
├── docs/
│   ├── CLEANUP_CHECKLIST.md
│   ├── ARCHITECTURE.md
│   └── AI_POWERED_TUTORING.md
│
├── .gitignore
├── README.md
├── LICENSE
└── tsconfig.json
```

## 🏗️ Architecture

### Frontend (`frontend/`)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Premium UI components
- **Features**: 5 analytics modules, role-based access, responsive design
- **Deployment**: Azure Static Web Apps

### API (`api/`)
- **Runtime**: Azure Functions (Node 20/TypeScript)
- **Endpoints**: 7 API routes for analytics data
- **AI Integration**: Azure OpenAI GPT-4o for premium insights
- **Security**: CORS, rate limiting, role-based gating

### Scripts (`scripts/`)
- **Deployment**: Production deployment with rollback
- **Health Checks**: Pre-flight validation and post-deploy verification
- **Migration**: Tools for repository cleanup and restructuring

## 🔧 CI/CD Pipeline

Uses GitHub Actions in `.github/workflows/ci-cd.yml`:

- **Build & Test**: Both `frontend` and `api` components
- **Security**: Guardrail checks, secret validation
- **Deploy**: Azure Static Web Apps on push to `main`
- **Monitoring**: Performance budgets, API health checks
- **Rollback**: Automatic rollback on deployment failures

## 📊 Scout Dashboard Features

### 1. Transaction Trends Analysis
- Real-time sales data visualization
- Historical trend analysis
- Peak hours identification

### 2. Geographic Heatmap
- Store performance by location
- Regional sales distribution
- Geographic market insights

### 3. Product Mix Analysis
- Top-performing products
- Brand performance metrics
- Category distribution analysis

### 4. Consumer Behavior Analysis
- Shopping pattern insights
- Customer demographics
- Sentiment analysis

### 5. Customer Profiling & RFM
- RFM segmentation (Recency, Frequency, Monetary)
- Customer lifetime value
- Behavioral clustering

## 🎯 Premium Features (Gold/Platinum)

- **AI-Powered Insights**: GPT-4o generated recommendations
- **Advanced Analytics**: Predictive modeling and forecasting
- **Custom Reports**: Tailored business intelligence
- **Priority Support**: Dedicated technical assistance

## 🛡️ Security & Compliance

- **Authentication**: Azure AD/Entra ID integration
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: HTTPS, CORS, security headers
- **Compliance**: Enterprise-grade security hardening

## 🧹 Migration & Cleanup

See `docs/CLEANUP_CHECKLIST.md` for step-by-step instructions to:
- Migrate from legacy repository structure
- Clean up unwanted files and folders
- Set up proper CI/CD pipeline
- Eliminate GitHub Desktop file chaos (492K+ changes → manageable)

## 🚀 Deployment

### Local Development
```bash
# Start API server
cd api && func host start

# Start frontend (new terminal)
cd frontend && npm run dev
```

### Production Deployment
```bash
# Run pre-flight checks
bash scripts/preflight_checks.sh

# Deploy to production
bash scripts/deploy_production.sh

# Verify deployment
bash scripts/verify_deployment.sh
```

## 📚 Documentation

- **Architecture**: `docs/ARCHITECTURE.md`
- **Cleanup Guide**: `docs/CLEANUP_CHECKLIST.md`
- **AI Integration**: `docs/AI_POWERED_TUTORING.md`
- **API Reference**: Auto-generated from OpenAPI specs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for enterprise-grade analytics and AI-powered insights.**