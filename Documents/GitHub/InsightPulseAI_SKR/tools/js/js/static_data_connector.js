/**
 * Static Data Connector for Dashboard
 * 
 * This module loads dashboard data from static JSON files instead of
 * making dynamic SQL queries. It provides the same interface as the
 * MedallionDataConnector to make it a drop-in replacement.
 */

class StaticDataConnector {
  /**
   * Initialize the Static Data Connector
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.config = {
      dataPath: options.dataPath || '/data',
      cacheDuration: options.cacheDuration || 5 * 60 * 1000, // 5 minutes
      onError: options.onError || ((error) => console.error('Static Data Connector Error:', error)),
      requestTimeout: options.requestTimeout || 10000, // 10 seconds
      showDataSourceIndicator: options.showDataSourceIndicator !== false
    };
    
    // Initialize data cache
    this.cache = new Map();
    
    // Initialize data freshness
    this.dataFreshness = null;
    this.getFreshness();
    
    // Initialize data source indicator if enabled
    if (this.config.showDataSourceIndicator) {
      this.initializeDataSourceIndicator();
    }
  }
  
  /**
   * Initialize data source indicator
   * Shows when the data was last updated
   */
  initializeDataSourceIndicator() {
    // Add data source indicator if it doesn't exist
    if (!document.getElementById('static-data-indicator')) {
      const indicator = document.createElement('div');
      indicator.id = 'static-data-indicator';
      indicator.className = 'static-data-indicator';
      document.body.appendChild(indicator);
      
      // Add styles
      if (!document.getElementById('static-data-indicator-styles')) {
        const style = document.createElement('style');
        style.id = 'static-data-indicator-styles';
        style.textContent = `
          .static-data-indicator {
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 5px 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 12px;
            border-radius: 4px;
            z-index: 9999;
            opacity: 0.7;
            transition: opacity 0.3s;
          }
          .static-data-indicator:hover {
            opacity: 1;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Update indicator with data freshness
      this.updateDataSourceIndicator();
    }
  }
  
  /**
   * Update data source indicator with freshness info
   */
  updateDataSourceIndicator() {
    const indicator = document.getElementById('static-data-indicator');
    if (!indicator) return;
    
    if (!this.dataFreshness) {
      indicator.textContent = 'Static Data (freshness unknown)';
      return;
    }
    
    // Get the oldest data timestamp from the freshness info
    const timestamps = Object.values(this.dataFreshness)
      .filter(item => item.last_updated)
      .map(item => new Date(item.last_updated).getTime());
    
    if (timestamps.length === 0) {
      indicator.textContent = 'Static Data (freshness unknown)';
      return;
    }
    
    const oldestTimestamp = Math.min(...timestamps);
    const oldestDate = new Date(oldestTimestamp);
    const now = new Date();
    const diffDays = Math.floor((now - oldestDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      indicator.textContent = `Static Data (updated today)`;
    } else if (diffDays === 1) {
      indicator.textContent = `Static Data (updated yesterday)`;
    } else {
      indicator.textContent = `Static Data (updated ${diffDays} days ago)`;
    }
  }
  
  /**
   * Load data freshness information
   */
  async getFreshness() {
    try {
      const freshness = await this.fetchData('data_freshness.json');
      this.dataFreshness = freshness;
      this.updateDataSourceIndicator();
    } catch (error) {
      console.warn('Failed to load data freshness information:', error);
    }
  }
  
  /**
   * Fetch data from a static JSON file
   * @param {string} filename - JSON filename
   * @returns {Promise<Object>} The fetched data
   */
  async fetchData(filename) {
    // Generate cache key
    const cacheKey = filename;
    
    // Check cache if enabled
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      
      // Check if cache is still valid
      if (Date.now() - cachedData.timestamp < this.config.cacheDuration) {
        console.log(`Static Data Connector: Using cached data for "${cacheKey}"`);
        return cachedData.data;
      } else {
        // Cache expired, remove it
        this.cache.delete(cacheKey);
      }
    }
    
    // Build the URL
    const url = `${this.config.dataPath}/${filename}`;
    
    try {
      console.log(`Static Data Connector: Fetching data from ${url}`);
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
      
      const response = await fetch(url, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Static Data Connector: Error fetching data from ${url}`, error);
      this.config.onError(error);
      
      // Return empty data
      return { data: [], metadata: { error: true, message: error.message } };
    }
  }
  
