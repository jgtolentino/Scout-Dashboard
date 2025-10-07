/**
 * @file qa_overlay.js
 * @description QA Overlay System with Alt+Shift+D Toggle for Client360 Dashboard
 * @version v2.4.0
 */

class QAOverlay {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.isVisible = false;
    this.isEnabled = false;
    this.qaData = {
      elements: [],
      issues: [],
      coverage: {},
      performance: {}
    };
    this.config = {
      toggleKeys: ['Alt', 'Shift', 'KeyD'],
      highlightColors: {
        interactive: '#ffc300',
        data: '#005bbb',
        navigation: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      },
      checkCategories: [
        'Accessibility',
        'Performance',
        'Data Validation',
        'UI Consistency',
        'Responsive Design',
        'Browser Compatibility'
      ]
    };
    this.keyState = {};
    this.init();
  }

  init() {
    this.createQAOverlay();
    this.attachKeyboardListeners();
    this.scanPageElements();
    this.runAutomaticChecks();
    this.enableDeveloperMode();
  }

  createQAOverlay() {
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
          <!-- Overview Tab -->
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
                <h4>Quick Checks</h4>
                <div class="qa-check-list" id="quick-checks">
                  <!-- Dynamic content -->
                </div>
              </div>
              
              <div class="qa-recent-activity">
                <h4>Recent Activity</h4>
                <div class="qa-activity-log" id="activity-log">
                  <!-- Dynamic content -->
                </div>
              </div>
            </div>
          </div>
          
          <!-- Elements Tab -->
          <div id="elements-tab" class="qa-tab-panel">
            <div class="qa-elements">
              <div class="qa-element-filters">
                <select id="element-type-filter">
                  <option value="all">All Elements</option>
                  <option value="interactive">Interactive</option>
                  <option value="data">Data Components</option>
                  <option value="navigation">Navigation</option>
                  <option value="form">Form Elements</option>
                </select>
                <button id="highlight-elements" class="qa-btn qa-btn-sm">Highlight on Page</button>
              </div>
              
              <div class="qa-element-list" id="element-list">
                <!-- Dynamic content -->
              </div>
            </div>
          </div>
          
          <!-- Issues Tab -->
          <div id="issues-tab" class="qa-tab-panel">
            <div class="qa-issues">
              <div class="qa-issue-filters">
                <select id="issue-severity-filter">
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select id="issue-category-filter">
                  <option value="all">All Categories</option>
                  ${this.config.checkCategories.map(cat => 
                    `<option value="${cat.toLowerCase().replace(/\s+/g, '-')}">${cat}</option>`
                  ).join('')}
                </select>
              </div>
              
              <div class="qa-issue-list" id="issue-list">
                <!-- Dynamic content -->
              </div>
            </div>
          </div>
          
          <!-- Performance Tab -->
          <div id="performance-tab" class="qa-tab-panel">
            <div class="qa-performance">
              <div class="qa-performance-metrics">
                <div class="qa-metric-group">
                  <h4>Loading Performance</h4>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">Page Load Time</span>
                    <span class="qa-metric-value" id="page-load-time">--</span>
                  </div>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">DOM Content Loaded</span>
                    <span class="qa-metric-value" id="dom-content-loaded">--</span>
                  </div>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">First Contentful Paint</span>
                    <span class="qa-metric-value" id="first-contentful-paint">--</span>
                  </div>
                </div>
                
                <div class="qa-metric-group">
                  <h4>Memory Usage</h4>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">Used JS Heap Size</span>
                    <span class="qa-metric-value" id="js-heap-size">--</span>
                  </div>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">Total JS Heap Size</span>
                    <span class="qa-metric-value" id="js-heap-total">--</span>
                  </div>
                </div>
                
                <div class="qa-metric-group">
                  <h4>Network</h4>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">Resource Count</span>
                    <span class="qa-metric-value" id="resource-count">--</span>
                  </div>
                  <div class="qa-metric-item">
                    <span class="qa-metric-label">Transfer Size</span>
                    <span class="qa-metric-value" id="transfer-size">--</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="qa-element-highlights" id="qa-highlights">
        <!-- Dynamic highlights -->
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.attachOverlayListeners();
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      this.keyState[e.code] = true;
      this.checkToggleKeys();
    });

    document.addEventListener('keyup', (e) => {
      this.keyState[e.code] = false;
    });
  }

  checkToggleKeys() {
    const allPressed = this.config.toggleKeys.every(key => this.keyState[key]);
    if (allPressed && !this.isToggling) {
      this.isToggling = true;
      this.toggle();
      setTimeout(() => {
        this.isToggling = false;
      }, 200);
    }
  }

  attachOverlayListeners() {
    // Tab switching
    document.querySelectorAll('.qa-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Control buttons
    document.getElementById('qa-close')?.addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('qa-refresh')?.addEventListener('click', () => {
      this.refresh();
    });

    document.getElementById('qa-export')?.addEventListener('click', () => {
      this.exportReport();
    });

    document.getElementById('highlight-elements')?.addEventListener('click', () => {
      this.toggleElementHighlights();
    });

    // Filters
    document.getElementById('element-type-filter')?.addEventListener('change', (e) => {
      this.filterElements(e.target.value);
    });

    document.getElementById('issue-severity-filter')?.addEventListener('change', (e) => {
      this.filterIssues('severity', e.target.value);
    });

    document.getElementById('issue-category-filter')?.addEventListener('change', (e) => {
      this.filterIssues('category', e.target.value);
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
    document.getElementById('qa-overlay').classList.remove('hidden');
    this.isVisible = true;
    this.refresh();
    this.logActivity('QA Overlay opened');
  }

  hide() {
    document.getElementById('qa-overlay').classList.add('hidden');
    this.isVisible = false;
    this.clearHighlights();
    this.logActivity('QA Overlay closed');
  }

  refresh() {
    this.scanPageElements();
    this.runAutomaticChecks();
    this.updateOverview();
    this.updateElementList();
    this.updateIssueList();
    this.updatePerformanceMetrics();
    this.logActivity('QA analysis refreshed');
  }

  scanPageElements() {
    this.qaData.elements = [];
    
    // Scan interactive elements
    const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
    interactive.forEach((el, index) => {
      this.qaData.elements.push({
        id: `interactive-${index}`,
        type: 'interactive',
        tagName: el.tagName.toLowerCase(),
        element: el,
        text: el.textContent?.slice(0, 50) || el.getAttribute('aria-label') || el.getAttribute('title') || 'No text content',
        accessible: this.checkAccessibility(el),
        visible: this.isElementVisible(el),
        position: this.getElementPosition(el)
      });
    });

    // Scan data components
    const dataElements = document.querySelectorAll('[data-*], .kpi-tile, .chart-container, .metric-card');
    dataElements.forEach((el, index) => {
      this.qaData.elements.push({
        id: `data-${index}`,
        type: 'data',
        tagName: el.tagName.toLowerCase(),
        element: el,
        text: el.textContent?.slice(0, 50) || 'Data component',
        hasData: el.dataset || el.querySelector('[data-*]'),
        visible: this.isElementVisible(el),
        position: this.getElementPosition(el)
      });
    });

    // Scan navigation elements
    const navigation = document.querySelectorAll('nav, .nav, .navigation, .menu, .tab');
    navigation.forEach((el, index) => {
      this.qaData.elements.push({
        id: `nav-${index}`,
        type: 'navigation',
        tagName: el.tagName.toLowerCase(),
        element: el,
        text: el.textContent?.slice(0, 50) || 'Navigation element',
        linksCount: el.querySelectorAll('a').length,
        visible: this.isElementVisible(el),
        position: this.getElementPosition(el)
      });
    });
  }

  runAutomaticChecks() {
    this.qaData.issues = [];

    // Accessibility checks
    this.checkAccessibilityIssues();
    
    // Performance checks
    this.checkPerformanceIssues();
    
    // Data validation checks
    this.checkDataValidation();
    
    // UI consistency checks
    this.checkUIConsistency();
    
    // Responsive design checks
    this.checkResponsiveDesign();

    // Calculate coverage score
    this.calculateCoverageScore();
  }

  checkAccessibilityIssues() {
    // Check for missing alt attributes
    document.querySelectorAll('img:not([alt])').forEach(img => {
      this.addIssue('accessibility', 'high', 'Missing alt attribute', img, 'Image missing alt text for screen readers');
    });

    // Check for missing form labels
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      if (!input.closest('label') && input.type !== 'hidden') {
        this.addIssue('accessibility', 'medium', 'Missing form label', input, 'Form input missing accessible label');
      }
    });

    // Check color contrast (simplified)
    document.querySelectorAll('button, a, .btn').forEach(el => {
      const styles = getComputedStyle(el);
      if (styles.color === styles.backgroundColor) {
        this.addIssue('accessibility', 'high', 'Poor color contrast', el, 'Text and background colors are too similar');
      }
    });
  }

  checkPerformanceIssues() {
    // Check for large images
    document.querySelectorAll('img').forEach(img => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        this.addIssue('performance', 'medium', 'Large image', img, 'Image size may impact loading performance');
      }
    });

    // Check for missing lazy loading
    document.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        this.addIssue('performance', 'low', 'Missing lazy loading', img, 'Below-fold image not using lazy loading');
      }
    });
  }

  checkDataValidation() {
    // Check for empty data containers
    document.querySelectorAll('.chart-container, .kpi-tile, .metric-card').forEach(container => {
      if (!container.textContent.trim()) {
        this.addIssue('data-validation', 'medium', 'Empty data container', container, 'Data container appears to be empty');
      }
    });

    // Check for placeholder data
    document.querySelectorAll('*').forEach(el => {
      if (el.textContent?.includes('Lorem ipsum') || el.textContent?.includes('placeholder')) {
        this.addIssue('data-validation', 'low', 'Placeholder content', el, 'Element contains placeholder text');
      }
    });
  }

  checkUIConsistency() {
    // Check button consistency
    const buttons = document.querySelectorAll('button, .btn');
    const buttonClasses = new Set();
    buttons.forEach(btn => {
      btn.classList.forEach(cls => buttonClasses.add(cls));
    });

    if (buttonClasses.size > 10) {
      this.addIssue('ui-consistency', 'low', 'Button class inconsistency', document.body, 'Too many different button classes may indicate inconsistent styling');
    }
  }

  checkResponsiveDesign() {
    // Check for horizontal overflow
    if (document.body.scrollWidth > window.innerWidth) {
      this.addIssue('responsive-design', 'medium', 'Horizontal overflow', document.body, 'Page content extends beyond viewport width');
    }

    // Check fixed-width elements
    document.querySelectorAll('*').forEach(el => {
      const styles = getComputedStyle(el);
      if (styles.width && styles.width.includes('px') && parseInt(styles.width) > 1200) {
        this.addIssue('responsive-design', 'low', 'Fixed large width', el, 'Element has fixed large width that may not be responsive');
      }
    });
  }

  addIssue(category, severity, title, element, description) {
    this.qaData.issues.push({
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      severity,
      title,
      description,
      element,
      timestamp: new Date().toISOString(),
      fixed: false
    });
  }

  calculateCoverageScore() {
    const totalElements = this.qaData.elements.length;
    const checkedElements = this.qaData.elements.filter(el => el.accessible !== undefined).length;
    this.qaData.coverage.score = totalElements > 0 ? Math.round((checkedElements / totalElements) * 100) : 0;
  }

  updateOverview() {
    document.getElementById('total-elements').textContent = this.qaData.elements.length;
    document.getElementById('total-issues').textContent = this.qaData.issues.length;
    document.getElementById('coverage-score').textContent = `${this.qaData.coverage.score || 0}%`;
    
    // Update quick checks
    const quickChecks = document.getElementById('quick-checks');
    const checks = [
      { name: 'Accessibility', status: this.qaData.issues.filter(i => i.category === 'accessibility').length === 0 },
      { name: 'Performance', status: this.qaData.issues.filter(i => i.category === 'performance').length === 0 },
      { name: 'Data Validation', status: this.qaData.issues.filter(i => i.category === 'data-validation').length === 0 },
      { name: 'UI Consistency', status: this.qaData.issues.filter(i => i.category === 'ui-consistency').length === 0 }
    ];

    quickChecks.innerHTML = checks.map(check => `
      <div class="qa-check-item ${check.status ? 'passed' : 'failed'}">
        <span class="qa-check-icon">${check.status ? '✓' : '✗'}</span>
        <span class="qa-check-name">${check.name}</span>
      </div>
    `).join('');
  }

  updateElementList() {
    const elementList = document.getElementById('element-list');
    elementList.innerHTML = this.qaData.elements.map(el => `
      <div class="qa-element-item" data-element-id="${el.id}">
        <div class="qa-element-header">
          <span class="qa-element-type ${el.type}">${el.type}</span>
          <span class="qa-element-tag">${el.tagName}</span>
          <button class="qa-element-locate" data-element-id="${el.id}">Locate</button>
        </div>
        <div class="qa-element-text">${el.text}</div>
        <div class="qa-element-status">
          ${el.accessible !== undefined ? (el.accessible ? '✓ Accessible' : '✗ Accessibility Issues') : ''}
          ${el.visible ? '👁 Visible' : '🚫 Hidden'}
        </div>
      </div>
    `).join('');

    // Attach locate buttons
    elementList.querySelectorAll('.qa-element-locate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.locateElement(e.target.dataset.elementId);
      });
    });
  }

  updateIssueList() {
    const issueList = document.getElementById('issue-list');
    issueList.innerHTML = this.qaData.issues.map(issue => `
      <div class="qa-issue-item severity-${issue.severity}">
        <div class="qa-issue-header">
          <span class="qa-issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
          <span class="qa-issue-category">${issue.category}</span>
          <span class="qa-issue-title">${issue.title}</span>
        </div>
        <div class="qa-issue-description">${issue.description}</div>
        <div class="qa-issue-actions">
          <button class="qa-issue-locate" data-issue-id="${issue.id}">Locate Element</button>
          <button class="qa-issue-ignore" data-issue-id="${issue.id}">Ignore</button>
        </div>
      </div>
    `).join('');

    // Attach action buttons
    issueList.querySelectorAll('.qa-issue-locate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.locateIssueElement(e.target.dataset.issueId);
      });
    });
  }

  updatePerformanceMetrics() {
    // Get performance timing
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      document.getElementById('page-load-time').textContent = `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`;
      document.getElementById('dom-content-loaded').textContent = `${Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)}ms`;
    }

    // Get memory info if available
    if (performance.memory) {
      document.getElementById('js-heap-size').textContent = this.formatBytes(performance.memory.usedJSHeapSize);
      document.getElementById('js-heap-total').textContent = this.formatBytes(performance.memory.totalJSHeapSize);
    }

    // Get resource info
    const resources = performance.getEntriesByType('resource');
    document.getElementById('resource-count').textContent = resources.length;
    
    const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
    document.getElementById('transfer-size').textContent = this.formatBytes(totalSize);
  }

  switchTab(tabName) {
    document.querySelectorAll('.qa-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.qa-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });
  }

  locateElement(elementId) {
    const element = this.qaData.elements.find(el => el.id === elementId);
    if (element && element.element) {
      this.highlightElement(element.element);
      element.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  highlightElement(element) {
    // Remove existing highlights
    document.querySelectorAll('.qa-highlight').forEach(h => h.remove());

    // Create highlight
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'qa-highlight';
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid ${this.config.highlightColors.interactive};
      background: ${this.config.highlightColors.interactive}20;
      pointer-events: none;
      z-index: 10000;
      animation: qa-pulse 2s ease-in-out;
    `;

    document.body.appendChild(highlight);

    // Remove after animation
    setTimeout(() => {
      highlight.remove();
    }, 2000);
  }

  checkAccessibility(element) {
    let score = 100;
    
    // Check for alt text on images
    if (element.tagName === 'IMG' && !element.alt) score -= 30;
    
    // Check for aria labels
    if (['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.textContent.trim()) {
        score -= 25;
      }
    }
    
    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) > 0) score -= 15;

    return score >= 70;
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' && 
           style.opacity !== '0';
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  logActivity(message) {
    const log = document.getElementById('activity-log');
    if (log) {
      const entry = document.createElement('div');
      entry.className = 'qa-activity-entry';
      entry.innerHTML = `
        <span class="qa-activity-time">${new Date().toLocaleTimeString()}</span>
        <span class="qa-activity-message">${message}</span>
      `;
      log.prepend(entry);
      
      // Keep only last 10 entries
      while (log.children.length > 10) {
        log.removeChild(log.lastChild);
      }
    }
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      elements: this.qaData.elements.length,
      issues: this.qaData.issues,
      coverage: this.qaData.coverage,
      performance: this.qaData.performance,
      summary: {
        criticalIssues: this.qaData.issues.filter(i => i.severity === 'critical').length,
        highIssues: this.qaData.issues.filter(i => i.severity === 'high').length,
        mediumIssues: this.qaData.issues.filter(i => i.severity === 'medium').length,
        lowIssues: this.qaData.issues.filter(i => i.severity === 'low').length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.logActivity('QA report exported');
  }

  enableDeveloperMode() {
    // Add CSS for QA overlay
    if (!document.getElementById('qa-overlay-styles')) {
      const styles = document.createElement('style');
      styles.id = 'qa-overlay-styles';
      styles.textContent = `
        @keyframes qa-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        
        .qa-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }
        
        .qa-overlay.hidden { display: none; }
        
        .qa-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: calc(100vh - 40px);
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .qa-header {
          background: #ffc300;
          color: #000;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .qa-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .qa-version {
          font-size: 12px;
          opacity: 0.8;
        }
        
        .qa-btn {
          background: none;
          border: 1px solid currentColor;
          color: inherit;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .qa-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .qa-content {
          flex: 1;
          overflow-y: auto;
          max-height: calc(100vh - 140px);
        }
        
        .qa-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .qa-tab-btn {
          flex: 1;
          padding: 12px 8px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 12px;
          color: #6b7280;
        }
        
        .qa-tab-btn.active {
          color: #ffc300;
          border-bottom: 2px solid #ffc300;
        }
        
        .qa-tab-panel {
          display: none;
          padding: 16px;
        }
        
        .qa-tab-panel.active {
          display: block;
        }
        
        .qa-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .qa-stat-card {
          text-align: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }
        
        .qa-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #005bbb;
        }
        
        .qa-stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .qa-issue-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }
        
        .qa-issue-item.severity-critical {
          border-left: 4px solid #ef4444;
        }
        
        .qa-issue-item.severity-high {
          border-left: 4px solid #f59e0b;
        }
        
        .qa-issue-item.severity-medium {
          border-left: 4px solid #3b82f6;
        }
        
        .qa-issue-item.severity-low {
          border-left: 4px solid #10b981;
        }
      `;
      document.head.appendChild(styles);
    }
  }
}

// Global export and keyboard shortcut
if (typeof window !== 'undefined') {
  window.QAOverlay = QAOverlay;
  
  // Auto-initialize when page loads
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.qaOverlay) {
      window.qaOverlay = new QAOverlay();
    }
  });
}

export default QAOverlay;