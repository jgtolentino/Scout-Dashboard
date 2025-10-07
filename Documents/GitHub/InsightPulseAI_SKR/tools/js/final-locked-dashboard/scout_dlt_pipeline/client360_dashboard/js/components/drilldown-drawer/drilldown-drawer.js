/**
 * Drill-down Drawer UI - PATCH 4: Drill-down drawer UI (feature/drilldown-drawer-ui)
 * Implements contextual data drill-down with sliding drawer interface
 * 
 * PRD Sections Addressed:
 * - Section 4: Transaction Analytics (Detailed transaction drill-down)
 * - Section 3: Brand Performance Analytics (Brand detail exploration)
 * - Section 5: User Interface (Interactive drill-down patterns)
 * 
 * Namespace: PATCH4_DrilldownDrawer
 */

class PATCH4_DrilldownDrawer {
    constructor(options = {}) {
        this.namespace = 'PATCH4_DrilldownDrawer';
        this.config = {
            position: 'right', // 'left', 'right', 'bottom'
            width: '400px',
            height: '300px',
            overlay: true,
            closeOnEscape: true,
            closeOnOverlay: true,
            animation: 'slide',
            duration: 300,
            maxStack: 3,
            ...options
        };
        
        this.drawers = [];
        this.currentDrawer = null;
        this.isOpen = false;
        this.listeners = new Set();
        this.drawerStack = [];
        
        this.drilldownTypes = {
            brand: {
                title: 'Brand Details',
                icon: 'trending_up',
                color: '#2196F3',
                sections: ['overview', 'metrics', 'products', 'campaigns', 'performance']
            },
            transaction: {
                title: 'Transaction Details',
                icon: 'receipt',
                color: '#4CAF50',
                sections: ['details', 'items', 'customer', 'location', 'timeline']
            },
            location: {
                title: 'Location Details',
                icon: 'place',
                color: '#FF9800',
                sections: ['overview', 'performance', 'products', 'customers', 'trends']
            },
            product: {
                title: 'Product Details',
                icon: 'inventory',
                color: '#9C27B0',
                sections: ['overview', 'performance', 'availability', 'substitutions', 'trends']
            },
            customer: {
                title: 'Customer Details',
                icon: 'person',
                color: '#F44336',
                sections: ['profile', 'history', 'preferences', 'segments', 'insights']
            }
        };
        
        this.init();
    }

    init() {
        this.createDrawerContainer();
        this.setupEventListeners();
        this.attachStyles();
        
        console.log(`[${this.namespace}] Drill-down drawer initialized`);
    }

