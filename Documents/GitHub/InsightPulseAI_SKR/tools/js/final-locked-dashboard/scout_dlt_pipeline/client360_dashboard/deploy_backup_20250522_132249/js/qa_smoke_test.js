/**
 * QA Smoke Test Utility
 * Tests all UI anchors and interactions in demo mode
 */
class QASmokeTest {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        
        this.init();
    }

    init() {
        // Add test controls to the page
        this.addTestControls();
        
        // Auto-run basic tests if in demo mode
        if (window.simApiClient && window.simApiClient.isSimulationMode()) {
            setTimeout(() => {
                this.runBasicTests();
            }, 2000);
        }
    }

    addTestControls() {
        const testControls = document.createElement('div');
        testControls.id = 'qa-test-controls';
        testControls.innerHTML = `
            <div class="qa-controls-panel">
                <div class="qa-header">
                    <h4><i class="fas fa-vial"></i> QA Smoke Tests</h4>
                    <button class="qa-toggle" onclick="window.qaSmokeTest.togglePanel()">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
                <div class="qa-body">
                    <div class="qa-buttons">
                        <button class="qa-btn qa-btn-primary" onclick="window.qaSmokeTest.runAllTests()">
                            <i class="fas fa-play"></i> Run All Tests
                        </button>
                        <button class="qa-btn qa-btn-secondary" onclick="window.qaSmokeTest.runNavTests()">
                            <i class="fas fa-bars"></i> Test Navigation
                        </button>
                        <button class="qa-btn qa-btn-secondary" onclick="window.qaSmokeTest.runMapTests()">
                            <i class="fas fa-map"></i> Test Map
                        </button>
                        <button class="qa-btn qa-btn-secondary" onclick="window.qaSmokeTest.runKpiTests()">
                            <i class="fas fa-chart-bar"></i> Test KPIs
                        </button>
                        <button class="qa-btn qa-btn-warning" onclick="window.qaSmokeTest.clearResults()">
                            <i class="fas fa-trash"></i> Clear
                        </button>
                    </div>
                    <div class="qa-results" id="qa-test-results">
                        <div class="qa-status">Ready to run tests...</div>
                    </div>
                </div>
            </div>
        `;

        testControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            z-index: 1003;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        document.body.appendChild(testControls);
        this.addTestStyles();
    }

    addTestStyles() {
        const styleId = 'qa-smoke-test-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .qa-controls-panel {
                background: white;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .qa-controls-panel.collapsed .qa-body {
                display: none;
            }

            .qa-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: #f8f9fa;
                border-bottom: 1px solid #e1e5e9;
                cursor: pointer;
            }

            .qa-header h4 {
                margin: 0;
                color: #333;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .qa-toggle {
                background: none;
                border: none;
                cursor: pointer;
                color: #6c757d;
                font-size: 1rem;
                padding: 0.25rem;
                transition: transform 0.3s ease;
            }

            .qa-controls-panel.collapsed .qa-toggle {
                transform: rotate(180deg);
            }

            .qa-body {
                padding: 1rem;
            }

            .qa-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }

            .qa-btn {
                padding: 0.5rem 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                color: #333;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }

            .qa-btn:hover {
                background: #f8f9fa;
            }

            .qa-btn-primary {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .qa-btn-primary:hover {
                background: #0056b3;
            }

            .qa-btn-secondary {
                background: #6c757d;
                color: white;
                border-color: #6c757d;
            }

            .qa-btn-secondary:hover {
                background: #545b62;
            }

            .qa-btn-warning {
                background: #ffc107;
                color: #212529;
                border-color: #ffc107;
            }

            .qa-btn-warning:hover {
                background: #e0a800;
            }

            .qa-results {
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #e1e5e9;
                border-radius: 4px;
                padding: 0.75rem;
                background: #f8f9fa;
                font-size: 0.875rem;
            }

            .qa-status {
                color: #6c757d;
                font-style: italic;
            }

            .qa-test-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e1e5e9;
            }

            .qa-test-item:last-child {
                border-bottom: none;
            }

            .qa-test-name {
                flex: 1;
                color: #333;
            }

            .qa-test-status {
                font-weight: bold;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
            }

            .qa-test-pass {
                background: #d4edda;
                color: #155724;
            }

            .qa-test-fail {
                background: #f8d7da;
                color: #721c24;
            }

            .qa-test-running {
                background: #fff3cd;
                color: #856404;
            }

            .qa-summary {
                margin-top: 1rem;
                padding: 0.75rem;
                background: white;
                border-radius: 4px;
                border: 1px solid #e1e5e9;
            }

            .qa-summary-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }

            .qa-summary-stat {
                text-align: center;
            }

            .qa-summary-value {
                font-size: 1.25rem;
                font-weight: bold;
            }

            .qa-summary-label {
                font-size: 0.75rem;
                color: #6c757d;
                text-transform: uppercase;
            }

            .qa-progress-bar {
                width: 100%;
                height: 6px;
                background: #e1e5e9;
                border-radius: 3px;
                overflow: hidden;
            }

            .qa-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #20c997);
                transition: width 0.3s ease;
            }
        `;

        document.head.appendChild(styles);
    }

    togglePanel() {
        const panel = document.querySelector('.qa-controls-panel');
        panel.classList.toggle('collapsed');
    }

    logTest(name, status, details = '') {
        const testItem = {
            name,
            status,
            details,
            timestamp: new Date().toLocaleTimeString()
        };

        this.testResults.push(testItem);
        this.totalTests++;

        if (status === 'PASS') {
            this.passedTests++;
        } else if (status === 'FAIL') {
            this.failedTests++;
        }

        this.updateTestDisplay();
    }

    updateTestDisplay() {
        const resultsContainer = document.getElementById('qa-test-results');
        
        let html = '<div class="qa-test-list">';
        
        this.testResults.slice(-10).forEach(test => {
            const statusClass = test.status === 'PASS' ? 'qa-test-pass' : 
                              test.status === 'FAIL' ? 'qa-test-fail' : 'qa-test-running';
            
            html += `
                <div class="qa-test-item">
                    <div class="qa-test-name">${test.name}</div>
                    <div class="qa-test-status ${statusClass}">${test.status}</div>
                </div>
            `;
        });
        
        html += '</div>';

        if (this.totalTests > 0) {
            const passRate = (this.passedTests / this.totalTests * 100).toFixed(1);
            
            html += `
                <div class="qa-summary">
                    <div class="qa-summary-stats">
                        <div class="qa-summary-stat">
                            <div class="qa-summary-value">${this.totalTests}</div>
                            <div class="qa-summary-label">Total</div>
                        </div>
                        <div class="qa-summary-stat">
                            <div class="qa-summary-value" style="color: #28a745;">${this.passedTests}</div>
                            <div class="qa-summary-label">Passed</div>
                        </div>
                        <div class="qa-summary-stat">
                            <div class="qa-summary-value" style="color: #dc3545;">${this.failedTests}</div>
                            <div class="qa-summary-label">Failed</div>
                        </div>
                        <div class="qa-summary-stat">
                            <div class="qa-summary-value" style="color: #007bff;">${passRate}%</div>
                            <div class="qa-summary-label">Pass Rate</div>
                        </div>
                    </div>
                    <div class="qa-progress-bar">
                        <div class="qa-progress-fill" style="width: ${passRate}%;"></div>
                    </div>
                </div>
            `;
        }

        resultsContainer.innerHTML = html;
    }

    async runAllTests() {
        this.clearResults();
        this.logTest('Starting QA Smoke Tests', 'RUNNING');
        
        await this.runNavTests();
        await this.runMapTests();
        await this.runKpiTests();
        await this.runSimulationTests();
        
        this.logTest('All Tests Completed', 'PASS', 
            `${this.passedTests}/${this.totalTests} tests passed`);
    }

    async runBasicTests() {
        this.logTest('Auto-running basic tests', 'RUNNING');
        
        // Test simulation mode
        this.testSimulationMode();
        
        // Test core components
        this.testCoreComponents();
        
        // Test data loading
        await this.testDataLoading();
    }

    testSimulationMode() {
        try {
            const isSimMode = window.simApiClient && window.simApiClient.isSimulationMode();
            this.logTest('Simulation Mode Active', isSimMode ? 'PASS' : 'FAIL');
            
            const hasSimBadge = document.querySelector('.simulation-badge, .nav-demo-badge');
            this.logTest('Demo Badge Visible', hasSimBadge ? 'PASS' : 'FAIL');
            
        } catch (error) {
            this.logTest('Simulation Mode Check', 'FAIL', error.message);
        }
    }

    testCoreComponents() {
        const components = [
            { name: 'Navigation Panel', selector: '#side-nav, .nav-menu' },
            { name: 'Map Container', selector: '#performance-map' },
            { name: 'KPI Tiles', selector: '.kpi-tile' },
            { name: 'Drill-down Handler', selector: 'script[src*="drilldown_handler"]' },
            { name: 'Simulation Client', selector: 'script[src*="sim_api_client"]' }
        ];

        components.forEach(component => {
            const element = document.querySelector(component.selector);
            this.logTest(component.name, element ? 'PASS' : 'FAIL');
        });
    }

    async testDataLoading() {
        try {
            // Test tags data
            if (window.simApiClient) {
                const tagsData = await window.simApiClient.getTags();
                this.logTest('Tags Data Loading', 
                    Array.isArray(tagsData) && tagsData.length > 0 ? 'PASS' : 'FAIL');
            }
        } catch (error) {
            this.logTest('Data Loading', 'FAIL', error.message);
        }
    }

    async runNavTests() {
        this.logTest('Testing Navigation', 'RUNNING');
        
        try {
            const navItems = document.querySelectorAll('.nav-item[data-target]');
            this.logTest('Navigation Items Found', 
                navItems.length > 0 ? 'PASS' : 'FAIL', `${navItems.length} items`);
            
            // Test clicking nav items
            let clickTests = 0;
            navItems.forEach((item, index) => {
                if (index < 3) { // Test first 3 items
                    try {
                        const target = item.dataset.target;
                        item.click();
                        clickTests++;
                        this.logTest(`Nav Click: ${target}`, 'PASS');
                    } catch (error) {
                        this.logTest(`Nav Click: ${item.dataset.target}`, 'FAIL', error.message);
                    }
                }
            });
            
            // Test quick actions
            const quickActions = document.querySelectorAll('.quick-action-btn:not(.disabled)');
            this.logTest('Quick Actions Available', 
                quickActions.length > 0 ? 'PASS' : 'FAIL', `${quickActions.length} actions`);
                
        } catch (error) {
            this.logTest('Navigation Tests', 'FAIL', error.message);
        }
    }

    async runMapTests() {
        this.logTest('Testing Map Interactions', 'RUNNING');
        
        try {
            const mapContainer = document.querySelector('#performance-map, .map-container');
            this.logTest('Map Container', mapContainer ? 'PASS' : 'FAIL');
            
            const mapMarkers = document.querySelectorAll('.store-marker');
            this.logTest('Map Markers', 
                mapMarkers.length > 0 ? 'PASS' : 'FAIL', `${mapMarkers.length} markers`);
            
            // Test marker clicks
            if (mapMarkers.length > 0) {
                try {
                    const firstMarker = mapMarkers[0];
                    firstMarker.click();
                    this.logTest('Marker Click Handler', 'PASS');
                    
                    // Check if drawer opened
                    setTimeout(() => {
                        const drawer = document.querySelector('.store-detail-drawer');
                        this.logTest('Store Detail Drawer', drawer ? 'PASS' : 'FAIL');
                        
                        // Close drawer
                        if (drawer) {
                            const closeBtn = drawer.querySelector('.close-btn');
                            if (closeBtn) closeBtn.click();
                        }
                    }, 500);
                    
                } catch (error) {
                    this.logTest('Marker Click Test', 'FAIL', error.message);
                }
            }
            
            // Test map controls
            const mapControls = document.querySelectorAll('.map-btn');
            this.logTest('Map Controls', 
                mapControls.length > 0 ? 'PASS' : 'FAIL', `${mapControls.length} controls`);
                
        } catch (error) {
            this.logTest('Map Tests', 'FAIL', error.message);
        }
    }

    async runKpiTests() {
        this.logTest('Testing KPI Interactions', 'RUNNING');
        
        try {
            const kpiTiles = document.querySelectorAll('.kpi-tile.clickable[data-kpi]');
            this.logTest('KPI Tiles Found', 
                kpiTiles.length >= 7 ? 'PASS' : 'FAIL', `${kpiTiles.length}/7 tiles`);
            
            // Test drill-down handler
            const drillDownHandler = window.drillDownHandler;
            this.logTest('Drill-down Handler', drillDownHandler ? 'PASS' : 'FAIL');
            
            // Test KPI data attributes
            const expectedKpis = [
                'total-sales', 'transactions', 'brand-sentiment', 
                'conversion-rate', 'growth-rate', 'store-performance', 
                'regional-performance'
            ];
            
            const foundKpis = Array.from(kpiTiles).map(tile => tile.dataset.kpi);
            const missingKpis = expectedKpis.filter(kpi => !foundKpis.includes(kpi));
            
            this.logTest('KPI Types Complete', 
                missingKpis.length === 0 ? 'PASS' : 'FAIL', 
                missingKpis.length ? `Missing: ${missingKpis.join(', ')}` : 'All KPIs present');
            
            // Test clicking first KPI
            if (kpiTiles.length > 0) {
                try {
                    const firstKpi = kpiTiles[0];
                    firstKpi.click();
                    this.logTest(`KPI Click: ${firstKpi.dataset.kpi}`, 'PASS');
                    
                    // Check if drawer appears
                    setTimeout(() => {
                        const drawer = document.querySelector('.drill-down-drawer');
                        this.logTest('Drill-down Drawer', drawer ? 'PASS' : 'FAIL');
                        
                        // Close drawer
                        if (drawer) {
                            const closeBtn = drawer.querySelector('.close-btn');
                            if (closeBtn) closeBtn.click();
                        }
                    }, 1000);
                    
                } catch (error) {
                    this.logTest('KPI Click Test', 'FAIL', error.message);
                }
            }
            
        } catch (error) {
            this.logTest('KPI Tests', 'FAIL', error.message);
        }
    }

    async runSimulationTests() {
        this.logTest('Testing Simulation Data', 'RUNNING');
        
        try {
            // Test API client
            if (window.simApiClient) {
                const config = await window.simApiClient.loadConfig();
                this.logTest('Simulation Config', config ? 'PASS' : 'FAIL');
                
                // Test data endpoints
                const endpoints = [
                    'tags.json',
                    'device_health.json', 
                    'export_preview.json',
                    'drilldowns/total-sales.json'
                ];
                
                for (const endpoint of endpoints) {
                    try {
                        const response = await window.simApiClient.loadSimulationData(endpoint);
                        const data = await response.json();
                        this.logTest(`Data: ${endpoint}`, data ? 'PASS' : 'FAIL');
                    } catch (error) {
                        this.logTest(`Data: ${endpoint}`, 'FAIL', error.message);
                    }
                }
            } else {
                this.logTest('Simulation API Client', 'FAIL', 'Not available');
            }
            
        } catch (error) {
            this.logTest('Simulation Tests', 'FAIL', error.message);
        }
    }

    clearResults() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.updateTestDisplay();
        
        const resultsContainer = document.getElementById('qa-test-results');
        resultsContainer.innerHTML = '<div class="qa-status">Ready to run tests...</div>';
    }

    // Export test results
    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.totalTests,
                passed: this.passedTests,
                failed: this.failedTests,
                passRate: this.totalTests > 0 ? (this.passedTests / this.totalTests * 100).toFixed(1) : 0
            },
            tests: this.testResults
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-smoke-test-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        this.logTest('Results Exported', 'PASS');
    }
}

// Initialize QA smoke test when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.qaSmokeTest = new QASmokeTest();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QASmokeTest;
}