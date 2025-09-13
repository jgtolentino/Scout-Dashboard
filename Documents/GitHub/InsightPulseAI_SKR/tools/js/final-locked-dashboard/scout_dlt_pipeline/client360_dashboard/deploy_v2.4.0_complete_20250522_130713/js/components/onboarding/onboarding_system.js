/**
 * @file onboarding_system.js
 * @description Documentation & Onboarding Flow for Client360 Dashboard (PRD Section 7)
 * @version v2.4.0
 */

class OnboardingSystem {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.currentStep = 0;
    this.isActive = false;
    this.tourCompleted = false;
    this.config = {
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Client360 Dashboard v2.4.0',
          content: 'Your comprehensive analytics platform for Sari-Sari store insights across the Philippines.',
          target: '.dashboard-container',
          position: 'center',
          buttons: ['Next', 'Skip Tour']
        },
        {
          id: 'kpi-overview',
          title: 'Key Performance Indicators',
          content: 'Monitor critical metrics like sales, conversion rates, and brand sentiment. Click any tile to drill down for detailed analysis.',
          target: '.kpi-section, .metrics-overview',
          position: 'bottom',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'filters',
          title: 'Global Filters',
          content: 'Filter data by date range, region, category, and more. Changes apply across all dashboard components.',
          target: '#global-filters',
          position: 'bottom',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'map-visualization',
          title: 'Interactive Store Map',
          content: 'Explore store locations across the Philippines. Use the map controls to switch metrics and view store details.',
          target: '.map-container, #store-map',
          position: 'top',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'ai-insights',
          title: 'AI-Powered Insights (NEW)',
          content: 'Get intelligent recommendations and analysis powered by our multi-model AI engine. Ask questions in natural language.',
          target: '.ai-insights-panel, #ai-insights',
          position: 'left',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'transaction-analytics',
          title: 'Transaction Analytics (NEW)',
          content: 'Analyze customer behavior, product substitutions, and unbranded opportunities with detailed transaction data.',
          target: '#transaction-analytics',
          position: 'top',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'brand-performance',
          title: 'Brand Performance (NEW)',
          content: 'Compare brands, analyze competitive positioning, and monitor brand health indicators.',
          target: '#brand-performance',
          position: 'top',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'personalization',
          title: 'User Personalization (NEW)',
          content: 'Customize your dashboard layout, save filter presets, and access your recent views.',
          target: '.user-preferences, .personalization-panel',
          position: 'right',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'export-features',
          title: 'Export & Sharing',
          content: 'Export data in multiple formats, create custom templates, and share insights with your team.',
          target: '.export-controls, [data-action="export"]',
          position: 'bottom',
          buttons: ['Previous', 'Next', 'Skip Tour']
        },
        {
          id: 'completion',
          title: 'Tour Complete!',
          content: 'You\'re ready to explore the Client360 Dashboard. Use the help icon (?) anytime for assistance, or press Alt+Shift+D for QA mode.',
          target: '.dashboard-container',
          position: 'center',
          buttons: ['Finish', 'Restart Tour']
        }
      ],
      helpContent: {
        'getting-started': {
          title: 'Getting Started',
          content: `
            <h3>Welcome to Client360 Dashboard</h3>
            <p>This comprehensive analytics platform helps you understand retail performance across Sari-Sari stores in the Philippines.</p>
            
            <h4>Key Features:</h4>
            <ul>
              <li><strong>Real-time KPIs</strong> - Monitor sales, conversion rates, and brand sentiment</li>
              <li><strong>Interactive Maps</strong> - Explore store locations and regional performance</li>
              <li><strong>AI Insights</strong> - Get intelligent recommendations and analysis</li>
              <li><strong>Transaction Analytics</strong> - Understand customer behavior patterns</li>
              <li><strong>Brand Comparison</strong> - Analyze competitive positioning</li>
              <li><strong>User Personalization</strong> - Customize your dashboard experience</li>
            </ul>
            
            <h4>Getting Started:</h4>
            <ol>
              <li>Start with the <strong>Take Tour</strong> button to learn about all features</li>
              <li>Use <strong>Global Filters</strong> to focus on specific time periods or regions</li>
              <li>Click on any KPI tile to drill down into detailed analysis</li>
              <li>Try the AI Insights panel to ask questions about your data</li>
            </ol>
          `
        },
        'navigation': {
          title: 'Navigation & Controls',
          content: `
            <h3>Dashboard Navigation</h3>
            
            <h4>Main Sections:</h4>
            <ul>
              <li><strong>KPI Overview</strong> - Top-level metrics and trends</li>
              <li><strong>Store Map</strong> - Geographic visualization of store network</li>
              <li><strong>Transaction Analytics</strong> - Customer behavior analysis</li>
              <li><strong>Brand Performance</strong> - Competitive analysis and brand health</li>
              <li><strong>AI Insights</strong> - Intelligent recommendations</li>
            </ul>
            
            <h4>Control Elements:</h4>
            <ul>
              <li><strong>Global Filters</strong> - Apply filters across all components</li>
              <li><strong>Data Source Toggle</strong> - Switch between simulated and live data</li>
              <li><strong>Export Controls</strong> - Download data in various formats</li>
              <li><strong>User Preferences</strong> - Customize dashboard layout and settings</li>
            </ul>
            
            <h4>Keyboard Shortcuts:</h4>
            <ul>
              <li><strong>Alt + Shift + D</strong> - Toggle QA overlay for debugging</li>
              <li><strong>Ctrl/Cmd + F</strong> - Open search functionality</li>
              <li><strong>Escape</strong> - Close modals and overlays</li>
            </ul>
          `
        },
        'data-interpretation': {
          title: 'Data Interpretation',
          content: `
            <h3>Understanding Your Data</h3>
            
            <h4>Key Metrics Explained:</h4>
            <ul>
              <li><strong>Total Sales</strong> - Revenue across all stores and time periods</li>
              <li><strong>Conversion Rate</strong> - Percentage of store visits resulting in purchases</li>
              <li><strong>Marketing ROI</strong> - Return on marketing investment</li>
              <li><strong>Brand Sentiment</strong> - Aggregated customer sentiment score</li>
            </ul>
            
            <h4>Data Freshness:</h4>
            <p>Data freshness is indicated by:</p>
            <ul>
              <li><strong>Green indicator</strong> - Data updated within last hour</li>
              <li><strong>Yellow indicator</strong> - Data updated within last 24 hours</li>
              <li><strong>Red indicator</strong> - Data older than 24 hours</li>
            </ul>
            
            <h4>Data Sources:</h4>
            <p>The dashboard integrates data from:</p>
            <ul>
              <li>Transaction systems</li>
              <li>Visual detection devices</li>
              <li>Customer interaction logs</li>
              <li>Device telemetry</li>
              <li>Market research data</li>
            </ul>
          `
        },
        'troubleshooting': {
          title: 'Troubleshooting',
          content: `
            <h3>Common Issues & Solutions</h3>
            
            <h4>Dashboard Not Loading:</h4>
            <ul>
              <li>Check your internet connection</li>
              <li>Refresh the page (Ctrl/Cmd + R)</li>
              <li>Clear browser cache and cookies</li>
              <li>Try a different browser</li>
            </ul>
            
            <h4>Data Not Updating:</h4>
            <ul>
              <li>Check the data freshness indicator</li>
              <li>Verify your filter settings</li>
              <li>Try switching data sources (simulated vs. live)</li>
              <li>Contact support if issue persists</li>
            </ul>
            
            <h4>Charts Not Displaying:</h4>
            <ul>
              <li>Ensure JavaScript is enabled</li>
              <li>Check for browser extensions blocking content</li>
              <li>Try disabling ad blockers temporarily</li>
              <li>Update your browser to the latest version</li>
            </ul>
            
            <h4>Performance Issues:</h4>
            <ul>
              <li>Close unnecessary browser tabs</li>
              <li>Adjust date ranges to smaller periods</li>
              <li>Use fewer filters simultaneously</li>
              <li>Contact support for optimization recommendations</li>
            </ul>
          `
        },
        'advanced-features': {
          title: 'Advanced Features',
          content: `
            <h3>Power User Features</h3>
            
            <h4>AI Insights Panel:</h4>
            <p>Ask natural language questions like:</p>
            <ul>
              <li>"Which stores performed best this month?"</li>
              <li>"Show me brands with declining sentiment"</li>
              <li>"What are the top substitution opportunities?"</li>
            </ul>
            
            <h4>Custom Export Templates:</h4>
            <p>Create reusable export templates for:</p>
            <ul>
              <li>Executive summary reports</li>
              <li>Store performance snapshots</li>
              <li>Brand analysis presentations</li>
              <li>Regional comparison charts</li>
            </ul>
            
            <h4>Advanced Filtering:</h4>
            <p>Combine multiple filters for precise analysis:</p>
            <ul>
              <li>Date ranges with regional focus</li>
              <li>Category-specific brand comparisons</li>
              <li>Channel performance by time period</li>
            </ul>
            
            <h4>Developer Tools:</h4>
            <p>Access debugging tools with Alt+Shift+D:</p>
            <ul>
              <li>Element inspection</li>
              <li>Performance monitoring</li>
              <li>Data validation checks</li>
              <li>Accessibility audit</li>
            </ul>
          `
        }
      }
    };
    this.init();
  }

  init() {
    this.createOnboardingUI();
    this.createHelpSystem();
    this.attachEventListeners();
    this.checkFirstTimeUser();
  }

  createOnboardingUI() {
    const onboardingContainer = document.createElement('div');
    onboardingContainer.id = 'onboarding-system';
    onboardingContainer.innerHTML = `
      <!-- Tour Overlay -->
      <div id="tour-overlay" class="tour-overlay hidden">
        <div class="tour-backdrop"></div>
        <div class="tour-tooltip" id="tour-tooltip">
          <div class="tour-tooltip-arrow"></div>
          <div class="tour-tooltip-content">
            <div class="tour-tooltip-header">
              <h3 class="tour-tooltip-title" id="tour-title"></h3>
              <div class="tour-progress">
                <span id="tour-step-indicator">1 of 10</span>
              </div>
            </div>
            <div class="tour-tooltip-body">
              <p id="tour-content"></p>
            </div>
            <div class="tour-tooltip-footer">
              <div class="tour-buttons" id="tour-buttons">
                <!-- Dynamic buttons -->
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Help Panel -->
      <div id="help-panel" class="help-panel hidden">
        <div class="help-panel-overlay"></div>
        <div class="help-panel-content">
          <div class="help-panel-header">
            <h2 class="help-panel-title">
              <span class="help-icon">📚</span>
              Client360 Dashboard Help
            </h2>
            <button id="close-help" class="help-close-btn">&times;</button>
          </div>
          
          <div class="help-panel-body">
            <div class="help-sidebar">
              <div class="help-search">
                <input type="text" id="help-search" placeholder="Search help topics...">
              </div>
              
              <div class="help-navigation">
                <div class="help-nav-section">
                  <h4>Getting Started</h4>
                  <ul>
                    <li><a href="#getting-started" class="help-nav-link active">Introduction</a></li>
                    <li><a href="#navigation" class="help-nav-link">Navigation</a></li>
                    <li><a href="#" id="restart-tour" class="help-nav-link">Take Tour</a></li>
                  </ul>
                </div>
                
                <div class="help-nav-section">
                  <h4>Using the Dashboard</h4>
                  <ul>
                    <li><a href="#data-interpretation" class="help-nav-link">Data Interpretation</a></li>
                    <li><a href="#advanced-features" class="help-nav-link">Advanced Features</a></li>
                    <li><a href="#troubleshooting" class="help-nav-link">Troubleshooting</a></li>
                  </ul>
                </div>
                
                <div class="help-nav-section">
                  <h4>New in v2.4.0</h4>
                  <ul>
                    <li><a href="#ai-features" class="help-nav-link">AI Insights</a></li>
                    <li><a href="#personalization" class="help-nav-link">User Personalization</a></li>
                    <li><a href="#analytics" class="help-nav-link">Transaction Analytics</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="help-content">
              <div id="help-content-area">
                <!-- Dynamic content -->
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Floating Help Button -->
      <div id="help-button" class="help-floating-btn">
        <button class="help-btn" title="Help & Documentation">
          <span class="help-btn-icon">?</span>
        </button>
      </div>
      
      <!-- Welcome Message for First-Time Users -->
      <div id="welcome-message" class="welcome-message hidden">
        <div class="welcome-content">
          <div class="welcome-header">
            <h2>Welcome to Client360 Dashboard v2.4.0!</h2>
            <p>Your comprehensive analytics platform for Sari-Sari store insights</p>
          </div>
          
          <div class="welcome-features">
            <div class="feature-highlight">
              <div class="feature-icon">🤖</div>
              <div class="feature-text">
                <h4>AI-Powered Insights</h4>
                <p>Get intelligent recommendations with our new multi-model AI engine</p>
              </div>
            </div>
            
            <div class="feature-highlight">
              <div class="feature-icon">👤</div>
              <div class="feature-text">
                <h4>Personalized Experience</h4>
                <p>Customize your dashboard layout and save your preferences</p>
              </div>
            </div>
            
            <div class="feature-highlight">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <h4>Enhanced Analytics</h4>
                <p>Deeper transaction analysis and brand performance insights</p>
              </div>
            </div>
          </div>
          
          <div class="welcome-actions">
            <button id="start-tour" class="btn btn-primary">Take the Tour</button>
            <button id="explore-dashboard" class="btn btn-outline">Explore Dashboard</button>
            <button id="dismiss-welcome" class="btn btn-text">Maybe Later</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(onboardingContainer);
  }

  createHelpSystem() {
    // Create help trigger in header
    const header = document.querySelector('.dashboard-header, .header-controls');
    if (header) {
      const helpTrigger = document.createElement('button');
      helpTrigger.id = 'help-trigger';
      helpTrigger.className = 'btn btn-outline help-trigger';
      helpTrigger.innerHTML = `
        <span class="help-trigger-icon">?</span>
        <span class="help-trigger-text">Help</span>
      `;
      header.appendChild(helpTrigger);
    }
    
    // Load initial help content
    this.loadHelpContent('getting-started');
  }

  attachEventListeners() {
    // Help system triggers
    document.getElementById('help-button')?.addEventListener('click', () => {
      this.openHelpPanel();
    });
    
    document.getElementById('help-trigger')?.addEventListener('click', () => {
      this.openHelpPanel();
    });
    
    document.getElementById('close-help')?.addEventListener('click', () => {
      this.closeHelpPanel();
    });
    
    document.querySelector('.help-panel-overlay')?.addEventListener('click', () => {
      this.closeHelpPanel();
    });

    // Tour controls
    document.getElementById('start-tour')?.addEventListener('click', () => {
      this.startTour();
    });
    
    document.getElementById('restart-tour')?.addEventListener('click', () => {
      this.startTour();
    });
    
    document.getElementById('explore-dashboard')?.addEventListener('click', () => {
      this.dismissWelcome();
    });
    
    document.getElementById('dismiss-welcome')?.addEventListener('click', () => {
      this.dismissWelcome();
    });

    // Help navigation
    document.querySelectorAll('.help-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const topic = link.getAttribute('href').substring(1);
        if (topic) {
          this.loadHelpContent(topic);
          this.setActiveNavLink(link);
        }
      });
    });

    // Help search
    document.getElementById('help-search')?.addEventListener('input', (e) => {
      this.searchHelpContent(e.target.value);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1' || (e.key === '?' && e.shiftKey)) {
        e.preventDefault();
        this.openHelpPanel();
      }
      
      if (e.key === 'Escape') {
        if (this.isActive) {
          this.endTour();
        } else {
          this.closeHelpPanel();
        }
      }
    });
  }

  checkFirstTimeUser() {
    const hasVisited = localStorage.getItem('client360_visited');
    const tourCompleted = localStorage.getItem('client360_tour_completed');
    
    if (!hasVisited) {
      setTimeout(() => {
        this.showWelcomeMessage();
      }, 2000);
      localStorage.setItem('client360_visited', 'true');
    }
  }

  showWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    welcomeMessage.classList.remove('hidden');
    welcomeMessage.classList.add('active');
  }

  dismissWelcome() {
    const welcomeMessage = document.getElementById('welcome-message');
    welcomeMessage.classList.remove('active');
    setTimeout(() => {
      welcomeMessage.classList.add('hidden');
    }, 300);
  }

  startTour() {
    this.dismissWelcome();
    this.currentStep = 0;
    this.isActive = true;
    this.showTourStep();
  }

  showTourStep() {
    const step = this.config.steps[this.currentStep];
    if (!step) {
      this.endTour();
      return;
    }

    const overlay = document.getElementById('tour-overlay');
    const tooltip = document.getElementById('tour-tooltip');
    
    // Update content
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-content').textContent = step.content;
    document.getElementById('tour-step-indicator').textContent = `${this.currentStep + 1} of ${this.config.steps.length}`;
    
    // Update buttons
    this.updateTourButtons(step.buttons);
    
    // Position tooltip
    this.positionTooltip(step.target, step.position);
    
    // Show overlay
    overlay.classList.remove('hidden');
    
    // Highlight target element
    this.highlightElement(step.target);
    
    // Scroll to target if needed
    this.scrollToTarget(step.target);
  }

  updateTourButtons(buttons) {
    const container = document.getElementById('tour-buttons');
    container.innerHTML = buttons.map(button => {
      const action = button.toLowerCase().replace(/\s+/g, '-');
      return `<button class="tour-btn tour-btn-${action}" data-action="${action}">${button}</button>`;
    }).join('');
    
    // Attach button listeners
    container.querySelectorAll('.tour-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleTourAction(e.target.dataset.action);
      });
    });
  }

  handleTourAction(action) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'previous':
        this.previousStep();
        break;
      case 'skip-tour':
        this.endTour();
        break;
      case 'finish':
        this.completeTour();
        break;
      case 'restart-tour':
        this.startTour();
        break;
    }
  }

  nextStep() {
    if (this.currentStep < this.config.steps.length - 1) {
      this.currentStep++;
      this.showTourStep();
    } else {
      this.completeTour();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showTourStep();
    }
  }

  endTour() {
    this.isActive = false;
    document.getElementById('tour-overlay').classList.add('hidden');
    this.clearHighlights();
  }

  completeTour() {
    this.tourCompleted = true;
    localStorage.setItem('client360_tour_completed', 'true');
    this.endTour();
    
    // Show completion message
    this.showCompletionMessage();
  }

  showCompletionMessage() {
    // Simple completion notification
    const notification = document.createElement('div');
    notification.className = 'tour-completion-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h4>🎉 Tour Complete!</h4>
        <p>You're now ready to explore the Client360 Dashboard. Remember to use the help (?) button anytime you need assistance.</p>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  positionTooltip(targetSelector, position) {
    const target = document.querySelector(targetSelector);
    const tooltip = document.getElementById('tour-tooltip');
    
    if (!target) {
      // If target not found, center the tooltip
      tooltip.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
      `;
      return;
    }
    
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;
    
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 20;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 20;
        break;
      case 'center':
      default:
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
    }
    
    // Ensure tooltip stays within viewport
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));
    
    tooltip.style.cssText = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      z-index: 10001;
    `;
  }

  highlightElement(targetSelector) {
    this.clearHighlights();
    
    const target = document.querySelector(targetSelector);
    if (target) {
      const highlight = document.createElement('div');
      highlight.className = 'tour-highlight';
      highlight.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #ffc300;
        background: rgba(255, 195, 0, 0.1);
        z-index: 10000;
        border-radius: 4px;
        animation: tour-pulse 2s infinite;
      `;
      
      const rect = target.getBoundingClientRect();
      highlight.style.top = `${rect.top - 4}px`;
      highlight.style.left = `${rect.left - 4}px`;
      highlight.style.width = `${rect.width + 8}px`;
      highlight.style.height = `${rect.height + 8}px`;
      
      document.body.appendChild(highlight);
    }
  }

  clearHighlights() {
    document.querySelectorAll('.tour-highlight').forEach(highlight => {
      highlight.remove();
    });
  }

  scrollToTarget(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }

  openHelpPanel() {
    document.getElementById('help-panel').classList.remove('hidden');
    document.getElementById('help-panel').classList.add('active');
    
    // Focus search input
    setTimeout(() => {
      document.getElementById('help-search')?.focus();
    }, 100);
  }

  closeHelpPanel() {
    const panel = document.getElementById('help-panel');
    panel.classList.remove('active');
    setTimeout(() => {
      panel.classList.add('hidden');
    }, 300);
  }

  loadHelpContent(topic) {
    const contentArea = document.getElementById('help-content-area');
    const helpData = this.config.helpContent[topic];
    
    if (helpData) {
      contentArea.innerHTML = `
        <div class="help-topic">
          <h2>${helpData.title}</h2>
          <div class="help-topic-content">
            ${helpData.content}
          </div>
        </div>
      `;
    } else {
      contentArea.innerHTML = `
        <div class="help-topic">
          <h2>Topic Not Found</h2>
          <p>The requested help topic could not be found. Please try searching or select a topic from the navigation.</p>
        </div>
      `;
    }
  }

  setActiveNavLink(activeLink) {
    document.querySelectorAll('.help-nav-link').forEach(link => {
      link.classList.remove('active');
    });
    activeLink.classList.add('active');
  }

  searchHelpContent(query) {
    if (!query.trim()) {
      // Show default content
      this.loadHelpContent('getting-started');
      return;
    }
    
    // Simple search implementation
    const results = [];
    Object.keys(this.config.helpContent).forEach(topic => {
      const content = this.config.helpContent[topic];
      if (content.title.toLowerCase().includes(query.toLowerCase()) ||
          content.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          topic,
          title: content.title,
          excerpt: this.extractExcerpt(content.content, query)
        });
      }
    });
    
    this.displaySearchResults(results, query);
  }

  extractExcerpt(content, query) {
    // Remove HTML tags and extract relevant excerpt
    const text = content.replace(/<[^>]*>/g, '');
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    
    if (index === -1) return text.substring(0, 150) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  }

  displaySearchResults(results, query) {
    const contentArea = document.getElementById('help-content-area');
    
    if (results.length === 0) {
      contentArea.innerHTML = `
        <div class="help-search-results">
          <h2>No Results Found</h2>
          <p>No help topics found for "${query}". Try using different keywords or browse the navigation menu.</p>
        </div>
      `;
      return;
    }
    
    contentArea.innerHTML = `
      <div class="help-search-results">
        <h2>Search Results for "${query}"</h2>
        <div class="search-results-list">
          ${results.map(result => `
            <div class="search-result-item">
              <h3><a href="#${result.topic}" class="search-result-link" data-topic="${result.topic}">${result.title}</a></h3>
              <p>${result.excerpt}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Attach click handlers to search result links
    contentArea.querySelectorAll('.search-result-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadHelpContent(e.target.dataset.topic);
      });
    });
  }

  // Public API methods
  showHelp(topic = 'getting-started') {
    this.openHelpPanel();
    this.loadHelpContent(topic);
  }

  startGuidedTour() {
    this.startTour();
  }

  addCustomHelpContent(topic, content) {
    this.config.helpContent[topic] = content;
  }
}

