import { AlertTriangle, TrendingUp, Info, Target, Zap, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

// Utility to generate natural language insights from brand data
function generateBrandInsight(brand: any, mockGrowth: number) {
  const pct = (num: number) => `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
  
  if (mockGrowth > 15) {
    return `🚀 ${brand.brand}: ₱${(brand.sales/1000).toFixed(0)}K sales (${pct(mockGrowth)}). Consider boosting visibility with endcap displays or digital offers.`;
  }
  if (mockGrowth < -10) {
    return `⚠️ ${brand.brand}: ₱${(brand.sales/1000).toFixed(0)}K (down ${pct(Math.abs(mockGrowth))}). Review store presence—consider flash promos or sampling to recapture attention.`;
  }
  if (mockGrowth > 5) {
    return `📈 ${brand.brand}: ₱${(brand.sales/1000).toFixed(0)}K (${pct(mockGrowth)}). Steady gains—maintain stock and monitor for expansion opportunities.`;
  }
  if (mockGrowth < -5) {
    return `📉 ${brand.brand}: ₱${(brand.sales/1000).toFixed(0)}K (${pct(mockGrowth)}). Keep an eye—possible emerging issue worth investigating.`;
  }
  return `🔄 ${brand.brand}: ₱${(brand.sales/1000).toFixed(0)}K (stable). Consistent performer holding market position.`;
}

export default function AIInsights() {
  const { aiInsights, brandData, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "error":
        return AlertTriangle;
      case "warning":
        return TrendingUp;
      case "info":
      default:
        return Info;
    }
  };

  const getInsightColors = (type: string) => {
    switch (type) {
      case "error":
        return {
          border: "border-l-red-500",
          bg: "bg-white",
          iconBg: "bg-red-500",
          buttonBg: "bg-red-500 hover:bg-red-600"
        };
      case "warning":
        return {
          border: "border-l-yellow-500",
          bg: "bg-white",
          iconBg: "bg-yellow-500",
          buttonBg: "bg-yellow-500 hover:bg-yellow-600"
        };
      case "info":
      default:
        return {
          border: "border-l-blue-600",
          bg: "bg-white",
          iconBg: "bg-blue-600",
          buttonBg: "bg-blue-600 hover:bg-blue-700"
        };
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200 mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">AI-Powered Insights</CardTitle>
        <div className="flex items-center gap-2">
          <span className="status-dot fresh"></span>
          <span className="text-sm text-muted-foreground">Updated 5 min ago</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights?.map((insight) => {
            const IconComponent = getInsightIcon(insight.type);
            const colors = getInsightColors(insight.type);
            
            return (
              <div
                key={insight.id}
                className={`border-l-4 ${colors.border} ${colors.bg} p-4 rounded-lg shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{insight.description}</p>
                    <Button 
                      size="sm"
                      className={`text-xs text-white px-3 py-1.5 rounded-md font-medium ${colors.buttonBg}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
