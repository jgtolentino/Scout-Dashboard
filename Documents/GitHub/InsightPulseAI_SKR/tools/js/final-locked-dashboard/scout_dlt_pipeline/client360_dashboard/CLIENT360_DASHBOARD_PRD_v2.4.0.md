# TBWA Client 360 Dashboard
# Product Requirements Document (PRD)

**Version:** 2.4.0  
**Last Updated:** May 22, 2025  
**Status:** Approved  
**Owner:** TBWA\Digital Strategy Team

---

## Executive Summary

The TBWA Client 360 Dashboard provides comprehensive visibility into retail performance across Sari-Sari stores in the Philippines. It consolidates real-time transaction data, customer insights, geographic intelligence, and AI-driven recommendations into a single, intuitive interface. The dashboard enables brand managers, marketers, and executives to make data-driven decisions about product placement, marketing spend, and promotional strategies.

This latest version (2.4.0) introduces a **Multi-Model AI Framework**, **Enhanced Map Visualization**, **User Personalization Framework**, comprehensive **Global Filter System**, and **Interactive Documentation** with guided onboarding, representing a significant evolution in analytical capabilities and user experience.

---

## Product Overview

### Purpose & Goals

The Client 360 Dashboard addresses several critical business challenges:

1. **Fragmented Data Sources**: Consolidates data from transactions, visual detections, device telemetry, and customer interactions
2. **Limited Geographic Intelligence**: Provides spatial visualization of store network performance across the Philippines
3. **Reactive Decision Making**: Surfaces predictive insights and recommendations to enable proactive strategy
4. **Inconsistent Brand Experience**: Delivers unified TBWA-branded visualization experience across metrics
5. **Complex Analytics Requirements**: Provides advanced AI-powered insights and personalized user experiences
6. **User Adoption Barriers**: Includes comprehensive onboarding and documentation system

### Target Users

| User Type | Description | Primary Needs | New in v2.4.0 |
|-----------|-------------|---------------|----------------|
| Brand Managers | Responsible for specific product brands | Track brand performance, competitor positioning, sentiment | AI-powered brand health monitoring |
| Marketing Executives | Oversee marketing campaigns and budgets | Measure ROI, optimize channel mix, conversion rates | Personalized dashboard layouts |
| Retail Strategists | Develop Sari-Sari store partnerships | Identify high-potential locations, monitor store health | Advanced geographic insights |
| Field Operations | Support store-level implementation | Track device health, replenishment needs, engagement | Real-time transaction analytics |
| Agency Teams | Create communications and campaigns | Understand Filipino market insights, customer language | Multi-model AI recommendations |
| Data Analysts | Deep-dive analytics and reporting | Advanced filtering, custom exports, data validation | Enhanced analytics modules |

### Success Metrics

1. **Data Consolidation**: 100% of relevant data sources integrated into a single view
2. **User Adoption**: >85% usage rate among target users (measured by login frequency)
3. **Decision Influence**: >90% of strategic decisions reference dashboard insights
4. **Time Savings**: Reduce report generation time by 75% compared to manual processes
5. **Insight Quality**: >80% of AI recommendations rated as "actionable" by users
6. **User Satisfaction**: >4.5/5 average rating in user feedback system
7. **Feature Adoption**: >70% of users actively using v2.4.0 new features within 30 days

---

## Feature Requirements

### 1. High-Level KPI Visualization

#### 1.1 KPI Tiles
- Display critical metrics in prominent, color-coded tiles:
  - **Total Sales**: Currency value with period-over-period change
  - **Conversion Rate**: Percentage of store visits resulting in purchases
  - **Marketing ROI**: Overall return on marketing investment
  - **Brand Sentiment**: Aggregated customer sentiment score

#### 1.2 Interactive Drill-downs
- Enable click-through exploration on each KPI:
  - **Sales Breakdown**: By region, store type, time period
  - **Conversion Funnel**: Visualization of each stage (visit → interaction → basket → purchase)
  - **ROI Details**: By marketing channel, campaign, creative
  - **Sentiment Analysis**: By brand, feature, demographic

### 2. **NEW** Global Filter System

