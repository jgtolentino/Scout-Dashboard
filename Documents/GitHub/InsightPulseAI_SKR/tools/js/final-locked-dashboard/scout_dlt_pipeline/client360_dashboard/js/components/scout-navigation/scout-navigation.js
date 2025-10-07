/**
 * Scout Navigation v2.5.0 - JSON-driven, spec-validated navigation system
 * Implements exact spec matching from desired-state.json
 * 
 * PRD Compliance:
 * - Section 3.2: Navigation Tabs (navItems) - STRICT matching required
 * - Section 9: CI & Drift Validation - Zero deviation tolerance
 * - Section 10: Non-Functional Requirements - WCAG 2.1 AA compliance
 * 
 * @version 2.5.0
 * @namespace ScoutNavigation
 */

class ScoutNavigation {
    constructor(options = {}) {
        this.namespace = 'ScoutNavigation';
        this.version = '2.5.0';
        this.config = null;
        this.navItems = [];
        this.activeItem = null;
        this.container = null;
        this.listeners = new Set();
        this.initialized = false;
        
        // Spec validation settings
        this.specValidation = {
            enabled: true,
            strictMode: true,
            failOnMismatch: true,
            logViolations: true
        };
        
        this.init(options);
    }

    async init(options = {}) {
        try {
            console.log(`[${this.namespace} v${this.version}] Initializing JSON-driven navigation...`);
            
            // Load configuration from desired-state.json
            await this.loadConfiguration();
            
            // Validate spec compliance
            this.validateSpecCompliance();
            
            // Create navigation structure
            this.createNavigationStructure();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply initial state
            this.applyInitialState();
            
            // Attach accessibility features
            this.attachAccessibilityFeatures();
            
            // Attach styles
            this.attachStyles();
            
            this.initialized = true;
            console.log(`[${this.namespace}] Navigation initialized successfully with ${this.navItems.length} items`);
            
            // Notify listeners
            this.notifyListeners('navigation-initialized', {
                version: this.version,
                itemCount: this.navItems.length,
                config: this.config
            });
            
        } catch (error) {
            console.error(`[${this.namespace}] Initialization failed:`, error);
            this.handleInitializationError(error);
        }
    }

    async loadConfiguration() {
        try {
            // Try to load from desired-state.json
            const response = await fetch('/config/desired-state.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
            }
            
            this.config = await response.json();
            
            // Extract navigation items from config
            this.navItems = this.config.navItems || [];
            
            console.log(`[${this.namespace}] Configuration loaded: v${this.config.version}`);
            
            // Validate version compatibility
            if (this.config.version !== this.version) {
                console.warn(`[${this.namespace}] Version mismatch: Expected ${this.version}, got ${this.config.version}`);
            }
            
        } catch (error) {
            console.error(`[${this.namespace}] Failed to load configuration:`, error);
            
            // Fallback to hardcoded spec-compliant navigation
            this.loadFallbackConfiguration();
        }
    }

    loadFallbackConfiguration() {
        console.log(`[${this.namespace}] Loading fallback configuration...`);
        
        // PRD-compliant fallback navigation (Section 3.2)
        this.navItems = [
            {
                key: "overview",
                label: "Overview",
                route: "/#overview",
                active: true,
                icon: "dashboard"
            },
            {
                key: "regional",
                label: "Regional Analysis",
                route: "/#regional",
                active: false,
                icon: "map"
            },
            {
                key: "store",
                label: "Store Performance",
                route: "/#store",
                active: false,
                icon: "store"
            },
            {
                key: "product",
                label: "Product Analytics",
                route: "/#product",
                active: false,
                icon: "inventory"
            },
            {
                key: "reports",
                label: "Sales Reports",
                route: "/#reports",
                active: false,
                icon: "assessment"
            },
            {
                key: "settings",
                label: "Settings",
                route: "/#settings",
                active: false,
                icon: "settings"
            }
        ];
        
        this.config = {
            version: this.version,
            navItems: this.navItems,
            metadata: {
                title: "Scout Dashboard",
                fallbackMode: true
            }
        };
    }

