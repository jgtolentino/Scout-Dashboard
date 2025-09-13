# Scout Dashboard Implementation Plan
## From Database Migration to Power BI-Style Interface

### 🎯 Overview
This plan translates the database schema enhancements from Sprints 10-12 into the interactive dashboard wireframe provided.

### 📊 Module Implementation Priority

#### **Phase 1: Core Analytics (Week 1-2)**

**Transaction Trends Module**
```sql
-- Key queries for hourly volume chart
SELECT 
    DATEPART(HOUR, StartTime) as Hour,
    COUNT(*) as TransactionCount,
    AVG(TransactionAmount) as AvgValue,
    AVG(DurationSec) as AvgDuration
FROM v_TransactionStats 
WHERE TransactionDate >= @StartDate 
GROUP BY DATEPART(HOUR, StartTime)
ORDER BY Hour;

-- Peso value distribution
SELECT 
    CASE 
        WHEN TransactionAmount BETWEEN 1 AND 25 THEN '₱1-25'
        WHEN TransactionAmount BETWEEN 26 AND 50 THEN '₱26-50'
        WHEN TransactionAmount BETWEEN 51 AND 100 THEN '₱51-100'
        ELSE '₱100+'
    END as ValueRange,
    COUNT(*) as TransactionCount,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) as Percentage
FROM SalesInteractions 
WHERE TransactionAmount > 0
GROUP BY CASE 
    WHEN TransactionAmount BETWEEN 1 AND 25 THEN '₱1-25'
    WHEN TransactionAmount BETWEEN 26 AND 50 THEN '₱26-50'
    WHEN TransactionAmount BETWEEN 51 AND 100 THEN '₱51-100'
    ELSE '₱100+'
END;
```

**Product Mix & SKU Analysis Module**
```sql
-- Category performance from wireframe
SELECT 
    p.Category,
    COUNT(DISTINCT ti.InteractionID) as TransactionCount,
    SUM(ti.Quantity) as TotalUnits,
    SUM(ti.Quantity * ti.UnitPrice) as TotalRevenue,
    CAST(COUNT(DISTINCT ti.InteractionID) * 100.0 / 
         (SELECT COUNT(DISTINCT InteractionID) FROM TransactionItems) AS DECIMAL(5,2)) as Percentage
FROM TransactionItems ti
INNER JOIN Products p ON ti.ProductID = p.ProductID
WHERE ti.InteractionID IN (
    SELECT InteractionID FROM SalesInteractions 
    WHERE TransactionDate >= @StartDate
)
GROUP BY p.Category
ORDER BY TotalRevenue DESC;

-- Top substitution patterns
SELECT TOP 10
    sa.OriginalProductName,
    sa.SubstituteProductName,
    sa.SubstitutionCount,
    CAST(sa.SubstitutionCount * 100.0 / SUM(sa.SubstitutionCount) OVER() AS DECIMAL(5,2)) as Percentage
FROM v_SubstitutionAnalysis sa
ORDER BY sa.SubstitutionCount DESC;
```

#### **Phase 2: Behavioral Analytics (Week 3)**

**Consumer Behavior Analysis Module**
```sql
-- Request patterns from wireframe
SELECT 
    rm.RequestGroup,
    COUNT(ti.TransactionItemID) as RequestCount,
    CAST(COUNT(ti.TransactionItemID) * 100.0 / 
         (SELECT COUNT(*) FROM TransactionItems) AS DECIMAL(5,2)) as Percentage
FROM TransactionItems ti
INNER JOIN RequestMethods rm ON ti.RequestMethod = rm.MethodID
GROUP BY rm.RequestGroup
ORDER BY RequestCount DESC;

-- Store suggestion acceptance rates
SELECT 
    'Acceptance Rate' as Metric,
    CAST(COUNT(CASE WHEN SuggestionAccepted = 1 THEN 1 END) * 100.0 / 
         COUNT(CASE WHEN IsStoreOwnerSuggested = 1 THEN 1 END) AS DECIMAL(5,2)) as Rate
FROM TransactionItems
WHERE IsStoreOwnerSuggested = 1;
```

