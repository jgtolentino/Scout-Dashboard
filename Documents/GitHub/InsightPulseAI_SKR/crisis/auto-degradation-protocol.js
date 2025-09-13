/**
 * Auto-Degradation Protocol
 * RED2025 Emergency Protocol - Phase 2.5
 * 
 * Automatically detects poor network conditions and
 * dynamically adjusts the UI to ensure usability.
 */

// Network quality thresholds (percentage of optimal performance)
const NETWORK_QUALITY_THRESHOLDS = {
  CRITICAL: 10,  // Critical network quality (<10%)
  POOR: 30,      // Poor network quality (<30%)
  DEGRADED: 50,  // Degraded network quality (<50%)
  FAIR: 70,      // Fair network quality (<70%)
  GOOD: 90       // Good network quality (<90%)
};

// User roles with different degradation behaviors
const USER_ROLES = {
  DEVELOPER: 'developer',
  END_USER: 'end_user',
  ADMIN: 'admin',
  GUEST: 'guest'
};

// Available degradation modes
const DEGRADATION_MODES = {
  TEXT_ONLY: 'text_only',
  OFFLINE_MODE: 'offline_mode',
  LOW_BANDWIDTH: 'low_bandwidth',
  STATUS_DASHBOARD: 'status_dashboard',
  PROGRESSIVE_LOADING: 'progressive_loading'
};

/**
 * Network quality monitor for detecting poor conditions
 */
class NetworkQualityMonitor {
  constructor(options = {}) {
    this.options = {
      measurementInterval: 5000, // ms
      samplingWindow: 60000,     // 1 minute window for moving average
      minSamples: 3,             // minimum samples before making decisions
      ...options
    };
    
    this.measurements = [];
    this.currentQuality = 100; // start with optimal quality assumption
    this.monitoringInterval = null;
    this.listeners = [];
    
    console.log('Network Quality Monitor initialized');
  }
  
  // Start monitoring network quality
  start() {
    if (this.monitoringInterval) {
      return; // already started
    }
    
    console.log(`Starting network quality monitoring (interval: ${this.options.measurementInterval}ms)`);
    
    this.monitoringInterval = setInterval(() => {
      this.measureNetworkQuality();
    }, this.options.measurementInterval);
    
    // Take an immediate measurement
    this.measureNetworkQuality();
    
    return true;
  }
  
  // Stop monitoring
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Network quality monitoring stopped');
    }
  }
  
  // Measure current network quality
  async measureNetworkQuality() {
    try {
      // In a real implementation, this would use the Network Information API,
      // performance metrics, and active probing to determine network quality.
      // For this simulation, we'll generate synthetic data.
      
      const quality = this.simulateNetworkQuality();
      
      // Add to measurements
      this.measurements.push({
        timestamp: Date.now(),
        quality
      });
      
      // Trim old measurements outside the sampling window
      const windowStart = Date.now() - this.options.samplingWindow;
      this.measurements = this.measurements.filter(m => m.timestamp >= windowStart);
      
      // Calculate current quality (moving average)
      if (this.measurements.length >= this.options.minSamples) {
        const sum = this.measurements.reduce((acc, m) => acc + m.quality, 0);
        const newQuality = Math.round(sum / this.measurements.length);
        
        // If quality changed significantly, notify listeners
        if (Math.abs(this.currentQuality - newQuality) > 5) {
          const oldQuality = this.currentQuality;
          this.currentQuality = newQuality;
          this.notifyListeners(oldQuality, newQuality);
        } else {
          this.currentQuality = newQuality;
        }
      }
      
      return this.currentQuality;
    } catch (error) {
      console.error('Error measuring network quality:', error);
      return this.currentQuality; // return last known quality
    }
  }
  
  // Simulate network quality for this demo
  simulateNetworkQuality() {
    // In simulation mode, we'll create a mix of network conditions with occasional problems
    // Base quality varies between 60-100%
    let baseQuality = 60 + Math.floor(Math.random() * 40);
    
    // 10% chance of severe network issues
    if (Math.random() < 0.1) {
      baseQuality = Math.max(5, baseQuality - 50 - Math.floor(Math.random() * 30));
    }
    // 20% chance of moderate network issues
    else if (Math.random() < 0.2) {
      baseQuality = Math.max(20, baseQuality - 30 - Math.floor(Math.random() * 20));
    }
    
    return baseQuality;
  }
  
  // Add a listener for quality changes
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      return true;
    }
    return false;
  }
  
  // Remove a listener
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // Notify all listeners of quality changes
  notifyListeners(oldQuality, newQuality) {
    this.listeners.forEach(listener => {
      try {
        listener(oldQuality, newQuality);
      } catch (error) {
        console.error('Error in network quality listener:', error);
      }
    });
  }
  
  // Get current network quality
  getCurrentQuality() {
    return this.currentQuality;
  }
  
  // Get network quality category
  getQualityCategory() {
    const quality = this.currentQuality;
    
    if (quality <= NETWORK_QUALITY_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (quality <= NETWORK_QUALITY_THRESHOLDS.POOR) return 'POOR';
    if (quality <= NETWORK_QUALITY_THRESHOLDS.DEGRADED) return 'DEGRADED';
    if (quality <= NETWORK_QUALITY_THRESHOLDS.FAIR) return 'FAIR';
    if (quality <= NETWORK_QUALITY_THRESHOLDS.GOOD) return 'GOOD';
    return 'EXCELLENT';
  }
}

