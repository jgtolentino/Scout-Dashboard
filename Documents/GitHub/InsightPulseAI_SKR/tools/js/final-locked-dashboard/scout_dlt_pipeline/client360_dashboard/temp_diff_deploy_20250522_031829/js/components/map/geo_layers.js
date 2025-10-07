/**
 * Geographic Layers Component for Client360 Dashboard v2.4.0
 * Manages geographic data layers for the enhanced map visualization
 */

class GeoLayers {
  constructor(config = {}) {
    this.config = {
      layerTypes: ['regions', 'municipalities', 'barangays', 'stores', 'heatmap'],
      defaultVisibility: {
        regions: true,
        municipalities: false,
        barangays: false,
        stores: true,
        heatmap: false
      },
      layerZIndex: {
        regions: 1,
        municipalities: 2,
        barangays: 3,
        stores: 4,
        heatmap: 0
      },
      ...config
    };
    
    this.layers = new Map();
    this.mapEngine = null;
  }
  
  /**
   * Initialize layers with map engine
   * @param {Object} mapEngine - Map engine instance
   */
  initialize(mapEngine) {
    this.mapEngine = mapEngine;
    
    if (!this.mapEngine) {
      console.error('Map engine is required for layer management');
      return;
    }
    
    // Setup built-in layers
    this.setupDefaultLayers();
  }
  
  /**
   * Setup default geographic layers
   */
  setupDefaultLayers() {
    if (!this.mapEngine) return;
    
    // Register region layer
    this.registerLayer({
      id: 'regions',
      name: 'Regions',
      type: 'fill',
      source: {
        type: 'geojson',
        data: '/data/regions.geojson'
      },
      visible: this.config.defaultVisibility.regions,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#f7fbff',
          20000, '#c7dcef',
          40000, '#72b2d7',
          60000, '#2878b8',
          80000, '#08519c',
          100000, '#08306b'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      },
      legendItems: [
        {
          type: 'gradient',
          colors: ['#f7fbff', '#08306b'],
          min: '0',
          max: '100K+'
        }
      ]
    });
    
