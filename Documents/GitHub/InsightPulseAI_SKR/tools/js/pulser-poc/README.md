# Transaction Trends PoC 📊

A minimal proof-of-concept dashboard showing transaction trends with a React frontend and Azure Functions API.

## 🚀 Quick Start

```bash
# Clone and navigate
cd pulser-poc

# Install all dependencies
npm install

# Run locally (frontend + API)
npm run dev

# Format code
npm run format

# Lint code
npm run lint

# Deploy to Azure
npm run deploy
```

## 📁 Structure

```
pulser-poc/
├── api/                    # Azure Functions (TypeScript)
│   └── transactions/       # Transaction trends endpoint
├── frontend/              # React + TypeScript + Vite
│   └── src/              # Components and styles
├── scripts/              # Automation scripts
└── .github/workflows/    # CI/CD pipeline
```

## 🛠️ Development

### Local Development

1. Frontend runs on `http://localhost:5173`
2. API runs on `http://localhost:7071/api`
3. Frontend proxies `/api/*` requests to the API

### Key Features

- **Real-time Chart**: 30-day transaction trends
- **Summary Cards**: Total transactions, amount, average
- **Responsive Design**: Works on all devices
- **TypeScript**: Full type safety
- **CI/CD**: Automated testing and deployment

## 🚀 Deployment

### Prerequisites

- Azure subscription
- Azure Static Web Apps resource
- Deployment token (set as `AZURE_STATIC_WEB_APPS_API_TOKEN`)

### Deploy via CLI

```bash
npm run deploy
```

### Deploy via GitHub Actions

Push to `main` branch - the CI/CD pipeline will handle the rest.

## 📋 Available Scripts

| Script           | Description                     |
| ---------------- | ------------------------------- |
| `npm run dev`    | Start local development servers |
| `npm run build`  | Build for production            |
| `npm run lint`   | Run ESLint checks               |
| `npm run format` | Format code with Prettier       |
| `npm run deploy` | Deploy to Azure Static Web Apps |

## 🔧 Configuration

- **Frontend**: `frontend/vite.config.ts`
- **API**: `api/host.json`
- **SWA**: `staticwebapp.config.json`
- **TypeScript**: `tsconfig.json` files
- **Linting**: `.eslintrc.json`
- **Formatting**: `.prettierrc.json`

## 📈 Next Steps

1. ✅ Phase 1: Basic PoC (Complete)
2. 🔄 Phase 2: Add CI/CD and secrets
3. 📊 Phase 3: More visualizations
4. 🔒 Phase 4: Authentication & roles
5. 🚀 Phase 5: Production migration

## 🐛 Troubleshooting

### Port already in use

```bash
kill -9 $(lsof -ti:5173) # Kill frontend
kill -9 $(lsof -ti:7071) # Kill API
```

### Azure deployment fails

1. Check your deployment token
2. Verify Azure subscription
3. Check GitHub Actions logs

### TypeScript errors

```bash
npm run lint:fix  # Auto-fix what's possible
```

## 📝 License

Internal use only - TBWA proprietary
