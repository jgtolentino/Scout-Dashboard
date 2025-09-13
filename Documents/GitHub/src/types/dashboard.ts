export interface DashboardFilters {
  categories?: string[];
  brands?: string[];
  locations?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TopBundle {
  name: string;
  count: number;
  percentage: number;
}

export interface DailyStats {
  date: string;
  revenue: number;
  transactions: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  avgTransaction: number;
  topBrands: Array<{
    name: string;
    revenue: number;
    transactions: number;
    marketShare: number;
  }>;
  topBundle: TopBundle;
  dailyStats: DailyStats[];
} 