# CES Schema Gap Analysis - TBWA ProjectScout Database

## 🔍 Analysis Summary

**Database**: SQL-TBWA-ProjectScout-Reporting-Prod  
**Server**: sqltbwaprojectscoutserver.database.windows.net  
**Connection Status**: Authentication issues (credentials may have changed)  
**Analysis Date**: June 14, 2025

## 🎯 Current State Assessment

### ✅ **Known Working Integrations**
Based on examination of working TBWA projects:

1. **InsightPulseAI_SKR**: Successfully connects using environment variable `SQL_PASSWORD`
2. **Retail Insights Dashboard**: Uses Supabase (different database)
3. **Scout MVP**: Uses same Azure SQL infrastructure
4. **Campaign Insight Accelerator**: Uses same database environment

### 📊 **Expected Existing Tables** (From Working Projects)
Based on similar TBWA projects using the same database:

| Table Category | Likely Tables | Purpose |
|----------------|---------------|---------|
| **Transaction Data** | transactions, transaction_items | Retail analytics |
| **Product Data** | products, skus, brands | Product catalog |
| **Geographic Data** | regions, provinces, cities, barangays | Location hierarchy |
| **Store Data** | stores, customers | Retail locations |
| **Campaign Data** | campaigns, campaign_performance | Marketing campaigns |
| **Analytics Views** | Various materialized views | Pre-computed metrics |

### ❌ **Missing CES Tables** (Need to be Created)
Based on our PageIndex schema requirements:

| Table | Purpose | Status |
|-------|---------|--------|
| `pageIndex` | Semantic chunks and metadata | ❌ Missing |
| `fileMetadata` | File information and processing status | ❌ Missing |
| `campaignInsights` | Campaign-level aggregated insights | ❌ Missing |
| `semanticIndex` | Search optimization and rankings | ❌ Missing |
| `qualityMetrics` | Content quality assessments | ❌ Missing |
| `processingLogs` | Audit trail for file processing | ❌ Missing |

## 🔗 **Database Integration Patterns**

### **Working Connection Pattern** (From InsightPulseAI)
```javascript
const dbConfig = {
    server: process.env.SQL_SERVER || 'sqltbwaprojectscoutserver.database.windows.net',
    database: process.env.SQL_DATABASE || 'SQL-TBWA-ProjectScout-Reporting-Prod',
    user: process.env.SQL_USER || 'sqladmin',
    password: process.env.SQL_PASSWORD, // No fallback - requires env var
    options: {
        encrypt: true,
        trustServerCertificate: false,
        requestTimeout: 30000,
        connectionTimeout: 30000
    }
};
```

### **Required Environment Variables**
```bash
SQL_SERVER=sqltbwaprojectscoutserver.database.windows.net
SQL_DATABASE=SQL-TBWA-ProjectScout-Reporting-Prod
SQL_USER=sqladmin
SQL_PASSWORD=[CURRENT_PASSWORD] # This needs to be obtained
```

## 📋 **Gap Analysis by Category**

### 1. **Infrastructure Gaps**
- ❌ **Database Access**: Current credentials are invalid/outdated
- ❌ **Firewall Rules**: May need IP whitelisting for new services
- ❌ **Service Principal**: Azure AD authentication not configured

### 2. **Schema Gaps**
- ❌ **PageIndex Tables**: Complete schema missing
- ❌ **Creative Analysis Functions**: Stored procedures not deployed
- ❌ **Full-Text Search**: Catalog and indexes not configured
- ❌ **Vector Storage**: No embedding storage capability

### 3. **Data Population Gaps**
- ✅ **Existing Data**: Transaction and retail data likely exists
- ❌ **Campaign Files**: No creative asset metadata
- ❌ **Quality Metrics**: No content scoring data
- ❌ **Semantic Relationships**: No indexed creative insights

### 4. **Integration Gaps**
- ❌ **Azure OpenAI**: No embedding pipeline configured
- ❌ **Google Drive**: No file extraction workflow
- ❌ **Processing Agents**: Python agents not deployed
- ❌ **API Endpoints**: PageIndex APIs not available

