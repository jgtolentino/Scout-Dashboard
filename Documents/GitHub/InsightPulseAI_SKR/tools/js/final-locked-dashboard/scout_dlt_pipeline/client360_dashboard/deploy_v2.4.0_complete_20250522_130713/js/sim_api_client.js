/**
 * Simulation API Client for Show-Ready Demo
 * Routes API calls to static JSON fixtures for demo purposes
 */
class SimulationApiClient {
    constructor() {
        this.simulationMode = true;
        this.mockDelay = 500; // Simulate API response time
        this.baseUrl = '/data/sim';
        this.init();
    }

    async init() {
        try {
            const config = await this.loadConfig();
            this.config = config;
            this.simulationMode = config.simulation_mode;
            this.mockDelay = config.performance?.mock_api_delay || 500;
            
            console.log('🎭 Simulation API Client initialized', {
                mode: this.simulationMode ? 'SIMULATION' : 'LIVE',
                delay: this.mockDelay + 'ms'
            });
        } catch (error) {
            console.warn('Failed to load simulation config, using defaults');
            this.config = { simulation_mode: true };
        }
    }

    async loadConfig() {
        const response = await fetch(`${this.baseUrl}/config.json`);
        return await response.json();
    }

    // Simulate network delay
    async delay() {
        return new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }

    // Main API routing method
    async fetch(url, options = {}) {
        if (!this.simulationMode) {
            return fetch(url, options);
        }

        console.log(`🎭 Simulating API call: ${url}`);
        await this.delay();

        // Route drill-down API calls
        if (url.includes('/api/drilldown/')) {
            return this.handleDrilldownRequest(url);
        }

        // Route other API calls
        if (url.includes('/api/tags')) {
            return this.loadSimulationData('tags.json');
        }

        if (url.includes('/api/device-health')) {
            return this.loadSimulationData('device_health.json');
        }

        if (url.includes('/api/export-preview')) {
            return this.loadSimulationData('export_preview.json');
        }

        // Default: try to load from simulation data
        const filename = this.extractFilename(url);
        return this.loadSimulationData(filename);
    }

    async handleDrilldownRequest(url) {
        const kpiType = url.split('/').pop().split('?')[0];
        const validKpiTypes = [
            'total-sales', 'transactions', 'brand-sentiment', 
            'conversion-rate', 'growth-rate', 'store-performance', 
            'regional-performance'
        ];

        if (validKpiTypes.includes(kpiType)) {
            return this.loadSimulationData(`drilldowns/${kpiType}.json`);
        } else {
            throw new Error(`Simulation data not available for KPI type: ${kpiType}`);
        }
    }

    async loadSimulationData(filename) {
        try {
            const response = await fetch(`${this.baseUrl}/${filename}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                ok: true,
                status: 200,
                json: () => Promise.resolve(data),
                text: () => Promise.resolve(JSON.stringify(data))
            };
        } catch (error) {
            console.error(`Failed to load simulation data: ${filename}`, error);
            return {
                ok: false,
                status: 404,
                json: () => Promise.resolve({ error: `Simulation data not found: ${filename}` })
            };
        }
    }

    extractFilename(url) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return filename.includes('.json') ? filename : filename + '.json';
    }

    // Tags API simulation
    async getTags() {
        const response = await this.loadSimulationData('tags.json');
        const data = await response.json();
        return data.tags || [];
    }

    // Device Health API simulation
    async getDeviceHealth() {
        const response = await this.loadSimulationData('device_health.json');
        return await response.json();
    }

    // Export Preview API simulation
    async getExportPreview() {
        const response = await this.loadSimulationData('export_preview.json');
        return await response.json();
    }

    // Generic API call wrapper
    async api(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
        return this.fetch(url, options);
    }

    // Check if simulation mode is enabled
    isSimulationMode() {
        return this.simulationMode;
    }

    // Get simulation badge HTML
    getSimulationBadge() {
        if (!this.simulationMode || !this.config?.ui_config?.show_simulation_badge) {
            return '';
        }

        return `
            <div class="simulation-badge" style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #ff6b6b;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            ">
                🎭 DEMO MODE
            </div>
        `;
    }

    // Initialize simulation mode on the page
    enableSimulationMode() {
        if (this.simulationMode && this.config?.ui_config?.show_simulation_badge) {
            document.body.insertAdjacentHTML('beforeend', this.getSimulationBadge());
        }

        // Disable live controls if configured
        if (this.config?.ui_config?.disable_live_controls) {
            this.disableLiveControls();
        }

        // Add demo tooltips if configured
        if (this.config?.ui_config?.enable_demo_tooltips) {
            this.enableDemoTooltips();
        }
    }

    disableLiveControls() {
        // Disable buttons that would trigger live API calls
        const liveControls = document.querySelectorAll(
            '[data-live-control], .live-only, .refresh-btn, .sync-btn'
        );
        
        liveControls.forEach(control => {
            control.disabled = true;
            control.style.opacity = '0.5';
            control.title = 'Disabled in demo mode';
        });
    }

    enableDemoTooltips() {
        // Add tooltips explaining simulation mode
        const tooltipStyle = `
            position: relative;
            cursor: help;
        `;

        const tooltipText = 'This data is simulated for demo purposes';
        
        document.querySelectorAll('.kpi-tile, .chart-container, .data-table').forEach(element => {
            element.style.cssText += tooltipStyle;
            element.title = tooltipText;
        });
    }
}

// Global simulation client instance
window.simApiClient = new SimulationApiClient();

// Override global fetch for simulation mode
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    if (window.simApiClient && window.simApiClient.isSimulationMode()) {
        return window.simApiClient.fetch(url, options);
    }
    return originalFetch(url, options);
};

// Initialize simulation mode when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.simApiClient) {
        window.simApiClient.enableSimulationMode();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulationApiClient;
}