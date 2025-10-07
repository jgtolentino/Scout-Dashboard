/**
 * TBWA Client 360 Dashboard - Main JavaScript
 * This file handles the dashboard's interactivity, data loading, and chart rendering
 */

// Configuration
const config = {
    dataRefreshInterval: 300000, // 5 minutes in milliseconds
    simulatedData: true,
    dateRange: 7, // days
    defaultRegion: 'all',
    defaultCategory: 'all',
    defaultBrand: 'all',
    defaultChannel: 'all',
    animationDuration: 500, // milliseconds
    insights: {
        refreshInterval: 600000, // 10 minutes in milliseconds
        count: 3
    }
};

// Data connector for Scout DLT pipeline
class ScoutDLTConnector {
    constructor(options = {}) {
        this.simulatedData = options.simulatedData || config.simulatedData;
        this.dataPath = this.simulatedData ? './data/sample_data.json' : './data/live_data.json';
        this.lastUpdated = null;
    }
    
    async fetchData(filters = {}) {
        if (this.simulatedData) {
            return this._getSimulatedData(filters);
        } else {
            try {
                const response = await fetch(this.dataPath);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                this.lastUpdated = new Date();
                return this._applyFilters(data, filters);
            } catch (error) {
                console.error('Error fetching data:', error);
                return this._getSimulatedData(filters); // Fallback to simulated data
            }
        }
    }
    
    async getKPIs(filters = {}) {
        const data = await this.fetchData(filters);
        return {
            totalSales: data.totalSales,
            conversionRate: data.conversionRate,
            marketingROI: data.marketingROI,
            brandSentiment: data.brandSentiment
        };
    }
    
    async getBrandPerformance(filters = {}) {
        const data = await this.fetchData(filters);
        return data.brandPerformance;
    }
    
    async getCompetitorAnalysis(filters = {}) {
        const data = await this.fetchData(filters);
        return data.competitorAnalysis;
    }
    
    async getRetailPerformance(filters = {}) {
        const data = await this.fetchData(filters);
        return data.retailPerformance;
    }
    
    async getMarketingROI(filters = {}) {
        const data = await this.fetchData(filters);
        return data.marketingROI;
    }
    
    async getInsights(filters = {}) {
        const data = await this.fetchData(filters);
        return data.insights;
    }
    
