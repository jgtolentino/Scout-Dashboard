# 🚀 Quick Start Guide

## What We've Built

A clean, modern Transaction Trends PoC with:

- ✅ React + TypeScript frontend with Recharts
- ✅ Azure Functions API (TypeScript)
- ✅ Full CI/CD pipeline
- ✅ Production-ready structure
- ✅ Automated migration scripts

## Directory Structure

```
/tools/js/
├── pulser-poc/          # Your clean PoC (YOU ARE HERE)
│   ├── frontend/        # React app
│   ├── api/            # Azure Functions
│   ├── scripts/        # Migration tools
│   └── .github/        # CI/CD
└── [old files]         # Legacy code to be replaced
```

## 🎯 Next Steps

### 1. Test Locally

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/pulser-poc
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:7071/api/transactions

### 2. Deploy to Azure (Optional)

```bash
# Set your Azure token
export AZURE_STATIC_WEB_APPS_API_TOKEN=your_token
npm run deploy
```

### 3. When Ready to Replace Old Code

```bash
cd scripts
./migrate-to-production.sh
```

This will:

1. Backup current code to a branch
2. Clean out old files
3. Move PoC to main location
4. Set up production environment

### 4. If Something Goes Wrong

```bash
./rollback-migration.sh
```

## 📁 What Each Script Does

| Script                     | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `migrate-to-production.sh` | Main migration (backup → clean → copy → commit) |
| `rollback-migration.sh`    | Emergency rollback to backup branch             |
| `post-migration-setup.sh`  | Set up production environment                   |
| `verify-production.sh`     | Health checks and verification                  |
| `quick-deploy.sh`          | Quick Azure deployment                          |

## ⚡ Commands Reference

```bash
# Development
npm run dev         # Start local servers
npm run build       # Build for production
npm run lint        # Check code quality
npm run format      # Auto-format code

# Deployment
npm run deploy      # Deploy to Azure

# Migration (when ready)
./scripts/migrate-to-production.sh
```

## 🔍 Verification

Before migration, ensure:

- [ ] Local dev server works
- [ ] Build completes without errors
- [ ] Linting passes
- [ ] You have Azure deployment token

## 💡 Pro Tips

1. **Test everything locally first**
2. **The migration script will ask for confirmation**
3. **A backup is automatically created**
4. **Keep the backup branch for 30 days**
5. **Run migration during low-traffic hours**

---

Ready? Start with `npm install` and `npm run dev`!