/**
 * Auto-Degradation Controller that adjusts the UI based on network quality
 */
class AutoDegradationController {
  constructor(options = {}) {
    this.options = {
      autoActivate: true,
      networkMonitor: new NetworkQualityMonitor(),
      logMetrics: true,
      ...options
    };
    
    this.activeMode = null;
    this.userRole = options.userRole || USER_ROLES.END_USER;
    this.previousConfigurations = [];
    this.metricsLog = [];
    
    // Initialize network monitor
    this.networkMonitor = this.options.networkMonitor;
    this.networkMonitor.addListener(this.handleNetworkQualityChange.bind(this));
    
    // If auto-activate is enabled, start monitoring
    if (this.options.autoActivate) {
      this.activate();
    }
    
    console.log('Auto-Degradation Controller initialized');
  }
  
  // Activate the controller
  activate() {
    console.log('Activating Auto-Degradation Controller');
    this.networkMonitor.start();
    return true;
  }
  
  // Deactivate the controller
  deactivate() {
    console.log('Deactivating Auto-Degradation Controller');
    this.networkMonitor.stop();
    
    // Restore the default configuration if a degraded mode is active
    if (this.activeMode) {
      this.restoreDefaultConfiguration();
    }
    
    return true;
  }
  
  // Handle network quality changes
  handleNetworkQualityChange(oldQuality, newQuality) {
    console.log(`Network quality changed: ${oldQuality}% -> ${newQuality}%`);
    
    // Determine if we need to change the degradation mode
    const qualityCategory = this.networkMonitor.getQualityCategory();
    console.log(`Network quality category: ${qualityCategory}`);
    
    // Log the quality change
    this.logQualityChange(oldQuality, newQuality, qualityCategory);
    
    // Check if we need to apply a degradation mode
    if (newQuality <= NETWORK_QUALITY_THRESHOLDS.POOR) {
      // Apply appropriate degradation mode
      const mode = this.selectDegradationMode(newQuality, qualityCategory);
      this.applyDegradationMode(mode);
    } 
    // Check if we should restore default configuration
    else if (newQuality > NETWORK_QUALITY_THRESHOLDS.POOR && this.activeMode) {
      this.restoreDefaultConfiguration();
    }
  }
  
  // Select appropriate degradation mode based on network quality and user role
  selectDegradationMode(quality, qualityCategory) {
    // Critical network quality
    if (quality <= NETWORK_QUALITY_THRESHOLDS.CRITICAL) {
      switch (this.userRole) {
        case USER_ROLES.DEVELOPER:
          return DEGRADATION_MODES.TEXT_ONLY;
        case USER_ROLES.ADMIN:
          return DEGRADATION_MODES.TEXT_ONLY;
        default:
          return DEGRADATION_MODES.OFFLINE_MODE;
      }
    }
    
    // Poor network quality
    if (quality <= NETWORK_QUALITY_THRESHOLDS.POOR) {
      switch (this.userRole) {
        case USER_ROLES.DEVELOPER:
          return DEGRADATION_MODES.LOW_BANDWIDTH;
        case USER_ROLES.ADMIN:
          return DEGRADATION_MODES.LOW_BANDWIDTH;
        default:
          return DEGRADATION_MODES.STATUS_DASHBOARD;
      }
    }
    
    // Default for higher quality
    return DEGRADATION_MODES.PROGRESSIVE_LOADING;
  }
  
