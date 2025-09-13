/**
 * Choropleth Map Component for Scout Edge
 * 
 * This module provides a geographical visualization of retail intelligence metrics
 * across different regions, cities, and barangays in the Philippines.
 * 
 * Dependencies:
 * - Leaflet.js (for map rendering)
 * - D3.js (for color scales)
 */

class ChoroplethMap {
  /**
   * Initialize the Choropleth Map
   * @param {Object} options Map options
   */
  constructor(options = {}) {
    // Default configuration
    this.config = {
      containerId: options.containerId || 'geo-map',
      mode: options.mode || 'stores', // stores, sales, brands, combos
      geoLevel: options.geoLevel || 'barangay', // region, city, barangay
      data: options.data || null,
      geojsonPath: options.geojsonPath || '../assets/data/geo/barangay_boundaries.geojson',
      onMapClick: options.onMapClick || ((e, feature) => this.handleMapClick(e, feature)),
      darkMode: options.darkMode || false,
      colorScheme: options.colorScheme || ['#e0f3f8', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#08589e']
    };
    
    // Set up state
    this.map = null;
    this.geojson = null;
    this.tooltip = null;
    this.legendControl = null;
    this.isInitialized = false;
    this.isLoading = true;
    
    // Try to initialize map
    this.initializeMap();
  }
  
  /**
   * Initialize the map if Leaflet is available, otherwise load it
   */
  initializeMap() {
    // Check if Leaflet is available
    if (typeof L !== 'undefined') {
      this.setupMap();
    } else {
      // If Leaflet is not available, load it dynamically
      this.loadLeaflet()
        .then(() => this.setupMap())
        .catch(error => {
          console.error('Failed to load Leaflet:', error);
          this.showError('Failed to load map library. Please try refreshing the page.');
        });
    }
  }
  
  /**
   * Load Leaflet.js dynamically
   * @returns {Promise} Promise resolving when Leaflet is loaded
   */
  loadLeaflet() {
    return new Promise((resolve, reject) => {
      // Load CSS
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      css.crossOrigin = '';
      document.head.appendChild(css);
      
      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet.js'));
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Set up the map with Leaflet
   */
  setupMap() {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.error(`Map container #${this.config.containerId} not found`);
      return;
    }
    
    // Create the map
    this.map = L.map(this.config.containerId, {
      center: [12.8797, 121.7740], // Center on Philippines
      zoom: 6,
      minZoom: 5,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false
    });
    
    // Add tile layer with appropriate styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png', {
      style: this.config.darkMode ? 'dark_all' : 'light_all',
      subdomains: 'abcd',
    }).addTo(this.map);
    
    // Create tooltip control (hidden initially)
    this.createTooltip();
    
    // Set initialized flag
    this.isInitialized = true;
    
    // If data is provided, load it immediately
    if (this.config.data) {
      this.updateData(this.config.data);
    } else {
      // Otherwise, load the GeoJSON and wait for data
      this.loadGeoJSON();
    }
  }
  
  /**
   * Create a tooltip element
   */
  createTooltip() {
    // Create a tooltip container
    this.tooltip = L.DomUtil.create('div', 'map-tooltip');
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);
  }
  
