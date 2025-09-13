import React from 'react';
import { useDataConnector } from '@/context/DataConnectorContext';
import { MedallionTier } from '@/lib/medallion_data_connector';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  LayersIcon, 
  ClockIcon, 
  DatabaseIcon,
  CheckCircle2Icon,
  AlertCircleIcon
} from 'lucide-react';

interface DataFreshnessBadgeProps {
  className?: string;
  showTier?: boolean;
  showRefreshTime?: boolean;
}

export function DataFreshnessBadge({ 
  className, 
  showTier = true,
  showRefreshTime = true 
}: DataFreshnessBadgeProps) {
  const { badge, lastUpdated, tier, mode } = useDataConnector();

  // Format refresh time
  const formatRefreshTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(date);
      }
    }
  };

  // Get tier icon and color
  const getTierIcon = (tier: MedallionTier) => {
    switch (tier) {
      case 'bronze':
        return <LayersIcon className="h-4 w-4 mr-1 text-amber-600" />;
      case 'silver':
        return <LayersIcon className="h-4 w-4 mr-1 text-slate-400" />;
      case 'gold':
        return <LayersIcon className="h-4 w-4 mr-1 text-yellow-500" />;
      case 'platinum':
        return <LayersIcon className="h-4 w-4 mr-1 text-blue-500" />;
      default:
        return <LayersIcon className="h-4 w-4 mr-1" />;
    }
  };

  // Determine freshness status
  const getFreshnessStatus = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // In simulated mode, always show as fresh
    if (mode === 'simulated') {
      return {
        icon: <CheckCircle2Icon className="h-3 w-3 mr-1 text-green-500" />,
        label: 'Data is current',
        variant: 'outline' as const
      };
    }
    
    // In real or hybrid mode, check freshness
    if (diffHours < 1) {
      return {
        icon: <CheckCircle2Icon className="h-3 w-3 mr-1 text-green-500" />,
        label: 'Data is current',
        variant: 'outline' as const
      };
    } else if (diffHours < 24) {
      return {
        icon: <AlertCircleIcon className="h-3 w-3 mr-1 text-amber-500" />,
        label: 'Data refresh pending',
        variant: 'secondary' as const
      };
    } else {
      return {
        icon: <AlertCircleIcon className="h-3 w-3 mr-1 text-red-500" />,
        label: 'Data refresh needed',
        variant: 'destructive' as const
      };
    }
  };

  const freshnessStatus = getFreshnessStatus();

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {showTier && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-help">
              {getTierIcon(tier)}
              <span>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs">
              <p className="text-xs">
                <span className="font-medium">Data Tier:</span> {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tier === 'bronze' && 'Raw, unprocessed data from source systems'}
                {tier === 'silver' && 'Cleansed and normalized data ready for analysis'} 
                {tier === 'gold' && 'Aggregated, business-level metrics and KPIs'}
                {tier === 'platinum' && 'AI-processed insights and recommendations'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      
      {showRefreshTime && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={freshnessStatus.variant} className="cursor-help">
              {freshnessStatus.icon}
              <span>{freshnessStatus.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="max-w-xs">
              <div className="flex items-center gap-1 mb-1">
                <ClockIcon className="h-3 w-3" />
                <span className="font-medium">Last updated: {formatRefreshTime(lastUpdated)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DatabaseIcon className="h-3 w-3" />
                <span>{badge.label}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}