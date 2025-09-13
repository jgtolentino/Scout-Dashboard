#!/bin/bash
# Script to implement Power BI-styled Advisor dashboard
# Following the enhanced UI specifications

set -e

echo "🚀 Power BI-Styled Advisor Dashboard Builder 🚀"
echo "=============================================="

# Configuration
WORK_DIR="mockify-advisor-ui"
SOURCE_REPO="https://github.com/jgtolentino/mockify-creator.git"
BUILD_DIR="build-advisor"
DEPLOY_DIR="deploy-advisor"
APP_NAME="tbwa-juicer-insights-dashboard"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"

echo "1️⃣ Cloning base repository..."
rm -rf "$WORK_DIR" "$BUILD_DIR" "$DEPLOY_DIR"
git clone "$SOURCE_REPO" "$WORK_DIR"

echo "2️⃣ Updating package information..."
cd "$WORK_DIR"
sed -i '' 's/"name": "vite_react_shadcn_ts"/"name": "scout-advisor"/g' package.json
sed -i '' 's/"version": "0.0.0"/"version": "1.0.0"/g' package.json

echo "3️⃣ Installing dependencies..."
npm install recharts
npm install date-fns
npm install classnames
npm install

echo "4️⃣ Implementing enhanced components..."
# Create KPI Card component
mkdir -p src/components/advisor
cat > src/components/advisor/KpiCard.tsx << 'EOF'
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
EOF

# Create Insight Card component
cat > src/components/advisor/InsightCard.tsx << 'EOF'
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LightbulbIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ExternalLinkIcon 
} from "lucide-react";

interface InsightCardProps {
  title: string;
  summary: string;
  confidence: number;
  date: string;
  category: string;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  details?: string;
}

