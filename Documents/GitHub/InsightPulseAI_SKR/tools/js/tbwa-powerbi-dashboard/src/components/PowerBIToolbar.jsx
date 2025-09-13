import { useState, useRef, useEffect } from 'react';
import { usePowerBIDataStore } from '../store/powerBIDataStore';
import PowerBIDataToggle from './PowerBIDataToggle';

/**
 * Power BI style toolbar with common dashboard actions
 * Includes export, view options, data refresh, and filter controls
 */
function PowerBIToolbar() {
  const {
    exportData,
    viewState,
    toggleCardExpansion,
    changeChartType,
    dataSource
  } = usePowerBIDataStore();
  
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const exportMenuRef = useRef(null);
  const viewMenuRef = useRef(null);
  
  // Close menus when clicking outside
  const handleClickOutside = (event) => {
    if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
      setIsExportMenuOpen(false);
    }
    
    if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) {
      setIsViewMenuOpen(false);
    }
  };
  
  // Add/remove event listener
  useEffect(() => {
    if (isExportMenuOpen || isViewMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportMenuOpen, isViewMenuOpen]);
  
  // Toast timeout effect
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);
  
  // Function to show toast notifications
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };
  
  // Data source indicator
  const getDataSourceLabel = () => {
    switch (dataSource) {
      case 'powerbi':
        return (
          <div className="flex items-center text-green-600 font-medium">
            <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M9 8v8M15 8v8M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Power BI Dataset
          </div>
        );
      case 'realtime':
        return (
          <div className="flex items-center text-blue-600 font-medium">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Live API Data
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600 font-medium">
            <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Simulated Data
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 mb-4 flex flex-wrap justify-between items-center">
      {/* Left side: Data source badge + toggle */}
      <div className="flex items-center space-x-4">
        {getDataSourceLabel()}
        <PowerBIDataToggle />
      </div>
      
      {/* Right side: Toolbar actions */}
      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
        {/* Export dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            className="toolbar-button group"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            aria-label="Export options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export</span>
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExportMenuOpen && (
            <div className="toolbar-dropdown">
              <button 
                className="toolbar-dropdown-item" 
                onClick={() => {
                  exportData('csv');
                  setIsExportMenuOpen(false);
                  showToastNotification('CSV export complete');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as CSV
              </button>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  exportData('json');
                  setIsExportMenuOpen(false);
                  showToastNotification('JSON export complete');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Export as JSON
              </button>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  exportData('excel');
                  setIsExportMenuOpen(false);
                  showToastNotification('Excel export complete');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Export as Excel
              </button>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  exportData('powerbi');
                  setIsExportMenuOpen(false);
                  showToastNotification('Power BI schema export complete');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                  <path d="M9 8v8M15 8v8M3 12h18" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Export for Power BI
              </button>
            </div>
          )}
        </div>
        
        {/* View Options dropdown */}
        <div className="relative" ref={viewMenuRef}>
          <button
            className="toolbar-button"
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            aria-label="View options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">View</span>
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isViewMenuOpen && (
            <div className="toolbar-dropdown">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chart Types</h3>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  changeChartType('salesByRegion', 'bar');
                  setIsViewMenuOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Bar Chart for Regions
              </button>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  changeChartType('salesByCategory', 'pie');
                  setIsViewMenuOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Pie Chart for Categories
              </button>
              
              <div className="border-t border-gray-100 my-2"></div>
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Card Options</h3>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  toggleCardExpansion('salesTrend');
                  setIsViewMenuOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Toggle Trend Card Size
              </button>
              
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  // In a real app, this would toggle between light/dark mode
                  showToastNotification('Theme changed');
                  setIsViewMenuOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Toggle Dark Mode
              </button>
            </div>
          )}
        </div>
        
        {/* Print button */}
        <button 
          className="toolbar-button"
          onClick={() => {
            window.print();
            showToastNotification('Preparing dashboard for printing...');
          }}
          aria-label="Print dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="hidden sm:inline">Print</span>
        </button>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default PowerBIToolbar;