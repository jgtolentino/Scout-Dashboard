import { KpiData } from '@/types/advisor';

// Client-facing KPI data (limited subset)
const clientKpiData: KpiData[] = [
  { 
    id: 1, 
    title: 'Total Revenue', 
    value: '$1.25M', 
    trend: 'up', 
    trendValue: '8.5%', 
    target: '$1.2M',
    score: 82,
    category: 'financial',
    scopedFor: 'client'
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
    scopedFor: 'client'
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
    scopedFor: 'client'
  },
  { 
    id: 7, 
    title: 'Customer Satisfaction', 
    value: '4.7/5', 
    trend: 'up', 
    trendValue: '0.3', 
    target: '4.5/5',
    score: 88,
    category: 'customer',
    scopedFor: 'client'
  }
];

export default clientKpiData;