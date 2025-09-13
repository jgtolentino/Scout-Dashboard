/**
 * Scout Dashboard Modules - v2.5.0
 * JSON-driven dashboard modules with exact spec compliance
 * Implements transaction-trends and product-mix-sku-analysis modules
 * PRD Section 4.3 - Zero tolerance for spec violations
 * WCAG 2.1 AA compliant with Chart.js integration
 */

class ScoutDashboardModules {
    constructor(container, configPath = '/config/desired-state.json') {
        this.container = container;
        this.configPath = configPath;
        this.config = null;
        this.modules = [];
        this.moduleInstances = new Map();
        this.chartInstances = new Map();
        this.eventListeners = new Map();
        this.driftDetected = false;
        this.refreshIntervals = new Map();
        this.apiCache = new Map();
        this.loadingStates = new Set();
        this.errorStates = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            loadStart: performance.now(),
            renderStart: null,
            renderEnd: null,
            moduleLoadTimes: new Map(),
            apiCalls: [],
            chartRenderTimes: new Map()
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.performanceMetrics.renderStart = performance.now();
            
            await this.loadConfiguration();
            await this.validateSpecCompliance();
            this.render();
            this.bindEvents();
            await this.initializeModules();
            
            this.performanceMetrics.renderEnd = performance.now();
            this.reportPerformanceMetrics();
            this.dispatchEvent('scout-modules:ready', { component: this });
            
        } catch (error) {
            console.error('Scout Dashboard Modules initialization failed:', error);
            this.handleFallback(error);
        }
    }
    
    async loadConfiguration() {
        try {
            const response = await fetch(this.configPath);
            if (!response.ok) {
                throw new Error(`Configuration load failed: ${response.status}`);
            }
            
            const fullConfig = await response.json();
            this.modules = fullConfig.modules;
            
            if (!this.modules || !Array.isArray(this.modules)) {
                throw new Error('Modules configuration not found in desired-state.json');
            }
            
            console.log('✅ Scout Modules: Configuration loaded successfully');
            
        } catch (error) {
            console.error('❌ Scout Modules: Configuration load failed:', error);
            throw error;
        }
    }
    
    async validateSpecCompliance() {
        const requiredModules = [
            {
                id: 'transaction-trends',
                type: 'lineChart',
                endpoint: '/api/transactions/trends',
                position: { row: 1, col: 1, width: 6, height: 4 },
                series: ['total_transactions', 'successful_transactions', 'failed_transactions']
            },
            {
                id: 'product-mix-sku-analysis',
                type: 'barChart',
                endpoint: '/api/product-mix-sku',
                position: { row: 1, col: 7, width: 6, height: 4 },
                series: ['total_revenue', 'unit_sales']
            }
        ];
        
        const violations = [];
        
        for (const required of requiredModules) {
            const module = this.modules.find(m => m.id === required.id);
            
            if (!module) {
                violations.push(`Missing required module: ${required.id}`);
                continue;
            }
            
            // Validate basic properties
            if (module.type !== required.type) {
                violations.push(`Module ${required.id} type mismatch. Expected: ${required.type}, Got: ${module.type}`);
            }
            
            if (module.endpoint !== required.endpoint) {
                violations.push(`Module ${required.id} endpoint mismatch. Expected: ${required.endpoint}, Got: ${module.endpoint}`);
            }
            
            if (!module.drillDown) {
                violations.push(`Module ${required.id} must have drillDown enabled`);
            }
            
            if (!module.refreshInterval || module.refreshInterval !== 900000) {
                violations.push(`Module ${required.id} refreshInterval must be 900000ms`);
            }
            
            // Validate position
            const pos = module.position;
            const reqPos = required.position;
            if (!pos || pos.row !== reqPos.row || pos.col !== reqPos.col || 
                pos.width !== reqPos.width || pos.height !== reqPos.height) {
                violations.push(`Module ${required.id} position mismatch. Expected: ${JSON.stringify(reqPos)}, Got: ${JSON.stringify(pos)}`);
            }
            
            // Validate configuration structure
            if (!module.config) {
                violations.push(`Module ${required.id} missing config object`);
                continue;
            }
            
            const config = module.config;
            
            // Validate axes
            if (!config.xAxis || !config.yAxis) {
                violations.push(`Module ${required.id} missing xAxis or yAxis configuration`);
            }
            
            // Validate series
            if (!config.series || !Array.isArray(config.series)) {
                violations.push(`Module ${required.id} missing series configuration`);
            } else {
                for (const seriesField of required.series) {
                    const seriesExists = config.series.some(s => s.field === seriesField);
                    if (!seriesExists) {
                        violations.push(`Module ${required.id} missing required series: ${seriesField}`);
                    }
                }
            }
            
            // Validate responsive and accessibility
            if (!config.responsive) {
                violations.push(`Module ${required.id} must have responsive: true`);
            }
            
            if (!config.legend || !config.tooltip) {
                violations.push(`Module ${required.id} missing legend or tooltip configuration`);
            }
        }
        
        // Validate specific module configurations
        const transactionTrends = this.modules.find(m => m.id === 'transaction-trends');
        if (transactionTrends && transactionTrends.config) {
            const config = transactionTrends.config;
            
            // Validate line chart specific config
            if (config.xAxis.field !== 'date' || config.xAxis.format !== 'MMM DD') {
                violations.push('Transaction trends xAxis configuration mismatch');
            }
            
            if (config.yAxis.field !== 'count' || config.yAxis.format !== 'number') {
                violations.push('Transaction trends yAxis configuration mismatch');
            }
            
            // Validate series colors
            const expectedColors = ['#2196F3', '#4CAF50', '#f44336'];
            config.series.forEach((series, index) => {
                if (series.color !== expectedColors[index]) {
                    violations.push(`Transaction trends series ${index} color mismatch`);
                }
            });
        }
        
        const productMix = this.modules.find(m => m.id === 'product-mix-sku-analysis');
        if (productMix && productMix.config) {
            const config = productMix.config;
            
            // Validate bar chart specific config
            if (config.xAxis.field !== 'category' || config.xAxis.rotate !== 45) {
                violations.push('Product mix xAxis configuration mismatch');
            }
            
            if (config.yAxis.field !== 'revenue' || config.yAxis.format !== 'currency') {
                violations.push('Product mix yAxis configuration mismatch');
            }
            
            if (!config.secondaryYAxis || config.secondaryYAxis.position !== 'right') {
                violations.push('Product mix missing or invalid secondaryYAxis configuration');
            }
        }
        
        if (violations.length > 0) {
            this.driftDetected = true;
            const error = new Error(`SPEC COMPLIANCE FAILURE - Scout Modules drift detected:\n${violations.join('\n')}`);
            error.name = 'SpecComplianceError';
            error.violations = violations;
            
            this.reportDriftViolation(violations);
            throw error;
        }
        
        console.log('✅ Scout Modules: Spec compliance validated');
    }
    
    render() {
        if (!this.container) {
            throw new Error('Scout Modules: Container element not found');
        }
        
        const modulesHTML = `
            <div class="scout-modules" 
                 role="main" 
                 aria-label="Dashboard Modules"
                 data-component="scout-modules"
                 data-version="2.5.0">
                
                <div class="scout-modules__grid">
                    ${this.modules.map(module => this.renderModule(module)).join('')}
                </div>
                
                <!-- Global Loading Overlay -->
                <div class="scout-modules__loading-overlay" aria-hidden="true">
                    <div class="scout-loading-content">
                        <div class="scout-loading-spinner"></div>
                        <span>Loading dashboard modules...</span>
                    </div>
                </div>
                
                <!-- Error Boundary -->
                <div class="scout-modules__error-boundary" role="alert" aria-live="assertive" aria-hidden="true">
                    <div class="scout-error-content">
                        <span class="material-icons">error</span>
                        <div class="scout-error-details">
                            <h3>Module Error</h3>
                            <p class="scout-error-message"></p>
                            <button type="button" class="scout-error-retry">Retry</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = modulesHTML;
        console.log('🎨 Scout Modules: Rendered successfully');
    }
    
    renderModule(module) {
        const gridStyle = `
            grid-column: ${module.position.col} / span ${module.position.width};
            grid-row: ${module.position.row} / span ${module.position.height};
        `;
        
        return `
            <div class="scout-module" 
                 data-module-id="${module.id}"
                 style="${gridStyle}"
                 role="region"
                 aria-labelledby="scout-module-${module.id}-title">
                
                <!-- Module Header -->
                <div class="scout-module__header">
                    <h3 id="scout-module-${module.id}-title" class="scout-module__title">
                        ${module.label}
                    </h3>
                    
                    <div class="scout-module__actions">
                        <!-- Data Freshness Indicator -->
                        <div class="scout-module__freshness" 
                             aria-label="Data freshness"
                             title="Last updated">
                            <span class="material-icons">access_time</span>
                            <span class="scout-freshness-time">--</span>
                        </div>
                        
                        <!-- Refresh Button -->
                        <button type="button" 
                                class="scout-module__refresh"
                                aria-label="Refresh ${module.label}"
                                data-module-id="${module.id}">
                            <span class="material-icons">refresh</span>
                        </button>
                        
                        <!-- Export Button -->
                        <button type="button" 
                                class="scout-module__export"
                                aria-label="Export ${module.label} data"
                                data-module-id="${module.id}">
                            <span class="material-icons">file_download</span>
                        </button>
                        
                        <!-- Drill Down Button -->
                        ${module.drillDown ? `
                            <button type="button" 
                                    class="scout-module__drilldown"
                                    aria-label="Drill down into ${module.label}"
                                    data-module-id="${module.id}">
                                <span class="material-icons">zoom_in</span>
                            </button>
                        ` : ''}
                        
                        <!-- Fullscreen Button -->
                        <button type="button" 
                                class="scout-module__fullscreen"
                                aria-label="View ${module.label} in fullscreen"
                                data-module-id="${module.id}">
                            <span class="material-icons">fullscreen</span>
                        </button>
                    </div>
                </div>
                
                <!-- Module Content -->
                <div class="scout-module__content">
                    <div class="scout-module__chart-container">
                        <canvas id="scout-chart-${module.id}" 
                                class="scout-module__chart"
                                role="img"
                                aria-label="${module.label} chart"
                                aria-describedby="scout-chart-${module.id}-desc">
                        </canvas>
                        
                        <div id="scout-chart-${module.id}-desc" class="sr-only">
                            Interactive ${module.type} showing ${module.label.toLowerCase()} data
                        </div>
                    </div>
                    
                    <!-- Chart Legend (WCAG compliance) -->
                    <div class="scout-module__legend" role="list" aria-label="Chart legend">
                        ${module.config.series.map(series => `
                            <div class="scout-legend-item" role="listitem">
                                <span class="scout-legend-color" 
                                      style="background-color: ${series.color}"
                                      aria-hidden="true"></span>
                                <span class="scout-legend-label">${series.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Module Loading State -->
                <div class="scout-module__loading" aria-hidden="true">
                    <div class="scout-loading-spinner"></div>
                    <span>Loading ${module.label.toLowerCase()}...</span>
                </div>
                
                <!-- Module Error State -->
                <div class="scout-module__error" role="alert" aria-hidden="true">
                    <span class="material-icons">error</span>
                    <div class="scout-error-text">
                        <h4>Failed to load ${module.label}</h4>
                        <p class="scout-error-details"></p>
                        <button type="button" 
                                class="scout-error-retry-btn"
                                data-module-id="${module.id}">
                            Retry
                        </button>
                    </div>
                </div>
                
                <!-- Module No Data State -->
                <div class="scout-module__no-data" aria-hidden="true">
                    <span class="material-icons">inbox</span>
                    <div class="scout-no-data-text">
                        <h4>No data available</h4>
                        <p>No ${module.label.toLowerCase()} data found for the selected filters.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    async initializeModules() {
        console.log(`🔄 Scout Modules: Initializing ${this.modules.length} modules`);
        
        // Initialize Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }
        
        // Initialize each module
        for (const module of this.modules) {
            try {
                const moduleStart = performance.now();
                
                await this.initializeModule(module);
                
                const moduleEnd = performance.now();
                this.performanceMetrics.moduleLoadTimes.set(module.id, moduleEnd - moduleStart);
                
                console.log(`✅ Scout Modules: Initialized ${module.id}`);
                
            } catch (error) {
                console.error(`❌ Scout Modules: Failed to initialize ${module.id}:`, error);
                this.setModuleError(module.id, error.message);
            }
        }
        
        console.log('✅ Scout Modules: All modules initialized');
    }
    
    async loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
    }
    
    async initializeModule(module) {
        this.setModuleLoading(module.id, true);
        
        try {
            // Load data
            const data = await this.loadModuleData(module);
            
            // Create chart
            await this.createChart(module, data);
            
            // Set up auto-refresh
            if (module.refreshInterval) {
                this.setupAutoRefresh(module);
            }
            
            // Update freshness indicator
            this.updateDataFreshness(module.id);
            
            this.setModuleLoading(module.id, false);
            
        } catch (error) {
            this.setModuleLoading(module.id, false);
            throw error;
        }
    }
    
    async loadModuleData(module, filters = {}) {
        const cacheKey = `${module.endpoint}_${JSON.stringify(filters)}`;
        
        // Check cache first
        if (this.apiCache.has(cacheKey)) {
            const cached = this.apiCache.get(cacheKey);
            // Cache valid for 5 minutes
            if (Date.now() - cached.timestamp < 300000) {
                console.log(`📱 Scout Modules: Using cached data for ${module.id}`);
                return cached.data;
            }
        }
        
        try {
            const apiCallStart = performance.now();
            
            // Build URL with filters
            const url = new URL(module.endpoint, window.location.origin);
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== '') {
                    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : value);
                }
            });
            
            // Set up timeout (10s per PRD)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url.toString(), {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const apiCallEnd = performance.now();
            
            // Validate data structure
            this.validateModuleData(module, data);
            
            // Cache the results
            this.apiCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            // Track performance
            this.performanceMetrics.apiCalls.push({
                moduleId: module.id,
                endpoint: module.endpoint,
                duration: apiCallEnd - apiCallStart,
                resultCount: data.length || 0,
                cached: false
            });
            
            console.log(`✅ Scout Modules: Loaded data for ${module.id} (${data.length || 0} records)`);
            return data;
            
        } catch (error) {
            console.error(`❌ Scout Modules: Failed to load data for ${module.id}:`, error);
            throw error;
        }
    }
    
    validateModuleData(module, data) {
        if (!Array.isArray(data)) {
            throw new Error('Module data must be an array');
        }
        
        if (data.length === 0) {
            console.warn(`Module ${module.id} returned empty data`);
            return;
        }
        
        // Validate required fields exist in data
        const sampleRecord = data[0];
        const requiredFields = [
            module.config.xAxis.field,
            module.config.yAxis.field,
            ...module.config.series.map(s => s.field)
        ];
        
        for (const field of requiredFields) {
            if (!(field in sampleRecord)) {
                throw new Error(`Missing required field '${field}' in module data`);
            }
        }
    }
    
    async createChart(module, data) {
        const chartStart = performance.now();
        
        const canvas = document.getElementById(`scout-chart-${module.id}`);
        if (!canvas) {
            throw new Error(`Chart canvas not found for module ${module.id}`);
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chartInstances.has(module.id)) {
            this.chartInstances.get(module.id).destroy();
        }
        
        const chartConfig = this.buildChartConfig(module, data);
        
        try {
            const chart = new Chart(ctx, chartConfig);
            this.chartInstances.set(module.id, chart);
            
            const chartEnd = performance.now();
            this.performanceMetrics.chartRenderTimes.set(module.id, chartEnd - chartStart);
            
            console.log(`📊 Scout Modules: Chart created for ${module.id}`);
            
        } catch (error) {
            console.error(`❌ Scout Modules: Chart creation failed for ${module.id}:`, error);
            throw error;
        }
    }
    
    buildChartConfig(module, data) {
        const config = module.config;
        const baseConfig = {
            type: module.type === 'lineChart' ? 'line' : 'bar',
            data: this.buildChartData(module, data),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: module.label,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: config.legend.position,
                        align: config.legend.align,
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        enabled: config.tooltip.enabled,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (context) => {
                                const dataPoint = data[context[0].dataIndex];
                                return this.formatTooltipTitle(module, dataPoint);
                            },
                            label: (context) => {
                                const dataPoint = data[context.dataIndex];
                                return this.formatTooltipLabel(module, context, dataPoint);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: config.xAxis.label
                        },
                        ticks: {
                            maxRotation: config.xAxis.rotate || 0,
                            minRotation: config.xAxis.rotate || 0
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: config.yAxis.label
                        },
                        ticks: {
                            callback: (value) => {
                                return this.formatAxisValue(config.yAxis.format, value);
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0 && module.drillDown) {
                        this.handleChartClick(module.id, elements[0]);
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 && module.drillDown ? 'pointer' : 'default';
                },
                accessibility: {
                    enabled: true,
                    announceNewData: {
                        enabled: true
                    }
                }
            }
        };
        
        // Add secondary Y axis if configured
        if (config.secondaryYAxis) {
            baseConfig.options.scales.y1 = {
                type: 'linear',
                display: true,
                position: config.secondaryYAxis.position,
                title: {
                    display: true,
                    text: config.secondaryYAxis.label
                },
                ticks: {
                    callback: (value) => {
                        return this.formatAxisValue(config.secondaryYAxis.format, value);
                    }
                },
                grid: {
                    drawOnChartArea: false
                }
            };
        }
        
        return baseConfig;
    }
    
    buildChartData(module, data) {
        const config = module.config;
        
        // Extract labels from x-axis field
        const labels = data.map(item => {
            const value = item[config.xAxis.field];
            return this.formatAxisValue(config.xAxis.format, value);
        });
        
        // Build datasets for each series
        const datasets = config.series.map(series => {
            return {
                label: series.label,
                data: data.map(item => item[series.field]),
                backgroundColor: series.color + '20', // Add transparency
                borderColor: series.color,
                borderWidth: module.type === 'lineChart' ? 2 : 1,
                fill: module.type === 'lineChart' ? false : true,
                tension: module.type === 'lineChart' ? 0.1 : 0,
                yAxisID: series.yAxis === 'secondary' ? 'y1' : 'y'
            };
        });
        
        return {
            labels: labels,
            datasets: datasets
        };
    }
    
    formatAxisValue(format, value) {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                }).format(value);
            case 'number':
                return new Intl.NumberFormat('en-US').format(value);
            case 'MMM DD':
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            default:
                return value;
        }
    }
    
    formatTooltipTitle(module, dataPoint) {
        const xField = module.config.xAxis.field;
        const value = dataPoint[xField];
        return this.formatAxisValue(module.config.xAxis.format, value);
    }
    
    formatTooltipLabel(module, context, dataPoint) {
        const series = module.config.series[context.datasetIndex];
        const value = dataPoint[series.field];
        
        if (module.config.tooltip.format) {
            return module.config.tooltip.format
                .replace('{series}', series.label)
                .replace('{value:,}', new Intl.NumberFormat('en-US').format(value))
                .replace('{value:,.2f}', new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value))
                .replace('{date}', this.formatTooltipTitle(module, dataPoint))
                .replace('{category}', dataPoint[module.config.xAxis.field]);
        }
        
        return `${series.label}: ${this.formatAxisValue(series.format || 'number', value)}`;
    }
    
    setupAutoRefresh(module) {
        if (this.refreshIntervals.has(module.id)) {
            clearInterval(this.refreshIntervals.get(module.id));
        }
        
        const interval = setInterval(() => {
            this.refreshModule(module.id);
        }, module.refreshInterval);
        
        this.refreshIntervals.set(module.id, interval);
        
        console.log(`🔄 Scout Modules: Auto-refresh enabled for ${module.id} (${module.refreshInterval}ms)`);
    }
    
    async refreshModule(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;
        
        try {
            console.log(`🔄 Scout Modules: Refreshing ${moduleId}`);
            
            // Get current filters from global state
            const filters = this.getCurrentFilters();
            
            // Load new data
            const data = await this.loadModuleData(module, filters);
            
            // Update chart
            const chart = this.chartInstances.get(moduleId);
            if (chart) {
                const newChartData = this.buildChartData(module, data);
                chart.data = newChartData;
                chart.update('none'); // No animation for auto-refresh
            }
            
            // Update freshness indicator
            this.updateDataFreshness(moduleId);
            
            this.dispatchEvent('scout-modules:module-refreshed', { moduleId, data });
            
        } catch (error) {
            console.error(`❌ Scout Modules: Auto-refresh failed for ${moduleId}:`, error);
            this.setModuleError(moduleId, error.message);
        }
    }
    
    bindEvents() {
        // Refresh buttons
        const refreshButtons = this.container.querySelectorAll('.scout-module__refresh');
        refreshButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                this.refreshModule(button.dataset.moduleId);
            });
        });
        
        // Export buttons
        const exportButtons = this.container.querySelectorAll('.scout-module__export');
        exportButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                this.exportModule(button.dataset.moduleId);
            });
        });
        
        // Drill down buttons
        const drilldownButtons = this.container.querySelectorAll('.scout-module__drilldown');
        drilldownButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                this.openDrillDown(button.dataset.moduleId);
            });
        });
        
        // Fullscreen buttons
        const fullscreenButtons = this.container.querySelectorAll('.scout-module__fullscreen');
        fullscreenButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                this.toggleFullscreen(button.dataset.moduleId);
            });
        });
        
        // Retry buttons
        const retryButtons = this.container.querySelectorAll('.scout-error-retry-btn, .scout-error-retry');
        retryButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                if (button.dataset.moduleId) {
                    this.retryModule(button.dataset.moduleId);
                } else {
                    this.retryAllModules();
                }
            });
        });
        
        // Global filter changes
        this.addEventListener(document, 'scout-filters:filter-changed', (e) => {
            this.handleFilterChange(e.detail);
        });
        
        this.addEventListener(document, 'scout-filters:all-cleared', () => {
            this.refreshAllModules();
        });
        
        // Window resize for responsive charts
        this.addEventListener(window, 'resize', this.debounce(() => {
            this.resizeAllCharts();
        }, 250));
        
        console.log('🔗 Scout Modules: Events bound successfully');
    }
    
    // Module State Management
    
    setModuleLoading(moduleId, loading) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        const loadingElement = moduleElement.querySelector('.scout-module__loading');
        const contentElement = moduleElement.querySelector('.scout-module__content');
        const errorElement = moduleElement.querySelector('.scout-module__error');
        
        if (loading) {
            this.loadingStates.add(moduleId);
            loadingElement.setAttribute('aria-hidden', 'false');
            contentElement.style.opacity = '0.5';
            errorElement.setAttribute('aria-hidden', 'true');
        } else {
            this.loadingStates.delete(moduleId);
            loadingElement.setAttribute('aria-hidden', 'true');
            contentElement.style.opacity = '1';
        }
        
        // Update global loading state
        const globalLoading = this.container.querySelector('.scout-modules__loading-overlay');
        globalLoading.setAttribute('aria-hidden', this.loadingStates.size === 0 ? 'true' : 'false');
    }
    
    setModuleError(moduleId, errorMessage) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        const errorElement = moduleElement.querySelector('.scout-module__error');
        const errorDetails = errorElement.querySelector('.scout-error-details p');
        const contentElement = moduleElement.querySelector('.scout-module__content');
        
        errorDetails.textContent = errorMessage;
        errorElement.setAttribute('aria-hidden', 'false');
        contentElement.style.display = 'none';
        
        this.errorStates.set(moduleId, errorMessage);
        
        this.announceToScreenReader(`Error in ${moduleId}: ${errorMessage}`);
    }
    
    clearModuleError(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        const errorElement = moduleElement.querySelector('.scout-module__error');
        const contentElement = moduleElement.querySelector('.scout-module__content');
        
        errorElement.setAttribute('aria-hidden', 'true');
        contentElement.style.display = 'block';
        
        this.errorStates.delete(moduleId);
    }
    
    updateDataFreshness(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        const freshnessElement = moduleElement.querySelector('.scout-freshness-time');
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        freshnessElement.textContent = timeString;
        freshnessElement.parentElement.title = `Last updated at ${timeString}`;
    }
    
    // Module Actions
    
    async retryModule(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module) return;
        
        this.clearModuleError(moduleId);
        
        try {
            await this.initializeModule(module);
        } catch (error) {
            this.setModuleError(moduleId, error.message);
        }
    }
    
    async retryAllModules() {
        const errorModules = Array.from(this.errorStates.keys());
        
        for (const moduleId of errorModules) {
            await this.retryModule(moduleId);
        }
    }
    
    async refreshAllModules() {
        for (const module of this.modules) {
            await this.refreshModule(module.id);
        }
    }
    
    exportModule(moduleId) {
        const chart = this.chartInstances.get(moduleId);
        const module = this.modules.find(m => m.id === moduleId);
        
        if (!chart || !module) return;
        
        // Create download link for chart image
        const link = document.createElement('a');
        link.download = `${module.id}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = chart.toBase64Image();
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.dispatchEvent('scout-modules:module-exported', { moduleId, format: 'png' });
    }
    
    openDrillDown(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (!module || !module.drillDown) return;
        
        // Implementation for drill-down modal or navigation
        this.dispatchEvent('scout-modules:drilldown-requested', { moduleId, module });
    }
    
    toggleFullscreen(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        if (moduleElement.classList.contains('scout-module--fullscreen')) {
            this.exitFullscreen(moduleId);
        } else {
            this.enterFullscreen(moduleId);
        }
    }
    
    enterFullscreen(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        moduleElement.classList.add('scout-module--fullscreen');
        
        // Resize chart after fullscreen transition
        setTimeout(() => {
            const chart = this.chartInstances.get(moduleId);
            if (chart) chart.resize();
        }, 300);
        
        this.dispatchEvent('scout-modules:fullscreen-entered', { moduleId });
    }
    
    exitFullscreen(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (!moduleElement) return;
        
        moduleElement.classList.remove('scout-module--fullscreen');
        
        // Resize chart after fullscreen exit
        setTimeout(() => {
            const chart = this.chartInstances.get(moduleId);
            if (chart) chart.resize();
        }, 300);
        
        this.dispatchEvent('scout-modules:fullscreen-exited', { moduleId });
    }
    
    handleChartClick(moduleId, element) {
        const chart = this.chartInstances.get(moduleId);
        const module = this.modules.find(m => m.id === moduleId);
        
        if (!chart || !module) return;
        
        const dataIndex = element.index;
        const datasetIndex = element.datasetIndex;
        
        const clickedData = {
            moduleId: moduleId,
            dataIndex: dataIndex,
            datasetIndex: datasetIndex,
            series: module.config.series[datasetIndex],
            value: chart.data.datasets[datasetIndex].data[dataIndex],
            label: chart.data.labels[dataIndex]
        };
        
        this.dispatchEvent('scout-modules:chart-clicked', clickedData);
        
        if (module.drillDown) {
            this.openDrillDown(moduleId);
        }
    }
    
    handleFilterChange(filterData) {
        // Debounce filter changes to avoid excessive API calls
        if (this.filterChangeTimeout) {
            clearTimeout(this.filterChangeTimeout);
        }
        
        this.filterChangeTimeout = setTimeout(() => {
            this.refreshAllModules();
        }, 500);
    }
    
    getCurrentFilters() {
        // Get filters from global scout-filters component
        const filtersComponent = document.querySelector('[data-component="scout-filters"]');
        if (filtersComponent && filtersComponent.ScoutFilters) {
            return filtersComponent.ScoutFilters.getActiveFilters();
        }
        return {};
    }
    
    resizeAllCharts() {
        this.chartInstances.forEach((chart, moduleId) => {
            try {
                chart.resize();
            } catch (error) {
                console.error(`Failed to resize chart ${moduleId}:`, error);
            }
        });
    }
    
    // Utility Methods
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Error Handling and Fallback
    
    handleFallback(error) {
        console.error('Scout Modules fallback activated:', error);
        
        this.container.innerHTML = `
            <div class="scout-modules scout-modules--fallback" role="main" aria-label="Dashboard Modules (Fallback Mode)">
                <div class="scout-modules__fallback-header">
                    <h2>Dashboard Modules (Limited Mode)</h2>
                </div>
                <div class="scout-modules__fallback-content">
                    <div class="scout-module-fallback">
                        <h3>Transaction Trends</h3>
                        <div class="scout-fallback-placeholder">
                            📊 Chart visualization unavailable
                        </div>
                    </div>
                    <div class="scout-module-fallback">
                        <h3>Product Mix & SKU Analysis</h3>
                        <div class="scout-fallback-placeholder">
                            📊 Chart visualization unavailable
                        </div>
                    </div>
                </div>
                <div class="scout-error-notice" role="alert">
                    ⚠️ Modules running in fallback mode. ${error.message}
                </div>
            </div>
        `;
        
        this.dispatchEvent('scout-modules:fallback-activated', { error });
    }
    
    // Performance and Analytics
    
    reportPerformanceMetrics() {
        const metrics = {
            totalLoadTime: this.performanceMetrics.renderEnd - this.performanceMetrics.loadStart,
            renderTime: this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart,
            moduleLoadTimes: Object.fromEntries(this.performanceMetrics.moduleLoadTimes),
            chartRenderTimes: Object.fromEntries(this.performanceMetrics.chartRenderTimes),
            apiCalls: this.performanceMetrics.apiCalls,
            modulesCount: this.modules.length,
            errorCount: this.errorStates.size,
            cacheHitRate: this.calculateCacheHitRate()
        };
        
        console.log('📊 Scout Modules Performance Metrics:', metrics);
        
        if (window.ANALYTICS_ENDPOINT) {
            fetch(window.ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'scout-modules-performance',
                    metrics: metrics
                })
            }).catch(err => console.error('Failed to report metrics:', err));
        }
    }
    
    calculateCacheHitRate() {
        const apiCalls = this.performanceMetrics.apiCalls;
        if (apiCalls.length === 0) return 0;
        
        const cacheHits = apiCalls.filter(call => call.cached).length;
        return (cacheHits / apiCalls.length) * 100;
    }
    
    reportDriftViolation(violations) {
        const driftReport = {
            timestamp: new Date().toISOString(),
            component: 'scout-modules',
            version: '2.5.0',
            violations: violations,
            configPath: this.configPath,
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            }
        };
        
        if (window.CI_DRIFT_ENDPOINT) {
            fetch(window.CI_DRIFT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driftReport)
            }).catch(err => console.error('Failed to report drift:', err));
        }
        
        console.error('🚨 DRIFT DETECTED - Scout Modules:', driftReport);
        localStorage.setItem('scout-modules-drift-report', JSON.stringify(driftReport));
    }
    
    // Event Management
    
    addEventListener(element, event, handler) {
        if (!element) return;
        
        element.addEventListener(event, handler);
        
        const key = `${element.tagName}-${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push({ element, event, handler });
    }
    
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        
        this.container.dispatchEvent(event);
        console.log(`📡 Scout Modules: Event dispatched - ${eventName}`, detail);
    }
    
    // Public API
    
    getModuleData(moduleId) {
        const cacheEntries = Array.from(this.apiCache.entries());
        const moduleCache = cacheEntries.find(([key]) => key.startsWith(`/api/${moduleId}`));
        return moduleCache ? moduleCache[1].data : null;
    }
    
    refreshModuleWithFilters(moduleId, filters) {
        const module = this.modules.find(m => m.id === moduleId);
        if (module) {
            return this.loadModuleData(module, filters)
                .then(data => {
                    const chart = this.chartInstances.get(moduleId);
                    if (chart) {
                        const newChartData = this.buildChartData(module, data);
                        chart.data = newChartData;
                        chart.update();
                    }
                    return data;
                });
        }
    }
    
    setModuleVisibility(moduleId, visible) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        if (moduleElement) {
            moduleElement.style.display = visible ? 'block' : 'none';
            
            if (visible) {
                // Resize chart when making visible
                setTimeout(() => {
                    const chart = this.chartInstances.get(moduleId);
                    if (chart) chart.resize();
                }, 100);
            }
        }
    }
    
    getModuleState(moduleId) {
        return {
            loading: this.loadingStates.has(moduleId),
            error: this.errorStates.get(moduleId) || null,
            hasChart: this.chartInstances.has(moduleId),
            lastRefresh: this.getLastRefreshTime(moduleId)
        };
    }
    
    getLastRefreshTime(moduleId) {
        const moduleElement = this.container.querySelector(`[data-module-id="${moduleId}"]`);
        const freshnessElement = moduleElement?.querySelector('.scout-freshness-time');
        return freshnessElement?.textContent || '--';
    }
    
    // Cleanup
    
    destroy() {
        // Clear intervals
        this.refreshIntervals.forEach(interval => clearInterval(interval));
        this.refreshIntervals.clear();
        
        // Destroy charts
        this.chartInstances.forEach(chart => {
            try {
                chart.destroy();
            } catch (error) {
                console.error('Error destroying chart:', error);
            }
        });
        this.chartInstances.clear();
        
        // Clear timeouts
        if (this.filterChangeTimeout) {
            clearTimeout(this.filterChangeTimeout);
        }
        
        // Remove event listeners
        this.eventListeners.forEach(listeners => {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('🧹 Scout Modules: Destroyed successfully');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoutDashboardModules;
}

// Global registration
if (typeof window !== 'undefined') {
    window.ScoutDashboardModules = ScoutDashboardModules;
}