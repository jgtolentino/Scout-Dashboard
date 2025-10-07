/**
 * Scout DLT Pipeline - Transaction Metrics Component
 * 
 * This component displays Sari-Sari store transaction metrics including:
 * - Transaction duration
 * - Product count
 * - Basket value
 * - Completion rate
 * - Dwell time
 * 
 * It also includes visualizations for:
 * - Product substitutions
 * - Request patterns
 * - Unbranded items tracking
 * - Customer expressions
 */

class TransactionMetricsComponent {
    constructor(elementId, apiClient) {
        this.element = document.getElementById(elementId);
        this.apiClient = apiClient;
        this.filterParams = {};
        this.charts = {};
        
        if (!this.element) {
            console.error(`Element with ID ${elementId} not found`);
            return;
        }
        
        this.initialize();
    }
    
    /**
     * Initialize the component structure
     */
    initialize() {
        // Create component structure
        this.element.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Sari-Sari Transaction Metrics</h3>
                    <div class="flex space-x-2">
                        <button id="refreshTransactionBtn" class="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                            <svg class="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Transaction Metrics KPIs -->
                <div class="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6" id="transactionKpis">
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Avg Duration</h4>
                        <p class="text-xl font-bold text-gray-800" id="avgDuration">--</p>
                        <p class="text-xs text-gray-600">seconds</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Avg Products</h4>
                        <p class="text-xl font-bold text-gray-800" id="avgProducts">--</p>
                        <p class="text-xs text-gray-600">per transaction</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Avg Basket</h4>
                        <p class="text-xl font-bold text-gray-800" id="avgBasket">--</p>
                        <p class="text-xs text-gray-600">PHP</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Completion</h4>
                        <p class="text-xl font-bold text-gray-800" id="completionRate">--</p>
                        <p class="text-xs text-gray-600">rate</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Dwell Time</h4>
                        <p class="text-xl font-bold text-gray-800" id="dwellTime">--</p>
                        <p class="text-xs text-gray-600">seconds</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded shadow-sm">
                        <h4 class="text-xs text-gray-500 uppercase">Transactions</h4>
                        <p class="text-xl font-bold text-gray-800" id="totalTransactions">--</p>
                        <p class="text-xs text-gray-600">total</p>
                    </div>
                </div>
                
                <!-- Tabs for detailed metrics -->
                <div class="border-b border-gray-200">
                    <nav class="flex -mb-px">
                        <button class="tab-button text-blue-600 border-b-2 border-blue-500 py-2 px-4 font-medium text-sm" 
                                data-target="substitutionsTab">Product Substitutions</button>
                        <button class="tab-button text-gray-500 hover:text-gray-700 py-2 px-4 font-medium text-sm" 
                                data-target="requestPatternsTab">Request Patterns</button>
                        <button class="tab-button text-gray-500 hover:text-gray-700 py-2 px-4 font-medium text-sm" 
                                data-target="unbrandedItemsTab">Unbranded Items</button>
                        <button class="tab-button text-gray-500 hover:text-gray-700 py-2 px-4 font-medium text-sm" 
                                data-target="customerExpressionsTab">Customer Expressions</button>
                    </nav>
                </div>
                
                <!-- Tab content -->
                <div class="mt-4">
                    <!-- Product Substitutions Tab -->
                    <div id="substitutionsTab" class="tab-content">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="substitutionsChart"></div>
                            </div>
                            <div class="w-full md:w-1/2 overflow-auto">
                                <table class="min-w-full divide-y divide-gray-200" id="substitutionsTable">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substitution</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reasons</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr><td colspan="4" class="text-center py-4">Loading data...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Request Patterns Tab -->
                    <div id="requestPatternsTab" class="tab-content hidden">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="requestPatternsChart"></div>
                            </div>
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="requestPatternsDayChart"></div>
                            </div>
                        </div>
                        <div class="mt-4 overflow-auto">
                            <table class="min-w-full divide-y divide-gray-200" id="requestPatternsTable">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr><td colspan="5" class="text-center py-4">Loading data...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Unbranded Items Tab -->
                    <div id="unbrandedItemsTab" class="tab-content hidden">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="unbrandedItemsChart"></div>
                            </div>
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="unbrandedCategoriesChart"></div>
                            </div>
                        </div>
                        <div class="mt-4 overflow-auto">
                            <table class="min-w-full divide-y divide-gray-200" id="unbrandedItemsTable">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occurrences</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr><td colspan="5" class="text-center py-4">Loading data...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Customer Expressions Tab -->
                    <div id="customerExpressionsTab" class="tab-content hidden">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="w-full md:w-1/2">
                                <div class="h-80" id="customerExpressionsChart"></div>
                            </div>
                            <div class="w-full md:w-1/2">
                                <div class="bg-gray-50 p-6 rounded">
                                    <h4 class="font-medium text-gray-700 mb-3">Expression Insights</h4>
                                    <ul class="space-y-3" id="expressionInsights">
                                        <li class="text-gray-600 text-sm">Loading insights...</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize tab switching
        this.initializeTabs();
        
        // Set up event listeners
        document.getElementById('refreshTransactionBtn').addEventListener('click', () => {
            this.loadData();
        });
        
        // Initial data load
        this.loadData();
    }
    
