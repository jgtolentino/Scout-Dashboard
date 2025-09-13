/**
 * Configuration Consolidator - PATCH 1: Nav cleanup & config.js consolidation
 * Centralizes configuration management and eliminates config duplicates
 * 
 * PRD Sections Addressed:
 * - Section 5: User Interface (Consistent configuration management)
 * - Section 8: System Configuration (Centralized config structure)
 * 
 * Namespace: PATCH1_ConfigConsolidator
 */

class PATCH1_ConfigConsolidator {
    constructor() {
        this.namespace = 'PATCH1_ConfigConsolidator';
        this.configs = new Map();
        this.listeners = new Set();
        this.initialized = false;
        
        // Master configuration schema
        this.masterConfig = {
            version: '2.4.0',
            buildNumber: Date.now(),
            environment: this.detectEnvironment(),
            
            // Dashboard Configuration
            dashboard: {
                title: 'Client360 Dashboard',
                theme: 'tbwa-corporate',
                layout: 'sidebar-left',
                refreshInterval: 30000, // 30 seconds
                autoSave: true,
                maxRetries: 3
            },
            
            // Navigation Configuration
            navigation: {
                defaultSection: 'kpi-summary',
                collapsible: true,
                persistState: true,
                animations: true,
                mobileBreakpoint: 768
            },
            
            // Data Configuration
            data: {
                endpoints: {
                    base: this.getApiBaseUrl(),
                    brands: '/api/brands',
                    transactions: '/api/transactions',
                    locations: '/api/locations',
                    insights: '/api/insights',
                    analytics: '/api/analytics'
                },
                timeout: 10000,
                retryAttempts: 2,
                cacheTimeout: 300000 // 5 minutes
            },
            
            // UI Configuration
            ui: {
                animations: {
                    duration: 300,
                    easing: 'ease-in-out'
                },
                charts: {
                    defaultHeight: 300,
                    colors: [
                        '#4CAF50', '#2196F3', '#FF9800', '#E91E63',
                        '#9C27B0', '#00BCD4', '#8BC34A', '#FFC107'
                    ],
                    responsive: true
                },
                filters: {
                    debounceDelay: 300,
                    maxItems: 1000,
                    showClearAll: true
                }
            },
            
            // Features Configuration
            features: {
                aiInsights: true,
                realTimeUpdates: true,
                offlineMode: false,
                exportFunctionality: true,
                userPersonalization: true,
                feedbackSystem: true,
                qaOverlay: this.isDevelopment(),
                debugMode: this.isDevelopment()
            },
            
            // Security Configuration
            security: {
                sessionTimeout: 3600000, // 1 hour
                maxLoginAttempts: 3,
                encryptLocalStorage: true,
                sanitizeInput: true
            },
            
            // Patches Configuration
            patches: {
                enabled: true,
                namespace: 'PATCH1_',
                conflictResolution: 'latest-wins',
                isolationMode: true
            }
        };
        
        this.init();
    }

    init() {
        this.consolidateExistingConfigs();
        this.validateConfiguration();
        this.setupConfigWatcher();
        this.registerGlobalConfig();
        this.initialized = true;
        
        console.log(`[${this.namespace}] Configuration consolidated successfully`);
    }

