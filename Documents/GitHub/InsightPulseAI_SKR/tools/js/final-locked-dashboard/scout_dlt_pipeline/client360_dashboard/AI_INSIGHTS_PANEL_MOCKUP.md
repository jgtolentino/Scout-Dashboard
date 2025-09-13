# AI Insights Panel Mockup - Client360 Dashboard Integration

## Visual Representation

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   AI-POWERED INSIGHT PANEL                    ┃
┃                                                               ┃
┃   ┌───────────────────────────┐   ┌───────────────────────┐  ┃
┃   │ Insight Type: [All      ▼] │   │ [SYNTHETIC DATA]     │  ┃
┃   └───────────────────────────┘   └───────────────────────┘  ┃
┃                                                               ┃
┃   ┌─ SALES PERFORMANCE INSIGHTS ───────────────────────────┐  ┃
┃   │                                                         │  ┃
┃   │  ┌────────────────────────────────────────────────┐    │  ┃
┃   │  │ [HIGH] Beverage Sales Growth Opportunity       │    │  ┃
┃   │  │ Beverages show strong growth potential with    │    │  ┃
┃   │  │ 15% higher margins than category average.      │    │  ┃
┃   │  │                                                │    │  ┃
┃   │  │ May 21, 2025           [SYNTHETIC]  [Details▼] │    │  ┃
┃   │  └────────────────────────────────────────────────┘    │  ┃
┃   │                                                         │  ┃
┃   │  ┌────────────────────────────────────────────────┐    │  ┃
┃   │  │ [MED] Personal Care Product Decline            │    │  ┃
┃   │  │ Personal care products showing 12% decline     │    │  ┃
┃   │  │ month-over-month with lower engagement.        │    │  ┃
┃   │  │                                                │    │  ┃
┃   │  │ May 21, 2025           [SYNTHETIC]  [Details▼] │    │  ┃
┃   │  └────────────────────────────────────────────────┘    │  ┃
┃   └─────────────────────────────────────────────────────────┘  ┃
┃                                                               ┃
┃   ┌─ BRAND ANALYSIS ───────────────────────────────────────┐  ┃
┃   │                                                         │  ┃
┃   │  ┌────────────────────────────────────────────────┐    │  ┃
┃   │  │ [MED] Strong Brand Loyalty in Manila Region    │    │  ┃
┃   │  │ Coca-Cola shows exceptional customer loyalty   │    │  ┃
┃   │  │ with 85% repeat purchases.                     │    │  ┃
┃   │  │                                                │    │  ┃
┃   │  │ May 21, 2025           [SYNTHETIC]  [Details▼] │    │  ┃
┃   │  └────────────────────────────────────────────────┘    │  ┃
┃   │                                                         │  ┃
┃   └─────────────────────────────────────────────────────────┘  ┃
┃                                                               ┃
┃   ┌─ STRATEGIC RECOMMENDATIONS ───────────────────────────┐  ┃
┃   │                                                         │  ┃
┃   │  ┌────────────────────────────────────────────────┐    │  ┃
┃   │  │ [HIGH] Product Mix Optimization Plan           │    │  ┃
┃   │  │ Restructuring store layout and product mix     │    │  ┃
┃   │  │ could increase monthly sales by 22%.           │    │  ┃
┃   │  │                                                │    │  ┃
┃   │  │ May 21, 2025           [SYNTHETIC]  [Details▼] │    │  ┃
┃   │  └────────────────────────────────────────────────┘    │  ┃
┃   └─────────────────────────────────────────────────────────┘  ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Expanded Insight Card (When Details Button is Clicked)

```
┌────────────────────────────────────────────────────────────────┐
│ [HIGH] Product Mix Optimization Plan                           │
│ Restructuring store layout and product mix could               │
│ increase monthly sales by 22%.                                 │
│                                                                │
│ ┌── STORE ASSESSMENT ─────────────────────────────────────┐   │
│ │ Rating: 7.2/10                                          │   │
│ │                                                         │   │
│ │ Strengths:                                              │   │
│ │ • Good customer service                                 │   │
│ │ • Strong location                                       │   │
│ │ • Consistent operating hours                            │   │
│ │                                                         │   │
│ │ Areas for Improvement:                                  │   │
│ │ • Limited shelf space                                   │   │
│ │ • Inefficient product mix                               │   │
│ │ • Irregular stock levels                                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌── ACTION PLAN ───────────────────────────────────────────┐  │
│ │ IMPLEMENT PLANOGRAM FOR OPTIMAL SHELF ORGANIZATION       │  │
│ │ Timeline: Immediate                                      │  │
│ │ Expected Outcome: 15% improvement in sales per shelf     │  │
│ │                                                          │  │
│ │ INCREASE STOCK OF HIGH-MARGIN BEVERAGE PRODUCTS          │  │
│ │ Timeline: Within 2 weeks                                 │  │
│ │ Expected Outcome: 10% increase in category sales         │  │
│ │                                                          │  │
│ │ ADD POINT-OF-PURCHASE DISPLAYS FOR IMPULSE ITEMS         │  │
│ │ Timeline: Within 1 month                                 │  │
│ │ Expected Outcome: 8% increase in average transaction     │  │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                │
│ May 21, 2025                   [SYNTHETIC]  [Collapse▲]       │
└────────────────────────────────────────────────────────────────┘
```

## Integration Points

1. **Data Source Toggle Integration**
   The AI Insights panel will be connected to the main dashboard's data source toggle (simulation/live) to ensure consistency across all components.

2. **Positioning in Dashboard Layout**
   The AI Insights panel will be positioned after the Geospatial Map component and before the footer, as per the wireframe.

3. **Theme Consistency**
   The panel will follow the TBWA design system with consistent use of:
   - Color palette (primary: #ffc300, secondary: #005bbb)
   - Typography (Inter font family)
   - Component styling
   - Visual hierarchy

4. **Responsive Design**
   - On large screens: 3-column grid of insight cards
   - On medium screens: 2-column grid of insight cards
   - On small screens: 1-column stack of insight cards

## Technical Implementation

1. The AI Insights component will be added to the dashboard.js initialization:
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
     // ... existing initializations
     initializeAIInsightPanel();
     // ... 
   });
   ```

2. The component will pull data from `/data/ai/insights/all_insights_latest.json`

3. Data source toggle integration:
   ```javascript
   function initializeDataSourceToggle() {
     // ... existing code
     toggle.addEventListener('change', function() {
       // ... update data source
       
       // Refresh AI insights with new data source
       if (typeof loadAIInsights === 'function') {
         loadAIInsights();
       }
     });
   }
   ```

4. CSS styling will be provided in `/css/ai-insights.css`