    /**
     * Initialize tab functionality
     */
    initializeTabs() {
        const tabButtons = this.element.querySelectorAll('.tab-button');
        const tabContents = this.element.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active styles from all buttons
                tabButtons.forEach(btn => {
                    btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-500');
                    btn.classList.add('text-gray-500', 'hover:text-gray-700');
                });
                
                // Add active styles to clicked button
                button.classList.remove('text-gray-500', 'hover:text-gray-700');
                button.classList.add('text-blue-600', 'border-b-2', 'border-blue-500');
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                
                // Show the target tab content
                const targetId = button.getAttribute('data-target');
                document.getElementById(targetId).classList.remove('hidden');
                
                // Initialize charts for the newly shown tab if needed
                this.initializeTabCharts(targetId);
            });
        });
    }
    
    /**
     * Initialize charts for a specific tab
     * @param {string} tabId - The ID of the tab element
     */
    initializeTabCharts(tabId) {
        switch (tabId) {
            case 'substitutionsTab':
                if (!this.charts.substitutions && this.substitutionsData) {
                    this.renderSubstitutionsChart();
                }
                break;
            case 'requestPatternsTab':
                if (!this.charts.requestPatterns && this.requestPatternsData) {
                    this.renderRequestPatternsCharts();
                }
                break;
            case 'unbrandedItemsTab':
                if (!this.charts.unbrandedItems && this.unbrandedItemsData) {
                    this.renderUnbrandedItemsCharts();
                }
                break;
            case 'customerExpressionsTab':
                if (!this.charts.customerExpressions && this.customerExpressionsData) {
                    this.renderCustomerExpressionsChart();
                }
                break;
        }
    }
    
    /**
     * Set filter parameters for data fetching
     * @param {Object} params - Filter parameters
     */
    setFilters(params) {
        this.filterParams = params || {};
        this.loadData();
    }
    
    /**
     * Load all data needed for the component
     */
    loadData() {
        // Start loading indicators
        this.showLoading();
        
        // Default parameters
        const defaultParams = {
            lookback: 30,  // 30 days by default
            region: 'all',
            category: 'all',
            brand: 'all',
            channel: 'all'
        };
        
        // Merge with any provided filters
        const params = { ...defaultParams, ...this.filterParams };
        
        // Use Promise.all to fetch all data in parallel
        Promise.all([
            this.apiClient.fetchData('getTransactionMetrics', params),
            this.apiClient.fetchData('getProductSubstitutions', params),
            this.apiClient.fetchData('getRequestPatterns', params),
            this.apiClient.fetchData('getUnbrandedItems', params),
            this.apiClient.fetchData('getCustomerExpressions', params)
        ]).then(([
            transactionMetrics,
            productSubstitutions,
            requestPatterns,
            unbrandedItems,
            customerExpressions
        ]) => {
            // Store data
            this.transactionMetricsData = transactionMetrics;
            this.substitutionsData = productSubstitutions;
            this.requestPatternsData = requestPatterns;
            this.unbrandedItemsData = unbrandedItems;
            this.customerExpressionsData = customerExpressions;
            
            // Render data
            this.renderTransactionMetrics();
            this.renderSubstitutionsTable();
            this.renderRequestPatternsTable();
            this.renderUnbrandedItemsTable();
            this.renderExpressionInsights();
            
            // Initialize charts for the active tab
            const activeTab = this.element.querySelector('.tab-content:not(.hidden)').id;
            this.initializeTabCharts(activeTab);
            
        }).catch(error => {
            console.error('Error fetching transaction metrics data:', error);
            this.showError();
        });
    }
    
    /**
     * Show loading indicators
     */
    showLoading() {
        // Transaction KPIs loading state
        document.getElementById('avgDuration').textContent = '--';
        document.getElementById('avgProducts').textContent = '--';
        document.getElementById('avgBasket').textContent = '--';
        document.getElementById('completionRate').textContent = '--';
        document.getElementById('dwellTime').textContent = '--';
        document.getElementById('totalTransactions').textContent = '--';
        
        // Tables loading state
        const loadingRow = '<tr><td colspan="5" class="text-center py-4">Loading data...</td></tr>';
        document.querySelector('#substitutionsTable tbody').innerHTML = loadingRow;
        document.querySelector('#requestPatternsTable tbody').innerHTML = loadingRow;
        document.querySelector('#unbrandedItemsTable tbody').innerHTML = loadingRow;
        
        // Expression insights loading
        document.getElementById('expressionInsights').innerHTML = '<li class="text-gray-600 text-sm">Loading insights...</li>';
    }
    
    /**
     * Show error state
     */
    showError() {
        // Transaction KPIs error state
        document.getElementById('avgDuration').textContent = 'Error';
        document.getElementById('avgProducts').textContent = 'Error';
        document.getElementById('avgBasket').textContent = 'Error';
        document.getElementById('completionRate').textContent = 'Error';
        document.getElementById('dwellTime').textContent = 'Error';
        document.getElementById('totalTransactions').textContent = 'Error';
        
        // Tables error state
        const errorRow = '<tr><td colspan="5" class="text-center py-4 text-red-500">Failed to load data</td></tr>';
        document.querySelector('#substitutionsTable tbody').innerHTML = errorRow;
        document.querySelector('#requestPatternsTable tbody').innerHTML = errorRow;
        document.querySelector('#unbrandedItemsTable tbody').innerHTML = errorRow;
        
        // Expression insights error
        document.getElementById('expressionInsights').innerHTML = 
            '<li class="text-red-500 text-sm">Failed to load customer expression insights</li>';
    }
    
    /**
     * Render transaction metrics KPIs
     */
    renderTransactionMetrics() {
        if (!this.transactionMetricsData || this.transactionMetricsData.length === 0) {
            return;
        }
        
        const data = this.transactionMetricsData[0];
        
        // Update KPI values
        document.getElementById('avgDuration').textContent = Math.round(data.avg_transaction_duration || 0);
        document.getElementById('avgProducts').textContent = (data.avg_product_count || 0).toFixed(1);
        document.getElementById('avgBasket').textContent = (data.avg_basket_value || 0).toFixed(0);
        document.getElementById('completionRate').textContent = (data.completion_rate || 0).toFixed(1) + '%';
        document.getElementById('dwellTime').textContent = Math.round(data.avg_dwell_time || 0);
        document.getElementById('totalTransactions').textContent = (data.total_transactions || 0).toLocaleString();
    }
    
    /**
     * Render substitutions table
     */
    renderSubstitutionsTable() {
        if (!this.substitutionsData || this.substitutionsData.length === 0) {
            document.querySelector('#substitutionsTable tbody').innerHTML = 
                '<tr><td colspan="4" class="text-center py-4">No substitution data available</td></tr>';
            return;
        }
        
        let tableHtml = '';
        this.substitutionsData.forEach(sub => {
            tableHtml += `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${sub.original_product}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${sub.substitution_product}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${sub.substitution_count}</td>
                    <td class="px-3 py-2 text-sm text-gray-800">${sub.common_reasons || 'N/A'}</td>
                </tr>
            `;
        });
        
        document.querySelector('#substitutionsTable tbody').innerHTML = tableHtml;
    }
    
    /**
     * Render request patterns table
     */
    renderRequestPatternsTable() {
        if (!this.requestPatternsData || this.requestPatternsData.length === 0) {
            document.querySelector('#requestPatternsTable tbody').innerHTML = 
                '<tr><td colspan="5" class="text-center py-4">No request pattern data available</td></tr>';
            return;
        }
        
        let tableHtml = '';
        this.requestPatternsData.forEach(pattern => {
            tableHtml += `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${pattern.RequestCategory}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${pattern.RequestType}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${pattern.request_count}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${parseFloat(pattern.avg_frequency).toFixed(1)}</td>
                    <td class="px-3 py-2 text-sm text-gray-800">${pattern.regions || 'All'}</td>
                </tr>
            `;
        });
        
        document.querySelector('#requestPatternsTable tbody').innerHTML = tableHtml;
    }
    
    /**
     * Render unbranded items table
     */
    renderUnbrandedItemsTable() {
        if (!this.unbrandedItemsData || this.unbrandedItemsData.length === 0) {
            document.querySelector('#unbrandedItemsTable tbody').innerHTML = 
                '<tr><td colspan="5" class="text-center py-4">No unbranded item data available</td></tr>';
            return;
        }
        
        let tableHtml = '';
        this.unbrandedItemsData.forEach(item => {
            tableHtml += `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${item.ItemDescription}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${item.CategoryAssociation || 'Uncategorized'}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${item.occurrence_count}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${item.total_quantity}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-800">${(item.avg_confidence * 100).toFixed(1)}%</td>
                </tr>
            `;
        });
        
        document.querySelector('#unbrandedItemsTable tbody').innerHTML = tableHtml;
    }
    
    /**
     * Render customer expression insights
     */
    renderExpressionInsights() {
        if (!this.customerExpressionsData || this.customerExpressionsData.length === 0) {
            document.getElementById('expressionInsights').innerHTML = 
                '<li class="text-gray-600 text-sm">No customer expression data available</li>';
            return;
        }
        
        // Generate insights based on expressions
        const insights = this.generateExpressionInsights(this.customerExpressionsData);
        
        let insightsHtml = '';
        insights.forEach(insight => {
            insightsHtml += `
                <li class="text-gray-700 text-sm">
                    <span class="font-medium">${insight.title}:</span> ${insight.description}
                </li>
            `;
        });
        
        document.getElementById('expressionInsights').innerHTML = insightsHtml;
    }
    
    /**
     * Generate insights from customer expressions data
     * @param {Array} expressionsData - Customer expressions data
     * @returns {Array} Generated insights
     */
    generateExpressionInsights(expressionsData) {
        const insights = [];
        
        // Check for dominant expression
        const totalExpressions = expressionsData.reduce((sum, exp) => sum + parseInt(exp.expression_count), 0);
        const dominantExpression = expressionsData[0]; // Assuming data is sorted by count
        
        if (dominantExpression) {
            const dominantPercentage = parseFloat(dominantExpression.percentage).toFixed(1);
            
            insights.push({
                title: "Dominant Expression",
                description: `"${dominantExpression.expression}" represents ${dominantPercentage}% of all customer expressions`
            });
        }
        
        // Check for negative emotions
        const negativeEmotions = expressionsData.filter(exp => 
            ['angry', 'disappointed', 'confused'].includes(exp.expression)
        );
        
        if (negativeEmotions.length > 0) {
            const totalNegative = negativeEmotions.reduce((sum, exp) => sum + parseInt(exp.expression_count), 0);
            const negativePercentage = ((totalNegative / totalExpressions) * 100).toFixed(1);
            
            insights.push({
                title: "Customer Sentiment",
                description: `${negativePercentage}% of expressions indicate negative emotions. Consider service improvements.`
            });
        } else {
            insights.push({
                title: "Customer Sentiment",
                description: "Positive expressions dominate customer interactions. Keep up the good service!"
            });
        }
        
        // Check for confusion
        const confusedExpression = expressionsData.find(exp => exp.expression === 'confused');
        if (confusedExpression && parseFloat(confusedExpression.percentage) > 10) {
            insights.push({
                title: "Customer Confusion",
                description: `${parseFloat(confusedExpression.percentage).toFixed(1)}% of expressions indicate confusion. Consider improving product information and signage.`
            });
        }
        
        // Check for happiness
        const happyExpression = expressionsData.find(exp => exp.expression === 'happy');
        if (happyExpression) {
            insights.push({
                title: "Customer Satisfaction",
                description: `${parseFloat(happyExpression.percentage).toFixed(1)}% of expressions indicate happiness with their shopping experience.`
            });
        }
        
        return insights;
    }
    
    /**
     * Render substitutions chart
     */
    renderSubstitutionsChart() {
        if (!this.substitutionsData || this.substitutionsData.length === 0) {
            return;
        }
        
        // Format data for chart
        const chartData = this.substitutionsData.slice(0, 5).map(sub => ({
            name: `${sub.original_product} → ${sub.substitution_product}`,
            value: sub.substitution_count
        }));
        
        // Create chart with ApexCharts
        this.charts.substitutions = new ApexCharts(document.getElementById('substitutionsChart'), {
            series: [{
                name: 'Substitutions',
                data: chartData.map(item => item.value)
            }],
            chart: {
                type: 'bar',
                height: 320,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '60%',
                    borderRadius: 4
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: chartData.map(item => item.name),
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            colors: ['#3b82f6'],
            title: {
                text: 'Top Product Substitutions',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} substitutions`
                }
            }
        });
        
        this.charts.substitutions.render();
    }
    
    /**
     * Render request patterns charts
     */
    renderRequestPatternsCharts() {
        if (!this.requestPatternsData || this.requestPatternsData.length === 0) {
            return;
        }
        
        // Format data for category chart
        const categoryData = {};
        this.requestPatternsData.forEach(pattern => {
            const category = pattern.RequestCategory;
            if (categoryData[category]) {
                categoryData[category] += pattern.request_count;
            } else {
                categoryData[category] = pattern.request_count;
            }
        });
        
        const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
        
        // Create category chart
        this.charts.requestPatterns = new ApexCharts(document.getElementById('requestPatternsChart'), {
            series: categoryChartData.map(item => item.value),
            chart: {
                type: 'pie',
                height: 320,
                toolbar: {
                    show: false
                }
            },
            labels: categoryChartData.map(item => item.name),
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
            title: {
                text: 'Request Categories',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            },
            legend: {
                position: 'bottom',
                fontSize: '12px'
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} requests`
                }
            }
        });
        
        this.charts.requestPatterns.render();
        
        // Format data for day distribution chart
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Aggregate day distribution by categories
        const dayDistributions = {};
        this.requestPatternsData.forEach(pattern => {
            const category = pattern.RequestCategory;
            if (!dayDistributions[category]) {
                dayDistributions[category] = pattern.day_distribution || [0, 0, 0, 0, 0, 0, 0];
            } else {
                // Sum with existing distribution
                const existingDist = dayDistributions[category];
                const newDist = pattern.day_distribution || [0, 0, 0, 0, 0, 0, 0];
                dayDistributions[category] = existingDist.map((val, idx) => val + newDist[idx]);
            }
        });
        
        // Convert to series format
        const dayChartSeries = Object.entries(dayDistributions).map(([name, data]) => ({
            name,
            data
        }));
        
        // Create day distribution chart
        this.charts.requestPatternsDays = new ApexCharts(document.getElementById('requestPatternsDayChart'), {
            series: dayChartSeries,
            chart: {
                type: 'bar',
                height: 320,
                stacked: true,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 2
                }
            },
            xaxis: {
                categories: dayNames,
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Request Count'
                }
            },
            legend: {
                position: 'bottom',
                fontSize: '12px'
            },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
            title: {
                text: 'Requests by Day of Week',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            }
        });
        
        this.charts.requestPatternsDays.render();
    }
    
    /**
     * Render unbranded items charts
     */
    renderUnbrandedItemsCharts() {
        if (!this.unbrandedItemsData || this.unbrandedItemsData.length === 0) {
            return;
        }
        
        // Format data for items chart
        const itemsChartData = this.unbrandedItemsData.slice(0, 7).map(item => ({
            name: item.ItemDescription,
            value: item.occurrence_count
        }));
        
        // Create items chart
        this.charts.unbrandedItems = new ApexCharts(document.getElementById('unbrandedItemsChart'), {
            series: [{
                name: 'Occurrences',
                data: itemsChartData.map(item => item.value)
            }],
            chart: {
                type: 'bar',
                height: 320,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: true,
                    barHeight: '60%'
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: itemsChartData.map(item => item.name),
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            colors: ['#10b981'],
            title: {
                text: 'Top Unbranded Items',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} occurrences`
                }
            }
        });
        
        this.charts.unbrandedItems.render();
        
        // Format data for categories chart
        const categoryData = {};
        this.unbrandedItemsData.forEach(item => {
            const category = item.CategoryAssociation || 'Uncategorized';
            if (categoryData[category]) {
                categoryData[category] += item.occurrence_count;
            } else {
                categoryData[category] = item.occurrence_count;
            }
        });
        
        const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
        
        // Create categories chart
        this.charts.unbrandedCategories = new ApexCharts(document.getElementById('unbrandedCategoriesChart'), {
            series: categoryChartData.map(item => item.value),
            chart: {
                type: 'donut',
                height: 320,
                toolbar: {
                    show: false
                }
            },
            labels: categoryChartData.map(item => item.name),
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
            title: {
                text: 'Unbranded Items by Category',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            },
            legend: {
                position: 'bottom',
                fontSize: '12px'
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value} occurrences`
                }
            }
        });
        
        this.charts.unbrandedCategories.render();
    }
    
    /**
     * Render customer expressions chart
     */
    renderCustomerExpressionsChart() {
        if (!this.customerExpressionsData || this.customerExpressionsData.length === 0) {
            return;
        }
        
        // Format data for chart
        const chartData = this.customerExpressionsData.map(exp => ({
            name: exp.expression,
            value: parseFloat(exp.percentage)
        }));
        
        // Create chart
        this.charts.customerExpressions = new ApexCharts(document.getElementById('customerExpressionsChart'), {
            series: chartData.map(item => item.value),
            chart: {
                type: 'donut',
                height: 320,
                toolbar: {
                    show: false
                }
            },
            labels: chartData.map(item => item.name),
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
            title: {
                text: 'Customer Expressions',
                align: 'left',
                style: {
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                }
            },
            legend: {
                position: 'bottom',
                fontSize: '12px'
            },
            tooltip: {
                y: {
                    formatter: (value) => `${value.toFixed(1)}%`
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Total Expressions',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#1f2937'
                            }
                        }
                    }
                }
            }
        });
        
        this.charts.customerExpressions.render();
    }
}

// Export the component
window.TransactionMetricsComponent = TransactionMetricsComponent;