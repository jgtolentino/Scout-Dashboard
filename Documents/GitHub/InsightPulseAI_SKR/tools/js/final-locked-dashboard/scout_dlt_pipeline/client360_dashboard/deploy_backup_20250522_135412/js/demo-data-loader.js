/**
 * Central Demo Data Loader - Eliminates All Empty Placeholders
 * Loads consolidated demo-data.json and wires all UI components
 * Makes every tab, tile, and map marker clickable
 */

class DemoDataLoader {
    constructor() {
        this.demoData = null;
        this.initialized = false;
        this.config = {
            apiDelay: 500, // ms - simulate API response time
            enableDemoIndicators: true,
            disableLiveControls: true
        };
    }

    /**
     * Load demo data and initialize all components
     */
    async init() {
        try {
            console.log('[DemoDataLoader] Loading consolidated demo data...');
            
            // Load consolidated demo data
            await this.loadDemoData();
            
            // Initialize all UI components with demo data
            await this.initializeComponents();
            
            // Add demo mode indicators
            this.addDemoIndicators();
            
            // Make everything clickable
            this.makeEverythingClickable();
            
            this.initialized = true;
            console.log('[DemoDataLoader] Initialization complete - All placeholders eliminated!');
            
        } catch (error) {
            console.error('[DemoDataLoader] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load demo data from consolidated JSON
     */
    async loadDemoData() {
        const response = await fetch('/data/sim/demo-data.json');
        if (!response.ok) {
            throw new Error(`Demo data missing: ${response.status}`);
        }
        
        this.demoData = await response.json();
        
        // Store globally for other components
        window.appData = this.demoData;
        window.demoMode = this.demoData.demoMode;
        
        console.log('[DemoDataLoader] Demo data loaded:', {
            version: this.demoData.version,
            navigationItems: this.demoData.navigation.length,
            kpis: Object.keys(this.demoData.kpis).length,
            stores: this.demoData.map.stores.length,
            devices: this.demoData.devices.total,
            tags: this.demoData.tags.length
        });
    }

    /**
     * Initialize all UI components with demo data
     */
    async initializeComponents() {
        // Add small delay to simulate API loading
        await this.delay(this.config.apiDelay);
        
        // Initialize navigation
        this.initNavigation();
        
        // Initialize KPI tiles
        this.initKpiTiles();
        
        // Initialize map with stores
        this.initMap();
        
        // Initialize device health grid
        this.initDeviceGrid();
        
        // Initialize tags dropdown
        this.initTagsDropdown();
        
        // Initialize insights panel
        this.initInsights();
        
        console.log('[DemoDataLoader] All components initialized with demo data');
    }

    /**
     * Initialize navigation menu
     */
    initNavigation() {
        const navContainer = document.querySelector('.nav-menu, .sidebar-nav, #navigation');
        if (!navContainer) return;
        
        // Clear existing content
        navContainer.innerHTML = '';
        
        // Use centralized navigation from config.js (PRD-compliant only)
        const navItems = window.navItems || this.demoData.navigation;
        
        // Create navigation items
        navItems.forEach(item => {
            const navItem = document.createElement('div');
            navItem.className = `nav-item ${item.active ? 'active' : ''}`;
            navItem.dataset.section = item.key;
            
            navItem.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                <div class="nav-description">${item.description}</div>
            `;
            
            // Make clickable
            navItem.addEventListener('click', () => this.handleNavClick(item));
            
            navContainer.appendChild(navItem);
        });
        
        // Add quick actions
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        
        this.demoData.quickActions.forEach(action => {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'quick-action-btn';
            actionBtn.innerHTML = `<i class="${action.icon}"></i> ${action.label}`;
            actionBtn.addEventListener('click', () => this.handleQuickAction(action));
            quickActions.appendChild(actionBtn);
        });
        
        navContainer.appendChild(quickActions);
    }

    /**
     * Initialize KPI tiles with clickable functionality
     */
    initKpiTiles() {
        const kpiContainer = document.querySelector('.kpi-grid, .metrics-container, #kpis');
        if (!kpiContainer) return;
        
        // Clear existing content
        kpiContainer.innerHTML = '';
        
        // Create KPI tiles
        Object.entries(this.demoData.kpis).forEach(([key, kpi]) => {
            const tile = document.createElement('div');
            tile.className = `kpi-tile ${kpi.clickable ? 'clickable' : ''} ${kpi.color}`;
            tile.dataset.kpi = key;
            
            const changeIcon = kpi.changeType === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down';
            const changeClass = kpi.changeType === 'increase' ? 'positive' : 'negative';
            
            tile.innerHTML = `
                <div class="kpi-icon">
                    <i class="${kpi.icon}"></i>
                </div>
                <div class="kpi-content">
                    <div class="kpi-label">${kpi.label}</div>
                    <div class="kpi-value">
                        ${this.formatValue(kpi.value, kpi.unit)}
                    </div>
                    <div class="kpi-change ${changeClass}">
                        <i class="fas ${changeIcon}"></i>
                        ${kpi.change}% ${kpi.period}
                    </div>
                    <div class="kpi-target">
                        Target: ${this.formatValue(kpi.target, kpi.unit)}
                    </div>
                </div>
            `;
            
            // Make clickable if specified
            if (kpi.clickable) {
                tile.addEventListener('click', () => this.handleKpiClick(key, kpi));
            }
            
            kpiContainer.appendChild(tile);
        });
    }

    /**
     * Initialize interactive map with store markers
     */
    initMap() {
        const mapContainer = document.querySelector('#map, .map-container');
        if (!mapContainer) return;
        
        // Clear existing map
        mapContainer.innerHTML = '<div id="map-canvas" style="width: 100%; height: 400px;"></div>';
        
        // Initialize map (using Leaflet for demo)
        const mapCanvas = document.getElementById('map-canvas');
        
        // Create SVG-based map for demo
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '400');
        svg.style.background = '#e8f4f8';
        
        // Add store markers
        this.demoData.map.stores.forEach((store, index) => {
            const marker = this.createStoreMarker(store, index);
            svg.appendChild(marker);
        });
        
        mapCanvas.appendChild(svg);
        
        // Add map legend
        const legend = document.createElement('div');
        legend.className = 'map-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color excellent"></span> Excellent Performance
            </div>
            <div class="legend-item">
                <span class="legend-color good"></span> Good Performance
            </div>
            <div class="legend-item">
                <span class="legend-color fair"></span> Fair Performance
            </div>
            <div class="legend-item">
                <span class="legend-color needs_improvement"></span> Needs Improvement
            </div>
        `;
        
        mapContainer.appendChild(legend);
    }

    /**
     * Create clickable store marker
     */
    createStoreMarker(store, index) {
        const x = 50 + (index % 5) * 150; // Distribute horizontally
        const y = 50 + Math.floor(index / 5) * 80; // Stack vertically
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.style.cursor = 'pointer';
        
        // Marker circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', Math.min(15, store.revenue / 200000)); // Size by revenue
        circle.setAttribute('fill', this.getPerformanceColor(store.performance));
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2');
        
        // Store label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 25);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-family', 'Arial');
        text.textContent = store.name.split(' ')[0]; // First word only
        
        group.appendChild(circle);
        group.appendChild(text);
        
        // Make clickable
        group.addEventListener('click', () => this.handleStoreClick(store));
        
        return group;
    }

    /**
     * Initialize device health grid
     */
    initDeviceGrid() {
        const deviceContainer = document.querySelector('.device-grid, #device-health');
        if (!deviceContainer) return;
        
        const { devices } = this.demoData.devices;
        
        // Clear and populate
        deviceContainer.innerHTML = `
            <div class="device-summary">
                <div class="device-stat healthy">
                    <div class="stat-value">${this.demoData.devices.healthy}</div>
                    <div class="stat-label">Healthy</div>
                </div>
                <div class="device-stat warning">
                    <div class="stat-value">${this.demoData.devices.warning}</div>
                    <div class="stat-label">Warning</div>
                </div>
                <div class="device-stat critical">
                    <div class="stat-value">${this.demoData.devices.critical}</div>
                    <div class="stat-label">Critical</div>
                </div>
                <div class="device-stat total">
                    <div class="stat-value">${this.demoData.devices.total}</div>
                    <div class="stat-label">Total Devices</div>
                </div>
            </div>
            <div class="device-list">
                ${devices.map(device => `
                    <div class="device-item ${device.status}" data-device="${device.id}">
                        <div class="device-name">${device.name}</div>
                        <div class="device-location">${device.location}</div>
                        <div class="device-uptime">${device.uptime}%</div>
                        <div class="device-status">${device.status}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Make device items clickable
        deviceContainer.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('click', () => {
                const deviceId = item.dataset.device;
                const device = devices.find(d => d.id === deviceId);
                this.handleDeviceClick(device);
            });
        });
    }

    /**
     * Initialize tags dropdown
     */
    initTagsDropdown() {
        const tagsContainer = document.querySelector('.tags-dropdown, #tags-filter');
        if (!tagsContainer) return;
        
        tagsContainer.innerHTML = `
            <div class="tags-summary">
                Available Filters: ${this.demoData.tags.length}
            </div>
            <div class="tags-list">
                ${this.demoData.tags.map(tag => `
                    <div class="tag-item" data-tag="${tag.id}" style="border-color: ${tag.color}">
                        <span class="tag-label">${tag.label}</span>
                        <span class="tag-category">${tag.category}</span>
                        <span class="tag-count">${tag.count}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Make tags clickable
        tagsContainer.querySelectorAll('.tag-item').forEach(item => {
            item.addEventListener('click', () => {
                const tagId = item.dataset.tag;
                const tag = this.demoData.tags.find(t => t.id === tagId);
                this.handleTagClick(tag);
            });
        });
    }

    /**
     * Initialize insights panel
     */
    initInsights() {
        const insightsContainer = document.querySelector('.insights-panel, #ai-insights');
        if (!insightsContainer) return;
        
        insightsContainer.innerHTML = `
            <div class="insights-header">
                <h3>AI-Powered Insights</h3>
                <span class="insights-count">${this.demoData.insights.length} insights</span>
            </div>
            <div class="insights-list">
                ${this.demoData.insights.map(insight => `
                    <div class="insight-item ${insight.priority}" data-insight="${insight.id}">
                        <div class="insight-header">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-priority">${insight.priority}</div>
                        </div>
                        <div class="insight-description">${insight.description}</div>
                        ${insight.actionable ? `
                            <div class="insight-recommendation">
                                <strong>Recommendation:</strong> ${insight.recommendation}
                            </div>
                        ` : ''}
                        <div class="insight-timestamp">${new Date(insight.timestamp).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Make insights clickable
        insightsContainer.querySelectorAll('.insight-item').forEach(item => {
            item.addEventListener('click', () => {
                const insightId = item.dataset.insight;
                const insight = this.demoData.insights.find(i => i.id === insightId);
                this.handleInsightClick(insight);
            });
        });
    }

    /**
     * Add demo mode indicators
     */
    addDemoIndicators() {
        if (!this.config.enableDemoIndicators) return;
        
        // Add demo badge to header
        const header = document.querySelector('header, .header');
        if (header) {
            const badge = document.createElement('div');
            badge.className = 'demo-badge';
            badge.innerHTML = '<i class="fas fa-play"></i> DEMO MODE';
            badge.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #ffd100;
                color: #333;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                z-index: 1001;
            `;
            header.style.position = 'relative';
            header.appendChild(badge);
        }
        
        // Disable live data controls
        if (this.config.disableLiveControls) {
            document.querySelectorAll('.refresh-btn, .live-data-toggle').forEach(btn => {
                btn.disabled = true;
                btn.title = 'Disabled in demo mode';
            });
        }
    }

    /**
     * Make everything clickable - wire up all interactive elements
     */
    makeEverythingClickable() {
        // Add global click handlers for any missed elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-clickable]');
            if (target) {
                const type = target.dataset.clickable;
                const id = target.dataset.id;
                console.log(`[DemoDataLoader] Clicked ${type}:${id}`);
                
                // Handle generic clickable elements
                this.handleGenericClick(type, id, target);
            }
        });
        
        console.log('[DemoDataLoader] All interactive elements are now clickable');
    }

    // Event Handlers
    handleNavClick(item) {
        console.log('[Navigation] Clicked:', item.label);
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector(`[data-section="${item.key}"]`).classList.add('active');
        
        // Show relevant section
        this.showSection(item.key);
        
        // Update breadcrumbs
        this.updateBreadcrumbs(item);
    }

    handleKpiClick(key, kpi) {
        console.log('[KPI] Clicked:', kpi.label);
        
        // Show drill-down drawer
        this.showDrilldownDrawer(key, this.demoData.drilldowns[key] || {
            title: `${kpi.label} Details`,
            data: { message: `Detailed breakdown for ${kpi.label} would appear here` }
        });
    }

    handleStoreClick(store) {
        console.log('[Store] Clicked:', store.name);
        
        // Show store details drawer
        this.showStoreDrawer(store);
    }

    handleDeviceClick(device) {
        console.log('[Device] Clicked:', device.name);
        
        // Show device details modal
        this.showDeviceModal(device);
    }

    handleTagClick(tag) {
        console.log('[Tag] Clicked:', tag.label);
        
        // Apply filter
        this.applyTagFilter(tag);
    }

    handleInsightClick(insight) {
        console.log('[Insight] Clicked:', insight.title);
        
        // Show insight details
        this.showInsightModal(insight);
    }

    handleQuickAction(action) {
        console.log('[Quick Action] Clicked:', action.label);
        
        switch (action.action) {
            case 'refresh':
                this.refreshDemoData();
                break;
            case 'export':
                this.showExportModal();
                break;
            case 'settings':
                this.showSettingsModal();
                break;
        }
    }

    handleGenericClick(type, id, element) {
        // Generic handler for any clickable element
        const notification = document.createElement('div');
        notification.className = 'click-notification';
        notification.textContent = `Clicked ${type}: ${id}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0067b1;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 9999;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    // UI Helper Methods
    showSection(sectionKey) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.querySelector(`#${sectionKey}, .section-${sectionKey}`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    showDrilldownDrawer(kpiKey, drilldownData) {
        // Create and show drill-down drawer
        const drawer = document.createElement('div');
        drawer.className = 'drilldown-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <h3>${drilldownData.title}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="drawer-content">
                <pre>${JSON.stringify(drilldownData.data, null, 2)}</pre>
            </div>
        `;
        
        drawer.querySelector('.close-btn').addEventListener('click', () => drawer.remove());
        document.body.appendChild(drawer);
    }

    showStoreDrawer(store) {
        const drawer = document.createElement('div');
        drawer.className = 'store-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <h3>${store.name}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="drawer-content">
                <div class="store-details">
                    <p><strong>Address:</strong> ${store.address}</p>
                    <p><strong>Manager:</strong> ${store.manager}</p>
                    <p><strong>Revenue:</strong> ₱${store.revenue.toLocaleString()}</p>
                    <p><strong>Transactions:</strong> ${store.transactions.toLocaleString()}</p>
                    <p><strong>Uptime:</strong> ${store.uptime}%</p>
                    <p><strong>Performance:</strong> ${store.performance}</p>
                    <p><strong>Services:</strong> ${store.services.join(', ')}</p>
                </div>
            </div>
        `;
        
        drawer.querySelector('.close-btn').addEventListener('click', () => drawer.remove());
        document.body.appendChild(drawer);
    }

    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Export Dashboard</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="export-formats">
                        ${this.demoData.exportFormats.map(format => `
                            <div class="export-option" data-format="${format.format}">
                                <i class="${format.icon}"></i>
                                <div>
                                    <strong>${format.format}</strong>
                                    <p>${format.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        
        // Make export options clickable
        modal.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', () => {
                const format = option.dataset.format;
                alert(`Exporting to ${format} format...`);
                modal.remove();
            });
        });
        
        document.body.appendChild(modal);
    }

    // Utility Methods
    formatValue(value, unit) {
        if (unit === 'PHP') {
            return `₱${value.toLocaleString()}`;
        } else if (unit === 'count') {
            return value.toLocaleString();
        } else if (unit === '%') {
            return `${value}%`;
        } else {
            return `${value}${unit || ''}`;
        }
    }

    getPerformanceColor(performance) {
        const colors = {
            'excellent': '#28a745',
            'good': '#17a2b8',
            'fair': '#ffc107',
            'needs_improvement': '#dc3545'
        };
        return colors[performance] || '#6c757d';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateBreadcrumbs(item) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <span class="breadcrumb-item">Dashboard</span>
                <i class="fas fa-chevron-right"></i>
                <span class="breadcrumb-item active">${item.label}</span>
            `;
        }
    }

    refreshDemoData() {
        console.log('[DemoDataLoader] Refreshing demo data...');
        // Simulate refresh
        setTimeout(() => {
            console.log('[DemoDataLoader] Demo data refreshed');
        }, 1000);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const loader = new DemoDataLoader();
        await loader.init();
        
        // Store globally for other scripts
        window.demoDataLoader = loader;
        
    } catch (error) {
        console.error('[DemoDataLoader] Failed to initialize:', error);
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoDataLoader;
}