    createDrawerContainer() {
        // Remove existing container if any
        const existing = document.getElementById('patch4-drilldown-container');
        if (existing) {
            existing.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'patch4-drilldown-container';
        this.container.className = 'patch4-drilldown-container';
        this.container.innerHTML = `
            <div class="drilldown-overlay"></div>
            <div class="drilldown-drawer" data-position="${this.config.position}">
                <div class="drawer-header">
                    <div class="drawer-title-section">
                        <button class="drawer-back-btn" title="Go back">
                            <i class="material-icons">arrow_back</i>
                        </button>
                        <div class="drawer-title-info">
                            <i class="drawer-icon material-icons">info</i>
                            <h3 class="drawer-title">Details</h3>
                            <span class="drawer-subtitle"></span>
                        </div>
                    </div>
                    <div class="drawer-actions">
                        <button class="drawer-action-btn" data-action="expand" title="Expand">
                            <i class="material-icons">open_in_full</i>
                        </button>
                        <button class="drawer-action-btn" data-action="export" title="Export">
                            <i class="material-icons">download</i>
                        </button>
                        <button class="drawer-close-btn" title="Close">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                </div>
                
                <div class="drawer-tabs">
                    <div class="drawer-tabs-container"></div>
                </div>
                
                <div class="drawer-content">
                    <div class="drawer-loading">
                        <div class="loading-spinner"></div>
                        <span>Loading details...</span>
                    </div>
                    <div class="drawer-error" style="display: none;">
                        <i class="material-icons">error</i>
                        <span class="error-message">Failed to load details</span>
                        <button class="retry-btn">Retry</button>
                    </div>
                    <div class="drawer-main-content"></div>
                </div>
                
                <div class="drawer-footer">
                    <div class="drawer-breadcrumb"></div>
                    <div class="drawer-status">
                        <span class="status-text">Ready</span>
                        <span class="last-updated"></span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        this.elements = {
            container: this.container,
            overlay: this.container.querySelector('.drilldown-overlay'),
            drawer: this.container.querySelector('.drilldown-drawer'),
            backBtn: this.container.querySelector('.drawer-back-btn'),
            icon: this.container.querySelector('.drawer-icon'),
            title: this.container.querySelector('.drawer-title'),
            subtitle: this.container.querySelector('.drawer-subtitle'),
            actions: this.container.querySelector('.drawer-actions'),
            closeBtn: this.container.querySelector('.drawer-close-btn'),
            tabsContainer: this.container.querySelector('.drawer-tabs-container'),
            content: this.container.querySelector('.drawer-content'),
            loading: this.container.querySelector('.drawer-loading'),
            error: this.container.querySelector('.drawer-error'),
            mainContent: this.container.querySelector('.drawer-main-content'),
            breadcrumb: this.container.querySelector('.drawer-breadcrumb'),
            statusText: this.container.querySelector('.status-text'),
            lastUpdated: this.container.querySelector('.last-updated')
        };
    }

    setupEventListeners() {
        // Close button
        this.elements.closeBtn.addEventListener('click', () => this.close());
        
        // Back button
        this.elements.backBtn.addEventListener('click', () => this.goBack());
        
        // Overlay click
        if (this.config.closeOnOverlay) {
            this.elements.overlay.addEventListener('click', () => this.close());
        }
        
        // Escape key
        if (this.config.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
        
        // Action buttons
        this.elements.actions.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.drawer-action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleAction(action);
            }
        });
        
        // Tab switching
        this.elements.tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.drawer-tab');
            if (tab) {
                this.switchTab(tab.dataset.section);
            }
        });
        
        // Retry button
        this.elements.error.querySelector('.retry-btn').addEventListener('click', () => {
            this.retryLoad();
        });
        
        // Global drill-down triggers
        document.addEventListener('click', (e) => {
            const drillTrigger = e.target.closest('[data-drilldown]');
            if (drillTrigger) {
                e.preventDefault();
                this.handleDrilldownTrigger(drillTrigger);
            }
        });
    }

    handleDrilldownTrigger(trigger) {
        const type = trigger.dataset.drilldown;
        const id = trigger.dataset.drilldownId || trigger.dataset.id;
        const context = trigger.dataset.drilldownContext || {};
        
        try {
            const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
            this.openDrilldown(type, id, parsedContext);
        } catch (error) {
            console.error(`[${this.namespace}] Invalid drilldown context:`, error);
            this.openDrilldown(type, id, {});
        }
    }

    async openDrilldown(type, id, context = {}) {
        if (!this.drilldownTypes[type]) {
            console.error(`[${this.namespace}] Unknown drilldown type: ${type}`);
            return;
        }
        
        const drilldownConfig = this.drilldownTypes[type];
        
        // Create drawer data
        const drawerData = {
            id: `${type}-${id}`,
            type,
            entityId: id,
            context,
            config: drilldownConfig,
            activeSection: drilldownConfig.sections[0],
            timestamp: Date.now()
        };
        
        // Push to stack if not already open
        if (this.currentDrawer && this.currentDrawer.id !== drawerData.id) {
            this.drawerStack.push(this.currentDrawer);
            
            // Limit stack size
            if (this.drawerStack.length > this.config.maxStack) {
                this.drawerStack.shift();
            }
        }
        
        this.currentDrawer = drawerData;
        
        // Open drawer
        this.open();
        
        // Setup drawer content
        this.setupDrawerContent(drawerData);
        
        // Load data
        await this.loadDrawerData(drawerData);
        
        this.notifyListeners('drilldown-opened', { type, id, context });
    }

    setupDrawerContent(drawerData) {
        const { config, type, entityId } = drawerData;
        
        // Update header
        this.elements.icon.textContent = config.icon;
        this.elements.title.textContent = config.title;
        this.elements.subtitle.textContent = `ID: ${entityId}`;
        this.elements.drawer.style.setProperty('--drawer-color', config.color);
        
        // Show/hide back button
        this.elements.backBtn.style.display = this.drawerStack.length > 0 ? 'flex' : 'none';
        
        // Setup tabs
        this.setupTabs(config.sections, drawerData.activeSection);
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Show loading state
        this.showLoading();
    }

    setupTabs(sections, activeSection) {
        const tabsHTML = sections.map(section => `
            <button class="drawer-tab ${section === activeSection ? 'active' : ''}" 
                    data-section="${section}">
                <span class="tab-label">${this.formatSectionName(section)}</span>
            </button>
        `).join('');
        
        this.elements.tabsContainer.innerHTML = tabsHTML;
    }

    formatSectionName(section) {
        return section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1');
    }

    async loadDrawerData(drawerData) {
        try {
            this.showLoading();
            
            // Simulate API call - in real implementation, this would call actual APIs
            const data = await this.fetchDrilldownData(drawerData);
            
            this.renderContent(data, drawerData);
            this.hideLoading();
            
            this.elements.statusText.textContent = 'Loaded';
            this.elements.lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            
        } catch (error) {
            console.error(`[${this.namespace}] Failed to load drilldown data:`, error);
            this.showError(error.message);
        }
    }

    async fetchDrilldownData(drawerData) {
        // Mock data generation based on type
        const { type, entityId, activeSection } = drawerData;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        switch (type) {
            case 'brand':
                return this.generateBrandData(entityId, activeSection);
            case 'transaction':
                return this.generateTransactionData(entityId, activeSection);
            case 'location':
                return this.generateLocationData(entityId, activeSection);
            case 'product':
                return this.generateProductData(entityId, activeSection);
            case 'customer':
                return this.generateCustomerData(entityId, activeSection);
            default:
                throw new Error(`Unknown drilldown type: ${type}`);
        }
    }

    generateBrandData(brandId, section) {
        const baseData = {
            id: brandId,
            name: `Brand ${brandId}`,
            category: 'Beverages',
            marketShare: 23.5,
            revenue: 15600000,
            growth: 2.3
        };
        
        switch (section) {
            case 'overview':
                return {
                    ...baseData,
                    description: 'Leading beverage brand with strong market presence',
                    founded: '1886',
                    headquarters: 'Atlanta, GA',
                    employees: '700,000+',
                    markets: '200+ countries'
                };
            case 'metrics':
                return {
                    sales: {
                        current: baseData.revenue,
                        previous: baseData.revenue * 0.95,
                        growth: baseData.growth,
                        target: baseData.revenue * 1.1
                    },
                    market: {
                        share: baseData.marketShare,
                        rank: 1,
                        competitors: ['Pepsi', 'Sprite', 'Fanta']
                    },
                    performance: {
                        sentiment: 0.78,
                        availability: 94.2,
                        quality: 0.85
                    }
                };
            case 'products':
                return {
                    products: [
                        { name: 'Classic', volume: '60%', growth: '1.2%' },
                        { name: 'Zero', volume: '25%', growth: '5.8%' },
                        { name: 'Diet', volume: '15%', growth: '-2.1%' }
                    ]
                };
            case 'campaigns':
                return {
                    campaigns: [
                        { name: 'Summer Refresh', status: 'Active', budget: '$2M', roi: '3.2x' },
                        { name: 'Holiday Magic', status: 'Planned', budget: '$5M', roi: 'TBD' }
                    ]
                };
            default:
                return baseData;
        }
    }

    generateTransactionData(transactionId, section) {
        const baseData = {
            id: transactionId,
            timestamp: new Date().toISOString(),
            amount: 24.99,
            items: 3,
            customer: 'John Doe',
            location: 'Store #123'
        };
        
        switch (section) {
            case 'details':
                return {
                    ...baseData,
                    paymentMethod: 'Credit Card',
                    currency: 'PHP',
                    tax: 2.99,
                    discount: 5.00,
                    subtotal: 27.00
                };
            case 'items':
                return {
                    items: [
                        { name: 'Coca-Cola 500ml', quantity: 2, price: 8.99, total: 17.98 },
                        { name: 'Chips', quantity: 1, price: 4.50, total: 4.50 },
                        { name: 'Water 1L', quantity: 1, price: 2.51, total: 2.51 }
                    ]
                };
            case 'customer':
                return {
                    customer: {
                        name: 'John Doe',
                        id: 'CUST001',
                        tier: 'Gold',
                        totalSpent: 1250.00,
                        visits: 45,
                        lastVisit: '2024-01-20'
                    }
                };
            default:
                return baseData;
        }
    }

    generateLocationData(locationId, section) {
        const baseData = {
            id: locationId,
            name: `Store #${locationId}`,
            address: '123 Main St, City',
            type: 'Retail',
            area: '2,500 sqft'
        };
        
        return { ...baseData, section: section };
    }

