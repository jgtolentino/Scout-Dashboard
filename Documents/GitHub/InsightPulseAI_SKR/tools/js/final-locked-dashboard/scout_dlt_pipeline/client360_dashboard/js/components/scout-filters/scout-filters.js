/**
 * Scout Filters Component - v2.5.0
 * JSON-driven global filters system with API integration
 * PRD Section 4.2 - Zero tolerance for spec violations
 * WCAG 2.1 AA compliant with 10s timeout handling
 */

class ScoutFilters {
    constructor(container, configPath = '/config/desired-state.json') {
        this.container = container;
        this.configPath = configPath;
        this.config = null;
        this.filters = [];
        this.state = {
            activeFilters: new Map(),
            searchQuery: '',
            loading: new Set(),
            errors: new Map()
        };
        this.apiCache = new Map();
        this.apiTimeouts = new Map();
        this.eventListeners = new Map();
        this.driftDetected = false;
        this.a11yManager = null;
        this.debounceTimers = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            loadStart: performance.now(),
            renderStart: null,
            renderEnd: null,
            apiCalls: [],
            cacheHits: 0,
            cacheMisses: 0
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
            await this.loadInitialData();
            
            this.performanceMetrics.renderEnd = performance.now();
            this.reportPerformanceMetrics();
            this.dispatchEvent('scout-filters:ready', { component: this });
            
        } catch (error) {
            console.error('Scout Filters initialization failed:', error);
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
            this.filters = fullConfig.globalFilters;
            
            if (!this.filters || !Array.isArray(this.filters)) {
                throw new Error('Global filters configuration not found in desired-state.json');
            }
            
            console.log('✅ Scout Filters: Configuration loaded successfully');
            
        } catch (error) {
            console.error('❌ Scout Filters: Configuration load failed:', error);
            throw error;
        }
    }
    
    async validateSpecCompliance() {
        const requiredFilters = [
            { id: 'barangay', type: 'dropdown', multiSelect: true, searchable: true },
            { id: 'category', type: 'dropdown', multiSelect: true, searchable: true },
            { id: 'time', type: 'dropdown', multiSelect: false, searchable: false },
            { id: 'brand', type: 'dropdown', multiSelect: true, searchable: true },
            { id: 'dayType', type: 'dropdown', multiSelect: false, searchable: false },
            { id: 'search', type: 'search' }
        ];
        
        const violations = [];
        
        for (const required of requiredFilters) {
            const filter = this.filters.find(f => f.id === required.id);
            
            if (!filter) {
                violations.push(`Missing required filter: ${required.id}`);
                continue;
            }
            
            // Validate basic properties
            if (filter.type !== required.type) {
                violations.push(`Filter ${required.id} type mismatch. Expected: ${required.type}, Got: ${filter.type}`);
            }
            
            // Validate dropdown-specific properties
            if (required.type === 'dropdown') {
                if (filter.multiSelect !== required.multiSelect) {
                    violations.push(`Filter ${required.id} multiSelect mismatch. Expected: ${required.multiSelect}, Got: ${filter.multiSelect}`);
                }
                
                if (filter.searchable !== required.searchable) {
                    violations.push(`Filter ${required.id} searchable mismatch. Expected: ${required.searchable}, Got: ${filter.searchable}`);
                }
                
                if (!filter.endpoint && !filter.options) {
                    violations.push(`Filter ${required.id} must have either endpoint or static options`);
                }
                
                if (!filter.placeholder) {
                    violations.push(`Filter ${required.id} missing required placeholder`);
                }
            }
            
            // Validate search-specific properties
            if (required.type === 'search') {
                if (!filter.placeholder) {
                    violations.push(`Filter ${required.id} missing required placeholder`);
                }
                
                if (typeof filter.minLength !== 'number' || filter.minLength < 1) {
                    violations.push(`Filter ${required.id} must have valid minLength`);
                }
                
                if (typeof filter.debounce !== 'number' || filter.debounce < 0) {
                    violations.push(`Filter ${required.id} must have valid debounce value`);
                }
            }
        }
        
        // Validate static options for specific filters
        const timeFilter = this.filters.find(f => f.id === 'time');
        if (timeFilter && timeFilter.options) {
            const expectedTimeOptions = [
                { value: 'morning', label: 'Morning (6AM-12PM)' },
                { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
                { value: 'evening', label: 'Evening (6PM-12AM)' },
                { value: 'late_night', label: 'Late Night (12AM-6AM)' }
            ];
            
            if (timeFilter.options.length !== expectedTimeOptions.length) {
                violations.push('Time filter options count mismatch');
            } else {
                for (let i = 0; i < expectedTimeOptions.length; i++) {
                    const expected = expectedTimeOptions[i];
                    const actual = timeFilter.options[i];
                    
                    if (!actual || actual.value !== expected.value || actual.label !== expected.label) {
                        violations.push(`Time filter option ${i} spec violation. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
                    }
                }
            }
        }
        
        const dayTypeFilter = this.filters.find(f => f.id === 'dayType');
        if (dayTypeFilter && dayTypeFilter.options) {
            const expectedDayTypeOptions = [
                { value: 'weekday', label: 'Weekday' },
                { value: 'weekend', label: 'Weekend' },
                { value: 'holiday', label: 'Holiday' }
            ];
            
            if (dayTypeFilter.options.length !== expectedDayTypeOptions.length) {
                violations.push('DayType filter options count mismatch');
            } else {
                for (let i = 0; i < expectedDayTypeOptions.length; i++) {
                    const expected = expectedDayTypeOptions[i];
                    const actual = dayTypeFilter.options[i];
                    
                    if (!actual || actual.value !== expected.value || actual.label !== expected.label) {
                        violations.push(`DayType filter option ${i} spec violation. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
                    }
                }
            }
        }
        
        if (violations.length > 0) {
            this.driftDetected = true;
            const error = new Error(`SPEC COMPLIANCE FAILURE - Scout Filters drift detected:\n${violations.join('\n')}`);
            error.name = 'SpecComplianceError';
            error.violations = violations;
            
            this.reportDriftViolation(violations);
            throw error;
        }
        
        console.log('✅ Scout Filters: Spec compliance validated');
    }
    
    initializeState() {
        // Initialize active filters map
        this.filters.forEach(filter => {
            if (filter.type === 'dropdown' && filter.multiSelect) {
                this.state.activeFilters.set(filter.id, []);
            } else if (filter.type === 'dropdown') {
                this.state.activeFilters.set(filter.id, null);
            } else if (filter.type === 'search') {
                this.state.activeFilters.set(filter.id, '');
            }
        });
        
        console.log('🎯 Scout Filters: State initialized');
    }
    
    render() {
        if (!this.container) {
            throw new Error('Scout Filters: Container element not found');
        }
        
        const filtersHTML = `
            <div class="scout-filters" 
                 role="region" 
                 aria-label="Dashboard Filters"
                 data-component="scout-filters"
                 data-version="2.5.0">
                
                <div class="scout-filters__header">
                    <h3 class="scout-filters__title">Filters</h3>
                    <div class="scout-filters__actions">
                        <button type="button" 
                                class="scout-filters__clear-all"
                                aria-label="Clear all filters"
                                disabled>
                            <span class="material-icons" aria-hidden="true">clear_all</span>
                            Clear All
                        </button>
                        <button type="button" 
                                class="scout-filters__save"
                                aria-label="Save current filter set"
                                title="Save filters for quick access">
                            <span class="material-icons" aria-hidden="true">bookmark_add</span>
                        </button>
                    </div>
                </div>
                
                <div class="scout-filters__content">
                    ${this.filters.map(filter => this.renderFilter(filter)).join('')}
                </div>
                
                <!-- Active Filters Summary -->
                <div class="scout-filters__summary" aria-live="polite">
                    <div class="scout-filters__active-count">
                        <span class="scout-filters__count">0</span> filters active
                    </div>
                    <div class="scout-filters__active-tags" role="list"></div>
                </div>
                
                <!-- Loading States -->
                <div class="scout-filters__loading" aria-hidden="true">
                    <div class="scout-loading-spinner"></div>
                    <span>Loading filter options...</span>
                </div>
                
                <!-- Error Boundary -->
                <div class="scout-filters__error-boundary" role="alert" aria-live="assertive" aria-hidden="true">
                    <span class="material-icons">error</span>
                    <span class="scout-error-message"></span>
                    <button type="button" class="scout-error-retry">Retry</button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = filtersHTML;
        console.log('🎨 Scout Filters: Rendered successfully');
    }
    
    renderFilter(filter) {
        switch (filter.type) {
            case 'dropdown':
                return this.renderDropdownFilter(filter);
            case 'search':
                return this.renderSearchFilter(filter);
            default:
                console.warn(`Unknown filter type: ${filter.type}`);
                return '';
        }
    }
    
    renderDropdownFilter(filter) {
        const selectedValues = this.state.activeFilters.get(filter.id) || (filter.multiSelect ? [] : null);
        const hasSelection = filter.multiSelect ? selectedValues.length > 0 : selectedValues !== null;
        
        return `
            <div class="scout-filter scout-filter--dropdown" data-filter="${filter.id}">
                <label class="scout-filter__label" for="scout-filter-${filter.id}">
                    ${filter.label}
                    ${filter.multiSelect ? '<span class="scout-filter__multi-indicator">(Multiple)</span>' : ''}
                </label>
                
                <div class="scout-dropdown-filter" role="group">
                    <button type="button"
                            id="scout-filter-${filter.id}"
                            class="scout-dropdown-filter__trigger ${hasSelection ? 'scout-dropdown-filter__trigger--active' : ''}"
                            aria-haspopup="listbox"
                            aria-expanded="false"
                            aria-describedby="scout-filter-${filter.id}-help"
                            data-filter-id="${filter.id}">
                        
                        <span class="scout-dropdown-filter__value">
                            ${this.getFilterDisplayValue(filter, selectedValues)}
                        </span>
                        
                        <span class="material-icons scout-dropdown-filter__arrow" aria-hidden="true">
                            keyboard_arrow_down
                        </span>
                        
                        ${hasSelection ? `
                            <button type="button" 
                                    class="scout-dropdown-filter__clear"
                                    aria-label="Clear ${filter.label} filter"
                                    data-filter-id="${filter.id}">
                                <span class="material-icons">close</span>
                            </button>
                        ` : ''}
                    </button>
                    
                    <div class="scout-dropdown-filter__menu" role="listbox" aria-hidden="true" aria-multiselectable="${filter.multiSelect}">
                        ${filter.searchable ? `
                            <div class="scout-dropdown-filter__search">
                                <input type="text" 
                                       class="scout-dropdown-filter__search-input"
                                       placeholder="Search ${filter.label.toLowerCase()}..."
                                       aria-label="Search ${filter.label}"
                                       data-filter-id="${filter.id}">
                                <span class="material-icons">search</span>
                            </div>
                        ` : ''}
                        
                        <div class="scout-dropdown-filter__options" data-filter-id="${filter.id}">
                            ${this.renderFilterOptions(filter)}
                        </div>
                        
                        <div class="scout-dropdown-filter__loading" aria-hidden="true">
                            <div class="scout-loading-spinner"></div>
                            <span>Loading options...</span>
                        </div>
                        
                        <div class="scout-dropdown-filter__error" role="alert" aria-hidden="true">
                            <span class="material-icons">error</span>
                            <span class="scout-error-text">Failed to load options</span>
                            <button type="button" class="scout-retry-btn" data-filter-id="${filter.id}">Retry</button>
                        </div>
                    </div>
                    
                    <div id="scout-filter-${filter.id}-help" class="scout-filter__help sr-only">
                        ${filter.multiSelect ? 'Select multiple options' : 'Select one option'}. 
                        Press Enter or Space to open dropdown.
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSearchFilter(filter) {
        const currentValue = this.state.activeFilters.get(filter.id) || '';
        
        return `
            <div class="scout-filter scout-filter--search" data-filter="${filter.id}">
                <label class="scout-filter__label" for="scout-filter-${filter.id}">
                    ${filter.label}
                </label>
                
                <div class="scout-search-filter" role="search">
                    <div class="scout-search-filter__input-wrapper">
                        <span class="material-icons scout-search-filter__icon" aria-hidden="true">search</span>
                        
                        <input type="text"
                               id="scout-filter-${filter.id}"
                               class="scout-search-filter__input"
                               placeholder="${filter.placeholder}"
                               value="${currentValue}"
                               aria-describedby="scout-filter-${filter.id}-help"
                               data-filter-id="${filter.id}"
                               data-min-length="${filter.minLength}"
                               data-debounce="${filter.debounce}">
                        
                        ${currentValue ? `
                            <button type="button" 
                                    class="scout-search-filter__clear"
                                    aria-label="Clear search"
                                    data-filter-id="${filter.id}">
                                <span class="material-icons">close</span>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="scout-search-filter__suggestions" role="listbox" aria-hidden="true">
                        <div class="scout-search-filter__suggestion-items"></div>
                        <div class="scout-search-filter__no-results" aria-hidden="true">
                            No suggestions found
                        </div>
                    </div>
                    
                    <div id="scout-filter-${filter.id}-help" class="scout-filter__help sr-only">
                        Minimum ${filter.minLength} characters required. Results will appear as you type.
                    </div>
                </div>
            </div>
        `;
    }
    
    renderFilterOptions(filter) {
        if (filter.options) {
            // Static options
            return filter.options.map(option => `
                <div class="scout-dropdown-filter__option" 
                     role="option" 
                     data-value="${option.value}"
                     data-filter-id="${filter.id}"
                     aria-selected="false"
                     tabindex="-1">
                    ${filter.multiSelect ? `
                        <input type="checkbox" 
                               class="scout-dropdown-filter__checkbox"
                               id="scout-option-${filter.id}-${option.value}"
                               value="${option.value}">
                        <label for="scout-option-${filter.id}-${option.value}">${option.label}</label>
                    ` : `
                        <span class="scout-dropdown-filter__radio-label">${option.label}</span>
                    `}
                </div>
            `).join('');
        } else {
            // Dynamic options loaded from API
            return '<div class="scout-dropdown-filter__empty">Loading options...</div>';
        }
    }
    
    getFilterDisplayValue(filter, selectedValues) {
        if (filter.multiSelect) {
            if (!selectedValues || selectedValues.length === 0) {
                return filter.placeholder;
            }
            if (selectedValues.length === 1) {
                return this.getOptionLabel(filter, selectedValues[0]);
            }
            return `${selectedValues.length} selected`;
        } else {
            if (!selectedValues) {
                return filter.placeholder;
            }
            return this.getOptionLabel(filter, selectedValues);
        }
    }
    
    getOptionLabel(filter, value) {
        if (filter.options) {
            const option = filter.options.find(opt => opt.value === value);
            return option ? option.label : value;
        }
        
        // For dynamic options, check cache
        const cacheKey = `${filter.endpoint}_${filter.parameter}`;
        const cachedData = this.apiCache.get(cacheKey);
        if (cachedData && cachedData.options) {
            const option = cachedData.options.find(opt => opt.value === value);
            return option ? option.label : value;
        }
        
        return value;
    }
    
    async loadInitialData() {
        const apiFilters = this.filters.filter(f => f.endpoint && !f.options);
        
        if (apiFilters.length === 0) {
            console.log('🔄 Scout Filters: No API filters to load');
            return;
        }
        
        console.log(`🔄 Scout Filters: Loading data for ${apiFilters.length} API filters`);
        
        const loadPromises = apiFilters.map(filter => this.loadFilterOptions(filter.id));
        await Promise.allSettled(loadPromises);
        
        console.log('✅ Scout Filters: Initial data loading completed');
    }
    
    async loadFilterOptions(filterId, searchQuery = '') {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter || !filter.endpoint) {
            console.warn(`Filter ${filterId} has no endpoint configured`);
            return;
        }
        
        const cacheKey = `${filter.endpoint}_${filter.parameter}_${searchQuery}`;
        
        // Check cache first
        if (this.apiCache.has(cacheKey)) {
            this.performanceMetrics.cacheHits++;
            const cachedData = this.apiCache.get(cacheKey);
            this.updateFilterOptions(filterId, cachedData.options);
            return cachedData.options;
        }
        
        this.performanceMetrics.cacheMisses++;
        
        // Set loading state
        this.setFilterLoading(filterId, true);
        
        try {
            const apiCallStart = performance.now();
            
            // Build URL with parameters
            const url = new URL(filter.endpoint, window.location.origin);
            url.searchParams.set('filter', filter.parameter);
            if (searchQuery) {
                url.searchParams.set('search', searchQuery);
            }
            
            // Set up timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per PRD
            this.apiTimeouts.set(filterId, timeoutId);
            
            const response = await fetch(url.toString(), {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            this.apiTimeouts.delete(filterId);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const apiCallEnd = performance.now();
            
            // Validate response structure
            if (!data.options || !Array.isArray(data.options)) {
                throw new Error('Invalid API response: missing options array');
            }
            
            // Validate option structure
            for (const option of data.options) {
                if (!option.value || !option.label) {
                    throw new Error('Invalid option structure: missing value or label');
                }
            }
            
            // Cache the results
            this.apiCache.set(cacheKey, {
                options: data.options,
                timestamp: Date.now(),
                searchQuery: searchQuery
            });
            
            // Track performance
            this.performanceMetrics.apiCalls.push({
                filterId: filterId,
                endpoint: filter.endpoint,
                duration: apiCallEnd - apiCallStart,
                searchQuery: searchQuery,
                resultCount: data.options.length,
                cached: false
            });
            
            // Update UI
            this.updateFilterOptions(filterId, data.options);
            this.setFilterLoading(filterId, false);
            
            console.log(`✅ Scout Filters: Loaded ${data.options.length} options for ${filterId}`);
            return data.options;
            
        } catch (error) {
            console.error(`❌ Scout Filters: Failed to load options for ${filterId}:`, error);
            
            this.setFilterLoading(filterId, false);
            this.setFilterError(filterId, error.message);
            
            // Clear timeout if still active
            const timeoutId = this.apiTimeouts.get(filterId);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.apiTimeouts.delete(filterId);
            }
            
            throw error;
        }
    }
    
    updateFilterOptions(filterId, options) {
        const optionsContainer = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__options`);
        if (!optionsContainer) return;
        
        const filter = this.filters.find(f => f.id === filterId);
        const selectedValues = this.state.activeFilters.get(filterId);
        
        const optionsHTML = options.map(option => {
            const isSelected = filter.multiSelect 
                ? selectedValues && selectedValues.includes(option.value)
                : selectedValues === option.value;
            
            return `
                <div class="scout-dropdown-filter__option" 
                     role="option" 
                     data-value="${option.value}"
                     data-filter-id="${filterId}"
                     aria-selected="${isSelected}"
                     tabindex="-1">
                    ${filter.multiSelect ? `
                        <input type="checkbox" 
                               class="scout-dropdown-filter__checkbox"
                               id="scout-option-${filterId}-${option.value}"
                               value="${option.value}"
                               ${isSelected ? 'checked' : ''}>
                        <label for="scout-option-${filterId}-${option.value}">${option.label}</label>
                    ` : `
                        <span class="scout-dropdown-filter__radio-label">${option.label}</span>
                        ${isSelected ? '<span class="material-icons scout-dropdown-filter__selected-icon">check</span>' : ''}
                    `}
                </div>
            `;
        }).join('');
        
        optionsContainer.innerHTML = optionsHTML;
        
        // Re-bind option events
        this.bindOptionEvents(filterId);
    }
    
    setFilterLoading(filterId, loading) {
        const filterElement = this.container.querySelector(`[data-filter="${filterId}"]`);
        if (!filterElement) return;
        
        const loadingElement = filterElement.querySelector('.scout-dropdown-filter__loading');
        const optionsElement = filterElement.querySelector('.scout-dropdown-filter__options');
        
        if (loading) {
            this.state.loading.add(filterId);
            if (loadingElement) loadingElement.setAttribute('aria-hidden', 'false');
            if (optionsElement) optionsElement.style.display = 'none';
        } else {
            this.state.loading.delete(filterId);
            if (loadingElement) loadingElement.setAttribute('aria-hidden', 'true');
            if (optionsElement) optionsElement.style.display = 'block';
        }
        
        // Update global loading state
        const globalLoading = this.container.querySelector('.scout-filters__loading');
        if (globalLoading) {
            globalLoading.setAttribute('aria-hidden', this.state.loading.size === 0 ? 'true' : 'false');
        }
    }
    
    setFilterError(filterId, errorMessage) {
        const filterElement = this.container.querySelector(`[data-filter="${filterId}"]`);
        if (!filterElement) return;
        
        const errorElement = filterElement.querySelector('.scout-dropdown-filter__error');
        const errorText = filterElement.querySelector('.scout-error-text');
        
        if (errorElement && errorText) {
            errorText.textContent = errorMessage;
            errorElement.setAttribute('aria-hidden', 'false');
            this.state.errors.set(filterId, errorMessage);
        }
        
        // Show global error if needed
        this.showGlobalError(`Failed to load ${filterId} options: ${errorMessage}`);
    }
    
    bindEvents() {
        // Dropdown filter events
        const dropdownTriggers = this.container.querySelectorAll('.scout-dropdown-filter__trigger');
        dropdownTriggers.forEach(trigger => {
            this.addEventListener(trigger, 'click', (e) => {
                e.stopPropagation();
                this.toggleDropdownFilter(trigger.dataset.filterId);
            });
            
            this.addEventListener(trigger, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDropdownFilter(trigger.dataset.filterId);
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.openDropdownFilter(trigger.dataset.filterId);
                    this.focusFirstOption(trigger.dataset.filterId);
                }
            });
        });
        
        // Search filter events
        const searchInputs = this.container.querySelectorAll('.scout-search-filter__input');
        searchInputs.forEach(input => {
            this.addEventListener(input, 'input', (e) => {
                this.handleSearchInput(input.dataset.filterId, e.target.value);
            });
            
            this.addEventListener(input, 'focus', () => {
                this.showSearchSuggestions(input.dataset.filterId);
            });
            
            this.addEventListener(input, 'keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideSearchSuggestions(input.dataset.filterId);
                }
            });
        });
        
        // Clear filter events
        const clearButtons = this.container.querySelectorAll('.scout-dropdown-filter__clear, .scout-search-filter__clear');
        clearButtons.forEach(button => {
            this.addEventListener(button, 'click', (e) => {
                e.stopPropagation();
                this.clearFilter(button.dataset.filterId);
            });
        });
        
        // Clear all filters
        const clearAllButton = this.container.querySelector('.scout-filters__clear-all');
        if (clearAllButton) {
            this.addEventListener(clearAllButton, 'click', this.clearAllFilters.bind(this));
        }
        
        // Save filters
        const saveButton = this.container.querySelector('.scout-filters__save');
        if (saveButton) {
            this.addEventListener(saveButton, 'click', this.saveFilterSet.bind(this));
        }
        
        // Retry buttons
        const retryButtons = this.container.querySelectorAll('.scout-retry-btn, .scout-error-retry');
        retryButtons.forEach(button => {
            this.addEventListener(button, 'click', () => {
                if (button.dataset.filterId) {
                    this.retryFilterLoad(button.dataset.filterId);
                } else {
                    this.retryAllFilters();
                }
            });
        });
        
        // Global events
        this.addEventListener(document, 'click', this.handleGlobalClick.bind(this));
        this.addEventListener(document, 'keydown', this.handleGlobalKeydown.bind(this));
        
        // Search input debouncing
        searchInputs.forEach(input => {
            this.bindSearchEvents(input);
        });
        
        console.log('🔗 Scout Filters: Events bound successfully');
    }
    
    bindSearchEvents(input) {
        const filterId = input.dataset.filterId;
        const filter = this.filters.find(f => f.id === filterId);
        
        if (!filter || filter.type !== 'search') return;
        
        let debounceTimer = null;
        
        this.addEventListener(input, 'input', (e) => {
            const value = e.target.value;
            
            // Clear previous timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            // Set new timer with debounce
            debounceTimer = setTimeout(() => {
                this.updateSearchFilter(filterId, value);
            }, filter.debounce || 300);
            
            this.debounceTimers.set(filterId, debounceTimer);
        });
    }
    
    bindOptionEvents(filterId) {
        const options = this.container.querySelectorAll(`[data-filter-id="${filterId}"].scout-dropdown-filter__option`);
        
        options.forEach(option => {
            this.addEventListener(option, 'click', () => {
                this.selectFilterOption(filterId, option.dataset.value);
            });
            
            this.addEventListener(option, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectFilterOption(filterId, option.dataset.value);
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.focusNextOption(option);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.focusPreviousOption(option);
                }
                if (e.key === 'Escape') {
                    this.closeDropdownFilter(filterId);
                    this.focusFilterTrigger(filterId);
                }
            });
        });
        
        // Checkbox events for multi-select
        const checkboxes = this.container.querySelectorAll(`[data-filter-id="${filterId}"] .scout-dropdown-filter__checkbox`);
        checkboxes.forEach(checkbox => {
            this.addEventListener(checkbox, 'change', (e) => {
                e.stopPropagation();
                this.toggleFilterOption(filterId, checkbox.value, checkbox.checked);
            });
        });
    }
    
    initializeAccessibility() {
        this.a11yManager = {
            announceFilterChange: (filterId, action, value) => {
                const announcement = `Filter ${filterId} ${action}: ${value}`;
                this.announceToScreenReader(announcement);
            },
            
            setFocusableElements: (container) => {
                const focusable = container.querySelectorAll(
                    'button, input, [tabindex]:not([tabindex="-1"])'
                );
                return Array.from(focusable);
            },
            
            trapFocus: (container) => {
                const focusable = this.a11yManager.setFocusableElements(container);
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
        
        console.log('♿ Scout Filters: Accessibility features initialized');
    }
    
    // Filter Management Methods
    
    toggleDropdownFilter(filterId) {
        const trigger = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__trigger`);
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
            this.closeDropdownFilter(filterId);
        } else {
            this.openDropdownFilter(filterId);
        }
    }
    
    openDropdownFilter(filterId) {
        // Close all other dropdowns first
        this.closeAllDropdowns();
        
        const trigger = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__trigger`);
        const menu = this.container.querySelector(`[data-filter="${filterId}"] .scout-dropdown-filter__menu`);
        
        if (trigger && menu) {
            trigger.setAttribute('aria-expanded', 'true');
            menu.setAttribute('aria-hidden', 'false');
            
            // Load options if needed
            const filter = this.filters.find(f => f.id === filterId);
            if (filter && filter.endpoint && !filter.options) {
                this.loadFilterOptions(filterId).catch(error => {
                    console.error(`Failed to load options for ${filterId}:`, error);
                });
            }
            
            this.dispatchEvent('scout-filters:dropdown-opened', { filterId });
        }
    }
    
    closeDropdownFilter(filterId) {
        const trigger = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__trigger`);
        const menu = this.container.querySelector(`[data-filter="${filterId}"] .scout-dropdown-filter__menu`);
        
        if (trigger && menu) {
            trigger.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            
            this.dispatchEvent('scout-filters:dropdown-closed', { filterId });
        }
    }
    
    closeAllDropdowns() {
        const openDropdowns = this.container.querySelectorAll('.scout-dropdown-filter__trigger[aria-expanded="true"]');
        openDropdowns.forEach(trigger => {
            this.closeDropdownFilter(trigger.dataset.filterId);
        });
    }
    
    selectFilterOption(filterId, value) {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter) return;
        
        if (filter.multiSelect) {
            this.toggleFilterOption(filterId, value, true);
        } else {
            this.setSingleFilterValue(filterId, value);
            this.closeDropdownFilter(filterId);
        }
    }
    
    toggleFilterOption(filterId, value, checked) {
        const currentValues = this.state.activeFilters.get(filterId) || [];
        let newValues;
        
        if (checked && !currentValues.includes(value)) {
            newValues = [...currentValues, value];
        } else if (!checked && currentValues.includes(value)) {
            newValues = currentValues.filter(v => v !== value);
        } else {
            return; // No change needed
        }
        
        this.state.activeFilters.set(filterId, newValues);
        this.updateFilterDisplay(filterId);
        this.updateActiveFiltersSummary();
        
        this.a11yManager.announceFilterChange(filterId, checked ? 'added' : 'removed', value);
        this.dispatchEvent('scout-filters:filter-changed', { 
            filterId, 
            value: newValues, 
            type: 'multi-select',
            action: checked ? 'add' : 'remove',
            item: value
        });
    }
    
    setSingleFilterValue(filterId, value) {
        const currentValue = this.state.activeFilters.get(filterId);
        if (currentValue === value) return;
        
        this.state.activeFilters.set(filterId, value);
        this.updateFilterDisplay(filterId);
        this.updateActiveFiltersSummary();
        
        this.a11yManager.announceFilterChange(filterId, 'selected', value);
        this.dispatchEvent('scout-filters:filter-changed', { 
            filterId, 
            value: value, 
            type: 'single-select',
            previousValue: currentValue
        });
    }
    
    handleSearchInput(filterId, value) {
        // Update search suggestions in real-time
        if (value.length >= this.getFilterMinLength(filterId)) {
            this.showSearchSuggestions(filterId, value);
        } else {
            this.hideSearchSuggestions(filterId);
        }
    }
    
    updateSearchFilter(filterId, value) {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter || filter.type !== 'search') return;
        
        const currentValue = this.state.activeFilters.get(filterId);
        if (currentValue === value) return;
        
        // Validate minimum length
        if (value.length > 0 && value.length < filter.minLength) {
            return; // Don't update if below minimum length
        }
        
        this.state.activeFilters.set(filterId, value);
        this.updateFilterDisplay(filterId);
        this.updateActiveFiltersSummary();
        
        this.dispatchEvent('scout-filters:search-changed', { 
            filterId, 
            value: value, 
            previousValue: currentValue
        });
    }
    
    clearFilter(filterId) {
        const filter = this.filters.find(f => f.id === filterId);
        if (!filter) return;
        
        let defaultValue;
        if (filter.multiSelect) {
            defaultValue = [];
        } else if (filter.type === 'search') {
            defaultValue = '';
        } else {
            defaultValue = null;
        }
        
        this.state.activeFilters.set(filterId, defaultValue);
        this.updateFilterDisplay(filterId);
        this.updateActiveFiltersSummary();
        
        // Clear search input if applicable
        if (filter.type === 'search') {
            const input = this.container.querySelector(`[data-filter-id="${filterId}"].scout-search-filter__input`);
            if (input) input.value = '';
        }
        
        this.a11yManager.announceFilterChange(filterId, 'cleared', '');
        this.dispatchEvent('scout-filters:filter-cleared', { filterId });
    }
    
    clearAllFilters() {
        this.filters.forEach(filter => {
            this.clearFilter(filter.id);
        });
        
        this.announceToScreenReader('All filters cleared');
        this.dispatchEvent('scout-filters:all-cleared');
    }
    
    updateFilterDisplay(filterId) {
        const filter = this.filters.find(f => f.id === filterId);
        const value = this.state.activeFilters.get(filterId);
        
        if (filter.type === 'dropdown') {
            this.updateDropdownDisplay(filterId, value);
        } else if (filter.type === 'search') {
            this.updateSearchDisplay(filterId, value);
        }
    }
    
    updateDropdownDisplay(filterId, value) {
        const trigger = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__trigger`);
        const valueElement = trigger?.querySelector('.scout-dropdown-filter__value');
        const clearButton = trigger?.querySelector('.scout-dropdown-filter__clear');
        
        if (!trigger || !valueElement) return;
        
        const filter = this.filters.find(f => f.id === filterId);
        const displayValue = this.getFilterDisplayValue(filter, value);
        const hasValue = filter.multiSelect ? value && value.length > 0 : value !== null;
        
        valueElement.textContent = displayValue;
        trigger.classList.toggle('scout-dropdown-filter__trigger--active', hasValue);
        
        if (clearButton) {
            clearButton.style.display = hasValue ? 'flex' : 'none';
        }
        
        // Update option selections
        const options = this.container.querySelectorAll(`[data-filter="${filterId}"] .scout-dropdown-filter__option`);
        options.forEach(option => {
            const isSelected = filter.multiSelect 
                ? value && value.includes(option.dataset.value)
                : value === option.dataset.value;
            
            option.setAttribute('aria-selected', isSelected);
            
            const checkbox = option.querySelector('.scout-dropdown-filter__checkbox');
            if (checkbox) {
                checkbox.checked = isSelected;
            }
        });
    }
    
    updateSearchDisplay(filterId, value) {
        const input = this.container.querySelector(`[data-filter-id="${filterId}"].scout-search-filter__input`);
        const clearButton = this.container.querySelector(`[data-filter-id="${filterId}"].scout-search-filter__clear`);
        
        if (input && input.value !== value) {
            input.value = value;
        }
        
        if (clearButton) {
            clearButton.style.display = value ? 'flex' : 'none';
        }
    }
    
    updateActiveFiltersSummary() {
        const activeCount = this.getActiveFiltersCount();
        const countElement = this.container.querySelector('.scout-filters__count');
        const tagsContainer = this.container.querySelector('.scout-filters__active-tags');
        const clearAllButton = this.container.querySelector('.scout-filters__clear-all');
        
        if (countElement) {
            countElement.textContent = activeCount;
        }
        
        if (clearAllButton) {
            clearAllButton.disabled = activeCount === 0;
        }
        
        if (tagsContainer) {
            tagsContainer.innerHTML = this.renderActiveFilterTags();
        }
    }
    
    renderActiveFilterTags() {
        const tags = [];
        
        this.state.activeFilters.forEach((value, filterId) => {
            const filter = this.filters.find(f => f.id === filterId);
            if (!filter) return;
            
            if (filter.multiSelect && value && value.length > 0) {
                value.forEach(val => {
                    tags.push(this.createFilterTag(filterId, val, filter.label));
                });
            } else if (!filter.multiSelect && value !== null && value !== '') {
                tags.push(this.createFilterTag(filterId, value, filter.label));
            }
        });
        
        return tags.join('');
    }
    
    createFilterTag(filterId, value, filterLabel) {
        const displayValue = this.getOptionLabel(this.filters.find(f => f.id === filterId), value);
        
        return `
            <div class="scout-filter-tag" role="listitem">
                <span class="scout-filter-tag__label">${filterLabel}:</span>
                <span class="scout-filter-tag__value">${displayValue}</span>
                <button type="button" 
                        class="scout-filter-tag__remove"
                        aria-label="Remove ${filterLabel}: ${displayValue}"
                        data-filter-id="${filterId}"
                        data-value="${value}">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
    }
    
    getActiveFiltersCount() {
        let count = 0;
        
        this.state.activeFilters.forEach((value, filterId) => {
            const filter = this.filters.find(f => f.id === filterId);
            if (!filter) return;
            
            if (filter.multiSelect && value && value.length > 0) {
                count += value.length;
            } else if (!filter.multiSelect && value !== null && value !== '') {
                count += 1;
            }
        });
        
        return count;
    }
    
    // Navigation and Focus Management
    
    focusFirstOption(filterId) {
        const firstOption = this.container.querySelector(`[data-filter="${filterId}"] .scout-dropdown-filter__option:first-child`);
        if (firstOption) firstOption.focus();
    }
    
    focusNextOption(currentOption) {
        const next = currentOption.nextElementSibling;
        if (next && next.classList.contains('scout-dropdown-filter__option')) {
            next.focus();
        }
    }
    
    focusPreviousOption(currentOption) {
        const prev = currentOption.previousElementSibling;
        if (prev && prev.classList.contains('scout-dropdown-filter__option')) {
            prev.focus();
        }
    }
    
    focusFilterTrigger(filterId) {
        const trigger = this.container.querySelector(`[data-filter-id="${filterId}"].scout-dropdown-filter__trigger`);
        if (trigger) trigger.focus();
    }
    
    // Search Suggestions
    
    showSearchSuggestions(filterId, query = '') {
        // Implementation for search suggestions
        const suggestionsContainer = this.container.querySelector(`[data-filter="${filterId}"] .scout-search-filter__suggestions`);
        if (suggestionsContainer) {
            suggestionsContainer.setAttribute('aria-hidden', 'false');
            // Load and display suggestions based on query
        }
    }
    
    hideSearchSuggestions(filterId) {
        const suggestionsContainer = this.container.querySelector(`[data-filter="${filterId}"] .scout-search-filter__suggestions`);
        if (suggestionsContainer) {
            suggestionsContainer.setAttribute('aria-hidden', 'true');
        }
    }
    
    // Utility Methods
    
    getFilterMinLength(filterId) {
        const filter = this.filters.find(f => f.id === filterId);
        return filter && filter.minLength ? filter.minLength : 1;
    }
    
    // Error Handling
    
    showGlobalError(message) {
        const errorBoundary = this.container.querySelector('.scout-filters__error-boundary');
        const errorMessage = errorBoundary?.querySelector('.scout-error-message');
        
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = message;
            errorBoundary.setAttribute('aria-hidden', 'false');
            
            setTimeout(() => {
                this.hideGlobalError();
            }, 5000);
        }
    }
    
    hideGlobalError() {
        const errorBoundary = this.container.querySelector('.scout-filters__error-boundary');
        if (errorBoundary) {
            errorBoundary.setAttribute('aria-hidden', 'true');
        }
    }
    
    retryFilterLoad(filterId) {
        this.setFilterError(filterId, '');
        this.loadFilterOptions(filterId).catch(error => {
            console.error(`Retry failed for ${filterId}:`, error);
        });
    }
    
    retryAllFilters() {
        this.hideGlobalError();
        this.loadInitialData().catch(error => {
            console.error('Retry all filters failed:', error);
        });
    }
    
    handleFallback(error) {
        console.error('Scout Filters fallback activated:', error);
        
        // Minimal fallback UI
        this.container.innerHTML = `
            <div class="scout-filters scout-filters--fallback" role="region" aria-label="Dashboard Filters (Fallback Mode)">
                <div class="scout-filters__header">
                    <h3>Filters (Limited Mode)</h3>
                </div>
                <div class="scout-filters__fallback-content">
                    <div class="scout-filter-fallback">
                        <label>Search:</label>
                        <input type="text" placeholder="Search..." class="scout-fallback-search">
                    </div>
                    <div class="scout-filter-fallback">
                        <label>Quick Filter:</label>
                        <select class="scout-fallback-select">
                            <option value="">All</option>
                            <option value="recent">Recent</option>
                            <option value="popular">Popular</option>
                        </select>
                    </div>
                </div>
                <div class="scout-error-notice" role="alert">
                    ⚠️ Filters running in fallback mode. ${error.message}
                </div>
            </div>
        `;
        
        this.dispatchEvent('scout-filters:fallback-activated', { error });
    }
    
    // Global Event Handlers
    
    handleGlobalClick(event) {
        if (!event.target.closest('.scout-filters')) {
            this.closeAllDropdowns();
            this.hideAllSearchSuggestions();
        }
    }
    
    handleGlobalKeydown(event) {
        if (event.key === 'Escape') {
            this.closeAllDropdowns();
            this.hideAllSearchSuggestions();
        }
    }
    
    hideAllSearchSuggestions() {
        const suggestions = this.container.querySelectorAll('.scout-search-filter__suggestions');
        suggestions.forEach(suggestion => {
            suggestion.setAttribute('aria-hidden', 'true');
        });
    }
    
    // Performance and Analytics
    
    reportPerformanceMetrics() {
        const metrics = {
            loadTime: this.performanceMetrics.renderEnd - this.performanceMetrics.loadStart,
            renderTime: this.performanceMetrics.renderEnd - this.performanceMetrics.renderStart,
            apiCalls: this.performanceMetrics.apiCalls,
            cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100,
            filtersCount: this.filters.length,
            errorCount: this.state.errors.size
        };
        
        console.log('📊 Scout Filters Performance Metrics:', metrics);
        
        // Report to analytics if available
        if (window.ANALYTICS_ENDPOINT) {
            fetch(window.ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'scout-filters-performance',
                    metrics: metrics
                })
            }).catch(err => console.error('Failed to report metrics:', err));
        }
    }
    
    reportDriftViolation(violations) {
        const driftReport = {
            timestamp: new Date().toISOString(),
            component: 'scout-filters',
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
        
        // Report to CI system if available
        if (window.CI_DRIFT_ENDPOINT) {
            fetch(window.CI_DRIFT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(driftReport)
            }).catch(err => console.error('Failed to report drift:', err));
        }
        
        console.error('🚨 DRIFT DETECTED - Scout Filters:', driftReport);
        localStorage.setItem('scout-filters-drift-report', JSON.stringify(driftReport));
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
        console.log(`📡 Scout Filters: Event dispatched - ${eventName}`, detail);
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
    
    // Public API
    
    getActiveFilters() {
        const activeFilters = {};
        this.state.activeFilters.forEach((value, filterId) => {
            const filter = this.filters.find(f => f.id === filterId);
            if (!filter) return;
            
            if (filter.multiSelect && value && value.length > 0) {
                activeFilters[filterId] = value;
            } else if (!filter.multiSelect && value !== null && value !== '') {
                activeFilters[filterId] = value;
            }
        });
        return activeFilters;
    }
    
    setFilters(filters) {
        Object.entries(filters).forEach(([filterId, value]) => {
            const filter = this.filters.find(f => f.id === filterId);
            if (filter) {
                this.state.activeFilters.set(filterId, value);
                this.updateFilterDisplay(filterId);
            }
        });
        this.updateActiveFiltersSummary();
    }
    
    refreshFilterOptions(filterId) {
        // Clear cache and reload
        const filter = this.filters.find(f => f.id === filterId);
        if (filter && filter.endpoint) {
            this.apiCache.clear();
            return this.loadFilterOptions(filterId);
        }
    }
    
    saveFilterSet() {
        const activeFilters = this.getActiveFilters();
        const filterSet = {
            filters: activeFilters,
            timestamp: new Date().toISOString(),
            name: prompt('Enter a name for this filter set:') || `Filter Set ${Date.now()}`
        };
        
        // Save to localStorage
        const savedSets = JSON.parse(localStorage.getItem('scout-saved-filter-sets') || '[]');
        savedSets.push(filterSet);
        localStorage.setItem('scout-saved-filter-sets', JSON.stringify(savedSets));
        
        this.dispatchEvent('scout-filters:filter-set-saved', { filterSet });
    }
    
    // Cleanup
    
    destroy() {
        // Clear timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        this.apiTimeouts.forEach(timeout => clearTimeout(timeout));
        this.apiTimeouts.clear();
        
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
        
        console.log('🧹 Scout Filters: Destroyed successfully');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoutFilters;
}

// Global registration
if (typeof window !== 'undefined') {
    window.ScoutFilters = ScoutFilters;
}