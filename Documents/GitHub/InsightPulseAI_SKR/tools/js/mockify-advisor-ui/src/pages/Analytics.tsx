
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { TypographyH2 } from "@/components/Typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Building2, Radio, Download, Share2 } from "lucide-react";
import StoreAnalytics from "@/components/StoreAnalytics";
import BrandMonitoring from "@/components/BrandMonitoring";
import { useDelayedRender, useSmoothEntrance } from "@/lib/animation";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("store-analytics");
  const isRendered = useDelayedRender(300);
  const fadeInStyle = useSmoothEntrance(500);

  return (
    <div className="min-h-screen bg-azure-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-azure-blue/10 rounded-full p-2">
              <Brain size={24} className="text-azure-blue" />
            </div>
            <TypographyH2 className="text-gray-800">TBWA Project Scout AI | Analytics</TypographyH2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="btn-ghost-azure flex items-center gap-2">
              <Download size={16} />
              Export Report
            </button>
            <button className="btn-ghost-azure flex items-center gap-2">
              <Share2 size={16} />
              Share
            </button>
            <button className="btn-primary-azure">Generate AI Insights</button>
          </div>
        </div>
        
        {isRendered && (
          <div className="mb-8" style={fadeInStyle}>
            <Tabs defaultValue="store-analytics" onValueChange={setActiveTab} className="w-full">
              <div className="border-b mb-6">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger 
                    value="store-analytics" 
                    className="flex items-center gap-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-azure-blue rounded-none h-12"
                  >
                    <Building2 size={18} />
                    <span>Store Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="brand-monitoring" 
                    className="flex items-center gap-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-azure-blue rounded-none h-12"
                  >
                    <Radio size={18} />
                    <span>Brand Monitoring</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="store-analytics" className="mt-0">
                <StoreAnalytics />
              </TabsContent>
              
              <TabsContent value="brand-monitoring" className="mt-0">
                <BrandMonitoring />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
