/**
 * Medallion Data Connector for Retail Advisor Dashboard
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
      simulatedDataPath: options.simulatedDataPath || '/assets/data/simulated',
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
      
      // Otherwise, get a new token
      const response = await fetch(`${this.config.apiBaseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: process.env.API_CLIENT_ID || 'retail_advisor_dashboard',
          clientSecret: process.env.API_CLIENT_SECRET || 'dashboard_client_secret'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }
      
      const authData = await response.json();
      
      // Store token and expiry
      this.authToken = authData.access_token;
      const expiryTimestamp = Date.now() + (authData.expires_in * 1000);
      
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
    
    // Ensure we're authenticated
    if (!this.authToken && !(await this.authenticate())) {
      throw new Error('Authentication required to fetch real data');
    }
    
    try {
      // Build the URL
      const url = new URL(`${this.config.apiBaseUrl}/${layer}/${endpoint}`);
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Medallion Data Connector: Error fetching real data from ${layer}/${endpoint}`, error);
      
      // Try fallback to simulated data if fetch fails
      console.log(`Medallion Data Connector: Falling back to simulated data for ${layer}/${endpoint}`);
      return this.fetchSimulatedData(layer, endpoint, params, cacheKey);
    }
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
        // Fall back to insights_data.json for unknown layers
        return '/assets/data/insights_data.json';
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
   * Get hourly traffic data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Hourly traffic data
   */
  async getHourlyTraffic(params = {}) {
    return this.fetchData('silver', 'hourly-traffic', params);
  }
  
  /**
   * Get customer shopping behavior data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Shopping behavior data
   */
  async getShoppingBehavior(params = {}) {
    return this.fetchData('gold', 'shopping-behavior', params);
  }
  
  /**
   * Get employee performance data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Employee performance data
   */
  async getEmployeePerformance(params = {}) {
    return this.fetchData('gold', 'employee-performance', params);
  }
  
  /**
   * Get discount effectiveness data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Discount effectiveness data
   */
  async getDiscountEffectiveness(params = {}) {
    return this.fetchData('gold', 'discount-effectiveness', params);
  }
  
  /**
   * Get inventory turnover data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Inventory turnover data
   */
  async getInventoryTurnover(params = {}) {
    return this.fetchData('silver', 'inventory-turnover', params);
  }
  
  /**
   * Get customer segmentation data
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Customer segmentation data
   */
  async getCustomerSegmentation(params = {}) {
    return this.fetchData('gold', 'customer-segmentation', params);
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
   * Get brand ID from brand name
   * @param {string} brandName The name of the brand
   * @returns {number|null} The brand ID if found, null otherwise
   */
  getBrandIDFromName(brandName) {
    // Map common brand names to their IDs
    const brandMap = {
      'sugarcola': 101,
      'juicy juice': 102,
      'crunch snacks': 103,
      'marlborez': 104,
      'cola': 101,  // Alias
      'juice': 102, // Alias
      'snacks': 103, // Alias
      'cigarettes': 104 // Alias
    };
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedName = brandName.toLowerCase();
    
    // Return the ID if found, null otherwise
    return brandMap[normalizedName] || null;
  }

  /**
   * Get choropleth map data for geospatial insights
   * @param {string} mode Map mode (stores, sales, brands, combos)
   * @param {string} geoLevel Geographic level (region, city, barangay)
   * @param {Object} params Query parameters
   * @returns {Promise<Object>} Choropleth GeoJSON data
   */
  async getChoroplethData(mode = 'stores', geoLevel = 'barangay', params = {}) {
    // Determine the layer and endpoint based on mode
    let layer, endpoint;
    
    switch (mode) {
      case 'stores':
        layer = 'silver';
        endpoint = 'geo-stores';
        break;
      case 'sales':
        layer = 'gold';
        endpoint = 'geo-sales';
        break;
      case 'brands':
        layer = 'gold';
        endpoint = 'geo-brand-mentions';
        // Add the SQL-specific parameters if needed
        if (this.config.useRealData && params) {
          // Include interaction date range if not provided
          if (!params.days) {
            params.days = 30; // Default to 30 days
          }
          // If there's a brand filter, add it to the parameters
          if (params.brandFilter && params.brandFilter !== 'all') {
            params.brandID = this.getBrandIDFromName(params.brandFilter);
          }
        }
        break;
      case 'combos':
        layer = 'gold';
        endpoint = 'geo-combos';
        break;
      default:
        layer = 'silver';
        endpoint = 'geo-stores';
    }
    
    // Add geo level to params
    params.geoLevel = geoLevel;
    
    // Fetch data from appropriate layer and endpoint
    return this.fetchData(layer, endpoint, params);
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