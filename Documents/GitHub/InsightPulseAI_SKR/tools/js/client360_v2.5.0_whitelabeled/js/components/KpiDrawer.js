/**
 * KPI Drill-Down Drawer Component
 * Displays detailed breakdowns for KPI metrics with charts and data tables
 */
class KpiDrawer {
    constructor() {
        this.isOpen = false;
        this.currentKpi = null;
        this.drilldownData = null;
        this.init();
    }

    init() {
        this.createDrawerStructure();
        this.bindEvents();
    }

    createDrawerStructure() {
        // Create drawer container if it doesn't exist
        if (!document.getElementById('kpi-drawer')) {
            const drawerHTML = `
                <div id="kpi-drawer" class="kpi-drawer">
                    <div class="drawer-overlay"></div>
                    <div class="drawer-content">
                        <div class="drawer-header">
                            <h3 class="drawer-title">KPI Drill-Down</h3>
                            <button class="drawer-close" aria-label="Close drawer">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="drawer-body">
                            <div class="kpi-summary">
                                <div class="kpi-value">
                                    <span class="kpi-number">-</span>
                                    <span class="kpi-label">-</span>
                                </div>
                                <div class="kpi-trend">
                                    <span class="trend-indicator">-</span>
                                    <span class="trend-text">vs last period</span>
                                </div>
                            </div>
                            
                            <div class="drill-tabs">
                                <button class="tab-btn active" data-tab="breakdown">Breakdown</button>
                                <button class="tab-btn" data-tab="trends">Trends</button>
                                <button class="tab-btn" data-tab="details">Details</button>
                            </div>
                            
                            <div class="drill-content">
                                <div class="tab-panel active" id="breakdown-panel">
                                    <div class="breakdown-chart">
                                        <canvas id="breakdown-canvas" width="400" height="200"></canvas>
                                    </div>
                                    <div class="breakdown-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Value</th>
                                                    <th>% of Total</th>
                                                    <th>Change</th>
                                                </tr>
                                            </thead>
                                            <tbody id="breakdown-tbody">
                                                <!-- Dynamic content -->
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="tab-panel" id="trends-panel">
                                    <div class="trends-chart">
                                        <canvas id="trends-canvas" width="400" height="200"></canvas>
                                    </div>
                                    <div class="trends-insights">
                                        <h4>Key Insights</h4>
                                        <ul id="trends-insights-list">
                                            <!-- Dynamic content -->
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="tab-panel" id="details-panel">
                                    <div class="details-filters">
                                        <select id="detail-period">
                                            <option value="7d">Last 7 days</option>
                                            <option value="30d" selected>Last 30 days</option>
                                            <option value="90d">Last 90 days</option>
                                        </select>
                                        <select id="detail-region">
                                            <option value="all">All Regions</option>
                                            <option value="ncr">NCR</option>
                                            <option value="visayas">Visayas</option>
                                            <option value="mindanao">Mindanao</option>
                                        </select>
                                    </div>
                                    <div class="details-grid">
                                        <div class="detail-card">
                                            <h5>Top Performers</h5>
                                            <ul id="top-performers-list">
                                                <!-- Dynamic content -->
                                            </ul>
                                        </div>
                                        <div class="detail-card">
                                            <h5>Recent Activity</h5>
                                            <ul id="recent-activity-list">
                                                <!-- Dynamic content -->
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', drawerHTML);
        }
    }

    bindEvents() {
        const drawer = document.getElementById('kpi-drawer');
        const overlay = drawer.querySelector('.drawer-overlay');
        const closeBtn = drawer.querySelector('.drawer-close');
        const tabBtns = drawer.querySelectorAll('.tab-btn');

        // Close drawer events
        overlay.addEventListener('click', () => this.close());
        closeBtn.addEventListener('click', () => this.close());
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Filter change events
        const detailPeriod = document.getElementById('detail-period');
        const detailRegion = document.getElementById('detail-region');
        if (detailPeriod) {
            detailPeriod.addEventListener('change', () => this.updateDetailsPanel());
        }
        if (detailRegion) {
            detailRegion.addEventListener('change', () => this.updateDetailsPanel());
        }
    }

    async open(kpiType, kpiData) {
        this.currentKpi = kpiType;
        
        try {
            // Load drill-down data using config endpoint
            const dataUrl = window.dataConfig?.getDrilldownEndpoint?.(kpiType) || `/data/sim/drilldown/${kpiType}.json`;
            const response = await fetch(dataUrl);
            this.drilldownData = await response.json();
            
            // Update drawer content
            this.updateDrawerContent(kpiData);
            
            // Show drawer
            const drawer = document.getElementById('kpi-drawer');
            drawer.classList.add('open');
            this.isOpen = true;
            
            // Focus management for accessibility
            drawer.querySelector('.drawer-close').focus();
            
        } catch (error) {
            console.error('Failed to load drill-down data:', error);
            this.showErrorState();
        }
    }

    close() {
        const drawer = document.getElementById('kpi-drawer');
        drawer.classList.remove('open');
        this.isOpen = false;
        this.currentKpi = null;
        this.drilldownData = null;
    }

    updateDrawerContent(kpiData) {
        if (!this.drilldownData) return;

        // Update header and summary
        const title = document.querySelector('.drawer-title');
        const kpiNumber = document.querySelector('.kpi-number');
        const kpiLabel = document.querySelector('.kpi-label');
        const trendIndicator = document.querySelector('.trend-indicator');

        title.textContent = `${this.drilldownData.title} Drill-Down`;
        kpiNumber.textContent = kpiData.value || this.drilldownData.summary.value;
        kpiLabel.textContent = this.drilldownData.summary.label;
        trendIndicator.textContent = this.drilldownData.summary.trend;
        trendIndicator.className = `trend-indicator ${this.drilldownData.summary.trendDirection}`;

        // Update breakdown panel
        this.updateBreakdownPanel();
        
        // Update trends panel
        this.updateTrendsPanel();
        
        // Update details panel
        this.updateDetailsPanel();
    }

    updateBreakdownPanel() {
        if (!this.drilldownData?.breakdown) return;

        const tbody = document.getElementById('breakdown-tbody');
        tbody.innerHTML = '';

        this.drilldownData.breakdown.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.category}</td>
                <td>${item.value}</td>
                <td>${item.percentage}%</td>
                <td class="change ${item.changeDirection}">
                    ${item.change}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Draw breakdown chart
        this.drawBreakdownChart();
    }

    updateTrendsPanel() {
        if (!this.drilldownData?.trends) return;

        const insightsList = document.getElementById('trends-insights-list');
        insightsList.innerHTML = '';

        this.drilldownData.trends.insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            insightsList.appendChild(li);
        });

        // Draw trends chart
        this.drawTrendsChart();
    }

    updateDetailsPanel() {
        if (!this.drilldownData?.details) return;

        // Update top performers
        const topPerformers = document.getElementById('top-performers-list');
        topPerformers.innerHTML = '';
        
        this.drilldownData.details.topPerformers.forEach(performer => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${performer.name}</strong> - ${performer.value}`;
            topPerformers.appendChild(li);
        });

