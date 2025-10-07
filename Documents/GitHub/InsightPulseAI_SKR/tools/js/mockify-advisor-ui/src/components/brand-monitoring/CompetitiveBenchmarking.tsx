
import React from "react";
import { TypographyP } from "../Typography";
import { BarChart3, ArrowRight, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";

const competitorsData = [
  { name: 'Your Brand', mentions: 2100, sentiment: 85 },
  { name: 'Competitor A', mentions: 1850, sentiment: 72 },
  { name: 'Competitor B', mentions: 1500, sentiment: 65 },
  { name: 'Competitor C', mentions: 1100, sentiment: 60 },
];

const CompetitiveBenchmarking: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="glass-panel p-5 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-tbwa-yellow" />
          <h4 className="font-medium">Competitive Benchmarking</h4>
        </div>
        <div className="flex items-center gap-2">
          <select className={`${isMobile ? 'text-xs' : 'text-sm'} bg-white/50 border border-gray-200 rounded px-2 py-1`}>
            <option>Last Quarter</option>
            <option>Last Month</option>
            <option>Last Year</option>
          </select>
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-tbwa-darkBlue hover:text-tbwa-yellow p-0"
          >
            <Download size={isMobile ? 14 : 16} />
            {!isMobile && "Export"}
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className={`text-left py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Brand</th>
              <th className={`text-right py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Mentions</th>
              <th className={`text-right py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Sentiment Score</th>
              <th className={`text-right py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Market Position</th>
              <th className={`text-right py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {competitorsData.map((brand, index) => (
              <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${index === 0 ? 'bg-tbwa-yellow/10' : ''}`}>
                <td className={`py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>{brand.name}</td>
                <td className={`py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} text-right`}>{brand.mentions.toLocaleString()}</td>
                <td className={`py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} text-right`}>
                  <div className="flex items-center justify-end">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          brand.sentiment > 80 ? 'bg-green-500' : 
                          brand.sentiment > 70 ? 'bg-tbwa-darkBlue' : 
                          brand.sentiment > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${brand.sentiment}%` }}
                      ></div>
                    </div>
                    <span>{brand.sentiment}%</span>
                  </div>
                </td>
                <td className={`py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} text-right font-medium`}>
                  {index === 0 ? '#1 Leader' : `#${index + 1} Competitor`}
                </td>
                <td className={`py-3 px-4 ${isMobile ? 'text-xs' : 'text-sm'} text-right`}>
                  <span className={`px-2 py-1 rounded-full ${isMobile ? 'text-[10px]' : 'text-xs'} ${
                    index === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {index === 0 ? '+14.2%' : index === 1 ? '+5.8%' : index === 2 ? '+2.3%' : '-1.5%'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <TypographyP className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
          AI Insight: Your brand maintains market leadership with the strongest positive sentiment growth this quarter.
        </TypographyP>
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 text-xs"
          >
            Download Detailed Report
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="border-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/10 flex items-center gap-1 text-xs"
          >
            Adjust Strategy <ArrowRight size={14} />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 flex justify-center opacity-70">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Powered by</span>
          <span className="font-bold">TBWA\SMP</span>
          <span>Project Scout AI</span>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveBenchmarking;
