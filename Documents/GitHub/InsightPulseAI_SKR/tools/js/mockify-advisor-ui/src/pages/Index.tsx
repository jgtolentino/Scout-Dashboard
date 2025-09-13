import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDelayedRender, useStaggeredChildren, useSmoothEntrance } from "@/lib/animation";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import ScoreCard from "@/components/ScoreCard";
import RecommendationPanel from "@/components/RecommendationPanel";
import StatusBadge from "@/components/StatusBadge";
import { TypographyH2, TypographyP } from "@/components/Typography";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { 
  Check, CreditCard, AlertCircle, Shield, BarChart3, 
  Activity, Sparkles, Bell, Search, TrendingUp, Calendar,
  ArrowUpRight, Brain, Lightbulb, ChevronRight, Building2, Radio, Download, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Filter {
  id: string;
  label: string;
  value: string;
}

const costTrendData = [
  { name: 'Jan', value: 3400 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 3200 },
  { name: 'Apr', value: 4000 },
  { name: 'May', value: 3700 },
  { name: 'Jun', value: 3500 },
];

const securityRisksData = [
  { name: 'High', value: 4, fill: '#E81123' },
  { name: 'Medium', value: 9, fill: '#FF8C00' },
  { name: 'Low', value: 4, fill: '#0078D4' },
];

const reliabilityData = [
  { name: 'Mon', uptime: 99.8 },
  { name: 'Tue', uptime: 100 },
  { name: 'Wed', uptime: 99.9 },
  { name: 'Thu', uptime: 100 },
  { name: 'Fri', uptime: 100 },
  { name: 'Sat', uptime: 100 },
  { name: 'Sun', uptime: 99.9 },
];

const COLORS = ['#E81123', '#FF8C00', '#0078D4', '#107C10'];

const Index = () => {
  const [filters, setFilters] = useState<Filter[]>([
    { id: '1', label: 'Organization', value: 'TBWA-ProjectScout-Prod' },
    { id: '2', label: 'Recommendation Status', value: 'Active' },
    { id: '3', label: 'Resource Group', value: 'All' },
    { id: '4', label: 'Type', value: 'All' },
  ]);

  const [activeInsight, setActiveInsight] = useState(0);
  const isMobile = window.innerWidth < 768;

  const handleRemoveFilter = (id: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== id));
  };

  const isRendered = useDelayedRender(300);
  const { isVisible } = useStaggeredChildren(7, 300, 150);
  const fadeInStyle = useSmoothEntrance(500);

  const aiInsights = [
    {
      title: "Brand Sentiment Shift Detected",
      description: "Positive sentiment has increased by 18% in the last 2 weeks, correlating with your latest campaign launch.",
      impact: "High",
      category: "brand"
    },
    {
      title: "Sari-Sari Store Sales Opportunity",
      description: "AI analysis shows 12% potential revenue increase if Product A is featured prominently in store displays.",
      impact: "Medium",
      category: "retail"
    },
    {
      title: "Competitor Activity Alert",
      description: "Competitor B has increased social media engagement by 22% in your core demographic over the past month.",
      impact: "Medium",
      category: "competition"
    }
  ];

  return (
    <div className="min-h-screen bg-azure-background text-foreground flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-tbwa-yellow/15 rounded-full p-2">
              <Brain size={24} className="text-tbwa-darkBlue" />
            </div>
            <TypographyH2 className="text-gray-800 text-xl sm:text-2xl">TBWA Project Scout AI | Dashboard</TypographyH2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-azure-gray" />
              </div>
              <input 
                type="text"
                placeholder="Search insights..."
                className="pl-10 pr-4 py-2 rounded-md border border-azure-grayLight/30 bg-white focus:outline-none focus:ring-2 focus:ring-tbwa-yellow/30 text-sm"
              />
            </div>
            <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
              <Calendar size={16} />
              Last 30 Days
            </Button>
            <Button variant="outline" size={isMobile ? "sm" : "default"}>Feedback</Button>
            <div className="flex gap-2">
              <Link to="/advisor">
                <Button className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 flex items-center gap-2">
                  <Lightbulb size={16} />
                  Advisor
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  Analytics
                </Button>
              </Link>
              <Link to="/insight-test" className="ml-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Lightbulb size={16} />
                  Insight Test
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div 
          className="mb-8 glass-panel px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-l-4 border-tbwa-yellow animate-fade-in gap-3"
          style={fadeInStyle}
        >
          <div className="flex items-center gap-3">
            <div className="bg-tbwa-yellow/15 p-2 rounded-full">
              <Sparkles size={20} className="text-tbwa-darkBlue" />
            </div>
            <div>
              <h4 className="font-medium">TBWA Project Scout AI Insights</h4>
              <p className="text-sm text-azure-gray">
                Our AI has identified {aiInsights.length} new insights that can directly impact your brand performance
              </p>
            </div>
          </div>
          <Button className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 flex items-center gap-2">
            <Lightbulb size={16} />
            View All AI Insights
          </Button>
        </div>

        <FilterBar 
          filters={filters} 
          onRemoveFilter={handleRemoveFilter} 
          className="mb-8"
        />

        {isRendered && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <ScoreCard
              title="Brand Performance"
              score={92}
              icon={<Radio size={22} className="text-blue-600" />}
              color="blue"
              message="Brand visibility optimized with 92% effectiveness"
              className={isVisible(0) ? "opacity-100" : "opacity-0"}
            />
            <ScoreCard
              title="Competitor Analysis"
              score={68}
              icon={<Shield size={22} className="text-amber-600" />}
              color="orange"
              recommendations={12}
              className={`transition-opacity duration-500 ${isVisible(1) ? "opacity-100" : "opacity-0"}`}
            />
            <ScoreCard
              title="Retail Performance"
              score={100}
              icon={<Building2 size={22} className="text-emerald-600" />}
              color="green"
              recommendations={3}
              className={`transition-opacity duration-500 ${isVisible(2) ? "opacity-100" : "opacity-0"}`}
            />
            <ScoreCard
              title="Marketing ROI"
              score={100}
              icon={<BarChart3 size={22} className="text-emerald-600" />}
              color="green"
              message="All marketing efficiency recommendations implemented"
              className={`transition-opacity duration-500 ${isVisible(3) ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        )}

        <div className={`mb-10 transition-opacity duration-500 ${isVisible(4) ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lightbulb size={18} className="text-tbwa-yellow" />
              AI-Powered Brand Insights
            </h3>
            <button className="text-sm text-tbwa-darkBlue hover:underline flex items-center">
              View all insights <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => (
              <div 
                key={index}
                className={`glass-panel p-4 border-l-4 ${
                  insight.impact === 'High' ? 'border-azure-red' : 
                  insight.impact === 'Medium' ? 'border-azure-orange' : 'border-azure-blue'
                } cursor-pointer hover:shadow-elevation-2 transition-all duration-300`}
                onClick={() => setActiveInsight(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <StatusBadge 
                    label={insight.impact} 
                    status={insight.impact === 'High' ? 'error' : insight.impact === 'Medium' ? 'warning' : 'active'} 
                    pulse={insight.impact === 'High'}
                  />
                </div>
                <p className="text-sm text-azure-gray mb-3">{insight.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-azure-gray">Generated by TBWA Project Scout AI</span>
                  <button className="text-xs text-tbwa-darkBlue hover:underline flex items-center gap-1">
                    Take action <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className={`bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-6 transition-all duration-500 ${isVisible(5) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-medium">Marketing Spend Analysis</h3>
              <Button variant="ghost" size="sm" className="text-tbwa-darkBlue hover:text-tbwa-darkBlue/80 hover:bg-tbwa-yellow/10 p-0">
                View details
              </Button>
            </div>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costTrendData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#002B5B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-azure-gray">Monthly budget:</span>
                <span className="font-medium">₱3,466,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-azure-gray">Projected ROI:</span>
                <span className="font-medium text-emerald-600">+18.4%</span>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-6 transition-all duration-500 ${isVisible(6) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-medium">Market Risks</h3>
              <Button variant="ghost" size="sm" className="text-tbwa-darkBlue hover:text-tbwa-darkBlue/80 hover:bg-tbwa-yellow/10 p-0">
                View details
              </Button>
            </div>
            <div className="h-52 sm:h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={securityRisksData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {securityRisksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-xs">High: 4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-xs">Medium: 9</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-xs">Low: 4</span>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-lg border border-gray-100 shadow-sm p-4 sm:p-6 transition-all duration-500 ${isVisible(6) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-medium">Brand Performance Metrics</h3>
              <Button variant="ghost" size="sm" className="text-tbwa-darkBlue hover:text-tbwa-darkBlue/80 hover:bg-tbwa-yellow/10 p-0">
                View details
              </Button>
            </div>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reliabilityData}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[99, 100]} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="uptime" stroke="#002B5B" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-azure-gray">Brand visibility:</span>
                <span className="font-medium text-emerald-600">99.94%</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`glass-panel rounded-lg p-4 sm:p-6 transition-all duration-500 ${isVisible(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-tbwa-yellow/15 p-2 rounded-full">
              <Activity className="h-5 w-5 text-tbwa-darkBlue" />
            </div>
            <h3 className="text-lg font-medium">TBWA Project Scout AI Assistant</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-tbwa-darkBlue mt-0.5" />
              <TypographyP className="text-sm">
                I've analyzed your market data and identified 3 significant opportunities to boost your brand performance. Would you like me to create a prioritized action plan?
              </TypographyP>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-tbwa-darkBlue mt-0.5" />
              <TypographyP className="text-sm">
                Based on current market trends, I recommend focusing on Product A promotion in sari-sari stores to improve sales performance by approximately 12%.
              </TypographyP>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button className="bg-tbwa-yellow text-tbwa-darkBlue hover:bg-tbwa-yellow/90 flex items-center gap-2">
                <Sparkles size={16} />
                Generate AI Recommendations
              </Button>
              <Link to="/advisor">
                <Button variant="outline" className="text-tbwa-darkBlue border-tbwa-yellow hover:bg-tbwa-yellow/10 flex items-center gap-2">
                  <Lightbulb size={16} />
                  Open Advisor Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
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
      </main>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-sm rounded-md">
        <p className="text-sm font-medium">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default Index;
