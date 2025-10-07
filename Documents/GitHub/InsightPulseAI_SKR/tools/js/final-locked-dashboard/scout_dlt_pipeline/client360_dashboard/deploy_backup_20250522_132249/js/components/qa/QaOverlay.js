/**
 * QA Overlay Component
 * Development and testing overlay with system information
 * Toggled with Alt+Shift+D keyboard shortcut
 * v2.4.0 - PRD Wireframe Implementation
 */

class QaOverlay {
  constructor() {
    this.isVisible = false;
    this.overlayElement = null;
    this.startTime = Date.now();
    this.refreshInterval = null;
    
    this.init();
  }
  
  init() {
    this.createOverlay();
    this.bindKeyboardShortcut();
    this.startMetricsUpdate();
  }
  
  createOverlay() {
    // Create overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'qa-overlay';
    this.overlayElement.className = 'qa-overlay hidden';
    this.overlayElement.setAttribute('role', 'dialog');
    this.overlayElement.setAttribute('aria-label', 'QA Development Overlay');
    this.overlayElement.setAttribute('aria-hidden', 'true');
    
    this.overlayElement.innerHTML = `
      <div class="qa-overlay-header">
        <div class="qa-title">
          <i class="fas fa-bug"></i>
          QA Development Overlay
        </div>
        <div class="qa-controls">
          <button class="qa-btn qa-minimize" title="Minimize" aria-label="Minimize overlay">
            <i class="fas fa-minus"></i>
          </button>
          <button class="qa-btn qa-close" title="Close (Alt+Shift+D)" aria-label="Close overlay">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="qa-overlay-content">
        <div class="qa-tabs">
          <button class="qa-tab active" data-tab="system">System</button>
          <button class="qa-tab" data-tab="data">Data Sources</button>
          <button class="qa-tab" data-tab="performance">Performance</button>
          <button class="qa-tab" data-tab="console">Console</button>
        </div>
        
        <div class="qa-tab-content">
          <!-- System Tab -->
          <div id="qa-tab-system" class="qa-tab-panel active">
            <div class="qa-section">
              <h4>System Information</h4>
              <div class="qa-info-grid">
                <div class="qa-info-item">
                  <label>Version:</label>
                  <span id="qa-version">v2.4.0</span>
                </div>
                <div class="qa-info-item">
                  <label>Build:</label>
                  <span id="qa-build">${this.getBuildInfo()}</span>
                </div>
                <div class="qa-info-item">
                  <label>Environment:</label>
                  <span id="qa-environment">${this.getEnvironment()}</span>
                </div>
                <div class="qa-info-item">
                  <label>User Agent:</label>
                  <span id="qa-user-agent">${this.getBrowserInfo()}</span>
                </div>
                <div class="qa-info-item">
                  <label>Screen Resolution:</label>
                  <span id="qa-resolution">${window.screen.width}x${window.screen.height}</span>
                </div>
                <div class="qa-info-item">
                  <label>Viewport:</label>
                  <span id="qa-viewport">${window.innerWidth}x${window.innerHeight}</span>
                </div>
                <div class="qa-info-item">
                  <label>Session Duration:</label>
                  <span id="qa-session-time">0s</span>
                </div>
                <div class="qa-info-item">
                  <label>Page Load Time:</label>
                  <span id="qa-load-time">${this.getPageLoadTime()}ms</span>
                </div>
              </div>
            </div>
            
            <div class="qa-section">
              <h4>Feature Flags</h4>
              <div class="qa-feature-flags" id="qa-feature-flags">
                ${this.renderFeatureFlags()}
              </div>
            </div>
          </div>
          
          <!-- Data Sources Tab -->
          <div id="qa-tab-data" class="qa-tab-panel">
            <div class="qa-section">
              <h4>Data Source Status</h4>
              <div class="qa-data-sources" id="qa-data-sources">
                ${this.renderDataSources()}
              </div>
            </div>
            
            <div class="qa-section">
              <h4>API Endpoints</h4>
              <div class="qa-api-endpoints" id="qa-api-endpoints">
                ${this.renderApiEndpoints()}
              </div>
            </div>
          </div>
          
          <!-- Performance Tab -->
          <div id="qa-tab-performance" class="qa-tab-panel">
            <div class="qa-section">
              <h4>Performance Metrics</h4>
              <div class="qa-performance-metrics" id="qa-performance-metrics">
                ${this.renderPerformanceMetrics()}
              </div>
            </div>
          </div>
          
          <!-- Console Tab -->
          <div id="qa-tab-console" class="qa-tab-panel">
            <div class="qa-section">
              <h4>Console Logs</h4>
              <div class="qa-console" id="qa-console">
                <div class="qa-console-controls">
                  <button class="qa-btn qa-clear-console">Clear</button>
                  <button class="qa-btn qa-export-logs">Export Logs</button>
                </div>
                <div class="qa-console-output" id="qa-console-output"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlayElement);
    this.addStyles();
    this.bindEvents();
    this.interceptConsole();
  }
  
  addStyles() {
    const styleId = 'qa-overlay-styles';
    if (document.getElementById(styleId)) return;
    
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .qa-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: rgba(20, 20, 20, 0.95);
        color: #e0e0e0;
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        z-index: 9999;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        overflow: hidden;
        resize: both;
        min-width: 300px;
        min-height: 200px;
        transition: all 0.3s ease;
      }
      
      .qa-overlay.hidden {
        display: none;
      }
      
      .qa-overlay.minimized {
        height: 40px !important;
        overflow: hidden;
      }
      
      .qa-overlay-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: rgba(0, 103, 177, 0.8);
        border-bottom: 1px solid #444;
        cursor: move;
        user-select: none;
      }
      
      .qa-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 13px;
      }
      
      .qa-controls {
        display: flex;
        gap: 4px;
      }
      
      .qa-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      }
      
      .qa-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .qa-overlay-content {
        display: flex;
        flex-direction: column;
        height: calc(100% - 40px);
        overflow: hidden;
      }
      
      .qa-tabs {
        display: flex;
        background: rgba(40, 40, 40, 0.8);
        border-bottom: 1px solid #444;
      }
      
      .qa-tab {
        flex: 1;
        padding: 8px 12px;
        background: transparent;
        border: none;
        color: #ccc;
        cursor: pointer;
        font-size: 11px;
        border-right: 1px solid #444;
        transition: all 0.2s;
      }
      
      .qa-tab:last-child {
        border-right: none;
      }
      
      .qa-tab:hover,
      .qa-tab.active {
        background: rgba(0, 103, 177, 0.3);
        color: white;
      }
      
      .qa-tab-content {
        flex: 1;
        overflow-y: auto;
      }
      
      .qa-tab-panel {
        display: none;
        padding: 12px;
        height: 100%;
        overflow-y: auto;
      }
      
      .qa-tab-panel.active {
        display: block;
      }
      
      .qa-section {
        margin-bottom: 16px;
      }
      
      .qa-section h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #ffd100;
        border-bottom: 1px solid #444;
        padding-bottom: 4px;
      }
      
      .qa-info-grid {
        display: grid;
        gap: 4px;
      }
      
      .qa-info-item {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 8px;
        padding: 2px 0;
      }
      
      .qa-info-item label {
        font-weight: bold;
        color: #ccc;
      }
      
      .qa-info-item span {
        color: #e0e0e0;
        word-break: break-all;
      }
      
      .qa-status-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
      }
      
      .qa-status-online {
        background: #28a745;
      }
      
      .qa-status-offline {
        background: #dc3545;
      }
      
      .qa-status-warning {
        background: #ffc107;
      }
      
      .qa-feature-flags,
      .qa-data-sources,
      .qa-api-endpoints,
      .qa-performance-metrics {
        display: grid;
        gap: 6px;
      }
      
      .qa-feature-flag,
      .qa-data-source,
      .qa-api-endpoint,
      .qa-metric {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        border-left: 3px solid transparent;
      }
      
      .qa-feature-flag.enabled,
      .qa-data-source.connected,
      .qa-api-endpoint.healthy {
        border-left-color: #28a745;
      }
      
      .qa-feature-flag.disabled,
      .qa-data-source.disconnected,
      .qa-api-endpoint.error {
        border-left-color: #dc3545;
      }
      
      .qa-console {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .qa-console-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #444;
      }
      
      .qa-console-output {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid #444;
        border-radius: 4px;
        padding: 8px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        max-height: 200px;
      }
      
      .qa-log-entry {
        padding: 2px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .qa-log-timestamp {
        color: #888;
        margin-right: 8px;
      }
      
      .qa-log-level {
        margin-right: 8px;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 2px;
        font-size: 10px;
      }
      
      .qa-log-level.info {
        background: rgba(23, 162, 184, 0.3);
        color: #17a2b8;
      }
      
      .qa-log-level.warn {
        background: rgba(255, 193, 7, 0.3);
        color: #ffc107;
      }
      
      .qa-log-level.error {
        background: rgba(220, 53, 69, 0.3);
        color: #dc3545;
      }
      
      /* Draggable functionality */
      .qa-overlay.dragging {
        cursor: move;
        user-select: none;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .qa-overlay {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  bindEvents() {
    const overlay = this.overlayElement;
    
    // Close button
    overlay.querySelector('.qa-close').addEventListener('click', () => this.hide());
    
    // Minimize button
    overlay.querySelector('.qa-minimize').addEventListener('click', () => this.toggleMinimize());
    
    // Tab switching
    overlay.querySelectorAll('.qa-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    // Console controls
    overlay.querySelector('.qa-clear-console').addEventListener('click', () => this.clearConsole());
    overlay.querySelector('.qa-export-logs').addEventListener('click', () => this.exportLogs());
    
    // Make draggable
    this.makeDraggable();
  }
  
  bindKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  makeDraggable() {
    const header = this.overlayElement.querySelector('.qa-overlay-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.overlayElement.classList.add('dragging');
      
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.overlayElement.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = Math.max(0, Math.min(window.innerWidth - this.overlayElement.offsetWidth, startLeft + deltaX));
      const newTop = Math.max(0, Math.min(window.innerHeight - this.overlayElement.offsetHeight, startTop + deltaY));
      
      this.overlayElement.style.left = newLeft + 'px';
      this.overlayElement.style.top = newTop + 'px';
      this.overlayElement.style.right = 'auto';
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      this.overlayElement.classList.remove('dragging');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
  
  startMetricsUpdate() {
    this.refreshInterval = setInterval(() => {
      if (this.isVisible) {
        this.updateMetrics();
      }
    }, 1000);
  }
  
  updateMetrics() {
    // Update session time
    const sessionTime = Math.floor((Date.now() - this.startTime) / 1000);
    const sessionElement = document.getElementById('qa-session-time');
    if (sessionElement) {
      sessionElement.textContent = this.formatTime(sessionTime);
    }
    
    // Update viewport size
    const viewportElement = document.getElementById('qa-viewport');
    if (viewportElement) {
      viewportElement.textContent = `${window.innerWidth}x${window.innerHeight}`;
    }
    
    // Update performance metrics if tab is active
    const perfTab = document.getElementById('qa-tab-performance');
    if (perfTab && perfTab.classList.contains('active')) {
      this.updatePerformanceMetrics();
    }
  }
  
  // Utility methods
  getBuildInfo() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  }
  
  getEnvironment() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'Development';
    if (location.hostname.includes('staging') || location.hostname.includes('preview')) return 'Staging';
    return 'Production';
  }
  
  getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
  
  getPageLoadTime() {
    if (performance && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 'N/A';
  }
  
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  
  renderFeatureFlags() {
    const flags = [
      { name: 'AI Insights', enabled: true },
      { name: 'Real-time Data', enabled: true },
      { name: 'Export Functions', enabled: true },
      { name: 'Dark Mode', enabled: false },
      { name: 'Beta Features', enabled: false }
    ];
    
    return flags.map(flag => `
      <div class="qa-feature-flag ${flag.enabled ? 'enabled' : 'disabled'}">
        <span>${flag.name}</span>
        <span class="qa-status-indicator ${flag.enabled ? 'qa-status-online' : 'qa-status-offline'}"></span>
      </div>
    `).join('');
  }
  
  renderDataSources() {
    const sources = [
      { name: 'Primary Database', status: 'connected', latency: '23ms' },
      { name: 'Analytics API', status: 'connected', latency: '156ms' },
      { name: 'Cache Layer', status: 'connected', latency: '2ms' },
      { name: 'External APIs', status: 'warning', latency: '890ms' }
    ];
    
    return sources.map(source => `
      <div class="qa-data-source ${source.status}">
        <div>
          <span class="qa-status-indicator qa-status-${source.status === 'connected' ? 'online' : source.status === 'disconnected' ? 'offline' : 'warning'}"></span>
          ${source.name}
        </div>
        <span>${source.latency}</span>
      </div>
    `).join('');
  }
  
  renderApiEndpoints() {
    const endpoints = [
      { name: '/api/dashboard/data', status: 'healthy', response: '200' },
      { name: '/api/insights/generate', status: 'healthy', response: '200' },
      { name: '/api/export/data', status: 'healthy', response: '200' },
      { name: '/api/user/preferences', status: 'error', response: '500' }
    ];
    
    return endpoints.map(endpoint => `
      <div class="qa-api-endpoint ${endpoint.status}">
        <span>${endpoint.name}</span>
        <span>${endpoint.response}</span>
      </div>
    `).join('');
  }
  
  renderPerformanceMetrics() {
    const metrics = {
      'Memory Usage': `${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB`,
      'DOM Elements': document.querySelectorAll('*').length,
      'Network Requests': 'N/A',
      'Render Time': `${Math.round(performance.now())}ms`
    };
    
    return Object.entries(metrics).map(([key, value]) => `
      <div class="qa-metric">
        <span>${key}</span>
        <span>${value}</span>
      </div>
    `).join('');
  }
  
  updatePerformanceMetrics() {
    const container = document.getElementById('qa-performance-metrics');
    if (container) {
      container.innerHTML = this.renderPerformanceMetrics();
    }
  }
  
  interceptConsole() {
    const consoleOutput = document.getElementById('qa-console-output');
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    const addLogEntry = (level, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const entry = document.createElement('div');
      entry.className = 'qa-log-entry';
      entry.innerHTML = `
        <span class="qa-log-timestamp">${timestamp}</span>
        <span class="qa-log-level ${level}">${level.toUpperCase()}</span>
        <span class="qa-log-message">${message}</span>
      `;
      
      consoleOutput.appendChild(entry);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
      
      // Keep only last 100 entries
      while (consoleOutput.children.length > 100) {
        consoleOutput.removeChild(consoleOutput.firstChild);
      }
    };
    
    console.log = (...args) => {
      originalLog.apply(console, args);
      addLogEntry('info', args);
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLogEntry('warn', args);
    };
    
    console.error = (...args) => {
      originalError.apply(console, args);
      addLogEntry('error', args);
    };
  }
  
  // Public API methods
  show() {
    this.isVisible = true;
    this.overlayElement.classList.remove('hidden');
    this.overlayElement.setAttribute('aria-hidden', 'false');
    this.updateMetrics();
  }
  
  hide() {
    this.isVisible = false;
    this.overlayElement.classList.add('hidden');
    this.overlayElement.setAttribute('aria-hidden', 'true');
  }
  
  toggle() {
    this.isVisible ? this.hide() : this.show();
  }
  
  toggleMinimize() {
    this.overlayElement.classList.toggle('minimized');
  }
  
  switchTab(tabName) {
    // Remove active class from all tabs and panels
    this.overlayElement.querySelectorAll('.qa-tab, .qa-tab-panel').forEach(el => {
      el.classList.remove('active');
    });
    
    // Add active class to selected tab and panel
    this.overlayElement.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    this.overlayElement.querySelector(`#qa-tab-${tabName}`).classList.add('active');
    
    // Update metrics if performance tab is selected
    if (tabName === 'performance') {
      this.updatePerformanceMetrics();
    }
  }
  
  clearConsole() {
    const consoleOutput = document.getElementById('qa-console-output');
    if (consoleOutput) {
      consoleOutput.innerHTML = '';
    }
  }
  
  exportLogs() {
    const consoleOutput = document.getElementById('qa-console-output');
    const logs = Array.from(consoleOutput.children).map(entry => entry.textContent).join('\\n');
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    
    const styles = document.getElementById('qa-overlay-styles');
    if (styles) {
      styles.remove();
    }
  }
}

// Create global instance
window.qaOverlay = new QaOverlay();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QaOverlay;
}