    generateProductData(productId, section) {
        const baseData = {
            id: productId,
            name: `Product ${productId}`,
            sku: `SKU-${productId}`,
            category: 'Beverages',
            price: 8.99
        };
        
        return { ...baseData, section: section };
    }

    generateCustomerData(customerId, section) {
        const baseData = {
            id: customerId,
            name: `Customer ${customerId}`,
            email: `customer${customerId}@example.com`,
            tier: 'Gold',
            totalSpent: 1250.00
        };
        
        return { ...baseData, section: section };
    }

    renderContent(data, drawerData) {
        const { type, activeSection } = drawerData;
        
        let contentHTML = '';
        
        switch (type) {
            case 'brand':
                contentHTML = this.renderBrandContent(data, activeSection);
                break;
            case 'transaction':
                contentHTML = this.renderTransactionContent(data, activeSection);
                break;
            case 'location':
                contentHTML = this.renderLocationContent(data, activeSection);
                break;
            case 'product':
                contentHTML = this.renderProductContent(data, activeSection);
                break;
            case 'customer':
                contentHTML = this.renderCustomerContent(data, activeSection);
                break;
            default:
                contentHTML = this.renderGenericContent(data);
        }
        
        this.elements.mainContent.innerHTML = contentHTML;
    }

    renderBrandContent(data, section) {
        switch (section) {
            case 'overview':
                return `
                    <div class="content-section">
                        <h4>Brand Overview</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name</label>
                                <span>${data.name}</span>
                            </div>
                            <div class="info-item">
                                <label>Category</label>
                                <span>${data.category}</span>
                            </div>
                            <div class="info-item">
                                <label>Founded</label>
                                <span>${data.founded}</span>
                            </div>
                            <div class="info-item">
                                <label>Headquarters</label>
                                <span>${data.headquarters}</span>
                            </div>
                            <div class="info-item">
                                <label>Employees</label>
                                <span>${data.employees}</span>
                            </div>
                            <div class="info-item">
                                <label>Markets</label>
                                <span>${data.markets}</span>
                            </div>
                        </div>
                        <div class="description">
                            <p>${data.description}</p>
                        </div>
                    </div>
                `;
            case 'metrics':
                return `
                    <div class="content-section">
                        <h4>Performance Metrics</h4>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <label>Current Sales</label>
                                <span class="metric-value">₱${(data.sales.current / 1000000).toFixed(1)}M</span>
                                <span class="metric-change positive">+${data.sales.growth}%</span>
                            </div>
                            <div class="metric-card">
                                <label>Market Share</label>
                                <span class="metric-value">${data.market.share}%</span>
                                <span class="metric-rank">#${data.market.rank}</span>
                            </div>
                            <div class="metric-card">
                                <label>Sentiment</label>
                                <span class="metric-value">${(data.performance.sentiment * 100).toFixed(0)}%</span>
                                <span class="metric-indicator positive">●</span>
                            </div>
                            <div class="metric-card">
                                <label>Availability</label>
                                <span class="metric-value">${data.performance.availability}%</span>
                                <span class="metric-indicator positive">●</span>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return this.renderGenericContent(data);
        }
    }

    renderTransactionContent(data, section) {
        switch (section) {
            case 'details':
                return `
                    <div class="content-section">
                        <h4>Transaction Details</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Transaction ID</label>
                                <span>${data.id}</span>
                            </div>
                            <div class="info-item">
                                <label>Timestamp</label>
                                <span>${new Date(data.timestamp).toLocaleString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Payment Method</label>
                                <span>${data.paymentMethod}</span>
                            </div>
                            <div class="info-item">
                                <label>Subtotal</label>
                                <span>₱${data.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="info-item">
                                <label>Discount</label>
                                <span>-₱${data.discount.toFixed(2)}</span>
                            </div>
                            <div class="info-item">
                                <label>Tax</label>
                                <span>₱${data.tax.toFixed(2)}</span>
                            </div>
                            <div class="info-item total">
                                <label>Total</label>
                                <span>₱${data.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'items':
                return `
                    <div class="content-section">
                        <h4>Items (${data.items.length})</h4>
                        <div class="items-list">
                            ${data.items.map(item => `
                                <div class="item-row">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-quantity">×${item.quantity}</div>
                                    <div class="item-price">₱${item.price.toFixed(2)}</div>
                                    <div class="item-total">₱${item.total.toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            default:
                return this.renderGenericContent(data);
        }
    }

    renderLocationContent(data, section) {
        return this.renderGenericContent(data);
    }

    renderProductContent(data, section) {
        return this.renderGenericContent(data);
    }

    renderCustomerContent(data, section) {
        return this.renderGenericContent(data);
    }

    renderGenericContent(data) {
        return `
            <div class="content-section">
                <h4>Details</h4>
                <pre class="json-display">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
    }

    switchTab(section) {
        if (!this.currentDrawer) return;
        
        // Update active tab
        this.elements.tabsContainer.querySelectorAll('.drawer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === section);
        });
        
        // Update drawer data
        this.currentDrawer.activeSection = section;
        
        // Reload content for new section
        this.loadDrawerData(this.currentDrawer);
        
        this.notifyListeners('tab-changed', { section, drawer: this.currentDrawer });
    }

    handleAction(action) {
        switch (action) {
            case 'expand':
                this.toggleExpanded();
                break;
            case 'export':
                this.exportData();
                break;
            default:
                this.notifyListeners('action-triggered', { action, drawer: this.currentDrawer });
        }
    }

    toggleExpanded() {
        this.elements.drawer.classList.toggle('expanded');
        const isExpanded = this.elements.drawer.classList.contains('expanded');
        
        const expandBtn = this.elements.actions.querySelector('[data-action="expand"]');
        expandBtn.querySelector('.material-icons').textContent = isExpanded ? 'close_fullscreen' : 'open_in_full';
        expandBtn.title = isExpanded ? 'Collapse' : 'Expand';
        
        this.notifyListeners('drawer-toggled', { expanded: isExpanded });
    }

    exportData() {
        if (!this.currentDrawer) return;
        
        const exportData = {
            type: this.currentDrawer.type,
            entityId: this.currentDrawer.entityId,
            section: this.currentDrawer.activeSection,
            timestamp: new Date().toISOString(),
            data: this.elements.mainContent.textContent
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentDrawer.type}-${this.currentDrawer.entityId}-${this.currentDrawer.activeSection}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.notifyListeners('data-exported', { drawer: this.currentDrawer });
    }

    goBack() {
        if (this.drawerStack.length === 0) {
            this.close();
            return;
        }
        
        const previousDrawer = this.drawerStack.pop();
        this.currentDrawer = previousDrawer;
        
        this.setupDrawerContent(previousDrawer);
        this.loadDrawerData(previousDrawer);
        
        this.notifyListeners('drawer-back', { drawer: previousDrawer });
    }

    open() {
        this.isOpen = true;
        this.elements.container.classList.add('open');
        document.body.classList.add('drawer-open');
        
        this.notifyListeners('drawer-opened');
    }

    close() {
        this.isOpen = false;
        this.elements.container.classList.remove('open');
        document.body.classList.remove('drawer-open');
        
        this.currentDrawer = null;
        this.drawerStack = [];
        
        this.notifyListeners('drawer-closed');
    }

    showLoading() {
        this.elements.loading.style.display = 'flex';
        this.elements.error.style.display = 'none';
        this.elements.mainContent.style.display = 'none';
        this.elements.statusText.textContent = 'Loading...';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
        this.elements.mainContent.style.display = 'block';
    }

    showError(message) {
        this.elements.loading.style.display = 'none';
        this.elements.mainContent.style.display = 'none';
        this.elements.error.style.display = 'flex';
        this.elements.error.querySelector('.error-message').textContent = message;
        this.elements.statusText.textContent = 'Error';
    }

    retryLoad() {
        if (this.currentDrawer) {
            this.loadDrawerData(this.currentDrawer);
        }
    }

    updateBreadcrumb() {
        const breadcrumbs = [];
        
        // Add stack breadcrumbs
        this.drawerStack.forEach((drawer, index) => {
            breadcrumbs.push({
                text: `${drawer.config.title} (${drawer.entityId})`,
                index: index
            });
        });
        
        // Add current breadcrumb
        if (this.currentDrawer) {
            breadcrumbs.push({
                text: `${this.currentDrawer.config.title} (${this.currentDrawer.entityId})`,
                current: true
            });
        }
        
        this.elements.breadcrumb.innerHTML = breadcrumbs.map(crumb => `
            <span class="breadcrumb-item ${crumb.current ? 'current' : ''}" 
                  ${crumb.index !== undefined ? `data-index="${crumb.index}"` : ''}>
                ${crumb.text}
            </span>
        `).join('<span class="breadcrumb-separator">›</span>');
        
        // Add click handlers for breadcrumb navigation
        this.elements.breadcrumb.querySelectorAll('.breadcrumb-item[data-index]').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.navigateToBreadcrumb(index);
            });
        });
    }

    navigateToBreadcrumb(index) {
        if (index < 0 || index >= this.drawerStack.length) return;
        
        // Remove items after the selected index
        this.drawerStack = this.drawerStack.slice(0, index + 1);
        
        // Navigate to the selected drawer
        this.goBack();
    }

    // Event system
    onDrawerEvent(callback) {
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
    openBrand(brandId, context = {}) {
        return this.openDrilldown('brand', brandId, context);
    }

    openTransaction(transactionId, context = {}) {
        return this.openDrilldown('transaction', transactionId, context);
    }

    openLocation(locationId, context = {}) {
        return this.openDrilldown('location', locationId, context);
    }

    openProduct(productId, context = {}) {
        return this.openDrilldown('product', productId, context);
    }

    openCustomer(customerId, context = {}) {
        return this.openDrilldown('customer', customerId, context);
    }

    getCurrentDrawer() {
        return this.currentDrawer;
    }

    getDrawerStack() {
        return [...this.drawerStack];
    }

    attachStyles() {
        if (document.getElementById('patch4-drilldown-drawer-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'patch4-drilldown-drawer-styles';
        styles.textContent = `
            .patch4-drilldown-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                pointer-events: none;
                transition: all ${this.config.duration}ms ease;
            }
            
            .patch4-drilldown-container.open {
                pointer-events: all;
            }
            
            .drilldown-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: opacity ${this.config.duration}ms ease;
            }
            
            .patch4-drilldown-container.open .drilldown-overlay {
                opacity: 1;
            }
            
            .drilldown-drawer {
                position: absolute;
                background: white;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                transition: transform ${this.config.duration}ms ease;
                --drawer-color: #2196F3;
            }
            
            .drilldown-drawer[data-position="right"] {
                top: 0;
                right: 0;
                width: ${this.config.width};
                height: 100%;
                transform: translateX(100%);
            }
            
            .drilldown-drawer[data-position="left"] {
                top: 0;
                left: 0;
                width: ${this.config.width};
                height: 100%;
                transform: translateX(-100%);
            }
            
            .drilldown-drawer[data-position="bottom"] {
                bottom: 0;
                left: 0;
                right: 0;
                height: ${this.config.height};
                transform: translateY(100%);
            }
            
            .patch4-drilldown-container.open .drilldown-drawer {
                transform: translate(0, 0);
            }
            
            .drilldown-drawer.expanded {
                width: 80vw !important;
                height: 90vh !important;
                top: 5vh !important;
                right: 10vw !important;
                border-radius: 8px;
            }
            
            .drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(90deg, var(--drawer-color), rgba(var(--drawer-color), 0.8));
                color: white;
                min-height: 64px;
            }
            
            .drawer-title-section {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }
            
            .drawer-back-btn {
                background: none;
                border: none;
                color: white;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                display: none;
                align-items: center;
                transition: background 0.2s ease;
            }
            
            .drawer-back-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .drawer-title-info {
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 0;
            }
            
            .drawer-icon {
                font-size: 24px;
            }
            
            .drawer-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .drawer-subtitle {
                font-size: 12px;
                opacity: 0.9;
                white-space: nowrap;
            }
            
            .drawer-actions {
                display: flex;
                gap: 4px;
            }
            
            .drawer-action-btn,
            .drawer-close-btn {
                background: none;
                border: none;
                color: white;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: background 0.2s ease;
            }
            
            .drawer-action-btn:hover,
            .drawer-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .drawer-tabs {
                border-bottom: 1px solid #e0e0e0;
                background: #f8f9fa;
            }
            
            .drawer-tabs-container {
                display: flex;
                overflow-x: auto;
                padding: 0 20px;
            }
            
            .drawer-tab {
                background: none;
                border: none;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
                white-space: nowrap;
                font-size: 14px;
                color: #666;
            }
            
            .drawer-tab:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #333;
            }
            
            .drawer-tab.active {
                border-bottom-color: var(--drawer-color);
                color: var(--drawer-color);
                font-weight: 500;
            }
            
            .drawer-content {
                flex: 1;
                overflow-y: auto;
                position: relative;
            }
            
            .drawer-loading,
            .drawer-error {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                color: #666;
                background: white;
            }
            
            .loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #f0f0f0;
                border-top: 3px solid var(--drawer-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .drawer-error .material-icons {
                font-size: 48px;
                color: #f44336;
            }
            
            .retry-btn {
                padding: 8px 16px;
                background: var(--drawer-color);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .retry-btn:hover {
                background: rgba(var(--drawer-color), 0.8);
            }
            
            .drawer-main-content {
                padding: 20px;
            }
            
            .content-section {
                margin-bottom: 24px;
            }
            
            .content-section h4 {
                margin: 0 0 16px 0;
                color: #333;
                font-size: 16px;
                font-weight: 600;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 8px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .info-item.total {
                grid-column: 1 / -1;
                border-top: 1px solid #e0e0e0;
                padding-top: 8px;
                font-weight: 600;
            }
            
            .info-item label {
                font-size: 12px;
                color: #666;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .info-item span {
                font-size: 14px;
                color: #333;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            }
            
            .metric-card {
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid var(--drawer-color);
            }
            
            .metric-card label {
                display: block;
                font-size: 12px;
                color: #666;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .metric-value {
                display: block;
                font-size: 20px;
                font-weight: 600;
                color: #333;
                margin-bottom: 4px;
            }
            
            .metric-change {
                font-size: 12px;
                font-weight: 500;
            }
            
            .metric-change.positive {
                color: #4CAF50;
            }
            
            .metric-change.negative {
                color: #f44336;
            }
            
            .metric-indicator {
                font-size: 16px;
            }
            
            .metric-indicator.positive {
                color: #4CAF50;
            }
            
            .metric-indicator.negative {
                color: #f44336;
            }
            
            .items-list {
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .item-row {
                display: grid;
                grid-template-columns: 1fr auto auto auto;
                gap: 12px;
                padding: 12px 16px;
                border-bottom: 1px solid #f0f0f0;
                align-items: center;
            }
            
            .item-row:last-child {
                border-bottom: none;
            }
            
            .item-name {
                font-weight: 500;
            }
            
            .item-quantity {
                color: #666;
                font-size: 14px;
            }
            
            .item-price,
            .item-total {
                font-family: monospace;
                text-align: right;
            }
            
            .item-total {
                font-weight: 600;
            }
            
            .json-display {
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 16px;
                font-size: 12px;
                line-height: 1.4;
                overflow-x: auto;
                white-space: pre-wrap;
                word-break: break-all;
            }
            
            .drawer-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                border-top: 1px solid #e0e0e0;
                background: #f8f9fa;
                font-size: 12px;
                color: #666;
                min-height: 48px;
            }
            
            .drawer-breadcrumb {
                display: flex;
                align-items: center;
                gap: 4px;
                flex: 1;
                min-width: 0;
                overflow-x: auto;
            }
            
            .breadcrumb-item {
                white-space: nowrap;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 2px;
                transition: background 0.2s ease;
            }
            
            .breadcrumb-item:not(.current):hover {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .breadcrumb-item.current {
                font-weight: 500;
                color: var(--drawer-color);
            }
            
            .breadcrumb-separator {
                margin: 0 4px;
                color: #999;
            }
            
            .drawer-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-text {
                font-weight: 500;
            }
            
            .last-updated {
                color: #999;
            }
            
            body.drawer-open {
                overflow: hidden;
            }
            
            @media (max-width: 768px) {
                .drilldown-drawer[data-position="right"],
                .drilldown-drawer[data-position="left"] {
                    width: 100% !important;
                }
                
                .drilldown-drawer.expanded {
                    width: 100% !important;
                    height: 100% !important;
                    top: 0 !important;
                    right: 0 !important;
                    border-radius: 0;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                }
                
                .metrics-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .item-row {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }
                
                .item-quantity,
                .item-price,
                .item-total {
                    text-align: left;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PATCH4_DrilldownDrawer = new PATCH4_DrilldownDrawer();
    });
} else {
    window.PATCH4_DrilldownDrawer = new PATCH4_DrilldownDrawer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PATCH4_DrilldownDrawer;
}