  // Apply a degradation mode
  applyDegradationMode(mode) {
    // Don't reapply the same mode
    if (mode === this.activeMode) {
      return true;
    }
    
    console.log(`Applying degradation mode: ${mode}`);
    
    // Save current configuration before changing it
    if (!this.activeMode) {
      this.saveCurrentConfiguration();
    }
    
    // Apply the selected mode
    switch (mode) {
      case DEGRADATION_MODES.TEXT_ONLY:
        this.applyTextOnlyMode();
        break;
      case DEGRADATION_MODES.OFFLINE_MODE:
        this.applyOfflineMode();
        break;
      case DEGRADATION_MODES.LOW_BANDWIDTH:
        this.applyLowBandwidthMode();
        break;
      case DEGRADATION_MODES.STATUS_DASHBOARD:
        this.applyStatusDashboardMode();
        break;
      case DEGRADATION_MODES.PROGRESSIVE_LOADING:
        this.applyProgressiveLoadingMode();
        break;
      default:
        console.warn(`Unknown degradation mode: ${mode}`);
        return false;
    }
    
    // Update the active mode
    this.activeMode = mode;
    
    // Log the mode change
    this.logModeChange(mode);
    
    return true;
  }
  
  // Save the current configuration
  saveCurrentConfiguration() {
    // In a real implementation, this would save the current UI state
    console.log('Saving current configuration');
    
    this.previousConfigurations.push({
      timestamp: Date.now(),
      // Save relevant UI state properties here
      uiMode: window.currentUIMode || 'standard',
      features: window.activeFeatures || ['all'],
      dataOptions: window.dataOptions || { full: true }
    });
  }
  
  // Restore default configuration
  restoreDefaultConfiguration() {
    if (this.previousConfigurations.length === 0) {
      console.warn('No previous configuration to restore');
      return false;
    }
    
    console.log('Restoring default configuration');
    
    // Get the most recent configuration
    const config = this.previousConfigurations.pop();
    
    // In a real implementation, this would restore the saved UI state
    // window.currentUIMode = config.uiMode;
    // window.activeFeatures = config.features;
    // window.dataOptions = config.dataOptions;
    
    // Notify that we're restoring default configuration
    console.log('Network quality improved. Restoring normal UI mode.');
    
    // Reset the active mode
    this.activeMode = null;
    
    // Log the mode change
    this.logModeChange(null);
    
    return true;
  }
  
  // Apply text-only mode
  applyTextOnlyMode() {
    console.log('Applying text-only mode');
    
    // In a real implementation, this would modify the UI:
    // 1. Remove all images and non-essential media
    // 2. Disable all animations and transitions
    // 3. Simplify the UI to bare essentials
    // 4. Enable aggressive caching
    
    // Simulate UI changes:
    console.log('- Removed all images and non-essential media');
    console.log('- Disabled all animations and transitions');
    console.log('- Simplified UI to text-only version');
    console.log('- Enabled aggressive caching');
    
    // Also notify the user about the mode change
    this.showUserNotification(
      'Network quality is very poor. Switched to text-only mode to maintain functionality.',
      'warning'
    );
    
    return true;
  }
  
  // Apply offline mode
  applyOfflineMode() {
    console.log('Applying offline mode');
    
    // In a real implementation, this would:
    // 1. Switch to local-only operations
    // 2. Queue changes for sync when back online
    // 3. Show offline indicator
    // 4. Disable features that require online connectivity
    
    // Simulate UI changes:
    console.log('- Switched to local-only operations');
    console.log('- Enabled change queue for later sync');
    console.log('- Showing offline indicator');
    console.log('- Disabled online-only features');
    
    // Also notify the user about the mode change
    this.showUserNotification(
      'Network connection lost. Switched to offline mode. Changes will sync when connection is restored.',
      'warning'
    );
    
    return true;
  }
  
