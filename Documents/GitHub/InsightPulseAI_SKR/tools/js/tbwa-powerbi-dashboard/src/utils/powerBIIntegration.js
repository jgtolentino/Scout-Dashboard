/**
 * Power BI Integration Utility
 * 
 * This utility handles embedding Power BI reports and connecting to Power BI datasets
 * using the Power BI JavaScript API.
 */

// Configuration for Power BI integration
const powerBIConfig = {
  // These would typically come from environment variables
  apiUrl: import.meta.env.VITE_POWERBI_API_URL || 'https://api.powerbi.com',
  datasetId: import.meta.env.VITE_POWERBI_DATASET_ID,
  reportId: import.meta.env.VITE_POWERBI_REPORT_ID,
  workspaceId: import.meta.env.VITE_POWERBI_WORKSPACE_ID,
  clientId: import.meta.env.VITE_POWERBI_CLIENT_ID,
  embedUrl: import.meta.env.VITE_POWERBI_EMBED_URL,
  
  // Default settings for embedded reports
  defaultSettings: {
    navContentPaneEnabled: false,
    filterPaneEnabled: false,
    background: models.BackgroundType.Transparent,
  }
};

/**
 * Fetches an embed token for Power BI report embedding
 * @returns {Promise<string>} The embed token
 */