    consolidateExistingConfigs() {
        // Find and consolidate scattered config objects
        const configSources = [
            'window.config',
            'window.dashboardConfig',
            'window.appConfig',
            'window.CLIENT360_CONFIG',
            'localStorage.getItem("dashboard-config")',
            'localStorage.getItem("client360-config")'
        ];
        
        configSources.forEach(source => {
            try {
                let config = null;
                
                if (source.includes('localStorage')) {
                    const key = source.match(/"([^"]+)"/)[1];
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        config = JSON.parse(stored);
                    }
                } else {
                    const path = source.split('.');
                    config = path.reduce((obj, key) => obj && obj[key], window);
                }
                
                if (config && typeof config === 'object') {
                    this.mergeConfig(config, source);
                    console.log(`[${this.namespace}] Merged config from ${source}`);
                }
            } catch (error) {
                console.warn(`[${this.namespace}] Failed to merge config from ${source}:`, error);
            }
        });
    }

    mergeConfig(sourceConfig, sourceName) {
        // Deep merge source config into master config
        this.deepMerge(this.masterConfig, sourceConfig);
        
        // Track the source for debugging
        if (!this.masterConfig._sources) {
            this.masterConfig._sources = [];
        }
        this.masterConfig._sources.push({
            name: sourceName,
            timestamp: Date.now(),
            keys: Object.keys(sourceConfig)
        });
    }

    deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    validateConfiguration() {
        const required = [
            'dashboard.title',
            'navigation.defaultSection',
            'data.endpoints.base',
            'ui.charts.colors'
        ];
        
        const missing = required.filter(path => !this.getConfigValue(path));
        
        if (missing.length > 0) {
            console.warn(`[${this.namespace}] Missing required config values:`, missing);
        }
        
        // Validate data types
        this.validateDataTypes();
    }

    validateDataTypes() {
        const validations = [
            { path: 'dashboard.refreshInterval', type: 'number', min: 1000 },
            { path: 'navigation.mobileBreakpoint', type: 'number', min: 320 },
            { path: 'data.timeout', type: 'number', min: 1000 },
            { path: 'ui.animations.duration', type: 'number', min: 0 },
            { path: 'features.aiInsights', type: 'boolean' },
            { path: 'features.debugMode', type: 'boolean' }
        ];
        
        validations.forEach(({ path, type, min }) => {
            const value = this.getConfigValue(path);
            
            if (value !== undefined) {
                if (typeof value !== type) {
                    console.warn(`[${this.namespace}] Invalid type for ${path}: expected ${type}, got ${typeof value}`);
                }
                
                if (type === 'number' && min !== undefined && value < min) {
                    console.warn(`[${this.namespace}] Value for ${path} below minimum: ${value} < ${min}`);
                }
            }
        });
    }

    setupConfigWatcher() {
        // Watch for external config changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-config') {
                    this.handleExternalConfigChange(mutation.target);
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-config']
        });
        
        // Watch localStorage for config changes
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('config')) {
                this.handleStorageConfigChange(e);
            }
        });
    }

    handleExternalConfigChange(element) {
        try {
            const newConfig = JSON.parse(element.dataset.config);
            this.mergeConfig(newConfig, 'external-attribute');
            this.notifyListeners('external-change', newConfig);
        } catch (error) {
            console.error(`[${this.namespace}] Failed to parse external config:`, error);
        }
    }

    handleStorageConfigChange(event) {
        try {
            if (event.newValue) {
                const newConfig = JSON.parse(event.newValue);
                this.mergeConfig(newConfig, `localStorage-${event.key}`);
                this.notifyListeners('storage-change', { key: event.key, config: newConfig });
            }
        } catch (error) {
            console.error(`[${this.namespace}] Failed to parse storage config:`, error);
        }
    }

    registerGlobalConfig() {
        // Clean up existing global configs
        delete window.config;
        delete window.dashboardConfig;
        delete window.appConfig;
        delete window.CLIENT360_CONFIG;
        
        // Register consolidated config
        window.PATCH1_CONFIG = this.masterConfig;
        
        // Provide backward compatibility accessors
        Object.defineProperty(window, 'config', {
            get: () => this.masterConfig,
            configurable: true
        });
        
        Object.defineProperty(window, 'dashboardConfig', {
            get: () => this.masterConfig.dashboard,
            configurable: true
        });
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('patch1-consolidated-config', JSON.stringify(this.masterConfig));
        } catch (error) {
            console.warn(`[${this.namespace}] Failed to save config to localStorage:`, error);
        }
    }

    // Public API methods
    getConfig(namespace = null) {
        if (namespace) {
            return this.configs.get(namespace) || {};
        }
        return this.masterConfig;
    }

    getConfigValue(path, defaultValue = undefined) {
        const keys = path.split('.');
        let value = this.masterConfig;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    setConfigValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.masterConfig;
        
        // Navigate to parent object
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Set the value
        target[lastKey] = value;
        
        // Persist changes
        this.persistConfig();
        
        // Notify listeners
        this.notifyListeners('value-changed', { path, value, timestamp: Date.now() });
        
        console.log(`[${this.namespace}] Config updated: ${path} = ${JSON.stringify(value)}`);
    }

    updateConfig(updates) {
        if (typeof updates === 'object' && updates !== null) {
            this.deepMerge(this.masterConfig, updates);
            this.persistConfig();
            this.notifyListeners('config-updated', { updates, timestamp: Date.now() });
            
            console.log(`[${this.namespace}] Config bulk updated:`, Object.keys(updates));
        }
    }

    resetConfig(section = null) {
        if (section) {
            // Reset specific section
            const defaultValue = this.getDefaultConfigSection(section);
            if (defaultValue) {
                this.masterConfig[section] = defaultValue;
                this.persistConfig();
                this.notifyListeners('section-reset', { section, timestamp: Date.now() });
            }
        } else {
            // Reset entire config
            this.masterConfig = this.createDefaultConfig();
            this.persistConfig();
            this.notifyListeners('config-reset', { timestamp: Date.now() });
        }
    }

    onConfigChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data, this.masterConfig);
            } catch (error) {
                console.error(`[${this.namespace}] Listener error:`, error);
            }
        });
    }

    persistConfig() {
        try {
            localStorage.setItem('patch1-consolidated-config', JSON.stringify(this.masterConfig));
            
            // Update timestamp
            this.masterConfig._lastUpdated = Date.now();
        } catch (error) {
            console.warn(`[${this.namespace}] Failed to persist config:`, error);
        }
    }

    exportConfig(format = 'json') {
        const exportData = {
            ...this.masterConfig,
            _exportedAt: new Date().toISOString(),
            _version: this.masterConfig.version
        };
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'yaml':
                // Basic YAML export (would need yaml library for full support)
                return this.jsonToYaml(exportData);
            case 'js':
                return `// Client360 Dashboard Configuration v${this.masterConfig.version}\nwindow.CLIENT360_CONFIG = ${JSON.stringify(exportData, null, 2)};`;
            default:
                return exportData;
        }
    }

    importConfig(configData, format = 'json') {
        try {
            let parsed;
            
            switch (format.toLowerCase()) {
                case 'json':
                    parsed = typeof configData === 'string' ? JSON.parse(configData) : configData;
                    break;
                case 'js':
                    // Extract JSON from JS config file
                    const match = configData.match(/window\.CLIENT360_CONFIG\s*=\s*(\{.*\});/s);
                    if (match) {
                        parsed = JSON.parse(match[1]);
                    }
                    break;
                default:
                    parsed = configData;
            }
            
            if (parsed && typeof parsed === 'object') {
                this.updateConfig(parsed);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`[${this.namespace}] Failed to import config:`, error);
            return false;
        }
    }

    // Helper methods
    detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('dev')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        return 'unknown';
    }

    isDevelopment() {
        return this.detectEnvironment() === 'development';
    }

    getApiBaseUrl() {
        const env = this.detectEnvironment();
        switch (env) {
            case 'development':
                return 'http://localhost:3000';
            case 'staging':
                return 'https://api-staging.client360.com';
            case 'production':
                return 'https://api.client360.com';
            default:
                return '/api';
        }
    }

    getDefaultConfigSection(section) {
        const defaults = this.createDefaultConfig();
        return defaults[section];
    }

    createDefaultConfig() {
        // Return a fresh copy of default configuration
        return JSON.parse(JSON.stringify(this.masterConfig));
    }

    jsonToYaml(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let result = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
            } else if (Array.isArray(value)) {
                result += `${spaces}${key}:\n`;
                value.forEach(item => {
                    result += `${spaces}  - ${JSON.stringify(item)}\n`;
                });
            } else {
                result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
            }
        }
        
        return result;
    }

    // Debug methods
    getConfigStats() {
        return {
            totalKeys: this.countKeys(this.masterConfig),
            sources: this.masterConfig._sources || [],
            lastUpdated: this.masterConfig._lastUpdated,
            environment: this.masterConfig.environment,
            version: this.masterConfig.version,
            listeners: this.listeners.size
        };
    }

    countKeys(obj, count = 0) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                count++;
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    count = this.countKeys(obj[key], count);
                }
            }
        }
        return count;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PATCH1_ConfigConsolidator = new PATCH1_ConfigConsolidator();
    });
} else {
    window.PATCH1_ConfigConsolidator = new PATCH1_ConfigConsolidator();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PATCH1_ConfigConsolidator;
}