  // Apply low-bandwidth mode
  applyLowBandwidthMode() {
    console.log('Applying low-bandwidth mode');
    
    // In a real implementation, this would:
    // 1. Reduce data transfer by requesting compressed responses
    // 2. Disable auto-loading of content
    // 3. Enable lazy-loading for all content
    // 4. Reduce polling frequency
    
    // Simulate UI changes:
    console.log('- Enabled compressed data transfers');
    console.log('- Disabled auto-loading content');
    console.log('- Enabled lazy-loading for all content');
    console.log('- Reduced polling frequency');
    
    // Also notify the user about the mode change
    this.showUserNotification(
      'Network connection is slow. Optimized for low-bandwidth usage.',
      'info'
    );
    
    return true;
  }
  
  // Apply status dashboard mode
  applyStatusDashboardMode() {
    console.log('Applying status dashboard mode');
    
    // In a real implementation, this would:
    // 1. Show a simplified dashboard with key status information
    // 2. Disable complex interactive features
    // 3. Provide manual refresh option instead of auto-updates
    // 4. Prioritize critical information
    
    // Simulate UI changes:
    console.log('- Showing simplified status dashboard');
    console.log('- Disabled complex interactive features');
    console.log('- Added manual refresh option');
    console.log('- Prioritizing critical information');
    
    // Also notify the user about the mode change
    this.showUserNotification(
      'Network performance is limited. Showing simplified status view.',
      'info'
    );
    
    return true;
  }
  
  // Apply progressive loading mode
  applyProgressiveLoadingMode() {
    console.log('Applying progressive loading mode');
    
    // In a real implementation, this would:
    // 1. Load essential content first
    // 2. Load non-essential content progressively
    // 3. Show placeholders for unloaded content
    // 4. Prioritize user-interaction related content
    
    // Simulate UI changes:
    console.log('- Loading essential content first');
    console.log('- Loading non-essential content progressively');
    console.log('- Showing placeholders for unloaded content');
    console.log('- Prioritizing user-interaction content');
    
    // Also notify the user about the mode change
    this.showUserNotification(
      'Optimizing content loading for current network conditions.',
      'info'
    );
    
    return true;
  }
  
  // Show a notification to the user
  showUserNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // In a real implementation, this would show a UI notification
    // Document this notification in the logs
    this.logNotification(message, type);
  }
  
  // Log a notification
  logNotification(message, type) {
    if (this.options.logMetrics) {
      this.metricsLog.push({
        timestamp: Date.now(),
        type: 'notification',
        message,
        notificationType: type
      });
    }
  }
  
  // Log a quality change
  logQualityChange(oldQuality, newQuality, category) {
    if (this.options.logMetrics) {
      this.metricsLog.push({
        timestamp: Date.now(),
        type: 'quality_change',
        oldQuality,
        newQuality,
        category
      });
    }
  }
  
  // Log a mode change
  logModeChange(mode) {
    if (this.options.logMetrics) {
      this.metricsLog.push({
        timestamp: Date.now(),
        type: 'mode_change',
        mode
      });
    }
  }
  
  // Get metrics log
  getMetricsLog() {
    return this.metricsLog;
  }
  
  // Get current active mode
  getActiveMode() {
    return this.activeMode;
  }
  
  // Set user role
  setUserRole(role) {
    if (Object.values(USER_ROLES).includes(role)) {
      this.userRole = role;
      
      // If we have an active mode, recompute the appropriate mode for the new role
      if (this.activeMode) {
        const quality = this.networkMonitor.getCurrentQuality();
        const qualityCategory = this.networkMonitor.getQualityCategory();
        const mode = this.selectDegradationMode(quality, qualityCategory);
        
        // If the selected mode differs from the active mode, apply it
        if (mode !== this.activeMode) {
          this.applyDegradationMode(mode);
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  // Get user role
  getUserRole() {
    return this.userRole;
  }
}

// Export the classes and constants
module.exports = {
  NetworkQualityMonitor,
  AutoDegradationController,
  NETWORK_QUALITY_THRESHOLDS,
  USER_ROLES,
  DEGRADATION_MODES
};