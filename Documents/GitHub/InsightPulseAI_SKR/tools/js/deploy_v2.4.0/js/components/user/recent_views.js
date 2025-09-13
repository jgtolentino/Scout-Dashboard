/**
 * RecentViews - Tracks and manages recently viewed items in the Client360 Dashboard
 * Part of the User Personalization Framework for Client360 Dashboard v2.4.0
 */
class RecentViews {
  /**
   * Creates a new RecentViews instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      storageKey: 'client360_recent_views',
      maxItems: 50,                      // Maximum number of recent items to store
      groupByType: true,                 // Group recent items by type (store, brand, region)
      syncWithServer: false,             // Whether to sync with server
      serverEndpoint: '/api/recent-views',
      expirationDays: 30,                // Items older than this will be removed
      userPreferences: null,             // UserPreferences instance for integration
      itemTypes: ['store', 'brand', 'region', 'report', 'dashboard', 'insight'],
      ...config
    };
    
    // Core properties
    this.recentItems = new Map();  // Map of recent items by type
    this.eventHandlers = new Map();
    this.userPreferences = this.config.userPreferences;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the recent views system
   */
  init() {
    this._loadFromStorage();
    this._setupEventListeners();
    this._cleanupExpiredItems();
  }
  
  /**
   * Add an item to recent views
   * @param {Object} item - The item to add
   * @param {string} item.id - Unique identifier
   * @param {string} item.type - Item type (store, brand, region, etc.)
   * @param {string} item.name - Display name
   * @param {Object} item.metadata - Additional metadata
   * @returns {boolean} - Success status
   */
  addItem(item) {
    if (!item || !item.id || !item.type || !item.name) {
      console.error('Invalid item format for recent views:', item);
      return false;
    }
    
    // Validate item type
    if (!this.config.itemTypes.includes(item.type)) {
      console.warn(`Unknown item type: ${item.type}`);
      // Still continue as we want to be forward compatible
    }
    
    // Create the item with timestamp
    const recentItem = {
      ...item,
      timestamp: new Date().toISOString(),
      viewCount: 1
    };
    
    // Get the items list for this type
    if (!this.recentItems.has(item.type)) {
      this.recentItems.set(item.type, new Map());
    }
    
    const typeItems = this.recentItems.get(item.type);
    
    // Update existing item if it exists
    if (typeItems.has(item.id)) {
      const existingItem = typeItems.get(item.id);
      recentItem.viewCount = (existingItem.viewCount || 0) + 1;
      recentItem.firstViewed = existingItem.firstViewed || recentItem.timestamp;
    } else {
      recentItem.firstViewed = recentItem.timestamp;
    }
    
    // Add to the type map
    typeItems.set(item.id, recentItem);
    
    // Ensure we don't exceed the max items per type
    this._enforceMaxItems(item.type);
    
    // Save changes
    this._saveToStorage();
    
    // Trigger event
    this._triggerEvent('itemAdded', recentItem);
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
    
    return true;
  }
  
  /**
   * Remove an item from recent views
   * @param {string} itemId - ID of the item to remove
   * @param {string} itemType - Type of the item to remove
   * @returns {boolean} - Success status
   */
  removeItem(itemId, itemType) {
    if (!itemId || !itemType) {
      console.error('Both itemId and itemType are required to remove an item');
      return false;
    }
    
    if (!this.recentItems.has(itemType)) {
      console.warn(`No items of type ${itemType} found`);
      return false;
    }
    
    const typeItems = this.recentItems.get(itemType);
    
    if (!typeItems.has(itemId)) {
      console.warn(`Item ${itemId} of type ${itemType} not found in recent views`);
      return false;
    }
    
    // Get the item before deleting (for event)
    const item = typeItems.get(itemId);
    
    // Remove the item
    typeItems.delete(itemId);
    
    // Save changes
    this._saveToStorage();
    
    // Trigger event
    this._triggerEvent('itemRemoved', item);
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
    
    return true;
  }
  
  /**
   * Get recent items by type
   * @param {string} itemType - Type of items to retrieve
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} - Array of recent items
   */
  getRecentItems(itemType = null, limit = null) {
    if (itemType) {
      // Return items of a specific type
      if (!this.recentItems.has(itemType)) {
        return [];
      }
      
      const typeItems = Array.from(this.recentItems.get(itemType).values());
      
      // Sort by most recent first
      typeItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply limit if specified
      if (limit && limit > 0) {
        return typeItems.slice(0, limit);
      }
      
      return typeItems;
    } else {
      // Return all items across all types
      let allItems = [];
      
      for (const [type, items] of this.recentItems.entries()) {
        allItems = allItems.concat(Array.from(items.values()));
      }
      
      // Sort by most recent first
      allItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply limit if specified
      if (limit && limit > 0) {
        return allItems.slice(0, limit);
      }
      
      return allItems;
    }
  }
  
  /**
   * Clear all recent views or just for a specific type
   * @param {string} itemType - Optional type to clear
   */
  clearRecentViews(itemType = null) {
    if (itemType) {
      // Clear only items of a specific type
      if (this.recentItems.has(itemType)) {
        this.recentItems.delete(itemType);
        this._triggerEvent('typeCleared', { type: itemType });
      }
    } else {
      // Clear all items
      this.recentItems.clear();
      this._triggerEvent('allCleared');
    }
    
    // Save changes
    this._saveToStorage();
    
    // Sync with server if enabled
    if (this.config.syncWithServer) {
      this._syncWithServer();
    }
  }
  
