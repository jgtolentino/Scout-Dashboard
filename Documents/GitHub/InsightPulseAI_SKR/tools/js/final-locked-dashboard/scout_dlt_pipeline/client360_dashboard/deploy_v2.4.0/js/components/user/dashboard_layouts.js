/**
 * Dashboard Layouts Component for Client360 Dashboard v2.4.0
 * Manages customizable dashboard layouts and grid configurations
 * Part of the User Personalization Framework
 */

class DashboardLayouts {
  constructor(config = {}) {
    this.config = {
      storageKey: 'client360_dashboard_layouts',
      containerSelector: '#dashboard-grid',
      editModeClass: 'layout-edit-mode',
      defaultLayouts: {
        'default': {
          name: 'Default Layout',
          isSystem: true,
          grid: {
            columns: 12,
            rowHeight: 50,
            margin: [10, 10],
            containerPadding: [10, 10],
            compactType: 'vertical'
          },
          items: [
            { id: 'sales-overview', x: 0, y: 0, w: 12, h: 2 },
            { id: 'region-performance', x: 0, y: 2, w: 6, h: 4 },
            { id: 'brand-performance', x: 6, y: 2, w: 6, h: 4 },
            { id: 'store-map', x: 0, y: 6, w: 12, h: 6 },
            { id: 'top-products', x: 0, y: 12, w: 4, h: 4 },
            { id: 'ai-insights', x: 4, y: 12, w: 4, h: 4 },
            { id: 'recent-activity', x: 8, y: 12, w: 4, h: 4 }
          ]
        },
        'compact': {
          name: 'Compact View',
          isSystem: true,
          grid: {
            columns: 12,
            rowHeight: 40,
            margin: [5, 5],
            containerPadding: [5, 5],
            compactType: 'vertical'
          },
          items: [
            { id: 'sales-overview', x: 0, y: 0, w: 12, h: 2 },
            { id: 'region-performance', x: 0, y: 2, w: 6, h: 3 },
            { id: 'brand-performance', x: 6, y: 2, w: 6, h: 3 },
            { id: 'store-map', x: 0, y: 5, w: 8, h: 5 },
            { id: 'ai-insights', x: 8, y: 5, w: 4, h: 5 },
            { id: 'top-products', x: 0, y: 10, w: 6, h: 3 },
            { id: 'recent-activity', x: 6, y: 10, w: 6, h: 3 }
          ]
        },
        'analytics-focused': {
          name: 'Analytics Focus',
          isSystem: true,
          grid: {
            columns: 12,
            rowHeight: 50,
            margin: [10, 10],
            containerPadding: [10, 10],
            compactType: 'vertical'
          },
          items: [
            { id: 'sales-overview', x: 0, y: 0, w: 9, h: 2 },
            { id: 'ai-insights', x: 9, y: 0, w: 3, h: 2 },
            { id: 'store-map', x: 0, y: 2, w: 12, h: 8 },
            { id: 'region-performance', x: 0, y: 10, w: 4, h: 4 },
            { id: 'brand-performance', x: 4, y: 10, w: 4, h: 4 },
            { id: 'top-products', x: 8, y: 10, w: 4, h: 4 }
          ]
        }
      },
      maxUserLayouts: 5,
      widgets: [
        { id: 'sales-overview', title: 'Sales Overview', minWidth: 6, minHeight: 2 },
        { id: 'region-performance', title: 'Region Performance', minWidth: 4, minHeight: 3 },
        { id: 'brand-performance', title: 'Brand Performance', minWidth: 4, minHeight: 3 },
        { id: 'store-map', title: 'Store Map', minWidth: 6, minHeight: 5 },
        { id: 'top-products', title: 'Top Products', minWidth: 3, minHeight: 3 },
        { id: 'ai-insights', title: 'AI Insights', minWidth: 3, minHeight: 3 },
        { id: 'recent-activity', title: 'Recent Activity', minWidth: 3, minHeight: 3 },
        { id: 'trend-analysis', title: 'Trend Analysis', minWidth: 4, minHeight: 3 },
        { id: 'sales-by-channel', title: 'Sales by Channel', minWidth: 4, minHeight: 3 },
        { id: 'sales-by-product', title: 'Sales by Product', minWidth: 4, minHeight: 3 }
      ],
      gridstack: null, // Will hold GridStack instance
      ...config
    };
    
    this.layouts = {};
    this.currentLayoutId = 'default';
    this.isEditMode = false;
    this.callbacks = {
      onLayoutChange: [],
      onLayoutSwitch: [],
      onEditModeChange: []
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the layouts system
   */
  async init() {
    console.log('📊 Initializing Dashboard Layouts System');
    
    // Load layouts from storage
    await this.loadLayouts();
    
    // Initialize GridStack if available
    this.initializeGridStack();
    
    console.log('✅ Dashboard Layouts System initialized');
  }
  
  /**
   * Load layouts from storage
   */
  async loadLayouts() {
    try {
      // Start with default layouts
      this.layouts = { ...this.config.defaultLayouts };
      
      // Try to load saved layouts
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const savedLayouts = JSON.parse(stored);
        
        // Merge saved layouts with defaults
        // Note: This will override default layouts with saved versions
        Object.entries(savedLayouts).forEach(([id, layout]) => {
          this.layouts[id] = layout;
        });
      }
      
      // Make sure default layouts are set as isSystem
      Object.keys(this.config.defaultLayouts).forEach(id => {
        if (this.layouts[id]) {
          this.layouts[id].isSystem = true;
        }
      });
      
      // Get current layout ID from preferences if available
      if (window.userPreferences) {
        this.currentLayoutId = window.userPreferences.getPreference('layout.currentLayoutId', 'default');
      }
      
      console.log(`Loaded ${Object.keys(this.layouts).length} dashboard layouts`);
    } catch (error) {
      console.error('Failed to load dashboard layouts:', error);
      // Fall back to defaults
      this.layouts = { ...this.config.defaultLayouts };
    }
  }
  
  /**
   * Save layouts to storage
   */
  async saveLayouts() {
    try {
      localStorage.setItem(
        this.config.storageKey,
        JSON.stringify(this.layouts)
      );
      
      // Update user preferences if available
      if (window.userPreferences) {
        window.userPreferences.setPreference('layout.currentLayoutId', this.currentLayoutId);
      }
    } catch (error) {
      console.error('Failed to save dashboard layouts:', error);
    }
  }
  
  /**
   * Initialize GridStack if available
   */
  initializeGridStack() {
    // Check if GridStack is available
    if (typeof GridStack === 'undefined') {
      console.warn('GridStack not available. Layout editing will be disabled.');
      return;
    }
    
    // Check if container exists
    const container = document.querySelector(this.config.containerSelector);
    if (!container) {
      console.warn(`GridStack container not found: ${this.config.containerSelector}`);
      return;
    }
    
    try {
      // Get current layout
      const currentLayout = this.getLayout(this.currentLayoutId);
      
      // Initialize GridStack
      this.config.gridstack = GridStack.init({
        column: currentLayout.grid.columns,
        cellHeight: currentLayout.grid.rowHeight,
        margin: currentLayout.grid.margin,
        float: true,
        disableOneColumnMode: false,
        staticGrid: true, // Start in static mode (not editable)
        resizable: { handles: 'all' }
      }, container);
      
      // Add event listeners
      this.config.gridstack.on('change', (event, items) => {
        if (this.isEditMode) {
          this.handleLayoutChange(items);
        }
      });
      
      // Load current layout
      this.applyLayout(this.currentLayoutId);
    } catch (error) {
      console.error('Failed to initialize GridStack:', error);
    }
  }
  
  /**
   * Apply a layout to the dashboard
   * @param {string} layoutId - Layout ID
   * @returns {boolean} Success status
   */
  applyLayout(layoutId) {
    // Check if layout exists
    if (!this.layouts[layoutId]) {
      console.error(`Layout not found: ${layoutId}`);
      return false;
    }
    
    try {
      const layout = this.layouts[layoutId];
      
      // Check if GridStack is initialized
      if (!this.config.gridstack) {
        console.warn('GridStack not initialized. Cannot apply layout.');
        return false;
      }
      
      // Update GridStack options
      this.config.gridstack.cellHeight(layout.grid.rowHeight);
      this.config.gridstack.margin(layout.grid.margin[0]);
      
      // Remove all widgets
      this.config.gridstack.removeAll();
      
      // Add items from layout
      layout.items.forEach(item => {
        // Find widget configuration
        const widget = this.findWidgetConfig(item.id);
        if (!widget) return;
        
        // Create element
        const el = document.createElement('div');
        el.className = 'grid-stack-item';
        el.setAttribute('gs-id', item.id);
        el.setAttribute('gs-x', item.x);
        el.setAttribute('gs-y', item.y);
        el.setAttribute('gs-w', item.w);
        el.setAttribute('gs-h', item.h);
        
        // Create content
        el.innerHTML = `
          <div class="grid-stack-item-content">
            <div class="widget-header">
              <h3 class="widget-title">${widget.title}</h3>
              <div class="widget-controls">
                <button class="widget-refresh" title="Refresh widget">
                  <i class="fa fa-refresh"></i>
                </button>
                <button class="widget-settings" title="Widget settings">
                  <i class="fa fa-cog"></i>
                </button>
              </div>
            </div>
            <div class="widget-content" id="${item.id}-content"></div>
          </div>
        `;
        
        // Add to grid
        this.config.gridstack.addWidget(el, item);
      });
      
      // Update current layout ID
      this.currentLayoutId = layoutId;
      
      // Save layouts
      this.saveLayouts();
      
      // Notify listeners
      this.notifyLayoutSwitch(layoutId);
      
      return true;
    } catch (error) {
      console.error(`Failed to apply layout ${layoutId}:`, error);
      return false;
    }
  }
  
  /**
   * Toggle edit mode
   * @param {boolean} [enable] - Enable or disable edit mode, toggles if not specified
   * @returns {boolean} New edit mode state
   */
  toggleEditMode(enable) {
    if (enable === undefined) {
      enable = !this.isEditMode;
    }
    
    try {
      // Check if GridStack is initialized
      if (!this.config.gridstack) {
        console.warn('GridStack not initialized. Cannot toggle edit mode.');
        return false;
      }
      
      // Update edit mode
      this.isEditMode = enable;
      
      // Update GridStack
      this.config.gridstack.setStatic(!enable);
      
      // Update container class
      const container = document.querySelector(this.config.containerSelector);
      if (container) {
        if (enable) {
          container.classList.add(this.config.editModeClass);
        } else {
          container.classList.remove(this.config.editModeClass);
        }
      }
      
      // Notify listeners
      this.notifyEditModeChange(enable);
      
      return enable;
    } catch (error) {
      console.error('Failed to toggle edit mode:', error);
      return this.isEditMode;
    }
  }
  
  /**
   * Create a new layout
   * @param {string} name - Layout name
   * @param {string} [baseLayoutId] - Optional base layout ID to copy from
   * @returns {string|null} New layout ID or null if failed
   */
  createLayout(name, baseLayoutId = null) {
    try {
      // Check if max layouts reached
      const userLayouts = Object.values(this.layouts).filter(l => !l.isSystem);
      if (userLayouts.length >= this.config.maxUserLayouts) {
        console.error(`Maximum number of user layouts (${this.config.maxUserLayouts}) reached`);
        return null;
      }
      
      // Generate unique ID
      const id = `user-${Date.now()}`;
      
      // Create base layout
      let baseLayout;
      if (baseLayoutId && this.layouts[baseLayoutId]) {
        // Copy from specified layout
        baseLayout = JSON.parse(JSON.stringify(this.layouts[baseLayoutId]));
      } else {
        // Copy from current layout
        baseLayout = JSON.parse(JSON.stringify(this.layouts[this.currentLayoutId]));
      }
      
      // Create new layout
      this.layouts[id] = {
        ...baseLayout,
        name: name,
        isSystem: false,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
      
      // Save layouts
      this.saveLayouts();
      
      return id;
    } catch (error) {
      console.error('Failed to create layout:', error);
      return null;
    }
  }
  
  /**
   * Update an existing layout
   * @param {string} layoutId - Layout ID
   * @param {Object} updates - Properties to update
   * @returns {boolean} Success status
   */
  updateLayout(layoutId, updates) {
    // Check if layout exists
    if (!this.layouts[layoutId]) {
      console.error(`Layout not found: ${layoutId}`);
      return false;
    }
    
    // Check if layout is system layout and trying to rename
    if (this.layouts[layoutId].isSystem && updates.name) {
      console.error('Cannot rename system layouts');
      return false;
    }
    
    try {
      // Update layout
      this.layouts[layoutId] = {
        ...this.layouts[layoutId],
        ...updates,
        modified: new Date().toISOString()
      };
      
      // System flag cannot be changed
      this.layouts[layoutId].isSystem = this.config.defaultLayouts[layoutId] ? true : false;
      
      // Save layouts
      this.saveLayouts();
      
      return true;
    } catch (error) {
      console.error(`Failed to update layout ${layoutId}:`, error);
      return false;
    }
  }
  
  /**
   * Delete a layout
   * @param {string} layoutId - Layout ID
   * @returns {boolean} Success status
   */
  deleteLayout(layoutId) {
    // Check if layout exists
    if (!this.layouts[layoutId]) {
      console.error(`Layout not found: ${layoutId}`);
      return false;
    }
    
    // Check if layout is system layout
    if (this.layouts[layoutId].isSystem) {
      console.error('Cannot delete system layouts');
      return false;
    }
    
    try {
      // Delete layout
      delete this.layouts[layoutId];
      
      // If current layout was deleted, switch to default
      if (this.currentLayoutId === layoutId) {
        this.currentLayoutId = 'default';
        this.applyLayout(this.currentLayoutId);
      }
      
      // Save layouts
      this.saveLayouts();
      
      return true;
    } catch (error) {
      console.error(`Failed to delete layout ${layoutId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all available layouts
   * @returns {Array<Object>} Array of layout objects with id and name
   */
  getAvailableLayouts() {
    return Object.entries(this.layouts).map(([id, layout]) => ({
      id,
      name: layout.name,
      isSystem: layout.isSystem,
      isActive: id === this.currentLayoutId,
      created: layout.created,
      modified: layout.modified
    }));
  }
  
  /**
   * Get current layout ID
   * @returns {string} Current layout ID
   */
  getCurrentLayoutId() {
    return this.currentLayoutId;
  }
  
  /**
   * Get a layout by ID
   * @param {string} layoutId - Layout ID
   * @returns {Object|null} Layout or null if not found
   */
  getLayout(layoutId) {
    return this.layouts[layoutId] || null;
  }
  
  /**
   * Get current layout configuration
   * @returns {Object} Current layout
   */
  getCurrentLayout() {
    return this.layouts[this.currentLayoutId];
  }
  
  /**
   * Handle layout changes from GridStack
   * @param {Array<Object>} items - Changed items
   */
  handleLayoutChange(items) {
    if (!this.isEditMode) return;
    
    try {
      // Get current layout
      const layout = this.layouts[this.currentLayoutId];
      
      // Update layout items
      items.forEach(item => {
        const id = item.id || item.el.getAttribute('gs-id');
        const existingItem = layout.items.find(i => i.id === id);
        
        if (existingItem) {
          // Update existing item
          existingItem.x = item.x;
          existingItem.y = item.y;
          existingItem.w = item.w;
          existingItem.h = item.h;
        } else {
          // Add new item
          layout.items.push({
            id,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          });
        }
      });
      
      // Update modified timestamp
      layout.modified = new Date().toISOString();
      
      // Save layouts
      this.saveLayouts();
      
      // Notify listeners
      this.notifyLayoutChange(layout);
    } catch (error) {
      console.error('Failed to handle layout change:', error);
    }
  }
  
  /**
   * Add a widget to the current layout
   * @param {string} widgetId - Widget ID
   * @returns {boolean} Success status
   */
  addWidget(widgetId) {
    try {
      // Find widget configuration
      const widget = this.findWidgetConfig(widgetId);
      if (!widget) {
        console.error(`Widget not found: ${widgetId}`);
        return false;
      }
      
      // Check if GridStack is initialized
      if (!this.config.gridstack) {
        console.warn('GridStack not initialized. Cannot add widget.');
        return false;
      }
      
      // Check if widget already exists in layout
      const layout = this.layouts[this.currentLayoutId];
      if (layout.items.some(item => item.id === widgetId)) {
        console.warn(`Widget already exists in layout: ${widgetId}`);
        return false;
      }
      
      // Create element
      const el = document.createElement('div');
      el.className = 'grid-stack-item';
      el.setAttribute('gs-id', widgetId);
      el.setAttribute('gs-min-w', widget.minWidth || 2);
      el.setAttribute('gs-min-h', widget.minHeight || 2);
      
      // Create content
      el.innerHTML = `
        <div class="grid-stack-item-content">
          <div class="widget-header">
            <h3 class="widget-title">${widget.title}</h3>
            <div class="widget-controls">
              <button class="widget-refresh" title="Refresh widget">
                <i class="fa fa-refresh"></i>
              </button>
              <button class="widget-settings" title="Widget settings">
                <i class="fa fa-cog"></i>
              </button>
            </div>
          </div>
          <div class="widget-content" id="${widgetId}-content"></div>
        </div>
      `;
      
      // Add to grid
      this.config.gridstack.addWidget(el, {
        id: widgetId,
        w: widget.minWidth || 3,
        h: widget.minHeight || 2,
        autoPosition: true
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to add widget ${widgetId}:`, error);
      return false;
    }
  }
  
  /**
   * Remove a widget from the current layout
   * @param {string} widgetId - Widget ID
   * @returns {boolean} Success status
   */
  removeWidget(widgetId) {
    try {
      // Check if GridStack is initialized
      if (!this.config.gridstack) {
        console.warn('GridStack not initialized. Cannot remove widget.');
        return false;
      }
      
      // Find widget element
      const el = document.querySelector(`.grid-stack-item[gs-id="${widgetId}"]`);
      if (!el) {
        console.error(`Widget element not found: ${widgetId}`);
        return false;
      }
      
      // Remove widget
      this.config.gridstack.removeWidget(el);
      
      // Update layout
      const layout = this.layouts[this.currentLayoutId];
      layout.items = layout.items.filter(item => item.id !== widgetId);
      
      // Update modified timestamp
      layout.modified = new Date().toISOString();
      
      // Save layouts
      this.saveLayouts();
      
      return true;
    } catch (error) {
      console.error(`Failed to remove widget ${widgetId}:`, error);
      return false;
    }
  }
  
  /**
   * Find widget configuration by ID
   * @param {string} widgetId - Widget ID
   * @returns {Object|null} Widget configuration or null if not found
   */
  findWidgetConfig(widgetId) {
    return this.config.widgets.find(w => w.id === widgetId) || null;
  }
  
  /**
   * Get all available widgets
   * @returns {Array<Object>} Array of widget configurations
   */
  getAvailableWidgets() {
    return [...this.config.widgets];
  }
  
  /**
   * Get widgets in current layout
   * @returns {Array<Object>} Array of widget IDs in current layout
   */
  getCurrentWidgets() {
    const layout = this.layouts[this.currentLayoutId];
    if (!layout) return [];
    
    return layout.items.map(item => ({
      id: item.id,
      ...this.findWidgetConfig(item.id)
    }));
  }
  
  /**
   * Register for layout change events
   * @param {Function} callback - Callback function(layout)
   * @returns {number} Handler ID for unregistering
   */
  onLayoutChange(callback) {
    const id = Date.now();
    this.callbacks.onLayoutChange.push({ id, callback });
    return id;
  }
  
  /**
   * Register for layout switch events
   * @param {Function} callback - Callback function(layoutId)
   * @returns {number} Handler ID for unregistering
   */
  onLayoutSwitch(callback) {
    const id = Date.now();
    this.callbacks.onLayoutSwitch.push({ id, callback });
    return id;
  }
  
  /**
   * Register for edit mode change events
   * @param {Function} callback - Callback function(isEditMode)
   * @returns {number} Handler ID for unregistering
   */
  onEditModeChange(callback) {
    const id = Date.now();
    this.callbacks.onEditModeChange.push({ id, callback });
    return id;
  }
  
  /**
   * Unregister event handler
   * @param {number} id - Handler ID
   * @param {string} eventType - Event type (onLayoutChange, onLayoutSwitch, onEditModeChange)
   * @returns {boolean} Success status
   */
  offEvent(id, eventType) {
    if (!this.callbacks[eventType]) return false;
    
    const index = this.callbacks[eventType].findIndex(cb => cb.id === id);
    if (index === -1) return false;
    
    this.callbacks[eventType].splice(index, 1);
    return true;
  }
  
  /**
   * Notify layout change listeners
   * @param {Object} layout - Layout configuration
   */
  notifyLayoutChange(layout) {
    this.callbacks.onLayoutChange.forEach(({ callback }) => {
      try {
        callback(layout);
      } catch (error) {
        console.error('Error in layout change callback:', error);
      }
    });
  }
  
  /**
   * Notify layout switch listeners
   * @param {string} layoutId - New layout ID
   */
  notifyLayoutSwitch(layoutId) {
    this.callbacks.onLayoutSwitch.forEach(({ callback }) => {
      try {
        callback(layoutId);
      } catch (error) {
        console.error('Error in layout switch callback:', error);
      }
    });
  }
  
  /**
   * Notify edit mode change listeners
   * @param {boolean} isEditMode - New edit mode state
   */
  notifyEditModeChange(isEditMode) {
    this.callbacks.onEditModeChange.forEach(({ callback }) => {
      try {
        callback(isEditMode);
      } catch (error) {
        console.error('Error in edit mode change callback:', error);
      }
    });
  }
  
  /**
   * Reset to default layouts
   * @returns {boolean} Success status
   */
  resetToDefaults() {
    try {
      // Keep only system layouts
      this.layouts = { ...this.config.defaultLayouts };
      
      // Update current layout ID
      this.currentLayoutId = 'default';
      
      // Apply default layout
      this.applyLayout(this.currentLayoutId);
      
      // Save layouts
      this.saveLayouts();
      
      return true;
    } catch (error) {
      console.error('Failed to reset layouts to defaults:', error);
      return false;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up GridStack instance
    if (this.config.gridstack) {
      this.config.gridstack.destroy();
      this.config.gridstack = null;
    }
    
    // Clear callbacks
    this.callbacks.onLayoutChange = [];
    this.callbacks.onLayoutSwitch = [];
    this.callbacks.onEditModeChange = [];
  }
}

// Export to window
window.DashboardLayouts = DashboardLayouts;