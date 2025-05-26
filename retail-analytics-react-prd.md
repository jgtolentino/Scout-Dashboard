# Product Requirements Document: Retail Analytics React Dashboard

## 1. Executive Summary

### Product Overview
A modern, Power BI-style React dashboard deployed as an Azure Static Web App that visualizes retail transaction data from sari-sari stores (SSS). The solution leverages Azure SQL for data storage, Databricks for ETL processing, and provides real-time insights into consumer behavior, product performance, and AI-driven recommendations.

### Technical Architecture
- **Frontend**: React.js with TypeScript
- **Hosting**: Azure Static Web Apps
- **Database**: Azure SQL Database
- **ETL**: Azure Databricks
- **API**: Azure Functions (serverless)
- **Authentication**: Azure AD B2C
- **CDN**: Azure Front Door

### Business Objectives
- Deliver a performant, scalable alternative to Power BI with custom capabilities
- Enable real-time data visualization with sub-second response times
- Provide mobile-first responsive design
- Reduce licensing costs while maintaining enterprise features
- Support 1000+ concurrent users

## 2. Technical Requirements

### 2.1 Frontend Architecture

#### Technology Stack
```
- React 18.x with TypeScript
- State Management: Redux Toolkit + RTK Query
- UI Framework: Material-UI (MUI) v5
- Charting: Recharts + D3.js for custom visualizations
- Data Grid: AG-Grid React
- Build Tool: Vite
- Testing: Jest + React Testing Library
- E2E Testing: Playwright
```

#### Key Libraries
```json
{
  "dependencies": {
    "@mui/material": "^5.x",
    "@reduxjs/toolkit": "^1.9.x",
    "recharts": "^2.x",
    "d3": "^7.x",
    "ag-grid-react": "^30.x",
    "axios": "^1.x",
    "date-fns": "^2.x",
    "react-router-dom": "^6.x"
  }
}
```

### 2.2 Backend Architecture

#### Azure SQL Database Schema (Existing)
```sql
-- Core Transaction Tables (Already Exist)
-- SalesInteractions: Main transaction table
-- InteractionID (varchar(60)) - Primary key
-- StoreID (int) - Links to Stores table
-- TransactionDate (datetime)
-- DeviceID, FacialID - Device/customer tracking
-- Age, Gender, EmotionalState - Demographics
-- TranscriptionText - Full conversation

-- TransactionItems: Line items per transaction
-- TransactionItemID (int) - Primary key
-- InteractionID (varchar(60)) - Links to SalesInteractions
-- ProductID (int) - Links to Products
-- Quantity, UnitPrice
-- RequestSequence, RequestMethod - How item was requested

-- Product & Brand Tables
-- Products: Product catalog with BrandID linkage
-- Brands: Brand master with category and variations
-- SalesInteractionBrands: Many-to-many transaction-brand mapping

-- Store Information
-- Stores: Store master with location data
-- StoreID, StoreName, Location, DeviceID
-- GeoLatitude, GeoLongitude for mapping

-- Customer Data
-- Customers: Aggregated customer profiles
-- FacialID, Age, Gender, Emotion, LastUpdateDate

-- Analytics Tables (Sample Schema)
-- StoryTellingBrandLevel: Pre-aggregated brand analytics
-- StoryTellingTransactions: Transaction-level analytics
-- Both include derived metrics like effectiveness, sentiment

-- New Tables Needed for Dashboard
CREATE TABLE IF NOT EXISTS HourlyMetrics (
    MetricID INT IDENTITY(1,1) PRIMARY KEY,
    StoreID INT NOT NULL,
    MetricDate DATE NOT NULL,
    HourOfDay INT NOT NULL,
    TransactionCount INT,
    TotalRevenue DECIMAL(12,2),
    AvgTransactionValue DECIMAL(10,2),
    AvgBasketSize DECIMAL(5,2),
    TopCategory NVARCHAR(200),
    CONSTRAINT FK_HourlyMetrics_Store FOREIGN KEY (StoreID) REFERENCES Stores(StoreID),
    INDEX IX_HourlyMetrics_Date (MetricDate, HourOfDay, StoreID)
);

CREATE TABLE IF NOT EXISTS DailyProductMetrics (
    MetricID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    MetricDate DATE NOT NULL,
    UnitsSold INT,
    Revenue DECIMAL(10,2),
    TransactionCount INT,
    AvgUnitsPerTransaction DECIMAL(5,2),
    CONSTRAINT FK_DailyProductMetrics_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    INDEX IX_DailyProductMetrics_Date (MetricDate, ProductID)
);

CREATE TABLE IF NOT EXISTS ProductAssociations (
    AssociationID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID1 INT NOT NULL,
    ProductID2 INT NOT NULL,
    CoOccurrenceCount INT,
    Confidence DECIMAL(5,4),
    Lift DECIMAL(5,4),
    LastCalculated DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ProductAssoc_Product1 FOREIGN KEY (ProductID1) REFERENCES Products(ProductID),
    CONSTRAINT FK_ProductAssoc_Product2 FOREIGN KEY (ProductID2) REFERENCES Products(ProductID)
);
```