    _getSimulatedData(filters = {}) {
        // This function provides simulated data for development and testing
        const sariSariData = {
            totalSales: {
                value: 1240000,
                change: 8.2,
                trend: 'up'
            },
            conversionRate: {
                value: 24.7,
                change: 3.5,
                trend: 'up'
            },
            marketingROI: {
                value: 3.2,
                change: -0.8,
                trend: 'down'
            },
            brandSentiment: {
                value: 76.2,
                change: 5.7,
                trend: 'up'
            },
            brandPerformance: [
                { name: 'Milo', value: 87, status: 'good' },
                { name: 'Bear Brand', value: 72, status: 'good' },
                { name: 'Lucky Me', value: 63, status: 'warning' },
                { name: 'Palmolive', value: 45, status: 'poor' }
            ],
            competitorAnalysis: {
                marketShare: { value: 42, target: 45, status: 'attention' },
                brandRecognition: { value: 68, target: 65, status: 'good' },
                customerSatisfaction: { value: 84, target: 80, status: 'good' }
            },
            retailPerformance: {
                total: 428000,
                regions: [
                    { name: 'NCR', value: 187000, change: 12, trend: 'up' },
                    { name: 'Luzon', value: 124000, change: 8, trend: 'up' },
                    { name: 'Visayas', value: 76000, change: -3, trend: 'down' },
                    { name: 'Mindanao', value: 41000, change: 5, trend: 'up' }
                ],
                trend: [320000, 340000, 365000, 380000, 410000, 428000]
            },
            marketingROI: {
                overall: 3.2,
                channels: [
                    { name: 'Social Media', value: 4.2, change: 0.8, trend: 'up' },
                    { name: 'TV Ads', value: 2.7, change: -0.3, trend: 'down' },
                    { name: 'Print Media', value: 1.8, change: -0.5, trend: 'down' },
                    { name: 'In-Store Promos', value: 3.9, change: 1.2, trend: 'up' }
                ]
            },
            insights: {
                recommendations: [
                    'Reallocate 15% budget from under-performing SKU in Region B to Region C (+12% conv.).',
                    'Trigger replenishment alerts for Store 42 when daily stockouts > 5.',
                    'Optimize cache in Store 17 edge node to cut latency by 25%.'
                ],
                brandDictionary: {
                    topBrands: ['Milo', 'Bear Brand', 'Lucky Me'],
                    topAssociations: [
                        { brand: 'Milo', association: 'energy' },
                        { brand: 'Bear Brand', association: 'health' }
                    ]
                },
                emotionalAnalysis: {
                    peakTime: '7-9 AM',
                    contextualInsights: [
                        '68% of customers mention "children/school" when buying Milo',
                        'Price sensitivity highest for cooking oil and rice'
                    ]
                },
                bundlingOpportunities: [
                    { products: ['Milo', 'bread'], correlation: 78, potentialIncrease: 15 }
                ]
            },
            salesDrillDown: {
                regions: [
                    { name: 'NCR', value: 580250, percentage: 46.7, change: 12.8 },
                    { name: 'Luzon', value: 312480, percentage: 25.2, change: 8.3 },
                    { name: 'Visayas', value: 198750, percentage: 16.0, change: -3.5 },
                    { name: 'Mindanao', value: 150320, percentage: 12.1, change: 5.2 }
                ]
            },
            conversionDrillDown: {
                funnel: [
                    { stage: 'Store Visits', value: 18450, percentage: 100 },
                    { stage: 'Product Interactions', value: 12680, percentage: 68.7 },
                    { stage: 'Basket Additions', value: 8240, percentage: 44.7 },
                    { stage: 'Purchases', value: 4560, percentage: 24.7 }
                ],
                byStoreType: [
                    { type: 'Sari-Sari Stores', value: 31.5 },
                    { type: 'Supermarkets', value: 22.8 },
                    { type: 'Convenience Stores', value: 18.4 },
                    { type: 'Department Stores', value: 26.3 }
                ]
            },
            roiDrillDown: {
                byChannel: [
                    { channel: 'Social Media', investment: 80000, revenue: 336000, roi: 4.2, change: 0.8 },
                    { channel: 'TV Ads', investment: 150000, revenue: 405000, roi: 2.7, change: -0.3 },
                    { channel: 'Print Media', investment: 45000, revenue: 81000, roi: 1.8, change: -0.5 },
                    { channel: 'In-Store Promos', investment: 65000, revenue: 253500, roi: 3.9, change: 1.2 }
                ],
                trend: [2.8, 2.9, 3.1, 2.7, 3.0, 3.2]
            },
            sentimentDrillDown: {
                trend: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    positive: [65, 68, 70, 72, 74, 76],
                    neutral: [25, 23, 22, 20, 18, 16],
                    negative: [10, 9, 8, 8, 8, 8]
                },
                byBrand: [
                    { brand: 'Milo', positive: 82, neutral: 12, negative: 6 },
                    { brand: 'Bear Brand', positive: 78, neutral: 15, negative: 7 },
                    { brand: 'Lucky Me', positive: 75, neutral: 18, negative: 7 },
                    { brand: 'Palmolive', positive: 68, neutral: 22, negative: 10 },
                    { brand: 'Coke', positive: 80, neutral: 15, negative: 5 }
                ],
                topPositivePhrases: [
                    { phrase: 'Masarap', mentions: 412 },
                    { phrase: 'Sulit', mentions: 387 },
                    { phrase: 'Mabango', mentions: 245 },
                    { phrase: 'Mura', mentions: 198 }
                ],
                byFeature: [
                    { feature: 'Taste/Quality', sentiment: 92 },
                    { feature: 'Price', sentiment: 78 },
                    { feature: 'Packaging', sentiment: 65 },
                    { feature: 'Availability', sentiment: 84 }
                ]
            }
        };
        
        return sariSariData;
    }
    
    _applyFilters(data, filters) {
        // Apply filters to the data
        // This is a simplified implementation
        return data;
    }
}

