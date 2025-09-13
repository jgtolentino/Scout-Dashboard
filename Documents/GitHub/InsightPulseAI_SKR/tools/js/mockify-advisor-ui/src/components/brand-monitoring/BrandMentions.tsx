
import React from "react";
import { TypographyP } from "../Typography";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";

const mentionData = [
  { date: 'Jan', mentions: 1250, engagement: 2500 },
  { date: 'Feb', mentions: 1400, engagement: 2800 },
  { date: 'Mar', mentions: 1650, engagement: 3300 },
  { date: 'Apr', mentions: 1500, engagement: 3000 },
  { date: 'May', mentions: 1800, engagement: 3600 },
  { date: 'Jun', mentions: 2100, engagement: 4200 },
];

const BrandMentions: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="glass-panel p-5 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-tbwa-yellow" />
          <h4 className="font-medium">Brand Mentions & Engagement</h4>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-tbwa-darkBlue hover:text-tbwa-yellow hover:bg-transparent p-0 flex items-center gap-1"
        >
          <Download size={14} className="text-tbwa-darkBlue" />
          View details
        </Button>
      </div>
      <div className={`${isMobile ? 'h-48' : 'h-64'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mentionData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
            <YAxis fontSize={isMobile ? 10 : 12} />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-100 shadow-sm rounded-md">
                      <p className="text-sm font-medium">{`${label}`}</p>
                      <p className="text-sm">{`Mentions: ${payload[0].value}`}</p>
                      <p className="text-sm">{`Engagement: ${payload[1].value}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="mentions" stroke="#002B5B" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="engagement" stroke="#FFCC00" strokeWidth={2} dot={{ r: 4 }} />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3">
        <TypographyP className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          6-month trend showing 68% increase in brand mentions and 68% in engagement metrics.
        </TypographyP>
        
        <div className="flex justify-end mt-2">
          <Button 
            size="sm" 
            className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 text-xs"
          >
            Export Metrics
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrandMentions;
