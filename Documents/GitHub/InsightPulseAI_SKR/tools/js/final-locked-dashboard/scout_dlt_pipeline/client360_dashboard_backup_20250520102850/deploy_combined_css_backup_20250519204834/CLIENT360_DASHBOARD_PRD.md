# TBWA Client 360 Dashboard
# Product Requirements Document (PRD)

**Version:** 2.3.0  
**Last Updated:** May 19, 2025  
**Status:** Approved  
**Owner:** TBWA\Digital Strategy Team

---

## Executive Summary

The TBWA Client 360 Dashboard provides comprehensive visibility into retail performance across Sari-Sari stores in the Philippines. It consolidates real-time transaction data, customer insights, geographic intelligence, and AI-driven recommendations into a single, intuitive interface. The dashboard enables brand managers, marketers, and executives to make data-driven decisions about product placement, marketing spend, and promotional strategies.

This latest version (2.3.0) introduces the unified TBWA design system, enhanced geospatial visualization, AI-powered brand insights, and an expanded sample data package for reliable demonstration and development.

---

## Product Overview

### Purpose & Goals

The Client 360 Dashboard addresses several critical business challenges:

1. **Fragmented Data Sources**: Consolidates data from transactions, visual detections, device telemetry, and customer interactions
2. **Limited Geographic Intelligence**: Provides spatial visualization of store network performance across the Philippines
3. **Reactive Decision Making**: Surfaces predictive insights and recommendations to enable proactive strategy
4. **Inconsistent Brand Experience**: Delivers unified TBWA-branded visualization experience across metrics

### Target Users

| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| Brand Managers | Responsible for specific product brands | Track brand performance, competitor positioning, sentiment |
| Marketing Executives | Oversee marketing campaigns and budgets | Measure ROI, optimize channel mix, conversion rates |
| Retail Strategists | Develop Sari-Sari store partnerships | Identify high-potential locations, monitor store health |
| Field Operations | Support store-level implementation | Track device health, replenishment needs, engagement |
| Agency Teams | Create communications and campaigns | Understand Filipino market insights, customer language |

### Success Metrics

1. **Data Consolidation**: 100% of relevant data sources integrated into a single view
2. **User Adoption**: >85% usage rate among target users (measured by login frequency)
3. **Decision Influence**: >90% of strategic decisions reference dashboard insights
4. **Time Savings**: Reduce report generation time by 75% compared to manual processes
5. **Insight Quality**: >80% of AI recommendations rated as "actionable" by users

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

### 2. Geospatial Store Map

#### 2.1 Philippines Map Display
- Interactive map of the Philippines with:
  - Store locations displayed as markers/pins
  - Clustered representation for dense areas
  - Color-coded indicators based on selected metric

#### 2.2 Map Controls
- Metric selector (sales, stockouts, uptime %)
- Zoom and pan navigation
- Region/province filtering
- Store type filtering

#### 2.3 Store Information
- Click-to-view store details popup:
  - Store name, owner, contact information
  - Performance metrics (sales, traffic, conversion)
  - Device health status
  - Recent transactions and inventory alerts

### 3. Brand Performance Analytics

#### 3.1 Brand Comparison
- Side-by-side visualization of brand metrics:
  - Market share
  - Share of voice
  - Sentiment ratings
  - Growth trajectory

#### 3.2 Competitive Positioning
- Relative performance against competitor brands:
  - Price position
  - Quality perception
  - Availability metrics
  - Customer preference

#### 3.3 Brand Health Indicators
- TBWA-specific brand health framework metrics:
  - Brand recognition
  - Purchase intent
  - Customer loyalty
  - Price sensitivity

### 4. Transaction Metrics Module

#### 4.1 Transaction Dashboard
- Comprehensive view of purchase behavior:
  - Average transaction duration
  - Products per transaction
  - Average basket value
  - Completion rate
  - Dwell time
  - Total transaction count

#### 4.2 Product Substitution Analysis
- Table of product substitutions with:
  - Original product
  - Substituted product
  - Substitution count
  - Reasons for substitution

#### 4.3 Customer Request Patterns
- Analysis of customer inquiries and requests:
  - Request categories
  - Frequency
  - Regional patterns
  - Day-of-week distribution