## 🚀 **Recommended Action Plan**

### **Phase 1: Restore Database Access**
1. **Update Credentials**: Obtain current SQL_PASSWORD from TBWA IT
2. **Test Connection**: Verify access using working InsightPulseAI pattern
3. **Firewall Rules**: Ensure IP whitelist includes development machines
4. **Service Principal**: Configure Azure AD authentication

### **Phase 2: Deploy CES Schema**
1. **Run Schema Script**: Execute `sql/pageindex.schema.sql`
2. **Create Functions**: Deploy stored procedures and views
3. **Setup Indexes**: Configure full-text search catalog
4. **Test Schema**: Verify all tables and relationships

### **Phase 3: Data Integration**
1. **Existing Data Audit**: Map current retail/campaign data
2. **Migration Scripts**: Create data bridge from existing to CES schema
3. **Sample Processing**: Test with small set of PH Awards Archive files
4. **Quality Validation**: Verify data integrity and performance

### **Phase 4: API Integration**
1. **Deploy PageIndex APIs**: Enable /api/pageindex endpoints
2. **Test Processing**: Verify Python agent connectivity
3. **UI Integration**: Connect React dashboard components
4. **End-to-End Test**: Full campaign processing workflow

## 🔧 **Technical Requirements**

### **Database Schema Deployment**
```sql
-- Deploy PageIndex schema
sqlcmd -S sqltbwaprojectscoutserver.database.windows.net \
        -d SQL-TBWA-ProjectScout-Reporting-Prod \
        -U sqladmin \
        -P [CURRENT_PASSWORD] \
        -i sql/pageindex.schema.sql
```

### **Environment Configuration**
```bash
# Update .env.local with working credentials
SQL_PASSWORD=[OBTAIN_FROM_TBWA_IT]
CES_AZURE_SQL_PASSWORD=[SAME_AS_SQL_PASSWORD]

# Verify connection
node scripts/test_db_connection.js
```

### **Python Agent Setup**
```bash
# Install dependencies
pip install pyodbc azure-identity openai PyPDF2 pyyaml

# Test agent
python3 agents/pageindex_agent.py --health
```

## 📊 **Expected Data Volumes**

### **Existing Data** (Estimated)
- **Transactions**: 100K+ records
- **Products**: 10K+ SKUs  
- **Stores**: 1K+ locations
- **Campaigns**: Limited marketing data

### **New CES Data** (Target)
- **Campaign Files**: 1,186 from PH Awards Archive
- **Semantic Chunks**: 10K+ chunks from campaigns
- **Quality Metrics**: 10K+ assessments
- **Vector Embeddings**: 15MB+ of embedding data

## 🔒 **Security Considerations**

### **Access Control**
- Service account with minimum required permissions
- Separate schemas for production vs development
- Audit logging for all PageIndex operations
- Row-level security for client data isolation

### **Data Protection**
- Encryption at rest and in transit
- PII masking for sensitive campaign data
- Backup and disaster recovery procedures
- GDPR compliance for EU campaign data

## 💡 **Success Metrics**

### **Schema Deployment Success**
- [ ] All 6 PageIndex tables created
- [ ] Stored procedures functional
- [ ] Full-text search operational
- [ ] API endpoints responding

### **Data Integration Success**
- [ ] Sample campaigns processed
- [ ] Quality scores generated
- [ ] Semantic search working
- [ ] Dashboard displaying data

### **Performance Benchmarks**
- [ ] < 2 second query response times
- [ ] 500+ files processed per hour
- [ ] 95%+ uptime for API endpoints
- [ ] < 5MB memory usage per chunk

## 📞 **Next Steps**

1. **Immediate**: Contact TBWA IT for current SQL_PASSWORD
2. **Short-term**: Deploy PageIndex schema and test connection
3. **Medium-term**: Process sample files from PH Awards Archive
4. **Long-term**: Full-scale deployment with 1,186 campaigns

---

**Note**: This analysis is based on examination of working TBWA database integrations and the required CES PageIndex schema. Actual database contents may vary and should be verified once database access is restored.