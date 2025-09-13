/**
 * Client360 Dashboard Drill-Down Handler
 * Handles click events on KPI tiles and displays detailed data in a drawer
 */
class DrillDownHandler {
    constructor() {
        this.apiBaseUrl = '/api/drilldown';
        this.currentDrawer = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.attachEventListeners());
        } else {
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        // Find all clickable KPI tiles
        const kpiTiles = document.querySelectorAll('.kpi-tile.clickable[data-kpi]');
        
        kpiTiles.forEach(tile => {
            tile.addEventListener('click', (e) => {
                e.preventDefault();
                const kpiType = tile.getAttribute('data-kpi');
                this.handleKpiClick(kpiType, tile);
            });
            
            // Add visual feedback
            tile.style.cursor = 'pointer';
            tile.addEventListener('mouseenter', () => {
                tile.style.transform = 'scale(1.02)';
                tile.style.transition = 'transform 0.2s ease';
            });
            tile.addEventListener('mouseleave', () => {
                tile.style.transform = 'scale(1)';
            });
        });

        console.log(`DrillDownHandler: Attached listeners to ${kpiTiles.length} KPI tiles`);
    }

    async handleKpiClick(kpiType, sourceElement) {
        console.log(`DrillDownHandler: Clicked KPI type: ${kpiType}`);
        
        try {
            // Show loading state
            this.showLoadingState(sourceElement);
            
            // Fetch drill-down data
            const data = await this.fetchDrillDownData(kpiType);
            
            // Create and show drawer
            this.showDrawer(kpiType, data, sourceElement);
            
        } catch (error) {
            console.error('Error fetching drill-down data:', error);
            this.showErrorState(sourceElement, error.message);
        }
    }

    async fetchDrillDownData(kpiType) {
        const response = await fetch(`${this.apiBaseUrl}/${kpiType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    showLoadingState(element) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Loading details...</span>
            </div>
        `;
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: 8px;
        `;
        
        element.style.position = 'relative';
        element.appendChild(loadingOverlay);
        
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.remove();
            }
        }, 5000); // Auto-remove after 5s
    }

    showErrorState(element, message) {
        // Remove any existing loading overlay
        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }

        // Show error notification
        this.showNotification(`Error loading drill-down data: ${message}`, 'error');
    }

    showDrawer(kpiType, data, sourceElement) {
        // Remove any existing drawer
        this.closeDrawer();

        // Create drawer element
        const drawer = document.createElement('div');
        drawer.className = 'drill-down-drawer';
        drawer.innerHTML = this.generateDrawerContent(kpiType, data);
        
        // Add drawer styles
        this.addDrawerStyles();
        
        // Append to body
        document.body.appendChild(drawer);
        this.currentDrawer = drawer;

        // Remove loading state
        const loadingOverlay = sourceElement.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }

        // Animate in
        setTimeout(() => {
            drawer.classList.add('open');
        }, 10);

        // Add event listeners
        this.addDrawerEventListeners(drawer);
    }

    generateDrawerContent(kpiType, data) {
        const title = this.getKpiTitle(kpiType);
        const content = this.renderKpiContent(kpiType, data);

        return `
            <div class="drawer-header">
                <h2>${title}</h2>
                <button class="close-btn" aria-label="Close drawer">&times;</button>
            </div>
            <div class="drawer-content">
                ${content}
            </div>
        `;
    }

    getKpiTitle(kpiType) {
        const titles = {
            'total-sales': 'Total Sales Breakdown',
            'transactions': 'Transaction Analysis',
            'brand-sentiment': 'Brand Sentiment Analysis',
            'conversion-rate': 'Conversion Rate Details',
            'growth-rate': 'Growth Rate Trends',
            'store-performance': 'Store Performance Metrics',
            'regional-performance': 'Regional Performance Analysis'
        };
        return titles[kpiType] || 'KPI Details';
    }

    renderKpiContent(kpiType, data) {
        switch (kpiType) {
            case 'total-sales':
                return this.renderSalesContent(data);
            case 'transactions':
                return this.renderTransactionsContent(data);
            case 'brand-sentiment':
                return this.renderBrandSentimentContent(data);
            case 'conversion-rate':
                return this.renderConversionRateContent(data);
            case 'growth-rate':
                return this.renderGrowthRateContent(data);
            case 'store-performance':
                return this.renderStorePerformanceContent(data);
            case 'regional-performance':
                return this.renderRegionalPerformanceContent(data);
            default:
                return this.renderGenericContent(data);
        }
    }

    renderSalesContent(data) {
        if (!data.breakdown) return '<p>No sales data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Sales by Category</h3>';
        html += '<div class="breakdown-grid">';
        
        data.breakdown.forEach(item => {
            html += `
                <div class="breakdown-item">
                    <div class="item-label">${item.category}</div>
                    <div class="item-value">₱${item.amount.toLocaleString()}</div>
                    <div class="item-change ${item.change >= 0 ? 'positive' : 'negative'}">
                        ${item.change >= 0 ? '+' : ''}${item.change}%
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderTransactionsContent(data) {
        if (!data.hourly) return '<p>No transaction data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Hourly Transaction Pattern</h3>';
        html += '<div class="chart-container">';
        html += '<div class="hourly-chart">';
        
        data.hourly.forEach(item => {
            const height = (item.count / Math.max(...data.hourly.map(h => h.count))) * 100;
            html += `
                <div class="hour-bar" style="height: ${height}%;" title="${item.hour}:00 - ${item.count} transactions">
                    <div class="bar-label">${item.hour}</div>
                </div>
            `;
        });
        
        html += '</div></div></div>';
        return html;
    }

    renderBrandSentimentContent(data) {
        if (!data.brands) return '<p>No brand sentiment data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Brand Sentiment Analysis</h3>';
        html += '<div class="sentiment-grid">';
        
        data.brands.forEach(brand => {
            const sentimentClass = brand.sentiment >= 0.7 ? 'positive' : 
                                 brand.sentiment >= 0.4 ? 'neutral' : 'negative';
            html += `
                <div class="sentiment-item">
                    <div class="brand-name">${brand.name}</div>
                    <div class="sentiment-score ${sentimentClass}">
                        ${(brand.sentiment * 100).toFixed(1)}%
                    </div>
                    <div class="mention-count">${brand.mentions} mentions</div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderConversionRateContent(data) {
        if (!data.funnel) return '<p>No conversion data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Conversion Funnel</h3>';
        html += '<div class="funnel-container">';
        
        data.funnel.forEach((stage, index) => {
            const width = (stage.count / data.funnel[0].count) * 100;
            html += `
                <div class="funnel-stage">
                    <div class="stage-bar" style="width: ${width}%;">
                        <span class="stage-label">${stage.stage}</span>
                        <span class="stage-count">${stage.count.toLocaleString()}</span>
                    </div>
                    <div class="stage-rate">${stage.rate}%</div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderGrowthRateContent(data) {
        if (!data.periods) return '<p>No growth data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Growth Trends</h3>';
        html += '<div class="growth-timeline">';
        
        data.periods.forEach(period => {
            const growthClass = period.growth >= 0 ? 'positive' : 'negative';
            html += `
                <div class="growth-period">
                    <div class="period-label">${period.period}</div>
                    <div class="growth-value ${growthClass}">
                        ${period.growth >= 0 ? '+' : ''}${period.growth}%
                    </div>
                    <div class="period-revenue">₱${period.revenue.toLocaleString()}</div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderStorePerformanceContent(data) {
        if (!data.stores) return '<p>No store performance data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Top Performing Stores</h3>';
        html += '<div class="store-list">';
        
        data.stores.forEach((store, index) => {
            html += `
                <div class="store-item">
                    <div class="store-rank">#${index + 1}</div>
                    <div class="store-info">
                        <div class="store-name">${store.name}</div>
                        <div class="store-location">${store.location}</div>
                    </div>
                    <div class="store-metrics">
                        <div class="metric">
                            <span class="metric-label">Revenue</span>
                            <span class="metric-value">₱${store.revenue.toLocaleString()}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Conversion</span>
                            <span class="metric-value">${store.conversion_rate}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderRegionalPerformanceContent(data) {
        if (!data.regions) return '<p>No regional data available</p>';
        
        let html = '<div class="kpi-breakdown">';
        html += '<h3>Regional Performance</h3>';
        html += '<div class="region-grid">';
        
        data.regions.forEach(region => {
            html += `
                <div class="region-item">
                    <div class="region-name">${region.name}</div>
                    <div class="region-metrics">
                        <div class="metric-row">
                            <span>Revenue:</span>
                            <span>₱${region.revenue.toLocaleString()}</span>
                        </div>
                        <div class="metric-row">
                            <span>Stores:</span>
                            <span>${region.store_count}</span>
                        </div>
                        <div class="metric-row">
                            <span>Growth:</span>
                            <span class="${region.growth >= 0 ? 'positive' : 'negative'}">
                                ${region.growth >= 0 ? '+' : ''}${region.growth}%
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }

    renderGenericContent(data) {
        return `
            <div class="kpi-breakdown">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    addDrawerStyles() {
        if (document.querySelector('#drill-down-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'drill-down-styles';
        styles.textContent = `
            .drill-down-drawer {
                position: fixed;
                top: 0;
                right: -600px;
                width: 600px;
                height: 100vh;
                background: white;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                z-index: 1000;
                transition: right 0.3s ease;
                overflow-y: auto;
            }
            
            .drill-down-drawer.open {
                right: 0;
            }
            
            .drawer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .drawer-header h2 {
                margin: 0;
                color: #333;
                font-size: 1.25rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                color: #666;
            }
            
            .close-btn:hover {
                color: #333;
            }
            
            .drawer-content {
                padding: 1.5rem;
            }
            
            .kpi-breakdown h3 {
                margin-top: 0;
                color: #333;
                border-bottom: 2px solid #007bff;
                padding-bottom: 0.5rem;
            }
            
            .breakdown-grid {
                display: grid;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .item-label {
                font-weight: 500;
                color: #333;
            }
            
            .item-value {
                font-weight: bold;
                color: #007bff;
            }
            
            .item-change.positive {
                color: #28a745;
            }
            
            .item-change.negative {
                color: #dc3545;
            }
            
            .hourly-chart {
                display: flex;
                align-items: end;
                gap: 4px;
                height: 200px;
                padding: 1rem 0;
            }
            
            .hour-bar {
                flex: 1;
                background: #007bff;
                position: relative;
                min-height: 20px;
                border-radius: 2px 2px 0 0;
                cursor: pointer;
            }
            
            .bar-label {
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.8rem;
                color: #666;
            }
            
            .sentiment-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .sentiment-item {
                padding: 1rem;
                border: 1px solid #eee;
                border-radius: 8px;
                text-align: center;
            }
            
            .brand-name {
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            
            .sentiment-score {
                font-size: 1.25rem;
                font-weight: bold;
                margin-bottom: 0.25rem;
            }
            
            .sentiment-score.positive { color: #28a745; }
            .sentiment-score.neutral { color: #ffc107; }
            .sentiment-score.negative { color: #dc3545; }
            
            .funnel-container {
                margin-top: 1rem;
            }
            
            .funnel-stage {
                display: flex;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .stage-bar {
                background: #007bff;
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 200px;
            }
            
            .stage-rate {
                margin-left: 1rem;
                font-weight: bold;
                color: #333;
            }
            
            .growth-timeline {
                margin-top: 1rem;
            }
            
            .growth-period {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #eee;
            }
            
            .growth-value.positive { color: #28a745; }
            .growth-value.negative { color: #dc3545; }
            
            .store-list {
                margin-top: 1rem;
            }
            
            .store-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border: 1px solid #eee;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .store-rank {
                font-size: 1.25rem;
                font-weight: bold;
                color: #007bff;
                margin-right: 1rem;
            }
            
            .store-info {
                flex: 1;
                margin-right: 1rem;
            }
            
            .store-name {
                font-weight: bold;
                margin-bottom: 0.25rem;
            }
            
            .store-location {
                color: #666;
                font-size: 0.9rem;
            }
            
            .store-metrics {
                display: flex;
                gap: 1rem;
            }
            
            .metric {
                text-align: center;
            }
            
            .metric-label {
                display: block;
                font-size: 0.8rem;
                color: #666;
            }
            
            .metric-value {
                font-weight: bold;
                color: #333;
            }
            
            .region-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .region-item {
                padding: 1rem;
                border: 1px solid #eee;
                border-radius: 8px;
            }
            
            .region-name {
                font-weight: bold;
                margin-bottom: 1rem;
                color: #333;
            }
            
            .metric-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .loading-spinner {
                text-align: center;
            }
            
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1001;
                max-width: 300px;
            }
            
            .notification.error {
                border-left: 4px solid #dc3545;
                background: #f8d7da;
                color: #721c24;
            }
            
            .notification.success {
                border-left: 4px solid #28a745;
                background: #d4edda;
                color: #155724;
            }
        `;
        
        document.head.appendChild(styles);
    }

    addDrawerEventListeners(drawer) {
        // Close button
        const closeBtn = drawer.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.closeDrawer());

        // ESC key
        const escListener = (e) => {
            if (e.key === 'Escape') {
                this.closeDrawer();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        // Click outside to close
        const outsideClickListener = (e) => {
            if (!drawer.contains(e.target)) {
                this.closeDrawer();
                document.removeEventListener('click', outsideClickListener);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', outsideClickListener);
        }, 100);
    }

    closeDrawer() {
        if (this.currentDrawer) {
            this.currentDrawer.classList.remove('open');
            setTimeout(() => {
                if (this.currentDrawer && this.currentDrawer.parentNode) {
                    this.currentDrawer.remove();
                }
                this.currentDrawer = null;
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.drillDownHandler = new DrillDownHandler();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    window.drillDownHandler = new DrillDownHandler();
}