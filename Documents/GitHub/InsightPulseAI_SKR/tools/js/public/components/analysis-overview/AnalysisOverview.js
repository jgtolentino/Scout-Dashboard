/**
 * AnalysisOverview.js
 * 
 * A responsive, clickable overview component for the Project Scout dashboard.
 * Displays four analysis categories with icons and bulleted features.
 */
class AnalysisOverview {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error('AnalysisOverview: Container not found:', containerSelector);
      return;
    }

    this.options = Object.assign({
      title: 'Project Scout: Analysis Overview',
      baseUrl: '/dashboards',
      panels: [
        {
          title: 'Customer Profile',
          icon: 'users',
          bgClass: 'bg-blue-50',
          iconClass: 'text-blue-600',
          bullets: [
            'Purchase patterns by demographics',
            'Brand loyalty metrics',
            'Cultural influence analysis'
          ],
          href: '/customer-profile'
        },
        {
          title: 'Store Performance',
          icon: 'store',
          bgClass: 'bg-purple-50',
          iconClass: 'text-purple-600',
          bullets: [
            'Regional performance',
            'Store size impact',
            'Peak transaction analysis'
          ],
          href: '/store-performance'
        },
        {
          title: 'Product Intelligence',
          icon: 'shopping-cart',
          bgClass: 'bg-green-50',
          iconClass: 'text-green-600',
          bullets: [
            'Bundle effectiveness',
            'Category performance',
            'SKU-level patterns',
            'BUMO (Brand-Used-Most-Often)'
          ],
          href: '/product-intelligence'
        },
        {
          title: 'Advanced Analytics',
          icon: 'bar-chart-2',
          bgClass: 'bg-orange-50',
          iconClass: 'text-orange-600',
          bullets: [
            'Market basket analysis',
            'Demand forecasting',
            'Promotional impact'
          ],
          href: '/advanced-analytics'
        }
      ]
    }, options);

    this.renderStyles();
    this.render();
  }

  /**
   * Get SVG icon markup based on icon name
   */
  getIconSvg(iconName, className) {
    const icons = {
      'users': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      'store': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
      'shopping-cart': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
      'bar-chart-2': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
    };

    return icons[iconName] || '';
  }

  /**
   * Ensure styles are loaded
   */
  renderStyles() {
    const styleId = 'analysis-overview-styles';
    if (!document.getElementById(styleId)) {
      const link = document.createElement('link');
      link.id = styleId;
      link.rel = 'stylesheet';
      link.href = 'components/analysis-overview/analysis-overview.css';
      document.head.appendChild(link);
    }
  }

  /**
   * Render the component
   */
  render() {
    const { title, panels, baseUrl } = this.options;
    
    const html = `
      <section class="analysis-overview">
        <h2>${title}</h2>
        <div class="analysis-overview-grid">
          ${panels.map(panel => `
            <a 
              href="${baseUrl}${panel.href}" 
              class="analysis-panel ${panel.bgClass}"
              data-panel="${panel.title.toLowerCase().replace(/\s+/g, '-')}"
            >
              <div class="panel-header">
                <div class="panel-icon">${this.getIconSvg(panel.icon, panel.iconClass)}</div>
                <h3 class="panel-title">${panel.title}</h3>
              </div>
              <ul class="panel-list">
                ${panel.bullets.map(bullet => `
                  <li class="panel-list-item">${bullet}</li>
                `).join('')}
              </ul>
              <div class="panel-footer">
                Click to explore →
              </div>
            </a>
          `).join('')}
        </div>
      </section>
    `;

    this.container.innerHTML = html;
    this.addEventListeners();
  }

  /**
   * Add event listeners to the component
   */
  addEventListeners() {
    // Add click tracking or other interactive features here
    const panels = this.container.querySelectorAll('.analysis-panel');
    panels.forEach(panel => {
      panel.addEventListener('click', (e) => {
        const panelType = panel.getAttribute('data-panel');
        // Optional: Add analytics tracking here
        console.log(`Panel clicked: ${panelType}`);
      });
    });
  }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisOverview;
} else {
  window.AnalysisOverview = AnalysisOverview;
}