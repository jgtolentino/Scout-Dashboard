import { useState, useEffect, useRef } from 'react';
import { usePowerBIDataStore } from '../store/powerBIDataStore';

/**
 * Power BI style filter pane component
 * Provides slicers and filter controls similar to Power BI
 */
function PowerBIFilterPane() {
  const { filters, setFilter } = usePowerBIDataStore();
  const [isOpen, setIsOpen] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const filterPaneRef = useRef(null);
  
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      setIsSmallScreen(smallScreen);
      
      // Auto-close on small screens
      if (smallScreen && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);
  
  // Available filter options
  const dateOptions = [
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
  ];
  
  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
  ];
  
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'food', label: 'Food' },
    { value: 'home', label: 'Home' },
  ];
  
  const brandOptions = [
    { value: 'all', label: 'All Brands' },
    { value: 'samsung', label: 'Samsung' },
    { value: 'apple', label: 'Apple' },
    { value: 'lg', label: 'LG' },
    { value: 'sony', label: 'Sony' },
    { value: 'nike', label: 'Nike' },
    { value: 'adidas', label: 'Adidas' },
    { value: 'nestle', label: 'Nestle' },
    { value: 'ikea', label: 'IKEA' },
  ];
  
  // Custom date range handler
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const handleCustomDateChange = () => {
    // Validate dates
    if (!customDateRange.startDate || !customDateRange.endDate) {
      return;
    }
    
    // Apply custom date range filter
    setFilter('date', 'custom');
    setFilter('dateRange', customDateRange);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilter('date', 'last30days');
    setFilter('region', 'all');
    setFilter('category', 'all');
    setFilter('brand', 'all');
    setFilter('product', 'all');
    
    setCustomDateRange({
      startDate: '',
      endDate: ''
    });
  };
  
  // Toggle filter visibility
  const toggleFilterPane = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {/* Filter toggle button (visible on small screens) */}
      <div className={`fixed top-1/2 transform -translate-y-1/2 z-20 transition-all duration-300 ${isOpen ? 'left-64 md:left-72' : 'left-0'}`}>
        <button
          className="flex items-center justify-center bg-white border border-gray-300 border-l-0 rounded-r-md h-10 w-6 shadow-sm"
          onClick={toggleFilterPane}
          aria-label={isOpen ? 'Close filters' : 'Open filters'}
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
          </svg>
        </button>
      </div>
      
      {/* Filter pane */}
      <div 
        ref={filterPaneRef}
        className={`fixed inset-y-0 left-0 w-64 md:w-72 bg-white border-r border-gray-200 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <div className="py-4 px-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={resetFilters}
              aria-label="Reset all filters"
            >
              <span className="text-xs text-gray-500 mr-1">Reset</span>
              <svg className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Date filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Time Period</h3>
              
              <div className="space-y-1">
                <select
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  value={filters.date}
                  onChange={(e) => setFilter('date', e.target.value)}
                >
                  {dateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {filters.date === 'custom' && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                      />
                    </div>
                    <button
                      className="inline-flex items-center py-1.5 px-3 text-xs font-medium bg-tbwa-yellow text-black rounded-md hover:bg-tbwa-yellow-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tbwa-yellow"
                      onClick={handleCustomDateChange}
                    >
                      Apply Custom Range
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Region filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Region</h3>
              
              <div className="space-y-1">
                {regionOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-tbwa-yellow focus:ring-tbwa-yellow border-gray-300"
                      checked={filters.region === option.value}
                      onChange={() => setFilter('region', option.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Category filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Product Category</h3>
              
              <div className="space-y-1">
                {categoryOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-tbwa-yellow focus:ring-tbwa-yellow border-gray-300"
                      checked={filters.category === option.value}
                      onChange={() => setFilter('category', option.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Brand filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Brand</h3>
              
              <select
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                value={filters.brand || 'all'}
                onChange={(e) => setFilter('brand', e.target.value)}
              >
                {brandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Advanced Filter button */}
            <div className="pt-2">
              <button
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tbwa-yellow"
              >
                Advanced Filter Options
              </button>
            </div>
          </div>
          
          {/* Applied filters summary */}
          <div className="border-t border-gray-200 py-4 px-4">
            <div className="text-xs text-gray-500 mb-2">Active Filters:</div>
            
            <div className="flex flex-wrap gap-2">
              {filters.date !== 'last30days' && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {dateOptions.find(opt => opt.value === filters.date)?.label || 'Custom Date'}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setFilter('date', 'last30days')}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {filters.region !== 'all' && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Region: {regionOptions.find(opt => opt.value === filters.region)?.label}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setFilter('region', 'all')}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {filters.category !== 'all' && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Category: {categoryOptions.find(opt => opt.value === filters.category)?.label}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setFilter('category', 'all')}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {filters.brand !== 'all' && filters.brand && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Brand: {brandOptions.find(opt => opt.value === filters.brand)?.label}
                  <button 
                    className="ml-1 text-gray-500 hover:text-gray-700"
                    onClick={() => setFilter('brand', 'all')}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for small screens */}
      {isSmallScreen && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-0"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}

export default PowerBIFilterPane;