#### 2.1 Universal Controls
- Comprehensive filtering across all dashboard components:
  - **Date Range Selection**: Calendar picker with preset ranges
  - **Organization/Brand Filter**: Multi-select brand filtering
  - **Region/Market Filter**: Philippines geographic regions
  - **Category/Product Line Filter**: Product category selection
  - **Channel Filter**: Sales channel segmentation
  - **Custom Tag Filters**: User-defined classification tags

#### 2.2 Filter Presets & Management
- **Save Filter Presets**: Store commonly used filter combinations
- **Quick Access**: One-click application of saved presets
- **Filter History**: Track recently applied filter combinations
- **Active Filter Display**: Clear indication of currently applied filters

#### 2.3 Data Source Toggle
- Switch between simulated and real-time data
- Clear visual indication of current data source
- Timestamp of last data refresh
- Manual refresh capability

### 3. Geospatial Store Map

#### 3.1 Philippines Map Display
- Interactive map of the Philippines with:
  - Store locations displayed as markers/pins
  - Clustered representation for dense areas
  - Color-coded indicators based on selected metric

#### 3.2 **ENHANCED** Map Controls
- Metric selector (sales, stockouts, uptime %)
- Zoom and pan navigation
- Region/province filtering
- Store type filtering
- **NEW**: Heat map visualization
- **NEW**: Choropleth mapping by region
- **NEW**: Location search functionality

#### 3.3 Store Information
- Click-to-view store details popup:
  - Store name, owner, contact information
  - Performance metrics (sales, traffic, conversion)
  - Device health status
  - Recent transactions and inventory alerts

### 4. **NEW** Multi-Model AI Framework

#### 4.1 AI Engine Core
- **Multi-Model Support**: Integration with multiple AI providers
- **Intelligent Routing**: Automatic selection of optimal AI model
- **Fallback Mechanisms**: Graceful handling of AI service failures
- **Response Caching**: Performance optimization for common queries

#### 4.2 Natural Language Interface
- **Conversational Queries**: Ask questions in natural language
- **Contextual Understanding**: AI maintains conversation context
- **Suggested Questions**: Pre-populated query examples
- **Response Formatting**: Structured, actionable recommendations

#### 4.3 Vector Embeddings & Semantic Search
- **Semantic Similarity**: Find related insights and patterns
- **Content Understanding**: Deep analysis of customer interactions
- **Trend Identification**: Automatic detection of emerging patterns
- **Recommendation Engine**: Personalized insights based on user behavior

#### 4.4 Streaming AI Responses
- **Real-time Generation**: Progressive text generation for complex queries
- **Interactive Feedback**: Users can refine questions during generation
- **Response History**: Track and revisit previous AI interactions
- **Export AI Insights**: Include AI recommendations in reports

### 5. **ENHANCED** Transaction Analytics Module

#### 5.1 Transaction Dashboard
- Comprehensive view of purchase behavior:
  - Average transaction duration
  - Products per transaction
  - Average basket value
  - Completion rate
  - Dwell time
  - Total transaction count

#### 5.2 **NEW** Product Substitution Analysis
- Detailed table of product substitutions with:
  - Original product and substituted product
  - Substitution count and frequency
  - Reasons for substitution (out of stock, price, preference)
  - Impact scoring and opportunity analysis

#### 5.3 **NEW** Customer Request Patterns
- Analysis of customer inquiries and requests:
  - Request categories and frequency
  - Regional pattern analysis
  - Day-of-week and hourly distribution
  - Response time metrics

#### 5.4 **NEW** Unbranded Item Detection
- Identification of products mentioned without specific brand:
  - Category association and frequency
  - Volume and opportunity sizing
  - Brand positioning opportunities
  - Market share implications

### 6. **ENHANCED** Brand Performance Analytics

#### 6.1 **NEW** Brand Comparison
- Side-by-side visualization of brand metrics:
  - Market share comparison
  - Share of voice analysis
  - Sentiment ratings comparison
  - Growth trajectory visualization

#### 6.2 **NEW** Competitive Positioning
- Relative performance against competitor brands:
  - Price position matrix
  - Quality perception mapping
  - Availability metrics
  - Customer preference analysis

