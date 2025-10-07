import { DataPoint } from '@/types';
import * as d3 from 'd3';
import _ from 'lodash';

export function aggregateData(
  data: DataPoint[],
  groupBy: string,
  valueField: string,
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max' = 'sum'
): DataPoint[] {
  const grouped = _.groupBy(data, groupBy);
  
  return Object.entries(grouped).map(([key, values]) => {
    let aggregatedValue: number;
    
    switch (aggregation) {
      case 'sum':
        aggregatedValue = _.sumBy(values, (v) => Number(v[valueField]) || 0);
        break;
      case 'average':
        aggregatedValue = _.meanBy(values, (v) => Number(v[valueField]) || 0);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      case 'min':
        aggregatedValue = _.minBy(values, (v) => Number(v[valueField]) || 0)?.[valueField] || 0;
        break;
      case 'max':
        aggregatedValue = _.maxBy(values, (v) => Number(v[valueField]) || 0)?.[valueField] || 0;
        break;
      default:
        aggregatedValue = 0;
    }
    
    return {
      [groupBy]: key,
      [valueField]: aggregatedValue,
      _count: values.length,
    };
  });
}

export function pivotData(
  data: DataPoint[],
  rowField: string,
  columnField: string,
  valueField: string,
  aggregation: 'sum' | 'average' | 'count' = 'sum'
): { rows: string[]; columns: string[]; values: number[][] } {
  const rows = _.uniq(data.map((d) => String(d[rowField])));
  const columns = _.uniq(data.map((d) => String(d[columnField])));
  
  const pivoted = rows.map((row) => {
    return columns.map((col) => {
      const filtered = data.filter(
        (d) => String(d[rowField]) === row && String(d[columnField]) === col
      );
      
      if (filtered.length === 0) return 0;
      
      switch (aggregation) {
        case 'sum':
          return _.sumBy(filtered, (v) => Number(v[valueField]) || 0);
        case 'average':
          return _.meanBy(filtered, (v) => Number(v[valueField]) || 0);
        case 'count':
          return filtered.length;
        default:
          return 0;
      }
    });
  });
  
  return { rows, columns, values: pivoted };
}

export function calculatePercentiles(
  data: DataPoint[],
  field: string,
  percentiles: number[] = [25, 50, 75]
): { percentile: number; value: number }[] {
  const values = data
    .map((d) => Number(d[field]))
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);
  
  return percentiles.map((p) => ({
    percentile: p,
    value: d3.quantile(values, p / 100) || 0,
  }));
}

export function detectOutliers(
  data: DataPoint[],
  field: string,
  method: 'iqr' | 'zscore' = 'iqr',
  threshold: number = 1.5
): DataPoint[] {
  const values = data.map((d, i) => ({ index: i, value: Number(d[field]) }))
    .filter((v) => !isNaN(v.value));
  
  if (method === 'iqr') {
    const sorted = values.map((v) => v.value).sort((a, b) => a - b);
    const q1 = d3.quantile(sorted, 0.25) || 0;
    const q3 = d3.quantile(sorted, 0.75) || 0;
    const iqr = q3 - q1;
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;
    
    return values
      .filter((v) => v.value < lowerBound || v.value > upperBound)
      .map((v) => data[v.index]);
  } else {
    const mean = _.mean(values.map((v) => v.value));
    const std = Math.sqrt(
      _.sumBy(values, (v) => Math.pow(v.value - mean, 2)) / values.length
    );
    
    return values
      .filter((v) => Math.abs((v.value - mean) / std) > threshold)
      .map((v) => data[v.index]);
  }
}

export function calculateTrend(
  data: DataPoint[],
  dateField: string,
  valueField: string
): { slope: number; intercept: number; r2: number } {
  const points = data
    .map((d) => ({
      x: new Date(d[dateField]).getTime(),
      y: Number(d[valueField]),
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y))
    .sort((a, b) => a.x - b.x);
  
  if (points.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }
  
  const n = points.length;
  const sumX = _.sumBy(points, 'x');
  const sumY = _.sumBy(points, 'y');
  const sumXY = _.sumBy(points, (p) => p.x * p.y);
  const sumX2 = _.sumBy(points, (p) => p.x * p.x);
  const sumY2 = _.sumBy(points, (p) => p.y * p.y);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const yMean = sumY / n;
  const ssTotal = _.sumBy(points, (p) => Math.pow(p.y - yMean, 2));
  const ssResidual = _.sumBy(
    points,
    (p) => Math.pow(p.y - (slope * p.x + intercept), 2)
  );
  const r2 = 1 - ssResidual / ssTotal;
  
  return { slope, intercept, r2 };
}

export function binData(
  data: DataPoint[],
  field: string,
  bins: number = 10
): { range: string; count: number; min: number; max: number }[] {
  const values = data
    .map((d) => Number(d[field]))
    .filter((v) => !isNaN(v));
  
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / bins;
  
  const histogram = Array(bins)
    .fill(0)
    .map((_, i) => {
      const binMin = min + i * binSize;
      const binMax = min + (i + 1) * binSize;
      const count = values.filter(
        (v) => v >= binMin && (i === bins - 1 ? v <= binMax : v < binMax)
      ).length;
      
      return {
        range: `${binMin.toFixed(2)} - ${binMax.toFixed(2)}`,
        count,
        min: binMin,
        max: binMax,
      };
    });
  
  return histogram;
}

export function calculateCorrelation(
  data: DataPoint[],
  field1: string,
  field2: string
): number {
  const pairs = data
    .map((d) => ({
      x: Number(d[field1]),
      y: Number(d[field2]),
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));
  
  if (pairs.length < 2) return 0;
  
  const n = pairs.length;
  const sumX = _.sumBy(pairs, 'x');
  const sumY = _.sumBy(pairs, 'y');
  const sumXY = _.sumBy(pairs, (p) => p.x * p.y);
  const sumX2 = _.sumBy(pairs, (p) => p.x * p.x);
  const sumY2 = _.sumBy(pairs, (p) => p.y * p.y);
  
  const correlation =
    (n * sumXY - sumX * sumY) /
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return isNaN(correlation) ? 0 : correlation;
}