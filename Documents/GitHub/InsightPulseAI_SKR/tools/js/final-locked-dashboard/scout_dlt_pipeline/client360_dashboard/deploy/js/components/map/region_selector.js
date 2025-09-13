/**
 * Region Selector Component for Client360 Dashboard v2.4.0
 * Provides interactive region selection and navigation for maps
 */
class RegionSelector {
  constructor(config = {}) {
    this.config = {
      mapEngine: null,
      selectableLayers: ['regions', 'municipalities', 'barangays'],
      selectionColor: '#e31937',
      selectionWidth: 3,
      zoomLevels: {
        regions: 7,
        municipalities: 10,
        barangays: 13
      },
      animationDuration: 1000,
      breadcrumbsContainerId: 'map-breadcrumbs',
      ...config
    };
    this.selectedFeatures = {
      regions: null,
      municipalities: null,
      barangays: null
    };
    this.selectionLayers = {
      regions: null,
      municipalities: null,
      barangays: null
    };
    this.currentLevel = 'regions';
    this.mapEngine = this.config.mapEngine;
    this.breadcrumbsElement = null;
    this.callbacks = new Map();
    // Initialize if map engine is provided
    if (this.mapEngine) {
      this.initialize();
    }
  }
  /**
   * Initialize region selector
   * @param {Object} mapEngine - Map engine instance
   */
  initialize(mapEngine = null) {
    if (mapEngine) {
      this.mapEngine = mapEngine;
    }
    if (!this.mapEngine) {
      console.error('Map engine is required for region selector');
      return;
    }
    // Setup selection layers
    this.createSelectionLayers();
    // Setup click handlers
    this.setupClickHandlers();
    // Initialize breadcrumbs
    this.initializeBreadcrumbs();
  }
  /**
   * Create selection outline layers
   */
  createSelectionLayers() {
    if (!this.mapEngine || !this.mapEngine.map) return;
    // Wait for map to be loaded
    if (!this.mapEngine.isMapLoaded) {
      this.mapEngine.on('mapLoaded', () => {
        this.createSelectionLayers();
      });
      return;
    }
    // Create selection sources and layers for each level
    this.config.selectableLayers.forEach(level => {
      const sourceId = `${level}-selection-source`;
      const layerId = `${level}-selection-layer`;
      // Add empty GeoJSON source
      this.mapEngine.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      // Add selection layer
      this.mapEngine.map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          visibility: level === this.currentLevel ? 'visible' : 'none'
        },
        paint: {
          'line-color': this.config.selectionColor,
          'line-width': this.config.selectionWidth,
          'line-opacity': 0.8
        }
      });
      // Store reference
      this.selectionLayers[level] = layerId;
    });
  }
  /**
   * Setup click handlers for selectable layers
   */
  setupClickHandlers() {
    if (!this.mapEngine || !this.mapEngine.map) return;
    // Wait for map to be loaded
    if (!this.mapEngine.isMapLoaded) {
      this.mapEngine.on('mapLoaded', () => {
        this.setupClickHandlers();
      });
      return;
    }
    // Set up click handlers for each layer
    this.config.selectableLayers.forEach(level => {
      this.mapEngine.map.on('click', level, (e) => {
        if (e.features && e.features.length > 0) {
          this.handleRegionSelection(level, e.features[0]);
        }
      });
      // Change cursor on hover
      this.mapEngine.map.on('mouseenter', level, () => {
        this.mapEngine.map.getCanvas().style = 'pointer';
      });
      this.mapEngine.map.on('mouseleave', level, () => {
        this.mapEngine.map.getCanvas().style = '';
      });
    });
  }
  /**
   * Initialize breadcrumbs element
   */
  initializeBreadcrumbs() {
    if (this.config.breadcrumbsContainerId) {
      this.breadcrumbsElement = document.getElementById(this.config.breadcrumbsContainerId);
      if (!this.breadcrumbsElement) {
        // Create the element if it doesn't exist
        this.breadcrumbsElement = document.createElement('div');
        this.breadcrumbsElement.id = this.config.breadcrumbsContainerId;
        this.breadcrumbsElement.className = 'map-breadcrumbs';
        // Add to map container
        if (this.mapEngine && this.mapEngine.container) {
          this.mapEngine.container.appendChild(this.breadcrumbsElement);
        }
      }
      // Initialize with default breadcrumb
      this.updateBreadcrumbs();
    }
  }
  /**
   * Handle region selection
   * @param {string} level - Geographic level (regions, municipalities, barangays)
   * @param {Object} feature - Selected GeoJSON feature
   */
  handleRegionSelection(level, feature) {
    // Store selected feature
    this.selectedFeatures[level] = feature;
    // Clear selections for lower levels
    const levelIndex = this.config.selectableLayers.indexOf(level);
    for (let i = levelIndex + 1; i < this.config.selectableLayers.length; i++) {
      const lowerLevel = this.config.selectableLayers[i];
      this.selectedFeatures[lowerLevel] = null;
    }
    // Update selection layer
    this.updateSelectionLayer(level, feature);
    // Update current level if needed
    if (level === this.currentLevel) {
      const nextLevelIndex = levelIndex + 1;
      if (nextLevelIndex < this.config.selectableLayers.length) {
        this.setCurrentLevel(this.config.selectableLayers[nextLevelIndex]);
      }
    }
    // Pan and zoom to selected feature
    this.zoomToFeature(feature);
    // Update breadcrumbs
    this.updateBreadcrumbs();
    // Trigger selection event
    this.notifySelectionChange(level, feature);
  }
  /**
   * Update selection layer with selected feature
   * @param {string} level - Geographic level
   * @param {Object} feature - Selected GeoJSON feature
   */
  updateSelectionLayer(level, feature) {
    if (!this.mapEngine || !this.mapEngine.map) return;
    const sourceId = `${level}-selection-source`;
    const source = this.mapEngine.map.getSource(sourceId);
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: feature.geometry
      });
    }
  }
  /**
   * Zoom map to selected feature
   * @param {Object} feature - GeoJSON feature
   */
  zoomToFeature(feature) {
    if (!this.mapEngine || !this.mapEngine.map || !feature) return;
    // Calculate bounds for feature
    const bounds = new mapboxgl.LngLatBounds();
    if (feature.geometry.type === 'Point') {
      bounds.extend(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach(coord => {
        bounds.extend(coord);
      });
    } else if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates.forEach(ring => {
        ring.forEach(coord => {
          bounds.extend(coord);
        });
      });
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ring.forEach(coord => {
            bounds.extend(coord);
          });
        });
      });
    }
    // Zoom to bounds with animation
    this.mapEngine.map.fitBounds(bounds, {
      padding: 50,
      duration: this.config.animationDuration
    });
  }
  /**
   * Set current map navigation level
   * @param {string} level - Geographic level (regions, municipalities, barangays)
   */
  setCurrentLevel(level) {
    if (!this.config.selectableLayers.includes(level)) {
      console.error(`Invalid level: ${level}`);
      return;
    }
    // Update current level
    this.currentLevel = level;
    // Update layer visibility
    this.config.selectableLayers.forEach(l => {
      // Show the level and its selection layer
      this.mapEngine.setLayerVisibility(l, l === level);
      const selectionLayer = this.selectionLayers[l];
      if (selectionLayer) {
        this.mapEngine.map.setLayoutProperty(
          selectionLayer,
          'visibility',
          // Show selection for current and above levels
          this.config.selectableLayers.indexOf(l) <= this.config.selectableLayers.indexOf(level) ? 'visible' : 'none'
        );
      }
    });
    // Set appropriate zoom level if configured
    if (this.config.zoomLevels[level] && !this.selectedFeatures[level]) {
      this.mapEngine.map.easeTo({
        zoom: this.config.zoomLevels[level],
        duration: this.config.animationDuration
      });
    }
    // Notify level change
    this.notifyLevelChange(level);
  }
  /**
   * Update breadcrumbs navigation
   */
  updateBreadcrumbs() {
    if (!this.breadcrumbsElement) return;
    let html = '<ul class="breadcrumbs-list">';
    // Add home link
    html += `<li><a href="#" data-level="regions">Home</a></li>`;
    // Add selected regions
    this.config.selectableLayers.forEach((level, index) => {
      if (index === 0) return; // Skip regions (home)
      const feature = this.selectedFeatures[this.config.selectableLayers[index - 1]];
      if (feature) {
        const name = feature.properties.name || feature.properties.NAME || feature.properties.id || 'Unknown';
        html += `<li><a href="#" data-level="${level}">${name}</a></li>`;
      }
    });
    html += '</ul>';
    // Update DOM
    this.breadcrumbsElement.innerHTML = html;
    // Add event listeners
    const links = this.breadcrumbsElement.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const level = e.target.getAttribute('data-level');
        this.navigateTo(level);
      });
    });
  }
  /**
   * Navigate to a specific level
   * @param {string} level - Geographic level
   */
  navigateTo(level) {
    if (!this.config.selectableLayers.includes(level)) {
      console.error(`Invalid level: ${level}`);
      return;
    }
    // Set current level
    this.setCurrentLevel(level);
    // Zoom to selected feature if available
    const feature = this.selectedFeatures[level];
    if (feature) {
      this.zoomToFeature(feature);
    }
  }
  /**
   * Reset selection and navigation
   */
  reset() {
    // Clear selections
    this.config.selectableLayers.forEach(level => {
      this.selectedFeatures[level] = null;
      // Clear selection layer
      const sourceId = `${level}-selection-source`;
      const source = this.mapEngine.map.getSource(sourceId);
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
    });
    // Reset to top level
    this.setCurrentLevel(this.config.selectableLayers[0]);
    // Reset zoom
    this.mapEngine.map.easeTo({
      center: this.mapEngine.config.initialView.center,
      zoom: this.mapEngine.config.initialView.zoom,
      duration: this.config.animationDuration
    });
    // Update breadcrumbs
    this.updateBreadcrumbs();
  }
  /**
   * Register a callback for events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {string} Callback ID
   */
  on(event, callback) {
    const validEvents = ['selectionChange', 'levelChange'];
    if (!validEvents.includes(event)) {
      console.error(`Invalid event: ${event}`);
      return null;
    }
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return null;
    }
    // Generate callback ID
    const callbackId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Initialize event callbacks if needed
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Map());
    }
    // Add callback
    this.callbacks.get(event).set(callbackId, callback);
    return callbackId;
  }
  /**
   * Unregister a callback
   * @param {string} callbackId - Callback ID
   * @returns {boolean} Success status
   */
  off(callbackId) {
    for (const [event, callbacks] of this.callbacks.entries()) {
      if (callbacks.has(callbackId)) {
        callbacks.delete(callbackId);
        return true;
      }
    }
    return false;
  }
  /**
   * Notify selection change
   * @param {string} level - Geographic level
   * @param {Object} feature - Selected feature
   */
  notifySelectionChange(level, feature) {
    const callbacks = this.callbacks.get('selectionChange');
    if (!callbacks) return;
    for (const callback of callbacks.values()) {
      try {
        callback({
          level,
          feature,
          properties: feature.properties,
          id: feature.id || feature.properties.id
        });
      } catch (error) {
        console.error('Error in selection change callback:', error);
      }
    }
  }
  /**
   * Notify level change
   * @param {string} level - Geographic level
   */
  notifyLevelChange(level) {
    const callbacks = this.callbacks.get('levelChange');
    if (!callbacks) return;
    for (const callback of callbacks.values()) {
      try {
        callback({
          level,
          previousLevel: this.currentLevel,
          selectedFeature: this.selectedFeatures[level]
        });
      } catch (error) {
        console.error('Error in level change callback:', error);
      }
    }
  }
  /**
   * Get current selection state
   * @returns {Object} Selection state
   */
  getSelectionState() {
    return {
      currentLevel: this.currentLevel,
      selections: { ...this.selectedFeatures }
    };
  }
}
// Export to window
window.RegionSelector = RegionSelector;