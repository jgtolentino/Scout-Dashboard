module.exports = function(req, res) {
  // Simple mock data for transaction trends
  const mockData = {
    daily: [
      { date: '2024-01-01', transactions: 1234, revenue: 567890 },
      { date: '2024-01-02', transactions: 1456, revenue: 623450 },
      { date: '2024-01-03', transactions: 1389, revenue: 598760 },
      { date: '2024-01-04', transactions: 1523, revenue: 645320 },
      { date: '2024-01-05', transactions: 1678, revenue: 712340 },
      { date: '2024-01-06', transactions: 1345, revenue: 589430 },
      { date: '2024-01-07', transactions: 1234, revenue: 534560 }
    ],
    summary: {
      totalTransactions: 9559,
      totalRevenue: 4271750,
      averageTransactionValue: 447.12,
      period: 'last_7_days'
    }
  };

  res.json(mockData);
};