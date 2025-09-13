/**
 * Heat Visualization Component for Client360 Dashboard v2.4.0
 * Provides advanced heatmap visualizations for geographic data
 */

class HeatVisualization {
  constructor(config = {}) {
    this.config = {
      mapEngine: null,
      heatmapId: 'heat-layer',
      dataSource: null,
      radius: {
        base: 15,
        zoomScale: [
          [6, 10],
          [10, 15],
          [14, 25]
        ]
      },
      intensity: {
        base: 1,
        zoomScale: [
          [6, 0.5],
          [10, 1],
          [14, 2]
        ]
      },
      opacity: 0.8,
      colorGradient: [
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
      weightProperty: 'value',
      weightScale: [0, 100000],
      visible: true,
      ...config
    };
    
    this.mapEngine = this.config.mapEngine;
    this.isHeatmapActive = this.config.visible;
    this.data = null;
    
    // Initialize if map engine is provided
    if (this.mapEngine) {
      this.initialize();
    }
  }
  
  /**
   * Initialize heat visualization
   * @param {Object} mapEngine - Map engine instance
   */
  initialize(mapEngine = null) {
    if (mapEngine) {
      this.mapEngine = mapEngine;
    }
    
    if (!this.mapEngine) {
      console.error('Map engine is required for heat visualization');
      return;
    }
    
    // Wait for map to be loaded
    if (!this.mapEngine.isMapLoaded) {
      this.mapEngine.on('mapLoaded', () => {
        this.initialize();
      });
      return;
    }
    
    // Create heatmap layer
    this.createHeatmapLayer();
  }
  
  /**
   * Create heatmap layer
   */
  createHeatmapLayer() {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    // Check if data source exists
    if (this.config.dataSource) {
      // Use existing source
      if (!this.mapEngine.map.getSource(this.config.dataSource)) {
        console.error(`Data source '${this.config.dataSource}' not found`);
        return;
      }
    } else {
      // Create a new source
      const sourceId = `${this.config.heatmapId}-source`;
      
      this.mapEngine.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });
      
      this.config.dataSource = sourceId;
    }
    
