import { KpiData } from '@/types/advisor';

// Full KPI data (internal view)
const kpiData: KpiData[] = [
  { 
    id: 1, 
    title: 'Total Revenue', 
    value: '$1.25M', 
    trend: 'up', 
    trendValue: '8.5%', 
    target: '$1.2M',
    score: 82,
    category: 'financial',
    scopedFor: 'both'
  },
  { 
    id: 2, 
    title: 'Customer Acquisition Cost', 
    value: '$105', 
    trend: 'down', 
    trendValue: '12.3%', 
    target: '$115',
    score: 91,
    category: 'customer',
    scopedFor: 'internal'
  },
  { 
    id: 3, 
    title: 'Conversion Rate', 
    value: '3.8%', 
    trend: 'up', 
    trendValue: '0.5%', 
    target: '3.5%',
    score: 76,
    category: 'sales',
    scopedFor: 'both'
  },
  { 
    id: 4, 
    title: 'Average Order Value', 
    value: '$68', 
    trend: 'flat', 
    trendValue: '0.2%', 
    target: '$67',
    score: 65,
    category: 'sales',
    scopedFor: 'both'
  },
  { 
    id: 5, 
    title: 'Customer Retention', 
    value: '78.5%', 
    trend: 'up', 
    trendValue: '3.2%', 
    target: '75%',
    score: 88,
    category: 'customer',
    scopedFor: 'internal'
  },
  { 
    id: 6, 
    title: 'Net Profit Margin', 
    value: '22.3%', 
    trend: 'up', 
    trendValue: '1.7%', 
    target: '20%',
    score: 94,
    category: 'financial',
    scopedFor: 'internal'
  },
  { 
    id: 7, 
    title: 'Customer Satisfaction', 
    value: '4.7/5', 
    trend: 'up', 
    trendValue: '0.3', 
    target: '4.5/5',
    score: 85,
    category: 'customer',
    scopedFor: 'both'
  },
  { 
    id: 8, 
    title: 'Email Open Rate', 
    value: '26.7%', 
    trend: 'down', 
    trendValue: '1.3%', 
    target: '28%',
    score: 71,
    category: 'marketing',
    scopedFor: 'internal'
  }
];

export default kpiData;