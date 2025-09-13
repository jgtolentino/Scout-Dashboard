/**
 * Scout Controls Component - v2.5.0
 * JSON-driven global controls system with exact spec compliance
 * PRD Section 4.1 - Zero tolerance for spec violations
 * WCAG 2.1 AA compliant
 */

class ScoutControls {
    constructor(container, configPath = '/config/desired-state.json') {
        this.container = container;
        this.configPath = configPath;
        this.config = null;
        this.state = {
            dateRange: null,
            autoRefresh: null,
            exportMode: null,
            settingsOpen: false
        };
        this.eventListeners = new Map();
        this.autoRefreshInterval = null;
        this.driftDetected = false;
        this.a11yManager = null;
        
        // Performance tracking
        this.performanceMetrics = {
            loadStart: performance.now(),
            renderStart: null,
            renderEnd: null,
            interactionReady: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.performanceMetrics.renderStart = performance.now();
            
            await this.loadConfiguration();
            await this.validateSpecCompliance();
            this.initializeState();
            this.render();
            this.bindEvents();
            this.initializeAccessibility();
            this.startPerformanceMonitoring();
            
            this.performanceMetrics.renderEnd = performance.now();
            this.performanceMetrics.interactionReady = performance.now();
            
            this.reportPerformanceMetrics();
            this.dispatchEvent('scout-controls:ready', { component: this });
            
        } catch (error) {
            console.error('Scout Controls initialization failed:', error);
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
            this.config = fullConfig.page?.controls;
            
            if (!this.config) {
                throw new Error('Controls configuration not found in desired-state.json');
            }
            
            console.log('✅ Scout Controls: Configuration loaded successfully');
            
        } catch (error) {
            console.error('❌ Scout Controls: Configuration load failed:', error);
            throw error;
        }
    }
    