#### Databricks ETL Pipeline
```python
# ETL Pipeline for existing schema
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from delta import DeltaTable
import mlflow

class RetailAnalyticsETL:
    def __init__(self):
        self.spark = SparkSession.builder \
            .appName("SariSariRetailETL") \
            .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
            .getOrCreate()
        
        # Azure SQL connection
        self.jdbc_url = "jdbc:sqlserver://your-server.database.windows.net:1433;database=your-db"
        self.connection_properties = {
            "user": dbutils.secrets.get("azure-sql", "username"),
            "password": dbutils.secrets.get("azure-sql", "password"),
            "driver": "com.microsoft.sqlserver.jdbc.SQLServerDriver"
        }
    
    def process_bronze_to_silver(self):
        """Process raw device data to structured format"""
        # Read bronze tables
        bronze_transcriptions = self.spark.read.jdbc(
            self.jdbc_url, "bronze_transcriptions", 
            properties=self.connection_properties
        )
        
        bronze_detections = self.spark.read.jdbc(
            self.jdbc_url, "bronze_vision_detections",
            properties=self.connection_properties
        )
        
        # Join and clean data
        silver_data = bronze_transcriptions.alias("t") \
            .join(bronze_detections.alias("d"), 
                  col("t.DeviceID") == col("d.DeviceID") & 
                  abs(col("t.Timestamp").cast("long") - col("d.Timestamp").cast("long")) < 300,
                  "left") \
            .select(
                col("t.StoreID"),
                col("t.FacialID"),
                col("t.Timestamp"),
                col("t.TranscriptText"),
                col("d.DetectedObject"),
                col("d.Confidence")
            )
        
        # Write to Delta Lake
        silver_data.write \
            .format("delta") \
            .mode("append") \
            .save("/mnt/delta/silver/transcriptions")
    
    def generate_hourly_metrics(self):
        """Generate hourly aggregations for dashboard"""
        # Read SalesInteractions
        sales = self.spark.read.jdbc(
            self.jdbc_url, "SalesInteractions",
            properties=self.connection_properties
        )
        
        # Calculate hourly metrics
        hourly_metrics = sales \
            .withColumn("MetricDate", to_date("TransactionDate")) \
            .withColumn("HourOfDay", hour("TransactionDate")) \
            .groupBy("StoreID", "MetricDate", "HourOfDay") \
            .agg(
                count("InteractionID").alias("TransactionCount"),
                sum("TotalAmount").alias("TotalRevenue"),
                avg("TotalAmount").alias("AvgTransactionValue"),
                avg("BasketSize").alias("AvgBasketSize")
            )
        
        # Write to HourlyMetrics table
        hourly_metrics.write \
            .jdbc(self.jdbc_url, "HourlyMetrics", 
                  mode="overwrite",
                  properties=self.connection_properties)
    
    def calculate_product_associations(self):
        """Market basket analysis using MLlib"""
        from pyspark.ml.fpm import FPGrowth
        
        # Read transaction items
        items = self.spark.read.jdbc(
            self.jdbc_url, "TransactionItems",
            properties=self.connection_properties
        )
        
        # Prepare data for FP-Growth
        transactions = items.groupBy("InteractionID") \
            .agg(collect_list("ProductID").alias("items"))
        
        # Run FP-Growth algorithm
        fp = FPGrowth(itemsCol="items", minSupport=0.01, minConfidence=0.05)
        model = fp.fit(transactions)
        
        # Get association rules
        associations = model.associationRules \
            .select(
                col("antecedent")[0].alias("ProductID1"),
                col("consequent")[0].alias("ProductID2"),
                col("confidence"),
                col("lift")
            )
        
        # Write to ProductAssociations
        associations.write \
            .jdbc(self.jdbc_url, "ProductAssociations",
                  mode="overwrite",
                  properties=self.connection_properties)
    
    def generate_ai_recommendations(self):
        """Generate ML-based recommendations"""
        # Load historical data
        transactions = self.spark.read.jdbc(
            self.jdbc_url, "SalesInteractions",
            properties=self.connection_properties
        )
        
        # Feature engineering
        features = transactions \
            .withColumn("DayOfWeek", dayofweek("TransactionDate")) \
            .withColumn("TimeOfDay", 
                when(hour("TransactionDate") < 12, "Morning")
                .when(hour("TransactionDate") < 17, "Afternoon")
                .otherwise("Evening")) \
            .withColumn("AgeGroup", 
                when(col("Age") < 25, "Young")
                .when(col("Age") < 45, "Middle")
                .otherwise("Senior"))
        
        # Train recommendation model using MLflow
        with mlflow.start_run():
            # Model training code here
            pass
```

