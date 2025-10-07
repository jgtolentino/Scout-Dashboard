# Scout v7 Neural DataBank - Product Requirements Document (PRD)

## 0. Executive Summary

Scout v7 is a **config-driven retail analytics dashboard** powered by **Neural DataBank** - a 4-layer AI-enhanced data lakehouse architecture. The platform delivers Executive, Trends, Product Mix, Consumer Behavior, Profiling, Competition, and Geography analytics with a **floating AI assistant** for natural language queries and **intelligent routing** with ML-powered insights.

**Success Gates**: Functional parity with v7 features, P95 ≤1.5s page render, router P95 ≤300ms, cache hit ≥40%, security RLS enforced, zero mocks in production.

---

## 1. Problem Statement & Goals

### Business Challenge
- **Data Silos**: Analytics scattered across multiple systems with inconsistent metrics
- **Manual Insights**: Time-intensive analysis requiring technical expertise  
- **Static Dashboards**: Limited ability to explore ad-hoc questions
- **Delayed Intelligence**: Insights lag business decisions by days or weeks

### Primary Objectives
1. **Unified Analytics Platform**: Single source of truth for retail performance metrics
2. **AI-Powered Insights**: Automated pattern detection and predictive recommendations
3. **Natural Language Interface**: Business users can query data without SQL knowledge
4. **Real-Time Intelligence**: Sub-second insights with intelligent caching and routing
5. **Scalable Architecture**: Medallion lakehouse supporting Bronze → Silver → Gold → Platinum data layers

---

## 2. Users & Personas

### **Executive** (Primary)
- **Goals**: KPIs, MoM/YoY trends, strategic insights summary
- **Usage**: Quarterly reviews, board presentations, performance monitoring
- **Success Metrics**: 15% faster decision-making, 90% metric accuracy

### **Category/Brand Managers** (Primary) 
- **Goals**: Drill by category/brand/SKU, market share, competitive positioning
- **Usage**: Daily performance monitoring, campaign optimization
- **Success Metrics**: 30% reduction in analysis time, improved ROI tracking

### **Analysts** (Power Users)
- **Goals**: Answer ad-hoc questions, explore data patterns, generate reports
- **Usage**: Deep-dive analysis, custom visualizations, insight generation
- **Success Metrics**: 50% faster insight generation, enhanced analytical capabilities

### **Store Operations** (Secondary)
- **Goals**: Product mix optimization, SKU performance, regional metrics  
- **Usage**: Inventory decisions, regional strategy, operational efficiency
- **Success Metrics**: 20% improvement in inventory turnover

---

## 3. Scope Definition

### **In Scope**
✅ **7 Dashboard Pages**: Executive Overview, Transaction Trends, Product Mix & SKU, Consumer Behavior, Consumer Profiling, Competitive Analysis, Geographic Intelligence  
✅ **Neural DataBank Architecture**: 4-layer medallion (Bronze → Silver → Gold → Platinum)  
✅ **AI Assistant**: Natural language → SQL with QuickSpec translation  
✅ **Global Filter Bus**: Cross-page persistence with URL + localStorage  
✅ **Intelligent Router**: Keyword → embeddings → fallback chain  
✅ **Drill-Down Navigation**: Click-to-filter with breadcrumb undo  
✅ **MindsDB Integration**: ML model training, prediction, recommendations  
✅ **Comparison System**: Time periods, cohorts, geographic normalization  
✅ **Security Framework**: RLS enforcement, HMAC signing, audit logging  

### **Out of Scope** (Future Releases)
❌ **Role-Based Access Control**: Page-level permissions  
❌ **Scheduled Reports**: Automated email/export distribution  
❌ **Multi-Tenant Theming**: Brand-specific customization  
❌ **Real-Time Streaming**: Sub-second data ingestion  
❌ **Mobile Applications**: iOS/Android native apps  

---

## 4. Neural DataBank Architecture

### **4-Layer Medallion Design**

#### **Bronze Layer** (Raw Data Ingestion)
- **Purpose**: Unprocessed data from 61 Edge Functions
- **Sources**: Transaction streams, user interactions, campaign data
- **Storage**: MinIO S3-compatible object store with lifecycle management
- **Retention**: 2 years for audit and reprocessing capabilities

