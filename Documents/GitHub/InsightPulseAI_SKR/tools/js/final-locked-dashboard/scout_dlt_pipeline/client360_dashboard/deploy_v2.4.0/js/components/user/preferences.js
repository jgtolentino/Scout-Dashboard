/**
 * User Preferences Component for Client360 Dashboard v2.4.0
 * Manages user preferences and personalization settings
 * Part of the User Personalization Framework
 */

class UserPreferences {
  constructor(config = {}) {
    this.config = {
      storageKey: 'client360_user_preferences',
      syncWithServer: false,
      serverEndpoint: '/api/preferences',
      defaultPreferences: {
        theme: 'light',
        language: 'en',
        metrics: {
          prioritizedKPIs: ['sales', 'growth', 'market_share'],
          hiddenKPIs: []
        },
        layout: {
          compactMode: false,
          sidebarExpanded: true,
          cardDensity: 'standard'
        },
        visualization: {
          chartStyle: 'modern',
          colorScheme: 'default',
          showAnimations: true
        },
        notifications: {
          enabled: true,
          alertThreshold: 'medium',
          emailDigest: false
        },
        maps: {
          defaultView: 'regions',
          showStores: true,
          showHeatmap: true
        },
        aiInsights: {
          enabled: true,
          insightDensity: 'balanced',
          preferredCategories: ['trends', 'anomalies', 'opportunities']
        }
      },
      ...config
    };
    
    this.preferences = {};
    this.callbacks = new Map();
    this.syncInterval = null;
    this.isLoaded = false;
    
    // Initialize preferences
    this.init();
  }
  
  /**
   * Initialize preferences system
   */
  async init() {
    console.log('⚙️ Initializing User Preferences System');
    
    // Load preferences from storage
    await this.loadPreferences();
    
    // Set up sync if enabled
    if (this.config.syncWithServer) {
      // Initial sync
      await this.syncWithServer();
      
      // Set up periodic sync
      this.syncInterval = setInterval(() => {
        this.syncWithServer();
      }, 5 * 60 * 1000); // Sync every 5 minutes
    }
    
    // Set up storage event listener for cross-tab sync
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    console.log('✅ User Preferences System initialized');
  }
  
  /**
   * Load preferences from storage
   */
  async loadPreferences() {
    try {
      // Get from localStorage
      const stored = localStorage.getItem(this.config.storageKey);
      
      if (stored) {
        // Parse stored preferences
        const parsed = JSON.parse(stored);
        
        // Merge with defaults for any missing properties
        this.preferences = this.mergeWithDefaults(parsed);
      } else {
        // Use defaults
        this.preferences = { ...this.config.defaultPreferences };
      }
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fall back to defaults
      this.preferences = { ...this.config.defaultPreferences };
    }
    
    // Notify listeners
    this.notifyListeners('all', this.preferences);
  }
  
