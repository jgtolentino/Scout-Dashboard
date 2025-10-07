/**
 * QA Overlay Component (F11)
 * PRD Requirement: Alt+Shift+D toggle for QA overlay with diagnostic information
 * Enhanced for production dashboard testing
 */

class QAOverlay {
  constructor() {
    this.isVisible = false;
    this.keyState = {};
    this.qaData = {
      elements: [],
      issues: [],
      performance: {},
      coverage: {}
    };
    
    this.config = {
      toggleKeys: ['Alt', 'Shift', 'KeyD'],
      highlightColors: {
        interactive: '#ffc300',
        data: '#005bbb',
        navigation: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
      }
    };
    
    this.init();
  }

  init() {
    this.createOverlay();
    this.attachKeyboardListeners();
    this.runInitialScan();
    console.log('🔍 QA Overlay initialized - Press Alt+Shift+D to toggle');
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'qa-overlay';
    overlay.className = 'qa-overlay hidden';
    overlay.innerHTML = `
      <div class="qa-panel">
        <div class="qa-header">
          <h3 class="qa-title">
            <span class="qa-icon">🔍</span>
            QA Dashboard
            <span class="qa-version">v2.4.0</span>
          </h3>
          <div class="qa-controls">
            <button id="qa-refresh" class="qa-btn qa-btn-sm" title="Refresh Analysis">↻</button>
            <button id="qa-export" class="qa-btn qa-btn-sm" title="Export Report">📊</button>
            <button id="qa-close" class="qa-btn qa-btn-close" title="Close (Alt+Shift+D)">×</button>
          </div>
        </div>
        
        <div class="qa-tabs">
          <button class="qa-tab-btn active" data-tab="overview">Overview</button>
          <button class="qa-tab-btn" data-tab="elements">Elements</button>
          <button class="qa-tab-btn" data-tab="issues">Issues</button>
          <button class="qa-tab-btn" data-tab="performance">Performance</button>
        </div>
        
        <div class="qa-content">
          <div id="overview-tab" class="qa-tab-panel active">
            <div class="qa-overview">
              <div class="qa-stats">
                <div class="qa-stat-card">
                  <div class="qa-stat-value" id="total-elements">--</div>
                  <div class="qa-stat-label">Elements Scanned</div>
                </div>
                <div class="qa-stat-card">
                  <div class="qa-stat-value" id="total-issues">--</div>
                  <div class="qa-stat-label">Issues Found</div>
                </div>
                <div class="qa-stat-card">
                  <div class="qa-stat-value" id="coverage-score">--</div>
                  <div class="qa-stat-label">Coverage Score</div>
                </div>
                <div class="qa-stat-card">
                  <div class="qa-stat-value" id="performance-score">--</div>
                  <div class="qa-stat-label">Performance Score</div>
                </div>
              </div>
              
              <div class="qa-quick-checks">
                <h4>System Status</h4>
                <div class="qa-check-list" id="quick-checks">
                  <div class="qa-check-item">
                    <span class="qa-check-icon">⏳</span>
                    <span class="qa-check-label">Running diagnostics...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div id="elements-tab" class="qa-tab-panel">
            <div class="qa-elements-list" id="elements-list">
              <div class="qa-loading">Scanning elements...</div>
            </div>
          </div>
          
          <div id="issues-tab" class="qa-tab-panel">
            <div class="qa-issues-list" id="issues-list">
              <div class="qa-loading">Analyzing issues...</div>
            </div>
          </div>
          
          <div id="performance-tab" class="qa-tab-panel">
            <div class="qa-performance-info" id="performance-info">
              <div class="qa-loading">Measuring performance...</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.attachOverlayListeners();
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      this.keyState[e.code] = true;
      
      // Check if Alt+Shift+D is pressed
      if (this.keyState['AltLeft'] && this.keyState['ShiftLeft'] && this.keyState['KeyD']) {
        e.preventDefault();
        this.toggle();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keyState[e.code] = false;
    });
  }

  attachOverlayListeners() {
    // Close button
    document.getElementById('qa-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Refresh button
    document.getElementById('qa-refresh')?.addEventListener('click', () => {
      this.runFullScan();
    });

    // Export button
    document.getElementById('qa-export')?.addEventListener('click', () => {
      this.exportReport();
    });

    // Tab buttons
    document.querySelectorAll('.qa-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    const overlay = document.getElementById('qa-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      this.isVisible = true;
      this.runFullScan();
      console.log('🔍 QA Overlay opened');
    }
  }

  hide() {
    const overlay = document.getElementById('qa-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      this.isVisible = false;
      this.clearHighlights();
      console.log('🔍 QA Overlay closed');
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.qa-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    document.querySelectorAll('.qa-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });

    // Load tab-specific data
    this.loadTabData(tabName);
  }

  runInitialScan() {
    // Run basic scan on initialization
    this.scanElements();
    this.checkPerformance();
  }

  runFullScan() {
    console.log('🔍 Running full QA scan...');
    
    this.scanElements();
    this.checkIssues();
    this.checkPerformance();
    this.updateStats();
    this.updateQuickChecks();
  }

  scanElements() {
    this.qaData.elements = [];
    
    // Scan interactive elements
    const interactiveSelectors = [
      'button', 'a[href]', 'input', 'select', 'textarea',
      '[role="button"]', '[role="tab"]', '[role="link"]',
      '.clickable', '.btn', '.nav-link', '.kpi-card'
    ];

    interactiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        this.qaData.elements.push({
          type: 'interactive',
          selector: selector,
          element: el,
          text: el.textContent?.trim() || el.getAttribute('aria-label') || 'No text',
          isVisible: this.isElementVisible(el),
          isClickable: this.isElementClickable(el),
          hasAccessibility: this.hasAccessibilityAttributes(el)
        });
      });
    });

    // Scan data elements
    const dataSelectors = [
      '[data-*]', '.kpi-value', '.metric-value', '.chart-container',
      '.brand-card', '.device-item', '.insight-card'
    ];

    dataSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        this.qaData.elements.push({
          type: 'data',
          selector: selector,
          element: el,
          text: el.textContent?.trim() || 'Data element',
          hasData: el.dataset && Object.keys(el.dataset).length > 0,
          isVisible: this.isElementVisible(el)
        });
      });
    });

    console.log('📊 Scanned', this.qaData.elements.length, 'elements');
  }

  checkIssues() {
    this.qaData.issues = [];

    // Check for unclickable interactive elements
    this.qaData.elements.filter(el => el.type === 'interactive').forEach(el => {
      if (el.isVisible && !el.isClickable) {
        this.qaData.issues.push({
          type: 'error',
          category: 'Interaction',
          message: `Element appears clickable but has pointer-events: none`,
          element: el.element,
          selector: el.selector
        });
      }

      if (!el.hasAccessibility) {
        this.qaData.issues.push({
          type: 'warning',
          category: 'Accessibility',
          message: `Interactive element missing accessibility attributes`,
          element: el.element,
          selector: el.selector
        });
      }
    });

    // Check for empty data elements
    this.qaData.elements.filter(el => el.type === 'data').forEach(el => {
      if (el.isVisible && (!el.text || el.text === 'Data element')) {
        this.qaData.issues.push({
          type: 'warning',
          category: 'Data',
          message: `Data element appears empty or has placeholder text`,
          element: el.element,
          selector: el.selector
        });
      }
    });

    // Check for missing alt text on images
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt) {
        this.qaData.issues.push({
          type: 'warning',
          category: 'Accessibility',
          message: `Image missing alt text`,
          element: img,
          selector: 'img'
        });
      }
    });

    console.log('⚠️ Found', this.qaData.issues.length, 'issues');
  }

  checkPerformance() {
    this.qaData.performance = {
      loadTime: performance.now(),
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A',
      domNodes: document.querySelectorAll('*').length,
      images: document.querySelectorAll('img').length,
      scripts: document.querySelectorAll('script').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      eventListeners: this.countEventListeners(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      }
    };
  }

  updateStats() {
    document.getElementById('total-elements').textContent = this.qaData.elements.length;
    document.getElementById('total-issues').textContent = this.qaData.issues.length;
    
    const coverageScore = Math.round((this.qaData.elements.filter(el => el.isVisible).length / this.qaData.elements.length) * 100);
    document.getElementById('coverage-score').textContent = coverageScore + '%';
    
    const performanceScore = this.calculatePerformanceScore();
    document.getElementById('performance-score').textContent = performanceScore + '%';
  }

  updateQuickChecks() {
    const quickChecks = document.getElementById('quick-checks');
    if (!quickChecks) return;

    const checks = [
      {
        label: 'Interactive Elements',
        status: this.qaData.elements.filter(el => el.type === 'interactive' && el.isClickable).length > 0 ? 'pass' : 'fail',
        count: this.qaData.elements.filter(el => el.type === 'interactive' && el.isClickable).length
      },
      {
        label: 'Data Elements',
        status: this.qaData.elements.filter(el => el.type === 'data' && el.hasData).length > 0 ? 'pass' : 'fail',
        count: this.qaData.elements.filter(el => el.type === 'data' && el.hasData).length
      },
      {
        label: 'Critical Issues',
        status: this.qaData.issues.filter(issue => issue.type === 'error').length === 0 ? 'pass' : 'fail',
        count: this.qaData.issues.filter(issue => issue.type === 'error').length
      },
      {
        label: 'Performance',
        status: this.qaData.performance.memoryUsage < 150 ? 'pass' : 'warning',
        count: this.qaData.performance.memoryUsage + 'MB'
      },
      {
        label: 'FMCG Data Loaded',
        status: window.SHOW_READY_DATA ? 'pass' : 'fail',
        count: window.SHOW_READY_DATA ? 'Yes' : 'No'
      }
    ];

    quickChecks.innerHTML = checks.map(check => `
      <div class="qa-check-item">
        <span class="qa-check-icon ${check.status}">
          ${check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'}
        </span>
        <span class="qa-check-label">${check.label}</span>
        <span class="qa-check-count">${check.count}</span>
      </div>
    `).join('');
  }

  loadTabData(tabName) {
    switch(tabName) {
      case 'elements':
        this.loadElementsTab();
        break;
      case 'issues':
        this.loadIssuesTab();
        break;
      case 'performance':
        this.loadPerformanceTab();
        break;
    }
  }

  loadElementsTab() {
    const elementsList = document.getElementById('elements-list');
    if (!elementsList) return;

    const groupedElements = this.groupBy(this.qaData.elements, 'type');
    
    elementsList.innerHTML = Object.entries(groupedElements).map(([type, elements]) => `
      <div class="qa-element-group">
        <h4 class="qa-group-title">${type.toUpperCase()} Elements (${elements.length})</h4>
        <div class="qa-element-items">
          ${elements.map(el => `
            <div class="qa-element-item ${el.isVisible ? 'visible' : 'hidden'}" data-selector="${el.selector}">
              <div class="qa-element-info">
                <div class="qa-element-text">${el.text}</div>
                <div class="qa-element-selector">${el.selector}</div>
              </div>
              <div class="qa-element-status">
                ${el.isVisible ? '👁️' : '🙈'}
                ${el.isClickable !== undefined ? (el.isClickable ? '👆' : '🚫') : ''}
                ${el.hasAccessibility ? '♿' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Add click listeners to highlight elements
    elementsList.querySelectorAll('.qa-element-item').forEach(item => {
      item.addEventListener('click', () => {
        const selector = item.dataset.selector;
        this.highlightElements(selector);
      });
    });
  }

  loadIssuesTab() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;

    if (this.qaData.issues.length === 0) {
      issuesList.innerHTML = '<div class="qa-no-issues">🎉 No issues found!</div>';
      return;
    }

    const groupedIssues = this.groupBy(this.qaData.issues, 'category');
    
    issuesList.innerHTML = Object.entries(groupedIssues).map(([category, issues]) => `
      <div class="qa-issue-group">
        <h4 class="qa-group-title">${category} Issues (${issues.length})</h4>
        <div class="qa-issue-items">
          ${issues.map(issue => `
            <div class="qa-issue-item ${issue.type}">
              <div class="qa-issue-icon">
                ${issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div class="qa-issue-content">
                <div class="qa-issue-message">${issue.message}</div>
                <div class="qa-issue-selector">${issue.selector}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  loadPerformanceTab() {
    const performanceInfo = document.getElementById('performance-info');
    if (!performanceInfo) return;

    performanceInfo.innerHTML = `
      <div class="qa-performance-metrics">
        <div class="qa-performance-group">
          <h4>Runtime Performance</h4>
          <div class="qa-metric-list">
            <div class="qa-metric-item">
              <span class="qa-metric-label">Load Time:</span>
              <span class="qa-metric-value">${Math.round(this.qaData.performance.loadTime)}ms</span>
            </div>
            <div class="qa-metric-item">
              <span class="qa-metric-label">Memory Usage:</span>
              <span class="qa-metric-value">${this.qaData.performance.memoryUsage}MB</span>
            </div>
            <div class="qa-metric-item">
              <span class="qa-metric-label">DOM Nodes:</span>
              <span class="qa-metric-value">${this.qaData.performance.domNodes}</span>
            </div>
          </div>
        </div>
        
        <div class="qa-performance-group">
          <h4>Resources</h4>
          <div class="qa-metric-list">
            <div class="qa-metric-item">
              <span class="qa-metric-label">Images:</span>
              <span class="qa-metric-value">${this.qaData.performance.images}</span>
            </div>
            <div class="qa-metric-item">
              <span class="qa-metric-label">Scripts:</span>
              <span class="qa-metric-value">${this.qaData.performance.scripts}</span>
            </div>
            <div class="qa-metric-item">
              <span class="qa-metric-label">Stylesheets:</span>
              <span class="qa-metric-value">${this.qaData.performance.stylesheets}</span>
            </div>
          </div>
        </div>
        
        <div class="qa-performance-group">
          <h4>Viewport</h4>
          <div class="qa-metric-list">
            <div class="qa-metric-item">
              <span class="qa-metric-label">Size:</span>
              <span class="qa-metric-value">${this.qaData.performance.viewport.width}×${this.qaData.performance.viewport.height}</span>
            </div>
            <div class="qa-metric-item">
              <span class="qa-metric-label">Pixel Ratio:</span>
              <span class="qa-metric-value">${this.qaData.performance.viewport.devicePixelRatio}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  highlightElements(selector) {
    this.clearHighlights();
    
    document.querySelectorAll(selector).forEach(el => {
      const highlight = document.createElement('div');
      highlight.className = 'qa-highlight';
      highlight.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 2px solid ${this.config.highlightColors.interactive};
        background: ${this.config.highlightColors.interactive}22;
        z-index: 9999;
      `;
      
      const rect = el.getBoundingClientRect();
      highlight.style.top = (rect.top + window.scrollY) + 'px';
      highlight.style.left = (rect.left + window.scrollX) + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
      
      document.body.appendChild(highlight);
    });
    
    // Auto-remove highlights after 3 seconds
    setTimeout(() => this.clearHighlights(), 3000);
  }

  clearHighlights() {
    document.querySelectorAll('.qa-highlight').forEach(el => el.remove());
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      dashboard_version: '2.4.0',
      elements: this.qaData.elements.length,
      issues: this.qaData.issues,
      performance: this.qaData.performance,
      coverage_score: Math.round((this.qaData.elements.filter(el => el.isVisible).length / this.qaData.elements.length) * 100),
      performance_score: this.calculatePerformanceScore()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📊 QA report exported');
  }

  // Helper methods
  isElementVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  isElementClickable(el) {
    const style = window.getComputedStyle(el);
    return style.pointerEvents !== 'none' && !el.disabled;
  }

  hasAccessibilityAttributes(el) {
    return !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title'));
  }

  countEventListeners() {
    // Approximate count based on common patterns
    return document.querySelectorAll('[onclick], [onsubmit], [onchange]').length;
  }

  calculatePerformanceScore() {
    let score = 100;
    
    if (this.qaData.performance.memoryUsage > 150) score -= 20;
    if (this.qaData.performance.domNodes > 1000) score -= 10;
    if (this.qaData.performance.loadTime > 3000) score -= 15;
    if (this.qaData.issues.filter(i => i.type === 'error').length > 0) score -= 25;
    
    return Math.max(0, score);
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}

// Add CSS styles for QA overlay
const qaOverlayStyles = `
<style>
.qa-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qa-overlay.hidden {
  display: none;
}

.qa-panel {
  background: var(--background-card);
  border-radius: 0.5rem;
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
}

.qa-title {
  margin: 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qa-version {
  font-size: 0.875rem;
  opacity: 0.8;
}

.qa-controls {
  display: flex;
  gap: 0.5rem;
}

.qa-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.qa-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.qa-btn-close {
  font-size: 1.25rem;
  font-weight: bold;
}

.qa-tabs {
  display: flex;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
}

.qa-tab-btn {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.qa-tab-btn:hover {
  background: var(--background-card);
}

.qa-tab-btn.active {
  background: var(--background-card);
  border-bottom-color: var(--primary-color);
}

.qa-content {
  height: 400px;
  overflow-y: auto;
  padding: 1rem;
}

.qa-tab-panel {
  display: none;
}

.qa-tab-panel.active {
  display: block;
}

.qa-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.qa-stat-card {
  background: var(--background-light);
  padding: 1rem;
  border-radius: 0.375rem;
  text-align: center;
}

.qa-stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.qa-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.qa-check-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qa-check-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--background-light);
  border-radius: 0.25rem;
}

.qa-check-icon {
  font-size: 1.25rem;
}

.qa-check-label {
  flex: 1;
}

.qa-check-count {
  font-weight: 500;
  color: var(--text-secondary);
}

.qa-element-group, .qa-issue-group {
  margin-bottom: 1.5rem;
}

.qa-group-title {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.qa-element-item, .qa-issue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.qa-element-item:hover {
  background: var(--background-light);
  border-color: var(--primary-color);
}

.qa-element-text, .qa-issue-message {
  font-weight: 500;
  color: var(--text-primary);
}

.qa-element-selector, .qa-issue-selector {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.qa-element-status {
  font-size: 1.25rem;
}

.qa-issue-item {
  cursor: default;
}

.qa-issue-item.error {
  border-left: 4px solid var(--danger-color);
}

.qa-issue-item.warning {
  border-left: 4px solid var(--warning-color);
}

.qa-issue-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
}

.qa-performance-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.qa-performance-group h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
}

.qa-metric-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.qa-metric-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--background-light);
  border-radius: 0.25rem;
}

.qa-metric-label {
  color: var(--text-secondary);
}

.qa-metric-value {
  font-weight: 500;
  color: var(--text-primary);
}

.qa-loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.qa-no-issues {
  text-align: center;
  color: var(--success-color);
  padding: 2rem;
  font-size: 1.25rem;
}
</style>
`;

// Inject styles and initialize
document.head.insertAdjacentHTML('beforeend', qaOverlayStyles);

// Auto-initialize QA overlay
if (typeof window !== 'undefined') {
  window.QAOverlay = QAOverlay;
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.qaOverlay = new QAOverlay();
    });
  } else {
    window.qaOverlay = new QAOverlay();
  }
}