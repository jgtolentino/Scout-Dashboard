# 📊 Scout Analytics Dashboard - Complete Wireframe Layout

## 🎯 Dashboard Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Scout Analytics Dashboard                      │
├─────────────────────────────────────────────────────────────────────┤
│  🔸 Sidebar (Collapsible)         │  📊 Main Content Area           │
│  ├─ Overview                      │  ┌─────────────────────────────┐ │
│  ├─ Transaction Trends            │  │  Global Filter Bar          │ │
│  ├─ Product Mix                   │  │  [Date] [Region] [Brand]    │ │
│  ├─ Consumer Behavior             │  └─────────────────────────────┘ │
│  └─ Retail Assistant              │  ┌─────────────────────────────┐ │
│                                   │  │  Page Content               │ │
│                                   │  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Page 1: Overview Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ Overview                                        Last Update: 2:45 PM │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │
│  │ Total Sales    │  │ Transactions   │  │ Active Stores  │      │
│  │ ₱17.3M        │  │ 44,684        │  │ 17            │      │
│  │ ▲ +12.5%      │  │ ▲ +8.3%       │  │ ▼ -5.6%       │      │
│  └────────────────┘  └────────────────┘  └────────────────┘      │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐                           │
│  │ Avg Transaction│  │ Top Category   │                           │
│  │ ₱387          │  │ Dairy (28%)    │                           │
│  └────────────────┘  └────────────────┘                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Regional Performance Map                                 │      │
│  │  ┌─────────────────────────────────────────────┐       │      │
│  │  │                                               │       │      │
│  │  │         [Philippines Choropleth Map]         │       │      │
│  │  │         NCR: ₱9.2M (53%)                    │       │      │
│  │  │         Visayas: ₱2.7M (15%)               │       │      │
│  │  │         CALABARZON: ₱2.0M (12%)            │       │      │
│  │  │                                               │       │      │
│  │  └─────────────────────────────────────────────┘       │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Client Brands Performance                                │      │
│  │  Alaska    ████████████ Dairy      ₱3.2M              │      │
│  │  Del Monte ██████████   Canned     ₱2.8M              │      │
│  │  Oishi     ████████     Snacks     ₱2.1M              │      │
│  │  Champion  ██████       Home Care  ₱1.5M              │      │
│  │  Winston   ████         Tobacco    ₱0.9M              │      │
│  └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Page 2: Transaction Trends

