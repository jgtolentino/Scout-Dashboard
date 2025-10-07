# Danno Dashboard SQL Updates

## Key SQL-Related Changes Required

### 1. Data Sources Section Update (5.1)

**Current:**
```
### 5.1 Sources
- Azure SQL Database via JDBC (bronze_device_logs, bronze_transcriptions, bronze_vision_detections)
- Raspberry Pi edge (STT, vision, heartbeat) → Event Hubs
```

**Revised:**
```
### 5.1 Sources
- Consolidated Azure SQL Database (sqltbwaprojectscoutserver.database.windows.net) via JDBC
  - TBWA_ProjectScout_DB: Core operational data
  - RetailAdvisorDB: Retail analytics data
  - RetailAdvisor: Edge analytics data
- Raspberry Pi edge (STT, vision, heartbeat) → Event Hubs
```

### 2. Data Architecture Changes (5.2)

**Current:**
```
### 5.2 Medallion Layers
- **Bronze:** Raw events
- **Silver:** Normalized joins (DeviceData)
- **Gold:** Analytics tables (SalesInteractions, Brand mentions)
- **Platinum:** Presentation-ready summaries (interaction_summary, brand_insights, feature_store, promo_recos)
```

**Revised:**
```
### 5.2 Medallion Layers
- **Bronze:** Raw events (stored in TBWA_ProjectScout_DB)
- **Silver:** Normalized joins (DeviceData) (stored in TBWA_ProjectScout_DB)
- **Gold:** Analytics tables (SalesInteractions, Brand mentions) (stored in TBWA_ProjectScout_DB)
- **Platinum:** Presentation-ready summaries (interaction_summary, brand_insights, feature_store, promo_recos) (views across databases)
```

### 3. ETL Orchestration Updates (5.3)

**Current:**
```
### 5.3 Orchestration
- Delta Live Tables with @dlt.table/views
- Databricks SQL endpoint for BI
- MLflow Feature Store for online inference
```

**Revised:**
```
### 5.3 Orchestration
- Delta Live Tables with @dlt.table/views
- Consolidated SQL Server connection via Databricks SQL endpoint
- Cross-database queries utilizing views across TBWA_ProjectScout_DB, RetailAdvisorDB and RetailAdvisor
- MLflow Feature Store for online inference
```

### 4. Deployment & Infrastructure Changes (7)

**Current:**
```
## 7. Deployment & Infrastructure
- Azure Static Web App (React/Tailwind)
- Azure Event Hubs (STT, Visual, Annotated, Heartbeat)
- Azure Blob Storage (metadata backup)
- Azure Key Vault + Unity Catalog PII tagging
- Databricks DLT pipeline + SQL Warehouse
- CI/CD via GitHub Actions / latest deployment stack
```

**Revised:**
```
## 7. Deployment & Infrastructure
- Azure Static Web App (React/Tailwind)
- Azure Event Hubs (STT, Visual, Annotated, Heartbeat)
- Azure Blob Storage (metadata backup)
- Azure Key Vault + Unity Catalog PII tagging
- Consolidated SQL Server (sqltbwaprojectscoutserver.database.windows.net)
- Databricks DLT pipeline + SQL Warehouse
- CI/CD via GitHub Actions / latest deployment stack
```

### 5. Frontend Configuration Updates

Add this new section:

```
## 7.1 Frontend SQL Configuration
- Updated SQL connector configuration to use the consolidated server
- Connection pooling for improved performance
- Role-based access control for database security
- Query optimization for cross-database joins
```

### 6. QA & Acceptance Criteria Updates (8)

Add these criteria:

```
- Cross-database query performance < 3s for complex reports
- Successful connection to consolidated SQL server
- All dashboard components display data from appropriate databases
```

### 7. Implementation Timeline Updates (9)

Add this milestone:

```
| SQL Server Consolidation     | May 23, 2025        |
```

## Technical Implementation Notes

1. The Danno Dashboard will need to use the consolidated SQL server configuration:
   ```javascript
   const config = {
     user: process.env.DB_USER || 'danno_dashboard_user',
     password: process.env.DB_PASSWORD,
     server: 'sqltbwaprojectscoutserver.database.windows.net',
     database: 'TBWA_ProjectScout_DB', // Default database
     options: {
       encrypt: true
     }
   };
   ```

2. Cross-database queries will need to use three-part naming:
   ```sql
   SELECT 
     t.TransactionID,
     t.StoreID,
     r.CustomerInsight
   FROM 
     TBWA_ProjectScout_DB.Sales.Transactions t
   JOIN 
     RetailAdvisorDB.Analytics.CustomerInsights r ON t.CustomerID = r.CustomerID;
   ```

3. Dashboard data layer will need to be updated to handle multiple databases on a single server:
   ```javascript
   // Example data fetcher that selects database based on data type
   function fetchData(dataType) {
     const dbMapping = {
       'sales': 'TBWA_ProjectScout_DB',
       'retail': 'RetailAdvisorDB',
       'device': 'RetailAdvisor'
     };
     
     const database = dbMapping[dataType] || 'TBWA_ProjectScout_DB';
     return executeQuery(database, queries[dataType]);
   }
   ```

4. The Databricks notebooks will need to be updated for the new JDBC connection string:
   ```python
   jdbc_url = "jdbc:sqlserver://sqltbwaprojectscoutserver.database.windows.net:1433;database=TBWA_ProjectScout_DB"
   ```