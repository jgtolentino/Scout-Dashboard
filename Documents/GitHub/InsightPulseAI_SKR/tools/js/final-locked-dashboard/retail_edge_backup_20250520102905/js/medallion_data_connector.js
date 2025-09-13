/**
 * Medallion Data Connector for Retail Edge Dashboard
 * 
 * This module connects to the Medallion data architecture and provides
 * data access to the Dashboard. It integrates with the data_source_toggle.js
 * to switch between real and simulated data sources.
 */

class MedallionDataConnector {
  /**
   * Initialize the Medallion Data Connector
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.config = {
      useRealData: options.useRealData !== undefined ? options.useRealData : false,
      cacheDuration: options.cacheDuration || 15 * 60 * 1000, // 15 minutes
      apiBaseUrl: options.apiBaseUrl || 'https://retail-advisor-api.tbwa.com/api',
      simulatedDataPath: options.simulatedDataPath || '/retail_edge/assets/data/simulated',
      onDataSourceChange: options.onDataSourceChange || (() => {}),
      onError: options.onError || ((error) => console.error('Medallion Data Connector Error:', error)),
      requestTimeout: options.requestTimeout || 30000 // 30 seconds
    };
    
    // Authenticate with the API if using real data
    if (this.config.useRealData) {
      this.authenticate();
    }
    
    // Initialize data cache
    this.cache = new Map();
    
    // Track data source toggle
    this.dataSourceToggle = null;
    
    // Check for data toggle if DOM is loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.initializeDataSourceToggle();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.initializeDataSourceToggle());
    }
  }
  
  /**
   * Initialize and connect to the data source toggle if it exists
   */
  initializeDataSourceToggle() {
    // Look for an existing data source toggle instance
    if (window.dataSourceToggle) {
      this.dataSourceToggle = window.dataSourceToggle;
      
      // Update our configuration
      this.config.useRealData = this.dataSourceToggle.useRealData;
      
      // Subscribe to toggle changes
      const originalOnToggle = this.dataSourceToggle.onToggle;
      this.dataSourceToggle.onToggle = (useRealData, endpoints) => {
        // Call original handler
        if (originalOnToggle) {
          originalOnToggle(useRealData, endpoints);
        }
        
        // Update our configuration
        this.config.useRealData = useRealData;
        
        // Clear the cache when toggling data sources
        this.clearCache();
        
        // Notify of data source change
        this.config.onDataSourceChange(useRealData, endpoints);
      };
      
      console.log(`Medallion Data Connector: Connected to data source toggle. Using ${this.config.useRealData ? 'real' : 'simulated'} data.`);
    } else {
      console.log('Medallion Data Connector: No data source toggle found. Using configured default.');
    }
  }
  
  /**
   * Authenticate with the API
   * @returns {Promise<boolean>} Authentication success
   */
  async authenticate() {
    try {
      // Check for existing auth token in session storage
      const token = sessionStorage.getItem('medallion_auth_token');
      const tokenExpiry = sessionStorage.getItem('medallion_auth_expiry');
      
      // If token exists and is valid, use it
      if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry, 10)) {
        this.authToken = token;
        return true;
      }
      
      // Otherwise, get a new token (simplified for demo)
      this.authToken = "simulated_auth_token";
      const expiryTimestamp = Date.now() + (3600 * 1000); // 1 hour
      
      // Save to session storage
      sessionStorage.setItem('medallion_auth_token', this.authToken);
      sessionStorage.setItem('medallion_auth_expiry', expiryTimestamp.toString());
      
