import React, { useState, useCallback } from 'react';
import { useKeyboardAction } from '@/utils/keyboard-a11y';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LightbulbIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ExternalLinkIcon,
  EyeIcon,
  BrainCircuitIcon
} from "lucide-react";
import { InsightCardModal } from "./InsightCardModal";
import { AssistantPanel } from "./AssistantPanel";
import { InsightData } from "@/types/advisor";

interface InsightCardProps {
  id?: string;
  title: string;
  summary: string;
  confidence: number;
  date: string;
  category: string;
  impact?: string; 
  recommendations?: string[];
  dataPoints?: { label: string; value: string }[];
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  details?: string;
}

export function InsightCard({
  id = "insight-" + Math.floor(Math.random() * 10000),
  title,
  summary,
  confidence,
  date,
  category,
  impact = "This insight could significantly affect business operations and requires attention.",
  recommendations = [],
  dataPoints = [],
  actions = [],
  details = ""
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Confidence level color
  const getConfidenceColor = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-blue-500";
    if (level >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  // Prepare full insight object for modal
  const insightData = {
    id,
    title,
    summary,
    details: details || summary,
    confidence,
    date,
    category,
    impact: impact,
    recommendations: recommendations.length ? recommendations : [
      "Review the underlying data sources for this insight",
      "Consider how this insight affects your current business strategy",
      "Share this insight with relevant stakeholders for further action"
    ],
    dataPoints: dataPoints.length ? dataPoints : [
      { label: "Source", value: "Retail Analytics Pipeline" },
      { label: "Detection Method", value: "Anomaly Detection + Pattern Recognition" },
      { label: "Time Period", value: "Last 30 days" }
    ]
  };

  return (
    <>
      <Card 
      className="hover-card cursor-pointer focus-ring" 
      onClick={() => setModalOpen(true)}
      onKeyDown={useKeyboardAction(() => setModalOpen(true))}
      tabIndex={0}
      role="button"
      aria-label={`View details for insight: ${title}`}
    >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LightbulbIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
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
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="p-0 h-8 text-primary flex items-center gap-1 hover-scale focus-ring"
              >
                {expanded ? (
                  <>Less Details <ChevronUpIcon className="h-4 w-4" aria-hidden="true" /></>
                ) : (
                  <>More Details <ChevronDownIcon className="h-4 w-4" aria-hidden="true" /></>
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
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
            >
              <EyeIcon className="h-3 w-3" aria-hidden="true" /> <span>View Details</span>
            </Button>
            
            {/* GPT Action Plan button */}
            <AssistantPanel 
              insightId={id} 
              insightTitle={title}
              insight={insightData}
            >
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => e.stopPropagation()}
                className="text-xs flex items-center gap-1 hover-button focus-ring"
                aria-label="Get AI-generated action plan"
                title="Get AI-generated action plan"
              >
                <BrainCircuitIcon className="h-3 w-3" aria-hidden="true" /> <span>Get Action Plan</span>
              </Button>
            </AssistantPanel>
            
            {/* Additional action buttons */}
            {actions.length > 0 && actions.map((action, i) => (
              <Button 
                key={i} 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="text-xs"
              >
                <span>{action.label}</span> <ExternalLinkIcon className="h-3 w-3 ml-1" aria-hidden="true" />
              </Button>
            ))}
          </div>
        </CardFooter>
      </Card>
      
      <InsightCardModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        insight={insightData}
      />
    </>
  );
}