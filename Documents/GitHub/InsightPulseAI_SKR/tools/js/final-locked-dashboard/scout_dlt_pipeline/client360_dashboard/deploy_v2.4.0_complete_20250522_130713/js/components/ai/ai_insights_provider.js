/**
 * AI Insights Provider - Client360 Dashboard v2.3.3
 * Manages the loading and generation of AI insights, switching between simulated and real data
 */

class AIInsightsProvider {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      simulatedDataEnabled: true,
      simulatedInsightsPath: '/data/ai/insights/all_insights_latest.json',
      insightsParquetPath: '/data/ai/insights/all_insights_latest.parquet',
      azureOpenAIConfig: {
        apiEndpoint: 'https://tbwa-ai-insights.openai.azure.com',
        apiVersion: '2023-05-15',
        deploymentName: 'client360-insights'
      },
      ...config
    };
    
    // Initialize client
    this.azureClient = null;
    
    // Track whether provider has been initialized
    this.initialized = false;
    
    // Cache for insights
    this.insightsCache = {
      sales: [],
      brand: [],
      recommendation: []
    };
    
    // Cache expiration time (5 minutes)
    this.cacheExpirationTime = 5 * 60 * 1000;
    this.lastCacheUpdate = null;
  }
  
  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Check if window.isSimulatedData is already defined
      if (typeof window.isSimulatedData === 'undefined') {
        // Default to simulated data if not specified
        window.isSimulatedData = this.config.simulatedDataEnabled;
      }
      
      // Initialize Azure client if needed
      if (!window.isSimulatedData) {
        if (!window.AzureOpenAIClient) {
          throw new Error('AzureOpenAIClient is not available. Make sure azure_openai_client.js is loaded.');
        }
        this.azureClient = new window.AzureOpenAIClient(this.config.azureOpenAIConfig);
      }
      
      this.initialized = true;
      console.log(`AI Insights Provider initialized in ${window.isSimulatedData ? 'simulation' : 'real'} mode`);
    } catch (error) {
      console.error('Failed to initialize AI Insights Provider:', error);
      // Fall back to simulation mode on error
      window.isSimulatedData = true;
      this.initialized = true;
    }
  }
  
  /**
   * Get insights based on current mode
   * @returns {Promise<Array>} Array of insights
   */
  async getInsights() {
    await this.initialize();
    
    // Check cache first
    if (this.isCacheValid()) {
      const allInsights = [
        ...this.insightsCache.sales,
        ...this.insightsCache.brand,
        ...this.insightsCache.recommendation
      ];
      
      if (allInsights.length > 0) {
        return allInsights;
      }
    }
    
    // Load insights based on current mode
    try {
      if (window.isSimulatedData) {
        const insights = await this.loadSimulatedInsights();
        this.updateCache(insights);
        return insights;
      } else {
        const insights = await this.generateRealInsights();
        this.updateCache(insights);
        return insights;
      }
    } catch (error) {
      console.error('Error getting insights:', error);
      
      // Fall back to simulated insights on error
      if (!window.isSimulatedData) {
        console.warn('Falling back to simulated insights due to error');
        return this.loadSimulatedInsights();
      }
      
      // If we're already in simulation mode and that fails, return empty array
      return [];
    }
  }
  
  /**
   * Check if cache is still valid
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.lastCacheUpdate) return false;
    
    const now = Date.now();
    return (now - this.lastCacheUpdate) < this.cacheExpirationTime;
  }
  
  /**
   * Update cache with new insights
   * @param {Array} insights - All insights
   */
  updateCache(insights) {
    // Clear current cache
    this.insightsCache = {
      sales: [],
      brand: [],
      recommendation: []
    };
    
    // Group insights by category
    for (const insight of insights) {
      if (insight.category === 'sales_insights') {
        this.insightsCache.sales.push(insight);
      } else if (insight.category === 'brand_analysis') {
        this.insightsCache.brand.push(insight);
      } else if (insight.category === 'store_recommendations') {
        this.insightsCache.recommendation.push(insight);
      }
    }
    
    // Update timestamp
    this.lastCacheUpdate = Date.now();
  }
  
  /**
   * Load simulated insights from JSON file
   * @returns {Promise<Array>}
   */
  async loadSimulatedInsights() {
    try {
      const response = await fetch(this.config.simulatedInsightsPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load simulated insights: ${response.status} ${response.statusText}`);
      }
      
      const insights = await response.json();
      
      // Mark all insights as simulated
      for (const insight of insights) {
        insight.isSynthetic = true;
        insight.dataSource = 'Synthetic';
      }
      
      return insights;
    } catch (error) {
      console.error('Error loading simulated insights:', error);
      
      // Try fallback to parquet file if available
      if (this.hasParquetSupport()) {
        return this.loadParquetInsights();
      }
      
      throw error;
    }
  }
  
  /**
   * Check if browser has support for reading parquet files
   * @returns {boolean}
   */
  hasParquetSupport() {
    return typeof window.ParquetReader !== 'undefined';
  }
  
  /**
   * Load insights from parquet file (fallback)
   * @returns {Promise<Array>}
   */
  async loadParquetInsights() {
    // This is a placeholder for parquet loading functionality
    // In a real implementation, this would use Apache Arrow or similar
    console.warn('Parquet support not implemented yet, returning empty array');
    return [];
  }
  
  /**
   * Generate real insights using Azure OpenAI API
   * @returns {Promise<Array>}
   */
  async generateRealInsights() {
    if (!this.azureClient) {
      throw new Error('Azure OpenAI client not initialized');
    }
    
    try {
      // For now, we'll generate one insight of each type
      // In a real implementation, we would base this on actual dashboard data
      const mockSalesData = this.getMockSalesData();
      const mockBrandData = this.getMockBrandData();
      const mockStoreData = this.getMockStoreData();
      
      // Generate in parallel
      const [salesInsight, brandInsight, recommendationInsight] = await Promise.all([
        this.azureClient.generateInsights(mockSalesData, 'sales'),
        this.azureClient.generateInsights(mockBrandData, 'brand'),
        this.azureClient.generateInsights(mockStoreData, 'recommendation')
      ]);
      
      return [salesInsight, brandInsight, recommendationInsight];
    } catch (error) {
      console.error('Error generating real insights:', error);
      throw error;
    }
  }
  
  /**
   * Get mock sales data for insight generation
   * @returns {Object}
   */
  getMockSalesData() {
    return {
      entityID: 'sari-001',
      entityName: 'Dela Cruz Sari-Sari Store',
      region: 'National Capital Region',
      cityMunicipality: 'Manila',
      salesData: {
        current: 125000,
        previous: 110000,
        change: 13.64,
        categories: {
          beverages: { current: 45000, previous: 38000, change: 18.42 },
          snacks: { current: 32000, previous: 30000, change: 6.67 },
          household: { current: 28000, previous: 25000, change: 12.0 },
          personal: { current: 20000, previous: 17000, change: 17.65 }
        }
      }
    };
  }
  
  /**
   * Get mock brand data for insight generation
   * @returns {Object}
   */
  getMockBrandData() {
    return {
      entityID: 'coca_cola',
      entityName: 'Coca-Cola',
      region: 'National',
      salesData: {
        marketShare: 0.35,
        customerLoyalty: 0.78,
        repurchaseRate: 0.65,
        regionalPerformance: {
          'National Capital Region': { share: 0.38, growth: 0.05 },
          'Calabarzon': { share: 0.32, growth: 0.02 },
          'Central Luzon': { share: 0.3, growth: 0.01 }
        },
        competitorComparison: [
          { name: 'Pepsi', share: 0.25, growth: 0.01 },
          { name: 'RC Cola', share: 0.15, growth: 0.03 },
          { name: 'Local Brands', share: 0.25, growth: -0.01 }
        ]
      }
    };
  }
  
  /**
   * Get mock store data for recommendation generation
   * @returns {Object}
   */
  getMockStoreData() {
    return {
      entityID: 'sari-001',
      entityName: 'Dela Cruz Sari-Sari Store',
      region: 'National Capital Region',
      cityMunicipality: 'Manila',
      storeMetrics: {
        averageTransaction: 85,
        dailyCustomers: 120,
        operatingHours: '7:00 AM - 8:00 PM',
        topProducts: ['Coca-Cola 8oz', 'Lucky Me Pancit Canton', 'Mang Juan Chips'],
        locationScore: 7.5,
        visibilityScore: 6.8,
        stockLevels: {
          beverages: 0.85,
          snacks: 0.9,
          household: 0.75,
          personal: 0.6
        },
        customerDemographics: {
          age: { '15-24': 0.3, '25-34': 0.4, '35-44': 0.2, '45+': 0.1 },
          gender: { male: 0.45, female: 0.55 }
        }
      }
    };
  }
  
  /**
   * Set data simulation mode
   * @param {boolean} isSimulated - Whether to use simulated data
   */
  setSimulationMode(isSimulated) {
    window.isSimulatedData = !!isSimulated;
    
    // Clear cache when switching modes
    this.lastCacheUpdate = null;
    
    // Initialize Azure client if switching to real mode
    if (!isSimulated && !this.azureClient && window.AzureOpenAIClient) {
      this.azureClient = new window.AzureOpenAIClient(this.config.azureOpenAIConfig);
    }
    
    console.log(`Switched to ${isSimulated ? 'simulation' : 'real'} mode`);
  }
}

// Export the provider
window.AIInsightsProvider = AIInsightsProvider;

// Create global instance for easy access
window.aiInsightsProvider = new AIInsightsProvider();

// Set up listener for data source toggle changes
document.addEventListener('DOMContentLoaded', function() {
  const dataToggle = document.getElementById('data-source-toggle');
  const dataSourceValue = document.getElementById('data-source-value');
  
  if (dataToggle && dataSourceValue) {
    // Set initial toggle state based on isSimulatedData
    dataToggle.checked = !window.isSimulatedData;
    dataSourceValue.textContent = window.isSimulatedData ? 'Simulated' : 'Live';
    
    // Update data source badge in insights section
    const dataBadge = document.querySelector('.ai-insights-section .data-badge');
    if (dataBadge) {
      dataBadge.textContent = window.isSimulatedData ? 'Synthetic Data' : 'Live Data';
      dataBadge.className = `data-badge ${window.isSimulatedData ? 'synthetic' : 'live'}`;
    }
    
    // Add event listener to toggle
    dataToggle.addEventListener('change', function() {
      // Update simulation mode
      window.aiInsightsProvider.setSimulationMode(!this.checked);
      
      // Update UI
      dataSourceValue.textContent = window.isSimulatedData ? 'Simulated' : 'Live';
      
      // Update data source badge in insights section
      if (dataBadge) {
        dataBadge.textContent = window.isSimulatedData ? 'Synthetic Data' : 'Live Data';
        dataBadge.className = `data-badge ${window.isSimulatedData ? 'synthetic' : 'live'}`;
      }
      
      // Reload insights
      const insightsContainer = document.querySelector('.ai-insights-section .insights-container');
      if (insightsContainer) {
        insightsContainer.innerHTML = '<div class="loading-indicator">Loading insights...</div>';
        
        window.aiInsightsProvider.getInsights()
          .then(insights => {
            if (typeof window.renderInsights === 'function') {
              window.renderInsights(insights, insightsContainer);
            } else {
              insightsContainer.innerHTML = '<div class="error-message">Rendering function not available</div>';
            }
          })
          .catch(error => {
            console.error('Error reloading insights:', error);
            insightsContainer.innerHTML = `
              <div class="error-message">
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                  <h4>Unable to load insights</h4>
                  <p>${error.message || 'Please check your connection and try again.'}</p>
                </div>
              </div>
            `;
          });
      }
    });
  }
});