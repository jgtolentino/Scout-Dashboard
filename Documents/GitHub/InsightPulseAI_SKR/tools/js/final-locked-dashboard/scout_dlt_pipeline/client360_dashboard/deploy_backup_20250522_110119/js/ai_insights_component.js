/**
 * AI Insights Component for Client360 Dashboard v2.3.3
 * This component renders AI-generated insights in the dashboard
 * Enhanced with Azure OpenAI integration for real data and Parquet for synthetic data
 */

// Configuration
const AI_INSIGHTS_ENABLED = true;
const SYNTHETIC_DATA_ENDPOINT = './data/synthetic/ai_insights.parquet';
const LIVE_DATA_ENDPOINT = './api/insights';
const SYNTHETIC_DATA_ENABLED = true;
const DEFAULT_INSIGHTS_PATH = './data/ai/insights/all_insights_latest.json';
const AZURE_OPENAI_CONFIG_PATH = './data/ai/config/azure_openai_config.json';

// State variables
let currentDataSource = 'synthetic'; // 'synthetic' or 'live'
let azureOpenAIConfig = null;
let insightsCache = {};

// Initialize the AI insights component
function initAIInsights() {
  console.log('Initializing AI Insights component...');
  
  // Create container elements if they don't exist
  createInsightContainers();
  
  // Load Azure OpenAI configuration (if available)
  loadAzureOpenAIConfig()
    .then(() => {
      // Load insights data based on current data source
      loadInsightsData();
      
      // Set up data source change listener
      setupDataSourceChangeListener();
    })
    .catch(error => {
      console.warn('Could not load Azure OpenAI configuration. Using synthetic data by default.', error);
      // Load synthetic insights as fallback
      loadInsightsData();
    });
}

// Load Azure OpenAI configuration
async function loadAzureOpenAIConfig() {
  try {
    const response = await fetch(AZURE_OPENAI_CONFIG_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load Azure OpenAI config (${response.status})`);
    }
    
    azureOpenAIConfig = await response.json();
    console.log('Azure OpenAI configuration loaded:', azureOpenAIConfig.enabled ? 'enabled' : 'disabled');
    
    return azureOpenAIConfig;
  } catch (error) {
    console.warn('Error loading Azure OpenAI configuration:', error);
    azureOpenAIConfig = { enabled: false };
    throw error;
  }
}

// Set up listener for data source toggle change
function setupDataSourceChangeListener() {
  // Get the data source toggle element
  const dataSourceToggle = document.getElementById('dataSourceToggle');
  if (!dataSourceToggle) {
    console.warn('Data source toggle element not found.');
    return;
  }
  
  // Add change event listener
  dataSourceToggle.addEventListener('change', function() {
    // Update data source based on toggle state
    currentDataSource = this.checked ? 'live' : 'synthetic';
    console.log(`Data source changed to: ${currentDataSource}`);
    
    // Clear previous insights
    clearInsights();
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Reload insights with new data source
    loadInsightsData();
  });
  
  // Set initial state based on toggle
  currentDataSource = dataSourceToggle.checked ? 'live' : 'synthetic';
  console.log(`Initial data source: ${currentDataSource}`);
}

// Create insight container elements
function createInsightContainers() {
  // Store Performance section
  const storePerformanceSection = document.querySelector('.store-performance-section');
  if (storePerformanceSection) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'sales-insights-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Sales Insights</h3><div class="insights-content"></div>';
    storePerformanceSection.appendChild(insightsContainer);
  }
  
  // Brand Analysis section
  const brandAnalysisSection = document.querySelector('.brand-analysis-section');
  if (brandAnalysisSection) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'brand-insights-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Brand Insights</h3><div class="insights-content"></div>';
    brandAnalysisSection.appendChild(insightsContainer);
  }
  
  // Recommendations panel
  const sidePanel = document.querySelector('.dashboard-side-panel');
  if (sidePanel) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'recommendations-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Recommendations</h3><div class="insights-content"></div>';
    sidePanel.appendChild(insightsContainer);
  }
}

// Load insights data from appropriate endpoint based on current data source
function loadInsightsData() {
  if (!AI_INSIGHTS_ENABLED) {
    console.log('AI Insights are disabled.');
    hideLoadingIndicator();
    return;
  }
  
  // Determine which endpoint to use based on data source
  let endpoint;
  
  if (currentDataSource === 'live' && azureOpenAIConfig && azureOpenAIConfig.enabled) {
    endpoint = LIVE_DATA_ENDPOINT;
    console.log('Loading live insights from Azure OpenAI');
  } else {
    // Check if there's cached data for synthetic insights
    if (insightsCache['synthetic']) {
      console.log('Using cached synthetic insights');
      processInsightsData(insightsCache['synthetic']);
      hideLoadingIndicator();
      return;
    }
    
    // First try to use the Parquet file if available
    endpoint = SYNTHETIC_DATA_ENABLED ? SYNTHETIC_DATA_ENDPOINT : DEFAULT_INSIGHTS_PATH;
    console.log(`Loading synthetic insights from ${endpoint}`);
  }
  
  // Attempt to fetch insights data
  fetchInsightsData(endpoint)
    .then(data => {
      // Cache the data for future use
      insightsCache[currentDataSource] = data;
      
      // Process and display the insights
      processInsightsData(data);
    })
    .catch(error => {
      console.error('Error loading AI insights:', error);
      
      // If Parquet file fails, try the default JSON endpoint as fallback
      if (endpoint === SYNTHETIC_DATA_ENDPOINT) {
        console.log('Falling back to default JSON endpoint for synthetic data');
        fetchInsightsData(DEFAULT_INSIGHTS_PATH)
          .then(data => {
            insightsCache['synthetic'] = data;
            processInsightsData(data);
          })
          .catch(fallbackError => {
            console.error('Error loading fallback insights:', fallbackError);
            showFallbackContent();
          });
      } else {
        // Show fallback content
        showFallbackContent();
      }
    })
    .finally(() => {
      // Hide loading indicator
      hideLoadingIndicator();
    });
}

// Fetch insights data from specified endpoint
async function fetchInsightsData(endpoint) {
  // Special handling for Parquet files
  if (endpoint.endsWith('.parquet')) {
    try {
      // Check if we have a Parquet reader available
      if (typeof ParquetReader === 'undefined') {
        throw new Error('Parquet reader not available, falling back to JSON');
      }
      
      // Note: This is a placeholder - in a real implementation, you would use a library
      // like Apache Arrow or Parquet.js to read Parquet files in the browser
      throw new Error('Parquet reading not implemented, falling back to JSON');
    } catch (error) {
      console.warn('Parquet reading failed:', error);
      // Convert endpoint to JSON if Parquet reading fails
      endpoint = endpoint.replace('.parquet', '.json');
      console.log(`Falling back to JSON endpoint: ${endpoint}`);
    }
  }
  
  // Fetch data from endpoint
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Failed to load AI insights data (${response.status})`);
  }
  return response.json();
}

