export interface DataPoint {
  [key: string]: any;
}

export interface Dataset {
  id: string;
  name: string;
  data: DataPoint[];
  columns: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'map' | 'table' | 'metric';
  title: string;
  datasetId: string;
  xAxis?: string;
  yAxis?: string | string[];
  groupBy?: string;
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max';
  filters?: Filter[];
  color?: string;
  options?: any;
}

export interface Filter {
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  charts: ChartConfig[];
  layout: Layout[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Layout {
  i: string; // Chart ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
}

export type VisualizationType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'scatter'
  | 'heatmap'
  | 'map'
  | 'table'
  | 'metric'
  | 'sankey'
  | 'treemap'
  | 'funnel'
  | 'gauge';

export interface SqlQuery {
  id: string;
  name: string;
  query: string;
  datasetId: string;
  parameters?: QueryParameter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue?: any;
  required: boolean;
}