    // Register municipality layer
    this.registerLayer({
      id: 'municipalities',
      name: 'Municipalities',
      type: 'fill',
      source: {
        type: 'geojson',
        data: '/data/municipalities.geojson'
      },
      visible: this.config.defaultVisibility.municipalities,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#f7fbff',
          10000, '#c7dcef',
          20000, '#72b2d7',
          30000, '#2878b8',
          40000, '#08519c',
          50000, '#08306b'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      },
      legendItems: [
        {
          type: 'gradient',
          colors: ['#f7fbff', '#08306b'],
          min: '0',
          max: '50K+'
        }
      ]
    });
    
    // Register barangay layer
    this.registerLayer({
      id: 'barangays',
      name: 'Barangays',
      type: 'fill',
      source: {
        type: 'geojson',
        data: '/data/barangays.geojson'
      },
      visible: this.config.defaultVisibility.barangays,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, '#f7fbff',
          5000, '#c7dcef',
          10000, '#72b2d7',
          15000, '#2878b8',
          20000, '#08519c',
          25000, '#08306b'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#000000'
      },
      minZoom: 10,
      legendItems: [
        {
          type: 'gradient',
          colors: ['#f7fbff', '#08306b'],
          min: '0',
          max: '25K+'
        }
      ]
    });
    
    // Register store markers layer
    this.registerLayer({
      id: 'stores',
      name: 'Store Locations',
      type: 'circle',
      source: {
        type: 'geojson',
        data: '/data/stores.geojson'
      },
      visible: this.config.defaultVisibility.stores,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 3,
          16, 8
        ],
        'circle-color': '#1e88e5',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      },
      legendItems: [
        {
          type: 'color',
          color: '#1e88e5',
          label: 'Store Location'
        }
      ]
    });
    
    // Register heatmap layer
    this.registerLayer({
      id: 'heatmap',
      name: 'Sales Heatmap',
      type: 'heatmap',
      source: {
        type: 'geojson',
        data: '/data/stores.geojson'
      },
      visible: this.config.defaultVisibility.heatmap,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 0,
          100000, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0, 0, 255, 0)',
          0.2, 'rgba(0, 255, 255, 0.5)',
          0.4, 'rgba(0, 255, 0, 0.5)',
          0.6, 'rgba(255, 255, 0, 0.5)',
          0.8, 'rgba(255, 0, 0, 0.5)',
          1, 'rgba(255, 0, 0, 0.8)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        'heatmap-opacity': 0.7
      },
      legendItems: [
        {
          type: 'gradient',
          colors: ['#9ecae1', '#2171b5', '#08306b'],
          min: 'Low',
          max: 'High'
        }
      ]
    });
  }
  
  /**
   * Register a new layer
   * @param {Object} layerConfig - Layer configuration
   * @returns {boolean} Success status
   */
  registerLayer(layerConfig) {
    if (!layerConfig.id) {
      console.error('Layer ID is required');
      return false;
    }
    
    if (this.layers.has(layerConfig.id)) {
      console.warn(`Layer '${layerConfig.id}' already exists. Use updateLayer instead.`);
      return false;
    }
    
    // Add to internal registry
    this.layers.set(layerConfig.id, {
      ...layerConfig,
      added: false
    });
    
    // Add to map if the map engine is ready
    if (this.mapEngine && this.mapEngine.isMapLoaded) {
      this.addLayerToMap(layerConfig.id);
    }
    
    return true;
  }
  
  /**
   * Add layer to map
   * @param {string} layerId - Layer ID
   * @returns {boolean} Success status
   */
  addLayerToMap(layerId) {
    if (!this.mapEngine) return false;
    
    const layer = this.layers.get(layerId);
    if (!layer) return false;
    
    // Skip if already added
    if (layer.added) return true;
    
    try {
      // Add the source if needed
      if (layer.source && !this.mapEngine.map.getSource(layerId)) {
        this.mapEngine.map.addSource(layerId, layer.source);
      }
      
      // Construct layer definition
      const layerDef = {
        id: layerId,
        type: layer.type,
        source: layer.source ? layerId : layer.sourceId,
        paint: layer.paint || {},
        layout: {
          visibility: layer.visible ? 'visible' : 'none',
          ...(layer.layout || {})
        }
      };
      
      // Add filter if specified
      if (layer.filter) {
        layerDef.filter = layer.filter;
      }
      
      // Add min/max zoom if specified
      if (layer.minZoom !== undefined) {
        layerDef.minzoom = layer.minZoom;
      }
      
      if (layer.maxZoom !== undefined) {
        layerDef.maxzoom = layer.maxZoom;
      }
      
      // Add layer to map
      this.mapEngine.map.addLayer(layerDef);
      
      // Update state
      layer.added = true;
      this.layers.set(layerId, layer);
      
      return true;
    } catch (error) {
      console.error(`Failed to add layer ${layerId} to map:`, error);
      return false;
    }
  }
  
  /**
   * Add all registered layers to map
   */
  addAllLayers() {
    for (const layerId of this.layers.keys()) {
      this.addLayerToMap(layerId);
    }
  }
  
  /**
   * Set layer visibility
   * @param {string} layerId - Layer ID
   * @param {boolean} visible - Visibility state
   * @returns {boolean} Success status
   */
  setLayerVisibility(layerId, visible) {
    if (!this.mapEngine) return false;
    
    const layer = this.layers.get(layerId);
    if (!layer) return false;
    
    try {
      // Update map layer
      if (this.mapEngine.map.getLayer(layerId)) {
        this.mapEngine.map.setLayoutProperty(
          layerId, 
          'visibility', 
          visible ? 'visible' : 'none'
        );
      }
      
      // Update state
      layer.visible = visible;
      this.layers.set(layerId, layer);
      
      return true;
    } catch (error) {
      console.error(`Failed to set visibility for layer ${layerId}:`, error);
      return false;
    }
  }
  
  /**
   * Update layer style
   * @param {string} layerId - Layer ID
   * @param {string} property - Style property
   * @param {*} value - Style value
   * @returns {boolean} Success status
   */
  updateLayerStyle(layerId, property, value) {
    if (!this.mapEngine) return false;
    
    try {
      if (this.mapEngine.map.getLayer(layerId)) {
        if (property.startsWith('layout-')) {
          const layoutProp = property.substring(7);
          this.mapEngine.map.setLayoutProperty(layerId, layoutProp, value);
        } else {
          this.mapEngine.map.setPaintProperty(layerId, property, value);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to update style for layer ${layerId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all registered layers
   * @returns {Array<Object>} Layers
   */
  getAllLayers() {
    return Array.from(this.layers.values());
  }
  
  /**
   * Get layer by ID
   * @param {string} layerId - Layer ID
   * @returns {Object|null} Layer object
   */
  getLayer(layerId) {
    return this.layers.get(layerId) || null;
  }
  
  /**
   * Check if a layer exists
   * @param {string} layerId - Layer ID
   * @returns {boolean} True if layer exists
   */
  hasLayer(layerId) {
    return this.layers.has(layerId);
  }
  
  /**
   * Remove a layer
   * @param {string} layerId - Layer ID
   * @returns {boolean} Success status
   */
  removeLayer(layerId) {
    if (!this.mapEngine) return false;
    
    try {
      // Remove from map
      if (this.mapEngine.map.getLayer(layerId)) {
        this.mapEngine.map.removeLayer(layerId);
      }
      
      // Remove source if it exists
      if (this.mapEngine.map.getSource(layerId)) {
        this.mapEngine.map.removeSource(layerId);
      }
      
      // Remove from registry
      this.layers.delete(layerId);
      
      return true;
    } catch (error) {
      console.error(`Failed to remove layer ${layerId}:`, error);
      return false;
    }
  }
  
  /**
   * Update layer data
   * @param {string} layerId - Layer ID
   * @param {Object} data - GeoJSON data
   * @returns {boolean} Success status
   */
  updateLayerData(layerId, data) {
    if (!this.mapEngine) return false;
    
    try {
      const source = this.mapEngine.map.getSource(layerId);
      if (source && typeof source.setData === 'function') {
        source.setData(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to update data for layer ${layerId}:`, error);
      return false;
    }
  }
  
  /**
   * Sort layers by z-index
   */
  sortLayers() {
    if (!this.mapEngine) return;
    
    // Get all layers
    const allLayers = this.getAllLayers()
      .filter(l => l.added)
      .sort((a, b) => {
        const zIndexA = this.config.layerZIndex[a.id] || 0;
        const zIndexB = this.config.layerZIndex[b.id] || 0;
        return zIndexA - zIndexB;
      });
    
    // Rearrange layers
    for (const layer of allLayers) {
      if (this.mapEngine.map.getLayer(layer.id)) {
        this.mapEngine.map.moveLayer(layer.id);
      }
    }
  }
}

// Export to window
window.GeoLayers = GeoLayers;