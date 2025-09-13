# Azure Minimal Setup Budget Projection

## Current Resources (Post-Consolidation)

### 🔒 Core Resources
| Resource | Type | Location | Monthly Cost (USD) |
|----------|------|----------|-------------------|
| `scout-analytics-dashboard` | App Service | West US 2 | $55-75 (Basic B1) |
| `sqltbwaprojectscoutserver` | SQL Server + DB | Australia East | $200-500 (S2-S4) |
| `SQL-TBWA-ProjectScout-Reporting-Prod` | SQL Database | Australia East | $15-150 (Basic-S2) |
| `projectscoutdata` | ADLS Gen2 Storage | East US | $20-50 (1TB data) |
| `kv-projectscout-prod` | Key Vault | East US | $2-5 (operations) |

### 📊 Monthly Budget Breakdown

#### **Compute Services**
- **App Service (Basic B1)**: $55/month
  - 1.75 GB RAM, 1 Core
  - Custom domains, SSL support
  - 10 GB storage

#### **Database Services** 
- **SQL Server (S2 Standard)**: $30/month
- **Main Database (S2)**: $200/month  
- **Reporting Database (Basic)**: $15/month
- **Total Database**: $245/month

#### **Storage Services**
- **ADLS Gen2 (1TB)**: $25/month
  - Hot tier: $0.0184/GB
  - Transactions: ~$5/month
  - Data egress: ~$5/month

#### **Security & Management**
- **Key Vault**: $3/month
  - Operations: $0.03/10k operations
  - Secrets storage: minimal

#### **Regional Data Transfer**
- **Cross-region**: $20/month
  - Australia East ↔ West US 2
  - Australia East ↔ East US

---

## 💰 **TOTAL MONTHLY PROJECTION**

| Tier | Configuration | Monthly Cost |
|------|---------------|--------------|
| **Minimal** | Basic SKUs | **$348/month** |
| **Standard** | S2/S4 SKUs | **$425/month** |
| **Optimized** | Right-sized | **$380/month** |

### Annual Projection
- **Minimal**: $4,176/year
- **Standard**: $5,100/year  
- **Optimized**: $4,560/year

## 🎯 Cost Optimization Recommendations

### Immediate Savings (30-40% reduction)
1. **Consolidate Regions**: Move everything to East US
   - Save $20/month on data transfer
   
2. **Right-size SQL**: 
   - Use S1 instead of S2 if possible (-$100/month)
   - Consider serverless for reporting DB (-$10/month)

3. **App Service Plan**: 
   - Use F1 Free tier for dev/staging (-$55/month)
   - Scale to B1 only for production

### **Optimized Monthly Budget: $280/month ($3,360/year)**

## 📈 Growth Projections

| Scenario | Resources | Monthly Cost |
|----------|-----------|--------------|
| **Current** | 5 core resources | $348-425 |
| **+50% data** | +Storage scaling | $380-460 |
| **+Production load** | +Compute scaling | $450-600 |
| **+Backup/DR** | +Geo-redundancy | $550-750 |

## 🚨 Cost Alerts Recommended
- **Budget Alert**: $400/month (15% buffer)
- **Spike Alert**: $600/month (critical threshold)
- **Daily spend**: $15/day average