```
┌─────────────────────────────────────────────────────────────────────┐
│ Transaction Trends                     [7D] [30D] [90D] [Custom]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Daily Transaction Volume                                  │      │
│  │                                                          │      │
│  │  5000 ┤                                    ╱╲          │      │
│  │  4000 ┤                                   ╱  ╲         │      │
│  │  3000 ┤              ╱╲      ╱╲        ╱    ╲       │      │
│  │  2000 ┤    ╱╲      ╱  ╲    ╱  ╲    ╱╲╱      ╲      │      │
│  │  1000 ┤───╱──╲────╱────╲──╱────╲──╱──────────╲───  │      │
│  │       └────────────────────────────────────────────    │      │
│  │         Mon  Tue  Wed  Thu  Fri  Sat  Sun              │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐        │
│  │ Peak Hours Heatmap      │  │ Day of Week Analysis    │        │
│  │  6AM ░░░░▓▓▓███████    │  │  Mon ████████ 14.2%    │        │
│  │  12PM ████████████▓▓    │  │  Tue ███████  13.8%    │        │
│  │  6PM  ███████████████   │  │  Wed ███████  13.5%    │        │
│  │  10PM ▓▓▓▓░░░░░░░░░    │  │  Thu ████████ 14.8%    │        │
│  └─────────────────────────┘  │  Fri █████████ 15.2%   │        │
│                                │  Sat ██████████ 16.3%  │        │
│                                │  Sun ████████  12.2%   │        │
│                                └─────────────────────────┘        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Transaction Value Distribution                           │      │
│  │  ₱0-100    ████████████████████ 45%                   │      │
│  │  ₱101-300  ████████████ 28%                           │      │
│  │  ₱301-500  ██████ 15%                                  │      │
│  │  ₱501-1000 ████ 8%                                     │      │
│  │  ₱1000+    ██ 4%                                       │      │
│  └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Page 3: Product Mix

```
┌─────────────────────────────────────────────────────────────────────┐
│ Product Mix Analysis                   View: [Treemap] [Sunburst]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Category Treemap                                         │      │
│  │  ┌─────────────────┬─────────────┬──────────────┐      │      │
│  │  │                 │             │              │      │      │
│  │  │     Dairy       │   Snacks    │   Beverages  │      │      │
│  │  │     28.5%       │   22.3%     │    18.7%     │      │      │
│  │  │   ₱4.9M        │  ₱3.9M      │   ₱3.2M      │      │      │
│  │  │                 │             │              │      │      │
│  │  ├─────────┬───────┼──────┬──────┼──────┬───────┤      │      │
│  │  │ Canned  │Home   │Personal    │Tobacco│ Other │      │      │
│  │  │ 12.8%   │Care   │Care 6.2%   │ 4.3%  │ 8.2%  │      │      │
│  │  │ ₱2.2M   │8.0%   │₱1.1M       │₱0.7M  │₱1.4M  │      │      │
│  │  └─────────┴───────┴────────────┴───────┴───────┘      │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────┐          │
│  │ Top 10 SKUs         │  │ Category Growth Trends   │          │
│  │ 1. Alaska Evap     │  │                          │          │
│  │ 2. Lucky Me Pancit │  │  Dairy    ▲ +15.2%     │          │
│  │ 3. Oishi Prawn     │  │  Snacks   ▲ +12.8%     │          │
│  │ 4. Del Monte Ketchup│  │  Beverages ▼ -3.5%     │          │
│  │ 5. Champion Detergent│  │  Canned   ▲ +8.7%      │          │
│  │ 6. C2 Apple Green  │  │  Home Care ▲ +5.2%     │          │
│  │ 7. Marlboro Red    │  │                          │          │
│  │ 8. Datu Puti Vinegar│  │                          │          │
│  │ 9. Argentina Beef  │  │                          │          │
│  │ 10. Kopiko Black   │  │                          │          │
│  └──────────────────────┘  └──────────────────────────┘          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Product Substitution Flow                                │      │
│  │  Out of Stock → Suggested → Accepted                    │      │
│  │  Alaska Evap → Bear Brand → 72% acceptance              │      │
│  │  Lucky Me → Payless Pancit → 65% acceptance             │      │
│  │  Oishi Prawn → Piattos → 81% acceptance                 │      │
│  └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Page 4: Consumer Behavior