### 2.3 API Architecture (Azure Functions)

#### Endpoint Structure (Aligned with Existing Schema)
```typescript
// Azure Function HTTP Triggers
GET  /api/metrics/summary
GET  /api/interactions/timeseries
GET  /api/products/performance
GET  /api/brands/analysis
GET  /api/stores/{storeId}/metrics
GET  /api/customers/{facialId}/profile
GET  /api/insights/recommendations
GET  /api/transcripts/sentiment
POST /api/reports/export

// WebSocket endpoint for real-time updates
WS   /api/realtime/transactions
```

#### Sample Function Implementation
```typescript
// GetInteractionMetrics.ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { SqlClient } from "../shared/sqlClient";

const httpTrigger: AzureFunction = async function (
    context: Context, 
    req: HttpRequest
): Promise<void> {
    const { startDate, endDate, storeId, brandId } = req.query;
    
    // Query against existing SalesInteractions table
    const metrics = await SqlClient.query(`
        SELECT 
            COUNT(DISTINCT si.InteractionID) as transactionCount,
            COUNT(DISTINCT si.FacialID) as uniqueCustomers,
            AVG(DATEDIFF(second, si.TransactionDate, GETDATE())) as avgDuration,
            COUNT(DISTINCT sib.BrandID) as brandsPerTransaction
        FROM SalesInteractions si
        LEFT JOIN SalesInteractionBrands sib ON si.InteractionID = sib.InteractionID
        WHERE si.TransactionDate BETWEEN @startDate AND @endDate
        ${storeId ? 'AND si.StoreID = @storeId' : ''}
        ${brandId ? 'AND sib.BrandID = @brandId' : ''}
    `, { startDate, endDate, storeId, brandId });
    
    context.res = {
        body: metrics,
        headers: { 'Content-Type': 'application/json' }
    };
};

// GetBrandPerformance.ts
const getBrandPerformance: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const { category, monitored } = req.query;
    
    const brandData = await SqlClient.query(`
        SELECT 
            b.BrandID,
            b.BrandName,
            b.Category,
            COUNT(DISTINCT sib.InteractionID) as transactionCount,
            AVG(sib.Confidence) as avgConfidence,
            STRING_AGG(b.Variations, ',') as variations
        FROM Brands b
        INNER JOIN SalesInteractionBrands sib ON b.BrandID = sib.BrandID
        WHERE 1=1
        ${category ? 'AND b.Category = @category' : ''}
        ${monitored ? 'AND b.IsMonitored = @monitored' : ''}
        GROUP BY b.BrandID, b.BrandName, b.Category
        ORDER BY transactionCount DESC
    `, { category, monitored });
    
    context.res = { body: brandData };
};
```