  /**
   * Save preferences to storage
   */
  async savePreferences() {
    try {
      // Save to localStorage
      localStorage.setItem(
        this.config.storageKey,
        JSON.stringify(this.preferences)
      );
      
      // Sync with server if enabled
      if (this.config.syncWithServer) {
        await this.syncWithServer();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }
  
  /**
   * Sync preferences with server
   */
  async syncWithServer() {
    if (!this.config.syncWithServer) return;
    
    try {
      // Get user token for authentication
      const userToken = this.getUserToken();
      
      if (!userToken) {
        console.warn('User not authenticated, skipping preference sync');
        return;
      }
      
      // Send preferences to server
      const response = await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          preferences: this.preferences,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Get server response
      const data = await response.json();
      
      // Update with any server-side changes
      if (data.preferences) {
        this.preferences = this.mergeWithDefaults(data.preferences);
        
        // Save to local storage
        localStorage.setItem(
          this.config.storageKey,
          JSON.stringify(this.preferences)
        );
        
        // Notify listeners
        this.notifyListeners('all', this.preferences);
      }
      
      console.log('Preferences synced with server');
    } catch (error) {
      console.error('Failed to sync preferences with server:', error);
    }
  }
  
  /**
   * Get current preferences
   * @returns {Object} Current preferences
   */
  getPreferences() {
    return { ...this.preferences };
  }
  
  /**
   * Get a specific preference value
   * @param {string} path - Dot notation path to preference
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Preference value
   */
  getPreference(path, defaultValue = null) {
    // Navigate preference path
    const keys = path.split('.');
    let current = this.preferences;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  /**
   * Set preference value
   * @param {string} path - Dot notation path to preference
   * @param {*} value - New value
   * @returns {boolean} Success status
   */
  setPreference(path, value) {
    // Navigate preference path
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = this.preferences;
    
    // Navigate to the object containing the final key
    for (const key of keys) {
      // Create object path if it doesn't exist
      if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the value
    current[lastKey] = value;
    
    // Save changes
    this.savePreferences();
    
    // Notify listeners
    this.notifyListeners(path, value);
    
    return true;
  }
  
  /**
   * Reset preferences to defaults
   * @param {string} [section] - Optional section to reset (dot notation path)
   * @returns {boolean} Success status
   */
  resetPreferences(section = null) {
    if (section) {
      // Reset specific section
      const keys = section.split('.');
      const defaultValue = this.getDefaultPreference(section);
      
      if (defaultValue !== undefined) {
        this.setPreference(section, defaultValue);
      }
    } else {
      // Reset all preferences
      this.preferences = { ...this.config.defaultPreferences };
      this.savePreferences();
      
      // Notify listeners
      this.notifyListeners('all', this.preferences);
    }
    
    return true;
  }
  
  /**
   * Get default preference value
   * @param {string} path - Dot notation path to preference
   * @returns {*} Default value
   */
  getDefaultPreference(path) {
    // Navigate default preference path
    const keys = path.split('.');
    let current = this.config.defaultPreferences;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Subscribe to preference changes
   * @param {string} path - Dot notation path to preference ('all' for all changes)
   * @param {Function} callback - Callback function(value, path)
   * @returns {string} Subscription ID for unsubscribing
   */
  subscribe(path, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    // Generate subscription ID
    const subscriptionId = Math.random().toString(36).substring(2, 15);
    
    // Get or create callback array for this path
    if (!this.callbacks.has(path)) {
      this.callbacks.set(path, []);
    }
    
    // Add to callbacks
    this.callbacks.get(path).push({
      id: subscriptionId,
      callback
    });
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from preference changes
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Success status
   */
  unsubscribe(subscriptionId) {
    // Search all paths for subscription
    for (const [path, callbacks] of this.callbacks.entries()) {
      const index = callbacks.findIndex(cb => cb.id === subscriptionId);
      
      if (index !== -1) {
        // Remove subscription
        callbacks.splice(index, 1);
        
        // Clean up empty arrays
        if (callbacks.length === 0) {
          this.callbacks.delete(path);
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Notify listeners of preference changes
   * @param {string} path - Changed preference path
   * @param {*} value - New value
   */
  notifyListeners(path, value) {
    // Notify path-specific listeners
    if (this.callbacks.has(path)) {
      this.callbacks.get(path).forEach(({ callback }) => {
        try {
          callback(value, path);
        } catch (error) {
          console.error('Error in preference change callback:', error);
        }
      });
    }
    
    // Notify 'all' listeners
    if (path !== 'all' && this.callbacks.has('all')) {
      this.callbacks.get('all').forEach(({ callback }) => {
        try {
          callback(this.preferences, 'all');
        } catch (error) {
          console.error('Error in preference change callback:', error);
        }
      });
    }
    
    // Notify parent path listeners
    const pathParts = path.split('.');
    
    while (pathParts.length > 1) {
      pathParts.pop();
      const parentPath = pathParts.join('.');
      
      if (this.callbacks.has(parentPath)) {
        const parentValue = this.getPreference(parentPath);
        
        this.callbacks.get(parentPath).forEach(({ callback }) => {
          try {
            callback(parentValue, parentPath);
          } catch (error) {
            console.error('Error in preference change callback:', error);
          }
        });
      }
    }
  }
  
  /**
   * Handle storage event for cross-tab sync
   * @param {StorageEvent} event - Storage event
   */
  handleStorageChange(event) {
    if (event.key === this.config.storageKey) {
      try {
        // Parse new preferences
        const newPreferences = JSON.parse(event.newValue);
        
        // Update preferences
        this.preferences = this.mergeWithDefaults(newPreferences);
        
        // Notify listeners
        this.notifyListeners('all', this.preferences);
      } catch (error) {
        console.error('Error handling storage change:', error);
      }
    }
  }
  
  /**
   * Merge preferences with defaults
   * @param {Object} preferences - Preferences to merge
   * @returns {Object} Merged preferences
   */
  mergeWithDefaults(preferences) {
    return this.deepMerge(this.config.defaultPreferences, preferences);
  }
  
  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
    
    function isObject(item) {
      return (item && typeof item === 'object' && !Array.isArray(item));
    }
  }
  
  /**
   * Get user authentication token
   * @returns {string|null} User token
   */
  getUserToken() {
    // This should be implemented according to your authentication system
    return localStorage.getItem('user_token') || null;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Remove storage event listener
    window.removeEventListener('storage', this.handleStorageChange);
    
    // Clear callbacks
    this.callbacks.clear();
  }
}

// Export to window
window.UserPreferences = UserPreferences;