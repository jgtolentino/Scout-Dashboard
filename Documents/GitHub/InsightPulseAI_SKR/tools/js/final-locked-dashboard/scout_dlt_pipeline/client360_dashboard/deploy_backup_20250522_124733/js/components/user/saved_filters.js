/**
 * Saved Filters Component for Client360 Dashboard v2.4.0
 * Manages user filter presets for dashboard personalization
 * Part of the User Personalization Framework
 */

class SavedFilters {
  constructor(config = {}) {
    this.config = {
      storageKey: 'client360_saved_filters',
      maxFilters: 20,
      syncWithServer: false,
      serverEndpoint: '/api/filters',
      userPreferences: null, // UserPreferences instance
      ...config
    };
    
    this.filters = new Map();
    this.eventHandlers = new Map();
    
    // If userPreferences is provided, use it for storage
    this.userPreferences = this.config.userPreferences;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize saved filters
   */
  async init() {
    console.log('📊 Initializing Saved Filters System');
    
    // Load filters from storage
    await this.loadFilters();
    
    console.log(`✅ Saved Filters initialized with ${this.filters.size} filters`);
  }
  
  /**
   * Load filters from storage
   */
  async loadFilters() {
    try {
      let filtersData;
      
      // Try to load from UserPreferences if available
      if (this.userPreferences) {
        filtersData = this.userPreferences.getPreference('filters.savedFilters');
      }
      
      // Fall back to localStorage if needed
      if (!filtersData) {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          filtersData = JSON.parse(stored);
        }
      }
      
      // Initialize filters Map
      this.filters.clear();
      if (filtersData) {
        // Convert array to Map
        if (Array.isArray(filtersData)) {
          filtersData.forEach(filter => {
            if (filter.id) {
              this.filters.set(filter.id, filter);
            }
          });
        }
        // Convert object to Map
        else if (typeof filtersData === 'object') {
          Object.entries(filtersData).forEach(([id, filter]) => {
            this.filters.set(id, { id, ...filter });
          });
        }
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
      // Start with empty filters
      this.filters.clear();
    }
  }
  
  /**
   * Save filters to storage
   */
  async saveFilters() {
    try {
      // Convert filters Map to array
      const filtersArray = Array.from(this.filters.values());
      
      // Save to UserPreferences if available
      if (this.userPreferences) {
        this.userPreferences.setPreference('filters.savedFilters', filtersArray);
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem(
        this.config.storageKey,
        JSON.stringify(filtersArray)
      );
      
      // Sync with server if enabled
      if (this.config.syncWithServer) {
        await this.syncWithServer();
      }
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }
  
  /**
   * Sync filters with server
   */
  async syncWithServer() {
    if (!this.config.syncWithServer) return;
    
    try {
      // Get user token for authentication
      const userToken = this.getUserToken();
      
      if (!userToken) {
        console.warn('User not authenticated, skipping filter sync');
        return;
      }
      
      // Convert filters Map to array
      const filtersArray = Array.from(this.filters.values());
      
      // Send filters to server
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          filters: filtersArray,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Get server response
      const data = await response.json();
      
      // Update with any server-side changes
      if (data.filters) {
        // Clear current filters
        this.filters.clear();
        
        // Add filters from server
        data.filters.forEach(filter => {
          if (filter.id) {
            this.filters.set(filter.id, filter);
          }
        });
        
        // Save to localStorage
        localStorage.setItem(
          this.config.storageKey,
          JSON.stringify(data.filters)
        );
      }
      
      console.log('Filters synced with server');
    } catch (error) {
      console.error('Failed to sync filters with server:', error);
    }
  }
  
  /**
   * Get all saved filters
   * @returns {Array} Array of filter objects
   */
  getAllFilters() {
    return Array.from(this.filters.values());
  }
  
  /**
   * Get filter by ID
   * @param {string} filterId - Filter ID
   * @returns {Object|null} Filter object or null if not found
   */
  getFilter(filterId) {
    return this.filters.get(filterId) || null;
  }
  
  /**
   * Save a new filter
   * @param {Object} filter - Filter configuration
   * @returns {string} Filter ID
   */
  async saveFilter(filter) {
    // Check if max filters limit reached
    if (this.filters.size >= this.config.maxFilters) {
      throw new Error(`Maximum number of filters (${this.config.maxFilters}) reached`);
    }
    
    // Validate filter
    if (!filter.name) {
      throw new Error('Filter name is required');
    }
    
    if (!filter.config || typeof filter.config !== 'object') {
      throw new Error('Filter configuration is required');
    }
    
    // Generate ID if not provided
    const filterId = filter.id || `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create filter object
    const filterObj = {
      id: filterId,
      name: filter.name,
      description: filter.description || '',
      config: filter.config,
      created: filter.created || new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    // Add to filters Map
    this.filters.set(filterId, filterObj);
    
    // Save to storage
    await this.saveFilters();
    
    // Trigger event
    this.triggerEvent('filterAdded', filterObj);
    
    return filterId;
  }
  
  /**
   * Update an existing filter
   * @param {string} filterId - Filter ID
   * @param {Object} updates - Properties to update
   * @returns {boolean} Success status
   */
  async updateFilter(filterId, updates) {
    // Check if filter exists
    if (!this.filters.has(filterId)) {
      throw new Error(`Filter not found: ${filterId}`);
    }
    
    // Get current filter
    const filter = this.filters.get(filterId);
    
    // Update filter
    const updatedFilter = {
      ...filter,
      ...updates,
      id: filterId, // Ensure ID doesn't change
      modified: new Date().toISOString()
    };
    
    // Update in filters Map
    this.filters.set(filterId, updatedFilter);
    
    // Save to storage
    await this.saveFilters();
    
    // Trigger event
    this.triggerEvent('filterUpdated', updatedFilter);
    
    return true;
  }
  
  /**
   * Delete a filter
   * @param {string} filterId - Filter ID
   * @returns {boolean} Success status
   */
  async deleteFilter(filterId) {
    // Check if filter exists
    if (!this.filters.has(filterId)) {
      throw new Error(`Filter not found: ${filterId}`);
    }
    
    // Get filter before deletion for event
    const filter = this.filters.get(filterId);
    
    // Remove from filters Map
    this.filters.delete(filterId);
    
    // Save to storage
    await this.saveFilters();
    
    // Trigger event
    this.triggerEvent('filterDeleted', { id: filterId, filter });
    
    return true;
  }
  
  /**
   * Find filters by criteria
   * @param {Function} predicate - Filter function (filter) => boolean
   * @returns {Array} Matching filters
   */
  findFilters(predicate) {
    if (typeof predicate !== 'function') {
      throw new Error('Predicate must be a function');
    }
    
    return Array.from(this.filters.values()).filter(predicate);
  }
  
  /**
   * Apply a filter
   * @param {string} filterId - Filter ID
   * @returns {Object|null} Filter configuration or null if not found
   */
  applyFilter(filterId) {
    // Get filter
    const filter = this.getFilter(filterId);
    if (!filter) return null;
    
    // Trigger event
    this.triggerEvent('filterApplied', filter);
    
    // Return filter config
    return filter.config;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {string} Handler ID
   */
  on(event, handler) {
    const validEvents = ['filterAdded', 'filterUpdated', 'filterDeleted', 'filterApplied'];
    
    if (!validEvents.includes(event)) {
      throw new Error(`Invalid event: ${event}`);
    }
    
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    // Initialize event handlers array if needed
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Map());
    }
    
    // Generate handler ID
    const handlerId = `${event}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Add handler
    this.eventHandlers.get(event).set(handlerId, handler);
    
    return handlerId;
  }
  
  /**
   * Remove event listener
   * @param {string} handlerId - Handler ID
   * @returns {boolean} Success status
   */
  off(handlerId) {
    for (const [event, handlers] of this.eventHandlers.entries()) {
      if (handlers.has(handlerId)) {
        handlers.delete(handlerId);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerEvent(event, data) {
    if (!this.eventHandlers.has(event)) return;
    
    const handlers = this.eventHandlers.get(event);
    for (const handler of handlers.values()) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    }
  }
  
  /**
   * Get user token for authentication
   * @returns {string|null} User token or null if not authenticated
   */
  getUserToken() {
    return localStorage.getItem('user_token');
  }
  
  /**
   * Import filters
   * @param {Array} filters - Filters to import
   * @returns {number} Number of imported filters
   */
  async importFilters(filters) {
    if (!Array.isArray(filters)) {
      throw new Error('Filters must be an array');
    }
    
    let importCount = 0;
    
    for (const filter of filters) {
      try {
        // Skip if max limit reached
        if (this.filters.size >= this.config.maxFilters) {
          break;
        }
        
        // Validate filter
        if (!filter.name || !filter.config) {
          continue;
        }
        
        // Generate new ID to avoid conflicts
        const importedFilter = {
          ...filter,
          id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          imported: true,
          importDate: new Date().toISOString()
        };
        
        // Add to filters Map
        this.filters.set(importedFilter.id, importedFilter);
        
        importCount++;
      } catch (error) {
        console.error('Error importing filter:', error);
      }
    }
    
    // Save to storage if any filters were imported
    if (importCount > 0) {
      await this.saveFilters();
      
      // Trigger event
      this.triggerEvent('filtersImported', { count: importCount });
    }
    
    return importCount;
  }
  
  /**
   * Export filters
   * @param {Array} filterIds - IDs of filters to export (optional)
   * @returns {Array} Exported filters
   */
  exportFilters(filterIds = null) {
    // Export all filters if no IDs specified
    if (!filterIds) {
      return Array.from(this.filters.values());
    }
    
    // Export specific filters
    return filterIds.map(id => this.filters.get(id)).filter(Boolean);
  }
  
  /**
   * Create a preset filter
   * @param {string} presetType - Type of preset filter
   * @returns {string} Filter ID
   */
  async createPresetFilter(presetType) {
    let presetFilter;
    
    switch (presetType) {
      case 'last30days':
        presetFilter = {
          name: 'Last 30 Days',
          description: 'Data from the last 30 days',
          config: {
            dateRange: {
              type: 'relative',
              value: 30,
              unit: 'days'
            }
          }
        };
        break;
        
      case 'thisMonth':
        presetFilter = {
          name: 'This Month',
          description: 'Data from the current month',
          config: {
            dateRange: {
              type: 'month',
              value: 'current'
            }
          }
        };
        break;
        
      case 'topRegions':
        presetFilter = {
          name: 'Top 5 Regions',
          description: 'Only show top 5 performing regions',
          config: {
            regions: {
              type: 'top',
              value: 5,
              metric: 'sales'
            }
          }
        };
        break;
        
      case 'growthFocus':
        presetFilter = {
          name: 'Growth Focus',
          description: 'Highlight high growth areas',
          config: {
            metrics: {
              primarySort: 'growth',
              secondarySort: 'sales',
              minGrowth: 5
            }
          }
        };
        break;
        
      default:
        throw new Error(`Unknown preset type: ${presetType}`);
    }
    
    // Save preset filter
    return await this.saveFilter(presetFilter);
  }
}

// Export to window
window.SavedFilters = SavedFilters;