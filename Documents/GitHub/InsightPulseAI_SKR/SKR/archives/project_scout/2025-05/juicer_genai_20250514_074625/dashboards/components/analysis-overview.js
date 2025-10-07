/**
 * Analysis Overview Component
 * 
 * Provides high-level analysis metrics for the Project Scout dashboard
 * with breakdown of key analysis indicators.
 * 
 * @module AnalysisOverview
 */

class AnalysisOverview {
  /**
   * Create a new Analysis Overview component
   * @param {Object} config - Configuration options
   * @param {string} config.container - CSS selector for container element
   * @param {string} config.apiEndpoint - API endpoint for analysis data
   * @param {number} config.refreshInterval - Auto-refresh interval in ms (default: 60000)
   */
  constructor(config) {
    this.container = document.querySelector(config.container);
    this.apiEndpoint = config.apiEndpoint || '/api/analysis';
    this.refreshInterval = config.refreshInterval || 60000;
    this.data = null;
    
    // Initialize the component
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    if (!this.container) {
      console.error('Analysis Overview container not found');
      return;
    }
    
    // Create container elements
    this.createElements();
    
    // Load initial data
    this.loadData();
    
    // Set up auto refresh
    if (this.refreshInterval > 0) {
      setInterval(() => this.loadData(), this.refreshInterval);
    }
  }
  
