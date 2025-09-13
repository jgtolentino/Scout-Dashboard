/**
 * Client360 Dashboard - AI Insights Component
 * Version 2.4.0
 */

// Configuration
const AI_CONFIG = {
  // Environment-specific settings
  SYNTHETIC_DATA_ENABLED: true, // Always have synthetic data as a fallback
  SYNTHETIC_DATA_PATH: '/data/synthetic/ai_insights.parquet',
  AZURE_OPENAI_ENABLED: true,
  
  // General settings
  INSIGHTS_PER_PAGE: 3,
  REFRESH_INTERVAL_MINUTES: 30
};

// Cache for data
const AI_INSIGHTS_CACHE = {
  live: null,
  synthetic: null,
  lastFetch: {
    live: null,
    synthetic: null
  }
};

/**
 * Initialize the AI Insights component
 */
function initializeAIInsights() {
  console.log('Initializing AI Insights component');
  
  // Listen for data source changes
  document.addEventListener('dataSourceChanged', handleDataSourceChange);
  
  // Get the current data source or default to synthetic
  const dataSource = window.DATA_SOURCE || localStorage.getItem('dataSource') || 'synthetic';
  
  // Initial load of insights
  loadInsights(dataSource);
  
  // Set up filter handlers
  setupInsightFilters();
}

/**
 * Handle data source change event
 * @param {CustomEvent} event - Data source change event
 */
function handleDataSourceChange(event) {
  const { source } = event.detail;
  console.log('Data source changed to: ' + source);
  
  // Load insights for the new data source
  loadInsights(source);
}

/**
 * Load insights data based on current data source
 * @param {string} source - 'live' or 'synthetic'
 */
function loadInsights(source) {
  const container = document.getElementById('aiInsightsContainer');
  if (!container) return;
  
  // Show loading state
  container.innerHTML = '<div class="loading">Loading AI insights...</div>';
  
  // Check if we have cached data that's still fresh
  const now = new Date();
  const cacheTTL = AI_CONFIG.REFRESH_INTERVAL_MINUTES * 60 * 1000; // in ms
  
  if (
    AI_INSIGHTS_CACHE[source] && 
    AI_INSIGHTS_CACHE.lastFetch[source] && 
    (now - AI_INSIGHTS_CACHE.lastFetch[source]) < cacheTTL
  ) {
    // Use cached data
    renderInsights(AI_INSIGHTS_CACHE[source], source);
    return;
  }
  
  // Load fresh data
  if (source === 'live' && AI_CONFIG.AZURE_OPENAI_ENABLED) {
    // Load from Azure OpenAI
    fetch('/api/ai-insights')
      .then(response => response.json())
      .then(data => {
        AI_INSIGHTS_CACHE.live = data;
        AI_INSIGHTS_CACHE.lastFetch.live = now;
        renderInsights(data, 'live');
      })
      .catch(error => {
        console.error('Error fetching live AI insights:', error);
        // Fallback to synthetic data
        loadInsights('synthetic');
      });
  } else {
    // Load synthetic data from Parquet files
    if (AI_CONFIG.SYNTHETIC_DATA_ENABLED) {
      // In a real implementation, we'd have a proper Parquet loader
      // For now, simulate with a JSON fetch
      fetch('/data/ai/insights/all_insights_latest.json')
        .then(response => response.json())
        .then(data => {
          // Add synthetic flag to all entries
          data = data.map(item => ({
            ...item,
            isSynthetic: true
          }));
          
          AI_INSIGHTS_CACHE.synthetic = data;
          AI_INSIGHTS_CACHE.lastFetch.synthetic = now;
          renderInsights(data, 'synthetic');
        })
        .catch(error => {
          console.error('Error fetching synthetic AI insights:', error);
          container.innerHTML = '<div class="error">Failed to load AI insights</div>';
        });
    } else {
      container.innerHTML = '<div class="error">No data source available for AI insights</div>';
    }
  }
}

/**
 * Render insights to the container
 * @param {Array} insights - Array of insight objects
 * @param {string} source - Data source ('live' or 'synthetic')
 */
function renderInsights(insights, source) {
  const container = document.getElementById('aiInsightsContainer');
  if (!container) return;
  
  if (!insights || insights.length === 0) {
    container.innerHTML = '<div class="empty-state">No AI insights available</div>';
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Create data source badge
  const badge = document.createElement('div');
  badge.className = 'data-source-badge ' + (source === 'live' ? 'badge-primary' : 'badge-secondary');
  badge.textContent = source === 'live' ? 'Live Data' : 'Simulated Data';
  container.appendChild(badge);
  
  // Create insights container
  const insightsElement = document.createElement('div');
  insightsElement.className = 'insights-grid';
  
  // Add insights cards
  insights.forEach(insight => {
    const card = createInsightCard(insight);
    insightsElement.appendChild(card);
  });
  
  container.appendChild(insightsElement);
}

/**
 * Create an insight card element
 * @param {Object} insight - Insight data object
 * @return {HTMLElement} - Card element
 */
function createInsightCard(insight) {
  const card = document.createElement('div');
  card.className = 'insight-card ' + insight.type;
  card.dataset.category = insight.category || 'general';
  
  // Card header
  const header = document.createElement('div');
  header.className = 'insight-header';
  
  const title = document.createElement('h3');
  title.textContent = insight.title;
  header.appendChild(title);
  
  const type = document.createElement('span');
  type.className = 'insight-type';
  type.textContent = formatInsightType(insight.type);
  header.appendChild(type);
  
  card.appendChild(header);
  
  // Card content
  const content = document.createElement('div');
  content.className = 'insight-content';
  content.textContent = insight.content;
  card.appendChild(content);
  
  // Card footer
  const footer = document.createElement('div');
  footer.className = 'insight-footer';
  
  const date = document.createElement('span');
  date.className = 'insight-date';
  date.textContent = formatDate(insight.date);
  footer.appendChild(date);
  
  if (insight.confidence) {
    const confidence = document.createElement('span');
    confidence.className = 'insight-confidence';
    confidence.textContent = 'Confidence: ' + Math.round(insight.confidence * 100) + '%';
    footer.appendChild(confidence);
  }
  
  card.appendChild(footer);
  
  // Make card expandable
  card.addEventListener('click', () => {
    card.classList.toggle('expanded');
  });
  
  return card;
}

/**
 * Format insight type for display
 * @param {string} type - Raw insight type
 * @return {string} - Formatted insight type
 */
function formatInsightType(type) {
  if (!type) return 'General Insight';
  
  switch (type) {
    case 'sales_performance':
      return 'Sales Performance';
    case 'brand_analysis':
      return 'Brand Analysis';
    case 'recommendation':
      return 'Recommendation';
    default:
      return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
}

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @return {string} - Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Set up insight filter handlers
 */
function setupInsightFilters() {
  const filterSelect = document.getElementById('insightTypeFilter');
  if (!filterSelect) return;
  
  filterSelect.addEventListener('change', event => {
    const selectedType = event.target.value;
    const cards = document.querySelectorAll('.insight-card');
    
    cards.forEach(card => {
      if (selectedType === 'all' || card.classList.contains(selectedType)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAIInsights);
