/**
 * Client360 Dashboard Drill-Down Handler
 * 
 * Handles KPI tile clicks and drill-down drawer functionality
 */

class DrilldownHandler {
    constructor(options = {}) {
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        this.drawerSelector = options.drawerSelector || '#drill-down-drawer';
        this.overlaySelector = options.overlaySelector || '#drill-down-overlay';
        this.loadingSelector = options.loadingSelector || '#drill-down-loading';
        this.contentSelector = options.contentSelector || '#drill-down-content';
        this.closeButtonSelector = options.closeButtonSelector || '#drill-down-close';
        
        this.isVisible = false;
        this.currentKpi = null;
        this.currentData = null;
        
        this.init();
    }

    /**
     * Initialize the drill-down handler
     */
    init() {
        this.createDrawerElements();
        this.bindEvents();
        console.log('DrilldownHandler initialized');
    }

    /**
     * Create drawer HTML elements if they don't exist
     */
    createDrawerElements() {
        // Check if drawer already exists
        if (document.querySelector(this.drawerSelector)) {
            return;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'drill-down-overlay';
        overlay.className = 'drill-down-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        `;

        // Create drawer
        const drawer = document.createElement('div');
        drawer.id = 'drill-down-drawer';
        drawer.className = 'drill-down-drawer';
        drawer.style.cssText = `
            position: fixed;
            top: 0;
            right: -600px;
            width: 600px;
            height: 100%;
            background: white;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            transition: right 0.3s ease;
            overflow-y: auto;
        `;

        drawer.innerHTML = `
            <div class="drill-down-header" style="padding: 20px; border-bottom: 1px solid #e0e0e0; background: #f8f9fa;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="drill-down-title" style="margin: 0; color: #333;">KPI Details</h3>
                    <button id="drill-down-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div id="drill-down-subtitle" style="margin-top: 5px; color: #666; font-size: 14px;"></div>
            </div>
            <div id="drill-down-loading" style="display: none; padding: 40px; text-align: center;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 20px; color: #666;">Loading drill-down data...</p>
            </div>
            <div id="drill-down-content" style="padding: 20px;">
                <!-- Content will be populated here -->
            </div>
        `;

        // Add spinning animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .drill-down-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .drill-down-table th,
            .drill-down-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e0e0e0;
            }
            .drill-down-table th {
                background-color: #f8f9fa;
                font-weight: 600;
            }
            .drill-down-table tr:hover {
                background-color: #f8f9fa;
            }
            .drill-down-metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                margin: 10px 0;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }
            .drill-down-metric-value {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
            }
            .drill-down-metric-label {
                font-size: 14px;
                color: #666;
            }
        `;
        document.head.appendChild(style);

        // Append to body
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Bind KPI tile clicks
        document.addEventListener('click', (e) => {
            const kpiTile = e.target.closest('[data-kpi]');
            if (kpiTile) {
                e.preventDefault();
                const kpi = kpiTile.getAttribute('data-kpi');
                this.showDrilldown(kpi);
            }
        });

        // Bind close events
        document.addEventListener('click', (e) => {
            if (e.target.matches(this.closeButtonSelector) || 
                e.target.matches(this.overlaySelector)) {
                this.hideDrilldown();
            }
        });

        // Bind escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideDrilldown();
            }
        });
    }

    /**
     * Show drill-down drawer for a specific KPI
     * @param {string} kpi - KPI identifier
     */
    async showDrilldown(kpi) {
        this.currentKpi = kpi;
        
        // Show overlay and drawer
        const overlay = document.querySelector(this.overlaySelector);
        const drawer = document.querySelector(this.drawerSelector);
        const loading = document.querySelector(this.loadingSelector);
        const content = document.querySelector(this.contentSelector);
        
        if (!overlay || !drawer) {
            console.error('Drill-down elements not found');
            return;
        }

        // Update title
        const title = document.querySelector('#drill-down-title');
        const subtitle = document.querySelector('#drill-down-subtitle');
        if (title) title.textContent = this.getKpiDisplayName(kpi);
        if (subtitle) subtitle.textContent = 'Loading detailed breakdown...';

        // Show drawer
        overlay.style.display = 'block';
        drawer.style.right = '0px';
        this.isVisible = true;

        // Show loading state
        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            // Fetch drill-down data
            const data = await this.fetchDrilldownData(kpi);
            this.currentData = data;

            // Update subtitle with data info
            if (subtitle) {
                subtitle.textContent = `${data.count} records • Updated ${new Date(data.timestamp).toLocaleString()}`;
            }

            // Render content
            this.renderDrilldownContent(kpi, data);

            // Hide loading, show content
            loading.style.display = 'none';
            content.style.display = 'block';

        } catch (error) {
            console.error('Failed to load drill-down data:', error);
            this.renderError(error.message);
            loading.style.display = 'none';
            content.style.display = 'block';
        }
    }

    /**
     * Hide drill-down drawer
     */
    hideDrilldown() {
        const overlay = document.querySelector(this.overlaySelector);
        const drawer = document.querySelector(this.drawerSelector);
        
        if (overlay) overlay.style.display = 'none';
        if (drawer) drawer.style.right = '-600px';
        
        this.isVisible = false;
        this.currentKpi = null;
        this.currentData = null;
    }

    /**
     * Fetch drill-down data from API
     * @param {string} kpi - KPI identifier
     * @returns {Promise<Object>} API response
     */
    async fetchDrilldownData(kpi) {
        const url = `${this.apiBaseUrl}/drilldown?kpi=${encodeURIComponent(kpi)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Render drill-down content based on KPI type
     * @param {string} kpi - KPI identifier
     * @param {Object} data - API response data
     */
    renderDrilldownContent(kpi, data) {
        const content = document.querySelector(this.contentSelector);
        if (!content) return;

        switch (kpi) {
            case 'total-sales':
                this.renderSalesDrilldown(content, data.data);
                break;
            case 'transactions':
                this.renderTransactionsDrilldown(content, data.data);
                break;
            case 'brand-sentiment':
                this.renderSentimentDrilldown(content, data.data);
                break;
            case 'conversion-rate':
                this.renderConversionDrilldown(content, data.data);
                break;
            case 'growth-rate':
                this.renderGrowthDrilldown(content, data.data);
                break;
            case 'store-performance':
                this.renderStorePerformanceDrilldown(content, data.data);
                break;
            case 'regional-performance':
                this.renderRegionalDrilldown(content, data.data);
                break;
            default:
                this.renderGenericTable(content, data.data);
                break;
        }
    }

    /**
     * Render sales drill-down content
     */
    renderSalesDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Sales by Region (Last 30 Days)</h4>
                ${data.map(row => `
                    <div class="drill-down-metric">
                        <div>
                            <div class="drill-down-metric-label">${row.region_name} (${row.store_count} stores)</div>
                            <div style="font-size: 12px; color: #666;">Growth: ${(row.avg_growth_rate || 0).toFixed(1)}%</div>
                        </div>
                        <div class="drill-down-metric-value">₱${this.formatNumber(row.total_sales)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render transactions drill-down content
     */
    renderTransactionsDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Top Performing Stores (Last 7 Days)</h4>
                ${this.createTable(data, [
                    { key: 'store_name', label: 'Store Name' },
                    { key: 'transaction_count', label: 'Total Transactions' },
                    { key: 'completed_transactions', label: 'Completed' },
                    { key: 'avg_basket_value', label: 'Avg Basket', format: 'currency' },
                    { key: 'avg_duration_sec', label: 'Avg Duration', format: 'duration' }
                ])}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render sentiment drill-down content
     */
    renderSentimentDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Brand Sentiment Analysis (Last 30 Days)</h4>
                ${data.map(row => `
                    <div class="drill-down-metric">
                        <div>
                            <div class="drill-down-metric-label">
                                ${row.brand_name} ${row.is_tbwa_client ? '(TBWA Client)' : ''}
                            </div>
                            <div style="font-size: 12px; color: #666;">
                                +${row.positive_mentions} / -${row.negative_mentions} / ~${row.neutral_mentions}
                            </div>
                        </div>
                        <div class="drill-down-metric-value" style="color: ${this.getSentimentColor(row.avg_sentiment)}">
                            ${(row.avg_sentiment * 100).toFixed(0)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render conversion rate drill-down content
     */
    renderConversionDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Store Conversion Rates (Last 30 Days)</h4>
                ${this.createTable(data, [
                    { key: 'store_name', label: 'Store Name' },
                    { key: 'conversion_rate_pct', label: 'Conversion Rate', format: 'percentage' },
                    { key: 'customer_count_30d', label: 'Customers' },
                    { key: 'sales_30d', label: 'Sales', format: 'currency' },
                    { key: 'region_name', label: 'Region' }
                ])}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render growth rate drill-down content
     */
    renderGrowthDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Store Growth Performance (Last 60 Days)</h4>
                ${this.createTable(data, [
                    { key: 'store_name', label: 'Store Name' },
                    { key: 'growth_rate_pct', label: 'Growth Rate', format: 'percentage' },
                    { key: 'sales_30d', label: '30d Sales', format: 'currency' },
                    { key: 'sales_change', label: 'Change', format: 'currency_change' },
                    { key: 'region_name', label: 'Region' }
                ])}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render store performance drill-down content
     */
    renderStorePerformanceDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Detailed Store Performance (Last 30 Days)</h4>
                ${this.createTable(data, [
                    { key: 'store_name', label: 'Store Name' },
                    { key: 'owner_name', label: 'Owner' },
                    { key: 'sales_30d', label: 'Sales', format: 'currency' },
                    { key: 'conversion_rate_pct', label: 'Conversion', format: 'percentage' },
                    { key: 'growth_rate_pct', label: 'Growth', format: 'percentage' },
                    { key: 'region_name', label: 'Region' }
                ])}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Render regional performance drill-down content
     */
    renderRegionalDrilldown(container, data) {
        const html = `
            <div class="drill-down-summary">
                <h4>Regional Performance Summary (Last 30 Days)</h4>
                ${data.map(row => `
                    <div class="drill-down-metric">
                        <div>
                            <div class="drill-down-metric-label">${row.region_name}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${row.total_stores} stores • ${this.formatNumber(row.total_customers)} customers
                            </div>
                        </div>
                        <div class="drill-down-metric-value">₱${this.formatNumber(row.total_regional_sales)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;
    }

    /**
     * Create a generic table from data
     */
    createTable(data, columns) {
        if (!data || data.length === 0) {
            return '<p>No data available</p>';
        }

        const headers = columns.map(col => `<th>${col.label}</th>`).join('');
        const rows = data.map(row => {
            const cells = columns.map(col => {
                let value = row[col.key];
                if (col.format) {
                    value = this.formatValue(value, col.format);
                }
                return `<td>${value || '-'}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        return `
            <table class="drill-down-table">
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    /**
     * Render generic table for unknown KPI types
     */
    renderGenericTable(container, data) {
        if (!data || data.length === 0) {
            container.innerHTML = '<p>No data available for this KPI.</p>';
            return;
        }

        // Auto-generate columns from first row
        const firstRow = data[0];
        const columns = Object.keys(firstRow).map(key => ({
            key: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));

        container.innerHTML = this.createTable(data, columns);
    }

    /**
     * Render error message
     */
    renderError(message) {
        const content = document.querySelector(this.contentSelector);
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h4>Error Loading Data</h4>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get display name for KPI
     */
    getKpiDisplayName(kpi) {
        const names = {
            'total-sales': 'Total Sales',
            'transactions': 'Transactions',
            'brand-sentiment': 'Brand Sentiment',
            'conversion-rate': 'Conversion Rate',
            'growth-rate': 'Growth Rate',
            'store-performance': 'Store Performance',
            'regional-performance': 'Regional Performance'
        };
        return names[kpi] || kpi.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format numbers for display
     */
    formatNumber(num) {
        if (num == null) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toLocaleString();
    }

    /**
     * Format values based on type
     */
    formatValue(value, format) {
        if (value == null) return '-';
        
        switch (format) {
            case 'currency':
                return '₱' + this.formatNumber(value);
            case 'currency_change':
                const sign = value >= 0 ? '+' : '';
                return sign + '₱' + this.formatNumber(value);
            case 'percentage':
                return value.toFixed(1) + '%';
            case 'duration':
                return Math.round(value) + 's';
            default:
                return value;
        }
    }

    /**
     * Get color for sentiment score
     */
    getSentimentColor(score) {
        if (score >= 0.6) return '#27ae60';
        if (score >= 0.4) return '#f39c12';
        return '#e74c3c';
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.drilldownHandler = new DrilldownHandler();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrilldownHandler;
}