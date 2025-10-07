# 🚀 Scout Dashboard v4.0 Azure - Complete Data Pipeline Package

**Enterprise-grade Azure Data Pipeline Integration for Scout Retail Analytics**

---

## 📁 Package Contents

This directory contains the complete Azure data pipeline integration package for Scout Dashboard:

```
scout-mvp/azure-data-pipeline/
├── create-scout-dashboard-azure.sh          # Main automation script
├── link_adls_databricks.sh                  # Azure infrastructure setup
├── Scout_Dashboard_v4_Azure_PRD.md          # Product requirements document
├── scout_dashboard_v4_azure_end_state.yaml  # Complete project specification
├── AUTOMATION_USAGE_GUIDE.md                # Comprehensive usage guide
├── databricks/                              # Databricks notebooks
│   ├── txn_etl.py                           # ETL pipeline (Bronze→Silver→Gold)
│   └── genie_stockbot.py                    # AI insights generator
└── .databricks/                             # Job configurations
    └── jobs/
        ├── etl_job.json                     # ETL job configuration
        └── genie_stockbot_job.json          # AI job configuration
```

---

## 🎯 Quick Start

### 1. Run the Complete Automation
```bash
cd /Users/tbwa/Documents/GitHub/scout-mvp/azure-data-pipeline
./create-scout-dashboard-azure.sh
```

### 2. Set Up Azure Data Pipeline (Optional)
```bash
./link_adls_databricks.sh
```

---

## 🏗️ Architecture Overview

```
Raw Data (ADLS Gen2) → Databricks ETL → Azure PostgreSQL → Next.js Dashboard
                    ↓
              Azure OpenAI GPT-4o → AI Recommendations → Dashboard AI Panel
```

### **Data Flow:**
1. **IoT/CCTV devices** → Raw JSON files → **ADLS Gen2**
2. **Databricks ETL** (nightly) → Bronze → Silver → Gold → **PostgreSQL**
3. **Genie StockBot** (daily 9 AM) → AI analysis → Recommendations → **PostgreSQL**
4. **Next.js Dashboard** → Real-time data display → Live AI insights

---

## 📊 What Gets Created

### **Core Dashboard:**
- **Next.js 15** with TypeScript and Tailwind CSS
- **Azure PostgreSQL** integration with Prisma ORM
- **Real-time KPIs**: Revenue, Orders, Average Order Value
- **Interactive Charts**: Revenue trends, product performance
- **CI/CD Pipeline**: GitHub Actions with Vercel deployment

### **Azure Data Pipeline:**
- **ADLS Gen2 Integration**: Raw data storage and mounting
- **Databricks ETL**: Medallion architecture (Bronze→Silver→Gold)
- **Genie StockBot**: AI-powered insights with Azure OpenAI GPT-4o
- **Automated Scheduling**: Nightly ETL + daily AI analysis

---

## 🔧 Key Features

### **Enterprise-Grade Data Processing:**
- **Medallion Architecture**: Bronze (raw) → Silver (cleaned) → Gold (aggregated)
- **Data Quality Checks**: Automated validation and cleansing
- **Scalable Processing**: Databricks auto-scaling clusters
- **Real-time Updates**: 30-second dashboard refresh

### **AI-Powered Insights:**
- **GPT-4o Integration**: Advanced business recommendations
- **Performance Analysis**: Automated trend identification
- **Daily Insights**: Scheduled AI analysis and recommendations
- **Dashboard Integration**: Live AI panel with actionable insights

### **Production-Ready Features:**
- **Secret Management**: Azure Key Vault integration
- **Monitoring & Alerting**: Comprehensive logging and notifications
- **CI/CD Pipeline**: Automated testing and deployment
- **Error Handling**: Robust retry mechanisms and failure recovery

---

## 📚 Documentation

- **[PRD](Scout_Dashboard_v4_Azure_PRD.md)**: Complete product requirements
- **[End-State YAML](scout_dashboard_v4_azure_end_state.yaml)**: Technical specifications
- **[Usage Guide](AUTOMATION_USAGE_GUIDE.md)**: Comprehensive setup instructions

---

## 🚀 Deployment Options

### **Option 1: Dashboard Only**
Creates a Next.js dashboard with Azure PostgreSQL:
```bash
./create-scout-dashboard-azure.sh
# Choose "N" when asked about Azure Data Pipeline
```

### **Option 2: Complete Data Pipeline**
Creates dashboard + full Azure data pipeline:
```bash
./create-scout-dashboard-azure.sh
# Choose "Y" when asked about Azure Data Pipeline
```

### **Option 3: Infrastructure Setup**
Sets up Azure ADLS + Databricks integration:
```bash
./link_adls_databricks.sh
```

---

## 🔐 Prerequisites

### **Required:**
- Node.js 20+
- Azure PostgreSQL Flexible Server
- Git

### **For Data Pipeline:**
- Azure Data Lake Storage Gen2
- Azure Databricks workspace
- Azure OpenAI service
- Azure Key Vault

---

## 🎉 Expected Results

### **Dashboard:**
- **URL**: http://localhost:3000 (development)
- **Production**: Auto-deployed to Vercel
- **Performance**: <150ms API responses, 90+ Lighthouse score

### **Data Pipeline:**
- **ETL Schedule**: Nightly at 3:15 PM Manila time
- **AI Insights**: Daily at 9:00 AM Manila time
- **Data Latency**: Near real-time (30-second refresh)

---

## 🆘 Support

### **Documentation:**
- Review the comprehensive guides in this directory
- Check the API documentation in the generated project
- Refer to the troubleshooting section in the usage guide

### **Common Issues:**
- **Database Connection**: Verify Azure PostgreSQL connection string
- **Build Errors**: Clear Next.js cache and reinstall dependencies
- **TypeScript Errors**: Regenerate Prisma client

---

## 📈 Next Steps

1. **Run the automation** to create your project
2. **Configure Azure PostgreSQL** connection
3. **Deploy to production** via Vercel
4. **Set up data pipeline** (optional) for enterprise features
5. **Monitor and optimize** performance

---

**🎯 Transform your retail data into actionable insights with Scout Dashboard v4.0 Azure!**

---

*Created: June 18, 2025*  
*Location: `/Users/tbwa/Documents/GitHub/scout-mvp/azure-data-pipeline/`*