#### 4.4 Unbranded Item Detection
- List of products mentioned without specific brand:
  - Category association
  - Frequency
  - Volumes
  - Opportunity sizing

### 5. AI-Powered Insights

#### 5.1 Actionable Recommendations
- AI-generated suggestions with clear ROI impact:
  - Budget allocation opportunities
  - Inventory optimization
  - Technical improvements
  - Promotion ideas

#### 5.2 Brand Dictionary
- Natural language analysis of brand associations:
  - Most mentioned brands with percentages
  - Popular word associations
  - Regional linguistic variations

#### 5.3 Emotional & Contextual Analysis
- Insights into customer emotional connections:
  - Peak purchasing times
  - Consumption contexts ("school," "morning routine")
  - Price sensitivity factors
  - Need states

#### 5.4 Bundling Opportunities
- Product affinity analysis:
  - High correlation product pairs
  - Bundle promotion suggestions
  - Estimated basket size increase
  - Optimal merchandising placement

### 6. Filter & Control System

#### 6.1 Global Filters
- Universal controls affecting all dashboard components:
  - Date range selection
  - Organization/brand filter
  - Region/market filter
  - Category/product line filter
  - Channel filter (online/in-store)
  - Custom tag filters

#### 6.2 Data Source Toggle
- Switch between simulated and real-time data
- Clear visual indication of current data source
- Timestamp of last data refresh

#### 6.3 Export Capability
- Download options for all visualizations:
  - CSV export for raw data
  - PPTX export for presentations
  - Image export for quick sharing

### 7. Documentation & Guidance

#### 7.1 Advertiser's Guide
- Comprehensive non-technical introduction:
  - Dashboard purpose and benefits
  - Section-by-section feature overview
  - Use cases and scenarios
  - Common questions and solutions

#### 7.2 Quick Start Elements
- Onboarding assistance:
  - First-time user tips
  - Feature highlights
  - Guided tour option
  - Context-sensitive help

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
  - Accessibility compliance

#### 1.3 Chart Theming
- Unified visualization appearance:
  - Consistent color schemes across charts
  - Standardized typography in legends and labels
  - Branded tooltip styling
  - Intuitive visual hierarchy

### 2. Data Requirements

#### 2.1 Sample Data Package
- Comprehensive demonstration data:
  - **stores.geojson**: Store locations with metadata
  - **sari_sari_transactions.json**: Transaction records
  - **sari_sari_heartbeat.json**: Device health data
  - **sari_sari_visual_data.json**: Computer vision analysis
  - **product_catalog.json**: Product information

#### 2.2 Schema Standardization
- Consistent field naming and structure:
  - `store_id` format: "sari-XXX"
  - `device_id` format: "device-XXX"
  - `session_id` format: "session-XXX-MMDD-HHMM"
  - ISO 8601 timestamps with timezone
  - `simulated: true` flag in all sample records

#### 2.3 Data Freshness
- Clear indication of data recency:
  - Last updated timestamp
  - Visual freshness indicators
  - Scheduled refresh intervals
  - Manual refresh option

### 3. Component Integration

#### 3.1 Map Component
- Integration with Leaflet.js:
  - Custom pin styling
  - Clustered marker management
  - GeoJSON data loading
  - Interactive layer controls

#### 3.2 Chart Components
- Standardized Chart.js implementation:
  - Responsive sizing
  - Touch interaction support
  - Animation configuration
  - Branded styling

#### 3.3 Transaction Metrics
- Data visualization modules:
  - KPI cards with trend indicators
  - Substitution analysis table
  - Request pattern visualization
  - Unbranded item detection

#### 3.4 AI Insights Component
- Dynamic insight generation:
  - Data-driven recommendations
  - Brand association analysis
  - Sentiment visualization
  - Opportunity identification

### 4. Performance & Reliability

#### 4.1 Loading Performance
- Optimization requirements:
  - Initial load < 3 seconds on standard connections
  - Component lazy-loading implementation
  - Asset optimization (minification, compression)
  - Caching strategy

#### 4.2 Responsiveness
- Cross-device compatibility:
  - Desktop (1920×1080 and higher)
  - Tablet (iPad and similar)
  - Mobile view (minimum 375px width)
  - Touch interaction support

#### 4.3 Offline Capability
- Graceful degradation:
  - Cached data availability
  - Clear connectivity indicators
  - Seamless reconnection handling
  - Data synchronization on reconnect

