/**
 * Brand Performance Grid Component
 * Fetches and renders real brand data from configured endpoints
 * Supports both live API and simulated data modes
 */

class BrandPerformanceGrid {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.data = null;
        this.isLoading = false;
        
        if (!this.container) {
            console.error(`[BrandPerformanceGrid] Container not found: ${containerId}`);
            return;
        }
        
        this.init();
    }

    /**
     * Initialize the component
     */
    async init() {
        try {
            console.log('[BrandPerformanceGrid] Initializing...');
            
            // Show loading state
            this.showLoading();
            
            // Fetch brand data
            await this.fetchBrandData();
            
            // Render the grid
            this.render();
            
            console.log('[BrandPerformanceGrid] Initialized successfully');
        } catch (error) {
            console.error('[BrandPerformanceGrid] Initialization failed:', error);
            this.showError(error.message);
        }
    }

    /**
     * Fetch brand data from configured endpoint
     */
    async fetchBrandData() {
        this.isLoading = true;
        
        try {
            // Get URL based on data configuration
            const url = this.getBrandDataUrl();
            
            console.log(`[BrandPerformanceGrid] Fetching from: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Handle different response formats
            this.data = result.data || result;
            
            if (!Array.isArray(this.data)) {
                throw new Error('Invalid data format: expected array of brands');
            }
            
            console.log(`[BrandPerformanceGrid] Loaded ${this.data.length} brands`);
            
        } catch (error) {
            console.error('[BrandPerformanceGrid] Data fetch failed:', error);
            
            // Try fallback URL
            await this.tryFallback();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get brand data URL based on configuration
     */
    getBrandDataUrl() {
        const config = window.dataConfig;
        
        if (!config) {
            console.warn('[BrandPerformanceGrid] dataConfig not found, using fallback');
            return '/data/sim/brands.json';
        }
        
        if (config.isSimulatedData) {
            return config.brands.simulatedUrl;
        } else {
            return config.brands.liveUrl;
        }
    }

    /**
     * Try fallback URL if primary fetch fails
     */
    async tryFallback() {
        try {
            const fallbackUrl = window.dataConfig?.brands?.fallbackUrl || '/data/sim/brands.json';
            
            console.log(`[BrandPerformanceGrid] Trying fallback: ${fallbackUrl}`);
            
            const response = await fetch(fallbackUrl);
            
            if (!response.ok) {
                throw new Error(`Fallback failed: HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.data = result.data || result;
            
            console.log('[BrandPerformanceGrid] Fallback successful');
            
        } catch (error) {
            console.error('[BrandPerformanceGrid] Fallback failed:', error);
            
            // Use hardcoded fallback data
            this.data = this.getHardcodedData();
            console.log('[BrandPerformanceGrid] Using hardcoded fallback data');
        }
    }

    /**
     * Get hardcoded fallback data
     */
    getHardcodedData() {
        return [
            { brand: "Coca-Cola", value: 2850000, pct: 18.5, change: 12.3, changeType: "increase" },
            { brand: "Pepsi", value: 2420000, pct: 15.7, change: 8.9, changeType: "increase" },
            { brand: "Nestlé", value: 1980000, pct: 12.8, change: 5.2, changeType: "increase" },
            { brand: "Unilever", value: 1650000, pct: 10.7, change: -2.1, changeType: "decrease" },
            { brand: "P&G", value: 1420000, pct: 9.2, change: 3.8, changeType: "increase" },
            { brand: "Mondelez", value: 1180000, pct: 7.6, change: 7.4, changeType: "increase" }
        ];
    }

    /**
     * Render the brand performance grid
     */
    render() {
        if (!this.data || this.data.length === 0) {
            this.showError('No brand data available');
            return;
        }

        const gridHtml = `
            <div class="brand-performance-grid">
                <div class="grid-header">
                    <h3>Top Brand Performance</h3>
                    <div class="grid-controls">
                        <span class="data-source-indicator ${window.dataConfig?.isSimulatedData ? 'demo' : 'live'}">
                            ${window.dataConfig?.isSimulatedData ? '🎭 Demo Data' : '🔴 Live Data'}
                        </span>
                    </div>
                </div>
                <div class="brand-grid">
                    ${this.data.map(brand => this.renderBrandCard(brand)).join('')}
                </div>
                <div class="grid-footer">
                    <small>Last updated: ${new Date().toLocaleString()}</small>
                </div>
            </div>
        `;

        this.container.innerHTML = gridHtml;
        
        // Add click handlers
        this.addEventListeners();
    }

    /**
     * Render individual brand card
     */
    renderBrandCard(brand) {
        const changeIcon = brand.changeType === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down';
        const changeClass = brand.changeType === 'increase' ? 'positive' : 'negative';
        
        return `
            <div class="brand-card" data-brand="${brand.brand}">
                <div class="brand-header">
                    <div class="brand-name">${brand.brand}</div>
                    <div class="brand-percentage">${brand.pct}%</div>
                </div>
                <div class="brand-value">
                    ₱${this.formatNumber(brand.value)}
                </div>
                <div class="brand-change ${changeClass}">
                    <i class="fas ${changeIcon}"></i>
                    ${Math.abs(brand.change)}%
                </div>
                ${brand.category ? `<div class="brand-category">${brand.category}</div>` : ''}
                <div class="brand-actions">
                    <button class="btn-drill-down" data-brand="${brand.brand}">
                        <i class="fas fa-chart-line"></i>
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Add event listeners for interactions
     */
    addEventListeners() {
        // Brand card clicks
        this.container.querySelectorAll('.brand-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-drill-down')) {
                    const brandName = card.dataset.brand;
                    this.handleBrandClick(brandName);
                }
            });
        });

        // Drill-down button clicks
        this.container.querySelectorAll('.btn-drill-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const brandName = btn.dataset.brand;
                this.handleDrillDown(brandName);
            });
        });
    }

    /**
     * Handle brand card click
     */
    handleBrandClick(brandName) {
        console.log(`[BrandPerformanceGrid] Brand clicked: ${brandName}`);
        
        // Emit custom event
        const event = new CustomEvent('brandSelected', {
            detail: { 
                brand: brandName,
                data: this.data.find(b => b.brand === brandName)
            }
        });
        
        document.dispatchEvent(event);
        
        // Show quick info
        this.showBrandInfo(brandName);
    }

    /**
     * Handle drill-down action
     */
    handleDrillDown(brandName) {
        console.log(`[BrandPerformanceGrid] Drill-down: ${brandName}`);
        
        const brandData = this.data.find(b => b.brand === brandName);
        
        if (!brandData) return;
        
        // Show detailed drill-down drawer
        this.showDrillDownDrawer(brandData);
    }

    /**
     * Show brand info popup
     */
    showBrandInfo(brandName) {
        const brandData = this.data.find(b => b.brand === brandName);
        
        if (!brandData) return;
        
        const popup = document.createElement('div');
        popup.className = 'brand-info-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h4>${brandData.brand}</h4>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <div class="info-row">
                        <span class="label">Revenue:</span>
                        <span class="value">₱${this.formatNumber(brandData.value)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Market Share:</span>
                        <span class="value">${brandData.pct}%</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Growth:</span>
                        <span class="value ${brandData.changeType}">${brandData.change}%</span>
                    </div>
                    ${brandData.stores ? `
                        <div class="info-row">
                            <span class="label">Stores:</span>
                            <span class="value">${brandData.stores}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        popup.querySelector('.close-btn').addEventListener('click', () => popup.remove());
        document.body.appendChild(popup);
        
        // Auto-remove after 5 seconds
        setTimeout(() => popup.remove(), 5000);
    }

    /**
     * Show drill-down drawer
     */
    showDrillDownDrawer(brandData) {
        const drawer = document.createElement('div');
        drawer.className = 'brand-drill-down-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <h3>${brandData.brand} Performance Details</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="drawer-content">
                <div class="brand-metrics">
                    <div class="metric-card">
                        <div class="metric-label">Total Revenue</div>
                        <div class="metric-value">₱${this.formatNumber(brandData.value)}</div>
                        <div class="metric-change ${brandData.changeType}">
                            ${brandData.change > 0 ? '+' : ''}${brandData.change}% vs last period
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Market Share</div>
                        <div class="metric-value">${brandData.pct}%</div>
                        <div class="metric-subtitle">of total sales</div>
                    </div>
                    ${brandData.stores ? `
                        <div class="metric-card">
                            <div class="metric-label">Store Count</div>
                            <div class="metric-value">${brandData.stores}</div>
                            <div class="metric-subtitle">active locations</div>
                        </div>
                    ` : ''}
                    ${brandData.topSku ? `
                        <div class="metric-card">
                            <div class="metric-label">Top SKU</div>
                            <div class="metric-value">${brandData.topSku}</div>
                            <div class="metric-subtitle">best performing product</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        drawer.querySelector('.close-btn').addEventListener('click', () => drawer.remove());
        document.body.appendChild(drawer);
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="brand-performance-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading brand performance data...</div>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="brand-performance-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button class="retry-btn" onclick="this.closest('.brand-performance-error').parentElement.brandGrid.init()">
                    Retry
                </button>
            </div>
        `;
        
        // Store reference for retry
        this.container.brandGrid = this;
    }

    /**
     * Format number for display
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toLocaleString();
    }

    /**
     * Refresh data
     */
    async refresh() {
        console.log('[BrandPerformanceGrid] Refreshing data...');
        await this.init();
    }

    /**
     * Update configuration
     */
    updateConfig(config) {
        if (config.dataMode !== undefined) {
            window.dataConfig.isSimulatedData = config.dataMode === 'simulated';
        }
        
        // Refresh with new config
        this.refresh();
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Look for brand performance containers
    const containers = document.querySelectorAll('.brand-performance-container, #brand-performance');
    
    containers.forEach(container => {
        if (!container.brandGrid) {
            container.brandGrid = new BrandPerformanceGrid(container.id || 'brand-performance');
        }
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrandPerformanceGrid;
}