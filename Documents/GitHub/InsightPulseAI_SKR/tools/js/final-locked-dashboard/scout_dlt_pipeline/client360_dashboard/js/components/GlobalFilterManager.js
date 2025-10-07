/**
 * Global Filter Manager
 * Manages and synchronizes filters across all dashboard components
 */

class GlobalFilterManager {
  constructor() {
    this.filters = {
      // Date range filters
      startDate: null,
      endDate: null,
      
      // Location filters
      province: null,
      municipality: null,
      barangay: null,
      storeId: null,
      
      // Product filters
      category: null,
      brandFamily: null,
      productId: null,
      
      // Customer filters
      segment: null,
      ageGroup: null,
      gender: null,
      
      // Other filters
      dataSource: 'SIM', // SIM or LIVE
      timeGranularity: 'daily'
    };
    
    this.subscribers = new Set();
    this.filterHistory = [];
    
    // Bind methods
    this.setFilter = this.setFilter.bind(this);
    this.setFilters = this.setFilters.bind(this);
    this.clearFilters = this.clearFilters.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    
    // Initialize
    this.init();
  }

  init() {
    // Load saved filters from localStorage
    this.loadSavedFilters();
    
    // Setup URL parameter sync
    this.setupUrlSync();
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Make globally available
    window.globalFilters = this.filters;
    window.filterManager = this;
  }

  loadSavedFilters() {
    try {
      const saved = localStorage.getItem('scoutDashboardFilters');
      if (saved) {
        const savedFilters = JSON.parse(saved);
        // Only load non-date filters (dates should be fresh)
        Object.keys(savedFilters).forEach(key => {
          if (!key.includes('Date') && savedFilters[key] !== null) {
            this.filters[key] = savedFilters[key];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load saved filters:', error);
    }
  }

  saveFilters() {
    try {
      localStorage.setItem('scoutDashboardFilters', JSON.stringify(this.filters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }

  setupUrlSync() {
    // Parse URL parameters on load
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      if (this.filters.hasOwnProperty(key)) {
        this.filters[key] = value;
      }
    });
    
    // Listen for browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.filters) {
        this.setFilters(e.state.filters, false);
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + C = Clear all filters
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.clearFilters();
      }
      
      // Ctrl/Cmd + D = Toggle data source
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.toggleDataSource();
      }
    });
  }

  setFilter(key, value, updateUrl = true) {
    // Validate filter key
    if (!this.filters.hasOwnProperty(key)) {
      console.warn(`Invalid filter key: ${key}`);
      return;
    }
    
    // Check if value actually changed
    if (this.filters[key] === value) {
      return;
    }
    
    // Store previous value for history
    const previousValue = this.filters[key];
    
    // Update filter
    this.filters[key] = value;
    
    // Add to history
    this.filterHistory.push({
      timestamp: new Date(),
      action: 'set',
      key: key,
      previousValue: previousValue,
      newValue: value
    });
    
    // Save to localStorage
    this.saveFilters();
    
    // Update URL if requested
    if (updateUrl) {
      this.updateUrl();
    }
    
    // Notify subscribers
    this.notifySubscribers({
      action: 'set',
      key: key,
      value: value,
      filters: { ...this.filters }
    });
  }

  setFilters(filterObject, updateUrl = true) {
    const changes = {};
    
    // Batch update filters
    Object.keys(filterObject).forEach(key => {
      if (this.filters.hasOwnProperty(key) && this.filters[key] !== filterObject[key]) {
        changes[key] = {
          previous: this.filters[key],
          new: filterObject[key]
        };
        this.filters[key] = filterObject[key];
      }
    });
    
    // Only proceed if there were changes
    if (Object.keys(changes).length === 0) {
      return;
    }
    
    // Add to history
    this.filterHistory.push({
      timestamp: new Date(),
      action: 'batch',
      changes: changes
    });
    
    // Save to localStorage
    this.saveFilters();
    
    // Update URL if requested
    if (updateUrl) {
      this.updateUrl();
    }
    
    // Notify subscribers
    this.notifySubscribers({
      action: 'batch',
      changes: changes,
      filters: { ...this.filters }
    });
  }

  clearFilters(exceptKeys = []) {
    const changes = {};
    
    // Clear all filters except specified keys
    Object.keys(this.filters).forEach(key => {
      if (!exceptKeys.includes(key) && this.filters[key] !== null) {
        changes[key] = {
          previous: this.filters[key],
          new: null
        };
        this.filters[key] = null;
      }
    });
    
    // Keep data source
    if (!exceptKeys.includes('dataSource')) {
      this.filters.dataSource = 'SIM';
    }
    
    // Only proceed if there were changes
    if (Object.keys(changes).length === 0) {
      return;
    }
    
    // Add to history
    this.filterHistory.push({
      timestamp: new Date(),
      action: 'clear',
      changes: changes
    });
    
    // Save to localStorage
    this.saveFilters();
    
    // Update URL
    this.updateUrl();
    
    // Notify subscribers
    this.notifySubscribers({
      action: 'clear',
      changes: changes,
      filters: { ...this.filters }
    });
    
    // Show notification
    if (window.showNotification) {
      window.showNotification('info', 'All filters cleared');
    }
  }

  toggleDataSource() {
    const newSource = this.filters.dataSource === 'SIM' ? 'LIVE' : 'SIM';
    this.setFilter('dataSource', newSource);
    
    // Show notification
    if (window.showNotification) {
      window.showNotification('info', `Switched to ${newSource} data`);
    }
  }

  getActiveFilters() {
    const active = {};
    Object.keys(this.filters).forEach(key => {
      if (this.filters[key] !== null && this.filters[key] !== '') {
        active[key] = this.filters[key];
      }
    });
    return active;
  }

  getFilterCount() {
    return Object.keys(this.getActiveFilters()).length;
  }

  updateUrl() {
    const params = new URLSearchParams();
    const activeFilters = this.getActiveFilters();
    
    Object.keys(activeFilters).forEach(key => {
      params.append(key, activeFilters[key]);
    });
    
    const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
    
    // Update URL without reload
    window.history.pushState(
      { filters: this.filters },
      '',
      url
    );
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  notifySubscribers(change) {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('filters:changed', {
      detail: change
    }));
    
    // Call subscriber callbacks
    this.subscribers.forEach(callback => {
      try {
        callback(change);
      } catch (error) {
        console.error('Filter subscriber error:', error);
      }
    });
  }

  getFilterHistory(limit = 10) {
    return this.filterHistory.slice(-limit);
  }

  exportFilters() {
    return {
      filters: { ...this.filters },
      timestamp: new Date().toISOString(),
      activeCount: this.getFilterCount()
    };
  }

  importFilters(filterData) {
    if (filterData && filterData.filters) {
      this.setFilters(filterData.filters);
    }
  }
}

// Create and export singleton instance
const filterManager = new GlobalFilterManager();

// Export for use
window.GlobalFilterManager = GlobalFilterManager;
window.filterManager = filterManager;