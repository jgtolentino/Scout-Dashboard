import React from 'react';
import Card from './Card';

interface KPICardProps {
  accent?: 'primary' | 'success' | 'warning' | 'danger';
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export default function KPICard({
  accent = 'primary',
  title,
  value,
  subtitle,
  className = '',
}: KPICardProps) {
  return (
    <Card accent={accent} padding="lg" className={className}>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
          {title}
        </h3>
        <p className="text-3xl font-bold text-gray-900">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}