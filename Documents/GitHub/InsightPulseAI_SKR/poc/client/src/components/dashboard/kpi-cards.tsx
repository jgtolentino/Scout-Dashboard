import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Repeat, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function KPICards() {
  const { kpiMetrics, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpiMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Unable to load KPI metrics
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Transactions",
      value: kpiMetrics.transactions.toLocaleString(),
      change: "+3.2%",
      changeType: "positive" as const,
      icon: ShoppingCart,
      accentColor: "border-l-blue-600",
      iconBg: "bg-blue-600",
      iconColor: "text-white"
    },
    {
      title: "Avg Value",
      value: `₱${kpiMetrics.avgValue.toLocaleString()}`,
      change: "+1.8%",
      changeType: "positive" as const,
      icon: () => (
        <div className="w-6 h-6 flex items-center justify-center text-gray-900 font-bold text-lg">
          ₱
        </div>
      ),
      accentColor: "border-l-yellow-500",
      iconBg: "bg-yellow-500",
      iconColor: "text-gray-900"
    },
    {
      title: "Substitution Rate",
      value: `${kpiMetrics.substitutionRate}%`,
      change: "-0.5%",
      changeType: "negative" as const,
      icon: Repeat,
      accentColor: "border-l-red-500",
      iconBg: "bg-red-500",
      iconColor: "text-white"
    },
    {
      title: "Data Freshness",
      value: `${kpiMetrics.dataFreshness}%`,
      status: "Real-time",
      icon: RefreshCw,
      accentColor: "border-l-green-600",
      iconBg: "bg-green-600",
      iconColor: "text-white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {kpiCards.map((card, index) => (
        <Card key={index} className={`bg-white rounded-xl shadow-lg border-l-4 ${card.accentColor} border-t-0 border-r-0 border-b-0 min-h-[140px] flex flex-col`}>
          <CardContent className="p-4 md:p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-start">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${card.iconBg} rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0`}>
                <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1 truncate">{card.title}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 break-words leading-tight">{card.value}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {card.change && (
                    <>
                      {card.changeType === "positive" ? (
                        <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${card.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                        {card.change}
                      </span>
                    </>
                  )}
                  {card.status && (
                    <>
                      <span className="status-dot fresh"></span>
                      <span className="text-xs text-green-600 font-medium">{card.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {card.title === "Data Freshness" && (
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                Last updated: 2 min ago
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