      console.log('Medallion Data Connector: Authentication successful');
      return true;
    } catch (error) {
      console.error('Medallion Data Connector: Authentication failed', error);
      this.config.onError(error);
      return false;
    }
  }
  
  /**
   * Clear the data cache
   * @param {string} [cacheKey] Optional specific cache key to clear
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      console.log(`Medallion Data Connector: Cleared cache for "${cacheKey}"`);
    } else {
      this.cache.clear();
      console.log('Medallion Data Connector: Cleared all cache');
    }
  }
  
  /**
   * Generate a cache key for the request
   * @param {string} layer Medallion layer (bronze, silver, gold, platinum)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @returns {string} Cache key
   */
  generateCacheKey(layer, endpoint, params = {}) {
    return `${layer}:${endpoint}:${JSON.stringify(params)}`;
  }
  
  /**
   * Fetch data from the specified Medallion layer
   * @param {string} layer Medallion layer (bronze, silver, gold, platinum)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {boolean} useCache Whether to use cached data if available
   * @returns {Promise<Object>} The fetched data
   */
  async fetchData(layer, endpoint, params = {}, useCache = true) {
    // Generate cache key
    const cacheKey = this.generateCacheKey(layer, endpoint, params);
    
    // Check cache if enabled
    if (useCache && this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      
      // Check if cache is still valid
      if (Date.now() - cachedData.timestamp < this.config.cacheDuration) {
        console.log(`Medallion Data Connector: Using cached data for "${cacheKey}"`);
        return cachedData.data;
      } else {
        // Cache expired, remove it
        this.cache.delete(cacheKey);
      }
    }
    
    // Determine if we should use real or simulated data
    if (this.config.useRealData) {
      return this.fetchRealData(layer, endpoint, params, cacheKey);
    } else {
      return this.fetchSimulatedData(layer, endpoint, params, cacheKey);
    }
  }
  
  /**
   * Fetch real data from the API
   * @param {string} layer Medallion layer (bronze, silver, gold, platinum)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {string} cacheKey Cache key for this request
   * @returns {Promise<Object>} The fetched data
   */
  async fetchRealData(layer, endpoint, params, cacheKey) {
    console.log(`Medallion Data Connector: Fetching real data from ${layer} layer: ${endpoint}`);
    
    // For demo purposes, we'll actually use simulated data
    // In a real application, this would make an actual API call
    return this.fetchSimulatedData(layer, endpoint, params, cacheKey);
  }
  
  /**
   * Fetch simulated data from static files
   * @param {string} layer Medallion layer (bronze, silver, gold, platinum)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {string} cacheKey Cache key for this request
   * @returns {Promise<Object>} The fetched data
   */
  async fetchSimulatedData(layer, endpoint, params, cacheKey) {
    console.log(`Medallion Data Connector: Fetching simulated data for ${layer}/${endpoint}`);
    
    try {
      // Map layer to file path
      const layerFilePath = this.mapLayerToFilePath(layer, endpoint);
      
      // Fetch the simulated data file
      const response = await fetch(layerFilePath);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch simulated data: ${response.status} ${response.statusText}`);
      }
      
      let data = await response.json();
      
      // Apply filtering to simulate params
      data = this.filterSimulatedData(data, params);
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Medallion Data Connector: Error fetching simulated data for ${layer}/${endpoint}`, error);
      this.config.onError(error);
      
      // Return empty data
      return { data: [], metadata: { error: true, message: error.message } };
    }
  }
  
  /**
   * Map Medallion layer and endpoint to a simulated data file path
   * @param {string} layer Medallion layer (bronze, silver, gold, platinum)
   * @param {string} endpoint API endpoint
   * @returns {string} Path to the simulated data file
   */
  mapLayerToFilePath(layer, endpoint) {
    // Standardized naming convention for simulated data files
    const basePath = this.config.simulatedDataPath;
    
    // Special case for geospatial data endpoints
    if (endpoint === 'brand_mentions' || 
        endpoint === 'store_density' || 
        endpoint === 'sales_volume' || 
        endpoint === 'combo_frequency') {
      return `${basePath}/geo_brand_mentions.json`;
    }
    
    // Map the layer to a file path
    switch (layer) {
      case 'bronze':
        return `${basePath}/bronze_${endpoint.replace(/\//g, '_')}.json`;
      case 'silver':
        return `${basePath}/silver_${endpoint.replace(/\//g, '_')}.json`;
      case 'gold':
        return `${basePath}/gold_${endpoint.replace(/\//g, '_')}.json`;
      case 'platinum':
        return `${basePath}/platinum_${endpoint.replace(/\//g, '_')}.json`;
      default:
        // Fall back to dashboard summary for unknown layers
        return `${basePath}/dashboard_summary.json`;
    }
  }
  
  /**
   * Filter simulated data to match request parameters
   * @param {Object} data The data to filter
   * @param {Object} params The filter parameters
   * @returns {Object} Filtered data
   */
  filterSimulatedData(data, params) {
    // If no filtering params or no data, return as is
    if (!params || Object.keys(params).length === 0 || !data || !data.data) {
      return data;
    }
    
    // Make a copy of the data
    const result = { ...data };
    
    // Filter the data array if it exists
    if (Array.isArray(result.data)) {
      result.data = result.data.filter(item => {
        // Check each parameter
        return Object.keys(params).every(key => {
          // Skip null or undefined parameters
          if (params[key] === null || params[key] === undefined) {
            return true;
          }
          
          // Handle special 'all' value for IDs
          if ((key.endsWith('Id') || key.endsWith('ID')) && params[key] === 'all') {
            return true;
          }
          
          // Handle date ranges
          if (key === 'days' && typeof params.days === 'number') {
            // If the item has a date field, filter based on the number of days
            const dateField = item.date || item.transactionDate || item.sessionStartTime;
            if (dateField) {
              const itemDate = new Date(dateField);
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - params.days);
              return itemDate >= cutoffDate;
            }
            return true;
          }
          
          // Regular equality check
          return item[key] == params[key]; // Use loose equality for string/number conversion
        });
      });
    }
    
    return result;
  }
  
  /**
   * Get data from the Bronze layer (raw data)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} The fetched data
   */
  async getBronzeData(endpoint, params = {}, useCache = true) {
    return this.fetchData('bronze', endpoint, params, useCache);
  }
  
  /**
   * Get data from the Silver layer (cleaned data)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} The fetched data
   */
  async getSilverData(endpoint, params = {}, useCache = true) {
    return this.fetchData('silver', endpoint, params, useCache);
  }
  
  /**
   * Get data from the Gold layer (enriched data)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} The fetched data
   */
  async getGoldData(endpoint, params = {}, useCache = true) {
    return this.fetchData('gold', endpoint, params, useCache);
  }
  
  /**
   * Get data from the Platinum layer (GenAI insights)
   * @param {string} endpoint API endpoint
   * @param {Object} params Request parameters
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} The fetched data
   */
  async getPlatinumData(endpoint, params = {}, useCache = true) {
    return this.fetchData('platinum', endpoint, params, useCache);
  }
  
  /**
   * Get store transactions
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Transaction data
   */
  async getStoreTransactions(params = {}) {
    return this.fetchData('silver', 'transactions', params);
  }
  
  /**
   * Get daily sales data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Daily sales data
   */
  async getDailySales(params = {}) {
    return this.fetchData('gold', 'daily-sales', params);
  }
  
  /**
   * Get customer sessions
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Customer session data
   */
  async getCustomerSessions(params = {}) {
    return this.fetchData('silver', 'customer-sessions', params);
  }
  
  /**
   * Get product performance data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Product performance data
   */
  async getProductPerformance(params = {}) {
    return this.fetchData('gold', 'product-performance', params);
  }
  
  /**
   * Get GenAI-powered insights and analysis
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} GenAI insights
   */
  async getGenAIInsights(params = {}) {
    return this.fetchData('platinum', 'insights', params);
  }
  
  /**
   * Get choropleth map data for geospatial visualization
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} GeoJSON data for choropleth map
   */
  async getChoroplethData(params = {}) {
    // Determine which endpoint to use based on the mode parameter
    let endpoint = 'brand_mentions'; // Default
    
    if (params.mode) {
      switch (params.mode) {
        case 'stores':
          endpoint = 'store_density';
          break;
        case 'sales':
          endpoint = 'sales_volume';
          break;
        case 'brands':
          endpoint = 'brand_mentions';
          break;
        case 'combos':
          endpoint = 'combo_frequency';
          break;
      }
    }
    
    // Get the data from the silver layer
    return this.fetchData('silver', endpoint, params);
  }
  
  /**
   * Get brand ID from brand name
   * @param {string} brandName The brand name to look up
   * @returns {Promise<string>} The brand ID
   */
  async getBrandIDFromName(brandName) {
    if (!brandName) return null;
    
    try {
      // Fetch brand lookup data
      const brandsData = await this.fetchData('silver', 'brands', {});
      
      // Find the brand by name
      const brand = brandsData.data.find(b => b.brandName.toLowerCase() === brandName.toLowerCase());
      
      return brand ? brand.brandID : null;
    } catch (error) {
      console.error('Error getting brand ID from name:', error);
      return null;
    }
  }
}

// Export for different module systems
// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MedallionDataConnector;
}

// Browser global
if (typeof window !== 'undefined') {
  window.MedallionDataConnector = MedallionDataConnector;
}