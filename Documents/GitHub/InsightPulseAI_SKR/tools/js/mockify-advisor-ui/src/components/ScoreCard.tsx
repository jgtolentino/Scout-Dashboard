
import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { TypographyH4, TypographyP, TypographySmall } from "./Typography";

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  message?: string;
  recommendations?: number;
  className?: string;
}

const ScoreCard = ({ 
  title, 
  score, 
  icon, 
  color,
  message,
  recommendations = 0,
  className 
}: ScoreCardProps) => {
  // Calculate the background color with dynamic transparency
  const getBgColor = () => {
    switch (color) {
      case "green": return "bg-emerald-50 border-emerald-100";
      case "blue": return "bg-blue-50 border-blue-100";
      case "orange": return "bg-amber-50 border-amber-100";
      case "red": return "bg-red-50 border-red-100";
      default: return "bg-gray-50 border-gray-100";
    }
  };

  // Calculate the score color
  const getScoreColor = () => {
    switch (color) {
      case "green": return "text-emerald-600";
      case "blue": return "text-azure-blue";
      case "orange": return "text-amber-600";
      case "red": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getScoreBarColor = () => {
    switch (color) {
      case "green": return "bg-emerald-500";
      case "blue": return "bg-azure-blue";
      case "orange": return "bg-amber-500";
      case "red": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm card-transition animate-fade-in",
      getBgColor(),
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <TypographyH4>{title}</TypographyH4>
        </div>
        <div className="flex flex-col items-end">
          <div className={cn("text-2xl font-bold", getScoreColor())}>
            {score}<span className="text-sm font-normal">%</span>
          </div>
          <div className="text-xs text-gray-500">Score</div>
        </div>
      </div>

      {message && (
        <div className="flex items-start gap-2 mt-4 mb-2">
          <Check size={18} className="text-emerald-500 mt-0.5" />
          <TypographyP className="text-sm text-gray-700">{message}</TypographyP>
        </div>
      )}

      {recommendations > 0 && (
        <div className="mt-4">
          <TypographySmall className="text-gray-700">{recommendations} Recommendations</TypographySmall>
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
        <div 
          className={cn("h-full", getScoreBarColor())} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreCard;