// CSS Styles
const onboardingStyles = `
  @keyframes tour-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  .tour-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    pointer-events: none;
  }
  
  .tour-overlay.hidden { display: none; }
  
  .tour-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    pointer-events: auto;
  }
  
  .tour-tooltip {
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    pointer-events: auto;
    font-family: 'Inter', sans-serif;
  }
  
  .tour-tooltip-header {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .tour-tooltip-title {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
  
  .tour-progress {
    font-size: 12px;
    color: #6b7280;
  }
  
  .tour-tooltip-body {
    padding: 20px;
  }
  
  .tour-tooltip-footer {
    padding: 10px 20px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .tour-btn {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .tour-btn-next, .tour-btn-finish {
    background: #ffc300;
    border-color: #ffc300;
    color: #000;
  }
  
  .help-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .help-panel.hidden { display: none; }
  
  .help-panel-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
  }
  
  .help-panel-content {
    position: relative;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 1000px;
    height: 80%;
    max-height: 700px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .help-panel-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  }
  
  .help-panel-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .help-sidebar {
    width: 300px;
    border-right: 1px solid #e5e7eb;
    padding: 20px;
    overflow-y: auto;
  }
  
  .help-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .welcome-message {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
  }
  
  .welcome-message.hidden { display: none; }
  
  .welcome-content {
    background: white;
    border-radius: 12px;
    padding: 40px;
    max-width: 600px;
    text-align: center;
  }
`;

// Inject styles
if (!document.getElementById('onboarding-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'onboarding-styles';
  styleSheet.textContent = onboardingStyles;
  document.head.appendChild(styleSheet);
}

// Global export
if (typeof window !== 'undefined') {
  window.OnboardingSystem = OnboardingSystem;
}

export default OnboardingSystem;