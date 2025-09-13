
import React from "react";
import { cn } from "@/lib/utils";
import { TypographyP, TypographySmall } from "./Typography";

interface ImpactItem {
  level: "High" | "Medium" | "Low";
  count: number;
}

interface RecommendationPanelProps {
  totalCount: number;
  impactItems: ImpactItem[];
  resourceCount: number;
  className?: string;
}

const RecommendationPanel = ({
  totalCount,
  impactItems,
  resourceCount,
  className,
}: RecommendationPanelProps) => {
  // Get color based on impact level
  const getImpactColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-400";
      case "Low":
        return "bg-blue-400";
      default:
        return "bg-gray-400";
    }
  };

  // Get text color based on impact level
  const getImpactTextColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-red-700";
      case "Medium":
        return "text-orange-700";
      case "Low":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-xl font-medium mb-4">
        {totalCount} Recommendations
      </div>

      <div className="flex gap-2 mb-6">
        {/* Progress bar visualization */}
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
          {impactItems.map((item, idx) => (
            <div
              key={idx}
              className={cn(getImpactColor(item.level))}
              style={{
                width: `${(item.count / totalCount) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {impactItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="text-2xl font-bold">{item.count}</div>
            <div>
              <div className={cn("text-xs font-medium", getImpactTextColor(item.level))}>
                {item.level}
              </div>
              <TypographySmall className="text-gray-500">impact</TypographySmall>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{resourceCount}</span>
          <TypographyP className="text-gray-600">Impacted resources</TypographyP>
        </div>
      </div>
    </div>
  );
};

export default RecommendationPanel;
