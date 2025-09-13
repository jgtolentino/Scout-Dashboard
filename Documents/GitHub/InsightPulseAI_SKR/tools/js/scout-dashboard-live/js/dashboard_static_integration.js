/**
 * Dashboard Static Integration
 * 
 * This script integrates the static data connector with the existing dashboard.
 * It provides a simple way to switch between dynamic and static data sources.
 */

(function() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Configuration (can be overridden by window.dashboardConfig)
  const defaultConfig = {
    useStaticData: true,
    staticDataPath: '/data',
    showDataSourceIndicator: true,
    autoRefresh: false,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  };
  
  // Merge with window.dashboardConfig if available
  const config = Object.assign({}, defaultConfig, window.dashboardConfig || {});
  
  // Initialize connectors when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeDashboard);
  
  /**
   * Initialize the dashboard with the appropriate data connector
   */
  function initializeDashboard() {
    // Check if medallion connector is already instantiated
    const hasMedallionConnector = typeof window.medallionConnector !== 'undefined' || 
                                 typeof window.MedallionDataConnector !== 'undefined';
    
    // Create static data connector
    const staticConnector = new StaticDataConnector({
      dataPath: config.staticDataPath,
      showDataSourceIndicator: config.showDataSourceIndicator
    });
    
    // Save it to window for global access
    window.staticConnector = staticConnector;
    
    // If using static data, initialize or replace the existing connector
    if (config.useStaticData) {
      console.log('Dashboard Integration: Using static data connector');
      
      // Replace existing medallionConnector if it exists
      if (hasMedallionConnector) {
        // Save a reference to the original connector for potential fallback
        window.originalConnector = window.medallionConnector;
        
        // Replace with static connector
        window.medallionConnector = staticConnector;
        
        // If the dashboard has already been initialized, refresh it
        if (typeof window.refreshDashboard === 'function') {
          console.log('Dashboard Integration: Refreshing dashboard with static data');
          window.refreshDashboard();
        }
      }
      
      // Set up auto-refresh if enabled
      if (config.autoRefresh) {
        setInterval(() => {
          console.log('Dashboard Integration: Auto-refreshing dashboard data');
          
          // Clear cache to force fetch of fresh data
          staticConnector.clearCache();
          
          // Refresh dashboard if refresh function exists
          if (typeof window.refreshDashboard === 'function') {
            window.refreshDashboard();
          } else {
            // Otherwise manually refresh by reloading the page
            window.location.reload();
          }
        }, config.refreshInterval);
      }
    }
    
    // Add toggle functionality if both connectors are available
    if (hasMedallionConnector && window.staticConnector) {
      addDataSourceToggle();
    }
    
    // Dispatch event that integration is complete
    window.dispatchEvent(new CustomEvent('dashboard-static-integration-complete', {
      detail: {
        useStaticData: config.useStaticData,
        connector: config.useStaticData ? staticConnector : window.medallionConnector
      }
    }));
  }
  
  /**
   * Add a toggle button to switch between static and dynamic data
   */
  function addDataSourceToggle() {
    // Only add if toggle doesn't already exist
    if (document.getElementById('data-source-toggle-container')) return;
    
    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'data-source-toggle-container';
    toggleContainer.className = 'data-source-toggle-container';
    toggleContainer.innerHTML = `
      <div class="data-source-toggle">
        <div class="toggle-wrapper">
          <div class="toggle-label-container">
            <span id="data-source-toggle-label" class="toggle-label">
              ${config.useStaticData ? 'Using Static Data' : 'Using Dynamic Data'}
            </span>
            <span id="data-source-toggle-status" class="badge ${config.useStaticData ? 'badge-warning' : 'badge-success'}">
              ${config.useStaticData ? 'STATIC' : 'LIVE'}
            </span>
          </div>
          <label class="switch">
            <input type="checkbox" id="data-source-toggle-switch" ${!config.useStaticData ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        <div class="toggle-info">
          <i class="fas fa-info-circle"></i>
          <span>Toggle between static and dynamic data sources</span>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(toggleContainer);
    
    // Add styles
    if (!document.getElementById('data-source-toggle-styles')) {
      const style = document.createElement('style');
      style.id = 'data-source-toggle-styles';
      style.textContent = `
        .data-source-toggle-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          width: 300px;
        }
        .data-source-toggle {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .toggle-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .toggle-label-container {
          display: flex;
          align-items: center;
        }
        .toggle-label {
          font-weight: 600;
          margin-right: 8px;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-success {
          background-color: #28a745;
          color: white;
        }
        .badge-warning {
          background-color: #ffc107;
          color: #212529;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 30px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #0078D4;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #0078D4;
        }
        input:checked + .slider:before {
          transform: translateX(30px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        .toggle-info {
          margin-top: 8px;
          font-size: 12px;
          color: #6c757d;
          display: flex;
          align-items: center;
        }
        .toggle-info i {
          margin-right: 6px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add toggle functionality
    const toggleSwitch = document.getElementById('data-source-toggle-switch');
    if (toggleSwitch) {
      toggleSwitch.addEventListener('change', toggleDataSource);
    }
  }
  
  /**
   * Toggle between static and dynamic data sources
   */
  function toggleDataSource() {
    const isUsingDynamicData = document.getElementById('data-source-toggle-switch').checked;
    const label = document.getElementById('data-source-toggle-label');
    const status = document.getElementById('data-source-toggle-status');
    
    // Update toggle UI
    if (label) {
      label.textContent = isUsingDynamicData ? 'Using Dynamic Data' : 'Using Static Data';
    }
    
    if (status) {
      status.className = isUsingDynamicData ? 'badge badge-success' : 'badge badge-warning';
      status.textContent = isUsingDynamicData ? 'LIVE' : 'STATIC';
    }
    
    // Update connector
    if (isUsingDynamicData && window.originalConnector) {
      window.medallionConnector = window.originalConnector;
    } else {
      window.medallionConnector = window.staticConnector;
    }
    
    // Save preference
    config.useStaticData = !isUsingDynamicData;
    
    // Try to save to localStorage
    try {
      localStorage.setItem('dashboard_use_static_data', (!isUsingDynamicData).toString());
    } catch (error) {
      console.warn('Unable to save data source preference to localStorage');
    }
    
    // Refresh dashboard
    if (typeof window.refreshDashboard === 'function') {
      window.refreshDashboard();
    } else {
      // Otherwise reload the page
      window.location.reload();
    }
  }
  
  // Add a global function to load static data on demand (useful for testing)
  window.loadStaticData = function(filename) {
    if (!window.staticConnector) {
      console.error('Static connector not initialized');
      return Promise.reject(new Error('Static connector not initialized'));
    }
    
    return window.staticConnector.fetchData(filename);
  };
})();