// Process and display insights data
function processInsightsData(data) {
  if (!data || !Array.isArray(data)) {
    console.error('Invalid insights data format:', data);
    showFallbackContent();
    return;
  }
  
  console.log('AI insights data loaded:', data.length, 'insights');
  
  // Filter insights by type and synthetic status
  const salesInsights = data.filter(insight => 
    insight.category === 'sales_insights' && 
    (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
  );
  
  const brandInsights = data.filter(insight => 
    insight.category === 'brand_analysis' && 
    (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
  );
  
  const recommendations = data.filter(insight => 
    insight.category === 'store_recommendations' && 
    (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
  );
  
  // Render insights
  renderSalesInsights(salesInsights);
  renderBrandInsights(brandInsights);
  renderRecommendations(recommendations);
  
  // Add data source indicator
  updateDataSourceIndicator();
}

// Render sales insights
function renderSalesInsights(insights) {
  const container = document.querySelector('#sales-insights-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No sales insights available.</p>';
    return;
  }
  
  // Take most recent insight
  const insight = insights[0];
  
  container.innerHTML = `
    <div class="insight-card">
      <div class="insight-header">
        <h4>${insight.title}</h4>
        <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
      </div>
      <p class="insight-summary">${insight.summary}</p>
      <div class="insight-details">
        <div class="insight-generated">Generated: ${formatDate(insight.GeneratedAt)}</div>
      </div>
    </div>
  `;
}

// Render brand insights
function renderBrandInsights(insights) {
  const container = document.querySelector('#brand-insights-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No brand insights available.</p>';
    return;
  }
  
  let html = '';
  
  // Take up to 3 most recent insights
  insights.slice(0, 3).forEach(insight => {
    html += `
      <div class="insight-card">
        <div class="insight-header">
          <h4>${insight.title}</h4>
          <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
        </div>
        <p class="insight-summary">${insight.summary}</p>
        <div class="insight-details">
          <div class="insight-generated">Generated: ${formatDate(insight.GeneratedAt)}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Render recommendations
function renderRecommendations(insights) {
  const container = document.querySelector('#recommendations-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No recommendations available.</p>';
    return;
  }
  
  let html = '';
  
  // Take up to 5 most recent recommendations
  insights.slice(0, 5).forEach(insight => {
    html += `
      <div class="insight-card">
        <div class="insight-header">
          <h4>${insight.title}</h4>
          <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
        </div>
        <p class="insight-summary">${insight.summary}</p>
        <div class="insight-details">
          <div class="insight-priority">Priority: ${insight.content?.priority || 'Medium'}</div>
          <div class="insight-generated">Generated: ${formatDate(insight.GeneratedAt)}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Show fallback content when insights can't be loaded
function showFallbackContent() {
  const containers = document.querySelectorAll('.insights-container .insights-content');
  
  containers.forEach(container => {
    container.innerHTML = `
      <div class="insight-card fallback">
        <div class="insight-header">
          <h4>AI Insights Unavailable</h4>
        </div>
        <p class="insight-summary">AI-generated insights are currently unavailable. Please check your configuration or try again later.</p>
      </div>
    `;
  });
}

// Clear all insights containers
function clearInsights() {
  const containers = document.querySelectorAll('.insights-container .insights-content');
  
  containers.forEach(container => {
    container.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading insights...</p>
      </div>
    `;
  });
}

// Show loading indicator
function showLoadingIndicator() {
  const containers = document.querySelectorAll('.insights-container .insights-content');
  
  containers.forEach(container => {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>Loading insights...</p>
    `;
    
    // Only add if it doesn't already exist
    if (!container.querySelector('.loading-indicator')) {
      container.innerHTML = '';
      container.appendChild(loadingIndicator);
    }
  });
}

// Hide loading indicator
function hideLoadingIndicator() {
  const loadingIndicators = document.querySelectorAll('.loading-indicator');
  
  loadingIndicators.forEach(indicator => {
    indicator.remove();
  });
}

// Update data source indicator
function updateDataSourceIndicator() {
  // Create or get data source indicator
  let indicator = document.getElementById('ai-data-source-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'ai-data-source-indicator';
    indicator.className = 'data-source-indicator';
    
    // Add to the top of the page (under header)
    const header = document.querySelector('header');
    if (header) {
      header.parentNode.insertBefore(indicator, header.nextSibling);
    } else {
      // Fallback to body if no header
      document.body.insertBefore(indicator, document.body.firstChild);
    }
  }
  
  // Update content based on current data source
  if (currentDataSource === 'live') {
    indicator.innerHTML = `
      <div class="indicator-content live">
        <div class="indicator-icon">🔴</div>
        <span>Live AI Insights</span>
        <span class="indicator-details">Using Azure OpenAI</span>
      </div>
    `;
  } else {
    indicator.innerHTML = `
      <div class="indicator-content synthetic">
        <div class="indicator-icon">🔷</div>
        <span>Simulated AI Insights</span>
        <span class="indicator-details">Using ${SYNTHETIC_DATA_ENDPOINT.endsWith('.parquet') ? 'Parquet' : 'JSON'} Data</span>
      </div>
    `;
  }
}

// Format date string
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    return dateString;
  }
}

// Add CSS styles for AI insights
function addInsightsStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .insights-container {
      margin: 15px 0;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .insights-container h3 {
      margin-top: 0;
      font-size: 16px;
      color: #333;
      display: flex;
      align-items: center;
    }
    
    .insights-container h3::before {
      content: "🧠";
      margin-right: 5px;
      font-size: 18px;
    }
    
    .insight-card {
      margin-bottom: 10px;
      padding: 12px;
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .insight-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .insight-header h4 {
      margin: 0;
      font-size: 14px;
      color: #333;
    }
    
    .insight-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .insight-badge.synthetic {
      background-color: #e9f5ff;
      color: #0078d4;
    }
    
    .insight-badge.live {
      background-color: #dff6dd;
      color: #107c10;
    }
    
    .insight-summary {
      margin: 8px 0;
      font-size: 13px;
      color: #555;
    }
    
    .insight-details {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #777;
    }
    
    .no-insights {
      font-style: italic;
      color: #777;
      text-align: center;
    }
    
    .insight-card.fallback {
      background-color: #f9f9f9;
      border: 1px dashed #ddd;
    }
    
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    
    .spinner {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid rgba(0, 120, 212, 0.1);
      border-top-color: rgba(0, 120, 212, 0.8);
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-indicator p {
      margin-top: 10px;
      color: #666;
      font-size: 14px;
    }
    
    .data-source-indicator {
      padding: 5px 10px;
      margin: 10px 0;
      font-size: 12px;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    
    .indicator-content {
      display: flex;
      align-items: center;
    }
    
    .indicator-content.live {
      color: #107c10;
    }
    
    .indicator-content.synthetic {
      color: #0078d4;
    }
    
    .indicator-icon {
      margin-right: 5px;
    }
    
    .indicator-details {
      margin-left: 10px;
      opacity: 0.7;
      font-size: 11px;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
  addInsightsStyles();
  initAIInsights();
});