## 3. Frontend Components Specification

### 3.1 Component Architecture
```
src/
├── components/
│   ├── Dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── KPICards/
│   │   ├── TimeAnalysis/
│   │   ├── ProductPerformance/
│   │   ├── ConsumerInsights/
│   │   └── AIRecommendations/
│   ├── Charts/
│   │   ├── TimeSeriesChart.tsx
│   │   ├── HeatMap.tsx
│   │   ├── SankeyDiagram.tsx
│   │   └── AssociationMatrix.tsx
│   ├── Filters/
│   │   ├── DateRangePicker.tsx
│   │   ├── LocationSelector.tsx
│   │   └── CategoryFilter.tsx
│   └── Common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ExportButton.tsx
├── hooks/
│   ├── useMetrics.ts
│   ├── useFilters.ts
│   └── useRealTimeData.ts
├── store/
│   ├── slices/
│   └── api/
└── utils/
    ├── chartHelpers.ts
    ├── dataFormatters.ts
    └── exportHelpers.ts
```

### 3.2 Key Component Specifications

#### KPI Cards Component
```typescript
interface KPICardProps {
    title: string;
    value: number | string;
    change?: number;
    format?: 'currency' | 'number' | 'percentage';
    icon?: React.ReactNode;
    loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ 
    title, 
    value, 
    change, 
    format = 'number',
    icon,
    loading 
}) => {
    // Animated number transitions
    // Sparkline for 7-day trend
    // Click to drill down
};
```

#### Time Series Visualization
```typescript
interface TimeSeriesChartProps {
    data: TimeSeriesData[];
    metrics: string[];
    granularity: 'hour' | 'day' | 'week' | 'month';
    interactive?: boolean;
    showComparison?: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
    data,
    metrics,
    granularity,
    interactive = true,
    showComparison = false
}) => {
    // Recharts Area/Line chart
    // Zoom and pan capabilities
    // Tooltip with detailed metrics
    // Export to image/CSV
};
```

### 3.3 State Management (Updated for Existing Schema)

#### Redux Store Structure
```typescript
interface AppState {
    dashboard: {
        metrics: {
            summary: {
                totalInteractions: number;
                uniqueCustomers: number;
                avgEmotionScore: number;
                topBrands: BrandMetric[];
            };
            timeSeries: InteractionTimeSeries[];
            loading: boolean;
            error: string | null;
        };
        filters: {
            dateRange: DateRange;
            storeIds: number[];
            brandIds: number[];
            categories: string[];
            ageGroups: string[];
            gender: string[];
        };
        transcripts: {
            recent: TranscriptData[];
            sentiment: SentimentAnalysis[];
        };
        ui: {
            sidebarCollapsed: boolean;
            activeView: 'overview' | 'brands' | 'customers' | 'transcripts';
        };
    };
    user: {
        profile: UserProfile;
        permissions: Permission[];
    };
}

// Data interfaces aligned with schema
interface InteractionData {
    interactionId: string;
    storeId: number;
    transactionDate: Date;
    facialId: string;
    age: number;
    gender: string;
    emotionalState: string;
    transcriptionText: string;
    brands: BrandDetection[];
}

interface BrandDetection {
    brandId: number;
    brandName: string;
    confidence: number;
    source: string;
}
```

