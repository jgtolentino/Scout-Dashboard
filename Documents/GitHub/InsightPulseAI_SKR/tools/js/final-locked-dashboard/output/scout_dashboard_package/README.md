# 🧭 Scout Dashboard Deployment (Azure Power BI Style)

## 🛠 What's Inside
- Full `insights_dashboard_v2.html` for Azure
- Tailwind-compatible CSS patch
- Unified GenAI JS logic
- Azure SWA deploy script
- GitHub CI/CD YAML (optional)
- All docs for design/style parity

## 🚀 Deploy
```bash
# Using the deployment script
chmod +x deploy_power_bi_styled.sh
./deploy_power_bi_styled.sh
```

## 🌐 Azure CLI Direct Deploy (Optional)
```bash
# Using Azure CLI directly
chmod +x deployment/manual_az_cli.sh
./deployment/manual_az_cli.sh
```

## 🤖 GitHub CI/CD (Optional)
Place the file `deployment/GITHUB_WORKFLOW_SWA.yml` in your repository at `.github/workflows/` to enable automatic deployment on push to main.

## 📖 Documentation
- `docs/POWER_BI_STYLE_GUIDE.md` - Complete style guide
- `deployment/DEPLOYMENT_INSTRUCTIONS.md` - Detailed deployment instructions

## 🎯 Azure Deployment Context
- App Name: `tbwa-juicer-insights-dashboard`
- Resource Group: `RG-TBWA-ProjectScout-Juicer`
- Region: East US 2

*Package created: $(date +"%Y-%m-%d")*
