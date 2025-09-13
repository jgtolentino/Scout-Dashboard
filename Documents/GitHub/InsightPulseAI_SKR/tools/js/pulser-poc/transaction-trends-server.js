const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Transaction Trends API endpoint
app.get('/api/transactions-trends', (req, res) => {
  // Generate realistic data for the last 30 days
  const days = 30;
  const endDate = new Date();
  const dailyData = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic transaction patterns
    const dayOfWeek = date.getDay();
    const baseTransactions = 1200;
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
    const randomVariation = 0.8 + Math.random() * 0.4;
    
    const transactions = Math.floor(baseTransactions * weekendMultiplier * randomVariation);
    const avgTransactionValue = 350 + Math.random() * 150;
    const revenue = Math.floor(transactions * avgTransactionValue);
    
    dailyData.push({
      date: date.toISOString().split('T')[0],
      transactions,
      revenue,
      avgTransactionValue: Math.floor(avgTransactionValue)
    });
  }
  
  // Calculate summary statistics
  const totalTransactions = dailyData.reduce((sum, d) => sum + d.transactions, 0);
  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgTransactionValue = Math.floor(totalRevenue / totalTransactions);
  
  // Calculate trends
  const lastWeek = dailyData.slice(-7);
  const previousWeek = dailyData.slice(-14, -7);
  const weeklyGrowth = ((lastWeek.reduce((sum, d) => sum + d.revenue, 0) / 
                        previousWeek.reduce((sum, d) => sum + d.revenue, 0)) - 1) * 100;
  
  res.json({
    daily: dailyData,
    summary: {
      totalTransactions,
      totalRevenue,
      averageTransactionValue: avgTransactionValue,
      weeklyGrowth: weeklyGrowth.toFixed(1),
      period: 'last_30_days'
    },
    hourly: generateHourlyData(),
    categories: generateCategoryData()
  });
});

// Generate hourly distribution
function generateHourlyData() {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const peakHours = [11, 12, 13, 18, 19, 20];
    const isPeak = peakHours.includes(i);
    const baseTraffic = isPeak ? 100 : 40;
    
    hours.push({
      hour: i,
      transactions: Math.floor(baseTraffic + Math.random() * 30),
      label: `${i}:00`
    });
  }
  return hours;
}

// Generate category breakdown
function generateCategoryData() {
  return [
    { category: 'Food & Beverages', value: 35, transactions: 4234 },
    { category: 'Personal Care', value: 25, transactions: 3021 },
    { category: 'Household Items', value: 20, transactions: 2417 },
    { category: 'Snacks & Confectionery', value: 15, transactions: 1813 },
    { category: 'Others', value: 5, transactions: 604 }
  ];
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'transaction-trends-poc',
    timestamp: new Date().toISOString()
  });
});

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'transaction-trends-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Transaction Trends POC Server
================================
Server: http://localhost:${PORT}
API: http://localhost:${PORT}/api/transactions-trends
Health: http://localhost:${PORT}/api/health

✅ First successful POC restored with latest optimizations
  `);
});