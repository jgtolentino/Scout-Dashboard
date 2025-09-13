/**
 * REST API Dashboard Connector
 * Main entry point for the dashboard connector module
 */

const apiConfig = require('./api_connection');
const visualizer = require('./retail_edge_visualizer');

/**
 * Initialize the dashboard connector
 * @param {Object} options - Configuration options
 * @returns {Object} - Dashboard connector instance
 */
function initDashboardConnector(options = {}) {
  // Merge provided options with defaults
  const config = {
    ...apiConfig,
    ...options,
  };

  // Check connection status
  const isReady = async () => {
    const status = await config.checkConnection();
    return status.status === 'ok';
  };

  // Fetch data from API endpoint
  const fetchData = async (endpoint, params = {}) => {
    try {
      const url = config.getEndpointUrl(endpoint, params);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${await response.text()}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}: ${error.message}`);
      throw error;
    }
  };

  // Check data freshness
  const checkFreshness = async () => {
    return visualizer.checkDataFreshness();
  };

  // Render dashboard
  const renderDashboard = async (selector, options = {}) => {
    return visualizer.initDashboard(selector, options);
  };

  // Return public API
  return {
    isReady,
    fetchData,
    checkFreshness,
    renderDashboard,
    config
  };
}

module.exports = {
  initDashboardConnector,
  apiConfig,
  visualizer
};