## 4. Data Flow Architecture (Updated for Existing Schema)

### 4.1 Real-time Data Pipeline
```
IoT Devices → Event Hub → Stream Analytics → Azure SQL (bronze_* tables)
                                          ↓
                                    Databricks Streaming
                                          ↓
                        Azure SQL (SalesInteractions, TransactionItems)
                                          ↓
                                    Redis Cache → API → React Dashboard
```

### 4.2 Batch Processing Pipeline
```
Bronze Tables → Databricks Batch → Session Matching → SalesInteractions
                      ↓                                       ↓
              ML Models (Brand Detection)          Aggregated Metrics
                      ↓                                       ↓
          SalesInteractionBrands                    HourlyMetrics
                                                  DailyProductMetrics
```

### 4.3 Caching Strategy
- **Redis Cache**: 
  - Recent transactions by store (5 min TTL)
  - Brand performance metrics (15 min TTL)
  - Customer profiles (1 hour TTL)
- **Application Memory Cache**: 
  - Store and product catalogs (24 hour TTL)
  - Request method definitions (static)
- **Browser LocalStorage**: User preferences and filters
- **React Query**: API response caching with intelligent invalidation

## 5. Performance Requirements

### 5.1 Frontend Performance
- Initial page load: < 2 seconds
- Time to Interactive (TTI): < 3 seconds
- API response time: < 500ms for cached data
- Chart rendering: < 100ms for updates
- Lighthouse score: > 90

### 5.2 Backend Performance
- API latency: p95 < 200ms
- Databricks job completion: < 5 minutes
- Real-time data lag: < 1 minute
- Concurrent users: 1000+

### 5.3 Optimization Strategies
```typescript
// Lazy loading for routes
const DashboardPage = lazy(() => import('./pages/Dashboard'));

// Virtual scrolling for large datasets
<VirtualizedList
    height={600}
    itemCount={10000}
    itemSize={50}
    renderItem={renderRow}
/>

// Memoization for expensive calculations
const expensiveMetric = useMemo(() => 
    calculateComplexMetric(data), [data]
);

// Debounced API calls
const debouncedSearch = useDebouncedCallback(
    (value) => searchProducts(value),
    300
);
```

## 6. Security Requirements

### 6.1 Authentication & Authorization
```typescript
// Azure AD B2C Integration
interface AuthConfig {
    clientId: string;
    authority: string;
    redirectUri: string;
    scopes: string[];
}

// Role-based access control
enum UserRole {
    Viewer = 'viewer',
    Analyst = 'analyst',
    Manager = 'manager',
    Admin = 'admin'
}

// Row-level security
interface DataFilter {
    userId: string;
    allowedRegions: string[];
    allowedStores: number[];
}
```

### 6.2 API Security
- JWT token validation
- Rate limiting per user
- API key rotation
- CORS configuration
- SQL injection prevention

## 7. Deployment Architecture

### 7.1 CI/CD Pipeline
```yaml
# Azure DevOps Pipeline
trigger:
  branches:
    include:
      - main
      - develop

stages:
  - stage: Build
    jobs:
      - job: BuildReactApp
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
          - script: |
              npm ci
              npm run test
              npm run build
          - task: PublishBuildArtifacts@1

  - stage: Deploy
    jobs:
      - deployment: DeployToAzure
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '/dist'
                    api_location: '/api'
```

### 7.2 Infrastructure as Code
```terraform
# main.tf
resource "azurerm_static_site" "dashboard" {
  name                = "retail-analytics-dashboard"
  resource_group_name = azurerm_resource_group.main.name
  location           = "East US 2"
  sku_tier           = "Standard"
  sku_size           = "Standard"
}

resource "azurerm_sql_database" "analytics" {
  name                = "retail-analytics-db"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  server_name        = azurerm_sql_server.main.name
  edition           = "Premium"
  requested_service_objective_name = "P2"
}

resource "azurerm_databricks_workspace" "etl" {
  name                = "retail-analytics-databricks"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  sku                = "premium"
}
```

