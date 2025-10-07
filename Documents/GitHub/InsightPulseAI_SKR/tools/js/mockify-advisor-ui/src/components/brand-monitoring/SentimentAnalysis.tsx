
import React from "react";
import { TypographyP } from "../Typography";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { MessageSquare, Download, ArrowRight } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

const sentimentData = [
  { name: 'Positive', value: 65, color: '#4CAF50' },
  { name: 'Neutral', value: 25, color: '#002B5B' },
  { name: 'Negative', value: 10, color: '#E63946' }
];

const SentimentAnalysis: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="glass-panel p-5 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-tbwa-yellow" />
          <h4 className="font-medium">Sentiment Analysis</h4>
        </div>
        <StatusBadge label="Positive Trend" status="success" />
      </div>
      <div className={`${isMobile ? 'h-48' : 'h-64'} flex items-center`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 60 : 80}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              formatter={(value, entry, index) => (
                <span className="text-xs font-medium">{value}</span>
              )}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-100 shadow-sm rounded-md">
                      <p className="text-sm font-medium">{`${payload[0].name}`}</p>
                      <p className="text-sm">{`${payload[0].value}%`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3">
        <TypographyP className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          AI Analysis: Brand sentiment has improved by 12% compared to previous quarter, with significant growth in positive mentions.
        </TypographyP>
        
        <div className="flex justify-between mt-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-tbwa-darkBlue border-tbwa-yellow hover:bg-tbwa-yellow/10 text-xs flex items-center gap-1"
          >
            <Download size={14} />
            Download Report
          </Button>
          <Button 
            size="sm" 
            className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 text-xs flex items-center gap-1"
          >
            Apply AI Insight
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex justify-center opacity-70">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Powered by</span>
          <span className="font-bold">TBWA\Project Scout AI</span>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
