/**
 * Chart Quality Badge System
 * Adds Sunnies data quality badges to charts based on confidence scores
 * 
 * @version 1.0.0
 */

class ChartQualityBadges {
  constructor(options = {}) {
    this.options = {
      badgePosition: options.badgePosition || 'bottom-right',
      enableTooltips: options.enableTooltips !== false,
      confidenceThresholds: options.confidenceThresholds || {
        high: 0.85,
        medium: 0.7,
        low: 0
      },
      ...options
    };
    
    // Cache for chart confidence scores
    this.confidenceScores = options.confidenceScores || {};
    
    // Initialize the system
    this.init();
  }
  
  /**
   * Initialize the badge system
   */
  init() {
    // Load Sunnies configuration if exists
    this.loadSunniesConfig();
    
    // Attach to Chart.js if available
    this.patchChartJs();
    
    // Add badges to existing charts
    this.addBadgesToExistingCharts();
    
    console.log('Chart Quality Badges initialized');
  }
  
  /**
   * Load Sunnies configuration
   */
  loadSunniesConfig() {
    // In production, this would load from a sunnies.json file
    // For now, we use the hardcoded values from Pulser-Sunnies integration
    if (window.Pulser && window.Pulser.getDataQualityIndicator) {
      this.getSunniesIndicator = window.Pulser.getDataQualityIndicator;
    }
  }
  
  /**
   * Patch Chart.js to add quality badges automatically
   */
  patchChartJs() {
    if (typeof Chart === 'undefined') return;
    
    const originalDraw = Chart.prototype.draw;
    const self = this;
    
    Chart.prototype.draw = function() {
      const result = originalDraw.apply(this, arguments);
      
      // Add quality badge after chart is drawn
      if (this.canvas && this.canvas.id) {
        setTimeout(() => {
          self.addBadgeToChart(this);
        }, 100);
      }
      
      return result;
    };
  }
  
  /**
   * Add badges to existing charts
   */
  addBadgesToExistingCharts() {
    if (typeof Chart === 'undefined') return;
    
    // Look for canvas elements that might be charts
    document.querySelectorAll('canvas').forEach(canvas => {
      if (canvas.chart) {
        this.addBadgeToChart(canvas.chart);
      }
    });
  }
  
  /**
   * Add quality badge to a specific chart
   */
  addBadgeToChart(chart) {
    if (!chart || !chart.canvas) return;
    
    const canvas = chart.canvas;
    const chartId = canvas.id;
    
    // Skip if already has badge
    if (canvas.parentElement.querySelector('.sunnies-badge')) return;
    
    // Get confidence score
    let confidenceData = this.getConfidenceData(chartId);
    if (!confidenceData) return;
    
    // Determine badge type
    const badgeType = this.getBadgeType(confidenceData.confidence);
    const badgeHtml = this.createBadgeHtml(badgeType, confidenceData);
    
    // Add badge to chart container
    const container = canvas.parentElement;
    container.style.position = 'relative';
    
    const badge = document.createElement('div');
    badge.className = `sunnies-badge sunnies-badge-${badgeType.type} sunnies-tooltip chart-badge-${this.options.badgePosition}`;
    badge.innerHTML = badgeHtml;
    badge.style.position = 'absolute';
    
    // Position badge based on options
    this.positionBadge(badge, this.options.badgePosition);
    
    container.appendChild(badge);
  }
  
  /**
   * Get confidence data for a chart
   */
  getConfidenceData(chartId) {
    // Check if we have a Sunnies indicator
    if (this.getSunniesIndicator) {
      return this.getSunniesIndicator(chartId);
    }
    
    // Fallback to hardcoded confidence scores
    return this.confidenceScores[chartId] || null;
  }
  
  /**
   * Get badge type based on confidence score
   */
  getBadgeType(confidence) {
    const { confidenceThresholds } = this.options;
    
    if (confidence >= confidenceThresholds.high) {
      return {
        type: 'high',
        label: 'High Confidence',
        icon: 'bx-check-circle'
      };
    } else if (confidence >= confidenceThresholds.medium) {
      return {
        type: 'medium',
        label: 'Medium Confidence',
        icon: 'bx-info-circle'
      };
    } else {
      return {
        type: 'low',
        label: 'Low Confidence',
        icon: 'bx-error-circle'
      };
    }
  }
  
  /**
   * Create badge HTML
   */
  createBadgeHtml(badgeType, confidenceData) {
    const tooltipHtml = this.options.enableTooltips ? `
      <span class="sunnies-tooltip-text">
        Data source: ${confidenceData.source || 'Unknown'}<br>
        Confidence score: ${Math.round((confidenceData.confidence || 0) * 100)}%<br>
        Last updated: ${confidenceData.lastUpdated || 'Unknown'}
      </span>
    ` : '';
    
    return `
      <i class="bx ${badgeType.icon}"></i>
      <span>${badgeType.label}</span>
      ${tooltipHtml}
    `;
  }
  
  /**
   * Position badge based on position option
   */
  positionBadge(badge, position) {
    switch (position) {
      case 'top-left':
        badge.style.top = '5px';
        badge.style.left = '5px';
        break;
      case 'top-right':
        badge.style.top = '5px';
        badge.style.right = '5px';
        break;
      case 'bottom-left':
        badge.style.bottom = '5px';
        badge.style.left = '5px';
        break;
      case 'bottom-right':
      default:
        badge.style.bottom = '5px';
        badge.style.right = '5px';
        break;
    }
  }
  
  /**
   * Update confidence score for a chart
   */
  updateConfidence(chartId, confidenceData) {
    this.confidenceScores[chartId] = confidenceData;
    
    // Update badge if chart exists
    const canvas = document.getElementById(chartId);
    if (canvas && canvas.chart) {
      // Remove existing badge
      const existingBadge = canvas.parentElement.querySelector('.sunnies-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Add updated badge
      this.addBadgeToChart(canvas.chart);
    }
  }
}

// Initialize if autoInit is true
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // If not already initialized and auto-init is not disabled
    if (!window.chartQualityBadges && !window.DISABLE_CHART_QUALITY_BADGES) {
      window.chartQualityBadges = new ChartQualityBadges();
    }
  });
}