#### **Silver Layer** (Cleaned & Validated)
- **Purpose**: Business-ready data with quality controls
- **Transformations**: Data cleansing, schema validation, deduplication
- **Tables**: `scout_silver_*` namespace with proper indexing
- **SLAs**: 99.5% data quality, <5 minute freshness

#### **Gold Layer** (Aggregated Business Metrics)
- **Purpose**: KPI calculations and business intelligence
- **Content**: Revenue trends, category performance, regional metrics
- **Tables**: `scout_gold_*` namespace with materialized views  
- **Refresh**: Hourly updates with change data capture

#### **Platinum Layer** (AI-Enhanced Insights)
- **Purpose**: ML predictions, recommendations, pattern detection
- **Models**: Sales forecasting, CES classification, neural recommendations
- **Confidence**: ≥0.9 threshold for production recommendations
- **Updates**: Real-time model inference with scheduled retraining

### **MindsDB ML Models**

#### **Sales Forecasting Model** (`scout_sales_forecast_14d`)
- **Algorithm**: Time series forecasting with seasonal patterns
- **Inputs**: Historical sales, promotional calendar, weather data
- **Output**: 14-day revenue predictions with confidence intervals
- **Accuracy Target**: MAE <10%, MAPE <15%

#### **CES Classifier** (`ces_success_classifier`)  
- **Algorithm**: Multi-class classification for creative effectiveness
- **Inputs**: Campaign metadata, creative features, performance metrics
- **Output**: Success probability with feature importance scores
- **Accuracy Target**: F1 score >0.85, precision >0.80

#### **Neural Recommendations** (`neural_recommendations_llm`)
- **Algorithm**: GPT-4 powered recommendation engine
- **Context**: Campaign performance, market trends, competitive intelligence
- **Output**: 3 actionable recommendations with impact metrics
- **Quality Gate**: Human review for confidence <0.9

---

## 5. AI Assistant & Natural Language Interface

### **Floating AI Assistant (FAB)**
- **Activation**: Bottom-right FAB, keyboard shortcut `/` or `Cmd/Ctrl+K`
- **Interface**: Chat-style with streaming responses and contextual suggestions
- **Persistence**: Pinned panels survive navigation, 30-minute TTL cleanup

### **QuickSpec Translation Engine**
```typescript
interface QuickSpec {
  schema: 'QuickSpec@1';
  x?: string; y?: string; series?: string;
  agg: 'sum'|'count'|'avg'|'min'|'max';
  splitBy?: string;
  chart: 'bar'|'line'|'pie'|'table';
  filters?: Record<string, any>;
  timeGrain?: 'hour'|'day'|'week'|'month';
  topK?: number;
}
```

### **Whitelisted Dimensions & Measures**
**Dimensions**: `date_day`, `region`, `category`, `brand`, `sku`, `gender`, `age_bracket`  
**Measures**: `gmv`, `transactions`, `avg_basket_size`, `units_sold`, `conversion_rate`  
**Time Grains**: Hour, day, week, month, quarter, year  
**Aggregations**: Sum, count, average, min, max, median

### **Safety & Security**
- **SQL Injection Prevention**: Parameterized queries only
- **Column Whitelisting**: Non-whitelisted fields return friendly errors
- **Rate Limiting**: Token bucket algorithm, 10 queries/minute per user
- **Audit Logging**: All queries logged with user context and execution time

### **Example Interactions**
```
User: "Show brand performance in NCR last 28 days"
Assistant: → Bar chart: brands vs revenue, region=NCR, date≥(today-28)

User: "Compare Alaska vs Oishi market share"  
Assistant: → Line chart: market share over time, brands=[Alaska, Oishi]

User: "Top categories by region this month"
Assistant: → Heatmap: regions vs categories, timeframe=current_month
```

---

## 6. Intelligent Router Architecture

### **Router Decision Flow**
1. **Intent Classification**: Natural language → business intent
2. **Keyword Extraction**: Key entities (brands, regions, metrics)  
3. **Embedding Generation**: Semantic similarity matching
4. **Function Selection**: Route to appropriate Edge Function
5. **Fallback Chain**: Progressive degradation if primary fails

### **Performance Requirements**
- **P95 Response Time**: ≤300ms for router decisions
- **Cache Hit Rate**: ≥40% under normal load (60s TTL)
- **Availability**: 99.9% uptime with automatic failover
- **Rate Limiting**: 1000 requests/minute per API key

