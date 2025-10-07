import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  prefix = '',
  suffix = '' 
}: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendBgColors = {
    up: 'bg-green-100',
    down: 'bg-red-100',
    neutral: 'bg-gray-100',
  };

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {prefix}{value}{suffix}
          </p>
        </div>
        
        {change && (
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${trendBgColors[trend]}`}>
            {trend === 'up' && <TrendingUp size={14} className={trendColors[trend]} />}
            {trend === 'down' && <TrendingDown size={14} className={trendColors[trend]} />}
            <span className={`text-sm font-medium ${trendColors[trend]}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-dashboard-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      </div>
    </div>
  );
}