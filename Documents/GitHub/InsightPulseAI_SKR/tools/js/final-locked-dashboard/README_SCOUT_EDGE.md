# 🧭 **Scout Edge: Advanced Analytics (Market Intelligence)**

**💠 Azure Deployment | Project Scout – Retail Dashboard**

**Scout Edge** is a comprehensive, interactive analytics dashboard designed for **Project Scout**. It visualizes sales data from **Filipino sari-sari stores** gathered through edge-based IoT devices (e.g., Raspberry Pi) and organizes it into four actionable intelligence sections:

---

## 🗺️ **Market Overview**

* Visualizes:

  * Sales trends over time
  * Regional store performance
  * Product category share
  * Top-selling subcategories
  * **NEW: Interactive choropleth map for geospatial intelligence**
* 📊 Purpose: Provides a high-level snapshot of national market dynamics and seasonal performance.

### 📍 **Geospatial Intelligence**

The interactive choropleth map visualizes key retail metrics across Philippines geography:

* **Store Density**: Number of active stores by geographic area
* **Sales Volume**: Total sales amounts by region, city, or barangay
* **Brand Mentions**: Brand popularity and market penetration across regions
* **Combo Frequency**: Product bundling patterns by location

The map offers filtering by:
* Geographic level (Region, City, Barangay)
* Brand focus
* Time period

Ideal for identifying geographic patterns, regional performance variations, and market penetration opportunities.

---

## 🧑‍🤝‍🧑 **Customer Profile**

* Visualizes:

  * Age distribution and gender breakdown
  * Customer sentiment/emotion detection
* 🧠 Purpose: Helps brand teams and marketers understand **who the customers are** and **how they feel** about shopping experiences.

---

## 📦 **Product Intelligence**

* Visualizes:

  * Top brands by volume and SKU
  * Product bundles and frequently bought combinations
  * Brand Used Most Often (BUMO) metrics
* 🎯 Purpose: Provides granular intelligence for **inventory planning**, **bundle optimization**, and **product marketing**.

---

## 🧠 **Strategic Insights**

* Offers:

  * Custom insights for stakeholders like:

    * 🛍 Maria (Store Owner)
    * 🏷 Juan (Brand Manager)
    * 📢 Carla (Marketer)
    * 🧑‍💼 Regional Executives
  * Action plans and recommendations with confidence scores
* 📌 Purpose: Bridges data → action with **GenAI-powered business recommendations**.

---

## 🔄 **Interactive Features**

* Dynamic filters (Region, Category, Store)
* Real/simulated data source toggle
* Role-based insights viewer
* Time-series KPI animations
* Responsive layout for both desktop and mobile

---

## ✅ Deployment Stack

* **Azure Static Web App**
* **Medallion Data Architecture** (Bronze → Platinum)
* SQL & GenAI Integration (Databricks + REST APIs)
* Tailwind CSS + Chart.js + Unified GenAI Frontend

---

## Dashboard Ecosystem

Scout Edge is part of the complete Scout dashboard ecosystem:

* **Scout Advisor** → *Styled source dashboard (Vercel baseline)*
* **Scout Edge** → *Retail-focused Azure deployment (Advanced Analytics / Market Intelligence)*
* **Scout Ops** → *Infrastructure health, model drift, QA & monitoring dashboard*

The complete ecosystem is accessible at:
**`https://gentle-rock-04e54f40f.6.azurestaticapps.net/`**