```
┌─────────────────────────────────────────────────────────────────────┐
│ Consumer Behavior Analytics           Segment: [All] [Loyal] [New]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Customer Segments                                        │      │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │      │
│  │  │ Loyal   │ │ Regular │ │ Occasional│ │  New    │      │      │
│  │  │ 2,341   │ │ 5,678   │ │ 12,456   │ │ 3,209   │      │      │
│  │  │ 35%     │ │ 28%     │ │ 22%      │ │ 15%     │      │      │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────┐          │
│  │ Purchase Frequency   │  │ Basket Analysis          │          │
│  │                      │  │                          │          │
│  │  Daily    ██ 8%     │  │  Avg Items: 6.2          │          │
│  │  2-3x/wk  █████ 22% │  │  Avg Value: ₱387         │          │
│  │  Weekly   ████████ 35%│  │  Most Common Basket:     │          │
│  │  2x/month ██████ 25% │  │  • Dairy + Snacks (42%)  │          │
│  │  Monthly  ██ 10%    │  │  • Beverages + Snacks(38%)│          │
│  └──────────────────────┘  └──────────────────────────┘          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Customer Journey Map                                     │      │
│  │                                                          │      │
│  │  Entry → Browse → Select → Queue → Pay → Exit          │      │
│  │   2min    5min     8min     3min   2min   1min         │      │
│  │                                                          │      │
│  │  Peak friction points:                                   │      │
│  │  • Product selection (finding items)                     │      │
│  │  • Queue time during peak hours                          │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Demographic Distribution                                 │      │
│  │  Age Groups        │  Income Levels                     │      │
│  │  18-24  ███ 15%   │  Low      ████████ 45%           │      │
│  │  25-34  █████ 28% │  Mid-Low  ██████ 32%             │      │
│  │  35-44  ████ 22%  │  Middle   ████ 18%               │      │
│  │  45-54  ███ 18%   │  Mid-High ██ 5%                  │      │
│  │  55+    ███ 17%   │                                    │      │
│  └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Page 5: Retail Assistant (AI Chat)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Retail Assistant                                    [New Chat] 🤖   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Suggested Questions:                                     │      │
│  │  • What are today's top selling products?               │      │
│  │  • Show me sales trends for the past week               │      │
│  │  • Which stores need inventory replenishment?           │      │
│  │  • What's the performance of Alaska products?           │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ Chat History                                             │      │
│  │                                                          │      │
│  │  User: What's our best performing category?             │      │
│  │  ┌────────────────────────────────────────────┐        │      │
│  │  │ AI: Based on the data, Dairy is your best │        │      │
│  │  │ performing category with ₱4.9M in sales    │        │      │
│  │  │ (28.5% of total). It shows consistent     │        │      │
│  │  │ growth of +15.2% compared to last month.  │        │      │
│  │  │                                            │        │      │
│  │  │ Top products in Dairy:                     │        │      │
│  │  │ 1. Alaska Evaporada - ₱1.2M              │        │      │
│  │  │ 2. Bear Brand - ₱890K                    │        │      │
│  │  │ 3. Nestle Fresh Milk - ₱650K            │        │      │
│  │  └────────────────────────────────────────────┘        │      │
│  │                                                          │      │
│  │  User: Which regions should we focus on?                │      │
│  │  ┌────────────────────────────────────────────┐        │      │
│  │  │ AI: I recommend focusing on:              │        │      │
│  │  │                                            │        │      │
│  │  │ 1. Region VII (Central Visayas)          │        │      │
│  │  │    - Current: ₱2.7M (15% share)          │        │      │
│  │  │    - Growth potential: +25%              │        │      │
│  │  │    - Underserved areas: 8 barangays      │        │      │
│  │  │                                            │        │      │
│  │  │ 2. Region XI (Davao)                     │        │      │
│  │  │    - Emerging market with 18% YoY growth │        │      │
│  │  │    - Low competition density             │        │      │
│  │  └────────────────────────────────────────────┘        │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ 💬 Type your question...                      [Send] 📤  │      │
│  └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Shared Components Across All Pages

### 1. **Global Filter Bar** (Top of every page)
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Date Range: [Last 7 Days ▼]  📍 Region: [All Regions ▼] │
│ 🏷️ Brand: [All Brands ▼]       🏪 Store: [All Stores ▼]   │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Sidebar Navigation** (Collapsible)
```
┌──────────────┐
│ 🏠 Overview  │
│ 📈 Trends    │
│ 📦 Products  │
│ 👥 Consumers │
│ 🤖 Assistant │
│              │
│ ⚙️ Settings  │
│ 📤 Export    │
└──────────────┘
```

### 3. **KPI Summary Cards** (Reusable)
```
┌────────────────┐
│ Metric Name    │
│ ₱1,234,567    │
│ ▲ +12.5%      │
│ [sparkline]    │
└────────────────┘
```

### 4. **Data Tables** (Standard format)
```
┌─────────────────────────────────────────┐
│ Column 1  │ Column 2  │ Column 3      │
├───────────┼───────────┼───────────────┤
│ Data      │ Data      │ Data          │
│ Data      │ Data      │ Data          │
└─────────────────────────────────────────┘
[< Previous] [1] [2] [3] ... [Next >]
```

---

## 📱 Responsive Breakpoints

- **Desktop**: Full layout as shown (1440px+)
- **Tablet**: 2-column grid, collapsible sidebar (768px-1439px)
- **Mobile**: Single column, bottom navigation (< 768px)

## 🎨 Design System

- **Primary Color**: #3B82F6 (Blue)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)
- **Background**: #F9FAFB
- **Card Background**: #FFFFFF
- **Text Primary**: #1F2937
- **Text Secondary**: #6B7280

## 🔄 Data Refresh

- **Real-time**: Transaction count, Active scrapers
- **5 minutes**: Sales metrics, Regional data
- **15 minutes**: Product mix, Consumer segments
- **On-demand**: AI Assistant queries