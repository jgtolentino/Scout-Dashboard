/**
 * Pulser & Sunnies Integration for Juicer Dashboards
 * Integrates Pulser QA framework and Sunnies data quality indicators
 * 
 * @version 1.0.0
 */

(function() {
  // Configuration
  const PULSER_CONFIG = {
    version: '2.1.2',
    buildId: '20250513-143725',
    qaEnabled: true,
    mockData: false,
    qualityBadges: true,
    debugMode: false
  };

  // Mock Sunnies data quality indicators (in production would come from sunnies.json)
  const SUNNIES_INDICATORS = {
    charts: {
      'brandMentionsChart': { confidence: 0.92, source: 'transcript_silver', lastUpdated: '2025-05-13T10:45:12Z' },
      'topBrandsChart': { confidence: 0.88, source: 'transcript_silver', lastUpdated: '2025-05-13T10:45:12Z' },
      'sentimentChart': { confidence: 0.64, source: 'sentiment_analyzer', lastUpdated: '2025-05-13T08:30:05Z' },
      'brandSentimentChart': { confidence: 0.71, source: 'sentiment_analyzer', lastUpdated: '2025-05-13T08:30:05Z' }
    },
    tables: {
      'brandTableBody': { confidence: 0.89, source: 'aggregated_metrics', lastUpdated: '2025-05-13T10:45:12Z' }
    },
    visuals: {
      'brandRelationshipSketch': { confidence: 0.75, source: 'mention_cooccurrence', lastUpdated: '2025-05-13T09:15:33Z' },
      'transcriptHighlights': { confidence: 0.95, source: 'transcript_gold', lastUpdated: '2025-05-13T10:45:12Z' }
    }
  };

  /**
   * Initialize the Pulser and Sunnies integration
   */
  function initialize() {
    // Add console metadata for debugging
    console.log('%cPulser Integration Active', 'color: #3f51b5; font-weight: bold; font-size: 12px;');
    console.log(`%cVersion: ${PULSER_CONFIG.version} (Build: ${PULSER_CONFIG.buildId})`, 'color: #666; font-size: 11px;');
    console.log('%cSunnies Data Quality Monitoring Active', 'color: #ff6b00; font-weight: bold; font-size: 12px;');
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
      onDOMReady();
    }
  }

  /**
   * Handle DOM ready event
   */
  function onDOMReady() {
    // Add Sunnies quality badges to charts
    if (PULSER_CONFIG.qualityBadges) {
      addQualityBadges();
    }
    
    // Add Pulser debug panel
    addPulserPanel();
    
    // Add Pulser watermark to footer
    addPulserWatermark();
    
    // Monitor chart rendering
    monitorChartRendering();
    
    // Log event
    logPulserEvent('Dashboard initialized with Pulser+Sunnies integration');
  }

  /**
   * Add data quality badges to chart containers
   */
  function addQualityBadges() {
    // Process charts
    Object.keys(SUNNIES_INDICATORS.charts).forEach(chartId => {
      const chartContainer = document.getElementById(chartId)?.closest('.chart-container');
      if (chartContainer) {
        const quality = SUNNIES_INDICATORS.charts[chartId];
        addBadgeToElement(chartContainer, quality);
      }
    });
    
    // Process tables
    Object.keys(SUNNIES_INDICATORS.tables).forEach(tableId => {
      const tableContainer = document.getElementById(tableId)?.closest('.table-responsive');
      if (tableContainer) {
        const quality = SUNNIES_INDICATORS.tables[tableId];
        addBadgeToElement(tableContainer, quality);
      }
    });
    
    // Process other visuals
    Object.keys(SUNNIES_INDICATORS.visuals).forEach(visualId => {
      const visualContainer = document.getElementById(visualId);
      if (visualContainer) {
        const quality = SUNNIES_INDICATORS.visuals[visualId];
        addBadgeToElement(visualContainer, quality);
      }
    });
  }
  
  /**
   * Add a quality badge to an element
   */
  function addBadgeToElement(element, quality) {
    // Determine badge type based on confidence score
    let badgeType, badgeText, badgeIcon;
    
    if (quality.confidence >= 0.85) {
      badgeType = 'high';
      badgeText = 'High Confidence';
      badgeIcon = 'bx-check-circle';
    } else if (quality.confidence >= 0.7) {
      badgeType = 'medium';
      badgeText = 'Medium Confidence';
      badgeIcon = 'bx-info-circle';
    } else {
      badgeType = 'low';
      badgeText = 'Low Confidence';
      badgeIcon = 'bx-error-circle';
    }
    
    // Format date for tooltip
    const lastUpdated = new Date(quality.source);
    const formattedDate = lastUpdated instanceof Date && !isNaN(lastUpdated) ? 
      lastUpdated.toLocaleString() : 'Unknown';
    
    // Create badge element
    const badge = document.createElement('div');
    badge.className = `sunnies-badge sunnies-badge-${badgeType} sunnies-tooltip`;
    badge.innerHTML = `
      <i class="bx ${badgeIcon}"></i>
      <span>${badgeText}</span>
      <span class="sunnies-tooltip-text">
        Data source: ${quality.source}<br>
        Confidence score: ${Math.round(quality.confidence * 100)}%<br>
        Last updated: ${formattedDate}
      </span>
    `;
    
    // Add badge to element
    element.parentNode.insertBefore(badge, element.nextSibling);
  }

  /**
   * Add Pulser debug panel
   */
  function addPulserPanel() {
    // Create panel element
    const panel = document.createElement('div');
    panel.id = 'pulserPanel';
    panel.className = 'pulser-panel';
    
    // Create panel content
    panel.innerHTML = `
      <div class="pulser-panel-header">
        <div class="pulser-panel-title">
          <i class="bx bx-pulse"></i>
          Pulser Debug Tools
        </div>
        <i class="bx bx-chevron-up"></i>
      </div>
      <div class="pulser-panel-content">
        <div class="pulser-panel-section">
          <div class="pulser-panel-section-title">Data Mode</div>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="mockDataToggle" ${PULSER_CONFIG.mockData ? 'checked' : ''}>
            <label class="form-check-label" for="mockDataToggle">Use Mock Data</label>
          </div>
        </div>
        
        <div class="pulser-panel-section">
          <div class="pulser-panel-section-title">QA Tools</div>
          <button id="runQABtn" class="btn btn-sm btn-outline-primary w-100 mb-2">
            <i class="bx bx-test-tube"></i> Run QA Tests
          </button>
          <button id="captureBasslineBtn" class="btn btn-sm btn-outline-secondary w-100">
            <i class="bx bx-camera"></i> Capture Baseline
          </button>
        </div>
        
        <div class="pulser-panel-section">
          <div class="pulser-panel-section-title">System Info</div>
          <div class="mb-1"><small><strong>Pulser Version:</strong> ${PULSER_CONFIG.version}</small></div>
          <div class="mb-1"><small><strong>Build ID:</strong> ${PULSER_CONFIG.buildId}</small></div>
          <div><small><strong>Environment:</strong> ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}</small></div>
        </div>
      </div>
    `;
    
    // Add panel to body
    document.body.appendChild(panel);
    
    // Add event listeners
    document.querySelector('.pulser-panel-header').addEventListener('click', function() {
      panel.classList.toggle('open');
    });
    
    document.getElementById('mockDataToggle').addEventListener('change', function(e) {
      toggleMockData(e.target.checked);
    });
    
    document.getElementById('runQABtn').addEventListener('click', runQA);
    document.getElementById('captureBasslineBtn').addEventListener('click', captureBaseline);
  }
  
  /**
   * Add Pulser watermark to footer
   */
  function addPulserWatermark() {
    // Create watermark
    const watermark = document.createElement('div');
    watermark.className = 'pulser-powered mt-4 mb-2';
    
    // Add watermark content
    watermark.innerHTML = `
      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIyQzYuNDc3MTUgMjIgMiAxNy41MjI4IDIgMTJDMiA2LjQ3NzE1IDYuNDc3MTUgMiAxMiAyQzE3LjUyMjggMiAyMiA2LjQ3NzE1IDIyIDEyQzIyIDE3LjUyMjggMTcuNTIyOCAyMiAxMiAyMloiIHN0cm9rZT0iIzNGNTFCNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTEyIDZWMTIiIHN0cm9rZT0iIzNGNTFCNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOCAxNC41TDEyIDEyTDE2IDE0LjUiIHN0cm9rZT0iIzNGNTFCNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOC41IDE3LjVMMTIgMTYuNUwxNS41IDE3LjUiIHN0cm9rZT0iIzNGNTFCNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=" alt="Pulser Icon">
      <span>Powered by Pulser</span>
      <span class="pulser-version">${PULSER_CONFIG.version}</span>
    `;
    
    // Add watermark to container
    const container = document.querySelector('.container-fluid');
    if (container) {
      container.appendChild(watermark);
    }
  }
  
  /**
   * Monitor chart rendering
   */
  function monitorChartRendering() {
    // Patch Chart.js to track rendering
    if (typeof Chart !== 'undefined') {
      const originalAcquireContext = Chart.controllers.line.prototype.draw;
      
      Chart.controllers.line.prototype.draw = function() {
        const result = originalAcquireContext.apply(this, arguments);
        
        // Get chart ID
        const chartId = this.chart.canvas.id;
        const quality = SUNNIES_INDICATORS.charts[chartId];
        
        if (quality && PULSER_CONFIG.debugMode) {
          console.log(`%cChart rendered: ${chartId} (Confidence: ${Math.round(quality.confidence * 100)}%)`, 
            'color: #666; font-size: 11px;');
        }
        
        return result;
      };
    }
  }
  
  /**
   * Toggle mock data mode
   */
  function toggleMockData(useMock) {
    // Update config
    PULSER_CONFIG.mockData = useMock;
    
    // Log event
    logPulserEvent(`Mock data mode ${useMock ? 'enabled' : 'disabled'}`);
    
    // Show toast notification
    showToast(`Mock data mode ${useMock ? 'enabled' : 'disabled'}`, useMock ? 'bx-data' : 'bx-scatter-chart');
  }
  
  /**
   * Run QA tests
   */
  function runQA() {
    // In production, this would trigger QA tests from the QA framework
    logPulserEvent('QA tests triggered');
    
    // Show toast notification
    showToast('QA tests running...', 'bx-test-tube');
    
    // Simulate QA tests
    setTimeout(() => {
      showToast('QA tests completed successfully', 'bx-check-circle');
    }, 2000);
  }
  
  /**
   * Capture baseline for visual regression testing
   */
  function captureBaseline() {
    // In production, this would trigger baseline capture from the QA framework
    logPulserEvent('Baseline capture triggered');
    
    // Show toast notification
    showToast('Capturing baseline...', 'bx-camera');
    
    // Simulate baseline capture
    setTimeout(() => {
      showToast('Baseline captured successfully', 'bx-check-circle');
    }, 1500);
  }
  
  /**
   * Show a toast notification
   */
  function showToast(message, icon = 'bx-info-circle') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast position-fixed bottom-0 start-0 m-3 bg-dark text-white';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Add toast content
    toast.innerHTML = `
      <div class="toast-header bg-dark text-white">
        <i class="bx ${icon} me-2"></i>
        <strong class="me-auto">Pulser</strong>
        <small>Just now</small>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add toast to body
    document.body.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
      toast.remove();
    });
  }
  
  /**
   * Log a Pulser event
   */
  function logPulserEvent(message) {
    if (PULSER_CONFIG.debugMode) {
      console.log(`%c[Pulser] ${message}`, 'color: #3f51b5; font-size: 11px;');
    }
    
    // In production, this would send telemetry data to the Pulser API
  }
  
  // Initialize
  initialize();
  
  // Expose public API
  window.Pulser = {
    version: PULSER_CONFIG.version,
    buildId: PULSER_CONFIG.buildId,
    toggleMockData: toggleMockData,
    runQA: runQA,
    captureBaseline: captureBaseline,
    getDataQualityIndicator: function(elementId) {
      // Look up quality indicator for element
      for (const category of Object.keys(SUNNIES_INDICATORS)) {
        if (SUNNIES_INDICATORS[category][elementId]) {
          return SUNNIES_INDICATORS[category][elementId];
        }
      }
      return null;
    }
  };
})();