## 8. Monitoring & Observability

### 8.1 Application Insights Integration
```typescript
// Frontend tracking
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.REACT_APP_INSIGHTS_KEY,
        enableAutoRouteTracking: true
    }
});

// Custom metrics
appInsights.trackMetric({
    name: "ChartRenderTime",
    average: renderTime,
    sampleCount: 1
});
```

### 8.2 Key Metrics to Monitor
- Page load times
- API response times
- Error rates
- User engagement (time on page, interactions)
- Data freshness
- ETL job success rates

## 9. Mobile Responsiveness

### 9.1 Breakpoint Strategy
```scss
// breakpoints.scss
$breakpoints: (
  xs: 0,
  sm: 600px,
  md: 960px,
  lg: 1280px,
  xl: 1920px
);

// Responsive grid layout
.dashboard-grid {
  display: grid;
  gap: 16px;
  
  @media (min-width: map-get($breakpoints, sm)) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: map-get($breakpoints, lg)) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 9.2 Touch Optimizations
- Minimum touch target size: 44x44px
- Swipe gestures for chart navigation
- Collapsible sidebar for mobile
- Bottom navigation for key sections

## 10. Testing Strategy

### 10.1 Unit Testing
```typescript
// KPICard.test.tsx
describe('KPICard', () => {
  it('formats currency correctly', () => {
    const { getByText } = render(
      <KPICard 
        title="Revenue" 
        value={1234.56} 
        format="currency" 
      />
    );
    expect(getByText('₱1,234.56')).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    const { container } = render(
      <KPICard title="Test" value={0} loading />
    );
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });
});
```

### 10.2 Integration Testing
```typescript
// Dashboard.integration.test.tsx
describe('Dashboard Integration', () => {
  it('updates charts when filters change', async () => {
    const { getByRole, findByText } = render(<Dashboard />);
    
    // Change date range
    fireEvent.click(getByRole('button', { name: /date range/i }));
    fireEvent.click(getByRole('option', { name: /last 7 days/i }));
    
    // Verify API call and chart update
    await findByText(/showing data for last 7 days/i);
  });
});
```

### 10.3 E2E Testing
```typescript
// dashboard.e2e.spec.ts (Playwright)
test('complete dashboard workflow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Login
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Verify dashboard loads
  await expect(page.locator('.kpi-cards')).toBeVisible();
  
  // Test filtering
  await page.click('button:has-text("Filters")');
  await page.selectOption('select[name="region"]', 'Metro Manila');
  
  // Verify data updates
  await expect(page.locator('.chart-title')).toContainText('Metro Manila');
  
  // Test export
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('retail-analytics.pdf');
});
```

## 11. Development Timeline (Revised for Existing Schema)

### Phase 1: Foundation & Schema Integration (Weeks 1-3)
- Azure infrastructure setup
- React app structure with TypeScript
- Authentication with Azure AD B2C
- Core API endpoints for existing tables:
  - SalesInteractions queries
  - Brand performance metrics
  - Store analytics
- Integration with existing bronze_* tables

### Phase 2: Core Dashboard Features (Weeks 4-7)
- KPI cards pulling from SalesInteractions
- Time series from transaction data
- Brand performance visualizations
- Customer demographics analysis
- Basic filtering (store, date, brand)
- Transcript sentiment display

### Phase 3: Advanced Analytics (Weeks 8-11)
- Product association analysis using TransactionItems
- Customer journey mapping with FacialID tracking
- Emotion and sentiment correlation
- Request method analysis (verbal, visual, etc.)
- Real-time bronze data streaming integration
- Store performance comparisons

### Phase 4: AI & Optimization (Weeks 12-14)
- Databricks ML pipeline for recommendations
- Predictive analytics for stock optimization
- Anomaly detection in transaction patterns
- Natural language insights from transcripts
- Performance optimization & caching

### Phase 5: Polish & Deploy (Weeks 15-16)
- Mobile responsive design
- Export functionality
- User training materials
- Performance testing with production data
- Production deployment to Azure Static Web Apps

## 12. Success Metrics

### Technical Metrics
- Page load time < 2 seconds (achieved)
- 99.9% uptime
- < 0.1% error rate
- 90+ Lighthouse score

### Business Metrics
- 80% user adoption within 3 months
- 50% reduction in report generation time
- 30% improvement in inventory turnover
- ROI positive within 6 months

## 13. Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Azure SQL performance issues | High | Implement caching, query optimization, indexed views |
| Databricks job failures | Medium | Retry logic, alerting, fallback to cached data |
| Browser compatibility | Low | Target modern browsers, progressive enhancement |
| Security vulnerabilities | High | Regular security audits, penetration testing |

### Business Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Low user adoption | High | User training, intuitive UI, change management |
| Data quality issues | Medium | Validation rules, data quality dashboard |
| Scope creep | Medium | Strict phase gates, clear requirements |

## 14. Appendices

### A. API Response Formats
```typescript
// Standard API response
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
    cached: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Paginated response
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### B. Key Data Relationships
```typescript
// Mapping to existing schema
interface SchemaMapping {
    // Transaction flow
    bronze_transcriptions → SessionMatches → SalesInteractions
    bronze_vision_detections → SessionMatches → SalesInteractions
    
    // Product relationships
    SalesInteractions → TransactionItems → Products → Brands
    SalesInteractions → SalesInteractionBrands → Brands
    
    // Customer tracking
    SalesInteractions.FacialID → Customers.FacialID
    
    // Store linkage
    SalesInteractions.StoreID → Stores.StoreID
    bronze_*.StoreID → Stores.StoreID
}

// Key business metrics from schema
interface BusinessMetrics {
    // From SalesInteractions
    transactionVolume: "COUNT(DISTINCT InteractionID)";
    uniqueCustomers: "COUNT(DISTINCT FacialID)";
    avgAge: "AVG(Age)";
    genderDistribution: "GROUP BY Gender";
    
    // From SalesInteractionBrands
    brandFrequency: "COUNT by BrandID";
    brandConfidence: "AVG(Confidence)";
    
    // From TransactionItems
    unitsPerTransaction: "AVG(Quantity) GROUP BY InteractionID";
    basketComposition: "STRING_AGG(ProductID)";
    
    // From bronze_transcriptions
    sentimentAnalysis: "TranscriptionText analysis";
    conversationTopics: "NLP on TranscriptText";
}
```