### **Caching Strategy**
```json
{
  "cache_key": "intent:executive|filters:region=NCR,date=last_30d",
  "ttl_seconds": 60,
  "cache_type": "redis_cluster",
  "invalidation": "time_based"
}
```

---

## 7. Global Filters & Drill-Down Navigation

### **Global Filter Bus**
- **Filters**: Date Range, Region (hierarchical), Category, Daypart, Day-of-Week
- **Persistence**: Zustand state + URL params + localStorage
- **Synchronization**: Cross-tab updates within 150ms (debounced)
- **Deep Linking**: Shareable URLs with filter state preservation

### **Drill-Down Behavior**
- **Triggers**: `pointClick`, `barClick`, `regionClick`, `cellClick`
- **Actions**: Add scoped filters + optional page navigation
- **Breadcrumbs**: Last 6 drill steps with undo functionality
- **Navigation**: Product Mix → Competition, Geography → Regional Intelligence

### **Filter Examples**
```javascript
// URL: /?date=last_30d&region=NCR&category=Beverages
{
  dateRange: { preset: 'last_30d', start: '2025-08-13', end: '2025-09-12' },
  region: { level: 'region', value: 'NCR', label: 'National Capital Region' },
  category: { value: 'Beverages', label: 'Beverages' }
}
```

---

## 8. Information Architecture (7 Pages)

### **1. Executive Overview** (`story: purchase_overview`)
- **KPI Cards**: Revenue, Orders, Avg Basket, MoM Growth
- **Revenue Trends**: Line chart with period comparisons
- **Platinum Insights**: AI-generated executive summary
- **Quick Actions**: Deep links to detailed analysis

### **2. Transaction Trends** (`story: purchase_overview`)  
- **Time Series**: Orders, revenue, basket size evolution
- **Seasonality**: Year-over-year patterns with forecasts
- **Range Comparisons**: Current vs previous period analysis
- **Anomaly Detection**: Statistical outliers with explanations

### **3. Product Mix & SKU** (`story: purchase_overview`)
- **Category Mix**: Donut chart (≤6 categories) or bar chart (>6)
- **Top SKUs**: Performance ranking with growth indicators  
- **Share Analysis**: Category penetration and market position
- **Portfolio Health**: ABC classification with recommendations

### **4. Consumer Behavior** (`story: demographics`)
- **Time-of-Day Heatmap**: Hourly transaction patterns
- **Purchase Journey**: Customer lifecycle analysis
- **Preference Signals**: Brand affinity and category preferences
- **Behavioral Segmentation**: RFM analysis with clustering

### **5. Consumer Profiling** (`story: demographics`)
- **Demographics Table**: Age, gender, location distributions
- **Persona Analysis**: Customer segment characteristics
- **Lifetime Value**: CLV predictions with confidence intervals
- **Churn Risk**: Predictive modeling with intervention triggers

### **6. Competitive Analysis** (`story: competition`)
- **Market Share**: Brand positioning with trend analysis
- **Share of Voice**: Competitive landscape dynamics  
- **Substitution Matrix**: Product switching patterns
- **Competitive Intelligence**: Automated insights and alerts

### **7. Geographic Intelligence** (`story: geography`)
- **Philippines Regional Map**: Choropleth visualization
- **Regional Performance**: Revenue, penetration, growth metrics
- **Location Analytics**: Store/outlet performance rankings
- **Geographic Expansion**: Opportunity scoring and recommendations

---

## 9. Data Contracts & API Specifications

### **Router Input Contract**
```json
{
  "query": "show revenue this month",
  "hint": "executive",
  "filters": {
    "region": "ALL",
    "dateRange": "last_30d",
    "category": "ALL"
  },
  "context": {
    "userId": "user123",
    "sessionId": "sess456",
    "timestamp": 1694523600
  }
}
```

### **Executive RPC Response**
```json
{
  "kpi": {
    "orders": 514,
    "revenue": 91704,
    "avgTicket": 178.5,
    "mom": 0.419
  },
  "trends": [
    { "date": "2025-09-11", "revenue": 91704, "orders": 514 }
  ],
  "insights": [
    {
      "type": "growth",
      "message": "Revenue increased 41.9% vs last month",
      "confidence": 0.95
    }
  ]
}
```

