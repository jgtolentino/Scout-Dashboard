import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  icon?: React.ReactNode;
  sparkline?: React.ReactNode;
  score?: number;
}

export function KpiCard({
  title,
  value,
  change,
  trend = 'neutral',
  color = 'default',
  subtitle,
  icon,
  sparkline,
  score
}: KpiCardProps) {
  const colorVariants = {
    default: 'bg-card',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-red-50 border-red-200',
  };

  const trendIcons = {
    up: <ArrowUpIcon className="h-4 w-4 text-green-500" />,
    down: <ArrowDownIcon className="h-4 w-4 text-red-500" />,
    neutral: <MinusIcon className="h-4 w-4 text-gray-500" />
  };

  return (
    <Card className={`${colorVariants[color]} transition-all duration-300 hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon && <div>{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trendIcons[trend]}
              <span className={
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }>
                {Math.abs(change)}%
              </span>
              <span className="text-muted-foreground">vs. prev. period</span>
            </div>
          )}
        </div>
        {sparkline && (
          <div className="mt-2 h-10">
            {sparkline}
          </div>
        )}
      </CardContent>
      {(subtitle || score !== undefined) && (
        <CardFooter className="pt-0 flex justify-between items-center">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {score !== undefined && (
            <Badge variant="outline" className="bg-primary/10">
              Score: {score}/100
            </Badge>
          )}
        </CardFooter>
      )}
    </Card>
  );
}