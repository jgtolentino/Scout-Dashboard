import { useState } from 'react';
import { usePowerBIDataStore } from '../store/powerBIDataStore';

/**
 * Enhanced data source toggle component with Power BI integration
 * Allows switching between simulated data, real-time API, and Power BI datasets
 */
function PowerBIDataToggle() {
  const { dataSource, setDataSource, lastRefreshed, refreshData } = usePowerBIDataStore();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Format last refreshed time
  const formatRefreshTime = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const refreshDate = new Date(date);
    const diffMs = now - refreshDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      return refreshDate.toLocaleString();
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      {/* Last refreshed indicator */}
      <div className="text-xs text-gray-500 hidden md:block">
        Last refreshed: {formatRefreshTime(lastRefreshed)}
      </div>
      
      {/* Refresh button */}
      <button
        className="p-1.5 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        onClick={refreshData}
        aria-label="Refresh data"
        title="Refresh data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
      {/* Data source toggle - Power BI styled */}
      <div className="relative inline-flex bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        {/* Simulated Data Option */}
        <button
          className={`px-3 py-1.5 text-sm font-medium border-r border-gray-300 
            ${dataSource === 'simulated' 
              ? 'bg-tbwa-yellow text-black' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setDataSource('simulated')}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Simulated
          </div>
        </button>
        
        {/* Real-time API Option */}
        <button
          className={`px-3 py-1.5 text-sm font-medium border-r border-gray-300
            ${dataSource === 'realtime' 
              ? 'bg-tbwa-yellow text-black' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setDataSource('realtime')}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Real-time
          </div>
        </button>
        
        {/* Power BI Option */}
        <button
          className={`px-3 py-1.5 text-sm font-medium relative
            ${dataSource === 'powerbi' 
              ? 'bg-tbwa-yellow text-black' 
              : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setDataSource('powerbi')}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
              <path d="M9 8v8M15 8v8M3 12h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Power BI
            
            {/* New badge for Power BI option */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tbwa-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tbwa-yellow"></span>
            </span>
          </div>
          
          {/* Tooltip for Power BI option */}
          {showTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap">
              <div className="arrow-up absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
              Connect to Power BI datasets
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default PowerBIDataToggle;