  /**
   * Register event handler
   * @param {string} eventName - Event name to listen for
   * @param {Function} handler - Handler function
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    this.eventHandlers.get(eventName).push(handler);
  }
  
  /**
   * Unregister event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Handler function to remove
   */
  off(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * Load stored data from localStorage or UserPreferences
   * @private
   */
  _loadFromStorage() {
    try {
      let storedData;
      
      // Try to load from UserPreferences if available
      if (this.userPreferences) {
        storedData = this.userPreferences.getPreference('recentViews');
      } else {
        // Fall back to localStorage
        storedData = localStorage.getItem(this.config.storageKey);
        if (storedData) {
          storedData = JSON.parse(storedData);
        }
      }
      
      if (storedData) {
        // Convert stored data into Map structure
        this.recentItems.clear();
        
        Object.keys(storedData).forEach(type => {
          const typeMap = new Map();
          
          Object.keys(storedData[type]).forEach(id => {
            typeMap.set(id, storedData[type][id]);
          });
          
          this.recentItems.set(type, typeMap);
        });
        
        this._triggerEvent('loaded');
      }
    } catch (error) {
      console.error('Error loading recent views from storage:', error);
      // Initialize with empty data on error
      this.recentItems.clear();
    }
  }
  
  /**
   * Save data to localStorage or UserPreferences
   * @private
   */
  _saveToStorage() {
    try {
      // Convert Map structure to plain object for storage
      const storageData = {};
      
      for (const [type, items] of this.recentItems.entries()) {
        storageData[type] = {};
        
        for (const [id, item] of items.entries()) {
          storageData[type][id] = item;
        }
      }
      
      // Save to UserPreferences if available
      if (this.userPreferences) {
        this.userPreferences.setPreference('recentViews', storageData);
      } else {
        // Fall back to localStorage
        localStorage.setItem(this.config.storageKey, JSON.stringify(storageData));
      }
      
      this._triggerEvent('saved');
    } catch (error) {
      console.error('Error saving recent views to storage:', error);
    }
  }
  
  /**
   * Enforce maximum items limit for a type
   * @param {string} itemType - Type to check
   * @private
   */
  _enforceMaxItems(itemType) {
    if (!this.recentItems.has(itemType)) return;
    
    const typeItems = this.recentItems.get(itemType);
    
    // If within limit, no action needed
    if (typeItems.size <= this.config.maxItems) return;
    
    // Convert to array for sorting
    const itemsArray = Array.from(typeItems.entries());
    
    // Sort by timestamp (oldest first)
    itemsArray.sort(([, a], [, b]) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Remove oldest items beyond the limit
    const itemsToRemove = itemsArray.slice(0, itemsArray.length - this.config.maxItems);
    
    for (const [id] of itemsToRemove) {
      typeItems.delete(id);
    }
  }
  
  /**
   * Remove items older than expiration days
   * @private
   */
  _cleanupExpiredItems() {
    if (!this.config.expirationDays) return;
    
    const now = new Date();
    const expirationMs = this.config.expirationDays * 24 * 60 * 60 * 1000;
    let hasChanges = false;
    
    // Check each type
    for (const [type, items] of this.recentItems.entries()) {
      for (const [id, item] of items.entries()) {
        const itemDate = new Date(item.timestamp);
        
        // Check if item is older than expiration period
        if (now - itemDate > expirationMs) {
          items.delete(id);
          hasChanges = true;
        }
      }
      
      // Remove type if empty
      if (items.size === 0) {
        this.recentItems.delete(type);
      }
    }
    
    // Save if any items were removed
    if (hasChanges) {
      this._saveToStorage();
    }
  }
  
  /**
   * Set up event listeners for user actions
   * @private
   */
  _setupEventListeners() {
    // This method can be expanded to listen for specific dashboard events
    // that would automatically add items to recent views
    
    // Example listener setup if we had a custom event bus
    /* 
    if (window.eventBus) {
      window.eventBus.on('storeSelected', (storeData) => {
        this.addItem({
          id: storeData.id,
          type: 'store',
          name: storeData.name,
          metadata: {
            region: storeData.region,
            address: storeData.address
          }
        });
      });
    }
    */
  }
  
  /**
   * Trigger an event to all registered handlers
   * @param {string} eventName - Name of the event
   * @param {*} data - Event data
   * @private
   */
  _triggerEvent(eventName, data = null) {
    if (!this.eventHandlers.has(eventName)) return;
    
    for (const handler of this.eventHandlers.get(eventName)) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in recent views event handler for ${eventName}:`, error);
      }
    }
  }
  
  /**
   * Synchronize recent views with server
   * @private
   */
  async _syncWithServer() {
    if (!this.config.syncWithServer) return;
    
    try {
      // Convert Map structure to plain object for API
      const syncData = {};
      
      for (const [type, items] of this.recentItems.entries()) {
        syncData[type] = {};
        
        for (const [id, item] of items.entries()) {
          syncData[type][id] = item;
        }
      }
      
      // Send to server
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncData)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Get updated data from server
      const serverData = await response.json();
      
      // Update local data if server provided updates
      if (serverData && typeof serverData === 'object') {
        // This would merge server data with local data
        // Logic depends on specific API implementation
        
        this._triggerEvent('synced', serverData);
      }
    } catch (error) {
      console.error('Error syncing recent views with server:', error);
      this._triggerEvent('syncError', error);
    }
  }
}

// Export for ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecentViews;
} else if (typeof window !== 'undefined') {
  window.RecentViews = RecentViews;
}