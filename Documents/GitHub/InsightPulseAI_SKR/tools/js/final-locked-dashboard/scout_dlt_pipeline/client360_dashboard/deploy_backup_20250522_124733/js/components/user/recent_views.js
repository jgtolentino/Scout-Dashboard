/**
 * @file recent_views.js
 * @description Tracks and manages recently viewed items in the Client360 Dashboard
 * @version v2.4.0
 */

/**
 * Class for managing recently viewed items in the dashboard
 */
class RecentViews {
  /**
   * Create a new RecentViews instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      userPreferences: null, // Optional UserPreferences instance for sync
      storageKey: 'client360_recent_views',
      maxItemsPerType: 10, // Maximum number of items to store per type
      maxTotalItems: 50, // Maximum total items across all types
      localStorage: true, // Whether to use localStorage as fallback
      ...config
    };

    // Map to store recent items by type
    this.recentItems = new Map();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Load saved items
    this._loadFromStorage();
    
    // Bind methods
    this.addItem = this.addItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.getRecentItems = this.getRecentItems.bind(this);
    this.clearAllItems = this.clearAllItems.bind(this);
    this.clearItemsByType = this.clearItemsByType.bind(this);
  }

  /**
   * Add an item to recent views
   * @param {Object} item - Item to add with at least id, type, and name properties
   * @returns {Promise<Object>} - The added item with metadata
   */
  async addItem(item) {
    if (!item || !item.id || !item.type) {
      throw new Error('Item must have at least id and type properties');
    }

    // Get existing items for this type
    if (!this.recentItems.has(item.type)) {
      this.recentItems.set(item.type, []);
    }
    
    const typeItems = this.recentItems.get(item.type);
    
    // Check if item already exists
    const existingIndex = typeItems.findIndex(i => i.id === item.id);
    
    // Create the full item object with metadata
    const recentItem = {
      ...item,
      timestamp: new Date().toISOString(),
      viewCount: 1
    };
    
    // If exists, update it and move to top
    if (existingIndex !== -1) {
      recentItem.viewCount = typeItems[existingIndex].viewCount + 1;
      typeItems.splice(existingIndex, 1);
    }
    
    // Add to beginning of the array
    typeItems.unshift(recentItem);
    
    // Enforce maximum items per type
    this._enforceMaxItems(item.type);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemAdded', recentItem);
    
    return recentItem;
  }

  /**
   * Remove an item from recent views
   * @param {string} itemId - ID of the item to remove
   * @param {string} itemType - Type of the item to remove
   * @returns {Promise<boolean>} - True if item was removed, false if not found
   */
  async removeItem(itemId, itemType) {
    // Get items for this type
    if (!this.recentItems.has(itemType)) {
      return false;
    }
    
    const typeItems = this.recentItems.get(itemType);
    
    // Find and remove the item
    const existingIndex = typeItems.findIndex(i => i.id === itemId);
    if (existingIndex === -1) {
      return false;
    }
    
    // Store the item for the event
    const removedItem = typeItems[existingIndex];
    
    // Remove the item
    typeItems.splice(existingIndex, 1);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemRemoved', removedItem);
    
    return true;
  }

  /**
   * Get recent items, optionally filtered by type
   * @param {string|null} itemType - Type of items to get, or null for all
   * @param {number|null} limit - Maximum number of items to return, or null for all
   * @returns {Array<Object>} - Array of recent items
   */
  getRecentItems(itemType = null, limit = null) {
    let items = [];
    
    if (itemType) {
      // Get items for specific type
      items = this.recentItems.has(itemType) 
        ? [...this.recentItems.get(itemType)]
        : [];
    } else {
      // Get all items across all types
      for (const typeItems of this.recentItems.values()) {
        items = items.concat(typeItems);
      }
      
      // Sort by timestamp (most recent first)
      items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Apply limit if specified
    if (limit !== null && limit > 0) {
      items = items.slice(0, limit);
    }
    
    return items;
  }

  /**
   * Get the count of recent items by type
   * @param {string|null} itemType - Type of items to count, or null for all
   * @returns {number} - Count of items
   */
  getItemCount(itemType = null) {
    if (itemType) {
      return this.recentItems.has(itemType) 
        ? this.recentItems.get(itemType).length
        : 0;
    } else {
      // Count all items
      let count = 0;
      for (const items of this.recentItems.values()) {
        count += items.length;
      }
      return count;
    }
  }

  /**
   * Clear all recent items
   * @returns {Promise<void>}
   */
  async clearAllItems() {
    this.recentItems.clear();
    await this._saveToStorage();
    this._emitEvent('allItemsCleared');
  }

  /**
   * Clear recent items of a specific type
   * @param {string} itemType - Type of items to clear
   * @returns {Promise<boolean>} - True if items were cleared, false if type not found
   */
  async clearItemsByType(itemType) {
    if (!this.recentItems.has(itemType)) {
      return false;
    }
    
    // Store count for the event
    const count = this.recentItems.get(itemType).length;
    
    // Clear items
    this.recentItems.delete(itemType);
    
    // Save to storage
    await this._saveToStorage();
    
    // Emit event
    this._emitEvent('itemsCleared', { type: itemType, count });
    
    return true;
  }

  /**
   * Get all available item types
   * @returns {Array<string>} - Array of item type strings
   */
  getItemTypes() {
    return Array.from(this.recentItems.keys());
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Function to remove the listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    
    // Return a function to remove the listener
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} - True if listener was removed, false if not found
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      return false;
    }
    
