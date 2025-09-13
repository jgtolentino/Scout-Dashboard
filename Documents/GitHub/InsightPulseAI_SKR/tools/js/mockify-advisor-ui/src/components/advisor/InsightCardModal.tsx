import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Share2Icon, 
  FileTextIcon,
  ListChecksIcon,
  InfoIcon,
  TrendingUpIcon,
  DownloadIcon
} from "lucide-react";

export interface InsightData {
  id: number;
  title: string;
  summary: string;
  details?: string;
  confidence: number;
  category: string;
  date?: string;
  recommendations?: string[];
  relatedMetrics?: {
    name: string;
    value: number;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
  }[];
  chartData?: any;
}

interface InsightCardModalProps {
  insight: InsightData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightCardModal({ insight, open, onOpenChange }: InsightCardModalProps) {
  // Generate some demo chart data if none is provided
  const chartData = insight.chartData || [
    { name: 'Jan', value: 10 },
    { name: 'Feb', value: 15 },
    { name: 'Mar', value: 13 },
    { name: 'Apr', value: 17 },
    { name: 'May', value: 20 },
    { name: 'Jun', value: 24 },
  ];

  // Generate demo histogram data for visualization
  const histogramData = [
    { name: 'Segment A', value: 25 },
    { name: 'Segment B', value: 40 },
    { name: 'Segment C', value: 15 },
    { name: 'Segment D', value: 20 },
  ];

  // Get confidence level color
  const getConfidenceColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  // Format date for display
  const formattedDate = insight.date || new Date().toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-amber-500" />
                <DialogTitle className="text-xl">{insight.title}</DialogTitle>
              </div>
              <Badge variant="outline" className={insight.category === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                {insight.category}
              </Badge>
            </div>
            <DialogDescription className="text-sm">{insight.summary}</DialogDescription>
            <div className="flex items-center text-muted-foreground text-xs">
              <span>Generated on {formattedDate}</span>
              <span className="mx-2">•</span>
              <div className="flex items-center gap-1">
                <span>Confidence:</span>
                <div className={`h-2 w-16 rounded-full bg-gray-200 overflow-hidden`}>
                  <div 
                    className={`h-full ${getConfidenceColor(insight.confidence)}`} 
                    style={{ width: `${insight.confidence}%` }}
                  />
                </div>
                <span>{insight.confidence}%</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <InfoIcon className="h-4 w-4 mr-1" />
              Details
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <ListChecksIcon className="h-4 w-4 mr-1" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="data-points">
              <TrendingUpIcon className="h-4 w-4 mr-1" />
              Data Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="text-sm mt-4">
              {insight.details || "No detailed analysis available for this insight."}
            </div>
            
            <div className="h-[250px] mt-6 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Trend Analysis</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0078d4" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="text-sm mt-4">
              {insight.recommendations ? (
                <ul className="space-y-2 list-disc pl-5">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p>Based on the analysis, we recommend the following actions:</p>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <h4 className="text-sm font-medium text-blue-800">Expected Impact</h4>
                <p className="text-xs mt-1 text-blue-700">
                  Following these recommendations could result in a 12-15% improvement in {insight.category} metrics
                  within the next 30-60 days.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data-points" className="space-y-4">
            <div className="text-sm mt-4">
              <p>This insight is based on the following data points and metrics:</p>
              
              {insight.relatedMetrics ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {insight.relatedMetrics.map((metric, i) => (
                    <div key={i} className="border border-gray-200 rounded p-3 flex flex-col">
                      <span className="text-muted-foreground text-xs">{metric.name}</span>
                      <div className="flex items-center mt-1">
                        <span className="text-base font-medium">{metric.value}</span>
                        <span className={`ml-2 text-xs ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} {metric.trendValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic mt-2">
                  No specific metrics available for this insight.
                </p>
              )}
              
              <div className="h-[250px] mt-6 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Data Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2Icon className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Dismiss</Button>
            <Button size="sm">
              Take Action
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InsightCardModal;