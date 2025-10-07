/**
 * Scout Advisor Dashboard Diagnostic Overlay
 * Provides visual feedback on interactive state and debugging information
 * 
 * @version 1.0.0
 * @compatible Chart.js 3.7.1
 */

class DiagnosticOverlay {
  constructor() {
    this.visible = false;
    this.initialized = false;
    this.overlayContainer = null;
    this.logContainer = null;
    this.filterStateDisplay = null;
    this.chartStateDisplay = null;
    this.perfMetricsDisplay = null;
    this.eventLog = [];
    this.maxLogEntries = 50;
    this.activeFilters = {};
    
    // Initialize when dashboard is ready
    if (document.readyState === 'complete') {
      this.init();
    } else {
      window.addEventListener('load', () => this.init());
    }
    
    // Register keyboard shortcut (Alt+Shift+D)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.key === 'D') {
        this.toggleOverlay();
      }
    });
  }
  
  init() {
    if (this.initialized) return;
    
    // Create overlay container
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'diagnostic-overlay';
    this.overlayContainer.style.display = 'none';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'diagnostic-header';
    header.innerHTML = `
      <h3>Scout Advisor Diagnostic Overlay</h3>
      <div class="diagnostic-actions">
        <button id="diagnostic-close" class="diagnostic-btn">Close</button>
        <button id="diagnostic-clear" class="diagnostic-btn">Clear Log</button>
      </div>
    `;
    this.overlayContainer.appendChild(header);
    
    // Create main content
    const content = document.createElement('div');
    content.className = 'diagnostic-content';
    
    // Create filter state panel
    this.filterStateDisplay = document.createElement('div');
    this.filterStateDisplay.className = 'diagnostic-panel';
    this.filterStateDisplay.innerHTML = '<h4>Active Filters</h4><div class="diagnostic-data"></div>';
    content.appendChild(this.filterStateDisplay);
    
    // Create chart state panel
    this.chartStateDisplay = document.createElement('div');
    this.chartStateDisplay.className = 'diagnostic-panel';
    this.chartStateDisplay.innerHTML = '<h4>Chart States</h4><div class="diagnostic-data"></div>';
    content.appendChild(this.chartStateDisplay);
    
    // Create performance metrics panel
    this.perfMetricsDisplay = document.createElement('div');
    this.perfMetricsDisplay.className = 'diagnostic-panel';
    this.perfMetricsDisplay.innerHTML = '<h4>Performance Metrics</h4><div class="diagnostic-data"></div>';
    content.appendChild(this.perfMetricsDisplay);
    
    // Create event log panel
    const logPanel = document.createElement('div');
    logPanel.className = 'diagnostic-panel diagnostic-log';
    logPanel.innerHTML = '<h4>Event Log</h4>';
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'diagnostic-data log-entries';
    logPanel.appendChild(this.logContainer);
    content.appendChild(logPanel);
    
    this.overlayContainer.appendChild(content);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .diagnostic-overlay {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        z-index: 9999;
        font-family: monospace;
        font-size: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.5);
      }
      
      .diagnostic-header {
        padding: 10px;
        background: #333;
        border-bottom: 1px solid #555;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .diagnostic-header h3 {
        margin: 0;
        color: #F6E14D;
        font-size: 14px;
      }
      
      .diagnostic-actions {
        display: flex;
        gap: 5px;
      }
      
      .diagnostic-btn {
        background: #555;
        border: none;
        border-radius: 3px;
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }
      
      .diagnostic-btn:hover {
        background: #666;
      }
      
      .diagnostic-content {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
      }
      
      .diagnostic-panel {
        margin-bottom: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .diagnostic-panel h4 {
        margin: 0;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.15);
        font-size: 12px;
      }
      
      .diagnostic-data {
        padding: 10px;
      }
      
      .log-entries {
        max-height: 200px;
        overflow-y: auto;
      }
      
      .log-entry {
        margin-bottom: 5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 5px;
      }
      
      .log-entry.error {
        color: #ff6b6b;
      }
      
      .log-entry.warning {
        color: #feca57;
      }
      
      .log-entry.success {
        color: #1dd1a1;
      }
      
      .diagnostic-label {
        display: inline-block;
        width: 100px;
        font-weight: bold;
        color: #F6E14D;
      }
      
      .filter-item {
        display: flex;
        margin-bottom: 5px;
      }
      
      .chart-item {
        display: flex;
        margin-bottom: 5px;
        flex-wrap: wrap;
      }
      
      .metric-item {
        display: flex;
        margin-bottom: 5px;
      }
      
      .active-value {
        color: #1dd1a1;
        font-weight: bold;
      }
      
      .inactive-value {
        color: #ff6b6b;
        text-decoration: line-through;
      }
    `;
    document.head.appendChild(style);
    
    // Add to DOM
    document.body.appendChild(this.overlayContainer);
    
    // Add event listeners
    document.getElementById('diagnostic-close').addEventListener('click', () => this.toggleOverlay());
    document.getElementById('diagnostic-clear').addEventListener('click', () => this.clearLog());
    
    // Initialize monitoring
    this.startMonitoring();
    
    this.initialized = true;
    this.log('Diagnostic overlay initialized', 'info');
  }
  
  toggleOverlay() {
    this.visible = !this.visible;
    if (this.overlayContainer) {
      this.overlayContainer.style.display = this.visible ? 'flex' : 'none';
      
      if (this.visible) {
        this.refreshAll();
      }
    }
  }
  
  startMonitoring() {
    // Start performance monitoring
    this.measurePerformance();
    
    // Monitor for filter changes
    setInterval(() => {
      this.updateFilterState();
      this.updateChartState();
      
      if (this.visible) {
        this.refreshAll();
      }
    }, 1000);
    
    // Listen for chart interactions
    document.addEventListener('click', (e) => {
      // Check if click was on a chart
      if (e.target.tagName === 'CANVAS') {
        this.log(`Chart clicked: ${e.target.id}`, 'info');
      }
      
      // Check if click was on a KPI card
      if (e.target.closest('.dashboard-card')) {
        const card = e.target.closest('.dashboard-card');
        const title = card.querySelector('h3')?.textContent || 'Unknown';
        const status = card.getAttribute('data-status') || 'unknown';
        this.log(`KPI Card clicked: ${title} (${status})`, 'info');
      }
      
      // Check if click was on a filter pill
      if (e.target.closest('.filter-pill button')) {
        const pill = e.target.closest('.filter-pill');
        const type = pill.querySelector('span.font-medium')?.textContent || 'Unknown';
        this.log(`Filter removed: ${type}`, 'warning');
      }
    });
    
    // Listen for custom events from dashboard-interactivity.js
    window.addEventListener('insights-rendered', (e) => {
      this.log(`Insights rendered: ${e.detail?.count || 0} of ${e.detail?.total || 0}`, 'success');
    });
  }
  
  measurePerformance() {
    // Start performance monitoring
    this.performanceData = {
      fps: 0,
      memoryUsage: 'N/A',
      loadTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      lastFilterTime: 0,
      lastRenderTime: 0
    };
    
    // Calculate FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const calculateFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        this.performanceData.fps = Math.round(frameCount * 1000 / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        
        // Get memory usage if available
        if (window.performance && window.performance.memory) {
          const usedHeap = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
          const totalHeap = Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024));
          this.performanceData.memoryUsage = `${usedHeap}MB / ${totalHeap}MB`;
        }
      }
      
      requestAnimationFrame(calculateFps);
    };
    
    requestAnimationFrame(calculateFps);
  }
  
  updateFilterState() {
    // Get filter state from dashboard-interactivity.js
    if (window.activeFilters) {
      this.activeFilters = window.activeFilters;
    } else {
      // Try to infer from DOM
      this.activeFilters = {
        category: null,
        region: null,
        timeRange: document.querySelector('.date-range span')?.textContent || 'Last 30 Days',
        status: null
      };
      
      // Check filter pills
      document.querySelectorAll('.filter-pill').forEach(pill => {
        const type = pill.querySelector('span.font-medium')?.textContent?.trim().replace(':', '').toLowerCase() || '';
        const value = pill.querySelector('span:not(.font-medium)')?.textContent?.trim() || '';
        
        if (type && value && type in this.activeFilters) {
          this.activeFilters[type] = value;
        }
      });
    }
    
    // Get data source
    this.dataSource = localStorage.getItem('scout_data_source') || 'Simulated';
    
    // Log data source change if it changed
    if (this._lastDataSource && this._lastDataSource !== this.dataSource) {
      this.log(`Data source changed: ${this._lastDataSource} → ${this.dataSource}`, 'success');
    }
    this._lastDataSource = this.dataSource;
  }
  
  updateChartState() {
    // Get chart states
    this.chartStates = {};
    
    const charts = ['marketingChart', 'risksChart', 'performanceChart'];
    charts.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const chart = Chart.getChart(canvas);
        if (chart) {
          this.chartStates[id] = {
            type: chart.config.type,
            dataPoints: chart.data.labels?.length || 0,
            filtered: canvas.style.border ? true : false,
            height: chart.height,
            width: chart.width
          };
        }
      }
    });
  }
  
  refreshAll() {
    this.refreshFilterState();
    this.refreshChartState();
    this.refreshPerformanceMetrics();
  }
  
  refreshFilterState() {
    const container = this.filterStateDisplay.querySelector('.diagnostic-data');
    
    let html = `
      <div class="filter-item">
        <span class="diagnostic-label">Data Source:</span>
        <span class="${this.dataSource === 'Simulated' ? 'active-value' : ''}">${this.dataSource}</span>
      </div>
    `;
    
    // Add activeFilters
    for (const [key, value] of Object.entries(this.activeFilters)) {
      const isActive = value !== null;
      html += `
        <div class="filter-item">
          <span class="diagnostic-label">${key}:</span>
          <span class="${isActive ? 'active-value' : 'inactive-value'}">${value || 'None'}</span>
        </div>
      `;
    }
    
    container.innerHTML = html;
  }
  
  refreshChartState() {
    const container = this.chartStateDisplay.querySelector('.diagnostic-data');
    
    let html = '';
    
    // Add chart states
    for (const [id, state] of Object.entries(this.chartStates)) {
      html += `
        <div class="chart-item">
          <span class="diagnostic-label">${id}:</span>
          <span class="${state.filtered ? 'active-value' : ''}">${state.type} (${state.dataPoints} points)</span>
          <span style="margin-left: 10px; font-size: 10px;">${state.width}x${state.height}px</span>
        </div>
      `;
    }
    
    container.innerHTML = html || '<div>No charts detected</div>';
  }
  
  refreshPerformanceMetrics() {
    const container = this.perfMetricsDisplay.querySelector('.diagnostic-data');
    
    let html = `
      <div class="metric-item">
        <span class="diagnostic-label">FPS:</span>
        <span class="${this.performanceData.fps >= 30 ? 'active-value' : 'inactive-value'}">${this.performanceData.fps}</span>
      </div>
      <div class="metric-item">
        <span class="diagnostic-label">Memory:</span>
        <span>${this.performanceData.memoryUsage}</span>
      </div>
      <div class="metric-item">
        <span class="diagnostic-label">Load time:</span>
        <span>${this.performanceData.loadTime}ms</span>
      </div>
      <div class="metric-item">
        <span class="diagnostic-label">Filter time:</span>
        <span>${this.performanceData.lastFilterTime}ms</span>
      </div>
      <div class="metric-item">
        <span class="diagnostic-label">Render time:</span>
        <span>${this.performanceData.lastRenderTime}ms</span>
      </div>
    `;
    
    container.innerHTML = html;
  }
  
  log(message, type = 'info') {
    // Create log entry
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { message, type, timestamp };
    
    // Add to log array
    this.eventLog.unshift(logEntry);
    
    // Limit log size
    if (this.eventLog.length > this.maxLogEntries) {
      this.eventLog.pop();
    }
    
    // Update UI if visible
    if (this.visible && this.logContainer) {
      this.refreshLog();
    }
    
    // Output to console
    console.log(`[Diagnostic] ${logEntry.message}`);
  }
  
  refreshLog() {
    let html = '';
    
    this.eventLog.forEach(entry => {
      html += `<div class="log-entry ${entry.type}">
        <span style="opacity: 0.7;">[${entry.timestamp}]</span> ${entry.message}
      </div>`;
    });
    
    this.logContainer.innerHTML = html || '<div>No events logged</div>';
  }
  
  clearLog() {
    this.eventLog = [];
    this.refreshLog();
  }
  
  // Public API
  trackFilterTime(time) {
    this.performanceData.lastFilterTime = time;
  }
  
  trackRenderTime(time) {
    this.performanceData.lastRenderTime = time;
  }
}

// Initialize diagnostic overlay
window.diagnosticOverlay = new DiagnosticOverlay();

// Public helper functions for dashboard-interactivity.js
window.logDiagnostic = (message, type) => {
  window.diagnosticOverlay.log(message, type);
};

window.trackFilterTime = (time) => {
  window.diagnosticOverlay.trackFilterTime(time);
};

window.trackRenderTime = (time) => {
  window.diagnosticOverlay.trackRenderTime(time);
};

// Log when script is loaded
console.log('Diagnostic overlay script loaded. Press Alt+Shift+D to toggle.');
console.log('👉 Visual debug tip: Press Alt+Shift+D to verify:');
console.log('   - Current Data Source label shows green when selected');
console.log('   - Active filters appear in green');
console.log('   - Chart types and states are listed');
console.log('   - Check for refresh confirmations in the log section');