# 🧾 Product Requirements Document (PRD)

## Title: **Advisor Dashboard (Power BI–Styled UI)**

**Version:** 1.0
**Last Updated:** May 15, 2025
**Owner:** InsightPulseAI (jgtolentino)
**Status:** In Development – Base UI and Data Connectors Ready

---

## 🧠 Product Purpose

The **Advisor Dashboard** is a next-generation, Power BI–inspired, executive-facing analytics layer. It transforms retail intelligence, creative effectiveness, and AI insight data into a modular web interface with embedded GPT-based guidance. The dashboard replaces legacy BI tools like Superset with an interactive, mobile-friendly alternative optimized for strategic decision-makers.

---

## 👥 Target Users

| Persona              | Role                                   | Need                                           |
| -------------------- | -------------------------------------- | ---------------------------------------------- |
| TBWA Clients         | Brand managers, marketers              | Track brand KPIs, AI insights, category shifts |
| TBWA Strategists     | Analysts, planners, insight architects | Explore cross-brand trends, optimize ROI       |
| Executives (C-level) | Decision-makers, CEOs                  | High-level summaries, downloadable reports     |

---

## 🎯 Business Objectives

* Decommission Superset for external stakeholders
* Match or exceed **Power BI's interactivity**, drilldowns, and export features
* Present actionable GPT-generated summaries
* Enable scoped multi-tenant views for client-only access
* Embed AI assistant and playbook generation

---

## 📋 Feature List

| Feature                  | Description                                    | Priority | Status         |
| ------------------------ | ---------------------------------------------- | -------- | -------------- |
| KPI Grid with Drilldown  | Clickable status cards w/ color-coded insights | High     | ✅ Done         |
| AI Insight Cards         | Summary, confidence %, GPT action CTA          | High     | 🟡 In progress |
| Assistant Panel          | GPT-generated plan modal                       | High     | ⏳ Planned      |
| Chart Panel              | Recharts/Chart.js, toggles, AI commentary      | Medium   | ✅ Done         |
| Filter Bar               | Sticky filters w/ slicers, org toggles         | High     | ✅ Done         |
| Data Source Toggle       | Simulated vs. Real-time via localStorage       | Medium   | ✅ Done         |
| CSV/PDF Export           | Export KPI & insight summaries                 | Medium   | ⏳ Planned      |
| Scoped Views             | Clients see only their brand/org's data        | High     | 🟡 Partial     |
| Data Freshness Indicator | Last updated timestamp                         | Medium   | ✅ Done         |

---

## 🧱 Technical Architecture

### Core Framework

* **Frontend:** React + Vite + Tailwind CSS
* **Component Base:** `mockify-creator`, forked and renamed to `mockify-advisor-ui`

### Data Integration

* **DBT Layer (Databricks):**

  * `dbt_project/models/marts/scout_edge/*.sql`
  * `scripts/run_and_export.sh` exports JSON
* **Medallion Architecture** via:

  * `medallion_data_connector.js`
  * `sql_connector.js`
  * `data_source_toggle.js`
* **Blob Storage Sync:** Azure Blob for exported dashboard data

---

## ⚙️ Non-Functional Requirements

| Category      | Requirement                                 |
| ------------- | ------------------------------------------- |
| Performance   | Load in < 1.5s on 4G                        |
| Accessibility | WCAG 2.0 AA minimum; keyboard-nav supported |
| Mobile        | Responsive for tablet/mobile with fallback  |
| Security      | Scoped access by org/brand; no data leakage |
| Observability | Add data freshness badge + logging endpoint |

---

## 🎨 UX & Visual Grammar Standards

* Typography: `font-inter`, large heading rhythm, readable tables
* Iconography: 🟢📉💡 status indicators per trend/score
* Consistent spacing via `gap-4`, `py-2`, `text-muted`, `hover:ring`
* Stickied filter bar on scroll
* Hoverable Recharts + drilldown-enabled cards

---

## 🔁 User Journeys

| Scenario                     | User Action                                 | System Response                            |
| ---------------------------- | ------------------------------------------- | ------------------------------------------ |
| View `/advisor` dashboard    | Load brand-specific KPIs and insights       | Fetch filtered data, render modular layout |
| Click KPI card               | View modal w/ trendline and GPT explanation | Display historical chart + insight summary |
| Toggle data source           | Switch to Simulated                         | Cache swapped, local JSON served           |
| Change slicer (e.g., period) | Adjust time period                          | Re-fetch KPI data and rerender             |
| Launch Assistant             | Click "Generate Strategy"                   | GPT endpoint hit, plan returned in modal   |

---

## 📦 Deployment Pipeline

1. `mockify-advisor-ui` → `deploy-ready/advisor`

2. Tailwind CSS preserved

3. Output to Azure Static Web App:

   ```
   https://<env>.azurestaticapps.net/advisor
   ```

4. Route config:

```json
{
  "routes": [
    { "route": "/advisor", "rewrite": "/advisor/index.html" },
    { "route": "/insights_dashboard.html", "redirect": "/advisor", "statusCode": 301 }
  ]
}
```

---

## ✅ Acceptance Criteria

| Test Case                                | Pass Condition                           |
| ---------------------------------------- | ---------------------------------------- |
| `/advisor` loads with brand scoping      | Only scoped KPIs appear                  |
| Cards show correct GPT confidence levels | Dynamic color & % match backend          |
| Assistant returns action plan            | OpenAI responds and modal renders        |
| Export buttons work                      | PDF and CSV download match UI contents   |
| Filter bar applies correct filters       | Filters affect charts + KPIs as expected |

---

## 📁 Files to Track

* `mockify-advisor-ui/` (source)
* `deploy-ready/advisor/` (build output)
* `staticwebapp.config.json` (routing)
* `README_UI_REDESIGN.md` (dev instructions)
* `pulser_tasks.yaml` (Pulser CLI integration)
* `dbt_project/` (SQL models + metadata)

---

## 🔐 Security & Access Controls

* Scoped insights: `/api/kpi-summary?companyId=...`
* Data must not cross org boundaries
* Role-based filters for "internal vs client view"

---

## 🧠 Notes

* Deployed snapshots should be logged with Caca QA agent
* Assistant outputs should be versioned and exportable
* Default mode = client-safe view (with internal toggle for TBWA)