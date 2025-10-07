/**
 * Show-Ready FMCG Demo Data for Client360 Dashboard
 * Enhanced with TBWA\SMP client brands: Del Monte, Oishi, Alaska Milk, Peerless
 */

const SHOW_READY_DATA = {
  metadata: {
    version: "2.4.0-show-ready",
    client: "TBWA\\SMP FMCG Portfolio",
    lastUpdated: "2025-05-22T12:48:00Z",
    dataSource: "live_simulation"
  },

  // Enhanced KPIs with realistic FMCG numbers
  kpis: {
    total_sales: "₱7.82M",
    sales_change: "+14.2%",
    conversion_rate: "5.3%",
    conversion_change: "+0.9%",
    marketing_roi: "3.6x",
    roi_change: "+0.3",
    brand_sentiment: "82.5%",
    sentiment_change: "+3.2%",
    active_stores: 78,
    device_health: "94.2%"
  },

  // TBWA SMP Client Brand Portfolio
  brands: [
    { 
      name: "Del Monte Philippines", 
      logo: "🍅",
      performance_score: 89.5, 
      market_share: "23.8%", 
      growth_rate: "+12.5%", 
      customer_loyalty: "87.2%",
      category: "Fruits & Vegetables",
      revenue: "₱1.86M",
      trend: "up",
      products: ["Tomato Sauce", "Fruit Cocktail", "Corned Beef"]
    },
    { 
      name: "Oishi", 
      logo: "🥨",
      performance_score: 86.3, 
      market_share: "19.2%", 
      growth_rate: "+14.7%", 
      customer_loyalty: "84.6%",
      category: "Snacks & Confectionery",
      revenue: "₱1.50M",
      trend: "up",
      products: ["Prawn Crackers", "Smart C+", "Pillows"]
    },
    { 
      name: "Alaska Milk", 
      logo: "🥛",
      performance_score: 82.7, 
      market_share: "18.5%", 
      growth_rate: "+7.6%", 
      customer_loyalty: "83.9%",
      category: "Dairy Products",
      revenue: "₱1.45M",
      trend: "steady",
      products: ["Condensada", "Crema", "Powdered Milk"]
    },
    { 
      name: "Peerless Products", 
      logo: "🧈",
      performance_score: 79.8, 
      market_share: "16.4%", 
      growth_rate: "+8.3%", 
      customer_loyalty: "78.5%",
      category: "Food Ingredients",
      revenue: "₱1.28M",
      trend: "up",
      products: ["Margarine", "Shortening", "Cooking Oil"]
    }
  ],

  // Regional Performance with Philippine locations
  regions: [
    { 
      name: "National Capital Region (NCR)", 
      code: "NCR",
      performance: 89.5, 
      stores: 24, 
      growth: "+12.3%",
      revenue: "₱2.89M",
      population: "13.48M",
      market_penetration: "78.2%"
    },
    { 
      name: "Central Luzon", 
      code: "R03",
      performance: 86.2, 
      stores: 18, 
      growth: "+8.7%",
      revenue: "₱1.64M",
      population: "12.42M",
      market_penetration: "65.8%"
    },
    { 
      name: "Southern Luzon (CALABARZON)", 
      code: "R04A",
      performance: 82.8, 
      stores: 15, 
      growth: "+6.4%",
      revenue: "₱1.28M",
      population: "16.20M",
      market_penetration: "58.3%"
    },
    { 
      name: "Visayas", 
      code: "R07",
      performance: 79.3, 
      stores: 12, 
      growth: "+4.2%",
      revenue: "₱967K",
      population: "19.53M",
      market_penetration: "42.7%"
    },
    { 
      name: "Mindanao", 
      code: "R11",
      performance: 76.1, 
      stores: 9, 
      growth: "+2.8%",
      revenue: "₱735K",
      population: "26.25M",
      market_penetration: "38.9%"
    }
  ],

  // Marketing Campaigns with actual FMCG themes
  campaigns: [
    {
      name: "Del Monte 'Masarap na Pagkain' Digital Push",
      brand: "Del Monte",
      roi: "4.2x",
      spend: "₱1.2M",
      revenue: "₱5.04M",
      duration: "90 days",
      channels: ["Facebook", "YouTube", "TikTok"],
      status: "active",
      engagement_rate: "12.8%"
    },
    {
      name: "Oishi Summer Snack Festival",
      brand: "Oishi",
      roi: "3.8x",
      spend: "₱950K",
      revenue: "₱3.61M",
      duration: "60 days",
      channels: ["Instagram", "Shopee", "Lazada"],
      status: "active",
      engagement_rate: "15.3%"
    },
    {
      name: "Alaska 'Pamilyang Kumpleto' Campaign",
      brand: "Alaska",
      roi: "3.4x",
      spend: "₱800K",
      revenue: "₱2.72M",
      duration: "120 days",
      channels: ["TV", "Facebook", "Radio"],
      status: "completed",
      engagement_rate: "9.7%"
    },
    {
      name: "Peerless Kusina Heritage Revival",
      brand: "Peerless",
      roi: "3.1x",
      spend: "₱650K",
      revenue: "₱2.02M",
      duration: "75 days",
      channels: ["YouTube", "Food Blogs", "Influencers"],
      status: "active",
      engagement_rate: "11.2%"
    }
  ],

  // AI-Generated Insights for FMCG Portfolio
  ai_insights: [
    {
      type: "growth_opportunity",
      priority: "high",
      title: "Del Monte Visayas Expansion",
      insight: "Del Monte shows strongest growth potential in Visayas region with projected +18% increase. Market penetration currently at 42.7% offers significant upside.",
      action: "Increase distribution points by 25% in Cebu and Iloilo",
      confidence: 0.94,
      impact: "₱480K additional revenue"
    },
    {
      type: "trend_analysis",
      priority: "high",
      title: "Oishi Snack Category Dominance",
      insight: "Oishi snack category experiencing 15.7% growth, significantly outpacing market average of 8.2%. TikTok engagement driving youth adoption.",
      action: "Double down on social media campaigns targeting Gen Z",
      confidence: 0.89,
      impact: "₱320K incremental sales"
    },
    {
      type: "loyalty_optimization",
      priority: "medium",
      title: "Alaska Milk Loyalty Leadership",
      insight: "Alaska Milk boasts highest loyalty scores at 87.2%, driving repeat purchases and premium pricing power in dairy segment.",
      action: "Launch premium product line leveraging brand trust",
      confidence: 0.91,
      impact: "₱250K margin improvement"
    },
    {
      type: "market_penetration",
      priority: "medium",
      title: "Peerless Metro Manila Opportunity",
      insight: "Peerless products show 8.3% growth with significant untapped potential in Metro Manila premium cooking segment.",
      action: "Partner with high-end grocery chains and cooking schools",
      confidence: 0.87,
      impact: "₱180K new market access"
    }
  ],

  // Device Health Status (5 key devices for monitoring)
  device_health: [
    {
      device_id: "DEVICE-1006",
      location: "SM Mall of Asia",
      status: "excellent",
      health_score: 98.5,
      uptime: "99.8%",
      last_data: "2 mins ago",
      battery: "89%",
      signal: "5 bars"
    },
    {
      device_id: "DEVICE-1009",
      location: "Robinsons Galleria",
      status: "good",
      health_score: 94.2,
      uptime: "98.9%",
      last_data: "5 mins ago",
      battery: "72%",
      signal: "4 bars"
    },
    {
      device_id: "DEVICE-1007",
      location: "Ayala Malls Cloverleaf",
      status: "good",
      health_score: 91.8,
      uptime: "97.5%",
      last_data: "8 mins ago",
      battery: "58%",
      signal: "4 bars"
    },
    {
      device_id: "DEVICE-1002",
      location: "Gateway Mall Cubao",
      status: "warning",
      health_score: 87.3,
      uptime: "95.2%",
      last_data: "15 mins ago",
      battery: "34%",
      signal: "3 bars"
    },
    {
      device_id: "DEVICE-1004",
      location: "Trinoma Mall",
      status: "good",
      health_score: 93.7,
      uptime: "98.1%",
      last_data: "3 mins ago",
      battery: "81%",
      signal: "5 bars"
    }
  ],

  // Time-series data for charts
  chart_data: {
    sales_trend: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "Total Sales (₱M)",
        data: [6.2, 6.8, 7.1, 7.5, 7.82],
        borderColor: "#0067b1",
        backgroundColor: "rgba(0, 103, 177, 0.1)",
        tension: 0.4
      }]
    },
    brand_performance: {
      labels: ["Del Monte", "Oishi", "Alaska", "Peerless"],
      datasets: [{
        label: "Performance Score",
        data: [89.5, 86.3, 82.7, 79.8],
        backgroundColor: ["#0067b1", "#e31937", "#ffd100", "#28a745"]
      }]
    },
    regional_distribution: {
      labels: ["NCR", "Central Luzon", "CALABARZON", "Visayas", "Mindanao"],
      datasets: [{
        label: "Revenue (₱M)",
        data: [2.89, 1.64, 1.28, 0.97, 0.74],
        backgroundColor: "#0067b1"
      }]
    }
  }
};

// Export for use in dashboard
window.SHOW_READY_DATA = SHOW_READY_DATA;