  /**
   * Load GeoJSON boundaries
   */
  loadGeoJSON() {
    this.showLoading(true);
    
    fetch(this.config.geojsonPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(geojson => {
        this.baseGeojson = geojson;
        this.showLoading(false);
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
        this.showError('Failed to load geographical data. Please try refreshing the page.');
      });
  }
  
  /**
   * Update the map with new data
   * @param {Object} data Data to display on the map
   */
  updateData(data) {
    if (!this.isInitialized || !this.map) {
      console.warn('Map not initialized yet. Data will be loaded when initialization completes.');
      this.config.data = data;
      return;
    }
    
    this.showLoading(true);
    
    // Clear existing GeoJSON layer
    if (this.geojson) {
      this.map.removeLayer(this.geojson);
    }
    
    // If no GeoJSON is loaded yet, wait for it
    if (!this.baseGeojson) {
      fetch(this.config.geojsonPath)
        .then(response => response.json())
        .then(geojson => {
          this.baseGeojson = geojson;
          this.processDataAndCreateLayer(data);
        })
        .catch(error => {
          console.error('Error loading GeoJSON:', error);
          this.showError('Failed to load geographical data. Please try refreshing the page.');
        });
    } else {
      // Process data and create layer
      this.processDataAndCreateLayer(data);
    }
  }
  
  /**
   * Process data and create the choropleth layer
   * @param {Object} data Data to display
   */
  processDataAndCreateLayer(data) {
    // Clone the base GeoJSON
    const workingGeojson = JSON.parse(JSON.stringify(this.baseGeojson));
    
    // Find the min/max values to set up the color scale
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    // Check if data has values
    if (!data || !data.features || !data.features.length) {
      this.showError('No data available for the selected filters.');
      return;
    }
    
    // Create a lookup table for quick access
    const dataLookup = {};
    data.features.forEach(feature => {
      const key = this.getFeatureKey(feature.properties);
      dataLookup[key] = feature.properties.value;
      
      // Update min/max
      if (feature.properties.value < minValue) minValue = feature.properties.value;
      if (feature.properties.value > maxValue) maxValue = feature.properties.value;
    });
    
    // Ensure min and max are valid
    if (minValue === Infinity) minValue = 0;
    if (maxValue === -Infinity) maxValue = 100;
    
    // Add data values to the base GeoJSON
    workingGeojson.features.forEach(feature => {
      const key = this.getFeatureKey(feature.properties);
      feature.properties.value = dataLookup[key] || 0;
    });
    
    // Create the color scale
    const getColor = this.createColorScale(minValue, maxValue);
    
    // Create the GeoJSON layer
    this.geojson = L.geoJSON(workingGeojson, {
      style: feature => this.styleFeature(feature, getColor),
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer)
    }).addTo(this.map);
    
    // Add legend
    this.addLegend(minValue, maxValue, getColor);
    
    // Fit map to bounds
    this.map.fitBounds(this.geojson.getBounds());
    
    // Hide loading indicator
    this.showLoading(false);
  }
  
  /**
   * Get a unique key for a feature based on geographic level
   * @param {Object} properties Feature properties
   * @returns {string} Unique key
   */
  getFeatureKey(properties) {
    switch (this.config.geoLevel) {
      case 'region':
        return properties.region;
      case 'city':
        return `${properties.region}_${properties.city}`;
      case 'barangay':
      default:
        return `${properties.region}_${properties.city}_${properties.barangay}`;
    }
  }
  
  /**
   * Create a D3-like color scale
   * @param {number} min Minimum value
   * @param {number} max Maximum value
   * @returns {Function} Color scale function
   */
  createColorScale(min, max) {
    const colors = this.config.colorScheme;
    const steps = colors.length;
    const range = max - min;
    
    return function(value) {
      if (value === 0) return '#eee'; // Special case for zero
      
      // Calculate index in the color array
      const normalizedValue = (value - min) / range;
      const index = Math.min(Math.floor(normalizedValue * steps), steps - 1);
      
      return colors[index];
    };
  }
  
  /**
   * Style a GeoJSON feature
   * @param {Object} feature GeoJSON feature
   * @param {Function} getColor Color scale function
   * @returns {Object} Leaflet style object
   */
  styleFeature(feature, getColor) {
    return {
      fillColor: getColor(feature.properties.value),
      weight: 1,
      opacity: 1,
      color: this.config.darkMode ? '#444' : '#999',
      fillOpacity: 0.7
    };
  }
  
  /**
   * Attach event handlers to each feature
   * @param {Object} feature GeoJSON feature
   * @param {L.Layer} layer Leaflet layer
   */
  onEachFeature(feature, layer) {
    // Add hover effect
    layer.on({
      mouseover: e => this.highlightFeature(e, feature),
      mouseout: this.resetHighlight.bind(this),
      click: e => this.config.onMapClick(e, feature)
    });
  }
  