  /**
   * Create DOM elements for the component
   */
  createElements() {
    // Create overview cards container
    this.overviewContainer = document.createElement('div');
    this.overviewContainer.className = 'analysis-overview-container';
    this.container.appendChild(this.overviewContainer);
    
    // Create breakdown section
    this.breakdownSection = document.createElement('div');
    this.breakdownSection.className = 'analysis-breakdown';
    this.container.appendChild(this.breakdownSection);
    
    // Add breakdown header
    const breakdownHeader = document.createElement('div');
    breakdownHeader.className = 'analysis-breakdown-header';
    breakdownHeader.innerHTML = `
      <h3 class="analysis-breakdown-title">Analysis Breakdown</h3>
      <div class="on-object-toolbar">
        <button class="toolbar-button" title="Refresh">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="toolbar-button" title="Export">
          <i class="fas fa-download"></i>
        </button>
        <button class="toolbar-button" title="Settings">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    `;
    this.breakdownSection.appendChild(breakdownHeader);
    
    // Add breakdown content container
    this.breakdownContent = document.createElement('div');
    this.breakdownContent.className = 'analysis-breakdown-content';
    this.breakdownSection.appendChild(this.breakdownContent);
    
    // Add event listeners
    const refreshButton = breakdownHeader.querySelector('[title="Refresh"]');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.loadData());
    }
  }
  
  /**
   * Load analysis data from API
   */
  loadData() {
    // For demo purposes, we'll use sample data
    // In production, this would make an API call
    
    // Simulate loading delay
    this.showLoading(true);
    
    setTimeout(() => {
      this.data = this.getSampleData();
      this.updateView();
      this.showLoading(false);
    }, 500);
  }
  
  /**
   * Update the view with current data
   */
  updateView() {
    if (!this.data) return;
    
    // Update overview cards
    this.renderOverviewCards();
    
    // Update breakdown section
    this.renderBreakdown();
  }
  
  /**
   * Render overview cards with analysis scores
   */
  renderOverviewCards() {
    const { quality, volume, impact } = this.data.overview;
    
    this.overviewContainer.innerHTML = `
      <div class="analysis-overview-card quality">
        <div class="analysis-overview-title">Analysis Quality</div>
        <div class="analysis-overview-score">${quality.score}%</div>
        <div class="analysis-overview-change ${quality.change >= 0 ? 'kpi-positive' : 'kpi-negative'}">
          <span class="delta-arrow ${quality.change >= 0 ? 'up' : 'down'}"></span>
          ${Math.abs(quality.change)}% vs previous period
        </div>
        <div class="analysis-overview-label">Based on 124 brand mentions</div>
        <div class="analysis-overview-progress">
          <div class="analysis-overview-progress-bar quality" style="width: ${quality.score}%"></div>
        </div>
      </div>
      
      <div class="analysis-overview-card volume">
        <div class="analysis-overview-title">Analysis Volume</div>
        <div class="analysis-overview-score">${volume.score}%</div>
        <div class="analysis-overview-change ${volume.change >= 0 ? 'kpi-positive' : 'kpi-negative'}">
          <span class="delta-arrow ${volume.change >= 0 ? 'up' : 'down'}"></span>
          ${Math.abs(volume.change)}% vs previous period
        </div>
        <div class="analysis-overview-label">42 transcripts analyzed</div>
        <div class="analysis-overview-progress">
          <div class="analysis-overview-progress-bar volume" style="width: ${volume.score}%"></div>
        </div>
      </div>
      
      <div class="analysis-overview-card impact">
        <div class="analysis-overview-title">Business Impact</div>
        <div class="analysis-overview-score">${impact.score}%</div>
        <div class="analysis-overview-change ${impact.change >= 0 ? 'kpi-positive' : 'kpi-negative'}">
          <span class="delta-arrow ${impact.change >= 0 ? 'up' : 'down'}"></span>
          ${Math.abs(impact.change)}% vs previous period
        </div>
        <div class="analysis-overview-label">18 actionable insights found</div>
        <div class="analysis-overview-progress">
          <div class="analysis-overview-progress-bar impact" style="width: ${impact.score}%"></div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render breakdown section with detailed metrics
   */
  renderBreakdown() {
    const { breakdown } = this.data;
    
    this.breakdownContent.innerHTML = '';
    
    // Render each breakdown metric
    breakdown.forEach(item => {
      const card = document.createElement('div');
      card.className = 'breakdown-card';
      card.innerHTML = `
        <div class="breakdown-card-title">
          <i class="${item.icon}"></i>
          <span>${item.title}</span>
        </div>
        <div class="breakdown-card-value">${item.value}</div>
        <div class="breakdown-card-description">${item.description}</div>
      `;
      this.breakdownContent.appendChild(card);
    });
  }
  
  /**
   * Show or hide loading indicators
   * @param {boolean} isLoading - Whether the component is in loading state
   */
  showLoading(isLoading) {
    if (isLoading) {
      this.container.classList.add('loading');
      // Could add specific loading indicators here
    } else {
      this.container.classList.remove('loading');
    }
  }
  
  /**
   * Get sample analysis data for demo purposes
   * @returns {Object} Sample analysis data
   */
  getSampleData() {
    return {
      overview: {
        quality: {
          score: 87,
          change: 5.2
        },
        volume: {
          score: 72,
          change: 8.7
        },
        impact: {
          score: 64,
          change: -2.3
        }
      },
      breakdown: [
        {
          title: 'Brand Detection Accuracy',
          value: '94.3%',
          description: 'Precision of brand mention detection',
          icon: 'fas fa-bullseye'
        },
        {
          title: 'Sentiment Analysis Depth',
          value: '83.7%',
          description: 'Coverage of sentiment aspects',
          icon: 'fas fa-chart-line'
        },
        {
          title: 'Contextual Understanding',
          value: '76.5%',
          description: 'Accuracy of context extraction',
          icon: 'fas fa-sitemap'
        },
        {
          title: 'Unique Brands Identified',
          value: '42',
          description: '7 more than previous period',
          icon: 'fas fa-tags'
        },
        {
          title: 'Avg. Analysis Time',
          value: '3.2s',
          description: 'Per transcript processing time',
          icon: 'fas fa-clock'
        },
        {
          title: 'Insight Generation Rate',
          value: '42.8%',
          description: 'Transcripts yielding insights',
          icon: 'fas fa-lightbulb'
        }
      ]
    };
  }
}

// Make available globally
window.AnalysisOverview = AnalysisOverview;