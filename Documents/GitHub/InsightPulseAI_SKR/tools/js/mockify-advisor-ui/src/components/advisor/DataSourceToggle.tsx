import React from 'react';
import { ariaAttributes } from '@/utils/keyboard-a11y';
import { useDataConnector } from '@/context/DataConnectorContext';
import { DataSourceMode, MedallionTier } from '@/lib/medallion_data_connector';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, DatabaseIcon, LayersIcon, Settings2Icon } from 'lucide-react';

export interface DataSourceToggleProps {
  className?: string;
}

export function DataSourceToggle({ className }: DataSourceToggleProps) {
  const { mode, setMode, badge, lastUpdated } = useDataConnector();

  // Format the last updated time
  const formattedLastUpdated = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(lastUpdated);

  // Get tier icon and color
  const getTierIcon = (tier: MedallionTier) => {
    switch (tier) {
      case 'bronze':
        return <LayersIcon className="h-4 w-4 mr-2 text-amber-600" />;
      case 'silver':
        return <LayersIcon className="h-4 w-4 mr-2 text-slate-400" />;
      case 'gold':
        return <LayersIcon className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'platinum':
        return <LayersIcon className="h-4 w-4 mr-2 text-blue-500" />;
      default:
        return <LayersIcon className="h-4 w-4 mr-2" />;
    }
  };

  // Generate badge color based on mode
  const getBadgeVariant = (mode: DataSourceMode) => {
    switch (mode) {
      case 'simulated':
        return "secondary";
      case 'real':
        return "default";
      case 'hybrid':
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={getBadgeVariant(mode)}
            className="cursor-help hover-scale focus-ring"
            aria-label={`Data source: ${badge.label}`}
          >
            <DatabaseIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            <span>{badge.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              {getTierIcon(badge.tier)}
              <span className="font-medium">{badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} Tier</span>
            </div>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {formattedLastUpdated}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover-button focus-ring"
            aria-label="Data source settings"
            title="Data source settings"
            {...ariaAttributes.expandable(false)}
          >
            <Settings2Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Data source settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Data Source</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setMode('simulated')}
            className={mode === 'simulated' ? 'bg-secondary/50' : ''}
          >
            <DatabaseIcon className="h-4 w-4 mr-2 text-purple-500" />
            <span>Simulated Data</span>
            {mode === 'simulated' && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setMode('real')}
            className={mode === 'real' ? 'bg-secondary/50' : ''}
          >
            <DatabaseIcon className="h-4 w-4 mr-2 text-blue-500" />
            <span>Production Data</span>
            {mode === 'real' && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setMode('hybrid')}
            className={mode === 'hybrid' ? 'bg-secondary/50' : ''}
          >
            <DatabaseIcon className="h-4 w-4 mr-2 text-amber-500" />
            <span>Hybrid Data</span>
            {mode === 'hybrid' && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <InfoIcon className="h-3 w-3" />
              <span>Medallion Data Architecture</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}