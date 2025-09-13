/**
 * Geographic Heatmap Component
 * Displays transaction density on a map with live data
 */

class GeographicHeatmap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    
    this.options = {
      height: 500,
      center: [12.8797, 121.7740], // Philippines center
      zoom: 6,
      maxZoom: 18,
      minZoom: 5,
      heatmapRadius: 25,
      heatmapBlur: 15,
      ...options
    };
    
    this.map = null;
    this.heatmapLayer = null;
    this.markersLayer = null;
    this.data = null;
    this.loading = false;
    
    // Bind methods
    this.loadData = this.loadData.bind(this);
    this.render = this.render.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    
    // Initialize
    this.init();
  }

  init() {
    // Create map container
    this.container.innerHTML = `
      <div class="geographic-heatmap-component">
        <div class="component-header">
          <h3>Transaction Heatmap</h3>
          <div class="controls">
            <select id="${this.container.id}-granularity" class="granularity-selector">
              <option value="barangay">Barangay</option>
              <option value="municipality">Municipality</option>
              <option value="province">Province</option>
            </select>
            <button class="toggle-heatmap-btn" title="Toggle heatmap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 9h18M9 21V9"></path>
              </svg>
            </button>
            <button class="refresh-btn" title="Refresh data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="map-container" id="${this.container.id}-map" style="height: ${this.options.height}px;">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <span>Loading map data...</span>
          </div>
        </div>
        <div class="map-legend">
          <h4>Transaction Density</h4>
          <div class="legend-scale">
            <span class="legend-label">Low</span>
            <div class="legend-gradient"></div>
            <span class="legend-label">High</span>
          </div>
        </div>
        <div class="map-footer">
          <span class="coordinates"></span>
          <span class="data-source"></span>
        </div>
      </div>
    `;
    
    // Initialize map
    this.initializeMap();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data
    this.loadData();
  }

  initializeMap() {
    const mapContainer = this.container.querySelector(`#${this.container.id}-map`);
    
    // Initialize Leaflet map
    this.map = L.map(mapContainer, {
      center: this.options.center,
      zoom: this.options.zoom,
      maxZoom: this.options.maxZoom,
      minZoom: this.options.minZoom
    });
    
    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    // Initialize layers
    this.markersLayer = L.featureGroup().addTo(this.map);
    
    // Add coordinate display
    this.map.on('mousemove', (e) => {
      const coords = this.container.querySelector('.coordinates');
      if (coords) {
        coords.textContent = `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`;
      }
    });
    
    // Handle map clicks
    this.map.on('click', (e) => {
      this.handleMapClick(e.latlng);
    });
  }

  setupEventListeners() {
    // Granularity selector
    const granularitySelector = this.container.querySelector('.granularity-selector');
    granularitySelector.addEventListener('change', (e) => {
      this.options.granularity = e.target.value;
      this.loadData();
    });
    
    // Toggle heatmap button
    const toggleBtn = this.container.querySelector('.toggle-heatmap-btn');
    toggleBtn.addEventListener('click', () => {
      this.toggleHeatmap();
    });
    
    // Refresh button
    const refreshBtn = this.container.querySelector('.refresh-btn');
    refreshBtn.addEventListener('click', () => {
      this.loadData();
    });
    
    // Listen for global filter changes
    window.addEventListener('filters:changed', (e) => {
      this.updateFilters(e.detail);
    });
  }

  showLoading(show = true) {
    const loadingOverlay = this.container.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    this.loading = show;
  }

  async loadData() {
    if (this.loading) return;
    
    this.showLoading(true);
    
    try {
      // Build API parameters
      const params = {
        granularity: this.options.granularity || 'barangay'
      };
      
      // Add date filters if set
      if (this.options.startDate) {
        params.startDate = this.options.startDate;
      }
      
      if (this.options.endDate) {
        params.endDate = this.options.endDate;
      }
      
      // Add any global filters
      const globalFilters = window.globalFilters || {};
      Object.assign(params, globalFilters);
      
      // Fetch data from API
      const response = await window.apiClient.getTransactionHeatmap(params);
      
      // Process and store data
      this.data = this.processData(response.data);
      
      // Render map
      this.render();
      
      // Update footer
      this.updateFooter(response);
      
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  processData(rawData) {
    if (!Array.isArray(rawData)) {
      console.warn('Invalid data format received:', rawData);
      return [];
    }
    
    // Convert data to heatmap format
    return rawData.map(item => ({
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
      intensity: item.transactionCount || 0,
      location: item.locationName || 'Unknown',
      amount: item.totalAmount || 0,
      stores: item.storeCount || 0,
      details: {
        barangay: item.barangay,
        municipality: item.municipality,
        province: item.province
      }
    }));
  }

  render() {
    // Clear existing layers
    this.markersLayer.clearLayers();
    if (this.heatmapLayer) {
      this.map.removeLayer(this.heatmapLayer);
    }
    
    if (!this.data || this.data.length === 0) {
      return;
    }
    
    // Create heatmap data
    const heatmapData = this.data.map(point => [
      point.lat,
      point.lng,
      point.intensity
    ]);
    
    // Create heatmap layer
    this.heatmapLayer = L.heatLayer(heatmapData, {
      radius: this.options.heatmapRadius,
      blur: this.options.heatmapBlur,
      maxZoom: this.options.maxZoom,
      gradient: {
        0.0: 'blue',
        0.25: 'cyan',
        0.5: 'lime',
        0.75: 'yellow',
        1.0: 'red'
      }
    }).addTo(this.map);
    
    // Add markers for high-activity areas
    this.addMarkers();
    
    // Fit map to data bounds
    if (this.data.length > 0) {
      const bounds = L.latLngBounds(this.data.map(d => [d.lat, d.lng]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  addMarkers() {
    // Sort by intensity and show top locations
    const topLocations = [...this.data]
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 20);
    
    topLocations.forEach(location => {
      // Create custom icon based on intensity
      const iconSize = Math.min(30, Math.max(15, location.intensity / 100));
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-inner" style="width: ${iconSize}px; height: ${iconSize}px;">
          <span class="marker-value">${this.formatNumber(location.intensity)}</span>
        </div>`,
        iconSize: [iconSize, iconSize]
      });
      
      // Create marker
      const marker = L.marker([location.lat, location.lng], { icon })
        .bindPopup(this.createPopupContent(location))
        .on('click', () => this.handleLocationClick(location));
      
      this.markersLayer.addLayer(marker);
    });
  }

  createPopupContent(location) {
    return `
      <div class="location-popup">
        <h4>${location.location}</h4>
        <div class="popup-stats">
          <div class="stat">
            <span class="label">Transactions:</span>
            <span class="value">${this.formatNumber(location.intensity)}</span>
          </div>
          <div class="stat">
            <span class="label">Revenue:</span>
            <span class="value">${this.formatCurrency(location.amount)}</span>
          </div>
          <div class="stat">
            <span class="label">Stores:</span>
            <span class="value">${location.stores}</span>
          </div>
        </div>
        <div class="popup-location">
          <span>${location.details.barangay || ''}</span>
          <span>${location.details.municipality || ''}</span>
          <span>${location.details.province || ''}</span>
        </div>
        <button class="drill-down-btn" onclick="window.dispatchEvent(new CustomEvent('map:drilldown', {detail: ${JSON.stringify(location)}}))">
          View Details →
        </button>
      </div>
    `;
  }

  toggleHeatmap() {
    if (this.heatmapLayer) {
      if (this.map.hasLayer(this.heatmapLayer)) {
        this.map.removeLayer(this.heatmapLayer);
      } else {
        this.map.addLayer(this.heatmapLayer);
      }
    }
  }

  handleMapClick(latlng) {
    // Find nearest location
    let nearestLocation = null;
    let minDistance = Infinity;
    
    this.data.forEach(location => {
      const distance = this.map.distance(latlng, [location.lat, location.lng]);
      if (distance < minDistance && distance < 5000) { // Within 5km
        minDistance = distance;
        nearestLocation = location;
      }
    });
    
    if (nearestLocation) {
      this.handleLocationClick(nearestLocation);
    }
  }

  handleLocationClick(location) {
    // Dispatch location click event
    window.dispatchEvent(new CustomEvent('map:location:clicked', {
      detail: {
        location: location,
        component: 'geographic-heatmap'
      }
    }));
  }

  updateFilters(filters) {
    // Update component options with new filters
    if (filters.startDate) {
      this.options.startDate = filters.startDate;
    }
    
    if (filters.endDate) {
      this.options.endDate = filters.endDate;
    }
    
    // Reload data with new filters
    this.loadData();
  }

  updateFooter(response) {
    const dataSource = this.container.querySelector('.data-source');
    if (dataSource && response.source) {
      dataSource.textContent = `Source: ${response.source}`;
      dataSource.className = `data-source ${response.source.toLowerCase()}`;
    }
  }

  showError(message) {
    const mapContainer = this.container.querySelector('.map-container');
    mapContainer.innerHTML = `
      <div class="error-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <h4>Unable to load map data</h4>
        <p>${message}</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  formatNumber(num) {
    return new Intl.NumberFormat('en-PH').format(num);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  destroy() {
    if (this.map) {
      this.map.remove();
    }
    
    // Remove event listeners
    window.removeEventListener('filters:changed', this.updateFilters);
    
    // Clear container
    this.container.innerHTML = '';
  }
}

// Export for use
window.GeographicHeatmap = GeographicHeatmap;