/**
 * Market Context Panel Component
 * Adds industry, market, and competitor context to brand dashboards
 */

/**
 * Initialize the Market Context Panel component
 * @param {string} containerSelector - CSS selector for container element
 * @param {object} options - Configuration options
 * @returns {object} - Component controller
 */
function initMarketContextPanel(containerSelector, options = {}) {
  // Default options
  const defaultOptions = {
    apiBaseUrl: '/api/market-data',
    defaultBrand: null,
    providers: ['bloomberg', 'spglobal', 'brandwatch'],
    refreshInterval: 3600, // seconds
    height: 380,
    showHeader: true,
    theme: 'light'
  };
  
  // Merge options
  const config = { ...defaultOptions, ...options };
  
  // Get container element
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Market Context Panel: Container not found - ${containerSelector}`);
    return null;
  }
  
  // Create panel structure
  container.classList.add('market-context-panel');
  container.innerHTML = `
    <div class="market-panel-header">
      <h3 class="market-panel-title">Market Context</h3>
      <div class="market-panel-actions">
        <button class="market-panel-refresh" title="Refresh data">
          <i class="bx bx-refresh"></i>
        </button>
        <button class="market-panel-expand" title="Expand">
          <i class="bx bx-expand-alt"></i>
        </button>
      </div>
    </div>
    <div class="market-panel-content">
      <div class="market-panel-tabs">
        <button class="market-tab active" data-tab="overview">Overview</button>
        <button class="market-tab" data-tab="financials">Financials</button>
        <button class="market-tab" data-tab="sentiment">Social Sentiment</button>
        <button class="market-tab" data-tab="competitors">Competitors</button>
      </div>
      <div class="market-tab-content">
        <!-- Tab content will be dynamically inserted here -->
        <div class="market-loading">
          <div class="market-spinner"></div>
          <div class="market-loading-text">Loading market data...</div>
        </div>
      </div>
    </div>
    <div class="market-panel-footer">
      <div class="market-data-providers">
        <span class="market-data-source">Data sources: </span>
        <span class="market-data-provider">Bloomberg</span>
        <span class="market-data-provider">S&P Global</span>
        <span class="market-data-provider">Brandwatch</span>
      </div>
      <div class="market-timestamp">Last updated: <span class="market-update-time">Just now</span></div>
    </div>
  `;
  
  // Add styles
  addStyles(config.theme);
  
  // Initialize state
  const state = {
    currentBrand: config.defaultBrand,
    currentTab: 'overview',
    isLoading: false,
    lastUpdate: new Date(),
    data: {
      overview: null,
      financials: null,
      sentiment: null,
      competitors: null
    }
  };
  
  // DOM elements
  const elements = {
    header: container.querySelector('.market-panel-header'),
    tabButtons: container.querySelectorAll('.market-tab'),
    tabContent: container.querySelector('.market-tab-content'),
    refreshButton: container.querySelector('.market-panel-refresh'),
    expandButton: container.querySelector('.market-panel-expand'),
    updateTime: container.querySelector('.market-update-time'),
    loadingIndicator: container.querySelector('.market-loading')
  };
  
  // Hide header if specified
  if (!config.showHeader) {
    elements.header.style.display = 'none';
  }
  
  // Set container height
  container.style.height = `${config.height}px`;
  
  // Event handlers
  
  // Tab switching
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Refresh button
  elements.refreshButton.addEventListener('click', () => {
    refreshData();
  });
  
  // Expand button
  elements.expandButton.addEventListener('click', () => {
    expandPanel();
  });
  
  /**
   * Switch to a different tab
   * @param {string} tabName - Tab name to switch to
   */
  function switchTab(tabName) {
    // Update active tab button
    elements.tabButtons.forEach(button => {
      if (button.getAttribute('data-tab') === tabName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update state
    state.currentTab = tabName;
    
    // Load tab content if needed
    if (!state.data[tabName]) {
      loadTabData(tabName);
    } else {
      renderTabContent(tabName, state.data[tabName]);
    }
  }
  
  /**
   * Load data for a specific tab
   * @param {string} tabName - Tab to load data for
   */
  async function loadTabData(tabName) {
    if (!state.currentBrand) {
      renderEmptyState('Select a brand to view market context');
      return;
    }
    
    showLoading(true);
    
    try {
      let provider, dataType;
      
      // Determine which provider and data type to use for this tab
      switch (tabName) {
        case 'overview':
          provider = 'bloomberg';
          dataType = 'summary';
          break;
        case 'financials':
          provider = 'bloomberg';
          dataType = 'financials';
          break;
        case 'sentiment':
          provider = 'brandwatch';
          dataType = 'summary';
          break;
        case 'competitors':
          provider = 'spglobal';
          dataType = 'industry';
          break;
        default:
          provider = 'bloomberg';
          dataType = 'summary';
      }
      
      // Fetch data from API
      const response = await fetch(
        `${config.apiBaseUrl}/${provider}?entity=${encodeURIComponent(state.currentBrand)}&dataType=${dataType}`
      );
      
      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Update state
      state.data[tabName] = data;
      state.lastUpdate = new Date();
      elements.updateTime.textContent = formatTimeAgo(state.lastUpdate);
      
      // Render content
      renderTabContent(tabName, data);
    } catch (error) {
      console.error(`Error loading market data for ${tabName}: ${error.message}`);
      renderErrorState(error.message);
    } finally {
      showLoading(false);
    }
  }
  
  /**
   * Render tab content based on data
   * @param {string} tabName - Tab name
   * @param {object} data - Data to render
   */
  function renderTabContent(tabName, data) {
    // Clear existing content
    elements.tabContent.innerHTML = '';
    
    // Render based on tab type
    switch (tabName) {
      case 'overview':
        renderOverviewTab(data);
        break;
      case 'financials':
        renderFinancialsTab(data);
        break;
      case 'sentiment':
        renderSentimentTab(data);
        break;
      case 'competitors':
        renderCompetitorsTab(data);
        break;
      default:
        renderOverviewTab(data);
    }
  }
  
  /**
   * Render the overview tab
   * @param {object} data - Overview data
   */
  function renderOverviewTab(data) {
    if (!data || !data.data) {
      renderEmptyState('No overview data available');
      return;
    }
    
    const company = data.data;
    
    const html = `
      <div class="market-overview">
        <div class="market-company-header">
          <h3 class="market-company-name">${company.name}</h3>
          ${company.ticker ? `<span class="market-company-ticker">${company.ticker}</span>` : ''}
        </div>
        
        <div class="market-data-grid">
          <div class="market-data-item">
            <div class="market-data-label">Industry</div>
            <div class="market-data-value">${company.industry || 'N/A'}</div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Sector</div>
            <div class="market-data-value">${company.sector || 'N/A'}</div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Exchange</div>
            <div class="market-data-value">${company.exchange || 'N/A'}</div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Market Cap</div>
            <div class="market-data-value">${formatCurrency(company.marketCap) || 'N/A'}</div>
          </div>
          ${company.price ? `
          <div class="market-data-item">
            <div class="market-data-label">Price</div>
            <div class="market-data-value">${formatCurrency(company.price)}</div>
          </div>
          ` : ''}
          ${company.percentChange ? `
          <div class="market-data-item">
            <div class="market-data-label">Change</div>
            <div class="market-data-value ${company.percentChange >= 0 ? 'positive' : 'negative'}">
              ${company.percentChange >= 0 ? '+' : ''}${company.percentChange}%
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    elements.tabContent.innerHTML = html;
  }
  
  /**
   * Render the financials tab
   * @param {object} data - Financials data
   */
  function renderFinancialsTab(data) {
    if (!data || !data.data) {
      renderEmptyState('No financial data available');
      return;
    }
    
    const financials = data.data;
    
    const html = `
      <div class="market-financials">
        <div class="market-financials-header">
          <h3 class="market-financials-title">Financial Highlights</h3>
        </div>
        
        <div class="market-data-grid">
          ${renderFinancialMetric('Revenue', financials.revenue)}
          ${renderFinancialMetric('Net Income', financials.netIncome)}
          ${renderFinancialMetric('EPS', financials.eps)}
          ${renderFinancialMetric('P/E Ratio', financials.peRatio)}
        </div>
      </div>
    `;
    
    elements.tabContent.innerHTML = html;
  }
  
  /**
   * Render the sentiment tab
   * @param {object} data - Sentiment data
   */
  function renderSentimentTab(data) {
    if (!data || !data.data) {
      renderEmptyState('No sentiment data available');
      return;
    }
    
    const sentiment = data.data;
    
    const html = `
      <div class="market-sentiment">
        <div class="market-sentiment-header">
          <h3 class="market-sentiment-title">Social Sentiment</h3>
        </div>
        
        <div class="market-data-grid">
          <div class="market-data-item">
            <div class="market-data-label">Total Mentions</div>
            <div class="market-data-value">${formatNumber(sentiment.totalMentions)}</div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Sentiment Score</div>
            <div class="market-data-value ${getSentimentClass(sentiment.sentimentScore)}">
              ${sentiment.sentimentScore}%
            </div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Positive Mentions</div>
            <div class="market-data-value positive">${formatNumber(sentiment.positiveMentions)}</div>
          </div>
          <div class="market-data-item">
            <div class="market-data-label">Negative Mentions</div>
            <div class="market-data-value negative">${formatNumber(sentiment.negativeMentions)}</div>
          </div>
        </div>
        
        ${sentiment.topSources && sentiment.topSources.length > 0 ? `
        <div class="market-sources">
          <h4 class="market-section-title">Top Sources</h4>
          <ul class="market-sources-list">
            ${sentiment.topSources.slice(0, 5).map(source => `
              <li class="market-source-item">
                <span class="market-source-name">${source.name}</span>
                <span class="market-source-value">${formatNumber(source.count)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    `;
    
    elements.tabContent.innerHTML = html;
  }
  
  /**
   * Render the competitors tab
   * @param {object} data - Competitors data
   */
  function renderCompetitorsTab(data) {
    if (!data || !data.data) {
      renderEmptyState('No competitor data available');
      return;
    }
    
    const competitors = data.data;
    
    const html = `
      <div class="market-competitors">
        <div class="market-competitors-header">
          <h3 class="market-competitors-title">Competitive Landscape</h3>
        </div>
        
        ${competitors.peers && competitors.peers.length > 0 ? `
        <div class="market-peer-companies">
          <h4 class="market-section-title">Peer Companies</h4>
          <ul class="market-peers-list">
            ${competitors.peers.slice(0, 6).map(peer => `
              <li class="market-peer-item">
                <span class="market-peer-name">${peer.name}</span>
                <span class="market-peer-value">${formatCurrency(peer.marketCap)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        <div class="market-peer-metrics">
          <h4 class="market-section-title">Industry Metrics</h4>
          <div class="market-data-grid">
            ${renderIndustryMetric('Average P/E', competitors.industryMetrics?.averagePE)}
            ${renderIndustryMetric('Average Growth', competitors.industryMetrics?.averageGrowth, '%')}
            ${renderIndustryMetric('Average Margin', competitors.industryMetrics?.averageMargin, '%')}
          </div>
        </div>
      </div>
    `;
    
    elements.tabContent.innerHTML = html;
  }
  
  /**
   * Render a financial metric
   * @param {string} label - Metric label
   * @param {object} metric - Metric data
   * @returns {string} - HTML for metric
   */
  function renderFinancialMetric(label, metric) {
    if (!metric) {
      return `
        <div class="market-data-item">
          <div class="market-data-label">${label}</div>
          <div class="market-data-value">N/A</div>
        </div>
      `;
    }
    
    return `
      <div class="market-data-item">
        <div class="market-data-label">${label}</div>
        <div class="market-data-value">
          ${formatValue(metric.value, metric.unit)}
          ${metric.period ? `<span class="market-data-period">${metric.period}</span>` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Render an industry metric
   * @param {string} label - Metric label
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   * @returns {string} - HTML for metric
   */
  function renderIndustryMetric(label, value, unit = '') {
    return `
      <div class="market-data-item">
        <div class="market-data-label">${label}</div>
        <div class="market-data-value">${value ? value + unit : 'N/A'}</div>
      </div>
    `;
  }
  
  /**
   * Render empty state message
   * @param {string} message - Message to display
   */
  function renderEmptyState(message) {
    elements.tabContent.innerHTML = `
      <div class="market-empty-state">
        <i class="bx bx-info-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Render error state
   * @param {string} message - Error message
   */
  function renderErrorState(message) {
    elements.tabContent.innerHTML = `
      <div class="market-error-state">
        <i class="bx bx-error-circle"></i>
        <p>Error loading market data</p>
        <p class="market-error-message">${message}</p>
        <button class="market-retry-button">Retry</button>
      </div>
    `;
    
    // Add retry button handler
    const retryButton = elements.tabContent.querySelector('.market-retry-button');
    retryButton.addEventListener('click', () => {
      loadTabData(state.currentTab);
    });
  }
  
  /**
   * Show or hide loading indicator
   * @param {boolean} isLoading - Whether loading is in progress
   */
  function showLoading(isLoading) {
    state.isLoading = isLoading;
    
    if (isLoading) {
      elements.tabContent.innerHTML = `
        <div class="market-loading">
          <div class="market-spinner"></div>
          <div class="market-loading-text">Loading market data...</div>
        </div>
      `;
    }
  }
  
  /**
   * Refresh all data
   */
  function refreshData() {
    // Clear existing data
    state.data = {
      overview: null,
      financials: null,
      sentiment: null,
      competitors: null
    };
    
    // Load current tab
    loadTabData(state.currentTab);
    
    // Update timestamp
    state.lastUpdate = new Date();
    elements.updateTime.textContent = 'Just now';
  }
  
  /**
   * Expand panel to full screen
   */
  function expandPanel() {
    // Implementation depends on the dashboard framework
    alert('Expand functionality would open a full-screen market data view');
  }
  
  /**
   * Set the current brand
   * @param {string} brand - Brand name
   */
  function setBrand(brand) {
    if (brand === state.currentBrand) {
      return;
    }
    
    state.currentBrand = brand;
    
    // Clear existing data
    state.data = {
      overview: null,
      financials: null,
      sentiment: null,
      competitors: null
    };
    
    // Load current tab for new brand
    loadTabData(state.currentTab);
  }
  
  // Initialization
  
  // Load initial data if default brand is set
  if (config.defaultBrand) {
    setBrand(config.defaultBrand);
  } else {
    renderEmptyState('Select a brand to view market context');
  }
  
  // Set up auto-refresh if specified
  if (config.refreshInterval > 0) {
    setInterval(refreshData, config.refreshInterval * 1000);
  }
  
  // Return public API
  return {
    setBrand,
    refreshData,
    switchTab,
    expandPanel,
    getCurrentBrand: () => state.currentBrand,
    getCurrentTab: () => state.currentTab,
    getLastUpdate: () => state.lastUpdate
  };
}

// Helper functions

/**
 * Format a value with unit
 * @param {number} value - Value to format
 * @param {string} unit - Unit of measurement
 * @returns {string} - Formatted value
 */
function formatValue(value, unit) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (unit === '$') {
    return formatCurrency(value);
  }
  
  return `${formatNumber(value)}${unit ? ' ' + unit : ''}`;
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} - Formatted currency
 */
function formatCurrency(value) {
  if (!value && value !== 0) {
    return 'N/A';
  }
  
  // Format based on magnitude
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format number with thousand separators
 * @param {number} value - Value to format
 * @returns {string} - Formatted number
 */
function formatNumber(value) {
  if (!value && value !== 0) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat().format(value);
}

/**
 * Get CSS class for sentiment score
 * @param {number} score - Sentiment score (0-100)
 * @returns {string} - CSS class
 */
function getSentimentClass(score) {
  if (score >= 70) {
    return 'positive';
  } else if (score >= 40) {
    return 'neutral';
  } else {
    return 'negative';
  }
}

/**
 * Format time as "X time ago"
 * @param {Date} date - Date to format
 * @returns {string} - Formatted time
 */
function formatTimeAgo(date) {
  const now = new Date();
  const secondsAgo = Math.floor((now - date) / 1000);
  
  if (secondsAgo < 60) {
    return 'Just now';
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Add component styles to the document
 * @param {string} theme - Theme name ('light' or 'dark')
 */
function addStyles(theme = 'light') {
  // Define theme colors
  const colors = {
    light: {
      background: '#ffffff',
      text: '#333333',
      border: '#e0e0e0',
      headerBg: '#f5f7fa',
      tabActiveBg: '#ffffff',
      tabActiveBorder: '#3f51b5',
      positive: '#4caf50',
      negative: '#f44336',
      neutral: '#ff9800'
    },
    dark: {
      background: '#2d3748',
      text: '#e2e8f0',
      border: '#4a5568',
      headerBg: '#1a202c',
      tabActiveBg: '#2d3748',
      tabActiveBorder: '#63b3ed',
      positive: '#68d391',
      negative: '#fc8181',
      neutral: '#f6ad55'
    }
  };
  
  // Use selected theme
  const themeColors = colors[theme] || colors.light;
  
  // Create style element
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    .market-context-panel {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: ${themeColors.background};
      color: ${themeColors.text};
      border-radius: 8px;
      border: 1px solid ${themeColors.border};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      height: 380px;
    }
    
    .market-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid ${themeColors.border};
      background-color: ${themeColors.headerBg};
    }
    
    .market-panel-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .market-panel-actions {
      display: flex;
      gap: 8px;
    }
    
    .market-panel-actions button {
      background: transparent;
      border: none;
      cursor: pointer;
      color: ${themeColors.text};
      opacity: 0.7;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
    }
    
    .market-panel-actions button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .market-panel-content {
      flex: 1;
      overflow: auto;
      position: relative;
    }
    
    .market-panel-tabs {
      display: flex;
      border-bottom: 1px solid ${themeColors.border};
      background-color: ${themeColors.headerBg};
    }
    
    .market-tab {
      padding: 10px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: ${themeColors.text};
      opacity: 0.7;
      position: relative;
    }
    
    .market-tab:hover {
      opacity: 1;
    }
    
    .market-tab.active {
      opacity: 1;
      background-color: ${themeColors.tabActiveBg};
    }
    
    .market-tab.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: ${themeColors.tabActiveBorder};
    }
    
    .market-tab-content {
      padding: 16px;
      overflow: auto;
      height: calc(100% - 43px);
    }
    
    .market-panel-footer {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px;
      border-top: 1px solid ${themeColors.border};
      font-size: 12px;
      color: rgba(${theme === 'light' ? '0, 0, 0, 0.6' : '255, 255, 255, 0.6'});
    }
    
    .market-data-providers {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .market-data-provider {
      font-weight: 500;
    }
    
    .market-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: rgba(${theme === 'light' ? '0, 0, 0, 0.5' : '255, 255, 255, 0.5'});
    }
    
    .market-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(${theme === 'light' ? '0, 0, 0, 0.1' : '255, 255, 255, 0.1'});
      border-top-color: ${themeColors.tabActiveBorder};
      border-radius: 50%;
      animation: market-spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes market-spin {
      to { transform: rotate(360deg); }
    }
    
    .market-loading-text {
      font-size: 14px;
    }
    
    .market-empty-state,
    .market-error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: rgba(${theme === 'light' ? '0, 0, 0, 0.6' : '255, 255, 255, 0.6'});
      text-align: center;
    }
    
    .market-empty-state i,
    .market-error-state i {
      font-size: 32px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .market-error-message {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }
    
    .market-retry-button {
      margin-top: 12px;
      padding: 6px 12px;
      background-color: ${themeColors.tabActiveBorder};
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .market-company-header {
      margin-bottom: 16px;
      display: flex;
      align-items: baseline;
    }
    
    .market-company-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .market-company-ticker {
      margin-left: 8px;
      font-size: 14px;
      opacity: 0.7;
    }
    
    .market-data-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .market-data-item {
      background-color: rgba(${theme === 'light' ? '0, 0, 0, 0.03' : '255, 255, 255, 0.03'});
      border-radius: 6px;
      padding: 12px;
    }
    
    .market-data-label {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 4px;
    }
    
    .market-data-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .market-data-value.positive {
      color: ${themeColors.positive};
    }
    
    .market-data-value.negative {
      color: ${themeColors.negative};
    }
    
    .market-data-value.neutral {
      color: ${themeColors.neutral};
    }
    
    .market-data-period {
      font-size: 12px;
      opacity: 0.7;
      margin-left: 4px;
      font-weight: normal;
    }
    
    .market-section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 20px 0 12px;
    }
    
    .market-sources-list,
    .market-peers-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .market-source-item,
    .market-peer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${themeColors.border};
    }
    
    .market-source-item:last-child,
    .market-peer-item:last-child {
      border-bottom: none;
    }
    
    .market-source-name,
    .market-peer-name {
      font-weight: 500;
    }
    
    .market-source-value,
    .market-peer-value {
      font-weight: 600;
    }
  `;
  
  // Add style to document
  document.head.appendChild(style);
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initMarketContextPanel };
} else {
  window.initMarketContextPanel = initMarketContextPanel;
}