export const getEmbedToken = async () => {
  try {
    // In a real implementation, this would call your server
    // which would use the Power BI REST API to get a token
    const response = await fetch('/api/powerbi/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId: powerBIConfig.reportId,
        datasetId: powerBIConfig.datasetId,
        workspaceId: powerBIConfig.workspaceId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get embed token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error getting Power BI embed token:', error);
    throw error;
  }
};

/**
 * Embeds a Power BI report in the specified container
 * @param {HTMLElement} container - The container to embed the report in
 * @param {Object} options - Additional embedding options
 * @returns {Promise<Object>} The embedded report object
 */
export const embedReport = async (container, options = {}) => {
  if (!container) {
    throw new Error('No container provided for Power BI report embedding');
  }
  
  try {
    // Check if the Power BI JavaScript SDK is loaded
    if (!window.powerbi) {
      console.error('Power BI JavaScript SDK not loaded');
      return null;
    }
    
    // Get an embed token
    const token = await getEmbedToken();
    
    // Configure the report embedding
    const embedConfig = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken: token,
      embedUrl: powerBIConfig.embedUrl,
      id: powerBIConfig.reportId,
      permissions: models.Permissions.Read,
      settings: {
        ...powerBIConfig.defaultSettings,
        ...options.settings || {},
      },
      // Optional filters
      filters: options.filters || [],
    };
    
    // Embed the report
    const report = powerbi.embed(container, embedConfig);
    
    // Wait for report to load
    await new Promise((resolve) => {
      report.on('loaded', resolve);
    });
    
    return report;
  } catch (error) {
    console.error('Error embedding Power BI report:', error);
    
    // Show error in container
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-4 text-center">
        <div class="text-red-500 text-lg mb-2">Error embedding Power BI report</div>
        <div class="text-gray-600 text-sm">Please check your connection and try again</div>
        <button class="mt-4 px-4 py-2 bg-tbwa-yellow text-black rounded" 
                onclick="window.location.reload()">
          Retry
        </button>
      </div>
    `;
    return null;
  }
};

/**
 * Queries data directly from a Power BI dataset
 * @param {Object} query - The DAX query to execute
 * @returns {Promise<Array>} The query results
 */
export const queryPowerBIData = async (query) => {
  try {
    // In a real implementation, this would call your server
    // which would use the Power BI REST API to query the dataset
    const response = await fetch('/api/powerbi/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetId: powerBIConfig.datasetId,
        workspaceId: powerBIConfig.workspaceId,
        query: query,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to query Power BI data: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error querying Power BI data:', error);
    
    // Fallback to simulated data in development
    if (import.meta.env.DEV) {
      console.warn('Falling back to simulated data for development');
      return simulatePowerBIResponse(query);
    }
    
    throw error;
  }
};

/**
 * Simulates a Power BI API response for development purposes
 * @param {Object} query - The simulated query
 * @returns {Array} Simulated data results
 */
const simulatePowerBIResponse = (query) => {
  // Simple simulation based on query content
  if (query.includes('SalesByRegion') || query.includes('Region')) {
    return [
      { region: 'North', value: Math.floor(Math.random() * 5000) + 2000 },
      { region: 'South', value: Math.floor(Math.random() * 4000) + 1000 },
      { region: 'East', value: Math.floor(Math.random() * 6000) + 3000 },
      { region: 'West', value: Math.floor(Math.random() * 7000) + 4000 },
    ];
  } else if (query.includes('SalesByCategory') || query.includes('Category')) {
    return [
      { category: 'Electronics', value: Math.floor(Math.random() * 8000) + 5000 },
      { category: 'Clothing', value: Math.floor(Math.random() * 6000) + 3000 },
      { category: 'Food', value: Math.floor(Math.random() * 4000) + 2000 },
      { category: 'Home', value: Math.floor(Math.random() * 5000) + 1000 },
    ];
  } else if (query.includes('SalesTrend') || query.includes('Month')) {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      value: Math.floor(Math.random() * 10000) + 5000
    }));
  } else if (query.includes('KPI') || query.includes('Summary')) {
    return {
      totalSales: Math.floor(Math.random() * 1000000) + 500000,
      averageOrder: Math.floor(Math.random() * 200) + 50,
      customerCount: Math.floor(Math.random() * 50000) + 10000,
      conversionRate: (Math.random() * 10 + 2).toFixed(2)
    };
  }
  
  // Default response
  return [];
};

/**
 * Creates a Power BI slicer configuration for filtering
 * @param {string} field - The field to filter on
 * @param {Array} values - The selected values
 * @returns {Object} A filter configuration object
 */
export const createPowerBISlicer = (field, values) => {
  return {
    $schema: "http://powerbi.com/product/schema#basic",
    target: {
      table: field.split('.')[0],
      column: field.split('.')[1] || field
    },
    operator: "In",
    values: Array.isArray(values) ? values : [values],
  };
};

/**
 * Converts dashboard filters to Power BI filter syntax
 * @param {Object} filters - Dashboard filters object
 * @returns {Array} Array of Power BI filter objects
 */
export const convertToPowerBIFilters = (filters) => {
  const powerBIFilters = [];
  
  if (filters.region && filters.region !== 'all') {
    powerBIFilters.push(createPowerBISlicer('Region.RegionName', filters.region));
  }
  
  if (filters.category && filters.category !== 'all') {
    powerBIFilters.push(createPowerBISlicer('Category.CategoryName', filters.category));
  }
  
  if (filters.date) {
    // Convert date filter to appropriate Power BI date filter
    let dateFilter;
    
    switch (filters.date) {
      case 'last30days':
        dateFilter = {
          $schema: "http://powerbi.com/product/schema#basic",
          target: {
            table: "Date",
            column: "Date"
          },
          operator: "GreaterOrEqual",
          value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        break;
      case 'last90days':
        dateFilter = {
          $schema: "http://powerbi.com/product/schema#basic",
          target: {
            table: "Date",
            column: "Date"
          },
          operator: "GreaterOrEqual",
          value: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        break;
      case 'lastYear':
        dateFilter = {
          $schema: "http://powerbi.com/product/schema#basic",
          target: {
            table: "Date",
            column: "Year"
          },
          operator: "Equal",
          value: new Date().getFullYear() - 1
        };
        break;
      // Add more cases as needed
    }
    
    if (dateFilter) {
      powerBIFilters.push(dateFilter);
    }
  }
  
  return powerBIFilters;
};

export default {
  getEmbedToken,
  embedReport,
  queryPowerBIData,
  createPowerBISlicer,
  convertToPowerBIFilters,
};