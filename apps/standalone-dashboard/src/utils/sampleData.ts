import { Dataset } from '@/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export function generateSampleData(): Dataset[] {
  const now = new Date();
  
  // Sales Dataset
  const salesData = [];
  const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headphones'];
  const regions = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
  const categories = ['Electronics', 'Accessories', 'Software', 'Services'];
  
  for (let i = 0; i < 500; i++) {
    const date = subDays(now, Math.floor(Math.random() * 365));
    const product = products[Math.floor(Math.random() * products.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    salesData.push({
      id: i + 1,
      date: format(date, 'yyyy-MM-dd'),
      product,
      region,
      category,
      quantity: Math.floor(Math.random() * 50) + 1,
      price: Math.floor(Math.random() * 2000) + 100,
      revenue: 0, // Will calculate
      customer_satisfaction: (Math.random() * 2 + 3).toFixed(1),
      return_rate: (Math.random() * 0.1).toFixed(3),
    });
    
    salesData[i].revenue = salesData[i].quantity * salesData[i].price;
  }
  
  // Performance Metrics Dataset
  const metricsData = [];
  const metrics = ['CPU Usage', 'Memory Usage', 'Disk I/O', 'Network Traffic', 'Response Time'];
  const servers = ['Server-01', 'Server-02', 'Server-03', 'Server-04', 'Server-05'];
  
  for (let i = 0; i < 300; i++) {
    const date = subDays(now, Math.floor(Math.random() * 30));
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    const server = servers[Math.floor(Math.random() * servers.length)];
    
    metricsData.push({
      timestamp: date.toISOString(),
      server,
      metric,
      value: Math.random() * 100,
      threshold: 80,
      status: Math.random() > 0.8 ? 'Critical' : Math.random() > 0.6 ? 'Warning' : 'Normal',
    });
  }
  
  // Customer Analytics Dataset
  const customerData = [];
  const segments = ['Premium', 'Regular', 'Basic', 'Trial'];
  const channels = ['Web', 'Mobile', 'Store', 'Phone'];
  const countries = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Canada', 'Brazil'];
  
  for (let i = 0; i < 200; i++) {
    const signupDate = subDays(now, Math.floor(Math.random() * 730));
    
    customerData.push({
      customer_id: `CUST-${String(i + 1).padStart(5, '0')}`,
      segment: segments[Math.floor(Math.random() * segments.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      signup_date: format(signupDate, 'yyyy-MM-dd'),
      lifetime_value: Math.floor(Math.random() * 10000) + 100,
      orders_count: Math.floor(Math.random() * 50) + 1,
      avg_order_value: Math.floor(Math.random() * 500) + 50,
      churn_risk: Math.random(),
      engagement_score: Math.random() * 100,
    });
  }
  
  // Financial Dataset
  const financialData = [];
  const departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Operations', 'Finance'];
  const expenseTypes = ['Salaries', 'Equipment', 'Travel', 'Marketing', 'Utilities', 'Other'];
  
  for (let month = 0; month < 12; month++) {
    const monthDate = subDays(startOfMonth(now), month * 30);
    
    departments.forEach(dept => {
      expenseTypes.forEach(type => {
        financialData.push({
          month: format(monthDate, 'yyyy-MM'),
          department: dept,
          expense_type: type,
          budget: Math.floor(Math.random() * 100000) + 10000,
          actual: 0, // Will calculate
          variance: 0, // Will calculate
        });
        
        const lastIndex = financialData.length - 1;
        financialData[lastIndex].actual = financialData[lastIndex].budget * (0.8 + Math.random() * 0.4);
        financialData[lastIndex].variance = financialData[lastIndex].budget - financialData[lastIndex].actual;
      });
    });
  }

  return [
    {
      id: 'sales-data',
      name: 'Sales Data',
      data: salesData,
      columns: Object.keys(salesData[0]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'performance-metrics',
      name: 'Performance Metrics',
      data: metricsData,
      columns: Object.keys(metricsData[0]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics',
      data: customerData,
      columns: Object.keys(customerData[0]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'financial-data',
      name: 'Financial Data',
      data: financialData,
      columns: Object.keys(financialData[0]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}