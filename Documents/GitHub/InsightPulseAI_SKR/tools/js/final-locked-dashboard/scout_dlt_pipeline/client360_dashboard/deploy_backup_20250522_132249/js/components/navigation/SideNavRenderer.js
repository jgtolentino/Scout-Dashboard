/**
 * Side Navigation Renderer
 * Loads and renders navigation from simulation data
 */
class SideNavRenderer {
    constructor(options = {}) {
        this.options = {
            containerId: 'side-nav',
            navClass: 'nav-menu',
            activeClass: 'active',
            ...options
        };
        
        this.navigationData = null;
        this.currentSection = 'overview';
        this.init();
    }

    async init() {
        await this.loadNavigationData();
        this.render();
        this.bindEvents();
        this.updateBreadcrumbs();
    }

    async loadNavigationData() {
        try {
            // Use simulation API client if available
            if (window.simApiClient && window.simApiClient.isSimulationMode()) {
                const response = await window.simApiClient.loadSimulationData('navigation.json');
                this.navigationData = await response.json();
            } else {
                const response = await fetch('/api/navigation');
                this.navigationData = await response.json();
            }
        } catch (error) {
            console.error('Failed to load navigation data:', error);
            // Fallback navigation
            this.navigationData = {
                navigation: [
                    { id: 'overview', label: 'Dashboard Overview', icon: 'fas fa-tachometer-alt', active: true },
                    { id: 'sales-analytics', label: 'Sales Analytics', icon: 'fas fa-chart-line', active: false }
                ],
                quick_actions: [],
                breadcrumbs: []
            };
        }
    }

