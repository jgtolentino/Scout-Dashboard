
import React from "react";
import { TypographyH3, TypographyP } from "./Typography";
import { Radio, Download, BarChart3, ArrowRight } from "lucide-react";
import SentimentAnalysis from "./brand-monitoring/SentimentAnalysis";
import BrandMentions from "./brand-monitoring/BrandMentions";
import CompetitiveBenchmarking from "./brand-monitoring/CompetitiveBenchmarking";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";

interface BrandMonitoringProps {
  className?: string;
}

const BrandMonitoring: React.FC<BrandMonitoringProps> = ({ className }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Radio className="text-tbwa-yellow" size={20} />
          <TypographyH3>Brand Monitoring</TypographyH3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="bg-white border-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/10 flex items-center gap-1"
          >
            <Download size={16} />
            Download Report
          </Button>
          <Button 
            size={isMobile ? "sm" : "default"}
            className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 flex items-center gap-1"
          >
            Generate AI Recommendations
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SentimentAnalysis />
        <BrandMentions />
      </div>
      
      <CompetitiveBenchmarking />
      
      <div className="mt-6 text-center">
        <TypographyP className="text-sm text-gray-600">
          The AI-driven insights above are based on real-time market data analysis and brand performance metrics.
        </TypographyP>
        <div className="flex justify-center mt-2 opacity-70">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>© 2023</span>
            <span className="font-bold">TBWA\SMP</span>
            <span>Project Scout AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandMonitoring;