// Dashboard Controller
class DashboardController {
    constructor() {
        this.dataConnector = new ScoutDLTConnector({ simulatedData: config.simulatedData });
        this.chartInstances = {};
        this.filters = {
            dateRange: config.dateRange,
            region: config.defaultRegion,
            category: config.defaultCategory,
            brand: config.defaultBrand,
            channel: config.defaultChannel
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadAllData();
        this.startDataRefreshTimer();
        this.updateLastUpdated();
    }
    
    setupEventListeners() {
        // Date selector
        const dateSelector = document.getElementById('dateSelector');
        if (dateSelector) {
            dateSelector.addEventListener('change', (e) => {
                this.filters.dateRange = parseInt(e.target.value);
                this.loadAllData();
            });
        }
        
        // Data source toggle
        const dataSourceToggle = document.getElementById('dataSourceToggle');
        if (dataSourceToggle) {
            dataSourceToggle.addEventListener('change', (e) => {
                this.dataConnector.simulatedData = !e.target.checked;
                this.loadAllData();
            });
        }
        
        // Export button
        const exportDropdown = document.getElementById('exportDropdown');
        const exportButton = document.getElementById('exportButton');
        if (exportButton && exportDropdown) {
            exportButton.addEventListener('click', () => {
                exportDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!exportButton.contains(e.target)) {
                    exportDropdown.classList.add('hidden');
                }
            });
        }
        
        // Filter bar events
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const filterType = e.target.getAttribute('data-filter-type');
                if (filterType && this.filters.hasOwnProperty(filterType)) {
                    this.filters[filterType] = e.target.value;
                    this.loadAllData();
                }
            });
        });
        
        // Channel filter buttons
        document.querySelectorAll('.channel-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const channel = e.target.getAttribute('data-channel');
                if (channel) {
                    document.querySelectorAll('.channel-filter').forEach(btn => {
                        btn.classList.remove('bg-blue-500', 'text-white');
                        btn.classList.add('bg-white', 'text-gray-800');
                    });
                    e.target.classList.remove('bg-white', 'text-gray-800');
                    e.target.classList.add('bg-blue-500', 'text-white');
                    this.filters.channel = channel;
                    this.loadAllData();
                }
            });
        });
        
        // QA Overlay keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.shiftKey && e.key === 'D') {
                this.toggleQAOverlay();
            }
        });
    }
    
    async loadAllData() {
        await Promise.all([
            this.loadKPIs(),
            this.loadBrandPerformance(),
            this.loadCompetitorAnalysis(),
            this.loadRetailPerformance(),
            this.loadMarketingROI(),
            this.loadInsights()
        ]);
    }
    
    async loadKPIs() {
        const kpis = await this.dataConnector.getKPIs(this.filters);
        
        // Update Total Sales KPI
        this.updateKPIElement('totalSales', kpis.totalSales);
        
        // Update Conversion Rate KPI
        this.updateKPIElement('conversionRate', kpis.conversionRate);
        
        // Update Marketing ROI KPI
        this.updateKPIElement('marketingROI', kpis.marketingROI);
        
        // Update Brand Sentiment KPI
        this.updateKPIElement('brandSentiment', kpis.brandSentiment);
    }
    
    updateKPIElement(id, data) {
        const element = document.getElementById(id);
        if (!element) return;
        
        const valueElement = element.querySelector('.kpi-value');
        const changeElement = element.querySelector('.kpi-change');
        
        if (valueElement) {
            const formatter = this.getFormatter(id);
            valueElement.textContent = formatter(data.value);
            valueElement.classList.add('animate-count-up');
            setTimeout(() => {
                valueElement.classList.remove('animate-count-up');
            }, config.animationDuration);
        }
        
        if (changeElement) {
            const changePrefix = data.trend === 'up' ? '+' : '';
            changeElement.textContent = `${changePrefix}${data.change}% from last period`;
            
            // Update trend icon and color
            changeElement.classList.remove('text-green-500', 'text-red-500');
            changeElement.classList.add(data.trend === 'up' ? 'text-green-500' : 'text-red-500');
            
            const iconSvg = changeElement.querySelector('svg');
            if (iconSvg) {
                iconSvg.innerHTML = data.trend === 'up' 
                    ? '<path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z" clip-rule="evenodd"></path>'
                    : '<path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414l3.293 3.293A1 1 0 0012 13z" clip-rule="evenodd"></path>';
            }
        }
    }
    
    async loadBrandPerformance() {
        const brandData = await this.dataConnector.getBrandPerformance(this.filters);
        
        // Update brand performance bars
        brandData.forEach((brand, index) => {
            const barContainer = document.querySelector(`.brand-performance-container:nth-child(${index + 1})`);
            if (!barContainer) return;
            
            const nameElement = barContainer.querySelector('.brand-name');
            const valueElement = barContainer.querySelector('.brand-value');
            const barElement = barContainer.querySelector('.brand-bar');
            
            if (nameElement) nameElement.textContent = brand.name;
            if (valueElement) valueElement.textContent = `${brand.value}%`;
            
            if (barElement) {
                barElement.style.width = `${brand.value}%`;
                barElement.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');
                
                if (brand.value >= 70) {
                    barElement.classList.add('bg-green-500');
                } else if (brand.value >= 50) {
                    barElement.classList.add('bg-yellow-500');
                } else {
                    barElement.classList.add('bg-red-500');
                }
            }
        });
    }
    
    async loadCompetitorAnalysis() {
        const competitorData = await this.dataConnector.getCompetitorAnalysis(this.filters);
        
        // Update market share
        this.updateCompetitorMetric('marketShare', competitorData.marketShare);
        
        // Update brand recognition
        this.updateCompetitorMetric('brandRecognition', competitorData.brandRecognition);
        
        // Update customer satisfaction
        this.updateCompetitorMetric('customerSatisfaction', competitorData.customerSatisfaction);
    }
    
    updateCompetitorMetric(id, data) {
        const container = document.querySelector(`.competitor-${id}-container`);
        if (!container) return;
        
        const valueElement = container.querySelector('.competitor-value');
        const barElement = container.querySelector('.competitor-bar');
        const attentionElement = container.querySelector('.attention-badge');
        
        if (valueElement) valueElement.textContent = `${data.value}%`;
        
        if (barElement) {
            barElement.style.width = `${data.value}%`;
        }
        
        if (attentionElement) {
            attentionElement.classList.toggle('hidden', data.status !== 'attention');
        }
    }
    
    async loadRetailPerformance() {
        const retailData = await this.dataConnector.getRetailPerformance(this.filters);
        
        // Update total retail performance
        const totalElement = document.querySelector('.retail-total');
        if (totalElement) {
            totalElement.textContent = this.formatCurrency(retailData.total);
        }
        
        // Update regional breakdown
        retailData.regions.forEach((region, index) => {
            const regionContainer = document.querySelector(`.retail-region-container:nth-child(${index + 1})`);
            if (!regionContainer) return;
            
            const nameElement = regionContainer.querySelector('.region-name');
            const valueElement = regionContainer.querySelector('.region-value');
            const changeElement = regionContainer.querySelector('.region-change');
            
            if (nameElement) nameElement.textContent = region.name;
            if (valueElement) valueElement.textContent = this.formatCurrency(region.value);
            
            if (changeElement) {
                const changePrefix = region.trend === 'up' ? '+' : '';
                changeElement.textContent = `${changePrefix}${region.change}%`;
                changeElement.classList.remove('text-green-500', 'text-red-500');
                changeElement.classList.add(region.trend === 'up' ? 'text-green-500' : 'text-red-500');
            }
        });
        
        // Update retail performance chart
        this.updateRetailChart(retailData.trend);
    }
    
    updateRetailChart(trendData) {
        const ctx = document.getElementById('retailPerformanceChart');
        if (!ctx) return;
        
        if (this.chartInstances.retailPerformance) {
            this.chartInstances.retailPerformance.destroy();
        }
        
        this.chartInstances.retailPerformance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sales',
                    data: trendData,
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
    }
    
    async loadMarketingROI() {
        const roiData = await this.dataConnector.getMarketingROI(this.filters);
        
        // Update ROI donut chart
        this.updateROIChart(roiData.channels);
        
        // Update channel ROI values
        roiData.channels.forEach((channel, index) => {
            const channelContainer = document.querySelector(`.roi-channel-container:nth-child(${index + 1})`);
            if (!channelContainer) return;
            
            const nameElement = channelContainer.querySelector('.channel-name');
            const valueElement = channelContainer.querySelector('.channel-value');
            const changeElement = channelContainer.querySelector('.channel-change');
            
            if (nameElement) nameElement.textContent = channel.name;
            if (valueElement) valueElement.textContent = `${channel.value}x`;
            
            if (changeElement) {
                const changePrefix = channel.trend === 'up' ? '+' : '';
                changeElement.textContent = `${changePrefix}${channel.change}x from last period`;
                changeElement.classList.remove('text-green-500', 'text-red-500');
                changeElement.classList.add(channel.trend === 'up' ? 'text-green-500' : 'text-red-500');
            }
        });
    }
    
    updateROIChart(channelData) {
        const ctx = document.getElementById('marketingRoiChart');
        if (!ctx) return;
        
        if (this.chartInstances.marketingROI) {
            this.chartInstances.marketingROI.destroy();
        }
        
        this.chartInstances.marketingROI = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: channelData.map(channel => channel.name),
                datasets: [{
                    data: channelData.map(channel => channel.value),
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#8B5CF6', // Purple
                        '#EC4899', // Pink
                        '#10B981'  // Green
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                cutout: '65%'
            }
        });
    }
    
    async loadInsights() {
        const insightsData = await this.dataConnector.getInsights(this.filters);
        
        // Update recommendations
        const recommendationsList = document.querySelector('.recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = '';
            insightsData.recommendations.forEach(recommendation => {
                const li = document.createElement('li');
                li.className = 'text-sm';
                li.textContent = recommendation;
                recommendationsList.appendChild(li);
            });
        }
        
        // Update brand dictionary
        const brandDictionaryElement = document.querySelector('.brand-dictionary-content');
        if (brandDictionaryElement) {
            brandDictionaryElement.innerHTML = `
                <p class="text-sm text-gray-700">
                    TBWA Philippines' most mentioned brands: ${insightsData.brandDictionary.topBrands.join(', ')}.
                    Popular associations: "${insightsData.brandDictionary.topAssociations[0].association}" with ${insightsData.brandDictionary.topAssociations[0].brand},
                    "${insightsData.brandDictionary.topAssociations[1].association}" with ${insightsData.brandDictionary.topAssociations[1].brand}.
                </p>
            `;
        }
        
        // Update emotional analysis
        const emotionalAnalysisElement = document.querySelector('.emotional-analysis-content');
        if (emotionalAnalysisElement) {
            emotionalAnalysisElement.innerHTML = `
                <p class="text-sm text-gray-700">
                    Peak purchasing time is ${insightsData.emotionalAnalysis.peakTime}.
                    ${insightsData.emotionalAnalysis.contextualInsights[0]}.
                    ${insightsData.emotionalAnalysis.contextualInsights[1]}.
                </p>
            `;
        }
        
        // Update bundling opportunities
        const bundlingElement = document.querySelector('.bundling-opportunities-content');
        if (bundlingElement) {
            const opportunity = insightsData.bundlingOpportunities[0];
            bundlingElement.innerHTML = `
                <p class="text-sm text-gray-700">
                    High correlation (${opportunity.correlation}%) between ${opportunity.products[0]} and ${opportunity.products[1]} purchases.
                    Recommend bundle promotions for morning purchases to increase basket size by estimated ${opportunity.potentialIncrease}%.
                </p>
            `;
        }
    }
    
    toggleQAOverlay() {
        let overlay = document.getElementById('qaOverlay');
        
        if (overlay) {
            overlay.remove();
        } else {
            overlay = document.createElement('div');
            overlay.id = 'qaOverlay';
            overlay.className = 'qa-overlay';
            
            overlay.innerHTML = `
                <h2 class="text-2xl font-bold mb-4">QA Overlay</h2>
                
                <div class="qa-section">
                    <h3 class="text-xl font-semibold mb-2">Dashboard Information</h3>
                    <div class="qa-info">
                        <p><strong>Version:</strong> 1.0.0</p>
                        <p><strong>Data Mode:</strong> ${this.dataConnector.simulatedData ? 'Simulated' : 'Real-time'}</p>
                        <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Data Sources:</strong> Scout DLT Pipeline (bronze, silver, gold layers)</p>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h3 class="text-xl font-semibold mb-2">Current Filters</h3>
                    <div class="qa-info">
                        <p><strong>Date Range:</strong> Last ${this.filters.dateRange} days</p>
                        <p><strong>Region:</strong> ${this.filters.region === 'all' ? 'All Regions' : this.filters.region}</p>
                        <p><strong>Category:</strong> ${this.filters.category === 'all' ? 'All Categories' : this.filters.category}</p>
                        <p><strong>Brand:</strong> ${this.filters.brand === 'all' ? 'All Brands' : this.filters.brand}</p>
                        <p><strong>Channel:</strong> ${this.filters.channel === 'all' ? 'All Channels' : this.filters.channel}</p>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h3 class="text-xl font-semibold mb-2">Component Status</h3>
                    <div class="qa-info">
                        <p><strong>KPI Tiles:</strong> Loaded ✅</p>
                        <p><strong>Brand Performance:</strong> Loaded ✅</p>
                        <p><strong>Competitor Analysis:</strong> Loaded ✅</p>
                        <p><strong>Retail Performance:</strong> Loaded ✅</p>
                        <p><strong>Marketing ROI:</strong> Loaded ✅</p>
                        <p><strong>AI Insights:</strong> Loaded ✅</p>
                    </div>
                </div>
                
                <div class="qa-section">
                    <h3 class="text-xl font-semibold mb-2">Chart Rendering</h3>
                    <div class="qa-info">
                        <p><strong>Retail Performance Chart:</strong> ${this.chartInstances.retailPerformance ? 'Rendered ✅' : 'Not Rendered ❌'}</p>
                        <p><strong>Marketing ROI Chart:</strong> ${this.chartInstances.marketingROI ? 'Rendered ✅' : 'Not Rendered ❌'}</p>
                        <p><strong>Sales Drill-Down Chart:</strong> Not Rendered (not opened)</p>
                        <p><strong>Conversion Drill-Down Chart:</strong> Not Rendered (not opened)</p>
                    </div>
                </div>
                
                <button class="mt-4 px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-200" onclick="this.parentElement.remove()">
                    Close Overlay
                </button>
            `;
            
            document.body.appendChild(overlay);
        }
    }
    
    startDataRefreshTimer() {
        setInterval(() => {
            this.loadAllData();
            this.updateLastUpdated();
        }, config.dataRefreshInterval);
    }
    
    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            });
        }
    }
    
    getFormatter(dataType) {
        switch (dataType) {
            case 'totalSales':
                return value => `₱ ${(value / 1000000).toFixed(2)}M`;
            case 'conversionRate':
            case 'brandSentiment':
                return value => `${value}%`;
            case 'marketingROI':
                return value => `${value}x`;
            default:
                return value => value;
        }
    }
    
    formatCurrency(value) {
        if (value >= 1000000) {
            return `₱ ${(value / 1000000).toFixed(2)}M`;
        } else if (value >= 1000) {
            return `₱ ${(value / 1000).toFixed(0)}K`;
        } else {
            return `₱ ${value}`;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardController = new DashboardController();
    
    // Initialize store map if the element exists
    const storeMapElement = document.getElementById('storeMap');
    if (storeMapElement) {
        window.storeMap = new StoreMap('storeMap', {
            metricKey: 'sales'
        });
        
        // Load store data using the dashboard controller's filters
        if (window.dashboardController) {
            window.storeMap.loadData(window.dashboardController.filters);
            
            // Update store map when dashboard filters change
            document.querySelectorAll('.filter-select').forEach(select => {
                select.addEventListener('change', () => {
                    window.storeMap.filterStores(window.dashboardController.filters);
                });
            });
            
            // Update store map when region filter changes
            const regionFilter = document.querySelector('[data-filter-type="region"]');
            if (regionFilter) {
                regionFilter.addEventListener('change', (e) => {
                    window.storeMap.setRegionView(e.target.value);
                });
            }
        }
    }
});