    render() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error(`SideNavRenderer: Container with id '${this.options.containerId}' not found`);
            return;
        }

        const navHtml = `
            <div class="${this.options.navClass}">
                <div class="nav-header">
                    <div class="nav-logo">
                        <i class="fas fa-chart-pie"></i>
                        <span class="nav-title">Client360</span>
                    </div>
                    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                
                <div class="nav-body">
                    <ul class="nav-list" role="menu">
                        ${this.renderNavItems()}
                    </ul>
                    
                    ${this.renderQuickActions()}
                </div>
                
                <div class="nav-footer">
                    <div class="nav-version">v2.4.0</div>
                    ${window.simApiClient?.isSimulationMode() ? '<div class="nav-demo-badge">DEMO</div>' : ''}
                </div>
            </div>
        `;

        container.innerHTML = navHtml;
        this.addStyles();
    }

    renderNavItems() {
        return this.navigationData.navigation.map(item => `
            <li class="nav-item ${item.active ? this.options.activeClass : ''}" 
                data-target="${item.id}" 
                role="menuitem"
                tabindex="0"
                title="${item.description || item.label}">
                <i class="${item.icon}"></i>
                <span class="nav-label">${item.label}</span>
                <div class="nav-indicator"></div>
            </li>
        `).join('');
    }

    renderQuickActions() {
        if (!this.navigationData.quick_actions?.length) return '';

        return `
            <div class="quick-actions">
                <div class="quick-actions-title">Quick Actions</div>
                <div class="quick-actions-grid">
                    ${this.navigationData.quick_actions.map(action => `
                        <button class="quick-action-btn ${action.disabled ? 'disabled' : ''}" 
                                data-action="${action.action}"
                                title="${action.tooltip || action.label}"
                                ${action.disabled ? 'disabled' : ''}>
                            <i class="${action.icon}"></i>
                            <span>${action.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    addStyles() {
        const styleId = 'side-nav-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .nav-menu {
                width: 250px;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                flex-direction: column;
                position: fixed;
                left: 0;
                top: 0;
                z-index: 1000;
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }

            .nav-header {
                padding: 1.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .nav-logo {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: bold;
                font-size: 1.125rem;
            }

            .nav-logo i {
                font-size: 1.5rem;
                color: #ffd700;
            }

            .nav-toggle {
                background: none;
                border: none;
                color: white;
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
                transition: background-color 0.2s;
                display: none;
            }

            .nav-toggle:hover {
                background-color: rgba(255,255,255,0.1);
            }

            .nav-body {
                flex: 1;
                padding: 1rem 0;
                overflow-y: auto;
            }

            .nav-list {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .nav-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                border-left: 3px solid transparent;
            }

            .nav-item:hover {
                background-color: rgba(255,255,255,0.1);
                transform: translateX(2px);
            }

            .nav-item.active {
                background-color: rgba(255,255,255,0.15);
                border-left-color: #ffd700;
            }

            .nav-item.active .nav-indicator {
                opacity: 1;
            }

            .nav-item i {
                font-size: 1.125rem;
                width: 20px;
                text-align: center;
                opacity: 0.9;
            }

            .nav-label {
                font-weight: 500;
                font-size: 0.875rem;
            }

            .nav-indicator {
                position: absolute;
                right: 1rem;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: #ffd700;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .quick-actions {
                margin-top: 1rem;
                padding: 0 1rem;
            }

            .quick-actions-title {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                opacity: 0.7;
                margin-bottom: 0.75rem;
                padding: 0 0.5rem;
            }

            .quick-actions-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
            }

            .quick-action-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                padding: 0.5rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.75rem;
                text-align: center;
            }

            .quick-action-btn:hover:not(.disabled) {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }

            .quick-action-btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .nav-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.75rem;
                opacity: 0.8;
            }

            .nav-demo-badge {
                background: #ff6b6b;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-weight: bold;
                font-size: 0.6rem;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .nav-menu {
                    transform: translateX(-100%);
                }

                .nav-menu.open {
                    transform: translateX(0);
                }

                .nav-toggle {
                    display: block;
                }
            }

            /* Focus styles */
            .nav-item:focus,
            .quick-action-btn:focus {
                outline: 2px solid #ffd700;
                outline-offset: 2px;
            }
        `;

        document.head.appendChild(styles);
    }

    bindEvents() {
        const navList = document.querySelector(`#${this.options.containerId} .nav-list`);
        const quickActions = document.querySelector(`#${this.options.containerId} .quick-actions-grid`);
        const navToggle = document.getElementById('nav-toggle');

        // Navigation item clicks
        if (navList) {
            navList.addEventListener('click', (e) => {
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    const target = navItem.dataset.target;
                    this.navigateToSection(target);
                }
            });

            // Keyboard navigation
            navList.addEventListener('keydown', (e) => {
                const navItem = e.target.closest('.nav-item');
                if (navItem && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    const target = navItem.dataset.target;
                    this.navigateToSection(target);
                }
            });
        }

        // Quick action clicks
        if (quickActions) {
            quickActions.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.quick-action-btn');
                if (actionBtn && !actionBtn.disabled) {
                    const action = actionBtn.dataset.action;
                    this.handleQuickAction(action);
                }
            });
        }

        // Mobile nav toggle
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.querySelector('.nav-menu');
                navMenu.classList.toggle('open');
            });
        }

        // Close mobile nav on outside click
        document.addEventListener('click', (e) => {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.getElementById('nav-toggle');
            
            if (navMenu && navMenu.classList.contains('open') && 
                !navMenu.contains(e.target) && e.target !== navToggle) {
                navMenu.classList.remove('open');
            }
        });
    }

    navigateToSection(sectionId) {
        console.log(`Navigating to section: ${sectionId}`);
        
        // Update active state
        this.setActiveSection(sectionId);
        
        // Scroll to section or handle routing
        const targetElement = document.getElementById(sectionId) || 
                            document.querySelector(`[data-section="${sectionId}"]`);
        
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            // If no direct element, try to find by class or data attribute
            const alternateTarget = document.querySelector(`.${sectionId}-section`) ||
                                  document.querySelector(`[data-nav-target="${sectionId}"]`);
            
            if (alternateTarget) {
                alternateTarget.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                console.warn(`Navigation target not found: ${sectionId}`);
                // Show notification
                this.showNotification(`Section "${sectionId}" not yet implemented`, 'info');
            }
        }

        // Update URL hash
        if (history.pushState) {
            history.pushState(null, null, `#${sectionId}`);
        } else {
            window.location.hash = sectionId;
        }

        // Update breadcrumbs
        this.updateBreadcrumbs(sectionId);

        // Close mobile nav if open
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
        }
    }

    setActiveSection(sectionId) {
        this.currentSection = sectionId;
        
        // Update nav items
        const navItems = document.querySelectorAll(`#${this.options.containerId} .nav-item`);
        navItems.forEach(item => {
            if (item.dataset.target === sectionId) {
                item.classList.add(this.options.activeClass);
            } else {
                item.classList.remove(this.options.activeClass);
            }
        });
    }

    handleQuickAction(action) {
        console.log(`Quick action triggered: ${action}`);
        
        switch (action) {
            case 'refresh':
                this.showNotification('Data refresh disabled in demo mode', 'warning');
                break;
                
            case 'export':
                this.handleExport();
                break;
                
            case 'toggle-filters':
                this.toggleFilters();
                break;
                
            case 'fullscreen':
                this.toggleFullscreen();
                break;
                
            default:
                this.showNotification(`Action "${action}" not implemented`, 'info');
        }
    }

    handleExport() {
        // Trigger export preview
        if (window.simApiClient && window.simApiClient.isSimulationMode()) {
            this.showNotification('Opening export preview...', 'success');
            // Could open export modal here
        } else {
            this.showNotification('Export functionality coming soon', 'info');
        }
    }

    toggleFilters() {
        const filterPanel = document.querySelector('.filters-panel') || 
                          document.querySelector('[data-component="filters"]');
        
        if (filterPanel) {
            filterPanel.classList.toggle('hidden');
            const isVisible = !filterPanel.classList.contains('hidden');
            this.showNotification(`Filters ${isVisible ? 'shown' : 'hidden'}`, 'info');
        } else {
            this.showNotification('Filter panel not found', 'warning');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.() || 
            document.documentElement.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        }
    }

    updateBreadcrumbs(sectionId = null) {
        const breadcrumbContainer = document.querySelector('.breadcrumbs') ||
                                  document.querySelector('[data-component="breadcrumbs"]');
        
        if (!breadcrumbContainer) return;

        const currentSection = sectionId || this.currentSection;
        const navItem = this.navigationData.navigation.find(item => item.id === currentSection);
        
        if (navItem) {
            const breadcrumbs = [
                { label: 'Client360', url: '/' },
                { label: 'Analytics Dashboard', url: '/dashboard' },
                { label: navItem.label, url: `/dashboard/${currentSection}`, active: true }
            ];

            breadcrumbContainer.innerHTML = breadcrumbs.map((crumb, index) => `
                <span class="breadcrumb-item ${crumb.active ? 'active' : ''}">
                    ${index > 0 ? '<i class="fas fa-chevron-right breadcrumb-sep"></i>' : ''}
                    ${crumb.active ? crumb.label : `<a href="${crumb.url}">${crumb.label}</a>`}
                </span>
            `).join('');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `nav-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : 
                        type === 'warning' ? '#ffc107' : 
                        type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            font-size: 0.875rem;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Public API
    getCurrentSection() {
        return this.currentSection;
    }

    navigateTo(sectionId) {
        this.navigateToSection(sectionId);
    }

    refresh() {
        this.loadNavigationData().then(() => {
            this.render();
            this.bindEvents();
        });
    }
}

// Initialize side navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sideNavRenderer = new SideNavRenderer();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SideNavRenderer;
}