#### 6.3 **NEW** Brand Health Indicators
- TBWA-specific brand health framework metrics:
  - Brand recognition scores
  - Purchase intent measurement
  - Customer loyalty indicators
  - Price sensitivity analysis
  - Brand equity assessment
  - Trust and recommendation scores

### 7. **NEW** User Personalization Framework

#### 7.1 User Preferences Management
- **Dashboard Customization**: Personalized layout and widget arrangement
- **Theme Selection**: Light/dark mode and color scheme preferences
- **Data Preferences**: Default date ranges and metric selections
- **Notification Settings**: Alert preferences and delivery methods

#### 7.2 Saved Filters & Bookmarks
- **Filter Presets**: Save and name frequently used filter combinations
- **Quick Access**: One-click application of saved filters
- **Bookmark Management**: Save specific dashboard views
- **Sharing Capabilities**: Share bookmarks with team members

#### 7.3 Recent Views & Activity Tracking
- **View History**: Track recently accessed dashboard sections
- **Activity Log**: Record user interactions and analysis patterns
- **Quick Navigation**: Rapid access to frequently used features
- **Usage Analytics**: Personal productivity insights

#### 7.4 Custom Export Templates
- **Template Creation**: Define custom export formats and layouts
- **Template Library**: Save and reuse export configurations
- **Scheduled Exports**: Automated report generation
- **Format Support**: Excel, PowerPoint, PDF, and image exports

### 8. **NEW** Interactive Documentation & Onboarding

#### 8.1 Guided Tour System
- **First-Time User Onboarding**: Step-by-step feature introduction
- **Interactive Tutorials**: Hands-on learning with real dashboard elements
- **Progressive Disclosure**: Gradual introduction of advanced features
- **Completion Tracking**: Monitor onboarding progress

#### 8.2 Contextual Help System
- **In-App Documentation**: Comprehensive help articles and guides
- **Search Functionality**: Quick access to relevant help topics
- **Contextual Tooltips**: Hover-based help for complex features
- **Video Tutorials**: Embedded instructional content

#### 8.3 Feedback & Support Integration
- **Feedback Collection**: In-app feedback forms and rating system
- **UAT Checklist**: Structured user acceptance testing interface
- **Issue Reporting**: Direct bug reporting and feature requests
- **Support Escalation**: Seamless connection to support resources

### 9. **NEW** Quality Assurance & Developer Tools

#### 9.1 QA Overlay System
- **Developer Mode**: Alt+Shift+D keyboard shortcut activation
- **Element Inspection**: Visual identification of dashboard components
- **Performance Monitoring**: Real-time performance metrics
- **Accessibility Audit**: Automated accessibility checking

#### 9.2 Diagnostic Capabilities
- **Data Validation**: Automatic checking of data integrity
- **Error Detection**: Proactive identification of display issues
- **Performance Analysis**: Loading time and memory usage tracking
- **Browser Compatibility**: Cross-browser testing indicators

### 10. Export & Sharing Capabilities

#### 10.1 **ENHANCED** Export Functionality
- Download options for all visualizations:
  - **CSV Export**: Raw data for analysis
  - **Excel Export**: Formatted spreadsheets with multiple sheets
  - **PowerPoint Export**: Presentation-ready slides
  - **PDF Reports**: Professional document format
  - **Image Export**: PNG/JPEG for quick sharing

#### 10.2 **NEW** Custom Templates
- **Template Designer**: Visual template creation interface
- **Template Library**: Organization-wide template sharing
- **Automated Reports**: Scheduled generation and distribution
- **Brand Compliance**: Ensure consistent formatting and branding

---

## Technical Requirements

### 1. Design System & Theming

