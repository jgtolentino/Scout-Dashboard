import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import useDataStore from '@/store/dataStore';
import TransactionTrends from '@/components/dashboards/TransactionTrends';
import ProductMixSKU from '@/components/dashboards/ProductMixSKU';
import ConsumerBehavior from '@/components/dashboards/ConsumerBehavior';
import ConsumerProfiling from '@/components/dashboards/ConsumerProfiling';
import DashboardOverview from '@/components/dashboards/DashboardOverview';
import CompetitiveAnalysis from '@/components/dashboards/CompetitiveAnalysis';
import GeographicAnalysis from '@/components/dashboards/GeographicAnalysis';
import DataManager from '@/components/DataManager';
import AssistantPanel from '@/components/AssistantPanel';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  UserCheck,
  Database,
  ChevronLeft,
  ChevronRight,
  Bot,
  Filter,
  Circle,
  BarChart3,
  Target,
  MapPin
} from 'lucide-react';

type View = 'overview' | 'transactions' | 'products' | 'behavior' | 'profiling' | 'competitive' | 'geographic' | 'data';

interface GlobalFilters {
  dateRange: string;
  region: string;
  category: string;
  brand: string;
  timeOfDay: string;
  dayType: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const { initializeSampleData, datasets } = useDataStore();
  
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: 'L30D',
    region: 'all',
    category: 'all',
    brand: 'all',
    timeOfDay: 'all',
    dayType: 'all'
  });

  // Connection status (simulated for now)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');

  useEffect(() => {
    // Initialize with sample data if no datasets exist
    if (datasets.length === 0) {
      initializeSampleData();
    }
  }, []);

  const updateFilter = (key: keyof GlobalFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const navigationItems = [
    { 
      id: 'overview' as View, 
      label: 'Executive Overview', 
      icon: BarChart3,
      description: 'KPIs & executive insights'
    },
    { 
      id: 'transactions' as View, 
      label: 'Transaction Trends', 
      icon: TrendingUp,
      description: 'Volume, value & timing patterns'
    },
    { 
      id: 'products' as View, 
      label: 'Product Mix & SKU', 
      icon: ShoppingBag,
      description: 'Category & brand breakdown'
    },
    { 
      id: 'behavior' as View, 
      label: 'Consumer Behavior', 
      icon: Users,
      description: 'Purchase patterns & decisions'
    },
    { 
      id: 'profiling' as View, 
      label: 'Consumer Profiling', 
      icon: UserCheck,
      description: 'Demographics & location'
    },
    { 
      id: 'competitive' as View, 
      label: 'Competitive Analysis', 
      icon: Target,
      description: 'Brand performance & market share'
    },
    { 
      id: 'geographic' as View, 
      label: 'Geographic Intelligence', 
      icon: MapPin,
      description: 'Regional performance & maps'
    },
    { 
      id: 'data' as View, 
      label: 'Data Management', 
      icon: Database,
      description: 'Import & manage datasets'
    },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <DashboardOverview filters={filters} />;
      case 'transactions':
        return <TransactionTrends filters={filters} />;
      case 'products':
        return <ProductMixSKU filters={filters} />;
      case 'behavior':
        return <ConsumerBehavior filters={filters} />;
      case 'profiling':
        return <ConsumerProfiling filters={filters} />;
      case 'competitive':
        return <CompetitiveAnalysis filters={filters} />;
      case 'geographic':
        return <GeographicAnalysis filters={filters} />;
      case 'data':
        return <DataManager />;
      default:
        return <DashboardOverview filters={filters} />;
    }
  };

  const dateRanges = [
    { value: 'L7D', label: 'Last 7 days' },
    { value: 'L30D', label: 'Last 30 days' },
    { value: 'L90D', label: 'Last 90 days' },
    { value: 'YTD', label: 'Year to date' }
  ];

  const regions = [
    { value: 'all', label: 'All Regions' },
    { value: 'ncr', label: 'NCR' },
    { value: 'region3', label: 'Region III' },
    { value: 'region4a', label: 'Region IV-A' },
    { value: 'region7', label: 'Region VII' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'personal-care', label: 'Personal Care' },
    { value: 'household', label: 'Household' },
    { value: 'tobacco', label: 'Tobacco' }
  ];

  const timeOptions = [
    { value: 'all', label: 'All Day' },
    { value: 'morning', label: 'Morning (6AM-12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
    { value: 'evening', label: 'Evening (6PM-10PM)' }
  ];

  const dayTypes = [
    { value: 'all', label: 'All Days' },
    { value: 'weekday', label: 'Weekdays' },
    { value: 'weekend', label: 'Weekends' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          {!collapsed ? (
            <>
              <h1 className="text-2xl font-bold text-dashboard-600">Scout</h1>
              <p className="text-sm text-gray-500 mt-1">Business Intelligence</p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-dashboard-600 text-center">S</h1>
          )}
        </div>
        
        {/* Collapse Button */}
        <div className="px-4 py-2 border-b border-gray-200">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 transition-all duration-200
                  ${isActive 
                    ? 'bg-dashboard-50 text-dashboard-600 border-r-3 border-dashboard-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-dashboard-600' : 'text-gray-500'} />
                {!collapsed && (
                  <div className="text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <p className="text-xs text-gray-400 text-center">
              Powered by React & Local Storage
            </p>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Global Filters */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Filters Section */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Connection Status */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                <Circle size={8} className="fill-green-500 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'error' ? 'Disconnected' : 'Connecting...'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Global Filters:</span>
              </div>
              
              {/* Date Range */}
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
              
              {/* Region */}
              <select
                value={filters.region}
                onChange={(e) => updateFilter('region', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500"
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </select>
              
              {/* Category */}
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              
              {/* Time of Day */}
              <select
                value={filters.timeOfDay}
                onChange={(e) => updateFilter('timeOfDay', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500"
              >
                {timeOptions.map(time => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
              
              {/* Day Type */}
              <select
                value={filters.dayType}
                onChange={(e) => updateFilter('dayType', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dashboard-500"
              >
                {dayTypes.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
            
            {/* AI Assistant Button */}
            <button 
              onClick={() => setAssistantVisible(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bot size={18} className="text-dashboard-600" />
              <span className="text-sm font-medium">AI Assistant</span>
            </button>
          </div>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {renderView()}
        </main>
      </div>
      
      {/* AI Assistant Panel */}
      {assistantVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="w-96 bg-white h-full shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Assistant</h3>
              <button 
                onClick={() => setAssistantVisible(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistantPanel filters={filters} currentView={currentView} />
            </div>
          </div>
        </div>
      )}
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;