export function InsightCard({
  title,
  summary,
  confidence,
  date,
  category,
  actions = [],
  details
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Confidence level color
  const getConfidenceColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={category === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{summary}</p>
        
        {details && (
          <div className="mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="p-0 h-8 text-primary flex items-center gap-1"
            >
              {expanded ? (
                <>Less Details <ChevronUpIcon className="h-4 w-4" /></>
              ) : (
                <>More Details <ChevronDownIcon className="h-4 w-4" /></>
              )}
            </Button>
            
            {expanded && (
              <div className="mt-2 text-sm border-l-2 border-primary/20 pl-3 py-1">
                {details}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">{date}</div>
          <div className="flex items-center gap-1">
            <div className={`h-2 w-16 rounded-full bg-gray-200 overflow-hidden`}>
              <div 
                className={`h-full ${getConfidenceColor(confidence)}`} 
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs">{confidence}%</span>
          </div>
        </div>
        
        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, i) => (
              <Button 
                key={i} 
                size="sm" 
                variant="outline" 
                onClick={action.onClick}
                className="text-xs"
              >
                {action.label} <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </Button>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
EOF

# Create Filter Bar component
cat > src/components/advisor/FilterBar.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  organizations?: string[];
  regions?: string[];
  categories?: string[];
}

interface FilterState {
  period: string;
  dateRange?: { from: Date; to: Date };
  organization: string;
  region: string;
  category: string;
  search: string;
}

export function FilterBar({ 
  onFilterChange,
  organizations = ["All", "TBWA", "AllianceOne", "Reebok", "NCC Bank"],
  regions = ["All", "North America", "APAC", "EMEA", "LATAM"],
  categories = ["All", "Brand", "Competitors", "Retail", "ROI"],
}: FilterBarProps) {
  // Default filter state
  const [filters, setFilters] = useState<FilterState>({
    period: "30",
    organization: "All",
    region: "All",
    category: "All",
    search: "",
  });
  
  // Date range state
  const [date, setDate] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: new Date(),
    to: new Date(),
  });
  
  // Function to handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string | { from: Date; to: Date }) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // If the URL parameters should be updated
    const searchParams = new URLSearchParams(window.location.search);
    if (typeof value === 'string') {
      searchParams.set(key, value);
    } else if (key === 'dateRange') {
      searchParams.set('from', value.from.toISOString().split('T')[0]);
      searchParams.set('to', value.to.toISOString().split('T')[0]);
    }
    
    // Update URL without refreshing
    const newUrl = window.location.pathname + '?' + searchParams.toString();
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Store in localStorage
    localStorage.setItem('advisorFilters', JSON.stringify(newFilters));
    
    // Notify parent component
    onFilterChange(newFilters);
  };
  
  // Function to reset all filters
  const resetFilters = () => {
    const defaultFilters = {
      period: "30",
      organization: "All",
      region: "All",
      category: "All",
      search: "",
    };
    setFilters(defaultFilters);
    
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
    
    // Clear localStorage
    localStorage.removeItem('advisorFilters');
    
    // Notify parent component
    onFilterChange(defaultFilters);
  };
  
  // Load filters from localStorage or URL on initial mount
  useEffect(() => {
    // Try to load from localStorage first
    const savedFilters = localStorage.getItem('advisorFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      setFilters(parsedFilters);
      onFilterChange(parsedFilters);
      return;
    }
    
    // If not found in localStorage, try URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const urlFilters: Partial<FilterState> = {};
    
    if (searchParams.has('period')) urlFilters.period = searchParams.get('period') || "30";
    if (searchParams.has('organization')) urlFilters.organization = searchParams.get('organization') || "All";
    if (searchParams.has('region')) urlFilters.region = searchParams.get('region') || "All";
    if (searchParams.has('category')) urlFilters.category = searchParams.get('category') || "All";
    if (searchParams.has('search')) urlFilters.search = searchParams.get('search') || "";
    
    // Handle date range
    if (searchParams.has('from') && searchParams.has('to')) {
      const from = new Date(searchParams.get('from') || '');
      const to = new Date(searchParams.get('to') || '');
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        urlFilters.dateRange = { from, to };
        setDate({ from, to });
      }
    }
    
    if (Object.keys(urlFilters).length > 0) {
      const newFilters = { ...filters, ...urlFilters };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }, []);

  return (
    <div className="bg-white border rounded-lg p-3 mb-4 sticky top-0 z-10">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
      
        {/* Time Period */}
        <Select
          value={filters.period}
          onValueChange={(value) => handleFilterChange('period', value)}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Date Range Picker (shown when custom period is selected) */}
        {filters.period === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 justify-start text-left font-normal w-[200px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date.from && date.to ? (
                  format(date.from, 'PPP') + " - " + format(date.to, 'PPP')
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(value) => {
                  if (value?.from && value?.to) {
                    setDate(value);
                    handleFilterChange('dateRange', { from: value.from, to: value.to });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
        
        {/* Organization */}
        <Select
          value={filters.organization}
          onValueChange={(value) => handleFilterChange('organization', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org} value={org}>{org}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Region */}
        <Select
          value={filters.region}
          onValueChange={(value) => handleFilterChange('region', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>{region}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="h-8 pl-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8"
              onClick={() => handleFilterChange('search', '')}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Reset Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="h-8"
        >
          Reset
        </Button>
      </div>
      
      {/* Filter Tags - Show active filters */}
      <div className="flex flex-wrap gap-1 mt-2">
        {filters.organization !== 'All' && (
          <Badge variant="secondary" className="text-xs">
            Org: {filters.organization}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => handleFilterChange('organization', 'All')}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filters.region !== 'All' && (
          <Badge variant="secondary" className="text-xs">
            Region: {filters.region}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => handleFilterChange('region', 'All')}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filters.category !== 'All' && (
          <Badge variant="secondary" className="text-xs">
            Category: {filters.category}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => handleFilterChange('category', 'All')}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        )}
      </div>
    </div>
  );
}
EOF

# Create Assistant Panel component
cat > src/components/advisor/AssistantPanel.tsx << 'EOF'
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuitIcon, CheckCircleIcon, ClipboardIcon, FileIcon, MailIcon, MessageSquareIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AssistantPanelProps {
  insightId: string;
  insightTitle: string;
  children: React.ReactNode;
}

export function AssistantPanel({
  insightId,
  insightTitle,
  children,
}: AssistantPanelProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  
  // Mock function to generate a plan
  const generatePlan = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response
    const mockPlan = `# Action Plan: ${insightTitle}

## Summary
This insight reveals an opportunity to optimize brand positioning in response to shifts in consumer preferences towards sustainability.

## Recommended Actions

1. **Conduct Focused Social Listening**
   - Track conversations around sustainability in your product category
   - Identify specific terms and concepts resonating with your audience
   - Benchmark against competitor messaging

2. **Engage Marketing Team**
   - Share these insights with brand managers and creative teams
   - Develop messaging that authentically aligns with sustainability values
   - Consider refreshing visual assets to reflect this positioning

3. **Test & Measure**
   - Implement A/B testing of new messaging across channels
   - Monitor engagement metrics closely for 14 days
   - Prepare to scale successful approaches

## Resources Required
- Social listening tools access
- 2-3 hours of marketing team workshop time
- Budget allocation for creative refreshes if needed

## Expected Timeline
- Initial analysis: 3-5 business days
- Strategy development: 1 week
- Implementation: 2-3 weeks
- Measurement: Ongoing with first report at 30 days`;

    setGeneratedPlan(mockPlan);
    setLoading(false);
  };
  
  // Copy to clipboard function
  const copyToClipboard = () => {
    if (generatedPlan) {
      navigator.clipboard.writeText(generatedPlan);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuitIcon className="h-5 w-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Generate actionable plans based on this insight.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="generate" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Plan</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4 py-4">
            {!generatedPlan ? (
              <div className="flex flex-col items-center justify-center p-6 border rounded-lg border-dashed">
                <BrainCircuitIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Generate an AI-powered action plan based on this insight to help your team take immediate action.
                </p>
                <Button 
                  onClick={generatePlan} 
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Action Plan"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                  {generatedPlan}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <FileIcon className="h-4 w-4" />
                    Save as PDF
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4 py-4">
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start">
                <MailIcon className="h-4 w-4 mr-2" />
                Share via Email
              </Button>
              <Button variant="outline" className="justify-start">
                <MessageSquareIcon className="h-4 w-4 mr-2" />
                Share to Teams Channel
              </Button>
              <Separator />
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">Copy shareable link:</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`https://advisor.insightpulse.ai/insights/${insightId}`}
                    className="text-xs"
                  />
                  <Button variant="secondary" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`https://advisor.insightpulse.ai/insights/${insightId}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="py-4">
            <div className="text-center p-6 text-muted-foreground">
              <p>No previously generated plans found.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export a smaller Input component for this file
function Input({ className, ...props }) {
  return (
    <input
      className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
EOF

# Create Dashboard Page with Custom Components
cat > src/components/advisor/Dashboard.tsx << 'EOF'
import React, { useState } from 'react';
import { KpiCard } from './KpiCard';
import { InsightCard } from './InsightCard';
import { FilterBar } from './FilterBar';
import { AssistantPanel } from './AssistantPanel';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUpIcon, 
  UsersIcon, 
  TrophyIcon, 
  DatabaseIcon,
  DollarSignIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterState {
  period: string;
  dateRange?: { from: Date; to: Date };
  organization: string;
  region: string;
  category: string;
  search: string;
}

// Mock data for charts
const brandMetrics = [
  { name: 'Jan', value: 65 },
  { name: 'Feb', value: 59 },
  { name: 'Mar', value: 80 },
  { name: 'Apr', value: 81 },
  { name: 'May', value: 76 }
];

const competitorData = [
  { name: 'Competitor A', value: 35 },
  { name: 'Competitor B', value: 25 },
  { name: 'Competitor C', value: 20 },
  { name: 'Others', value: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const retailTrend = [
  { name: 'Week 1', value: 4000 },
  { name: 'Week 2', value: 3000 },
  { name: 'Week 3', value: 5000 },
  { name: 'Week 4', value: 7000 },
  { name: 'Week 5', value: 5000 },
  { name: 'Week 6', value: 6000 },
  { name: 'Week 7', value: 7000 },
  { name: 'Week 8', value: 9000 },
];

// Mock insights data
const mockInsights = [
  {
    id: '1',
    title: 'Brand sentiment shifting towards sustainability messaging',
    summary: 'Analysis shows a 28% increase in positive engagement when sustainability is highlighted in marketing content.',
    confidence: 87,
    date: 'May 12, 2025',
    category: 'Brand',
    details: 'Our NLP analysis of social media engagement patterns reveals that content mentioning sustainability practices receives significantly higher engagement rates across all platforms. This trend is particularly strong among the 25-34 demographic, where we see a 42% higher click-through rate compared to similar content without sustainability mentions.'
  },
  {
    id: '2',
    title: 'Competitor X gaining market share in urban markets',
    summary: 'Competitor X has increased their market presence by 15% in major urban centers over the past quarter.',
    confidence: 76,
    date: 'May 10, 2025',
    category: 'Competitive',
    details: 'Detailed market analysis indicates Competitor X has been aggressively expanding their physical retail presence in urban centers with populations over 1 million. They've opened 37 new locations in Q1 2025, primarily focusing on high-foot-traffic areas. Their digital ad spend in these markets has also increased by approximately 22% based on our media monitoring tools.'
  },
  {
    id: '3',
    title: 'Retail performance anomaly detected in Southeast region',
    summary: 'Unexpected 18% drop in conversion rates across Southeast retail locations during weekends.',
    confidence: 63,
    date: 'May 8, 2025',
    category: 'Critical',
    details: 'Our AI-powered anomaly detection system has identified a statistically significant pattern of decreased weekend conversion rates in Southeast retail locations, beginning approximately 3 weeks ago. This pattern differs from historical weekend performance and from current performance in other regions. Initial hypothesis suggests this may correlate with new local competitors' promotional activities or potential issues with weekend staffing levels.'
  }
];

export function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    period: "30",
    organization: "All",
    region: "All",
    category: "All",
    search: "",
  });
  
  const [dataAsOf] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
  
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // In a real app, you'd fetch new data based on these filters
    console.log('Filters updated:', newFilters);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Retail Advisor Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Data as of: {dataAsOf}
        </div>
      </div>
      
      <FilterBar onFilterChange={handleFilterChange} />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Brand Score"
          value={84}
          change={5.2}
          trend="up"
          color="success"
          icon={<TrendingUpIcon className="h-4 w-4 text-green-600" />}
          score={84}
        />
        
        <KpiCard
          title="Competitor Analysis"
          value="Strong"
          change={-2.1}
          trend="down"
          color="warning"
          icon={<TrophyIcon className="h-4 w-4 text-amber-600" />}
          score={72}
        />
        
        <KpiCard
          title="Retail Performance"
          value="$1.2M"
          change={12.8}
          trend="up"
          color="success"
          icon={<DatabaseIcon className="h-4 w-4 text-blue-600" />}
          score={92}
        />
        
        <KpiCard
          title="ROI"
          value="128%"
          change={3.5}
          trend="up"
          color="success"
          icon={<DollarSignIcon className="h-4 w-4 text-green-600" />}
          score={88}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Brand Metrics Chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium mb-4">Brand Sentiment Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandMetrics}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Competitor Analysis */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium mb-4">Market Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={competitorData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {competitorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Retail Trend */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium mb-4">Retail Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={retailTrend}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            AI-Generated Insights
          </h2>
          <Button variant="outline" size="sm">View All Insights</Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {mockInsights.map(insight => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              summary={insight.summary}
              confidence={insight.confidence}
              date={insight.date}
              category={insight.category}
              details={insight.details}
              actions={[
                {
                  label: "Get Action Plan",
                  onClick: () => {}
                }
              ]}
            />
          ))}
        </div>
      </div>
      
      {/* Assistant Panel (hidden until triggered) */}
      <AssistantPanel
        insightId="1"
        insightTitle="Brand sentiment shifting towards sustainability messaging"
      >
        <Button>Open Assistant</Button>
      </AssistantPanel>
    </div>
  );
}
EOF

# Update App.tsx to use our new Dashboard
cat > src/App.tsx << 'EOF'
import { ThemeProvider } from "@/components/theme-provider";
import { Dashboard } from '@/components/advisor/Dashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
EOF

echo "5️⃣ Building the enhanced application..."
npm run build

cd ..

echo "6️⃣ Preparing deployment package..."
mkdir -p "$DEPLOY_DIR/advisor"
cp -r "$WORK_DIR/dist/"* "$DEPLOY_DIR/advisor/"

# Create advisor.html in the root as a redirect
cat > "$DEPLOY_DIR/advisor.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create insights_dashboard.html as a legacy redirect
cat > "$DEPLOY_DIR/insights_dashboard.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/advisor/" />
  <title>Redirecting to Advisor Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="/advisor/">Advisor Dashboard</a>...</p>
</body>
</html>
EOF

# Create proper Azure Static Web App config
cat > "$DEPLOY_DIR/staticwebapp.config.json" << 'EOF'
{
  "navigationFallback": {
    "rewrite": "/advisor/index.html",
    "exclude": ["/images/*", "/assets/*", "*.css", "*.js"]
  },
  "routes": [
    {
      "route": "/advisor",
      "serve": "/advisor/index.html"
    },
    {
      "route": "/advisor/*",
      "serve": "/advisor/index.html"
    },
    {
      "route": "/insights_dashboard.html",
      "serve": "/advisor/index.html"
    }
  ],
  "mimeTypes": {
    ".json": "text/json"
  }
}
EOF

echo "7️⃣ Getting deployment token..."
DEPLOY_TOKEN=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.apiKey" -o tsv)

echo "8️⃣ Deploying to Azure Static Web App..."
npx @azure/static-web-apps-cli deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOY_TOKEN" \
  --app-name "$APP_NAME" \
  --env production

echo "✅ Power BI-styled Advisor Dashboard deployed successfully!"
echo "🌐 Dashboard URL: https://$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "defaultHostname" -o tsv)/advisor/"