    return this.eventListeners.get(event).delete(callback);
  }

  /**
   * Load items from storage
   * @private
   */
  _loadFromStorage() {
    try {
      let savedItems = null;
      
      // Try to load from UserPreferences if available
      if (this.config.userPreferences) {
        savedItems = this.config.userPreferences.getPreference('recentViews');
      }
      
      // Fall back to localStorage if enabled and items not found in UserPreferences
      if (!savedItems && this.config.localStorage) {
        const storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          savedItems = JSON.parse(storedData);
        }
      }
      
      // Initialize recentItems from loaded data
      if (savedItems) {
        this.recentItems.clear();
        
        // Process saved data
        if (Array.isArray(savedItems)) {
          // Old format: flat array of items
          for (const item of savedItems) {
            if (item && item.type) {
              if (!this.recentItems.has(item.type)) {
                this.recentItems.set(item.type, []);
              }
              this.recentItems.get(item.type).push(item);
            }
          }
        } else if (typeof savedItems === 'object') {
          // New format: object with types as keys
          for (const [type, items] of Object.entries(savedItems)) {
            if (Array.isArray(items)) {
              this.recentItems.set(type, items);
            }
          }
        }
        
        // Ensure each type's items are sorted by timestamp
        for (const [type, items] of this.recentItems.entries()) {
          this.recentItems.set(
            type,
            items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          );
        }
      }
    } catch (error) {
      console.error('Error loading recent items from storage:', error);
      // Initialize with empty data on error
      this.recentItems.clear();
    }
  }

  /**
   * Save items to storage
   * @private
   * @returns {Promise<void>}
   */
  async _saveToStorage() {
    try {
      // Convert Map to object for storage
      const dataToSave = {};
      for (const [type, items] of this.recentItems.entries()) {
        dataToSave[type] = items;
      }
      
      // Save to UserPreferences if available
      if (this.config.userPreferences) {
        await this.config.userPreferences.setPreference('recentViews', dataToSave);
      }
      
      // Also save to localStorage if enabled
      if (this.config.localStorage) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving recent items to storage:', error);
      // Emit error event
      this._emitEvent('error', { message: 'Failed to save recent items', error });
    }
  }

  /**
   * Enforce maximum items per type
   * @param {string} itemType - Type of items to enforce limit on
   * @private
   */
  _enforceMaxItems(itemType) {
    const typeItems = this.recentItems.get(itemType);
    
    // Enforce max items per type
    if (typeItems.length > this.config.maxItemsPerType) {
      typeItems.splice(this.config.maxItemsPerType);
    }
    
    // Check total items across all types
    let totalItems = 0;
    for (const items of this.recentItems.values()) {
      totalItems += items.length;
    }
    
    // If over total limit, remove oldest items
    if (totalItems > this.config.maxTotalItems) {
      // Flatten all items into a single array with type info
      const allItems = [];
      for (const [type, items] of this.recentItems.entries()) {
        for (const item of items) {
          allItems.push({ ...item, _type: type });
        }
      }
      
      // Sort by timestamp (oldest first)
      allItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Remove oldest items until under limit
      const excess = totalItems - this.config.maxTotalItems;
      const itemsToRemove = allItems.slice(0, excess);
      
      // Remove each item from its type array
      for (const item of itemsToRemove) {
        const typeItems = this.recentItems.get(item._type);
        const index = typeItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          typeItems.splice(index, 1);
        }
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _emitEvent(event, data = null) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    for (const callback of this.eventListeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    }
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecentViews;
} else {
  window.RecentViews = RecentViews;
}