    validateSpecCompliance() {
        if (!this.specValidation.enabled) return;
        
        console.log(`[${this.namespace}] Validating spec compliance...`);
        
        const violations = [];
        
        // PRD Section 3.2: Required navigation items
        const requiredNavItems = [
            { key: 'overview', label: 'Overview', route: '/#overview' },
            { key: 'regional', label: 'Regional Analysis', route: '/#regional' },
            { key: 'store', label: 'Store Performance', route: '/#store' },
            { key: 'product', label: 'Product Analytics', route: '/#product' },
            { key: 'reports', label: 'Sales Reports', route: '/#reports' },
            { key: 'settings', label: 'Settings', route: '/#settings' }
        ];
        
        // Check each required item
        requiredNavItems.forEach(required => {
            const found = this.navItems.find(item => item.key === required.key);
            
            if (!found) {
                violations.push(`Missing required nav item: ${required.key}`);
            } else {
                // Strict label matching
                if (found.label !== required.label) {
                    violations.push(`Label mismatch for ${required.key}: expected "${required.label}", got "${found.label}"`);
                }
                
                // Strict route matching
                if (found.route !== required.route) {
                    violations.push(`Route mismatch for ${required.key}: expected "${required.route}", got "${found.route}"`);
                }
            }
        });
        
        // Check for extra items (allowed but logged)
        this.navItems.forEach(item => {
            const isRequired = requiredNavItems.find(req => req.key === item.key);
            if (!isRequired) {
                console.log(`[${this.namespace}] Extra nav item detected: ${item.key}`);
            }
        });
        
        // Handle violations
        if (violations.length > 0) {
            const errorMessage = `Spec compliance violations detected:\n${violations.join('\n')}`;
            
            if (this.specValidation.logViolations) {
                console.error(`[${this.namespace}] ${errorMessage}`);
            }
            
            if (this.specValidation.failOnMismatch) {
                throw new Error(errorMessage);
            }
        } else {
            console.log(`[${this.namespace}] Spec compliance validation passed ✓`);
        }
    }

    createNavigationStructure() {
        // Find or create navigation container
        this.container = document.querySelector('#scout-navigation') || 
                       document.querySelector('[data-component="scout-navigation"]');
        
        if (!this.container) {
            // Create container if it doesn't exist
            this.container = document.createElement('nav');
            this.container.id = 'scout-navigation';
            this.container.setAttribute('data-component', 'scout-navigation');
            this.container.setAttribute('data-version', this.version);
            
            // Insert at appropriate location
            const header = document.querySelector('header') || document.querySelector('.header');
            if (header) {
                header.appendChild(this.container);
            } else {
                document.body.insertBefore(this.container, document.body.firstChild);
            }
        }
        
        // Clear existing content
        this.container.innerHTML = '';
        
        // Add accessibility attributes
        this.container.setAttribute('role', 'navigation');
        this.container.setAttribute('aria-label', 'Main navigation');
        
        // Create navigation HTML
        const navHTML = `
            <div class="scout-nav-container">
                <div class="scout-nav-brand">
                    <span class="brand-title">${this.config?.metadata?.title || 'Scout Dashboard'}</span>
                    <span class="brand-version">v${this.version}</span>
                </div>
                <ul class="scout-nav-items" role="menubar">
                    ${this.renderNavigationItems()}
                </ul>
                <div class="scout-nav-mobile-toggle" aria-label="Toggle navigation menu">
                    <span class="toggle-line"></span>
                    <span class="toggle-line"></span>
                    <span class="toggle-line"></span>
                </div>
            </div>
        `;
        
        this.container.innerHTML = navHTML;
        
        // Store references to key elements
        this.elements = {
            container: this.container,
            itemsList: this.container.querySelector('.scout-nav-items'),
            mobileToggle: this.container.querySelector('.scout-nav-mobile-toggle'),
            brand: this.container.querySelector('.scout-nav-brand')
        };
    }