  /**
   * Clear the data cache
   * @param {string} [cacheKey] Optional specific cache key to clear
   */
  clearCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      console.log(`Static Data Connector: Cleared cache for "${cacheKey}"`);
    } else {
      this.cache.clear();
      console.log('Static Data Connector: Cleared all cache');
    }
  }
  
  /**
   * Get dashboard KPIs
   * @returns {Promise<Object>} The KPIs data
   */
  async getDashboardKPIs() {
    return this.fetchData('kpis.json');
  }
  
  /**
   * Get top stores by sales
   * @returns {Promise<Array>} Top stores data
   */
  async getTopStores() {
    return this.fetchData('top_stores.json');
  }
  
  /**
   * Get regional performance data
   * @returns {Promise<Array>} Regional performance data
   */
  async getRegionalPerformance() {
    return this.fetchData('regional_performance.json');
  }
  
  /**
   * Get brand data
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Brand data
   */
  async getBrands(options = {}) {
    const brands = await this.fetchData('brands.json');
    
    // Filter by tbwaOnly if specified
    if (options.tbwaOnly && Array.isArray(brands)) {
      return brands.filter(brand => brand.is_tbwa_client);
    }
    
    return brands;
  }
  
  /**
   * Get brand distribution data
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Brand distribution data
   */
  async getBrandDistribution(options = {}) {
    return this.fetchData('brand_distribution.json');
  }
  
  /**
   * Get insights data
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Insights data
   */
  async getInsights(options = {}) {
    return this.fetchData('insights.json');
  }
  
  /**
   * Get data freshness information
   * @returns {Promise<Object>} Data freshness information
   */
  async getDataFreshness() {
    const freshness = await this.fetchData('data_freshness.json');
    this.dataFreshness = freshness;
    this.updateDataSourceIndicator();
    return freshness;
  }
  
  /**
   * Get metadata about the exported data
   * @returns {Promise<Object>} Metadata
   */
  async getMetadata() {
    return this.fetchData('metadata.json');
  }
  
  // Compatibility methods with MedallionDataConnector for drop-in replacement
  
  /**
   * Get data from the Bronze layer (compatibility method)
   */
  async getBronzeData(endpoint, params = {}) {
    console.warn('Static Data Connector: getBronzeData is not fully supported, using fallback');
    return this.fetchData('metadata.json');
  }
  
  /**
   * Get data from the Silver layer (compatibility method)
   */
  async getSilverData(endpoint, params = {}) {
    console.warn('Static Data Connector: getSilverData is not fully supported, using fallback');
    return this.fetchData('metadata.json');
  }
  
  /**
   * Get data from the Gold layer (compatibility method)
   */
  async getGoldData(endpoint, params = {}) {
    console.warn('Static Data Connector: getGoldData is not fully supported, using fallback');
    return this.fetchData('metadata.json');
  }
  
  /**
   * Get data from the Platinum layer (compatibility method)
   */
  async getPlatinumData(endpoint, params = {}) {
    if (endpoint === 'insights') {
      return this.getInsights(params);
    }
    
    console.warn('Static Data Connector: getPlatinumData is not fully supported, using fallback');
    return this.fetchData('metadata.json');
  }
}

// Export for different module systems
// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StaticDataConnector;
}

// Browser global
if (typeof window !== 'undefined') {
  window.StaticDataConnector = StaticDataConnector;
}