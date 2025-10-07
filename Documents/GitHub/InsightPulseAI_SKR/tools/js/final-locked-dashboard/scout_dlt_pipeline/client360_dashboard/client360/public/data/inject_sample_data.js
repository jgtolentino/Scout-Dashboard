/**
 * Sample Data Injection Script for Client360 Dashboard
 * 
 * This script injects sample data into the browser's localStorage for the dashboard
 * to use during testing and development.
 */

// Load sample data from the generated file
const sampleData = require('./sample_data/sample_data.json');

// Create a dashboard-compatible data model
const createDashboardData = () => {
  // Store data collections
  const storeData = {
    stores: sampleData.stores,
    lastUpdated: new Date().toISOString()
  };
  
  // Product data collections
  const productData = {
    products: sampleData.products,
    brands: sampleData.brands,
    lastUpdated: new Date().toISOString()
  };
  
  // Transaction data
  const transactionData = {
    interactions: sampleData.interactions,
    transactionItems: sampleData.transactionItems,
    salesInteractionBrands: sampleData.salesInteractionBrands,
    lastUpdated: new Date().toISOString()
  };
  
  // Device data
  const deviceData = {
    deviceLogs: sampleData.deviceLogs,
    lastUpdated: new Date().toISOString()
  };
  
  // Vision data
  const visionData = {
    detections: sampleData.visionDetections,
    transcriptions: sampleData.transcriptions,
    sessionMatches: sampleData.sessionMatches,
    lastUpdated: new Date().toISOString()
  };
  
  // Customer data
  const customerData = {
    customers: sampleData.customers,
    lastUpdated: new Date().toISOString()
  };
  
  // Aggregated metrics for KPIs
  const kpiData = {
    totalTransactions: sampleData.interactions.length,
    totalStores: sampleData.stores.length,
    totalProducts: sampleData.products.length,
    totalBrands: sampleData.brands.length,
    avgTransactionValue: 235.75,
    totalSales: 23575.00,
    brandMentions: sampleData.salesInteractionBrands.length,
    topBrands: generateTopBrands(),
    lastUpdated: new Date().toISOString()
  };
  
  // Regional data for maps
  const regionalData = {
    regions: generateRegionalData(),
    lastUpdated: new Date().toISOString()
  };
  
  // Time series data for charts
  const timeSeriesData = {
    dailySales: generateDailySales(),
    weeklyBrandMentions: generateWeeklyBrandMentions(),
    monthlySalesTrend: generateMonthlySalesTrend(),
    lastUpdated: new Date().toISOString()
  };
  
  return {
    storeData,
    productData,
    transactionData,
    deviceData,
    visionData,
    customerData,
    kpiData,
    regionalData,
    timeSeriesData
  };
};

// Helper function to generate top brands data
const generateTopBrands = () => {
  const topBrands = [];
  
  // Get unique brands
  const uniqueBrands = [...new Set(sampleData.salesInteractionBrands.map(b => b.BrandName))];
  
  // Generate count and sales for each brand
  uniqueBrands.slice(0, 10).forEach(brand => {
    topBrands.push({
      name: brand,
      mentions: Math.floor(Math.random() * 50) + 10,
      sales: Math.floor(Math.random() * 10000) + 1000,
      growth: (Math.random() * 20 - 10).toFixed(1)
    });
  });
  
  // Sort by mentions
  return topBrands.sort((a, b) => b.mentions - a.mentions);
};

// Helper function to generate regional data for maps
const generateRegionalData = () => {
  const regions = [];
  
  // Get unique locations
  const uniqueLocations = [...new Set(sampleData.stores.map(s => s.Location))];
  
  // Generate stats for each location
  uniqueLocations.forEach(location => {
    regions.push({
      name: location,
      storeCount: sampleData.stores.filter(s => s.Location === location).length,
      sales: Math.floor(Math.random() * 50000) + 10000,
      transactions: Math.floor(Math.random() * 500) + 100,
      growth: (Math.random() * 30 - 10).toFixed(1),
      latitude: parseFloat(sampleData.stores.find(s => s.Location === location)?.GeoLatitude),
      longitude: parseFloat(sampleData.stores.find(s => s.Location === location)?.GeoLongitude)
    });
  });
  
  return regions;
};

// Helper function to generate daily sales data
const generateDailySales = () => {
  const dailySales = [];
  const now = new Date();
  
  // Generate sales for the last 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    dailySales.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 5000) + 1000,
      transactions: Math.floor(Math.random() * 100) + 20
    });
  }
  
  return dailySales;
};

// Helper function to generate weekly brand mentions
const generateWeeklyBrandMentions = () => {
  const weeklyMentions = [];
  const now = new Date();
  
  // Get top 5 brands
  const topBrands = [...new Set(sampleData.salesInteractionBrands.map(b => b.BrandName))].slice(0, 5);
  
  // Generate mentions for the last 12 weeks
  for (let i = 12; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    
    const weekData = {
      weekEnding: date.toISOString().split('T')[0],
    };
    
    // Add data for each brand
    topBrands.forEach(brand => {
      weekData[brand] = Math.floor(Math.random() * 50) + 5;
    });
    
    weeklyMentions.push(weekData);
  }
  
  return weeklyMentions;
};

// Helper function to generate monthly sales trend
const generateMonthlySalesTrend = () => {
  const monthlySales = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Generate sales for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentYear - Math.floor((currentMonth - i + 12) / 12);
    
    monthlySales.push({
      month: `${year}-${(month + 1).toString().padStart(2, '0')}`,
      sales: Math.floor(Math.random() * 50000) + 10000,
      target: Math.floor(Math.random() * 60000) + 20000
    });
  }
  
  return monthlySales;
};

// Create dashboard data
const dashboardData = createDashboardData();

// Export to be used in HTML
module.exports = {
  dashboardData,
  sampleData
};

// If running directly, output the data
if (require.main === module) {
  console.log('Sample dashboard data generated:');
  console.log(JSON.stringify(dashboardData, null, 2));
}