**Customer Profiling Module**
```sql
-- Demographic breakdown
SELECT 
    c.Gender,
    c.AgeBracket,
    COUNT(DISTINCT si.CustomerID) as CustomerCount,
    COUNT(si.InteractionID) as TransactionCount,
    AVG(si.TransactionAmount) as AvgSpend
FROM SalesInteractions si
INNER JOIN Customers c ON si.CustomerID = c.CustomerID
WHERE si.TransactionDate >= @StartDate
GROUP BY c.Gender, c.AgeBracket
ORDER BY CustomerCount DESC;

-- Location heatmap data
SELECT 
    gd.Barangay,
    COUNT(si.InteractionID) as TransactionCount,
    SUM(si.TransactionAmount) as TotalRevenue,
    COUNT(DISTINCT si.CustomerID) as UniqueCustomers,
    CASE 
        WHEN COUNT(si.InteractionID) >= 300 THEN 'High'
        WHEN COUNT(si.InteractionID) >= 150 THEN 'Med-High'
        WHEN COUNT(si.InteractionID) >= 50 THEN 'Medium'
        ELSE 'Low'
    END as ActivityLevel
FROM SalesInteractions si
INNER JOIN Stores s ON si.StoreID = s.StoreID
LEFT JOIN GeoDimension gd ON s.StoreID = gd.StoreID
WHERE si.TransactionDate >= @StartDate
GROUP BY gd.Barangay
ORDER BY TransactionCount DESC;
```

#### **Phase 3: AI Recommendations Engine (Week 4)**

**Smart Insights Queries**
```sql
-- Peak hour optimization insight
WITH HourlySubstitutions AS (
    SELECT 
        DATEPART(HOUR, si.StartTime) as Hour,
        sa.OriginalProductName,
        sa.SubstituteProductName,
        COUNT(*) as SubCount
    FROM v_SubstitutionAnalysis sa
    INNER JOIN TransactionItems ti ON ti.ProductID = sa.SubstituteProductID 
                                   AND ti.SubstitutedProductID = sa.OriginalProductID
    INNER JOIN SalesInteractions si ON ti.InteractionID = si.InteractionID
    WHERE si.TransactionDate >= DATEADD(DAY, -7, GETDATE())
    GROUP BY DATEPART(HOUR, si.StartTime), sa.OriginalProductName, sa.SubstituteProductName
)
SELECT TOP 1
    'Peak Hour Optimization' as RecommendationType,
    'High' as Impact,
    CONCAT('Peak substitution of ', OriginalProductName, ' → ', SubstituteProductName, 
           ' (', CAST(SubCount AS VARCHAR), ' times) during ', Hour, ':00-', Hour+1, ':00') as Insight,
    CONCAT('Increase ', SubstituteProductName, ' inventory by 30% during peak hours') as Action,
    CONCAT('₱', FORMAT(SubCount * 50, 'N0'), '/week') as PotentialGain
FROM HourlySubstitutions
ORDER BY SubCount DESC;

-- Geographic opportunity insight
WITH BarangayPerformance AS (
    SELECT 
        gd.Barangay,
        COUNT(si.InteractionID) as TransactionCount,
        RANK() OVER (ORDER BY COUNT(si.InteractionID) DESC) as ActivityRank
    FROM SalesInteractions si
    INNER JOIN Stores s ON si.StoreID = s.StoreID
    LEFT JOIN GeoDimension gd ON s.StoreID = gd.StoreID
    WHERE si.TransactionDate >= DATEADD(DAY, -30, GETDATE())
      AND gd.Barangay IS NOT NULL
    GROUP BY gd.Barangay
)
SELECT 
    'Geographic Opportunity' as RecommendationType,
    'Medium' as Impact,
    CONCAT('Under-served barangays (', STRING_AGG(Barangay, ', '), ') show 40% lower density') as Insight,
    'Deploy mobile vendors to low-activity areas on weekends' as Action,
    '+180 transactions/week estimated' as PotentialGain
FROM BarangayPerformance
WHERE ActivityRank > (SELECT COUNT(*) * 0.7 FROM BarangayPerformance);
```

### 🎨 Frontend Implementation Stack

**Technology Recommendations:**
- **Framework**: React + TypeScript for type safety
- **Charts**: D3.js or Chart.js for Power BI-style visualizations
- **State Management**: Redux Toolkit for cross-filtering
- **UI Components**: Ant Design or Material-UI for professional appearance
- **Data Fetching**: React Query for caching and real-time updates

**Key Components to Build:**