    // Create heatmap layer
    this.mapEngine.map.addLayer({
      id: this.config.heatmapId,
      type: 'heatmap',
      source: this.config.dataSource,
      layout: {
        visibility: this.isHeatmapActive ? 'visible' : 'none'
      },
      paint: this.generateHeatmapPaint()
    });
  }
  
  /**
   * Generate heatmap paint configuration
   * @returns {Object} Paint configuration
   */
  generateHeatmapPaint() {
    return {
      // Weight based on property value
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', this.config.weightProperty],
        this.config.weightScale[0], 0,
        this.config.weightScale[1], 1
      ],
      
      // Intensity increases with zoom level
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        ...this.config.intensity.zoomScale.flat()
      ],
      
      // Heatmap color gradient
      'heatmap-color': this.config.colorGradient,
      
      // Radius increases with zoom level
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        ...this.config.radius.zoomScale.flat()
      ],
      
      // Opacity setting
      'heatmap-opacity': this.config.opacity
    };
  }
  
  /**
   * Set heatmap data
   * @param {Object|Array} data - GeoJSON data or features array
   */
  setData(data) {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    this.data = data;
    
    // Get source
    const source = this.mapEngine.map.getSource(this.config.dataSource);
    if (!source) return;
    
    // Convert data to GeoJSON if needed
    let geoJson;
    
    if (Array.isArray(data)) {
      // Convert array to GeoJSON
      geoJson = {
        type: 'FeatureCollection',
        features: data.map(item => {
          // Check if item is already a GeoJSON feature
          if (item.type === 'Feature') {
            return item;
          }
          
          // Create feature from item
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [item.longitude || item.lon, item.latitude || item.lat]
            },
            properties: {
              ...item
            }
          };
        })
      };
    } else if (data && data.type === 'FeatureCollection') {
      // Already GeoJSON
      geoJson = data;
    } else {
      console.error('Invalid data format for heatmap');
      return;
    }
    
    // Update source data
    source.setData(geoJson);
  }
  
  /**
   * Set heatmap visibility
   * @param {boolean} visible - Visibility state
   */
  setVisibility(visible) {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    this.isHeatmapActive = visible;
    
    // Update layer visibility
    this.mapEngine.map.setLayoutProperty(
      this.config.heatmapId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
  
  /**
   * Toggle heatmap visibility
   * @returns {boolean} New visibility state
   */
  toggleVisibility() {
    this.setVisibility(!this.isHeatmapActive);
    return this.isHeatmapActive;
  }
  
  /**
   * Update heatmap style
   * @param {Object} styles - Style properties to update
   */
  updateStyle(styles) {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    // Update config
    if (styles.radius) this.config.radius = { ...this.config.radius, ...styles.radius };
    if (styles.intensity) this.config.intensity = { ...this.config.intensity, ...styles.intensity };
    if (styles.opacity !== undefined) this.config.opacity = styles.opacity;
    if (styles.colorGradient) this.config.colorGradient = styles.colorGradient;
    if (styles.weightProperty) this.config.weightProperty = styles.weightProperty;
    if (styles.weightScale) this.config.weightScale = styles.weightScale;
    
    // Generate new paint configuration
    const paint = this.generateHeatmapPaint();
    
    // Update paint properties
    Object.keys(paint).forEach(property => {
      this.mapEngine.map.setPaintProperty(
        this.config.heatmapId,
        property,
        paint[property]
      );
    });
  }
  
  /**
   * Set color gradient
   * @param {string|Array} gradient - Color gradient string or expression
   */
  setColorGradient(gradient) {
    if (!gradient) return;
    
    if (typeof gradient === 'string') {
      // Parse string gradient (format: "color1,color2,color3")
      const colors = gradient.split(',').map(c => c.trim());
      
      if (colors.length < 2) {
        console.error('Color gradient must have at least 2 colors');
        return;
      }
      
      // Generate expression
      const expression = ['interpolate', ['linear'], ['heatmap-density']];
      
      colors.forEach((color, index) => {
        const step = index / (colors.length - 1);
        expression.push(step, color);
      });
      
      this.updateStyle({ colorGradient: expression });
    } else {
      // Use provided expression
      this.updateStyle({ colorGradient: gradient });
    }
  }
  
  /**
   * Set weight property for heatmap intensity
   * @param {string} property - Data property to use for weights
   * @param {Array} scale - Min and max values [min, max]
   */
  setWeightProperty(property, scale = null) {
    const styles = {
      weightProperty: property
    };
    
    if (scale && Array.isArray(scale) && scale.length === 2) {
      styles.weightScale = scale;
    }
    
    this.updateStyle(styles);
  }
  
  /**
   * Create a preset configuration
   * @param {string} preset - Preset name: 'sales', 'density', 'growth', or 'custom'
   * @param {Object} customConfig - Custom configuration (for 'custom' preset)
   */
  applyPreset(preset, customConfig = {}) {
    switch (preset) {
      case 'sales':
        this.updateStyle({
          weightProperty: 'sales',
          weightScale: [0, 100000],
          colorGradient: [
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
          opacity: 0.8
        });
        break;
      
      case 'density':
        this.updateStyle({
          weightProperty: 'count',
          weightScale: [0, 50],
          colorGradient: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(65, 105, 225, 0)',
            0.2, 'rgba(65, 105, 225, 0.5)',
            0.4, 'rgba(75, 0, 130, 0.5)',
            0.6, 'rgba(128, 0, 128, 0.5)',
            0.8, 'rgba(139, 0, 139, 0.7)',
            1, 'rgba(220, 20, 60, 0.8)'
          ],
          opacity: 0.7
        });
        break;
      
      case 'growth':
        this.updateStyle({
          weightProperty: 'growth',
          weightScale: [-20, 20],
          colorGradient: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(178, 34, 34, 0)',
            0.3, 'rgba(178, 34, 34, 0.5)',
            0.5, 'rgba(255, 255, 0, 0.5)',
            0.7, 'rgba(50, 205, 50, 0.5)',
            1, 'rgba(0, 100, 0, 0.8)'
          ],
          opacity: 0.8
        });
        break;
      
      case 'custom':
        this.updateStyle(customConfig);
        break;
      
      default:
        console.error(`Unknown preset: ${preset}`);
    }
  }
  
  /**
   * Get current heatmap configuration
   * @returns {Object} Current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    // Remove layer
    if (this.mapEngine.map.getLayer(this.config.heatmapId)) {
      this.mapEngine.map.removeLayer(this.config.heatmapId);
    }
    
    // Remove source if we created it
    if (this.config.dataSource && this.config.dataSource.endsWith('-source')) {
      if (this.mapEngine.map.getSource(this.config.dataSource)) {
        this.mapEngine.map.removeSource(this.config.dataSource);
      }
    }
  }
}

// Export to window
window.HeatVisualization = HeatVisualization;