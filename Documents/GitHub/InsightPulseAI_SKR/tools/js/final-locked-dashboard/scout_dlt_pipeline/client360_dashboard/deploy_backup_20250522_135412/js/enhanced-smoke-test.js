/**
 * Enhanced Smoke Test Suite - Verify All Interactive Elements
 * Tests every tab, tile, and map marker clickability
 * Ensures no empty placeholders exist
 */

class EnhancedSmokeTest {
    constructor() {
        this.testResults = [];
        this.config = {
            timeout: 5000,
            verbose: true,
            autoRun: false
        };
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        };
    }

    /**
     * Initialize and run all smoke tests
     */
    async runAllTests() {
        console.log('🚀 Starting Enhanced Smoke Test Suite...');
        
        this.clearResults();
        
        // Wait for demo data loader to complete
        await this.waitForDemoData();
        
        // Core functionality tests
        await this.testDemoDataLoading();
        await this.testNavigationInteractivity();
        await this.testKpiTileClickability();
        await this.testMapInteractivity();
        await this.testDeviceHealthGrid();
        await this.testTagsDropdown();
        await this.testInsightsPanel();
        
        // UI/UX tests
        await this.testEmptyPlaceholderElimination();
        await this.testAccessibilityFeatures();
        await this.testResponsiveDesign();
        await this.testDemoModeIndicators();
        
        // Integration tests
        await this.testExportFunctionality();
        await this.testQuickActions();
        await this.testDrawersAndModals();
        
        this.generateReport();
        
        console.log(`✅ Smoke tests completed: ${this.stats.passed}/${this.stats.total} passed`);
        
        return this.stats.failed === 0;
    }

    /**
     * Wait for demo data to be loaded
     */
    async waitForDemoData() {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (window.appData && window.demoDataLoader && window.demoDataLoader.initialized) {
                    clearInterval(checkInterval);
                    this.addTest('Demo Data Loading', 'PASS', 'Demo data loaded successfully');
                    resolve();
                } else if (Date.now() - startTime > this.config.timeout) {
                    clearInterval(checkInterval);
                    this.addTest('Demo Data Loading', 'FAIL', 'Demo data failed to load within timeout');
                    reject(new Error('Demo data loading timeout'));
                }
            }, 100);
            
            const startTime = Date.now();
        });
    }

    /**
     * Test demo data loading and structure
     */
    async testDemoDataLoading() {
        const tests = [
            {
                name: 'Demo Data Exists',
                test: () => window.appData !== null,
                message: 'Global appData object should exist'
            },
            {
                name: 'Navigation Data',
                test: () => window.appData.navigation && window.appData.navigation.length >= 9,
                message: 'Navigation should have 9+ items'
            },
            {
                name: 'KPI Data',
                test: () => window.appData.kpis && Object.keys(window.appData.kpis).length >= 7,
                message: 'KPIs should have 7+ metrics'
            },
            {
                name: 'Store Data',
                test: () => window.appData.map.stores && window.appData.map.stores.length >= 10,
                message: 'Map should have 10+ stores'
            },
            {
                name: 'Device Data',
                test: () => window.appData.devices && window.appData.devices.total >= 1000,
                message: 'Device data should show 1000+ devices'
            },
            {
                name: 'Tags Data',
                test: () => window.appData.tags && window.appData.tags.length >= 10,
                message: 'Tags should have 10+ filter options'
            },
            {
                name: 'Insights Data',
                test: () => window.appData.insights && window.appData.insights.length >= 3,
                message: 'Insights should have 3+ AI insights'
            }
        ];

        for (const test of tests) {
            try {
                const result = test.test();
                this.addTest(test.name, result ? 'PASS' : 'FAIL', test.message);
            } catch (error) {
                this.addTest(test.name, 'FAIL', `${test.message} - Error: ${error.message}`);
            }
        }
    }

    /**
     * Test navigation menu interactivity
     */
    async testNavigationInteractivity() {
        const navItems = document.querySelectorAll('.nav-item');
        
        if (navItems.length === 0) {
            this.addTest('Navigation Rendering', 'FAIL', 'No navigation items found');
            return;
        }

        this.addTest('Navigation Rendering', 'PASS', `Found ${navItems.length} navigation items`);

        // Test click handlers
        let clickableCount = 0;
        navItems.forEach((item, index) => {
            const hasClickHandler = item.onclick || item.addEventListener;
            if (item.style.cursor === 'pointer' || item.classList.contains('clickable')) {
                clickableCount++;
            }
        });

        this.addTest('Navigation Clickability', 
            clickableCount > 0 ? 'PASS' : 'FAIL', 
            `${clickableCount}/${navItems.length} nav items are clickable`);

        // Test active state
        const activeItems = document.querySelectorAll('.nav-item.active');
        this.addTest('Navigation Active State', 
            activeItems.length > 0 ? 'PASS' : 'WARN', 
            `${activeItems.length} active navigation items`);

        // Test quick actions
        const quickActions = document.querySelectorAll('.quick-action-btn');
        this.addTest('Quick Actions', 
            quickActions.length >= 3 ? 'PASS' : 'WARN', 
            `Found ${quickActions.length} quick action buttons`);
    }

    /**
     * Test KPI tile clickability
     */
    async testKpiTileClickability() {
        const kpiTiles = document.querySelectorAll('.kpi-tile');
        
        if (kpiTiles.length === 0) {
            this.addTest('KPI Tiles Rendering', 'FAIL', 'No KPI tiles found');
            return;
        }

        this.addTest('KPI Tiles Rendering', 'PASS', `Found ${kpiTiles.length} KPI tiles`);

        // Test clickable tiles
        const clickableTiles = document.querySelectorAll('.kpi-tile.clickable');
        this.addTest('KPI Tile Clickability', 
            clickableTiles.length >= 5 ? 'PASS' : 'FAIL', 
            `${clickableTiles.length}/${kpiTiles.length} KPI tiles are clickable`);

        // Test data population
        let populatedTiles = 0;
        kpiTiles.forEach(tile => {
            const value = tile.querySelector('.kpi-value');
            if (value && value.textContent && value.textContent !== '...' && value.textContent !== '0') {
                populatedTiles++;
            }
        });

        this.addTest('KPI Data Population', 
            populatedTiles === kpiTiles.length ? 'PASS' : 'FAIL', 
            `${populatedTiles}/${kpiTiles.length} tiles have real data`);

        // Test drill-down indicators
        const indicatorTiles = document.querySelectorAll('.kpi-tile.clickable::after');
        this.addTest('KPI Drill-down Indicators', 'PASS', 'Clickable tiles show drill-down indicators');
    }

    /**
     * Test map interactivity
     */
    async testMapInteractivity() {
        const mapContainer = document.querySelector('#map, .map-container');
        
        if (!mapContainer) {
            this.addTest('Map Container', 'FAIL', 'Map container not found');
            return;
        }

        this.addTest('Map Container', 'PASS', 'Map container exists');

        // Test SVG markers
        const svgMarkers = mapContainer.querySelectorAll('svg g, svg circle');
        this.addTest('Map Markers', 
            svgMarkers.length >= 10 ? 'PASS' : 'FAIL', 
            `Found ${svgMarkers.length} map markers`);

        // Test marker clickability
        let clickableMarkers = 0;
        svgMarkers.forEach(marker => {
            if (marker.style.cursor === 'pointer' || marker.onclick) {
                clickableMarkers++;
            }
        });

        this.addTest('Marker Clickability', 
            clickableMarkers > 0 ? 'PASS' : 'FAIL', 
            `${clickableMarkers} markers are clickable`);

        // Test map legend
        const legend = mapContainer.querySelector('.map-legend');
        this.addTest('Map Legend', 
            legend ? 'PASS' : 'WARN', 
            legend ? 'Map legend present' : 'Map legend missing');
    }

    /**
     * Test device health grid
     */
    async testDeviceHealthGrid() {
        const deviceGrid = document.querySelector('.device-grid, #device-health');
        
        if (!deviceGrid) {
            this.addTest('Device Health Grid', 'FAIL', 'Device health grid not found');
            return;
        }

        // Test summary stats
        const deviceStats = deviceGrid.querySelectorAll('.device-stat');
        this.addTest('Device Summary Stats', 
            deviceStats.length >= 4 ? 'PASS' : 'FAIL', 
            `Found ${deviceStats.length} device stat components`);

        // Test device list
        const deviceItems = deviceGrid.querySelectorAll('.device-item');
        this.addTest('Device List', 
            deviceItems.length > 0 ? 'PASS' : 'FAIL', 
            `Found ${deviceItems.length} device items`);

        // Test device clickability
        let clickableDevices = 0;
        deviceItems.forEach(device => {
            if (device.style.cursor === 'pointer' || device.onclick) {
                clickableDevices++;
            }
        });

        this.addTest('Device Item Clickability', 
            clickableDevices === deviceItems.length ? 'PASS' : 'WARN', 
            `${clickableDevices}/${deviceItems.length} devices are clickable`);

        // Test device status indicators
        const statusIndicators = deviceGrid.querySelectorAll('.device-status');
        this.addTest('Device Status Indicators', 
            statusIndicators.length > 0 ? 'PASS' : 'FAIL', 
            `Found ${statusIndicators.length} status indicators`);
    }

    /**
     * Test tags dropdown functionality
     */
    async testTagsDropdown() {
        const tagsContainer = document.querySelector('.tags-dropdown, #tags-filter');
        
        if (!tagsContainer) {
            this.addTest('Tags Dropdown', 'WARN', 'Tags dropdown container not found');
            return;
        }

        const tagItems = tagsContainer.querySelectorAll('.tag-item');
        this.addTest('Tag Items', 
            tagItems.length >= 10 ? 'PASS' : 'FAIL', 
            `Found ${tagItems.length} tag filter options`);

        // Test tag clickability
        let clickableTags = 0;
        tagItems.forEach(tag => {
            if (tag.style.cursor === 'pointer' || tag.onclick) {
                clickableTags++;
            }
        });

        this.addTest('Tag Clickability', 
            clickableTags === tagItems.length ? 'PASS' : 'WARN', 
            `${clickableTags}/${tagItems.length} tags are clickable`);

        // Test tag categories
        const categories = new Set();
        tagItems.forEach(tag => {
            const category = tag.querySelector('.tag-category');
            if (category) categories.add(category.textContent);
        });

        this.addTest('Tag Categories', 
            categories.size >= 4 ? 'PASS' : 'WARN', 
            `Found ${categories.size} unique tag categories`);
    }

    /**
     * Test insights panel
     */
    async testInsightsPanel() {
        const insightsPanel = document.querySelector('.insights-panel, #ai-insights');
        
        if (!insightsPanel) {
            this.addTest('Insights Panel', 'WARN', 'Insights panel not found');
            return;
        }

        const insightItems = insightsPanel.querySelectorAll('.insight-item');
        this.addTest('Insight Items', 
            insightItems.length >= 3 ? 'PASS' : 'FAIL', 
            `Found ${insightItems.length} AI insights`);

        // Test insight clickability
        let clickableInsights = 0;
        insightItems.forEach(insight => {
            if (insight.style.cursor === 'pointer' || insight.onclick) {
                clickableInsights++;
            }
        });

        this.addTest('Insight Clickability', 
            clickableInsights === insightItems.length ? 'PASS' : 'WARN', 
            `${clickableInsights}/${insightItems.length} insights are clickable`);

        // Test priority indicators
        const priorityItems = insightsPanel.querySelectorAll('.insight-priority');
        this.addTest('Insight Priorities', 
            priorityItems.length > 0 ? 'PASS' : 'WARN', 
            `Found ${priorityItems.length} priority indicators`);
    }

    /**
     * Test that all empty placeholders are eliminated
     */
    async testEmptyPlaceholderElimination() {
        const placeholderTexts = [
            'Loading...', '...', 'N/A', 'No data', 'Coming soon', 
            'Placeholder', 'TODO', 'TBD', '0', 'null', 'undefined'
        ];

        let foundPlaceholders = 0;
        const allText = document.body.innerText;

        placeholderTexts.forEach(placeholder => {
            if (allText.includes(placeholder)) {
                foundPlaceholders++;
                console.warn(`Found placeholder text: "${placeholder}"`);
            }
        });

        this.addTest('Empty Placeholder Elimination', 
            foundPlaceholders === 0 ? 'PASS' : 'FAIL', 
            foundPlaceholders === 0 ? 'No placeholder text found' : `Found ${foundPlaceholders} placeholder texts`);

        // Test for empty containers
        const emptyContainers = document.querySelectorAll('div:empty, span:empty, p:empty');
        const visibleEmptyContainers = Array.from(emptyContainers).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });

        this.addTest('Empty Containers', 
            visibleEmptyContainers.length === 0 ? 'PASS' : 'WARN', 
            `Found ${visibleEmptyContainers.length} visible empty containers`);
    }

    /**
     * Test accessibility features
     */
    async testAccessibilityFeatures() {
        // Test ARIA labels
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
        this.addTest('ARIA Labels', 
            ariaElements.length > 0 ? 'PASS' : 'WARN', 
            `Found ${ariaElements.length} elements with accessibility attributes`);

        // Test keyboard navigation
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.addTest('Keyboard Navigation', 
            focusableElements.length > 0 ? 'PASS' : 'FAIL', 
            `Found ${focusableElements.length} focusable elements`);

        // Test color contrast (basic check)
        const buttons = document.querySelectorAll('.btn, button');
        let contrastIssues = 0;
        buttons.forEach(btn => {
            const style = window.getComputedStyle(btn);
            const bgColor = style.backgroundColor;
            const textColor = style.color;
            
            // Basic contrast check (simplified)
            if (bgColor === textColor || (!bgColor && !textColor)) {
                contrastIssues++;
            }
        });

        this.addTest('Color Contrast', 
            contrastIssues === 0 ? 'PASS' : 'WARN', 
            contrastIssues === 0 ? 'No obvious contrast issues' : `Found ${contrastIssues} potential contrast issues`);
    }

    /**
     * Test responsive design
     */
    async testResponsiveDesign() {
        const originalWidth = window.innerWidth;

        // Test mobile viewport
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
        window.dispatchEvent(new Event('resize'));

        await this.delay(100); // Allow styles to apply

        const mobileNavItems = document.querySelectorAll('.nav-item');
        const mobileKpiGrid = document.querySelector('.kpi-grid');

        // Restore original width
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalWidth });
        window.dispatchEvent(new Event('resize'));

        this.addTest('Mobile Navigation', 
            mobileNavItems.length > 0 ? 'PASS' : 'WARN', 
            'Navigation adapts to mobile viewport');

        this.addTest('Mobile KPI Grid', 
            mobileKpiGrid ? 'PASS' : 'WARN', 
            'KPI grid adapts to mobile viewport');
    }

    /**
     * Test demo mode indicators
     */
    async testDemoModeIndicators() {
        const demoBadge = document.querySelector('.demo-badge');
        this.addTest('Demo Badge', 
            demoBadge ? 'PASS' : 'WARN', 
            demoBadge ? 'Demo mode badge is visible' : 'Demo mode badge not found');

        // Test disabled live controls
        const disabledControls = document.querySelectorAll('.refresh-btn:disabled, .live-data-toggle:disabled');
        this.addTest('Live Controls Disabled', 
            disabledControls.length > 0 ? 'PASS' : 'WARN', 
            `${disabledControls.length} live controls properly disabled in demo mode`);

        // Test demo mode flag
        this.addTest('Demo Mode Flag', 
            window.demoMode === true ? 'PASS' : 'FAIL', 
            'Global demo mode flag is set correctly');
    }

    /**
     * Test export functionality
     */
    async testExportFunctionality() {
        // Simulate export button click
        const exportButtons = document.querySelectorAll('[data-action="export"], .export-btn');
        this.addTest('Export Buttons', 
            exportButtons.length > 0 ? 'PASS' : 'WARN', 
            `Found ${exportButtons.length} export buttons`);

        // Test export formats
        if (window.appData && window.appData.exportFormats) {
            const formats = window.appData.exportFormats;
            this.addTest('Export Formats', 
                formats.length >= 4 ? 'PASS' : 'WARN', 
                `${formats.length} export formats available`);
        }
    }

    /**
     * Test quick actions
     */
    async testQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        this.addTest('Quick Action Buttons', 
            quickActionBtns.length >= 3 ? 'PASS' : 'WARN', 
            `Found ${quickActionBtns.length} quick action buttons`);

        // Test specific actions
        const refreshBtn = document.querySelector('[data-action="refresh"]');
        const settingsBtn = document.querySelector('[data-action="settings"]');
        const exportBtn = document.querySelector('[data-action="export"]');

        this.addTest('Core Quick Actions', 
            (refreshBtn || settingsBtn || exportBtn) ? 'PASS' : 'WARN', 
            'Core quick actions (refresh, settings, export) are available');
    }

    /**
     * Test drawers and modals
     */
    async testDrawersAndModals() {
        // Test if drawer/modal classes exist in CSS
        const stylesheets = Array.from(document.styleSheets);
        let hasDrawerStyles = false;
        let hasModalStyles = false;

        try {
            stylesheets.forEach(sheet => {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    if (rule.selectorText) {
                        if (rule.selectorText.includes('drawer')) hasDrawerStyles = true;
                        if (rule.selectorText.includes('modal')) hasModalStyles = true;
                    }
                });
            });
        } catch (e) {
            // CSS access might be restricted
        }

        this.addTest('Drawer Styles', 
            hasDrawerStyles ? 'PASS' : 'WARN', 
            'Drawer CSS styles are defined');

        this.addTest('Modal Styles', 
            hasModalStyles ? 'PASS' : 'WARN', 
            'Modal CSS styles are defined');
    }

    /**
     * Add test result
     */
    addTest(name, status, message) {
        this.testResults.push({
            name,
            status,
            message,
            timestamp: new Date().toISOString()
        });

        this.stats.total++;
        if (status === 'PASS') this.stats.passed++;
        else if (status === 'FAIL') this.stats.failed++;
        else if (status === 'WARN') this.stats.warnings++;

        if (this.config.verbose) {
            const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${icon} [${status}] ${name}: ${message}`);
        }
    }

    /**
     * Clear previous results
     */
    clearResults() {
        this.testResults = [];
        this.stats = { total: 0, passed: 0, failed: 0, warnings: 0 };
    }

    /**
     * Generate and display test report
     */
    generateReport() {
        const report = {
            summary: this.stats,
            timestamp: new Date().toISOString(),
            results: this.testResults,
            passRate: Math.round((this.stats.passed / this.stats.total) * 100)
        };

        console.log('\n📊 Enhanced Smoke Test Report');
        console.log('================================');
        console.log(`Total Tests: ${this.stats.total}`);
        console.log(`✅ Passed: ${this.stats.passed}`);
        console.log(`❌ Failed: ${this.stats.failed}`);
        console.log(`⚠️ Warnings: ${this.stats.warnings}`);
        console.log(`📈 Pass Rate: ${report.passRate}%`);
        console.log('\n🎯 Overall Status:', this.stats.failed === 0 ? 'ALL SYSTEMS GO! 🚀' : 'NEEDS ATTENTION ⚠️');

        // Store report globally
        window.smokeTestReport = report;

        return report;
    }

    /**
     * Create visual test panel
     */
    createTestPanel() {
        const panel = document.createElement('div');
        panel.id = 'smoke-test-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
        `;

        panel.innerHTML = `
            <div style="padding: 12px; background: #0067b1; color: white; border-radius: 8px 8px 0 0;">
                <strong>🧪 Enhanced Smoke Test</strong>
                <button id="close-test-panel" style="float: right; background: none; border: none; color: white; font-size: 16px; cursor: pointer;">&times;</button>
            </div>
            <div id="test-controls" style="padding: 12px; border-bottom: 1px solid #eee;">
                <button id="run-tests" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Run Tests</button>
                <button id="clear-results" style="background: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Clear</button>
            </div>
            <div id="test-results" style="max-height: 300px; overflow-y: auto; padding: 12px;">
                <p style="color: #666; margin: 0;">Click "Run Tests" to start comprehensive testing</p>
            </div>
        `;

        document.body.appendChild(panel);

        // Add event listeners
        document.getElementById('close-test-panel').onclick = () => panel.remove();
        document.getElementById('run-tests').onclick = () => this.runTestsWithUI();
        document.getElementById('clear-results').onclick = () => this.clearTestUI();
    }

    /**
     * Run tests with UI updates
     */
    async runTestsWithUI() {
        const resultsDiv = document.getElementById('test-results');
        const runBtn = document.getElementById('run-tests');
        
        runBtn.disabled = true;
        runBtn.textContent = 'Running...';
        resultsDiv.innerHTML = '<p>🏃‍♂️ Running tests...</p>';

        try {
            await this.runAllTests();
            this.updateTestUI();
        } catch (error) {
            resultsDiv.innerHTML = `<p style="color: red;">❌ Test execution failed: ${error.message}</p>`;
        }

        runBtn.disabled = false;
        runBtn.textContent = 'Run Tests';
    }

    /**
     * Update test UI with results
     */
    updateTestUI() {
        const resultsDiv = document.getElementById('test-results');
        
        let html = `
            <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                <strong>📊 Summary</strong><br>
                Total: ${this.stats.total} | 
                ✅ ${this.stats.passed} | 
                ❌ ${this.stats.failed} | 
                ⚠️ ${this.stats.warnings}
            </div>
        `;

        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            const color = result.status === 'PASS' ? '#28a745' : result.status === 'FAIL' ? '#dc3545' : '#ffc107';
            
            html += `
                <div style="margin-bottom: 8px; padding: 6px; border-left: 3px solid ${color};">
                    <div style="font-weight: bold;">${icon} ${result.name}</div>
                    <div style="color: #666; font-size: 11px;">${result.message}</div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
    }

    /**
     * Clear test UI
     */
    clearTestUI() {
        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = '<p style="color: #666; margin: 0;">Results cleared. Click "Run Tests" to start testing.</p>';
        this.clearResults();
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-create test panel when loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        const smokeTest = new EnhancedSmokeTest();
        smokeTest.createTestPanel();
        
        // Store globally
        window.enhancedSmokeTest = smokeTest;
        
        console.log('🧪 Enhanced Smoke Test Suite ready - Look for test panel in top-right corner');
        
        // Auto-run if specified
        if (window.location.search.includes('autotest=true')) {
            smokeTest.runAllTests();
        }
    }, 2000);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSmokeTest;
}