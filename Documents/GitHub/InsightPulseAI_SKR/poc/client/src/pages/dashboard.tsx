import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import TopBar from "@/components/dashboard/top-bar";
import KPICards from "@/components/dashboard/kpi-cards";
import TransactionTrends from "@/components/dashboard/transaction-trends";
import ProductMix from "@/components/dashboard/product-mix";
import GeospatialMap from "@/components/dashboard/geospatial-map";
import AIInsights from "@/components/dashboard/ai-insights";
import Footer from "@/components/dashboard/footer";

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: "Last 30 Days",
    location: "All Locations",
    brand: "All Brands",
    category: "All Categories"
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          onToggleSidebar={toggleSidebar}
          filters={filters}
          onUpdateFilter={updateFilter}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <KPICards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-1">
              <TransactionTrends />
            </div>
            
            <div className="lg:col-span-1">
              <ProductMix />
            </div>
            
            <div className="lg:col-span-1">
              <GeospatialMap />
            </div>
          </div>
          
          <AIInsights />
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
