# Project Scout Dashboard Alignment

This document provides the canonical reference for all three dashboards in the InsightPulseAI Project Scout ecosystem, establishing Retail Advisor as the design baseline.

## ✅ Canonical Dashboard Structure

### 1. Retail Advisor (Design Baseline)

**Alias:** Scout Advanced Analytics  
**Frontend Repo:** [`mockify-creator`](https://github.com/jgtolentino/mockify-creator)  
**Hosting:** Azure Web App (client-facing)  
**Purpose:** AI-powered retail insights (market intelligence)  
**Sections:**
- Customer Profile
- Store Performance
- Product Intelligence
- Advanced Analytics

**Design Status:** ✓ This is the *design baseline* that all other dashboards inherit from

**Deployment:**
```bash
./deploy_retail_advisor_to_azure.sh
```

### 2. Retail Edge Dashboard

**File:** `/retail_edge/retail_edge_dashboard.html`  
**Purpose:** Operational analytics for TBWA internal use  
**Sections:**
- Device Performance
- Installation Activity
- Signal Health

**Backend:** Pulser QA + Sunnies  
**Design Status:** ✓ Visual styles synced from Retail Advisor

### 3. System Operations & QA (Pulser QA Console)

**File:** `/qa.html`  
**Purpose:** QA testing, baseline comparison, debug tools  
**Sections:**
- Device Health Sync
- Data Confidence Validation
- Architecture Compliance

**Audience:** Engineering/Internal Devs  
**Backend:** Pulser QA + manual triggers  
**Design Status:** ✓ Visual styles synced from Retail Advisor

## 🎨 Shared Visual Elements

The following elements are now standardized across all dashboards:

| Element                     | Implementation                                   | Location              |
|-----------------------------|-------------------------------------------------|-----------------------|
| CSS Variables               | Color palette, spacing, typography               | `css/shared-theme.css` |
| Card Design                 | Border-radius, shadows, hover effects            | `css/shared-theme.css` |
| Typography                  | Segoe UI font family, heading/body styles        | `css/shared-theme.css` |
| Dark Mode                   | Toggle + localStorage persistence                | All dashboards        |
| Header/Footer               | Consistent branding, layout, system status       | All dashboards        |
| Responsive Design           | Mobile-friendly breakpoints and adjustments      | All dashboards        |
| Data Visualization Style    | Chart colors, sizes, label formatting            | All dashboards        |

## 🛠 Maintaining Visual Consistency

To maintain visual consistency across all dashboards:

1. **Always make style changes in the shared CSS first:**
   ```bash
   # Edit the shared theme
   nano /css/shared-theme.css
   
   # Then run the application script to update all dashboards
   ./apply_retail_advisor_aesthetic.sh
   ```

2. **When adding new components to any dashboard:**
   - First check if the component exists in Retail Advisor
   - If yes, reuse the exact same styling
   - If no, create the component following the same design language

3. **When updating Retail Advisor:**
   - After updating the Retail Advisor design
   - Re-run the `apply_retail_advisor_aesthetic.sh` script to sync styles

## 🔄 Cross-Dashboard Navigation

All dashboards include navigation links to the other dashboards, ensuring a seamless user experience:

- **Retail Advisor** → links to Retail Edge and System QA
- **Retail Edge** → links to Retail Advisor and System QA
- **System QA** → links to Retail Advisor and Retail Edge

## 📋 Visual Verification Checklist

Before deploying any dashboard updates, verify the following:

- [ ] All dashboards use the shared CSS theme
- [ ] Card layouts are consistent across all dashboards
- [ ] Dark mode works consistently across all dashboards
- [ ] Navigation links are working correctly between dashboards
- [ ] Status indicators follow the same color scheme
- [ ] Typography is consistent across all dashboards
- [ ] Responsive behavior is consistent across all dashboards

## 🚀 Deployment Process

1. Deploy Retail Advisor to Azure Web App
2. Apply Retail Advisor aesthetics to other dashboards
3. Deploy all dashboards to their respective environments

See the `deploy_retail_advisor_to_azure.sh` script and GitHub Actions workflow for detailed deployment steps.