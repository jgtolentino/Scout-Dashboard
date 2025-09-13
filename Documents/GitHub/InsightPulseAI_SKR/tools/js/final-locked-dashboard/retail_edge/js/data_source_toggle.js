/**
 * Data Source Toggle
 * 
 * This script provides functionality to toggle between real and simulated data sources
 * for the dashboard. It's useful for development, testing, and demonstration purposes.
 */

class DataSourceToggle {
  /**
   * Initialize the data source toggle
   * 
   * @param {Object} options Configuration options
   * @param {string} options.containerId The ID of the container element where the toggle will be rendered
   * @param {Function} options.onToggle Callback when toggle state changes
   * @param {boolean} options.defaultUseRealData Start with real data (true) or simulated data (false)
   * @param {Object} options.dataSourceConfig Configuration for different data sources
   */
  constructor(options = {}) {
    this.containerId = options.containerId || 'data-source-toggle-container';
    this.onToggle = options.onToggle || (() => {});
    this.useRealData = options.defaultUseRealData !== undefined ? options.defaultUseRealData : false;

    // Data source configuration
    this.dataSourceConfig = options.dataSourceConfig || {
      real: {
        bronzeLayer: '/api/events/realtime',
        silverLayer: '/api/silver/brand-mentions',
        goldLayer: '/api/gold/topic-analysis',
        platinumLayer: '/api/insights',
        unified: '/api/dashboard/summary'
      },
      simulated: {
        bronzeLayer: '/retail_edge/assets/data/simulated/bronze_events.json',
        silverLayer: '/retail_edge/assets/data/simulated/silver_brand_mentions.json',
        goldLayer: '/retail_edge/assets/data/simulated/gold_topic_analysis.json', 
        platinumLayer: '/retail_edge/assets/data/simulated/platinum_insights.json',
        unified: '/retail_edge/assets/data/simulated/dashboard_summary.json'
      }
    };

    // State persistence key
    this.storageKey = 'retail_edge_data_source_preference';
    
    // Load saved preference
    this.loadPreference();
    
    // Create the toggle UI
    this.render();
    
    // Report initial state
    this.reportState();
  }

  /**
   * Load user preference from localStorage
   */
  loadPreference() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        this.useRealData = saved === 'true';
      }
    } catch (error) {
      console.warn('Failed to load data source preference from localStorage');
    }
  }

  /**
   * Save user preference to localStorage
   */
  savePreference() {
    try {
      localStorage.setItem(this.storageKey, this.useRealData.toString());
    } catch (error) {
      console.warn('Failed to save data source preference to localStorage');
    }
  }

  /**
   * Get the current data endpoints based on toggle state
   * 
   * @returns {Object} The data endpoints configuration
   */
  getDataEndpoints() {
    return this.useRealData ? this.dataSourceConfig.real : this.dataSourceConfig.simulated;
  }

  /**
   * Toggle between real and simulated data
   */
  toggle() {
    this.useRealData = !this.useRealData;
    this.savePreference();
    this.updateUI();
    this.reportState();
    
    // Call the provided callback
    this.onToggle(this.useRealData, this.getDataEndpoints());
  }

  /**
   * Update the UI to reflect current state
   */
  updateUI() {
    const toggle = document.getElementById(`${this.containerId}-switch`);
    const label = document.getElementById(`${this.containerId}-label`);
    const statusBadge = document.getElementById(`${this.containerId}-status`);
    
    if (toggle) toggle.checked = this.useRealData;
    
    if (label) {
      label.textContent = this.useRealData ? 'Using Real Data' : 'Using Simulated Data';
    }
    
    if (statusBadge) {
      statusBadge.className = this.useRealData 
        ? 'badge badge-success' 
        : 'badge badge-warning';
      statusBadge.textContent = this.useRealData 
        ? 'LIVE' 
        : 'DEMO';
    }

    // Update status indicators throughout the dashboard
    this.updateDataSourceIndicators();
  }

  /**
   * Update data source indicators throughout the dashboard
   */
  updateDataSourceIndicators() {
    // Find all data source indicator elements
    const indicators = document.querySelectorAll('.data-source-indicator');
    
    indicators.forEach(indicator => {
      // Clear existing classes
      indicator.classList.remove('data-source-real', 'data-source-simulated');
      
      // Add appropriate class
      indicator.classList.add(this.useRealData ? 'data-source-real' : 'data-source-simulated');
      
      // Update text if it has this attribute
      if (indicator.hasAttribute('data-update-text')) {
        indicator.textContent = this.useRealData ? 'LIVE' : 'DEMO';
      }
    });
  }

  /**
   * Report the current state to the console for debugging
   */
  reportState() {
    console.log(`Data Source: ${this.useRealData ? 'REAL' : 'SIMULATED'}`);
    console.log('Endpoints:', this.getDataEndpoints());
  }

  /**
   * Render the toggle UI
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`Container #${this.containerId} not found for data source toggle`);
      return;
    }

    container.innerHTML = `
      <div class="data-source-toggle">
        <div class="toggle-wrapper">
          <div class="toggle-label-container">
            <span id="${this.containerId}-label" class="toggle-label">
              ${this.useRealData ? 'Using Real Data' : 'Using Simulated Data'}
            </span>
            <span id="${this.containerId}-status" class="badge ${this.useRealData ? 'badge-success' : 'badge-warning'}">
              ${this.useRealData ? 'LIVE' : 'DEMO'}
            </span>
          </div>
          <label class="switch">
            <input type="checkbox" id="${this.containerId}-switch" ${this.useRealData ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        <div class="toggle-info">
          <i class="fas fa-info-circle"></i>
          <span>Toggle between real and simulated data sources</span>
        </div>
      </div>
    `;

    // Add event listener to the toggle
    const toggleSwitch = document.getElementById(`${this.containerId}-switch`);
    if (toggleSwitch) {
      toggleSwitch.addEventListener('change', () => this.toggle());
    }
  }
}

// Export to global scope
window.DataSourceToggle = DataSourceToggle;