    async validateSpecCompliance() {
        const requiredControls = [
            { key: 'dateRange', type: 'datePicker' },
            { key: 'autoRefresh', type: 'toggle' },
            { key: 'export', type: 'dropdown' },
            { key: 'settings', type: 'menu' }
        ];
        
        const violations = [];
        
        for (const required of requiredControls) {
            const control = this.config[required.key];
            
            if (!control) {
                violations.push(`Missing required control: ${required.key}`);
                continue;
            }
            
            if (control.type !== required.type) {
                violations.push(`Control ${required.key} type mismatch. Expected: ${required.type}, Got: ${control.type}`);
            }
            
            if (control.key !== required.key) {
                violations.push(`Control ${required.key} key mismatch. Expected: ${required.key}, Got: ${control.key}`);
            }
        }
        
        // Validate dateRange specifics
        const dateRange = this.config.dateRange;
        if (dateRange) {
            if (!dateRange.default || !dateRange.default.start || !dateRange.default.end) {
                violations.push('DateRange control missing required default start/end dates');
            }
            
            if (dateRange.format !== 'MMM DD – MMM DD, YYYY') {
                violations.push(`DateRange format mismatch. Expected: 'MMM DD – MMM DD, YYYY', Got: '${dateRange.format}'`);
            }
        }
        
        // Validate autoRefresh specifics
        const autoRefresh = this.config.autoRefresh;
        if (autoRefresh) {
            if (typeof autoRefresh.default !== 'boolean') {
                violations.push('AutoRefresh default must be boolean');
            }
            
            if (!autoRefresh.interval || typeof autoRefresh.interval !== 'number') {
                violations.push('AutoRefresh interval must be a number');
            }
        }
        
        // Validate export specifics
        const exportControl = this.config.export;
        if (exportControl) {
            if (!Array.isArray(exportControl.options) || exportControl.options.length !== 2) {
                violations.push('Export control must have exactly 2 options');
            } else {
                const expectedOptions = [
                    { value: 'current', label: 'This Visual' },
                    { value: 'full', label: 'Full Dashboard' }
                ];
                
                for (let i = 0; i < expectedOptions.length; i++) {
                    const expected = expectedOptions[i];
                    const actual = exportControl.options[i];
                    
                    if (!actual || actual.value !== expected.value || actual.label !== expected.label) {
                        violations.push(`Export option ${i} spec violation. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
                    }
                }
            }
        }
        
        if (violations.length > 0) {
            this.driftDetected = true;
            const error = new Error(`SPEC COMPLIANCE FAILURE - Scout Controls drift detected:\n${violations.join('\n')}`);
            error.name = 'SpecComplianceError';
            error.violations = violations;
            
            // Report to CI system
            this.reportDriftViolation(violations);
            throw error;
        }
        
        console.log('✅ Scout Controls: Spec compliance validated');
    }
    
    initializeState() {
        // Initialize dateRange from config
        if (this.config.dateRange?.default) {
            this.state.dateRange = {
                start: new Date(this.config.dateRange.default.start),
                end: new Date(this.config.dateRange.default.end)
            };
        }
        
        // Initialize autoRefresh from config
        this.state.autoRefresh = this.config.autoRefresh?.default ?? true;
        
        // Initialize exportMode
        this.state.exportMode = this.config.export?.options?.[0]?.value ?? 'current';
        
        // Initialize settings
        this.state.settingsOpen = false;
        
        console.log('🎯 Scout Controls: State initialized:', this.state);
    }
    
    render() {
        if (!this.container) {
            throw new Error('Scout Controls: Container element not found');
        }
        
        const controlsHTML = `
            <div class="scout-controls" 
                 role="toolbar" 
                 aria-label="Dashboard Controls"
                 data-component="scout-controls"
                 data-version="2.5.0">
                
                <!-- Date Range Control -->
                <div class="scout-control scout-control--date-range" data-control="dateRange">
                    <label for="scout-date-range" class="scout-control__label">
                        ${this.config.dateRange.label}
                    </label>
                    <div class="scout-date-picker" role="group" aria-labelledby="scout-date-range-label">
                        <button type="button" 
                                id="scout-date-range"
                                class="scout-date-picker__trigger"
                                aria-haspopup="dialog"
                                aria-expanded="false"
                                aria-describedby="scout-date-range-help">
                            <span class="material-icons" aria-hidden="true">date_range</span>
                            <span class="scout-date-picker__value">${this.formatDateRange()}</span>
                            <span class="material-icons scout-date-picker__arrow" aria-hidden="true">keyboard_arrow_down</span>
                        </button>
                        <div id="scout-date-range-help" class="scout-control__help sr-only">
                            Press Enter or Space to open date range picker
                        </div>
                    </div>
                </div>
                
                <!-- Auto Refresh Control -->
                <div class="scout-control scout-control--auto-refresh" data-control="autoRefresh">
                    <label class="scout-toggle" for="scout-auto-refresh">
                        <input type="checkbox" 
                               id="scout-auto-refresh"
                               class="scout-toggle__input"
                               ${this.state.autoRefresh ? 'checked' : ''}
                               aria-describedby="scout-auto-refresh-help">
                        <span class="scout-toggle__slider"></span>
                        <span class="scout-toggle__label">${this.config.autoRefresh.label}</span>
                    </label>
                    <div id="scout-auto-refresh-help" class="scout-control__help sr-only">
                        Toggle automatic dashboard refresh every 15 minutes
                    </div>
                </div>
                
                <!-- Export Control -->
                <div class="scout-control scout-control--export" data-control="export">
                    <label for="scout-export" class="scout-control__label">
                        ${this.config.export.label}
                    </label>
                    <div class="scout-dropdown" role="group">
                        <button type="button"
                                id="scout-export"
                                class="scout-dropdown__trigger"
                                aria-haspopup="listbox"
                                aria-expanded="false"
                                aria-describedby="scout-export-help">
                            <span class="material-icons" aria-hidden="true">file_download</span>
                            <span class="scout-dropdown__value">${this.getExportLabel()}</span>
                            <span class="material-icons scout-dropdown__arrow" aria-hidden="true">keyboard_arrow_down</span>
                        </button>
                        <ul class="scout-dropdown__menu" role="listbox" aria-hidden="true">
                            ${this.config.export.options.map(option => `
                                <li role="option" 
                                    class="scout-dropdown__option ${option.value === this.state.exportMode ? 'scout-dropdown__option--selected' : ''}"
                                    data-value="${option.value}"
                                    aria-selected="${option.value === this.state.exportMode}">
                                    ${option.label}
                                </li>
                            `).join('')}
                        </ul>
                        <div id="scout-export-help" class="scout-control__help sr-only">
                            Select export scope for dashboard data
                        </div>
                    </div>
                </div>
                
                <!-- Settings Control -->
                <div class="scout-control scout-control--settings" data-control="settings">
                    <button type="button"
                            class="scout-settings-trigger"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            aria-label="${this.config.settings.label}"
                            aria-describedby="scout-settings-help">
                        <span class="material-icons" aria-hidden="true">settings</span>
                    </button>
                    <div class="scout-settings-menu" role="menu" aria-hidden="true">
                        <div class="scout-settings-menu__header">
                            <h3>Dashboard Settings</h3>
                        </div>
                        <div class="scout-settings-menu__content">
                            <div class="scout-settings-section">
                                <h4>Display</h4>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-high-contrast">
                                    <span>High Contrast Mode</span>
                                </label>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-animations" checked>
                                    <span>Enable Animations</span>
                                </label>
                            </div>
                            <div class="scout-settings-section">
                                <h4>Performance</h4>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-lazy-load" checked>
                                    <span>Lazy Load Charts</span>
                                </label>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-data-cache" checked>
                                    <span>Cache Data Locally</span>
                                </label>
                            </div>
                            <div class="scout-settings-section">
                                <h4>Accessibility</h4>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-screen-reader">
                                    <span>Enhanced Screen Reader</span>
                                </label>
                                <label class="scout-settings-option">
                                    <input type="checkbox" id="scout-keyboard-nav" checked>
                                    <span>Enhanced Keyboard Navigation</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div id="scout-settings-help" class="scout-control__help sr-only">
                        Open settings menu for display and accessibility options
                    </div>
                </div>
                
                <!-- Performance Indicator -->
                <div class="scout-control scout-control--performance" aria-hidden="true">
                    <div class="scout-performance-indicator" title="Dashboard Performance">
                        <span class="material-icons scout-performance-icon">speed</span>
                        <span class="scout-performance-value">--ms</span>
                    </div>
                </div>
                
                <!-- Error Boundary -->
                <div class="scout-controls__error-boundary" role="alert" aria-live="polite" aria-hidden="true">
                    <span class="material-icons">error</span>
                    <span class="scout-error-message"></span>
                </div>
            </div>
        `;
        
        this.container.innerHTML = controlsHTML;
        
        // Initialize date picker modal
        this.initializeDatePicker();
        
        console.log('🎨 Scout Controls: Rendered successfully');
    }
    
    initializeDatePicker() {
        const datePickerModal = `
            <div class="scout-date-picker-modal" role="dialog" aria-modal="true" aria-labelledby="date-picker-title" aria-hidden="true">
                <div class="scout-date-picker-modal__backdrop"></div>
                <div class="scout-date-picker-modal__content">
                    <div class="scout-date-picker-modal__header">
                        <h2 id="date-picker-title">Select Date Range</h2>
                        <button type="button" class="scout-date-picker-modal__close" aria-label="Close date picker">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="scout-date-picker-modal__body">
                        <div class="scout-date-picker-inputs">
                            <div class="scout-date-input">
                                <label for="scout-start-date">Start Date</label>
                                <input type="date" 
                                       id="scout-start-date" 
                                       value="${this.state.dateRange.start.toISOString().split('T')[0]}"
                                       aria-describedby="start-date-help">
                                <div id="start-date-help" class="scout-help-text">
                                    Select the start date for data analysis
                                </div>
                            </div>
                            <div class="scout-date-input">
                                <label for="scout-end-date">End Date</label>
                                <input type="date" 
                                       id="scout-end-date" 
                                       value="${this.state.dateRange.end.toISOString().split('T')[0]}"
                                       aria-describedby="end-date-help">
                                <div id="end-date-help" class="scout-help-text">
                                    Select the end date for data analysis
                                </div>
                            </div>
                        </div>
                        <div class="scout-date-picker-presets">
                            <h3>Quick Select</h3>
                            <div class="scout-preset-buttons">
                                <button type="button" class="scout-preset-btn" data-preset="7d">Last 7 Days</button>
                                <button type="button" class="scout-preset-btn" data-preset="30d">Last 30 Days</button>
                                <button type="button" class="scout-preset-btn" data-preset="90d">Last 90 Days</button>
                                <button type="button" class="scout-preset-btn" data-preset="ytd">Year to Date</button>
                            </div>
                        </div>
                    </div>
                    <div class="scout-date-picker-modal__footer">
                        <button type="button" class="scout-btn scout-btn--secondary" data-action="cancel">Cancel</button>
                        <button type="button" class="scout-btn scout-btn--primary" data-action="apply">Apply</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', datePickerModal);
    }
    
    bindEvents() {
        // Date Range Events
        const dateRangeTrigger = this.container.querySelector('.scout-date-picker__trigger');
        if (dateRangeTrigger) {
            this.addEventListener(dateRangeTrigger, 'click', this.openDatePicker.bind(this));
            this.addEventListener(dateRangeTrigger, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openDatePicker();
                }
            });
        }
        
        // Auto Refresh Events
        const autoRefreshToggle = this.container.querySelector('#scout-auto-refresh');
        if (autoRefreshToggle) {
            this.addEventListener(autoRefreshToggle, 'change', this.handleAutoRefreshToggle.bind(this));
        }
        
        // Export Events
        const exportTrigger = this.container.querySelector('.scout-dropdown__trigger');
        if (exportTrigger) {
            this.addEventListener(exportTrigger, 'click', this.toggleExportDropdown.bind(this));
            this.addEventListener(exportTrigger, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleExportDropdown();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.openExportDropdown();
                    this.focusFirstExportOption();
                }
            });
        }
        
        // Export Option Events
        const exportOptions = this.container.querySelectorAll('.scout-dropdown__option');
        exportOptions.forEach(option => {
            this.addEventListener(option, 'click', () => {
                this.selectExportOption(option.dataset.value);
            });
            this.addEventListener(option, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectExportOption(option.dataset.value);
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusNextExportOption(option);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusPreviousExportOption(option);
                }
                if (e.key === 'Escape') {
                    this.closeExportDropdown();
                    exportTrigger.focus();
                }
            });
        });
        
