import React from 'react';
import { ariaAttributes } from '@/utils/keyboard-a11y';
import { useRole, UserRole } from '@/context/RoleContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  UsersIcon, 
  UserIcon, 
  BuildingIcon, 
  ShieldIcon,
  UserCogIcon
} from "lucide-react";

interface RoleToggleProps {
  className?: string;
}

export function RoleToggle({ className }: RoleToggleProps) {
  const { role, setRole, isInternalView } = useRole();

  // Get badge properties based on current role
  const getBadgeProperties = () => {
    if (isInternalView) {
      return {
        label: 'Internal View',
        icon: <ShieldIcon className="h-3 w-3 mr-1" />,
        variant: 'destructive' as const,
        tooltip: 'You are viewing the dashboard with full internal access'
      };
    } else {
      return {
        label: 'Client View',
        icon: <BuildingIcon className="h-3 w-3 mr-1" />,
        variant: 'outline' as const,
        tooltip: 'You are viewing the dashboard as a client would see it'
      };
    }
  };

  const badgeProps = getBadgeProperties();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={badgeProps.variant}
            className="cursor-help hover-scale focus-ring"
            aria-label={`View mode: ${badgeProps.label}`}
            title={badgeProps.tooltip}
          >
            {React.cloneElement(badgeProps.icon, {'aria-hidden': 'true'})}
            <span>{badgeProps.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="max-w-xs">
            <p className="text-xs">{badgeProps.tooltip}</p>
            {isInternalView && (
              <p className="text-xs text-muted-foreground mt-1">
                You can see all KPIs, insights, and internal metrics
              </p>
            )}
            {!isInternalView && (
              <p className="text-xs text-muted-foreground mt-1">
                Only showing client-approved metrics and insights
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover-button focus-ring"
            aria-label="Switch view mode"
            title="Switch between client and internal views"
            {...ariaAttributes.expandable(false)}
          >
            <UserCogIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Switch view</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Switch View</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setRole('client')}
            className={role === 'client' ? 'bg-secondary/50' : ''}
          >
            <BuildingIcon className="h-4 w-4 mr-2 text-blue-500" />
            <span>Client View</span>
            {role === 'client' && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setRole('internal')}
            className={role === 'internal' ? 'bg-secondary/50' : ''}
          >
            <ShieldIcon className="h-4 w-4 mr-2 text-red-500" />
            <span>Internal View</span>
            {role === 'internal' && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <UsersIcon className="h-3 w-3" />
              <span>Switch between view modes</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}