    renderNavigationItems() {
        return this.navItems.map((item, index) => {
            const isActive = item.active || false;
            const iconHTML = item.icon ? `<i class="material-icons" aria-hidden="true">${item.icon}</i>` : '';
            
            return `
                <li class="scout-nav-item ${isActive ? 'active' : ''}" 
                    role="none">
                    <a href="${item.route}" 
                       class="scout-nav-link"
                       role="menuitem"
                       data-testid="nav-item"
                       data-nav-key="${item.key}"
                       data-nav-index="${index}"
                       aria-current="${isActive ? 'page' : 'false'}"
                       tabindex="${isActive ? '0' : '-1'}">
                        ${iconHTML}
                        <span class="nav-label">${item.label}</span>
                        <span class="nav-indicator" aria-hidden="true"></span>
                    </a>
                </li>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Navigation click handling
        this.elements.itemsList.addEventListener('click', (e) => {
            e.preventDefault();
            
            const link = e.target.closest('.scout-nav-link');
            if (!link) return;
            
            const navKey = link.dataset.navKey;
            const route = link.getAttribute('href');
            
            this.navigateToItem(navKey, route);
        });
        
        // Mobile toggle
        this.elements.mobileToggle.addEventListener('click', () => {
            this.toggleMobileNav();
        });
        
        // Keyboard navigation
        this.elements.itemsList.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Hash change detection
        window.addEventListener('hashchange', () => {
            this.syncWithCurrentRoute();
        });
        
        // Escape key to close mobile nav
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.container.classList.contains('mobile-open')) {
                this.closeMobileNav();
            }
        });
        
        // Close mobile nav on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.container.classList.contains('mobile-open')) {
                this.closeMobileNav();
            }
        });
    }

    navigateToItem(navKey, route) {
        // Find the navigation item
        const navItem = this.navItems.find(item => item.key === navKey);
        if (!navItem) {
            console.error(`[${this.namespace}] Navigation item not found: ${navKey}`);
            return;
        }
        
        // Update active state
        this.setActiveItem(navKey);
        
        // Update URL
        if (route && route !== window.location.hash) {
            window.location.hash = route.replace('#', '');
        }
        
        // Close mobile nav if open
        this.closeMobileNav();
        
        // Notify listeners
        this.notifyListeners('navigation-changed', {
            navKey,
            route,
            navItem,
            timestamp: Date.now()
        });
        
        console.log(`[${this.namespace}] Navigated to: ${navKey} (${route})`);
    }

    setActiveItem(navKey) {
        // Update internal state
        this.navItems.forEach(item => {
            item.active = (item.key === navKey);
        });
        
        this.activeItem = navKey;
        
        // Update DOM
        this.elements.itemsList.querySelectorAll('.scout-nav-item').forEach(item => {
            const link = item.querySelector('.scout-nav-link');
            const itemKey = link.dataset.navKey;
            const isActive = itemKey === navKey;
            
            // Update classes
            item.classList.toggle('active', isActive);
            
            // Update ARIA attributes
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
            link.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    syncWithCurrentRoute() {
        const currentHash = window.location.hash.replace('#', '');
        
        // Find matching navigation item
        const matchingItem = this.navItems.find(item => {
            const itemRoute = item.route.replace('#', '');
            return itemRoute === currentHash;
        });
        
        if (matchingItem) {
            this.setActiveItem(matchingItem.key);
        }
    }

    applyInitialState() {
        // Set initial active item
        const activeItem = this.navItems.find(item => item.active);
        if (activeItem) {
            this.setActiveItem(activeItem.key);
        } else {
            // Default to first item
            if (this.navItems.length > 0) {
                this.setActiveItem(this.navItems[0].key);
            }
        }
        
        // Sync with current route
        this.syncWithCurrentRoute();
    }

    toggleMobileNav() {
        const isOpen = this.container.classList.contains('mobile-open');
        
        if (isOpen) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    openMobileNav() {
        this.container.classList.add('mobile-open');
        this.elements.mobileToggle.setAttribute('aria-expanded', 'true');
        
        // Focus first navigation item
        const firstLink = this.elements.itemsList.querySelector('.scout-nav-link');
        if (firstLink) {
            firstLink.focus();
        }
        
        this.notifyListeners('mobile-nav-opened');
    }

    closeMobileNav() {
        this.container.classList.remove('mobile-open');
        this.elements.mobileToggle.setAttribute('aria-expanded', 'false');
        
        this.notifyListeners('mobile-nav-closed');
    }

    handleKeyboardNavigation(e) {
        const currentLink = e.target.closest('.scout-nav-link');
        if (!currentLink) return;
        
        const currentIndex = parseInt(currentLink.dataset.navIndex);
        let targetIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                targetIndex = (currentIndex + 1) % this.navItems.length;
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                targetIndex = currentIndex === 0 ? this.navItems.length - 1 : currentIndex - 1;
                break;
                
            case 'Home':
                e.preventDefault();
                targetIndex = 0;
                break;
                
            case 'End':
                e.preventDefault();
                targetIndex = this.navItems.length - 1;
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                currentLink.click();
                return;
        }
        
        // Focus target link
        const targetLink = this.elements.itemsList.querySelector(`[data-nav-index="${targetIndex}"]`);
        if (targetLink) {
            targetLink.focus();
        }
    }

    attachAccessibilityFeatures() {
        // WCAG 2.1 AA compliance features
        
        // Skip navigation link
        this.addSkipNavigation();
        
        // High contrast mode detection
        this.detectHighContrast();
        
        // Screen reader announcements
        this.setupScreenReaderAnnouncements();
        
        // Focus management
        this.setupFocusManagement();
    }

    addSkipNavigation() {
        const skipNav = document.createElement('a');
        skipNav.href = '#main-content';
        skipNav.className = 'skip-navigation';
        skipNav.textContent = 'Skip to main content';
        skipNav.setAttribute('aria-label', 'Skip navigation');
        
        document.body.insertBefore(skipNav, document.body.firstChild);
    }

    detectHighContrast() {
        // Check for high contrast preferences
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            this.container.classList.add('high-contrast');
        }
        
        // Listen for changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                this.container.classList.toggle('high-contrast', e.matches);
            });
        }
    }

    setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'nav-announcements';
        
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }

    setupFocusManagement() {
        // Ensure proper focus indicators
        this.container.addEventListener('focusin', (e) => {
            const link = e.target.closest('.scout-nav-link');
            if (link) {
                link.classList.add('focus-visible');
            }
        });
        
        this.container.addEventListener('focusout', (e) => {
            const link = e.target.closest('.scout-nav-link');
            if (link) {
                link.classList.remove('focus-visible');
            }
        });
    }

    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
        }
    }

    handleInitializationError(error) {
        console.error(`[${this.namespace}] Critical initialization error:`, error);
        
        // Create minimal fallback navigation
        this.createFallbackNavigation();
        
        // Notify about error
        this.notifyListeners('initialization-error', {
            error: error.message,
            fallbackMode: true
        });
    }

    createFallbackNavigation() {
        if (!this.container) {
            this.container = document.createElement('nav');
            this.container.id = 'scout-navigation-fallback';
            document.body.insertBefore(this.container, document.body.firstChild);
        }
        
        this.container.innerHTML = `
            <div class="scout-nav-error">
                <span>Navigation Error - Using Fallback Mode</span>
                <a href="/#overview">Overview</a>
                <a href="/#regional">Regional</a>
                <a href="/#store">Store</a>
                <a href="/#product">Product</a>
                <a href="/#reports">Reports</a>
                <a href="/#settings">Settings</a>
            </div>
        `;
    }

    // Event system
    onNavigationEvent(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error(`[${this.namespace}] Listener error:`, error);
            }
        });
    }

    // Public API
    getCurrentItem() {
        return this.activeItem;
    }

    getNavigationItems() {
        return [...this.navItems];
    }

    getConfiguration() {
        return this.config;
    }

    isInitialized() {
        return this.initialized;
    }

    refresh() {
        console.log(`[${this.namespace}] Refreshing navigation...`);
        return this.init();
    }

    attachStyles() {
        if (document.getElementById('scout-navigation-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scout-navigation-styles';
        styles.textContent = `
            /* Scout Navigation v2.5.0 Styles */
            .skip-navigation {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 10001;
                border-radius: 4px;
                transition: top 0.3s;
            }
            
            .skip-navigation:focus {
                top: 6px;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            #scout-navigation {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: white;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 1000;
            }
            
            .scout-nav-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 2rem;
                max-width: 1200px;
                margin: 0 auto;
                min-height: 64px;
            }
            
            .scout-nav-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
            }
            
            .brand-title {
                font-size: 1.25rem;
                color: #fff;
            }
            
            .brand-version {
                font-size: 0.75rem;
                color: #4CAF50;
                background: rgba(76, 175, 80, 0.2);
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .scout-nav-items {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
                gap: 0.5rem;
            }
            
            .scout-nav-item {
                position: relative;
            }
            
            .scout-nav-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                border-radius: 6px;
                transition: all 0.2s ease;
                position: relative;
                font-weight: 500;
                min-height: 44px; /* WCAG touch target */
                min-width: 44px;
            }
            
            .scout-nav-link:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
            }
            