### **Category Mix Response**
```json
[
  { "category": "Beverages", "share": 35, "revenue": 32096 },
  { "category": "Snacks", "share": 25, "revenue": 22926 },
  { "category": "Personal Care", "share": 20, "revenue": 18341 },
  { "category": "Household", "share": 20, "revenue": 18341 }
]
```

---

## 10. Security & Privacy Framework

### **Row-Level Security (RLS)**
- **Implementation**: Supabase policies on all user-facing tables
- **Access Control**: Anonymous users denied, service role for server functions
- **Data Isolation**: Multi-tenant support with organization-based filtering

### **Data Integrity & Validation**
- **HMAC Signing**: X-Signature header with timestamp validation
- **Idempotency**: Duplicate request prevention with idempotency keys
- **Input Sanitization**: SQL injection prevention with parameterized queries

### **Privacy Compliance**
- **Face Analytics**: No emotion detection, hashed face IDs only
- **PII Protection**: Data anonymization for non-production environments  
- **Audit Trails**: Comprehensive logging for compliance and debugging
- **Data Retention**: Automated cleanup based on retention policies

### **API Security**
```http
POST /api/scout/executive
Authorization: Bearer <service_role_key>
X-Signature: sha256=<hmac_signature>
X-Timestamp: 1694523600
X-Idempotency-Key: uuid-v4
```

---

## 11. Performance & Observability

### **Performance Budgets**
- **Page Load P95**: ≤1.5s after API response
- **Router P95**: ≤300ms for intent classification
- **Cache Hit Rate**: ≥40% under normal load
- **Bundle Size**: ≤300KB gzipped for dashboard shell
- **Database Queries**: ≤100ms P95 for simple selects

### **Monitoring & Alerting**
- **Golden Signals**: Latency, traffic, errors, saturation
- **Custom Metrics**: Router QPS, cache hit/miss ratios, ML model accuracy
- **Alerts**: Error rate >0.5% (5min), P95 >300ms (5min)
- **Dashboards**: Real-time performance monitoring with anomaly detection

### **Observability Stack**
- **Metrics**: Prometheus + Grafana for time-series data
- **Logs**: Structured JSON logging with correlation IDs
- **Traces**: Distributed tracing for request flow analysis
- **APM**: Application performance monitoring with error tracking

---

## 12. Acceptance Criteria & Success Metrics

### **Functional Requirements**
✅ **Data Accuracy**: Orders=514, Revenue=91,704, Beverages=35%, Snacks=25%  
✅ **Filter Persistence**: Deep links hydrate state correctly  
✅ **Drill Navigation**: Bar click adds filter and navigates appropriately  
✅ **AI Assistant**: "Show revenue by category" generates valid chart + SQL  
✅ **Router Performance**: P95 ≤300ms for intent classification  
✅ **Cache Efficiency**: ≥40% hit rate under smoke test load  

### **Security Validation**
✅ **RLS Matrix**: Anonymous users denied gold/platinum data access  
✅ **HMAC Verification**: Unsigned requests rejected with 401  
✅ **SQL Injection**: Non-whitelisted fields return friendly errors  
✅ **Rate Limiting**: Exceeding limits returns 429 with retry headers  

### **Performance Gates**
✅ **Page Render**: P95 ≤1.5s for overview page with full data  
✅ **Bundle Size**: Dashboard shell ≤300KB gzipped  
✅ **API Response**: P95 ≤500ms for complex aggregation queries  
✅ **Concurrent Users**: 100+ simultaneous sessions without degradation  

### **User Experience**
✅ **Cross-Page Filters**: Changes reflect within 200ms across tabs  
✅ **Breadcrumb Undo**: Drill actions reversible with clear navigation  
✅ **Assistant Usability**: ≥80% query success rate for common patterns  
✅ **Error Boundaries**: Panel failures contained without page crash  

---

## 13. Risk Assessment & Mitigation

### **Technical Risks**
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| **Adapter Drift** | Medium | High | Lock adapter contract, add schema unit tests |
| **Ad-hoc Query Abuse** | Low | Medium | Whitelist + rate-limit + audit logging |
| **ML Model Accuracy** | Medium | Medium | A/B testing, human-in-the-loop validation |
| **Cache Invalidation** | Low | High | Event-driven invalidation with fallbacks |

### **Business Risks**
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| **User Adoption** | Medium | High | Comprehensive training, gradual rollout |
| **Data Quality Issues** | Low | High | Automated quality checks, monitoring alerts |
| **Performance Degradation** | Medium | Medium | Load testing, auto-scaling, circuit breakers |
| **Compliance Violations** | Low | High | Regular audits, privacy by design |

