# Project Scout Dashboards

[![Azure Deployment Status](https://img.shields.io/badge/Azure%20Deployment-Live-success)](https://retail-advisor-dashboard.azurewebsites.net)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-Automated-informational)](/.github/workflows/deploy-all.yml)
[![Design System](https://img.shields.io/badge/Design%20System-Unified-blueviolet)](dashboards/shared-theme.css)

A unified repository containing all Project Scout dashboards, following a consistent design system and deployment process.

## ✅ Dashboard Overview

| Dashboard Name                                  | Location                                             | Deployment       | Audience         |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------- | ---------------- |
| **Retail Advisor** (*Scout Advanced Analytics*) | `/dashboards/retail_advisor/`                        | Azure Web App    | **CLIENT-FACING** |
| **Retail Edge Dashboard**                       | `/dashboards/retail_edge/retail_edge_dashboard.html` | Azure Static Web | **INTERNAL ONLY** |
| **System Ops & QA**                             | `/dashboards/qa.html`                                | Azure Static Web | **INTERNAL ONLY** |

## 🎨 Unified Design System

All dashboards share a consistent visual language through the shared theme system:

- **Shared CSS Theme**: `dashboards/shared-theme.css`
- **Design Baseline**: Retail Advisor serves as the UI/UX baseline
- **Consistent Components**: Cards, grids, typography, dark mode, charts
- **Cross-Dashboard Navigation**: All dashboards link to each other

## 📁 Repository Structure

```
project-scout-dashboards/
├── dashboards/
│   ├── retail_advisor/             → React app (Retail Advisor)
│   ├── retail_edge/                → HTML (Retail Edge)
│   ├── qa.html                     → Static (QA Console)
│   └── shared-theme.css            → Global design system
├── deploy/
│   ├── deploy_retail_advisor.sh
│   ├── apply_retail_theme.sh
│   └── README.md
├── .github/
│   └── workflows/
│       └── deploy-all.yml
└── README.md
```

## 🚀 Deployment

### Retail Advisor

The Retail Advisor dashboard is deployed as an Azure Web App:

```bash
# Create Azure Resource Group (if not exists)
az group create \
  --name RG-TBWA-RetailAdvisor \
  --location eastus

# Create App Service Plan (if not exists)
az appservice plan create \
  --name AppServicePlan-RG-TBWA-RetailAdvisor \
  --resource-group RG-TBWA-RetailAdvisor \
  --sku B1 \
  --is-linux

# Deploy Retail Advisor
cd deploy
./deploy_retail_advisor.sh
```

### Retail Edge & QA Dashboard

These dashboards are deployed as Azure Static Web Apps:

```bash
cd deploy
./deploy_static_dashboards.sh
```

### CI/CD Automation

Automated deployments are configured via GitHub Actions:

- `.github/workflows/deploy-all.yml`

## 🛠️ Development

### Local Development

```bash
# Start local development server for Retail Advisor
cd dashboards/retail_advisor
npm install
npm start

# Test static dashboards
cd dashboards
python -m http.server 8080
```

### Updating Shared Theme

When making style changes to any dashboard:

1. Update the shared theme: `dashboards/shared-theme.css`
2. Apply the theme to all dashboards:

```bash
cd deploy
./apply_retail_theme.sh
```

## ⭐ Key Features

### 1. Retail Advisor

**Alias:** *Scout Advanced Analytics (Client-Facing)*  
**Location:** `/dashboards/retail_advisor/`  
**Audience:** TBWA Clients

**Sections:**
- Customer Profile
- Store Performance
- Product Intelligence
- Advanced Analytics

### 2. Retail Edge Dashboard

**Location:** `/dashboards/retail_edge/retail_edge_dashboard.html`  
**Audience:** Internal (TBWA)

**Sections:**
- Device Performance
- Installation Activity
- Signal Health

### 3. System Operations & QA Console

**Location:** `/dashboards/qa.html`  
**Audience:** Developers & QA Engineering

**Sections:**
- Device Health Sync
- Data Confidence Validation
- Architecture Compliance

## 📦 Staging & Development Environments

| Environment | URL                                                       | Purpose                    |
| ----------- | --------------------------------------------------------- | -------------------------- |
| Production  | https://retail-advisor-dashboard.azurewebsites.net        | Live client-facing version |
| Staging     | https://staging-retail-advisor-dashboard.azurewebsites.net | Pre-release testing        |
| Development | https://dev-retail-advisor-dashboard.azurewebsites.net    | Feature development        |

## 📝 License

Proprietary - All rights reserved.