        // Settings Events
        const settingsTrigger = this.container.querySelector('.scout-settings-trigger');
        if (settingsTrigger) {
            this.addEventListener(settingsTrigger, 'click', this.toggleSettingsMenu.bind(this));
            this.addEventListener(settingsTrigger, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSettingsMenu();
                }
            });
        }
        
        // Date Picker Modal Events
        this.bindDatePickerEvents();
        
        // Global Events
        this.addEventListener(document, 'click', this.handleGlobalClick.bind(this));
        this.addEventListener(document, 'keydown', this.handleGlobalKeydown.bind(this));
        
        // Auto-refresh implementation
        if (this.state.autoRefresh) {
            this.startAutoRefresh();
        }
        
        console.log('🔗 Scout Controls: Events bound successfully');
    }
    
    bindDatePickerEvents() {
        const modal = document.querySelector('.scout-date-picker-modal');
        if (!modal) return;
        
        // Close button
        const closeBtn = modal.querySelector('.scout-date-picker-modal__close');
        this.addEventListener(closeBtn, 'click', this.closeDatePicker.bind(this));
        
        // Cancel button
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        this.addEventListener(cancelBtn, 'click', this.closeDatePicker.bind(this));
        
        // Apply button
        const applyBtn = modal.querySelector('[data-action="apply"]');
        this.addEventListener(applyBtn, 'click', this.applyDateRange.bind(this));
        
        // Preset buttons
        const presetBtns = modal.querySelectorAll('.scout-preset-btn');
        presetBtns.forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                this.applyDatePreset(btn.dataset.preset);
            });
        });
        
        // Backdrop click
        const backdrop = modal.querySelector('.scout-date-picker-modal__backdrop');
        this.addEventListener(backdrop, 'click', this.closeDatePicker.bind(this));
        
        // Escape key
        this.addEventListener(modal, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDatePicker();
            }
        });
    }
    
    initializeAccessibility() {
        this.a11yManager = {
            focusableElements: this.container.querySelectorAll(
                'button, input, [tabindex]:not([tabindex="-1"])'
            ),
            trapFocus: (container) => {
                const focusable = container.querySelectorAll(
                    'button, input, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                
                container.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey && document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        } else if (!e.shiftKey && document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                });
            }
        };
        
        // High contrast mode
        this.addEventListener(document.getElementById('scout-high-contrast'), 'change', (e) => {
            document.body.classList.toggle('scout-high-contrast', e.target.checked);
        });
        
        // Screen reader enhancements
        this.addEventListener(document.getElementById('scout-screen-reader'), 'change', (e) => {
            document.body.classList.toggle('scout-screen-reader-enhanced', e.target.checked);
        });
        
        console.log('♿ Scout Controls: Accessibility features initialized');
    }
    
    startPerformanceMonitoring() {
        const performanceIndicator = this.container.querySelector('.scout-performance-value');
        
        setInterval(() => {
            const loadTime = this.performanceMetrics.renderEnd - this.performanceMetrics.loadStart;
            if (performanceIndicator) {
                performanceIndicator.textContent = `${Math.round(loadTime)}ms`;
            }
        }, 5000);
    }
    
    // Date Range Methods
    formatDateRange() {
        const { start, end } = this.state.dateRange;
        const format = this.config.dateRange.format;
        
        // Parse format: "MMM DD – MMM DD, YYYY"
        const startFormatted = this.formatDate(start, 'MMM DD');
        const endFormatted = this.formatDate(end, 'MMM DD, YYYY');
        
        return `${startFormatted} – ${endFormatted}`;
    }
    
    formatDate(date, format) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (format === 'MMM DD') {
            return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
        }
        
        if (format === 'MMM DD, YYYY') {
            return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
        }
        
        return date.toLocaleDateString();
    }
    
    openDatePicker() {
        const modal = document.querySelector('.scout-date-picker-modal');
        const trigger = this.container.querySelector('.scout-date-picker__trigger');
        
        modal.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
        modal.style.display = 'flex';
        
        // Focus first input
        const firstInput = modal.querySelector('#scout-start-date');
        firstInput.focus();
        
        // Trap focus
        this.a11yManager.trapFocus(modal);
        
        this.dispatchEvent('scout-controls:datepicker-opened');
    }
    
    closeDatePicker() {
        const modal = document.querySelector('.scout-date-picker-modal');
        const trigger = this.container.querySelector('.scout-date-picker__trigger');
        
        modal.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        modal.style.display = 'none';
        
        // Return focus to trigger
        trigger.focus();
        
        this.dispatchEvent('scout-controls:datepicker-closed');
    }
    
    applyDateRange() {
        const startInput = document.getElementById('scout-start-date');
        const endInput = document.getElementById('scout-end-date');
        
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);
        
        if (startDate > endDate) {
            this.showError('Start date cannot be after end date');
            return;
        }
        
        this.state.dateRange = { start: startDate, end: endDate };
        
        // Update UI
        const valueElement = this.container.querySelector('.scout-date-picker__value');
        valueElement.textContent = this.formatDateRange();
        
        this.closeDatePicker();
        this.dispatchEvent('scout-controls:daterange-changed', { 
            dateRange: this.state.dateRange 
        });
    }
    
    applyDatePreset(preset) {
        const today = new Date();
        let startDate, endDate = new Date(today);
        
        switch (preset) {
            case '7d':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                break;
            case '30d':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                break;
            case '90d':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 90);
                break;
            case 'ytd':
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                return;
        }
        
        // Update inputs
        document.getElementById('scout-start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('scout-end-date').value = endDate.toISOString().split('T')[0];
    }
    
    // Auto Refresh Methods
    handleAutoRefreshToggle(event) {
        this.state.autoRefresh = event.target.checked;
        
        if (this.state.autoRefresh) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
        
        this.dispatchEvent('scout-controls:autorefresh-changed', { 
            autoRefresh: this.state.autoRefresh 
        });
    }
    
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        const interval = this.config.autoRefresh.interval || 900000; // 15 minutes
        this.autoRefreshInterval = setInterval(() => {
            this.dispatchEvent('scout-controls:refresh-requested');
        }, interval);
        
        console.log(`🔄 Scout Controls: Auto-refresh started (${interval}ms interval)`);
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        console.log('⏹️ Scout Controls: Auto-refresh stopped');
    }
    
    // Export Methods
    getExportLabel() {
        const option = this.config.export.options.find(opt => opt.value === this.state.exportMode);
        return option ? option.label : 'Export';
    }
    
    toggleExportDropdown() {
        const dropdown = this.container.querySelector('.scout-dropdown');
        const trigger = dropdown.querySelector('.scout-dropdown__trigger');
        const menu = dropdown.querySelector('.scout-dropdown__menu');
        
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
            this.closeExportDropdown();
        } else {
            this.openExportDropdown();
        }
    }
    
    openExportDropdown() {
        const dropdown = this.container.querySelector('.scout-dropdown');
        const trigger = dropdown.querySelector('.scout-dropdown__trigger');
        const menu = dropdown.querySelector('.scout-dropdown__menu');
        
        trigger.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
        dropdown.classList.add('scout-dropdown--open');
    }
    
    closeExportDropdown() {
        const dropdown = this.container.querySelector('.scout-dropdown');
        const trigger = dropdown.querySelector('.scout-dropdown__trigger');
        const menu = dropdown.querySelector('.scout-dropdown__menu');
        
        trigger.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        dropdown.classList.remove('scout-dropdown--open');
    }
    
    selectExportOption(value) {
        this.state.exportMode = value;
        
        // Update UI
        const valueElement = this.container.querySelector('.scout-dropdown__value');
        valueElement.textContent = this.getExportLabel();
        
        // Update options
        const options = this.container.querySelectorAll('.scout-dropdown__option');
        options.forEach(option => {
            const isSelected = option.dataset.value === value;
            option.classList.toggle('scout-dropdown__option--selected', isSelected);
            option.setAttribute('aria-selected', isSelected);
        });
        
        this.closeExportDropdown();
        this.dispatchEvent('scout-controls:export-mode-changed', { 
            exportMode: this.state.exportMode 
        });
    }
    
    focusFirstExportOption() {
        const firstOption = this.container.querySelector('.scout-dropdown__option');
        if (firstOption) firstOption.focus();
    }
    
    focusNextExportOption(current) {
        const next = current.nextElementSibling;
        if (next) next.focus();
    }
    
    focusPreviousExportOption(current) {
        const prev = current.previousElementSibling;
        if (prev) prev.focus();
    }
    
    // Settings Methods
    toggleSettingsMenu() {
        const settingsMenu = this.container.querySelector('.scout-settings-menu');
        const trigger = this.container.querySelector('.scout-settings-trigger');
        
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
            this.closeSettingsMenu();
        } else {
            this.openSettingsMenu();
        }
    }
    
    openSettingsMenu() {
        const settingsMenu = this.container.querySelector('.scout-settings-menu');
        const trigger = this.container.querySelector('.scout-settings-trigger');
        
        trigger.setAttribute('aria-expanded', 'true');
        settingsMenu.setAttribute('aria-hidden', 'false');
        settingsMenu.classList.add('scout-settings-menu--open');
        
        // Focus first option
        const firstOption = settingsMenu.querySelector('input');
        if (firstOption) firstOption.focus();
        
        this.dispatchEvent('scout-controls:settings-opened');
    }
    
    closeSettingsMenu() {
        const settingsMenu = this.container.querySelector('.scout-settings-menu');
        const trigger = this.container.querySelector('.scout-settings-trigger');
        
        trigger.setAttribute('aria-expanded', 'false');
        settingsMenu.setAttribute('aria-hidden', 'true');
        settingsMenu.classList.remove('scout-settings-menu--open');
        
        this.dispatchEvent('scout-controls:settings-closed');
    }
    
    // Global Event Handlers
    handleGlobalClick(event) {
        const isInsideExportDropdown = event.target.closest('.scout-dropdown');
        const isInsideSettings = event.target.closest('.scout-control--settings');
        const isInsideDatePicker = event.target.closest('.scout-date-picker-modal');
        
        if (!isInsideExportDropdown) {
            this.closeExportDropdown();
        }
        
        if (!isInsideSettings) {
            this.closeSettingsMenu();
        }
    }
    
    handleGlobalKeydown(event) {
        if (event.key === 'Escape') {
            this.closeExportDropdown();
            this.closeSettingsMenu();
        }
    }
    
    // Error Handling
    showError(message) {
        const errorBoundary = this.container.querySelector('.scout-controls__error-boundary');
        const errorMessage = errorBoundary.querySelector('.scout-error-message');
        
        errorMessage.textContent = message;
        errorBoundary.setAttribute('aria-hidden', 'false');
        errorBoundary.classList.add('scout-controls__error-boundary--visible');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        const errorBoundary = this.container.querySelector('.scout-controls__error-boundary');
        errorBoundary.setAttribute('aria-hidden', 'true');
        errorBoundary.classList.remove('scout-controls__error-boundary--visible');
    }
    
    handleFallback(error) {
        console.error('Scout Controls fallback activated:', error);
        
        // Minimal fallback UI
        this.container.innerHTML = `
            <div class="scout-controls scout-controls--fallback" role="toolbar" aria-label="Dashboard Controls (Fallback Mode)">
                <div class="scout-control-fallback">
                    <button type="button" class="scout-btn scout-btn--secondary">
                        <span class="material-icons">date_range</span>
                        Date Range
                    </button>
                </div>
                <div class="scout-control-fallback">
                    <label class="scout-toggle-fallback">
                        <input type="checkbox" checked>
                        <span>Auto-refresh</span>
                    </label>
                </div>
                <div class="scout-control-fallback">
                    <button type="button" class="scout-btn scout-btn--secondary">
                        <span class="material-icons">file_download</span>
                        Export
                    </button>
                </div>
                <div class="scout-control-fallback">
                    <button type="button" class="scout-btn scout-btn--secondary">
                        <span class="material-icons">settings</span>
                        Settings
                    </button>
                </div>
                <div class="scout-error-notice" role="alert">
                    ⚠️ Controls running in fallback mode. ${error.message}
                </div>
            </div>
        `;
        
        this.dispatchEvent('scout-controls:fallback-activated', { error });
    }
    
    // Drift Detection and Reporting
    reportDriftViolation(violations) {
        const driftReport = {
            timestamp: new Date().toISOString(),
            component: 'scout-controls',
            version: '2.5.0',
            violations: violations,
            configPath: this.configPath,
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };
        
        // Report to CI system (if available)
        if (window.CI_DRIFT_ENDPOINT) {
            fetch(window.CI_DRIFT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driftReport)
            }).catch(err => console.error('Failed to report drift:', err));
        }
        
        // Log to console
        console.error('🚨 DRIFT DETECTED - Scout Controls:', driftReport);
        
        // Store locally for debugging
        localStorage.setItem('scout-controls-drift-report', JSON.stringify(driftReport));
    }
    
    reportPerformanceMetrics() {
        const metrics = {
            loadTime: this.performanceMetrics.renderEnd - this.performanceMetrics.loadStart,
            renderTime: this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart,
            interactionReady: this.performanceMetrics.interactionReady - this.performanceMetrics.loadStart,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        console.log('📊 Scout Controls Performance Metrics:', metrics);
        
        // Report to analytics (if available)
        if (window.ANALYTICS_ENDPOINT) {
            fetch(window.ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'scout-controls-performance',
                    metrics: metrics
                })
            }).catch(err => console.error('Failed to report metrics:', err));
        }
    }
    
    // Event Management
    addEventListener(element, event, handler) {
        if (!element) return;
        
        element.addEventListener(event, handler);
        
        // Store for cleanup
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
        console.log(`📡 Scout Controls: Event dispatched - ${eventName}`, detail);
    }
    
    // Public API
    updateDateRange(start, end) {
        this.state.dateRange = { 
            start: new Date(start), 
            end: new Date(end) 
        };
        
        const valueElement = this.container.querySelector('.scout-date-picker__value');
        if (valueElement) {
            valueElement.textContent = this.formatDateRange();
        }
        
        this.dispatchEvent('scout-controls:daterange-updated', { 
            dateRange: this.state.dateRange 
        });
    }
    
    setAutoRefresh(enabled) {
        this.state.autoRefresh = enabled;
        
        const toggle = this.container.querySelector('#scout-auto-refresh');
        if (toggle) {
            toggle.checked = enabled;
        }
        
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }
    
    setExportMode(mode) {
        if (this.config.export.options.some(opt => opt.value === mode)) {
            this.selectExportOption(mode);
        }
    }
    
    getState() {
        return { ...this.state };
    }
    
    // Cleanup
    destroy() {
        // Clear auto-refresh
        this.stopAutoRefresh();
        
        // Remove event listeners
        this.eventListeners.forEach(listeners => {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
        
        // Remove date picker modal
        const modal = document.querySelector('.scout-date-picker-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('🧹 Scout Controls: Destroyed successfully');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoutControls;
}

// Global registration
if (typeof window !== 'undefined') {
    window.ScoutControls = ScoutControls;
}