### C. Migration Considerations
```typescript
// Existing data migration notes
interface MigrationPlan {
    // Leverage existing Sample.StoryTelling* tables
    storytellingData: {
        source: ["StoryTellingTransactions", "StoryTellingBrandLevel"],
        target: "Dashboard aggregations",
        approach: "Read directly, no migration needed"
    };
    
    // Bronze to Silver processing
    bronzeProcessing: {
        tables: ["bronze_transcriptions", "bronze_vision_detections", "bronze_device_logs"],
        process: "Databricks streaming job",
        frequency: "Near real-time (1 min intervals)"
    };
    
    // New aggregation tables only
    newTables: [
        "HourlyMetrics",        // Hourly rollups
        "DailyProductMetrics",  // Product performance
        "ProductAssociations",  // Market basket analysis
        "RealtimeQueue"         // For streaming updates
    ];
}

// Data quality checks
interface DataValidation {
    facialIdMatching: "Ensure bronze_transcriptions.FacialID matches Customers.FacialID";
    sessionCorrelation: "Validate SessionMatches TimeOffsetMs accuracy";
    brandConfidence: "Filter SalesInteractionBrands where Confidence > 0.7";
    transcriptCompleteness: "Check SalesInteractionTranscripts.IsFinal flag";
}
```

### D. Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators
- ARIA labels and roles

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Owner**: Product Engineering Team  
**Reviewers**: Technical Architecture, UX Design, Business Analytics