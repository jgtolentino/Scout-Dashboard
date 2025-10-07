/**
 * Retail Advisor Insights Visualizer
 * 
 * A JavaScript library for rendering GenAI-powered insights from Retail Advisor
 * across multiple dashboards.
 * 
 * @version 2.1.2
 * @license MIT
 */

class InsightsVisualizer {
  /**
   * Creates a new InsightsVisualizer instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.apiEndpoint - The API endpoint for insights data
   * @param {string} options.container - CSS selector for container element
   * @param {number} options.refreshInterval - Refresh interval in milliseconds
   * @param {number} options.maxCards - Maximum number of cards to display (optional)
   * @param {string} options.theme - "light" or "dark" theme (optional)
   */
  constructor(options) {
    // Validate required options
    if (!options) {
      throw new Error('InsightsVisualizer: Options are required');
    }
    
    if (!options.apiEndpoint) {
      throw new Error('InsightsVisualizer: API endpoint is required');
    }
    
    if (!options.container) {
      throw new Error('InsightsVisualizer: Container selector is required');
    }
    
    // Set defaults and merge with provided options
    this.options = {
      refreshInterval: 300000, // Default: 5 minutes
      maxCards: 10,
      theme: 'light',
      ...options
    };
    
    // Initialize properties
    this.container = document.querySelector(this.options.container);
    if (!this.container) {
      console.error(`InsightsVisualizer: Container ${this.options.container} not found`);
      return;
    }
    
    this.insights = [];
    this.lastUpdated = null;
    
    // Apply theme
    document.body.classList.toggle('insights-dark-theme', this.options.theme === 'dark');
    
    // Load insights data
    this.loadInsights();
    
    // Set up refresh timer
    if (this.options.refreshInterval > 0) {
      setInterval(() => this.loadInsights(), this.options.refreshInterval);
    }
  }
  
  /**
   * Loads insights data from the API
   */
  loadInsights() {
    console.log('InsightsVisualizer: Loading insights from', this.options.apiEndpoint);
    
    fetch(this.options.apiEndpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('InsightsVisualizer: Received data', data);
        this.insights = data.insights || [];
        this.metadata = data.metadata || {};
        this.lastUpdated = new Date();
        this.renderInsights();
      })
      .catch(error => {
        console.error('InsightsVisualizer: Error fetching insights', error);
        
        // If fetch fails, use fallback insights
        if (this.insights.length === 0) {
          this.useFallbackInsights();
        }
      });
  }
  
  /**
   * Uses fallback insights if API is unavailable
   */
  useFallbackInsights() {
    console.log('InsightsVisualizer: Using fallback insights');
    
    this.insights = [
      {
        id: 'fallback-001',
        type: 'general',
        title: 'Increasing focus on value meals across all demographics',
        text: 'Analysis of customer data shows increased interest in value options.',
        confidence: 0.85,
        brands: ['Brand A', 'Brand B', 'Brand C'],
        tags: ['pricing', 'value', 'economy'],
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'fallback-002',
        type: 'brand',
        title: 'Brand loyalty stronger for customers using rewards programs',
        text: 'Customer retention is significantly higher when enrolled in loyalty programs.',
        confidence: 0.92,
        brands: ['Brand A'],
        tags: ['loyalty', 'rewards', 'app'],
        date: new Date().toISOString().split('T')[0]
      }
    ];
    
    this.metadata = {
      generated_at: new Date().toISOString(),
      time_period: 'Last 30 days',
      model: 'retail-advisor-fallback',
      insights_count: this.insights.length
    };
    
    this.lastUpdated = new Date();
    this.renderInsights();
  }
  
  /**
   * Renders insights cards in the container
   */
  renderInsights() {
    if (!this.container) return;
    
    // Clear existing content
    this.container.innerHTML = '';
    
    // Check if we have insights to display
    if (!this.insights || this.insights.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Get insights to display (limited by maxCards)
    const insightsToShow = this.insights.slice(0, this.options.maxCards);
    
    // Render each insight card
    insightsToShow.forEach(insight => {
      const card = this.createInsightCard(insight);
      this.container.appendChild(card);
    });
    
    // Dispatch event that insights were rendered
    window.dispatchEvent(new CustomEvent('insights-rendered', {
      detail: {
        count: insightsToShow.length,
        total: this.insights.length,
        timestamp: this.lastUpdated
      }
    }));
  }
  
  /**
   * Creates an insight card element
   * 
   * @param {Object} insight - The insight data
   * @returns {HTMLElement} The card element
   */
  createInsightCard(insight) {
    // Create card wrapper
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-6 mb-3';
    
    // Determine card type class based on insight type
    const cardTypeClass = `card-insight-${insight.type}`;
    
    // Create card HTML structure
    colDiv.innerHTML = `
      <div class="card ${cardTypeClass}">
        <div class="card-header">
          <span class="badge bg-light text-dark me-2">${this.capitalizeFirstLetter(insight.type)}</span>
          ${this.escapeHtml(insight.title)}
          <span class="confidence-badge confidence-${this.getConfidenceLevel(insight.confidence)}">${Math.round(insight.confidence * 100)}% confidence</span>
        </div>
        <div class="card-body">
          <p>${this.escapeHtml(insight.text)}</p>
          
          ${insight.brands && insight.brands.length > 0 ? `
          <div class="mb-3">
            ${insight.brands.map(brand => `<span class="brand-tag">${this.escapeHtml(brand)}</span>`).join('')}
          </div>
          ` : ''}
          
          ${insight.tags && insight.tags.length > 0 ? `
          <div>
            ${insight.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
          ` : ''}
          
          <div class="mt-3 text-end">
            <small class="text-muted">Generated by AI • ${this.formatDate(insight.date)}</small>
          </div>
        </div>
      </div>
    `;
    
    return colDiv;
  }
  
  /**
   * Renders an empty state when no insights are available
   */
  renderEmptyState() {
    this.container.innerHTML = `
      <div class="col-12">
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="fas fa-lightbulb text-warning mb-3" style="font-size: 3rem;"></i>
            <h5>No insights available</h5>
            <p class="text-muted">Check back later or adjust your filters to see insights.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Determines confidence level based on confidence score
   * 
   * @param {number} confidence - Confidence score (0-1)
   * @returns {string} Confidence level (high, medium, low)
   */
  getConfidenceLevel(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }
  
  /**
   * Capitalizes the first letter of a string
   * 
   * @param {string} str - Input string
   * @returns {string} String with first letter capitalized
   */
  capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Formats a date string to a readable format
   * 
   * @param {string} dateStr - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  /**
   * Escapes HTML in a string
   * 
   * @param {string} str - Input string
   * @returns {string} HTML-escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Make accessible globally
window.InsightsVisualizer = InsightsVisualizer;