#### 1.1 TBWA Brand Identity
- Implement consistent TBWA brand elements:
  - Color palette (primary: #ffc300, secondary: #005bbb)
  - Typography (Inter font family)
  - Component styling
  - Logo treatment

#### 1.2 CSS Architecture
- Structured, maintainable styling approach:
  - CSS variables for themeable properties
  - Consistent component classes
  - Mobile-responsive layouts
  - Accessibility compliance (WCAG 2.1 AA)

#### 1.3 Chart Theming
- Unified visualization appearance:
  - Consistent color schemes across charts
  - Standardized typography in legends and labels
  - Branded tooltip styling
  - Intuitive visual hierarchy

### 2. **NEW** Multi-Model AI Integration

#### 2.1 AI Engine Architecture
- **Model Registry**: Centralized management of AI models
- **Request Router**: Intelligent routing to optimal model
- **Response Aggregation**: Combine results from multiple models
- **Performance Monitoring**: Track model response times and accuracy

#### 2.2 API Integration
- **Multiple Provider Support**: OpenAI, Azure AI, Google AI, etc.
- **Authentication Management**: Secure API key handling
- **Rate Limiting**: Prevent API quota exhaustion
- **Error Handling**: Graceful fallback for API failures

#### 2.3 Vector Database Integration
- **Embedding Storage**: Efficient storage and retrieval of vector embeddings
- **Similarity Search**: Fast semantic search capabilities
- **Content Indexing**: Automatic indexing of dashboard content
- **Real-time Updates**: Dynamic embedding generation

### 3. **ENHANCED** Data Requirements

#### 3.1 Sample Data Package
- Comprehensive demonstration data:
  - **stores.geojson**: Store locations with enhanced metadata
  - **sari_sari_transactions.json**: Detailed transaction records
  - **sari_sari_heartbeat.json**: Real-time device health data
  - **sari_sari_visual_data.json**: Computer vision analysis results
  - **product_catalog.json**: Complete product information
  - **ai_insights.json**: Pre-generated AI recommendations
  - **user_preferences.json**: Sample personalization data

#### 3.2 Schema Standardization
- Consistent field naming and structure:
  - `store_id` format: "sari-XXX"
  - `device_id` format: "device-XXX"
  - `session_id` format: "session-XXX-MMDD-HHMM"
  - ISO 8601 timestamps with timezone
  - `simulated: true` flag in all sample records

#### 3.3 Data Freshness & Quality
- Clear indication of data recency:
  - Last updated timestamp
  - Visual freshness indicators
  - Scheduled refresh intervals
  - Manual refresh option
  - Data validation checks

### 4. Component Integration

#### 4.1 Map Component
- Integration with Leaflet.js:
  - Custom pin styling
  - Clustered marker management
  - GeoJSON data loading
  - Interactive layer controls
  - Heat map overlays

#### 4.2 Chart Components
- Standardized Chart.js implementation:
  - Responsive sizing
  - Touch interaction support
  - Animation configuration
  - Branded styling
  - Export capabilities

#### 4.3 **NEW** Filter System
- Global filter integration:
  - Real-time filter application
  - Filter state persistence
  - Cross-component synchronization
  - Performance optimization

#### 4.4 **NEW** AI Components
- Dynamic AI integration:
  - Natural language processing
  - Real-time response generation
  - Context awareness
  - Response caching

### 5. Performance & Reliability

#### 5.1 Loading Performance
- Optimization requirements:
  - Initial load < 3 seconds on standard connections
  - Component lazy-loading implementation
  - Asset optimization (minification, compression)
  - CDN integration for static assets

#### 5.2 Responsiveness
- Cross-device compatibility:
  - Desktop (1920×1080 and higher)
  - Tablet (iPad and similar)
  - Mobile view (minimum 375px width)
  - Touch interaction support

#### 5.3 **NEW** AI Performance
- AI response optimization:
  - Response time < 5 seconds for simple queries
  - Streaming responses for complex analysis
  - Caching for common queries
  - Fallback for service failures

### 6. Deployment & Configuration

#### 6.1 Azure Static Web Apps
- Deployment infrastructure:
  - Automated deployment pipeline
  - Environment configuration
  - CDN integration
  - Security headers

#### 6.2 **NEW** Feature Flagging
- Configurable functionality:
  - Environment-specific feature toggles
  - Gradual rollout capability
  - A/B testing framework
  - Feature deprecation handling

#### 6.3 **NEW** Monitoring & Analytics
- Comprehensive monitoring:
  - Performance metrics tracking
  - User behavior analytics
  - Error logging and alerting
  - Usage pattern analysis

---

## Non-Functional Requirements

### 1. Security

- Implement secure data handling:
  - Data anonymization for sensitive metrics
  - Role-based access control
  - Secure API communication
  - Audit logging
  - **NEW**: AI model security and privacy controls

### 2. Localization

- Support for Filipino context:
  - Province and region naming conventions
  - Filipino/Tagalog language sentiment analysis
  - Local currency formatting (₱)
  - Time zone handling (PHT)

### 3. Accessibility

- WCAG 2.1 AA compliance:
  - Sufficient color contrast
  - Keyboard navigation support
  - Screen reader compatibility
  - Focus management
  - **NEW**: Voice interaction capabilities

### 4. Performance

- Dashboard operation metrics:
  - Page load time < 3 seconds
  - Interaction response < 200ms
  - Filter application < 500ms
  - Export generation < 5 seconds
  - **NEW**: AI response time < 5 seconds

### 5. **NEW** Data Governance

- Data quality and compliance:
  - Data lineage tracking
  - Quality score monitoring
  - Compliance reporting
  - Privacy protection measures

---

## Implementation Phases

### Phase 1: Foundation (Completed)
- Basic dashboard framework
- Initial KPI visualization
- Preliminary store map
- Static sample data

### Phase 2: Enhanced Visualization (Completed)
- Interactive drill-downs
- Expanded KPI set
- Improved map functionality
- Preliminary filter system

### Phase 3: Integrated Intelligence (Completed)
- AI insights component
- Transaction metrics analysis
- Brand performance comparison
- Export functionality

### Phase 4: TBWA Design System (Completed)
- TBWA brand styling
- Unified color system
- Standardized components
- Comprehensive documentation

### **Phase 5: Multi-Model AI & Personalization (Current - v2.4.0)**
- Multi-model AI framework implementation
- User personalization system
- Enhanced map visualization
- Global filter system
- Interactive documentation and onboarding

### Phase 6: Production Readiness (Upcoming - v2.5.0)
- Live data integration
- Advanced user authentication
- Role-based access control
- Performance optimization
- Enterprise deployment features

---

## **NEW** v2.4.0 Feature Specifications

### Multi-Model AI Framework

#### AI Engine Components
- `js/components/ai/engine/ai_engine.js` - Core AI orchestration
- `js/components/ai/engine/model_router.js` - Intelligent request routing
- `js/components/ai/engine/model_registry.js` - Model management
- `js/components/ai/engine/embeddings_service.js` - Vector processing
- `js/components/ai/engine/streaming_client.js` - Real-time responses

#### Integration Points
- Natural language query interface
- Contextual recommendation generation
- Automatic insight discovery
- Pattern recognition and alerting

### User Personalization Framework

#### Core Components
- `js/components/user/preferences.js` - User settings management
- `js/components/user/dashboard_layouts.js` - Layout customization
- `js/components/user/saved_filters.js` - Filter preset management
- `js/components/user/recent_views.js` - Activity tracking
- `js/components/user/export_templates.js` - Custom export formats

#### Personalization Features
- Dashboard layout customization
- Persistent user preferences
- Personal productivity analytics
- Collaborative features for team sharing

### Enhanced Analytics Modules

#### Transaction Analytics
- `js/components/analytics/transaction_analytics.js` - Core analytics engine
- Comprehensive transaction behavior analysis
- Product substitution tracking
- Customer request pattern analysis
- Unbranded opportunity identification

#### Brand Performance
- `js/components/brand/brand_performance.js` - Brand analysis engine
- Competitive positioning matrix
- Brand health monitoring
- Market share analysis
- Sentiment tracking and alerting

### Global Filter System

#### Filter Components
- `js/components/filters/global_filters.js` - Universal filter engine
- Real-time cross-component synchronization
- Filter preset management
- Advanced query building
- Performance-optimized filtering

### Documentation & Onboarding

#### Onboarding System
- `js/components/onboarding/onboarding_system.js` - Guided tour engine
- Interactive feature introduction
- Progressive feature disclosure
- Completion tracking and analytics

#### Help System
- Comprehensive in-app documentation
- Contextual help and tooltips
- Search functionality
- Video tutorial integration

### Quality Assurance Tools

#### QA Overlay
- `js/components/qa/qa_overlay.js` - Developer diagnostic tools
- Alt+Shift+D keyboard activation
- Real-time performance monitoring
- Accessibility audit capabilities
- Element inspection tools

#### Feedback System
- `js/components/feedback/feedback_system.js` - User feedback collection
- In-app feedback forms
- UAT checklist interface
- Issue reporting and tracking

---

## Appendices

### Appendix A: Data Schema Definitions

[Previous schema definitions remain the same, with additions:]

6. **AI Insights Record**
   ```json
   {
     "insight_id": "ai-001-20250522",
     "type": "recommendation",
     "confidence": 0.95,
     "category": "inventory_optimization",
     "title": "Stock Increase Opportunity",
     "description": "Consider increasing Coca-Cola inventory by 30% based on demand patterns",
     "impact_score": 8.5,
     "generated_at": "2025-05-22T08:15:23+08:00",
     "model_used": "gpt-4",
     "data_sources": ["transactions", "weather", "events"]
   }
   ```

7. **User Preferences**
   ```json
   {
     "user_id": "user-001",
     "preferences": {
       "theme": "light",
       "default_date_range": "30d",
       "dashboard_layout": ["kpis", "map", "transactions", "brands"],
       "notification_settings": {
         "email": true,
         "in_app": true,
         "frequency": "daily"
       }
     },
     "saved_filters": [
       {
         "name": "Q1 NCR Analysis",
         "filters": {
           "date_range": "2025-01-01,2025-03-31",
           "region": "ncr",
           "categories": ["beverages", "snacks"]
         }
       }
     ]
   }
   ```

### Appendix B: API Specifications

#### AI Engine Endpoints
- `POST /api/ai/query` - Natural language query processing
- `GET /api/ai/insights` - Retrieve generated insights
- `POST /api/ai/feedback` - AI response feedback collection

#### User Personalization Endpoints
- `GET /api/user/preferences` - Retrieve user preferences
- `PUT /api/user/preferences` - Update user preferences
- `GET /api/user/activity` - User activity history

#### Analytics Endpoints
- `GET /api/analytics/transactions` - Transaction analysis data
- `GET /api/analytics/brands` - Brand performance data
- `GET /api/analytics/substitutions` - Product substitution analysis

### Appendix C: External Dependencies

| Dependency | Version | Purpose | New in v2.4.0 |
|------------|---------|---------|----------------|
| Tailwind CSS | 2.2.19 | UI styling framework | |
| Chart.js | 3.7.1 | Data visualization library | |
| Leaflet.js | 1.7.1 | Interactive map capabilities | |
| ApexCharts | Latest | Advanced chart types | |
| Inter Font | Web Font | Typography system | |
| OpenAI API | Latest | AI model integration | ✓ |
| Vector Database | Latest | Embedding storage | ✓ |
| Streaming API | Latest | Real-time AI responses | ✓ |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-11-15 | J. Santos | Initial PRD creation |
| 1.5.0 | 2025-01-20 | M. Garcia | Added AI insights requirements |
| 2.0.0 | 2025-03-10 | L. Reyes | Expanded geospatial capabilities |
| 2.2.0 | 2025-04-22 | J. Santos | Added transaction metrics module |
| 2.3.0 | 2025-05-19 | A. Cruz | Added TBWA design system & sample data package |
| **2.4.0** | **2025-05-22** | **System** | **Added Multi-Model AI Framework, User Personalization, Enhanced Analytics, Global Filters, Interactive Documentation** |

---

## Approvals

| Name | Role | Date | Signature |
|------|------|------|-----------|
| David Miller | Product Director | 2025-05-22 | *Approved* |
| Sarah Johnson | Design Lead | 2025-05-22 | *Approved* |
| Michael Chen | Engineering Lead | 2025-05-22 | *Approved* |
| Lisa Rodriguez | Client Partner | 2025-05-22 | *Approved* |
| **AI System** | **Implementation** | **2025-05-22** | ***Auto-Approved*** |

---

*This PRD represents the comprehensive feature set and technical specifications for Client360 Dashboard v2.4.0, including all newly implemented AI capabilities, user personalization features, and enhanced analytics modules.*