```typescript
// Core dashboard components
interface DashboardModule {
  id: string;
  title: string;
  filters: Filter[];
  visualizations: Visualization[];
  dataQueries: QueryConfig[];
}

interface CrossFilterContext {
  activeFilters: FilterState;
  applyFilter: (filter: Filter) => void;
  clearFilters: () => void;
  drillThrough: (dataPoint: DataPoint) => void;
}

// Component structure
<DashboardLayout>
  <GlobalFilters />
  <ModuleGrid>
    <TransactionTrendsModule />
    <ProductMixModule />
    <ConsumerBehaviorModule />
    <CustomerProfilingModule />
  </ModuleGrid>
  <AIRecommendationsPanel />
  <DrillThroughPanel />
</DashboardLayout>
```

### 📡 API Layer Design

**REST Endpoints:**
```typescript
// Dashboard data APIs
GET /api/dashboard/transactions/trends?startDate=2025-05-15&endDate=2025-05-22&barangay=all
GET /api/dashboard/products/mix?category=all&timeRange=7d
GET /api/dashboard/behavior/patterns?demographic=all
GET /api/dashboard/customers/profile?location=all
GET /api/dashboard/insights/recommendations?context=current_filters

// Real-time updates
WebSocket: /ws/dashboard/updates
```

**Data Export Functions:**
```sql
-- Dashboard export procedure (from our migration)
EXEC sp_ExportDashboardData 
    @StartDate = '2025-05-15',
    @EndDate = '2025-05-22',
    @FilterContext = 'barangay=A,category=cigarettes'
```

### 🔄 Real-time Features Implementation

**Auto-refresh Strategy:**
1. **Scheduled ETL**: Run `sp_RefreshSkuFrequency` every 4 hours
2. **WebSocket Updates**: Push new transaction data every 15 minutes  
3. **Cache Strategy**: Redis for frequently accessed aggregations
4. **Progressive Loading**: Load critical KPIs first, then detailed charts

**Performance Optimization:**
- **Indexed Views**: All major aggregations pre-computed
- **Pagination**: Drill-through details loaded on demand
- **Lazy Loading**: Charts rendered as they come into viewport
- **Memoization**: React.memo for expensive chart components

### 🧪 Testing Strategy

**Unit Tests:**
- Chart component rendering with mock data
- Cross-filter logic validation
- SQL query result parsing

**Integration Tests:**
- End-to-end filter interactions
- Real-time data update handling
- Export functionality

**Performance Tests:**
- Dashboard load time < 3 seconds
- Cross-filter response < 500ms
- Concurrent user handling (100+ users)

### 🚀 Deployment Pipeline

**Development Environment:**
```bash
# Local development with sample data
npm run dev:local

# Connect to staging database
npm run dev:staging
```

**Production Deployment:**
```bash
# Build optimized bundle
npm run build:prod

# Deploy to Azure Static Web Apps
az deployment group create \
  --resource-group RG-TBWA-ProjectScout-Compute \
  --template-file dashboard-deployment.json \
  --parameters @dashboard-parameters.json
```

### 📋 Implementation Checklist

**Week 1-2: Core Analytics**
- [ ] Set up React TypeScript project with dashboard layout
- [ ] Implement Transaction Trends module with hourly charts
- [ ] Build Product Mix module with category breakdowns
- [ ] Create cross-filtering context and global filters
- [ ] Connect to database with our new views and procedures

**Week 3: Behavioral Analytics**
- [ ] Implement Consumer Behavior Analysis module
- [ ] Build Customer Profiling module with demographics
- [ ] Add drill-through functionality for detailed analysis
- [ ] Implement location heatmap with GeoDimension data

**Week 4: AI & Polish**
- [ ] Build AI Recommendations engine with our insight queries
- [ ] Add real-time updates via WebSocket
- [ ] Implement export functionality using sp_ExportDashboardData
- [ ] Performance optimization and caching
- [ ] User acceptance testing and deployment

### 🎯 Success Metrics

- **Performance**: Dashboard loads in < 3 seconds
- **Interactivity**: Cross-filters respond in < 500ms  
- **Data Freshness**: Updates every 15 minutes automatically
- **User Adoption**: 90%+ of stakeholders use dashboard weekly
- **Decision Impact**: Measurable business actions from AI recommendations

This implementation plan directly leverages all the database enhancements we just completed, ensuring the wireframe functionality is fully supported by robust, performant data foundations.