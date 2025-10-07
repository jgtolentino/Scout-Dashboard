/**
 * Real Map with Markers Component (F8)
 * PRD Requirement: Geospatial map with store markers and performance indicators
 * Integrates with stores.json data and Mapbox GL JS
 */

class MapWithMarkers {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      style: 'mapbox://styles/mapbox/light-v10',
      center: [121.0244, 14.5547], // Manila, Philippines
      zoom: 10,
      showClusters: true,
      showHeatmap: false,
      enableInteraction: true,
      ...options
    };
    
    this.map = null;
    this.storesData = [];
    this.markers = [];
    this.popups = [];
    this.selectedStore = null;
    
    // Use demo token - in production, replace with valid Mapbox token
    this.mapboxToken = options.mapboxToken || 'pk.demo_token_replace_with_real_mapbox_token';
    
    this.init();
  }

  async init() {
    await this.loadStoresData();
    this.initializeMapbox();
  }

  async loadStoresData() {
    try {
      const response = await fetch('./data/stores.json');
      const data = await response.json();
      this.storesData = data.stores || [];
      this.regionalSummary = data.regional_summary || {};
      console.log('✅ Stores data loaded:', this.storesData.length, 'stores');
    } catch (error) {
      console.warn('Could not load stores data:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.storesData = [
      {
        store_id: "STORE-001",
        store_name: "SM Mall of Asia - Del Monte Corner",
        coordinates: [120.982239, 14.537842],
        address: "SM Mall of Asia, Pasay City",
        region: "NCR",
        status: "active",
        performance_score: 98.5,
        monthly_revenue: 1250000,
        brand_focus: "Del Monte"
      },
      {
        store_id: "STORE-002", 
        store_name: "Robinsons Galleria - FMCG Hub",
        coordinates: [121.055842, 14.623080],
        address: "Robinsons Galleria, Quezon City",
        region: "NCR",
        status: "active",
        performance_score: 94.2,
        monthly_revenue: 1100000,
        brand_focus: "Multi-Brand"
      }
    ];
  }

  initializeMapbox() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Map container ${this.containerId} not found`);
      return;
    }

    // Check if Mapbox GL JS is loaded
    if (typeof mapboxgl === 'undefined') {
      this.loadMapboxAndInit(container);
      return;
    }

    this.createMap(container);
  }

  loadMapboxAndInit(container) {
    // Create fallback while Mapbox loads
    container.innerHTML = this.renderFallbackMap();
    
    // Load Mapbox GL JS
    const mapboxCSS = document.createElement('link');
    mapboxCSS.rel = 'stylesheet';
    mapboxCSS.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
    document.head.appendChild(mapboxCSS);

    const mapboxJS = document.createElement('script');
    mapboxJS.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
    mapboxJS.onload = () => {
      setTimeout(() => this.createMap(container), 100);
    };
    mapboxJS.onerror = () => {
      console.warn('Could not load Mapbox GL JS, using fallback map');
      this.renderStaticFallback(container);
    };
    document.head.appendChild(mapboxJS);
  }

  createMap(container) {
    try {
      // Set Mapbox access token
      mapboxgl.accessToken = this.mapboxToken;
      
      // Clear container
      container.innerHTML = '<div id="map-canvas" style="width: 100%; height: 400px;"></div>';
      
      // Initialize map
      this.map = new mapboxgl.Map({
        container: 'map-canvas',
        style: this.options.style,
        center: this.options.center,
        zoom: this.options.zoom,
        interactive: this.options.enableInteraction
      });

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add fullscreen control
      this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Wait for map to load then add markers
      this.map.on('load', () => {
        this.addStoreMarkers();
        this.addMapControls(container);
        console.log('🗺️ Map initialized with', this.storesData.length, 'store markers');
      });

      // Handle map errors
      this.map.on('error', (e) => {
        console.warn('Map error:', e.error);
        this.renderStaticFallback(container);
      });

    } catch (error) {
      console.warn('Could not initialize Mapbox map:', error);
      this.renderStaticFallback(container);
    }
  }

  addStoreMarkers() {
    this.storesData.forEach(store => {
      const markerElement = this.createMarkerElement(store);
      const popup = this.createPopup(store);
      
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(store.coordinates)
        .setPopup(popup)
        .addTo(this.map);
      
      this.markers.push(marker);
      
      // Add click handler
      markerElement.addEventListener('click', () => {
        this.selectStore(store);
      });
    });
  }

  createMarkerElement(store) {
    const el = document.createElement('div');
    el.className = `map-marker ${this.getMarkerClass(store)}`;
    el.innerHTML = `
      <div class="marker-inner">
        <div class="marker-icon">
          <i class="${this.getStoreIcon(store.store_type)}"></i>
        </div>
        <div class="marker-label">${store.performance_score}%</div>
      </div>
    `;
    
    return el;
  }

  createPopup(store) {
    const popup = new mapboxgl.Popup({ 
      offset: 25,
      className: 'store-popup'
    });
    
    popup.setHTML(`
      <div class="popup-content">
        <div class="popup-header">
          <h4>${store.store_name}</h4>
          <div class="store-status ${store.status}">${store.status.toUpperCase()}</div>
        </div>
        
        <div class="popup-details">
          <div class="detail-row">
            <span class="detail-label">Region:</span>
            <span class="detail-value">${store.region}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Performance:</span>
            <span class="detail-value performance-${this.getPerformanceClass(store.performance_score)}">
              ${store.performance_score}%
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Revenue:</span>
            <span class="detail-value">₱${(store.monthly_revenue / 1000000).toFixed(1)}M</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Brand Focus:</span>
            <span class="detail-value">${store.brand_focus}</span>
          </div>
        </div>
        
        <div class="popup-actions">
          <button class="btn-sm btn-primary" onclick="window.mapInstance.viewStoreDetails('${store.store_id}')">
            View Details
          </button>
          <button class="btn-sm btn-secondary" onclick="window.mapInstance.centerOnStore('${store.store_id}')">
            Center Map
          </button>
        </div>
      </div>
    `);
    
    return popup;
  }

  addMapControls(container) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'map-controls';
    controlsDiv.innerHTML = `
      <div class="map-control-panel">
        <div class="control-section">
          <label>Filter by Region:</label>
          <select id="region-filter" class="map-control-select">
            <option value="">All Regions</option>
            ${Object.keys(this.regionalSummary).map(region => 
              `<option value="${region}">${region}</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="control-section">
          <label>Filter by Status:</label>
          <select id="status-filter" class="map-control-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div class="control-section">
          <button id="reset-view" class="btn-sm btn-outline">Reset View</button>
          <button id="cluster-toggle" class="btn-sm btn-outline">Toggle Clusters</button>
        </div>
      </div>
    `;
    
    container.appendChild(controlsDiv);
    this.attachControlListeners();
  }

  attachControlListeners() {
    // Region filter
    document.getElementById('region-filter')?.addEventListener('change', (e) => {
      this.filterByRegion(e.target.value);
    });
    
    // Status filter
    document.getElementById('status-filter')?.addEventListener('change', (e) => {
      this.filterByStatus(e.target.value);
    });
    
    // Reset view
    document.getElementById('reset-view')?.addEventListener('click', () => {
      this.resetView();
    });
    
    // Cluster toggle
    document.getElementById('cluster-toggle')?.addEventListener('click', () => {
      this.toggleClusters();
    });
  }

  filterByRegion(region) {
    this.markers.forEach((marker, index) => {
      const store = this.storesData[index];
      if (!region || store.region === region) {
        marker.getElement().style.display = 'block';
      } else {
        marker.getElement().style.display = 'none';
      }
    });
    
    console.log('🔍 Filtered by region:', region || 'All');
  }

  filterByStatus(status) {
    this.markers.forEach((marker, index) => {
      const store = this.storesData[index];
      if (!status || store.status === status) {
        marker.getElement().style.display = 'block';
      } else {
        marker.getElement().style.display = 'none';
      }
    });
    
    console.log('🔍 Filtered by status:', status || 'All');
  }

  resetView() {
    this.map.flyTo({
      center: this.options.center,
      zoom: this.options.zoom
    });
    
    // Clear filters
    document.getElementById('region-filter').value = '';
    document.getElementById('status-filter').value = '';
    this.filterByRegion('');
    this.filterByStatus('');
  }

  toggleClusters() {
    // Toggle cluster functionality would be implemented here
    console.log('🔄 Cluster toggle clicked');
  }

  selectStore(store) {
    this.selectedStore = store;
    
    // Dispatch custom event
    const event = new CustomEvent('storeSelected', {
      detail: { store }
    });
    document.dispatchEvent(event);
    
    console.log('📍 Store selected:', store.store_name);
  }

  centerOnStore(storeId) {
    const store = this.storesData.find(s => s.store_id === storeId);
    if (store && this.map) {
      this.map.flyTo({
        center: store.coordinates,
        zoom: 15
      });
    }
  }

  viewStoreDetails(storeId) {
    const store = this.storesData.find(s => s.store_id === storeId);
    if (store) {
      // Dispatch event for drill-down
      const event = new CustomEvent('storeDetailsRequested', {
        detail: { store, storeId }
      });
      document.dispatchEvent(event);
    }
  }

  renderFallbackMap() {
    return `
      <div class="map-fallback">
        <div class="fallback-header">
          <h4>Philippines Store Locations</h4>
          <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            Loading interactive map...
          </div>
        </div>
        <div class="fallback-content">
          ${this.renderStoreList()}
        </div>
      </div>
    `;
  }

  renderStaticFallback(container) {
    container.innerHTML = `
      <div class="map-fallback">
        <div class="fallback-header">
          <h4>Store Locations</h4>
          <div class="fallback-notice">
            <i class="fas fa-info-circle"></i>
            Interactive map unavailable - showing store list
          </div>
        </div>
        <div class="fallback-content">
          ${this.renderStoreList()}
        </div>
      </div>
    `;
  }

  renderStoreList() {
    return `
      <div class="store-list">
        ${this.storesData.map(store => `
          <div class="store-list-item ${store.status}" data-store-id="${store.store_id}">
            <div class="store-info">
              <div class="store-name">${store.store_name}</div>
              <div class="store-location">${store.address}</div>
              <div class="store-metrics">
                <span class="metric">Performance: ${store.performance_score}%</span>
                <span class="metric">Revenue: ₱${(store.monthly_revenue / 1000000).toFixed(1)}M</span>
              </div>
            </div>
            <div class="store-actions">
              <button class="btn-sm btn-primary" onclick="window.mapInstance.viewStoreDetails('${store.store_id}')">
                Details
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Helper methods
  getMarkerClass(store) {
    const performance = this.getPerformanceClass(store.performance_score);
    const status = store.status;
    return `marker-${performance} marker-${status}`;
  }

  getPerformanceClass(score) {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  }

  getStoreIcon(storeType) {
    const iconMap = {
      'Mall Outlet': 'fas fa-store',
      'Supermarket': 'fas fa-shopping-cart',
      'Convenience Store': 'fas fa-shopping-basket',
      'Sari-Sari Store': 'fas fa-home'
    };
    return iconMap[storeType] || 'fas fa-map-marker-alt';
  }

  // Public API
  getSelectedStore() {
    return this.selectedStore;
  }

  getStoresData() {
    return this.storesData;
  }

  destroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}

// Add CSS styles for the map component
const mapWithMarkersStyles = `
<style>
.map-marker {
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.map-marker:hover {
  transform: scale(1.1);
}

.marker-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid white;
}

.marker-excellent .marker-inner { background-color: var(--success-color); }
.marker-good .marker-inner { background-color: var(--info-color); }
.marker-warning .marker-inner { background-color: var(--warning-color); }
.marker-critical .marker-inner { background-color: var(--danger-color); }

.marker-icon {
  color: white;
  font-size: 14px;
}

.marker-label {
  color: white;
  font-size: 8px;
  font-weight: bold;
  line-height: 1;
}

.store-popup .mapboxgl-popup-content {
  padding: 0;
  border-radius: 8px;
  min-width: 280px;
}

.popup-content {
  padding: 1rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.popup-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.store-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.store-status.active { background-color: var(--success-color); color: white; }
.store-status.warning { background-color: var(--warning-color); color: black; }
.store-status.critical { background-color: var(--danger-color); color: white; }

.popup-details {
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
}

.performance-excellent { color: var(--success-color); }
.performance-good { color: var(--info-color); }
.performance-warning { color: var(--warning-color); }
.performance-critical { color: var(--danger-color); }

.popup-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: #005a9f;
}

.btn-secondary {
  background-color: var(--text-secondary);
  color: white;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.map-control-panel {
  background: var(--background-card);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.control-section {
  margin-bottom: 0.75rem;
}

.control-section:last-child {
  margin-bottom: 0;
}

.control-section label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.map-control-select {
  width: 100%;
  padding: 0.375rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: var(--background-card);
  color: var(--text-primary);
}

.map-fallback {
  background: var(--background-card);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  min-height: 400px;
}

.fallback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.loading-indicator, .fallback-notice {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.loading-indicator i {
  margin-right: 0.5rem;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.store-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--background-card);
  cursor: pointer;
  transition: all 0.2s ease;
}

.store-list-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.store-list-item.active { border-left: 4px solid var(--success-color); }
.store-list-item.warning { border-left: 4px solid var(--warning-color); }
.store-list-item.critical { border-left: 4px solid var(--danger-color); }

.store-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.store-location {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.store-metrics {
  display: flex;
  gap: 1rem;
}

.metric {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', mapWithMarkersStyles);

// Global reference for popup callbacks
if (typeof window !== 'undefined') {
  window.MapWithMarkers = MapWithMarkers;
}