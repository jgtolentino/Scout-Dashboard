# Scout Dashboard - AI-Powered Analytics Platform

> **Premium Scout Analytics** with AI-powered insights, role-based access, and enterprise-grade deployment pipeline.

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend && npm ci
cd ../api && npm ci

# Run locally
cd ../frontend && npm run dev  # Frontend on http://localhost:3000
cd ../api && func host start  # API on http://localhost:7071
```

## 📂 Monorepo Structure

```
tools/js/                    ← Current directory (Scout Dashboard root)
├── frontend/               ← React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── api/                    ← Azure Functions (Node 20/TypeScript)
│   ├── premium-insights/
│   ├── transactions/
│   ├── analytics/
│   ├── product-mix/
│   ├── stores/
│   └── host.json
│
├── scripts/                ← Deployment & automation scripts
│   ├── deploy_production.sh
│   ├── verify_deployment.sh
│   └── rollback_deployment.sh
│
├── docs/                   ← Documentation & guides
│   ├── CLEANUP_CHECKLIST.md
│   └── ARCHITECTURE.md
│
├── .github/workflows/      ← CI/CD pipelines
│   └── azure-static-web-apps.yml
│
├── staticwebapp.config.json ← Azure SWA configuration
└── README.md               ← This file
```

## 🎯 Scout Dashboard Features

### 🔥 5 Analytics Modules

1. **Transaction Trends** - Real-time sales data with historical analysis
2. **Geographic Heatmap** - Store performance by location with Philippine regions
3. **Product Mix Analysis** - Top products, brand performance, category insights
4. **Consumer Behavior** - Shopping patterns, demographics, sentiment analysis
5. **Customer Profiling** - RFM segmentation, lifetime value, behavioral clustering

### 🤖 AI-Powered Insights (Premium)

- **Azure OpenAI GPT-4o** integration for intelligent recommendations
- **Role-based access** - Gold/Platinum users only
- **Predictive analytics** and trend forecasting
- **Custom business intelligence** reports

## 🛡️ Enterprise Features

- **Azure AD/Entra ID** authentication
- **RBAC** role-based access control
- **Security hardening** (CORS, HSTS, CSP headers)
- **Performance monitoring** with Lighthouse CI
- **Comprehensive testing** (Jest + Playwright)

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run ESLint
npm test        # Run Jest tests
```

### API Development
```bash
cd api
func host start --cors "*"  # Start Azure Functions locally
npm test                    # Run API tests
```

### Deployment
```bash
# Production deployment with pre-flight checks
bash scripts/deploy_production.sh

# Verify deployment health
bash scripts/verify_deployment.sh

# Rollback if needed
bash scripts/rollback_deployment.sh
```

## 🌐 Live Deployment

**Production URL**: https://thankful-sea-06d26c00f.6.azurestaticapps.net

### API Endpoints
- `/api/premium-insights` - AI-powered business insights (Premium)
- `/api/transactions/trends` - Sales trend analysis
- `/api/transactions/heatmap` - Geographic sales data
- `/api/analytics/behavior` - Consumer behavior patterns
- `/api/analytics/profiling` - Customer RFM analysis
- `/api/product-mix` - Product and brand performance
- `/api/stores/nearby` - Store location services

## 🎨 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **API** | Azure Functions + Node.js 20 + TypeScript |
| **AI/ML** | Azure OpenAI GPT-4o + Custom Analytics |
| **Database** | Azure SQL + Azure Cosmos DB |
| **Auth** | Azure AD/Entra ID + RBAC |
| **Hosting** | Azure Static Web Apps |
| **CI/CD** | GitHub Actions + Azure DevOps |
| **Testing** | Jest + Playwright + Lighthouse CI |

## 🔐 Security & Compliance

- **HTTPS Everywhere** with security headers
- **CORS** policy enforcement
- **Rate limiting** and DDoS protection
- **Secret management** via Azure Key Vault
- **Audit logging** and compliance tracking

## 📊 Analytics & Monitoring

- **Application Insights** for telemetry
- **Performance budgets** with Lighthouse CI
- **Error tracking** and alerting
- **User behavior analytics**

## 🧹 Repository Benefits

✅ **Clean structure** - No more 492K+ unwanted file changes  
✅ **Proper CI/CD** - GitHub Actions work without conflicts  
✅ **Better collaboration** - Clear structure for developers  
✅ **Scalable** - Easy to add features and maintain  
✅ **Enterprise-ready** - Production deployment pipeline  

## 📚 Documentation

- [Cleanup Checklist](docs/CLEANUP_CHECKLIST.md) - Repository migration guide
- [Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [API Reference](docs/API.md) - Complete endpoint documentation

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test locally
3. Run tests: `npm test` (frontend) and `npm test` (api)
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Create Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for enterprise-grade analytics and AI-powered business insights.**

🚀 **Auto-approved deployment pipeline** - Push to `main` triggers production deployment.