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
        unified: '/api/dashboard/summary',
        // Geospatial data endpoints
        geoStores: '/api/silver/geo-stores',
        geoSales: '/api/gold/geo-sales',
        geoBrandMentions: '/api/gold/geo-brand-mentions',
        geoCombos: '/api/gold/geo-combos'
      },
      simulated: {
        bronzeLayer: '/assets/data/simulated/events.json',
        silverLayer: '/assets/data/simulated/brand_mentions.json',
        goldLayer: '/assets/data/simulated/topic_analysis.json', 
        platinumLayer: '/assets/data/insights_data.json',
        unified: '/assets/data/simulated/dashboard_summary.json',
        // Simulated geospatial data
        geoStores: '/assets/data/simulated/geo_stores.json',
        geoSales: '/assets/data/simulated/geo_sales.json',
        geoBrandMentions: '/assets/data/simulated/geo_brand_mentions.json',
        geoCombos: '/assets/data/simulated/geo_combos.json'
      }
    };

    // State persistence key
    this.storageKey = 'insightpulse_data_source_preference';
    
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

    // Add styles if not already present
    this.addStyles();

    // Add event listener to the toggle
    const toggleSwitch = document.getElementById(`${this.containerId}-switch`);
    if (toggleSwitch) {
      toggleSwitch.addEventListener('change', () => this.toggle());
    }
  }

  /**
   * Add required styles for the toggle
   */
  addStyles() {
    if (document.getElementById('data-source-toggle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'data-source-toggle-styles';
    style.textContent = `
      .data-source-toggle {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 16px;
      }
      
      .toggle-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .toggle-label-container {
        display: flex;
        align-items: center;
      }
      
      .toggle-label {
        font-weight: 600;
        margin-right: 8px;
      }
      
      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .badge-success {
        background-color: #28a745;
        color: white;
      }
      
      .badge-warning {
        background-color: #ffc107;
        color: #212529;
      }
      
      .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 22px;
        width: 22px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }
      
      input:checked + .slider {
        background-color: #0078D4;
      }
      
      input:focus + .slider {
        box-shadow: 0 0 1px #0078D4;
      }
      
      input:checked + .slider:before {
        transform: translateX(30px);
      }
      
      .slider.round {
        border-radius: 34px;
      }
      
      .slider.round:before {
        border-radius: 50%;
      }
      
      .toggle-info {
        margin-top: 8px;
        font-size: 12px;
        color: #6c757d;
        display: flex;
        align-items: center;
      }
      
      .toggle-info i {
        margin-right: 6px;
      }
      
      /* Data source indicators */
      .data-source-indicator {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
      }
      
      .data-source-indicator:before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 4px;
      }
      
      .data-source-real {
        background-color: rgba(40, 167, 69, 0.1);
        color: #28a745;
      }
      
      .data-source-real:before {
        background-color: #28a745;
      }
      
      .data-source-simulated {
        background-color: rgba(255, 193, 7, 0.1);
        color: #212529;
      }
      
      .data-source-simulated:before {
        background-color: #ffc107;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Export to global scope
window.DataSourceToggle = DataSourceToggle;