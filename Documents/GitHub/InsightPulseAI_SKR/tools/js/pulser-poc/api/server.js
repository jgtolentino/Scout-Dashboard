const express = require('express');
const cors = require('cors');
const app = express();
const port = 7071;

// Enable CORS
app.use(cors());

// Transaction endpoint
app.get('/api/transactions', (req, res) => {
  console.log('Processing transaction trends request');
  
  // Generate demo data for the last 30 days
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic transaction patterns
    const dayOfWeek = date.getDay();
    const baseCount = 100 + (dayOfWeek === 0 || dayOfWeek === 6 ? -20 : 20); // Lower on weekends
    const variation = Math.floor(Math.random() * 40) - 20;
    const count = baseCount + variation;
    
    const baseAmount = count * 250; // Average transaction value in pesos
    const amountVariation = Math.floor(Math.random() * count * 10);
    const amount = baseAmount + amountVariation;
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: count,
      amount: amount
    });
  }
  
  res.json(data);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`API server running at http://127.0.0.1:${port}`);
  console.log(`Transaction endpoint: http://127.0.0.1:${port}/api/transactions`);
});