        // Update recent activity
        const recentActivity = document.getElementById('recent-activity-list');
        recentActivity.innerHTML = '';
        
        this.drilldownData.details.recentActivity.forEach(activity => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="activity-time">${activity.time}</span> ${activity.description}`;
            recentActivity.appendChild(li);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
    }

    drawBreakdownChart() {
        const canvas = document.getElementById('breakdown-canvas');
        if (!canvas || !this.drilldownData?.breakdown) return;

        const ctx = canvas.getContext('2d');
        const data = this.drilldownData.breakdown;
        
        // Simple pie chart implementation
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let startAngle = 0;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        data.forEach((item, index) => {
            const sliceAngle = (parseFloat(item.percentage) / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            
            startAngle += sliceAngle;
        });
    }

    drawTrendsChart() {
        const canvas = document.getElementById('trends-canvas');
        if (!canvas || !this.drilldownData?.trends?.data) return;

        const ctx = canvas.getContext('2d');
        const data = this.drilldownData.trends.data;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple line chart implementation
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        
        if (data.length === 0) return;
        
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;
        
        ctx.strokeStyle = '#45B7D1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    showErrorState() {
        const drawer = document.getElementById('kpi-drawer');
        const body = drawer.querySelector('.drawer-body');
        body.innerHTML = `
            <div class="error-state">
                <h4>Unable to load drill-down data</h4>
                <p>Please try again later or contact support if the issue persists.</p>
                <button onclick="window.kpiDrawer.close()" class="btn-primary">Close</button>
            </div>
        `;
        
        drawer.classList.add('open');
        this.isOpen = true;
    }
}

// Initialize global KPI drawer instance
window.kpiDrawer = new KpiDrawer();