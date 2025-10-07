# Scout Dashboard QA Guidelines – Power BI Parity

## 1. 🎯 Wireframe-to-UI Mapping

### A. Advanced Analytics Dashboard
**Wireframe Section:**
- Market Basket Analysis
- Demand Forecasting
- Promo Lift Analytics

**QA Checks:**
- Heatmap/matrix visuals support conditional formatting
- Forecast charts include confidence bands
- Filters apply to both trend and KPI tiles

### B. Regional Dashboard
**Wireframe Section:**
- Sales by Region Map
- Top Performing Cities
- Outlet Expansion Timeline

**QA Checks:**
- Interactive maps support click-to-filter by region
- Dual-axis charts render correctly
- Date dropdowns mimic Power BI slicer style

### C. Drilldown Dashboard
**Wireframe Section:**
- Brand → Category → Product Line → SKU
- BUMO % (Brand Used Most Often)
- Expandable SKU table with conditional formatting

**QA Checks:**
- Brand clicks cascade to lower levels without reload
- Breadcrumbs persist (e.g., Nike > Shoes > Running > Air Max)
- Scrollable SKU table with dynamic sorting

---

## 2. 🧭 Interaction Parity Checks

| Feature | Expected Behavior |
|--------|--------------------|
| Drilldown | Multi-level click-expand, context retained |
| Cross-filter | Charts & tables cross-filter when selected |
| Tooltips | Hover shows % and units |
| Filters | Universal application across dashboard |
| Reset | Full state reset |
| Layout | Filter state remains on revisit |

---

## 3. 🎨 Visual Styling

| Element | Requirements |
|--------|--------------|
| Fonts | Segoe UI / Roboto |
| KPI Cards | Rounded, with shadow and delta indicators |
| Charts | Follow TBWA brand color palette |
| Tables | Sticky headers, zebra-striping |
| Icons | Size-matched, Power BI-style legends |
| Theme | Clean white or dark backgrounds |

---

## 4. 📐 Components

### ✅ Filter Tiles
- Date range, region, brand – dropdown or multi-select
- Sticky behavior on scroll

### ✅ KPI Cards
- Revenue, Transactions, Avg Basket
- Consistent layout and hover states

### ✅ Drilldown Table
- Sortable, searchable, color-coded bars
- Aligned with drilldown logic

---

## 5. 🛠 Baseline Management
- Baselines created via `utils/create_real_baselines.js`
- Snapshots: `brand_dashboard.png`, `regional_heatmap.png`, `sku_table_drill.png`
- Reviewed via GitHub Actions + Azure DevOps