// KPI Data Type
export interface KpiData {
  id: number | string;
  title: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  target?: string;
  score?: number;
  category?: string;
  scopedFor?: 'client' | 'internal' | 'both';
}

// Related Metrics Type
export interface RelatedMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
}

// Insight Data Type
export interface InsightData {
  id: number | string;
  title: string;
  summary: string;
  details?: string;
  confidence: number;
  category: string;
  date?: string;
  region?: string;
  impact?: string;
  recommendations?: string[];
  relatedMetrics?: RelatedMetric[];
  chartData?: any;
  // Additional properties for real data integration
  lastUpdated?: string;
  source?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  scopedFor?: 'client' | 'internal' | 'both';
  sensitivity?: 'public' | 'confidential' | 'internal';
}

// Chart Data Type
export interface ChartData {
  name: string;
  [key: string]: string | number; // For dynamic metrics like revenue, orders, etc.
}

// Metrics Data Type (for API responses)
export interface MetricsData {
  timestamp: string;
  metrics: {
    [key: string]: number;
  };
  dimensions?: {
    [key: string]: string;
  };
}

// Filter Values Type
export interface FilterValues {
  period: string;
  organization: string;
  region: string;
  category: string;
  [key: string]: string;
}

// Dashboard Context Type
export interface DashboardContext {
  kpiData: KpiData[];
  insightData: InsightData[];
  chartData: ChartData[];
  filters: FilterValues;
  dataSource: 'simulated' | 'real' | 'hybrid';
  dataTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastUpdated: Date;
  isLoading: boolean;
  setFilters: (filters: FilterValues) => void;
  setDataSource: (source: 'simulated' | 'real' | 'hybrid') => void;
  refreshData: () => Promise<void>;
}