  /**
   * Highlight a feature on mouseover
   * @param {L.MouseEvent} e Mouse event
   * @param {Object} feature GeoJSON feature
   */
  highlightFeature(e, feature) {
    const layer = e.target;
    
    layer.setStyle({
      weight: 3,
      color: '#666',
      fillOpacity: 0.9
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    
    this.showTooltip(e, feature);
  }
  
  /**
   * Reset feature highlight on mouseout
   * @param {L.MouseEvent} e Mouse event
   */
  resetHighlight(e) {
    this.geojson.resetStyle(e.target);
    this.hideTooltip();
  }
  
  /**
   * Handle map click
   * @param {L.MouseEvent} e Mouse event
   * @param {Object} feature GeoJSON feature
   */
  handleMapClick(e, feature) {
    // Default implementation - log click and feature info
    console.log('Map clicked:', e.latlng, 'Feature:', feature);
    
    // For drill-down functionality
    if (this.config.geoLevel === 'region') {
      // Zoom to the region and switch to city level
      this.map.fitBounds(e.target.getBounds());
      // Here you could trigger a mode change
    }
  }
  
  /**
   * Show tooltip with feature information
   * @param {L.MouseEvent} e Mouse event
   * @param {Object} feature GeoJSON feature
   */
  showTooltip(e, feature) {
    if (!this.tooltip) return;
    
    // Get pixel position of the mouse event
    const point = e.containerPoint;
    
    // Get the geographical name based on level
    let geoName = '';
    switch (this.config.geoLevel) {
      case 'region':
        geoName = feature.properties.region;
        break;
      case 'city':
        geoName = feature.properties.city;
        break;
      case 'barangay':
      default:
        geoName = feature.properties.barangay;
        break;
    }
    
    // Get the value and a formatted value
    const value = feature.properties.value;
    let formattedValue = value.toLocaleString();
    let valueLabel = '';
    let extraContent = '';
    
    // Format value based on mode
    switch (this.config.mode) {
      case 'stores':
        valueLabel = 'Stores';
        break;
      case 'sales':
        formattedValue = '₱' + value.toLocaleString();
        valueLabel = 'Sales';
        if (feature.properties.transactionCount) {
          extraContent += `
            <div class="map-tooltip-label">
              <span>Transactions:</span>
              <span>${feature.properties.transactionCount.toLocaleString()}</span>
            </div>
          `;
        }
        break;
      case 'brands':
        valueLabel = 'Brand Mentions';
        // Add store count if available
        if (feature.properties.storeCount) {
          extraContent += `
            <div class="map-tooltip-label">
              <span>Store Count:</span>
              <span>${feature.properties.storeCount}</span>
            </div>
          `;
        }
        // Add top brand percentage if available
        if (feature.properties.brandPercentage) {
          extraContent += `
            <div class="map-tooltip-label">
              <span>Top Brand %:</span>
              <span>${feature.properties.brandPercentage}%</span>
            </div>
          `;
        }
        // Add second brand info if available
        if (feature.properties.secondBrand) {
          extraContent += `
            <div class="map-tooltip-label">
              <span>Second Brand:</span>
              <span>${feature.properties.secondBrand} (${feature.properties.secondPercentage}%)</span>
            </div>
          `;
        }
        break;
      case 'combos':
        valueLabel = 'Combo Frequency';
        if (feature.properties.transactionCount) {
          extraContent += `
            <div class="map-tooltip-label">
              <span>Transactions:</span>
              <span>${feature.properties.transactionCount.toLocaleString()}</span>
            </div>
          `;
        }
        break;
    }
    
    // Set the tooltip content
    this.tooltip.innerHTML = `
      <div class="map-tooltip-title">${geoName}</div>
      <div class="map-tooltip-content">
        <div class="map-tooltip-label">
          <span>${valueLabel}:</span>
          <span>${formattedValue}</span>
        </div>
        <div class="map-tooltip-label">
          <span>Ranking:</span>
          <span>${feature.properties.rank || 'N/A'}</span>
        </div>
        <div class="map-tooltip-label">
          <span>Top Brand:</span>
          <span>${feature.properties.topBrand || 'N/A'}</span>
        </div>
        ${extraContent}
      </div>
    `;
    
    // Position the tooltip
    this.tooltip.style.left = (point.x + 10) + 'px';
    this.tooltip.style.top = (point.y - 20) + 'px';
    this.tooltip.style.display = 'block';
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
  
  /**
   * Add a legend to the map
   * @param {number} min Minimum value
   * @param {number} max Maximum value
   * @param {Function} getColor Color scale function
   */
  addLegend(min, max, getColor) {
    // We'll use the external legend in the HTML
    const legendGradient = document.querySelector('.legend-gradient');
    if (legendGradient) {
      // Set the gradient based on our color scheme
      const colors = this.config.colorScheme;
      let gradientString = 'linear-gradient(to right';
      
      // Add each color stop
      for (let i = 0; i < colors.length; i++) {
        const percent = (i / (colors.length - 1)) * 100;
        gradientString += `, ${colors[i]} ${percent}%`;
      }
      
      gradientString += ')';
      legendGradient.style.background = gradientString;
    }
    
    // If there are labels, update them
    const lowLabel = document.querySelector('.map-legend small:first-child');
    const highLabel = document.querySelector('.map-legend small:last-child');
    
    if (lowLabel && highLabel) {
      // Format values based on mode
      let minFormatted = min.toLocaleString();
      let maxFormatted = max.toLocaleString();
      
      if (this.config.mode === 'sales') {
        minFormatted = '$' + minFormatted;
        maxFormatted = '$' + maxFormatted;
      }
      
      lowLabel.textContent = minFormatted;
      highLabel.textContent = maxFormatted;
    }
  }
  
  /**
   * Show loading indicator
   * @param {boolean} show Whether to show or hide the loading indicator
   */
  showLoading(show) {
    this.isLoading = show;
    
    // Find the loading indicator
    const loadingIndicator = document.querySelector(`#${this.config.containerId} .map-loading`);
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
  }
  
  /**
   * Show error message in place of map
   * @param {string} message Error message
   */
  showError(message) {
    const container = document.getElementById(this.config.containerId);
    if (!container) return;
    
    this.showLoading(false);
    
    // Create error message element
    const errorElement = L.DomUtil.create('div', 'map-error alert alert-danger');
    errorElement.innerHTML = `
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${message}
    `;
    
    // Clear container and add error
    container.innerHTML = '';
    container.appendChild(errorElement);
  }
  
  /**
   * Update map mode
   * @param {string} mode Map mode (stores, sales, brands, combos)
   */
  updateMode(mode) {
    this.config.mode = mode;
    
    // If there's data, refresh with the new mode
    if (this.config.data) {
      this.updateData(this.config.data);
    }
  }
  
  /**
   * Update geographic level
   * @param {string} level Geographic level (region, city, barangay)
   */
  updateGeoLevel(level) {
    this.config.geoLevel = level;
    
    // If there's data, refresh with the new level
    if (this.config.data) {
      this.updateData(this.config.data);
    }
  }
  
  /**
   * Update dark mode setting
   * @param {boolean} darkMode Whether dark mode is enabled
   */
  updateDarkMode(darkMode) {
    this.config.darkMode = darkMode;
    
    // Update tile layer
    if (this.map) {
      this.map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
          this.map.removeLayer(layer);
        }
      });
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png', {
        style: this.config.darkMode ? 'dark_all' : 'light_all',
        subdomains: 'abcd',
      }).addTo(this.map);
      
      // If there's data, refresh styling
      if (this.geojson) {
        const getColor = this.createColorScale(this.minValue, this.maxValue);
        this.geojson.setStyle(feature => this.styleFeature(feature, getColor));
      }
    }
  }
}

// Make available globally
window.ChoroplethMap = ChoroplethMap;