### **Operational Risks**
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| **Deployment Failures** | Low | Medium | Blue-green deployments, rollback procedures |
| **Data Loss** | Very Low | High | Multi-region backups, disaster recovery plans |
| **Security Breaches** | Low | High | Regular penetration testing, security training |

---

## 14. Rollout Strategy

### **Phase A: Foundation (Weeks 1-2)**
- **Scope**: Theme tokens, page stories, adapter mapping
- **Changes**: No SQL modifications, frontend-only updates
- **Success Criteria**: All pages load with existing data contracts

### **Phase B: AI Integration (Weeks 3-4)**
- **Scope**: AI Assistant FAB, QuickSpec translation, secure execution
- **Changes**: New API endpoints, ML model deployment
- **Success Criteria**: 80% query success rate, security validation passes

### **Phase C: Neural DataBank (Weeks 5-6)**
- **Scope**: Platinum recommendations, ML model training, automated insights
- **Changes**: Enhanced data pipeline, prediction serving
- **Success Criteria**: Model accuracy targets met, real-time inference working

### **Feature Flags**
```typescript
{
  "VITE_USE_MOCK": false,           // Production: real data only
  "VITE_AI_ASSISTANT": true,        // Enable AI FAB
  "VITE_NEURAL_DATABANK": true,     // Enable Platinum layer
  "VITE_ROUTER_CACHE": true,        // Enable intelligent caching
  "PIPELINE_SIGNING_KEY": "***"     // HMAC validation
}
```

---

## 15. Open Questions & Decisions Needed

### **Technical Decisions**
1. **PH Region Enum**: Finalize authoritative source (UI and RPC alignment)
2. **Platinum Confidence**: Default threshold (0.9 recommended)  
3. **Cache TTL Strategy**: Static 60s vs dynamic based on query complexity
4. **ML Model Retraining**: Daily vs weekly vs demand-driven

### **Product Decisions**  
1. **Export Formats**: Required formats (CSV, PNG, PDF) and usage quotas
2. **Brand/Category Filters**: Multi-select vs single-select in global filters
3. **Assistant Scope**: Cross-domain queries (consumer + product) vs domain-restricted
4. **Materialized View SLA**: Hourly vs 4-hourly refresh acceptable

### **Business Decisions**
1. **Rollout Scope**: Pilot user selection criteria and success metrics
2. **Training Requirements**: Documentation vs live training vs video tutorials
3. **Support Model**: Self-service vs dedicated support during rollout
4. **Success Definition**: Quantitative metrics vs qualitative feedback priority

---

## 16. Appendices

### **A. Configuration Reference**
```json
{
  "brand": { "theme": "scout_v7", "primary_color": "#1a73e8" },
  "flow": { "max_visuals": 7, "enable_drill": true },
  "pages": [
    {
      "id": "overview", 
      "story": "purchase_overview",
      "layout": [
        { "component": "KPICard", "data": { "rpc": "executive_kpis" } }
      ]
    }
  ],
  "router": {
    "cache_ttl": 60,
    "rate_limit": 1000,
    "embedding_model": "text-embedding-ada-002"
  }
}
```

### **B. QuickSpec Examples**
```typescript
// "Show top brands by revenue this month"
{
  schema: 'QuickSpec@1',
  x: 'brand',
  y: 'revenue', 
  agg: 'sum',
  chart: 'bar',
  filters: { date_month: 'current' },
  topK: 10
}

// "Revenue trend by week for last quarter"
{
  schema: 'QuickSpec@1',
  x: 'date_week',
  y: 'revenue',
  agg: 'sum', 
  chart: 'line',
  filters: { date_quarter: 'last' }
}
```

### **C. Router Response Schema**
```json
{
  "intent": "executive",
  "confidence": 0.95,
  "data": { /* RPC response payload */ },
  "cache": "HIT",
  "latency_ms": 123,
  "model_used": "forecast|ces|recommendations",
  "fallback_chain": ["primary", "secondary"]
}
```

---

**Document Status**: ✅ **Approved for Implementation**  
**Last Updated**: 2025-09-12 14:30 UTC  
**Version**: 2.0 (Neural DataBank Integration)  
**Owner**: Product Engineering Team