            .scout-nav-link:focus,
            .scout-nav-link.focus-visible {
                outline: 2px solid #4CAF50;
                outline-offset: 2px;
                color: #fff;
            }
            
            .scout-nav-item.active .scout-nav-link {
                color: #fff;
                background: rgba(76, 175, 80, 0.2);
                border: 1px solid rgba(76, 175, 80, 0.4);
            }
            
            .scout-nav-link .material-icons {
                font-size: 20px;
            }
            
            .nav-label {
                font-size: 14px;
                white-space: nowrap;
            }
            
            .nav-indicator {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 2px;
                background: #4CAF50;
                transition: width 0.3s ease;
            }
            
            .scout-nav-item.active .nav-indicator {
                width: 80%;
            }
            
            .scout-nav-mobile-toggle {
                display: none;
                flex-direction: column;
                gap: 4px;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            
            .scout-nav-mobile-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .toggle-line {
                width: 24px;
                height: 2px;
                background: #fff;
                transition: all 0.3s ease;
            }
            
            #scout-navigation.mobile-open .toggle-line:nth-child(1) {
                transform: rotate(45deg) translate(6px, 6px);
            }
            
            #scout-navigation.mobile-open .toggle-line:nth-child(2) {
                opacity: 0;
            }
            
            #scout-navigation.mobile-open .toggle-line:nth-child(3) {
                transform: rotate(-45deg) translate(6px, -6px);
            }
            
            /* High Contrast Mode */
            #scout-navigation.high-contrast {
                background: #000;
                border-bottom: 2px solid #fff;
            }
            
            #scout-navigation.high-contrast .scout-nav-link {
                border: 1px solid transparent;
            }
            
            #scout-navigation.high-contrast .scout-nav-link:focus {
                border-color: #fff;
                outline: 2px solid #fff;
            }
            
            #scout-navigation.high-contrast .scout-nav-item.active .scout-nav-link {
                background: #fff;
                color: #000;
            }
            
            /* Error Fallback */
            .scout-nav-error {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 2rem;
                background: #f44336;
                color: white;
                flex-wrap: wrap;
            }
            
            .scout-nav-error a {
                color: white;
                text-decoration: underline;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .scout-nav-mobile-toggle {
                    display: flex;
                }
                
                .scout-nav-items {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: inherit;
                    flex-direction: column;
                    gap: 0;
                    padding: 1rem 0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-10px);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                #scout-navigation.mobile-open .scout-nav-items {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }
                
                .scout-nav-link {
                    padding: 16px 2rem;
                    border-radius: 0;
                    justify-content: flex-start;
                }
                
                .scout-nav-container {
                    padding: 0 1rem;
                }
                
                .brand-title {
                    font-size: 1.1rem;
                }
                
                .nav-indicator {
                    display: none;
                }
            }
            
            /* Print Styles */
            @media print {
                #scout-navigation {
                    display: none;
                }
            }
            
            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .scout-nav-link,
                .nav-indicator,
                .scout-nav-items,
                .toggle-line {
                    transition: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ScoutNavigation = new ScoutNavigation();
    });
} else {
    window.ScoutNavigation = new ScoutNavigation();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoutNavigation;
}