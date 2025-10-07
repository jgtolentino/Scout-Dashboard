import { useState, useEffect } from 'react';
import PowerBIToolbar from './PowerBIToolbar';
import PowerBIFilterPane from './PowerBIFilterPane';
import ChartGrid from './ChartGrid';
import { usePowerBIDataStore } from '../store/powerBIDataStore';
import powerBITheme from '../styles/powerbi-theme';

/**
 * Power BI Dashboard component
 * Integrates all Power BI specific components and functionality
 */
function PowerBIDashboard() {
  const { 
    dataSource, 
    isLoading, 
    data, 
    error,
    viewState,
    embeddedReport,
    setEmbeddedReport,
    toggleChartFocus
  } = usePowerBIDataStore();
  
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Check if this is first time viewing
  useEffect(() => {
    const hasViewedDashboard = localStorage.getItem('hasViewedPowerBIDashboard');
    if (hasViewedDashboard) {
      setShowWelcomeScreen(false);
    } else {
      // Auto-dismiss welcome screen after 5 seconds
      const timer = setTimeout(() => {
        setShowWelcomeScreen(false);
        localStorage.setItem('hasViewedPowerBIDashboard', 'true');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Welcome screen component
  const WelcomeScreen = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Welcome to TBWA Power BI Dashboard</h2>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={() => {
              setShowWelcomeScreen(false);
              localStorage.setItem('hasViewedPowerBIDashboard', 'true');
            }}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-4">
            This dashboard provides powerful analytics with the following features:
          </p>
          
          <ul className="space-y-2 text-sm text-gray-600 mb-4">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-tbwa-yellow mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Real-time data integration with Power BI datasets</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-tbwa-yellow mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Advanced filtering and slicing capabilities</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-tbwa-yellow mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Interactive visualizations with drill-down support</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-tbwa-yellow mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Export data in multiple formats including Power BI</span>
            </li>
          </ul>
          
          <button
            className="w-full py-2 bg-tbwa-yellow hover:bg-tbwa-yellow-hover text-black font-medium rounded-md"
            onClick={() => {
              setShowWelcomeScreen(false);
              localStorage.setItem('hasViewedPowerBIDashboard', 'true');
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
  
  // Error display component
  const ErrorDisplay = ({ message }) => (
    <div className="powerbi-empty-state">
      <svg className="powerbi-empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading Dashboard</h3>
      <p className="powerbi-empty-state-text">
        {message || 'There was a problem loading the dashboard. Please try again later.'}
      </p>
      <button 
        className="mt-4 px-4 py-2 bg-tbwa-yellow text-black rounded-md"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
  
  // Loading display component
  const LoadingDisplay = () => (
    <div className="powerbi-loading">
      <div className="powerbi-loading-spinner"></div>
      <p className="mt-4 text-sm text-gray-500">Loading dashboard data...</p>
    </div>
  );
  
  // Tabs navigation
  const tabs = [
    { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'sales', label: 'Sales Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'customers', label: 'Customer Insights', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'products', label: 'Product Performance', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Welcome screen */}
      {showWelcomeScreen && <WelcomeScreen />}
      
      {/* Main toolbar */}
      <PowerBIToolbar />
      
      {/* Tabs navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-tbwa-yellow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                  </svg>
                  {tab.label}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main content area with filter pane */}
      <div className="flex-1 flex">
        {/* Filter pane */}
        <PowerBIFilterPane />
        
        {/* Dashboard content */}
        <main className="flex-1 pl-0 md:pl-72 transition-all duration-300 ease-in-out">
          <div className="container mx-auto px-4 py-6">
            {/* Dashboard title */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">TBWA Retail Advisor Dashboard</h1>
              <p className="text-sm text-gray-500">
                {activeTab === 'home' && 'Overview of key performance metrics and business insights'}
                {activeTab === 'sales' && 'Detailed sales performance analysis by region and category'}
                {activeTab === 'customers' && 'Customer segmentation and behavior analytics'}
                {activeTab === 'products' && 'Product performance and inventory insights'}
              </p>
            </div>
            
            {/* Dashboard content based on state */}
            {error ? (
              <ErrorDisplay message={error} />
            ) : isLoading ? (
              <LoadingDisplay />
            ) : (
              <>
                {/* Content varies based on active tab */}
                {activeTab === 'home' && (
                  <ChartGrid />
                )}
                {activeTab === 'sales' && (
                  <div className="space-y-6">
                    <div className="powerbi-card">
                      <div className="powerbi-card-header">
                        <h3 className="powerbi-card-title">Sales Performance by Region</h3>
                        <button className="focus-button" onClick={() => toggleChartFocus('salesByRegionExtended')}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>
                      <div className="powerbi-card-body h-64">
                        {/* Extended sales by region chart would go here */}
                        <div className="h-full flex items-center justify-center text-gray-500">
                          Extended sales chart would render here with more details
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Sales Growth Trend</h3>
                        </div>
                        <div className="powerbi-card-body h-64">
                          {/* Growth trend chart would go here */}
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Growth trend chart would render here
                          </div>
                        </div>
                      </div>
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Sales by Channel</h3>
                        </div>
                        <div className="powerbi-card-body h-64">
                          {/* Sales by channel chart would go here */}
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Sales by channel chart would render here
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'customers' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Customer Count</h3>
                        </div>
                        <div className="powerbi-card-body h-32">
                          <div className="powerbi-kpi">
                            <div className="powerbi-kpi-value">
                              {data?.kpis?.customerCount?.toLocaleString() || '0'}
                            </div>
                            <div className="powerbi-kpi-label">Active Customers</div>
                            <div className="powerbi-kpi-trend positive">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              8.2% vs last period
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Repeat Purchase Rate</h3>
                        </div>
                        <div className="powerbi-card-body h-32">
                          <div className="powerbi-kpi">
                            <div className="powerbi-kpi-value">
                              34.8%
                            </div>
                            <div className="powerbi-kpi-label">Returning Customers</div>
                            <div className="powerbi-kpi-trend positive">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              2.5% vs last period
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Customer Lifetime Value</h3>
                        </div>
                        <div className="powerbi-card-body h-32">
                          <div className="powerbi-kpi">
                            <div className="powerbi-kpi-value">
                              $865
                            </div>
                            <div className="powerbi-kpi-label">Average LTV</div>
                            <div className="powerbi-kpi-trend positive">
                              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              12.3% vs last period
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="powerbi-card">
                      <div className="powerbi-card-header">
                        <h3 className="powerbi-card-title">Customer Segmentation</h3>
                      </div>
                      <div className="powerbi-card-body h-64">
                        {/* Customer segmentation chart would go here */}
                        <div className="h-full flex items-center justify-center text-gray-500">
                          Customer segmentation chart would render here
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    <div className="powerbi-card">
                      <div className="powerbi-card-header">
                        <h3 className="powerbi-card-title">Top Selling Products</h3>
                      </div>
                      <div className="powerbi-card-body h-64">
                        {/* Top products table would go here */}
                        <div className="h-full flex items-center justify-center text-gray-500">
                          Top products table would render here
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Product Category Mix</h3>
                        </div>
                        <div className="powerbi-card-body h-64">
                          {/* Product mix chart would go here */}
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Product mix chart would render here
                          </div>
                        </div>
                      </div>
                      <div className="powerbi-card">
                        <div className="powerbi-card-header">
                          <h3 className="powerbi-card-title">Inventory Status</h3>
                        </div>
                        <div className="powerbi-card-body h-64">
                          {/* Inventory status chart would go here */}
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Inventory status chart would render here
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4 pl-0 md:pl-72 transition-all duration-300 ease-in-out">
        <div className="container mx-auto px-4 text-sm text-gray-500">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <p>Data source: {dataSource === 'simulated' ? 'Simulated Data' : dataSource === 'powerbi' ? 'Power BI Dataset' : 'Real-time API'}</p>
              <p>© 2025 TBWA\Retail. All rights reserved.</p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="powerbi-alert powerbi-alert-info">Version 2.2.0</span>
              <button className="ml-2 text-gray-500 hover:text-gray-700 text-xs">
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PowerBIDashboard;