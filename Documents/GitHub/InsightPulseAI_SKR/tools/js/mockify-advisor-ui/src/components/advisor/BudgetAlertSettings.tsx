import React, { useState, useEffect } from 'react';
import { BudgetAlertSettings as BudgetSettings, BudgetAlertStatus } from '@/utils/llm-pricing-calculator';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircleIcon, 
  AlertTriangleIcon, 
  BellIcon, 
  DollarSignIcon, 
  CheckCircleIcon,
  BellOffIcon
} from 'lucide-react';

interface BudgetAlertSettingsProps {
  settings: BudgetSettings;
  onUpdateSettings: (settings: Partial<BudgetSettings>) => void;
  budgetStatus?: BudgetAlertStatus;
  className?: string;
}

export function BudgetAlertSettings({
  settings,
  onUpdateSettings,
  budgetStatus,
  className
}: BudgetAlertSettingsProps) {
  const [localSettings, setLocalSettings] = useState<BudgetSettings>(settings);
  
  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  // Handle toggling budget alerts
  const handleToggleEnabled = (enabled: boolean) => {
    const newSettings = { ...localSettings, enabled };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };
  
  // Handle updating threshold values
  const handleUpdateThreshold = (key: keyof BudgetSettings, value: number) => {
    if (isNaN(value) || value < 0) return;
    
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };
  
  // Apply changes
  const handleApplyChanges = () => {
    onUpdateSettings(localSettings);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Get status badge
  const getStatusBadge = (status: { percentUsed: number; isWarning: boolean; isExceeded: boolean }) => {
    if (status.isExceeded) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          Exceeded
        </Badge>
      );
    }
    
    if (status.isWarning) {
      return (
        <Badge variant="warning" className="ml-2 bg-amber-500">
          <AlertTriangleIcon className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        OK
      </Badge>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <DollarSignIcon className="h-5 w-5 mr-2" />
            Budget Alerts
          </CardTitle>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>
        <CardDescription>
          Set spending limits and get alerts when you approach thresholds
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!localSettings.enabled ? (
          <div className="py-6 text-center text-muted-foreground">
            <BellOffIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Budget alerts are disabled. Enable to set spending limits.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Threshold Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Spending Thresholds</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily-threshold">Daily Limit ($)</Label>
                  <Input
                    id="daily-threshold"
                    type="number"
                    min="0"
                    step="5"
                    value={localSettings.dailyThreshold || 0}
                    onChange={(e) => handleUpdateThreshold('dailyThreshold', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="weekly-threshold">Weekly Limit ($)</Label>
                  <Input
                    id="weekly-threshold"
                    type="number"
                    min="0"
                    step="10"
                    value={localSettings.weeklyThreshold || 0}
                    onChange={(e) => handleUpdateThreshold('weeklyThreshold', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly-threshold">Monthly Limit ($)</Label>
                  <Input
                    id="monthly-threshold"
                    type="number"
                    min="0"
                    step="25"
                    value={localSettings.monthlyThreshold || 0}
                    onChange={(e) => handleUpdateThreshold('monthlyThreshold', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="alert-percentage">Alert at (%)</Label>
                  <Input
                    id="alert-percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={localSettings.alertPercentage || 80}
                    onChange={(e) => handleUpdateThreshold('alertPercentage', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleApplyChanges}
                className="w-full mt-2"
              >
                Apply Changes
              </Button>
            </div>
            
            {/* Current Budget Status */}
            {budgetStatus && (
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">Current Status</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Daily Usage</span>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(budgetStatus.dailyStatus.cost)} of {formatCurrency(budgetStatus.dailyStatus.threshold)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium mr-2">
                        {budgetStatus.dailyStatus.percentUsed.toFixed(1)}%
                      </div>
                      {getStatusBadge(budgetStatus.dailyStatus)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Weekly Usage</span>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(budgetStatus.weeklyStatus.cost)} of {formatCurrency(budgetStatus.weeklyStatus.threshold)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium mr-2">
                        {budgetStatus.weeklyStatus.percentUsed.toFixed(1)}%
                      </div>
                      {getStatusBadge(budgetStatus.weeklyStatus)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Monthly Usage</span>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(budgetStatus.monthlyStatus.cost)} of {formatCurrency(budgetStatus.monthlyStatus.threshold)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-sm font-medium mr-2">
                        {budgetStatus.monthlyStatus.percentUsed.toFixed(1)}%
                      </div>
                      {getStatusBadge(budgetStatus.monthlyStatus)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {localSettings.enabled && budgetStatus && (budgetStatus.hasWarning || budgetStatus.hasExceeded) && (
        <CardFooter className={`bg-${budgetStatus.hasExceeded ? 'red' : 'amber'}-50 border-t border-${budgetStatus.hasExceeded ? 'red' : 'amber'}-200 p-3`}>
          <div className={`flex items-start gap-2 text-${budgetStatus.hasExceeded ? 'red' : 'amber'}-700 text-sm`}>
            {budgetStatus.hasExceeded ? (
              <AlertCircleIcon className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertTriangleIcon className="h-4 w-4 mt-0.5" />
            )}
            <div>
              <span className="font-medium">
                {budgetStatus.hasExceeded ? 'Budget Exceeded!' : 'Budget Warning'}
              </span>
              <p className="text-xs mt-0.5">
                {budgetStatus.hasExceeded 
                  ? 'You have exceeded one or more budget thresholds. Consider adjusting your usage or increasing your budget.'
                  : 'You are approaching one or more budget thresholds. Consider reviewing your usage pattern.'}
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}