### 5. Deployment & Configuration

#### 5.1 Azure Static Web Apps
- Deployment infrastructure:
  - Automated deployment script
  - Environment configuration
  - CDN integration
  - Security headers

#### 5.2 Feature Flagging
- Configurable functionality:
  - Environment-specific feature toggles
  - Gradual rollout capability
  - A/B testing framework
  - Feature deprecation handling

---

## Non-Functional Requirements

### 1. Security

- Implement secure data handling:
  - Data anonymization for sensitive metrics
  - Role-based access control (future)
  - Secure API communication (future)
  - Audit logging (future)

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

### 4. Performance

- Dashboard operation metrics:
  - Page load time < 3 seconds
  - Interaction response < 200ms
  - Filter application < 500ms
  - Export generation < 5 seconds

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

### Phase 4: TBWA Design System (Current)
- TBWA brand styling
- Unified color system
- Standardized components
- Comprehensive documentation

### Phase 5: Production Readiness (Upcoming)
- Live data integration
- User authentication
- Extended filter capabilities
- Performance optimization

---

## Appendices

### Appendix A: Data Schema Definitions

Detailed specifications for all data structures:

1. **Store Location (GeoJSON)**
   ```json
   {
     "type": "FeatureCollection",
     "features": [{
       "type": "Feature",
       "properties": {
         "store_id": "sari-001",
         "name": "Store Name",
         "owner": "Owner Name",
         "sales_30d": 42500
       },
       "geometry": {
         "type": "Point",
         "coordinates": [longitude, latitude]
       }
     }]
   }
   ```

2. **Transaction Record**
   ```json
   {
     "transaction_id": "tr-001-0519-0001",
     "store_id": "sari-001",
     "device_id": "device-001",
     "session_id": "session-001-0519-0800",
     "timestamp": "2025-05-19T08:15:23+08:00",
     "total_amount": 125.50,
     "payment_method": "cash",
     "items": [
       {"product_id": "prod-001", "name": "Product Name", "quantity": 1, "price": 50.00}
     ]
   }
   ```

3. **Device Heartbeat**
   ```json
   {
     "device_id": "device-001",
     "store_id": "sari-001",
     "timestamp": "2025-05-19T08:00:00+08:00",
     "status": "online",
     "battery_level": 78,
     "storage_used_percent": 65,
     "network_strength": 4
   }
   ```

4. **Visual Detection**
   ```json
   {
     "detection_id": "vis-001-0519-0001",
     "store_id": "sari-001",
     "device_id": "device-001",
     "timestamp": "2025-05-19T08:15:10+08:00",
     "detection_type": "product",
     "detected_objects": [
       {"label": "Product Name", "product_id": "prod-001", "confidence": 0.97}
     ]
   }
   ```

5. **Product Catalog**
   ```json
   {
     "product_id": "prod-001",
     "name": "Product Name",
     "description": "Product description",
     "category": "Category",
     "subcategory": "Subcategory",
     "brand": "Brand Name",
     "wholesale_price": 42.50,
     "suggested_retail_price": 50.00
   }
   ```

### Appendix B: API Specifications

(Reserved for future production implementation)

### Appendix C: External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 2.2.19 | UI styling framework |
| Chart.js | 3.7.1 | Data visualization library |
| Leaflet.js | 1.7.1 | Interactive map capabilities |
| ApexCharts | Latest | Advanced chart types |
| Inter Font | Web Font | Typography system |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-11-15 | J. Santos | Initial PRD creation |
| 1.5.0 | 2025-01-20 | M. Garcia | Added AI insights requirements |
| 2.0.0 | 2025-03-10 | L. Reyes | Expanded geospatial capabilities |
| 2.2.0 | 2025-04-22 | J. Santos | Added transaction metrics module |
| 2.3.0 | 2025-05-19 | A. Cruz | Added TBWA design system & sample data package |

---

## Approvals

| Name | Role | Date | Signature |
|------|------|------|-----------|
| David Miller | Product Director | 2025-05-19 | *Approved* |
| Sarah Johnson | Design Lead | 2025-05-19 | *Approved* |
| Michael Chen | Engineering Lead | 2025-05-19 | *Approved* |
| Lisa Rodriguez | Client Partner | 2025-05-19 | *Approved* |