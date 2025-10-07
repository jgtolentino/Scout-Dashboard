/**
 * Map Engine Component for Client360 Dashboard v2.4.0
 * Advanced map management with multi-layer support and improved interactions
 * Core component of the Enhanced Map visualization system
 */

class MapEngine {
  constructor(config = {}) {
    this.config = {
      containerId: 'map-container',
      mapboxToken: window.config?.mapbox?.accessToken || 'pk.placeholder.token',
      mapStyle: 'mapbox://styles/mapbox/light-v11',
      fallbackEnabled: window.config?.mapbox?.fallbackEnabled || true,
      initialView: {
        center: [121.0, 14.6], // Manila, Philippines
        zoom: 6,
        minZoom: 5,
        maxZoom: 18
      },
      navigationControl: {
        position: 'top-right',
        showCompass: true
      },
      fullscreenControl: {
        position: 'top-right'
      },
      geolocateControl: {
        position: 'top-right',
        trackUserLocation: true
      },
      scaleControl: {
        position: 'bottom-left',
        maxWidth: 200,
        unit: 'metric'
      },
      layerPanel: {
        position: 'top-left',
        collapsible: true,
        defaultCollapsed: false
      },
      dataAttribution: 'Client360 Map Data',
      enablePrint: true,
      enableSharing: true,
      enableCaching: true,
      cacheLifetime: 3600, // 1 hour in seconds
      preserveDrawingBuffer: true, // Required for map screenshots
      useDevicePixelRatio: true, // High DPI support
      ...config
    };
    
    // Core state properties
    this.map = null;
    this.isMapLoaded = false;
    this.isStyleLoaded = false;
    this.layers = new Map();
    this.sources = new Map();
    this.controls = new Map();
    this.eventHandlers = new Map();
    this.activePopups = new Map();
    this.legendItems = new Map();
    this.dataCache = new Map();
    this.pendingTasks = [];
    
    // Initialize if containerId is provided immediately
    if (this.config.containerId) {
      this.init();
    }
  }
  
  /**
   * Initialize the map engine
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('🗺️ Initializing Map Engine v2.4.0');
      
      // Make sure container exists
      this.container = document.getElementById(this.config.containerId);
      if (!this.container) {
        throw new Error(`Map container not found: ${this.config.containerId}`);
      }
      
      // Check if we have a valid Mapbox token
      if (!this.config.mapboxToken || this.config.mapboxToken.includes('placeholder')) {
        console.warn('⚠️ Mapbox token not configured, showing fallback map');
        this.showMapFallback();
        return;
      }
      
      // Show loading state
      this.showLoading();
      
      // Load Mapbox dependencies
      await this.loadMapboxDependencies();
      
      // Create map instance
      this.createMapInstance();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Create UI controls
      await this.createControls();
      
      // Create layer panel
      this.createLayerPanel();
      
      console.log('✅ Map Engine initialized');
    } catch (error) {
      console.error('Failed to initialize Map Engine:', error);
      this.showError('Failed to initialize map. Please refresh the page or try again later.');
    }
  }
  
  /**
   * Load Mapbox dependencies if not already loaded
   * @returns {Promise<void>}
   */
  async loadMapboxDependencies() {
    return new Promise((resolve, reject) => {
      // Check if Mapbox is already loaded
      if (window.mapboxgl) {
        resolve();
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
      script.onload = () => {
        // Load CSS after script is loaded
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
        link.onload = resolve;
        link.onerror = () => reject(new Error('Failed to load Mapbox CSS'));
        document.head.appendChild(link);
      };
      script.onerror = () => reject(new Error('Failed to load Mapbox script'));
      
      // Add to document
      document.head.appendChild(script);
    });
  }
  
  /**
   * Create the map instance
   */
  createMapInstance() {
    // Set access token
    mapboxgl.accessToken = this.config.mapboxToken;
    
    // Create map
    this.map = new mapboxgl.Map({
      container: this.config.containerId,
      style: this.config.mapStyle,
      center: this.config.initialView.center,
      zoom: this.config.initialView.zoom,
      minZoom: this.config.initialView.minZoom,
      maxZoom: this.config.initialView.maxZoom,
      attributionControl: false, // We'll add a custom one
      preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      antialias: true,
      crossSourceCollisions: true,
      trackResize: true,
      pitchWithRotate: true,
      dragRotate: true,
      fadeDuration: 300,
      locale: {
        'NavigationControl.ZoomIn': 'Zoom in',
        'NavigationControl.ZoomOut': 'Zoom out',
        'NavigationControl.ResetBearing': 'Reset bearing to north',
      }
    });
    
    // Set event handlers for map loading
    this.map.on('load', () => {
      this.isMapLoaded = true;
      this.hideLoading();
      this.executePendingTasks();
      this.dispatchEvent('mapLoaded');
    });
    
    this.map.on('style.load', () => {
      this.isStyleLoaded = true;
      this.dispatchEvent('styleLoaded');
    });
    
    this.map.on('error', (e) => {
      console.error('Map error:', e.error);
      this.dispatchEvent('mapError', e.error);
    });
  }
  
  /**
   * Set up map event handlers
   */
  setupEventHandlers() {
    // Core map events
    const coreEvents = [
      'move', 'moveend', 'zoom', 'zoomend', 'rotate', 'rotateend',
      'drag', 'dragend', 'click', 'dblclick', 'mousemove', 'mouseenter',
      'mouseleave', 'mouseout', 'contextmenu', 'dataloading', 'data',
      'render', 'resize'
    ];
    
    coreEvents.forEach(eventName => {
      this.map.on(eventName, (e) => {
        this.dispatchEvent(eventName, e);
      });
    });
  }
  
  /**
   * Create map controls
   */
  async createControls() {
    // Add navigation control (zoom buttons)
    if (this.config.navigationControl) {
      const nav = new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: this.config.navigationControl.showCompass
      });
      this.map.addControl(nav, this.config.navigationControl.position);
      this.controls.set('navigation', nav);
    }
    
    // Add fullscreen control
    if (this.config.fullscreenControl) {
      const fullscreen = new mapboxgl.FullscreenControl();
      this.map.addControl(fullscreen, this.config.fullscreenControl.position);
      this.controls.set('fullscreen', fullscreen);
    }
    
    // Add geolocate control
    if (this.config.geolocateControl) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: this.config.geolocateControl.trackUserLocation,
        showUserHeading: true
      });
      this.map.addControl(geolocate, this.config.geolocateControl.position);
      this.controls.set('geolocate', geolocate);
    }
    
    // Add scale control
    if (this.config.scaleControl) {
      const scale = new mapboxgl.ScaleControl({
        maxWidth: this.config.scaleControl.maxWidth,
        unit: this.config.scaleControl.unit
      });
      this.map.addControl(scale, this.config.scaleControl.position);
      this.controls.set('scale', scale);
    }
    
    // Add attribution control
    const attribution = new mapboxgl.AttributionControl({
      customAttribution: this.config.dataAttribution,
      compact: true
    });
    this.map.addControl(attribution, 'bottom-right');
    this.controls.set('attribution', attribution);
    
    // Add custom controls
    await this.addCustomControls();
  }
  
  /**
   * Add custom map controls
   */
  async addCustomControls() {
    // Add print control if enabled
    if (this.config.enablePrint) {
      this.addPrintControl();
    }
    
    // Add sharing control if enabled
    if (this.config.enableSharing) {
      this.addSharingControl();
    }
    
    // Could add more custom controls here
  }
  
  /**
   * Add map print control
   */
  addPrintControl() {
    const printControl = document.createElement('div');
    printControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group custom-map-control';
    printControl.innerHTML = `
      <button class="map-print-button" title="Print map">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
      </button>
    `;
    
    // Add event listener
    printControl.querySelector('.map-print-button').addEventListener('click', () => {
      this.printMap();
    });
    
    // Add to map
    this.map.getContainer().appendChild(printControl);
    this.controls.set('print', printControl);
  }
  
  /**
   * Add map sharing control
   */
  addSharingControl() {
    const shareControl = document.createElement('div');
    shareControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group custom-map-control';
    shareControl.innerHTML = `
      <button class="map-share-button" title="Share map">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    `;
    
    // Add event listener
    shareControl.querySelector('.map-share-button').addEventListener('click', () => {
      this.shareMap();
    });
    
    // Add to map
    this.map.getContainer().appendChild(shareControl);
    this.controls.set('share', shareControl);
  }
  
  /**
   * Create layer control panel
   */
  createLayerPanel() {
    // Create panel container
    const panel = document.createElement('div');
    panel.className = `map-layer-panel ${this.config.layerPanel.defaultCollapsed ? 'collapsed' : ''}`;
    panel.style.position = 'absolute';
    
    // Set position based on config
    switch (this.config.layerPanel.position) {
      case 'top-left':
        panel.style.top = '10px';
        panel.style.left = '10px';
        break;
      case 'top-right':
        panel.style.top = '10px';
        panel.style.right = '10px';
        break;
      case 'bottom-left':
        panel.style.bottom = '30px';
        panel.style.left = '10px';
        break;
      case 'bottom-right':
        panel.style.bottom = '30px';
        panel.style.right = '10px';
        break;
      default:
        panel.style.top = '10px';
        panel.style.left = '10px';
    }
    
    // Create panel content
    panel.innerHTML = `
      <div class="panel-header">
        <h3>Map Layers</h3>
        ${this.config.layerPanel.collapsible ? '<button class="panel-toggle" title="Toggle layer panel">▼</button>' : ''}
      </div>
      <div class="panel-content">
        <div class="layer-list"></div>
        <div class="panel-footer">
          <button class="reset-view-btn">Reset View</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    if (this.config.layerPanel.collapsible) {
      panel.querySelector('.panel-toggle').addEventListener('click', () => {
        panel.classList.toggle('collapsed');
      });
    }
    
    panel.querySelector('.reset-view-btn').addEventListener('click', () => {
      this.resetView();
    });
    
    // Add to map container
    this.map.getContainer().appendChild(panel);
    this.controls.set('layerPanel', panel);
  }
  
  /**
   * Add a new map layer
   * @param {Object} layerConfig - Layer configuration
   * @returns {Promise<boolean>} Success status
   */
  async addLayer(layerConfig) {
    if (!layerConfig.id) {
      console.error('Layer must have an id');
      return false;
    }
    
    try {
      // Wait for map to be loaded
      if (!this.isMapLoaded) {
        return new Promise(resolve => {
          this.pendingTasks.push(async () => {
            const result = await this.addLayer(layerConfig);
            resolve(result);
          });
        });
      }
      
      // Check if source needs to be added
      if (layerConfig.source && typeof layerConfig.source === 'object' && !this.map.getSource(layerConfig.id)) {
        const sourceConfig = {
          id: layerConfig.source.id || `${layerConfig.id}-source`,
          type: layerConfig.source.type || 'geojson',
          data: layerConfig.source.data || { type: 'FeatureCollection', features: [] }
        };
        
        // Add source
        await this.addSource(sourceConfig);
        
        // Update layer config to use source ID
        layerConfig.source = sourceConfig.id;
      }
      
      // Add layer to map
      this.map.addLayer(layerConfig);
      
      // Store layer config
      this.layers.set(layerConfig.id, {
        ...layerConfig,
        visible: true,
        legendItems: layerConfig.legendItems || []
      });
      
      // Add to layer panel
      this.addLayerToPanel(layerConfig);
      
      // Add event handlers for layer
      this.addLayerEventHandlers(layerConfig.id);
      
      return true;
    } catch (error) {
      console.error(`Failed to add layer ${layerConfig.id}:`, error);
      return false;
    }
  }
  
  /**
   * Add a GeoJSON data source
   * @param {Object} sourceConfig - Source configuration
   * @returns {Promise<boolean>} Success status
   */
  async addSource(sourceConfig) {
    if (!sourceConfig.id) {
      console.error('Source must have an id');
      return false;
    }
    
    try {
      // Wait for map to be loaded
      if (!this.isMapLoaded) {
        return new Promise(resolve => {
          this.pendingTasks.push(async () => {
            const result = await this.addSource(sourceConfig);
            resolve(result);
          });
        });
      }
      
      // Check if source already exists
      if (this.map.getSource(sourceConfig.id)) {
        console.warn(`Source ${sourceConfig.id} already exists. Use updateSource instead.`);
        return false;
      }
      
      // If data is a URL, fetch it
      if (sourceConfig.type === 'geojson' && typeof sourceConfig.data === 'string' && sourceConfig.data.startsWith('http')) {
        const data = await this.fetchGeoJSON(sourceConfig.data);
        sourceConfig.data = data;
      }
      
      // Add source to map
      this.map.addSource(sourceConfig.id, {
        type: sourceConfig.type,
        data: sourceConfig.data,
        ...sourceConfig.options
      });
      
      // Store source config
      this.sources.set(sourceConfig.id, sourceConfig);
      
      return true;
    } catch (error) {
      console.error(`Failed to add source ${sourceConfig.id}:`, error);
      return false;
    }
  }
  
  /**
   * Update a GeoJSON data source
   * @param {string} sourceId - Source ID
   * @param {Object|string} data - GeoJSON data or URL
   * @returns {Promise<boolean>} Success status
   */
  async updateSource(sourceId, data) {
    try {
      // Wait for map to be loaded
      if (!this.isMapLoaded) {
        return new Promise(resolve => {
          this.pendingTasks.push(async () => {
            const result = await this.updateSource(sourceId, data);
            resolve(result);
          });
        });
      }
      
      // Get source
      const source = this.map.getSource(sourceId);
      if (!source) {
        console.error(`Source ${sourceId} not found`);
        return false;
      }
      
      // If data is a URL, fetch it
      if (typeof data === 'string' && data.startsWith('http')) {
        data = await this.fetchGeoJSON(data);
      }
      
      // Update source data
      source.setData(data);
      
      // Update source config
      if (this.sources.has(sourceId)) {
        const sourceConfig = this.sources.get(sourceId);
        sourceConfig.data = data;
        this.sources.set(sourceId, sourceConfig);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to update source ${sourceId}:`, error);
      return false;
    }
  }
  
  /**
   * Add layer to the control panel
   * @param {Object} layerConfig - Layer configuration
   */
  addLayerToPanel(layerConfig) {
    const panel = this.controls.get('layerPanel');
    if (!panel) return;
    
    const layerList = panel.querySelector('.layer-list');
    if (!layerList) return;
    
    // Create layer item
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.dataset.layerId = layerConfig.id;
    
    // Create layer item content
    layerItem.innerHTML = `
      <div class="layer-header">
        <input type="checkbox" id="layer-${layerConfig.id}" class="layer-toggle" ${layerConfig.visible !== false ? 'checked' : ''}>
        <label for="layer-${layerConfig.id}">${layerConfig.name || layerConfig.id}</label>
        <button class="layer-info-btn" title="Layer info">ℹ️</button>
      </div>
      <div class="layer-legends"></div>
    `;
    
    // Add event listeners
    const checkbox = layerItem.querySelector('.layer-toggle');
    checkbox.addEventListener('change', (e) => {
      this.setLayerVisibility(layerConfig.id, e.target.checked);
    });
    
    const infoBtn = layerItem.querySelector('.layer-info-btn');
    infoBtn.addEventListener('click', () => {
      this.showLayerInfo(layerConfig.id);
    });
    
    // Add legends if available
    if (layerConfig.legendItems && layerConfig.legendItems.length > 0) {
      this.addLegendsToLayer(layerConfig.id, layerConfig.legendItems, layerItem);
    }
    
    // Add to panel
    layerList.appendChild(layerItem);
  }
  
  /**
   * Add legends to layer item
   * @param {string} layerId - Layer ID
   * @param {Array<Object>} legends - Legend items
   * @param {HTMLElement} layerItem - Layer item element
   */
  addLegendsToLayer(layerId, legends, layerItem) {
    const legendsContainer = layerItem.querySelector('.layer-legends');
    if (!legendsContainer) return;
    
    legends.forEach(legend => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      
      switch (legend.type) {
        case 'color':
          legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${legend.color};"></div>
            <div class="legend-label">${legend.label}</div>
          `;
          break;
          
        case 'gradient':
          legendItem.innerHTML = `
            <div class="legend-gradient" style="background: linear-gradient(to right, ${legend.colors.join(', ')});"></div>
            <div class="legend-labels">
              <span>${legend.min || ''}</span>
              <span>${legend.max || ''}</span>
            </div>
          `;
          break;
          
        case 'size':
          legendItem.innerHTML = `
            <div class="legend-sizes">
              ${legend.sizes.map(size => `<div class="legend-circle" style="width: ${size.size}px; height: ${size.size}px;"></div>`).join('')}
            </div>
            <div class="legend-labels">
              <span>${legend.min || ''}</span>
              <span>${legend.max || ''}</span>
            </div>
          `;
          break;
          
        case 'icon':
          legendItem.innerHTML = `
            <div class="legend-icon"><img src="${legend.icon}" alt="${legend.label}"></div>
            <div class="legend-label">${legend.label}</div>
          `;
          break;
          
        default:
          legendItem.innerHTML = `<div class="legend-label">${legend.label}</div>`;
      }
      
      legendsContainer.appendChild(legendItem);
    });
    
    // Store legends
    this.legendItems.set(layerId, legends);
  }
  
  /**
   * Add event handlers for a layer
   * @param {string} layerId - Layer ID
   */
  addLayerEventHandlers(layerId) {
    // Mouse enter event
    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    
    // Mouse leave event
    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });
    
    // Click event
    this.map.on('click', layerId, (e) => {
      if (e.features && e.features.length > 0) {
        this.handleFeatureClick(layerId, e.features[0], e.lngLat);
      }
    });
  }
  
  /**
   * Handle feature click
   * @param {string} layerId - Layer ID
   * @param {Object} feature - Feature object
   * @param {Object} lngLat - Click coordinates
   */
  handleFeatureClick(layerId, feature, lngLat) {
    // Get layer config
    const layerConfig = this.layers.get(layerId);
    if (!layerConfig) return;
    
    // Show popup if configured
    if (layerConfig.popup) {
      this.showFeaturePopup(layerId, feature, lngLat, layerConfig.popup);
    }
    
    // Dispatch event
    this.dispatchEvent('featureClick', {
      layerId,
      feature,
      lngLat
    });
  }
  
  /**
   * Show popup for a feature
   * @param {string} layerId - Layer ID
   * @param {Object} feature - Feature object
   * @param {Object} lngLat - Click coordinates
   * @param {Object} popupConfig - Popup configuration
   */
  showFeaturePopup(layerId, feature, lngLat, popupConfig) {
    // Close existing popup for this layer
    if (this.activePopups.has(layerId)) {
      this.activePopups.get(layerId).remove();
    }
    
    // Create popup
    const popup = new mapboxgl.Popup({
      closeButton: popupConfig.closeButton !== false,
      closeOnClick: popupConfig.closeOnClick !== false,
      anchor: popupConfig.anchor || 'bottom',
      offset: popupConfig.offset || [0, 0],
      className: `map-popup ${popupConfig.className || ''}`
    });
    
    // Generate popup content
    let content;
    if (typeof popupConfig.template === 'function') {
      content = popupConfig.template(feature);
    } else if (typeof popupConfig.template === 'string') {
      content = this.formatTemplate(popupConfig.template, feature.properties);
    } else {
      // Default content
      content = this.generateDefaultPopupContent(feature);
    }
    
    // Set popup content
    popup.setLngLat(lngLat)
      .setHTML(content)
      .addTo(this.map);
    
    // Store active popup
    this.activePopups.set(layerId, popup);
    
    // Add popup close event
    popup.on('close', () => {
      this.activePopups.delete(layerId);
    });
  }
  
  /**
   * Generate default popup content
   * @param {Object} feature - Feature object
   * @returns {string} HTML content
   */
  generateDefaultPopupContent(feature) {
    const props = feature.properties || {};
    
    // Start with a name/title if available
    let content = '<div class="popup-content">';
    
    if (props.name || props.title) {
      content += `<h3 class="popup-title">${props.name || props.title}</h3>`;
    } else if (props.id) {
      content += `<h3 class="popup-title">ID: ${props.id}</h3>`;
    }
    
    // Add properties table
    content += '<table class="popup-properties">';
    
    for (const [key, value] of Object.entries(props)) {
      // Skip some common properties that are likely used in the title
      if (['id', 'name', 'title'].includes(key)) continue;
      
      // Format the value
      let formattedValue = value;
      
      // Format numbers
      if (typeof value === 'number') {
        if (key.toLowerCase().includes('sales') || 
            key.toLowerCase().includes('revenue') || 
            key.toLowerCase().includes('amount')) {
          formattedValue = `₱${value.toLocaleString()}`;
        } else {
          formattedValue = value.toLocaleString();
        }
      }
      
      // Add to table
      content += `
        <tr>
          <th>${this.formatPropertyName(key)}</th>
          <td>${formattedValue}</td>
        </tr>
      `;
    }
    
    content += '</table>';
    content += '</div>';
    
    return content;
  }
  
  /**
   * Format property name for display
   * @param {string} name - Property name
   * @returns {string} Formatted name
   */
  formatPropertyName(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Format template string with properties
   * @param {string} template - Template string
   * @param {Object} properties - Properties object
   * @returns {string} Formatted string
   */
  formatTemplate(template, properties) {
    return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = properties;
      
      for (const k of keys) {
        value = value[k];
        if (value === undefined) return '';
      }
      
      return value;
    });
  }
  
  /**
   * Set layer visibility
   * @param {string} layerId - Layer ID
   * @param {boolean} visible - Visibility state
   */
  setLayerVisibility(layerId, visible) {
    try {
      // Update map layer
      if (visible) {
        this.map.setLayoutProperty(layerId, 'visibility', 'visible');
      } else {
        this.map.setLayoutProperty(layerId, 'visibility', 'none');
      }
      
      // Update layer config
      if (this.layers.has(layerId)) {
        const layerConfig = this.layers.get(layerId);
        layerConfig.visible = visible;
        this.layers.set(layerId, layerConfig);
      }
      
      // Update UI
      const layerItem = document.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
      if (layerItem) {
        const checkbox = layerItem.querySelector('.layer-toggle');
        if (checkbox) {
          checkbox.checked = visible;
        }
      }
      
      // Dispatch event
      this.dispatchEvent('layerVisibilityChange', {
        layerId,
        visible
      });
    } catch (error) {
      console.error(`Failed to set visibility for layer ${layerId}:`, error);
    }
  }
  
  /**
   * Show layer information dialog
   * @param {string} layerId - Layer ID
   */
  showLayerInfo(layerId) {
    // Get layer config
    const layerConfig = this.layers.get(layerId);
    if (!layerConfig) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
      <div class="map-modal-content">
        <div class="map-modal-header">
          <h2>${layerConfig.name || layerId}</h2>
          <button class="map-modal-close">&times;</button>
        </div>
        <div class="map-modal-body">
          <p>${layerConfig.description || 'No description available.'}</p>
          
          <h3>Layer Properties</h3>
          <table class="layer-properties">
            <tr>
              <th>ID:</th>
              <td>${layerId}</td>
            </tr>
            <tr>
              <th>Type:</th>
              <td>${layerConfig.type}</td>
            </tr>
            <tr>
              <th>Source:</th>
              <td>${layerConfig.source}</td>
            </tr>
          </table>
          
          ${layerConfig.legendItems && layerConfig.legendItems.length > 0 ? `
            <h3>Legend</h3>
            <div class="layer-legend-container"></div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('.map-modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Add to document
    document.body.appendChild(modal);
    
    // Add legends if available
    if (layerConfig.legendItems && layerConfig.legendItems.length > 0) {
      const legendContainer = modal.querySelector('.layer-legend-container');
      if (legendContainer) {
        this.addLegendsToLayer(layerId, layerConfig.legendItems, modal);
      }
    }
  }
  
  /**
   * Reset map view to initial state
   */
  resetView() {
    this.map.easeTo({
      center: this.config.initialView.center,
      zoom: this.config.initialView.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1000
    });
  }
  
  /**
   * Print map
   */
  printMap() {
    // Create a temporary image from the map
    const mapImage = this.map.getCanvas().toDataURL('image/png');
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Map Print</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .print-header {
            margin-bottom: 20px;
          }
          .map-container {
            max-width: 100%;
            page-break-inside: avoid;
          }
          .map-image {
            width: 100%;
            height: auto;
            border: 1px solid #ccc;
          }
          .print-footer {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Map Export</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <button onclick="window.print()">Print</button>
        </div>
        
        <div class="map-container">
          <img class="map-image" src="${mapImage}" alt="Map Export">
        </div>
        
        <div class="print-footer">
          <p>Source: Client360 Dashboard</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }
  
  /**
   * Share map
   */
  shareMap() {
    // Get current map state
    const state = {
      center: this.map.getCenter(),
      zoom: this.map.getZoom(),
      pitch: this.map.getPitch(),
      bearing: this.map.getBearing(),
      layers: {}
    };
    
    // Get visible layers
    this.layers.forEach((layer, id) => {
      state.layers[id] = layer.visible;
    });
    
    // Encode state as URL parameters
    const stateStr = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?map=${stateStr}`;
    
    // Create share dialog
    const modal = document.createElement('div');
    modal.className = 'map-modal';
    modal.innerHTML = `
      <div class="map-modal-content">
        <div class="map-modal-header">
          <h2>Share Map</h2>
          <button class="map-modal-close">&times;</button>
        </div>
        <div class="map-modal-body">
          <p>Share this map view with others:</p>
          
          <div class="share-url-container">
            <input type="text" class="share-url" value="${url}" readonly>
            <button class="copy-url-btn">Copy</button>
          </div>
          
          <div class="share-options">
            <button class="share-email-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Email
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('.map-modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.copy-url-btn').addEventListener('click', () => {
      const urlInput = modal.querySelector('.share-url');
      urlInput.select();
      document.execCommand('copy');
      
      const copyBtn = modal.querySelector('.copy-url-btn');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    });
    
    modal.querySelector('.share-email-btn').addEventListener('click', () => {
      const subject = encodeURIComponent('Map Share from Client360 Dashboard');
      const body = encodeURIComponent(`Check out this map view from the Client360 Dashboard:\n\n${url}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
    
    // Add to document
    document.body.appendChild(modal);
  }
  
  /**
   * Show map loading indicator
   */
  showLoading() {
    // Check if loading indicator already exists
    let loading = this.container.querySelector('.map-loading');
    if (loading) return;
    
    // Create loading indicator
    loading = document.createElement('div');
    loading.className = 'map-loading';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading map...</div>
    `;
    
    // Add to container
    this.container.appendChild(loading);
  }
  
  /**
   * Hide map loading indicator
   */
  hideLoading() {
    const loading = this.container.querySelector('.map-loading');
    if (loading) {
      loading.remove();
    }
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // Hide loading
    this.hideLoading();
    
    // Create error message
    const error = document.createElement('div');
    error.className = 'map-error';
    error.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      <button class="error-retry">Retry</button>
    `;
    
    // Add event listener
    error.querySelector('.error-retry').addEventListener('click', () => {
      error.remove();
      this.init();
    });
    
    // Add to container
    this.container.appendChild(error);
  }
  
  /**
   * Show map fallback when Mapbox token is not available
   */
  showMapFallback() {
    // Hide loading
    this.hideLoading();
    
    // Create fallback map display
    const fallback = document.createElement('div');
    fallback.className = 'map-fallback';
    fallback.innerHTML = `
      <div class="fallback-content">
        <div class="fallback-icon">🗺️</div>
        <div class="fallback-title">Interactive Map</div>
        <div class="fallback-message">Map visualization temporarily unavailable</div>
        <div class="fallback-data">
          <h4>Store Locations Summary:</h4>
          <div class="location-grid">
            <div class="location-card">
              <strong>Manila</strong><br>
              <span>15 stores</span><br>
              <small>High performance</small>
            </div>
            <div class="location-card">
              <strong>Cebu</strong><br>
              <span>8 stores</span><br>
              <small>Growing market</small>
            </div>
            <div class="location-card">
              <strong>Davao</strong><br>
              <span>5 stores</span><br>
              <small>Steady growth</small>
            </div>
          </div>
        </div>
        <button class="configure-map-btn">Configure Map Settings</button>
      </div>
    `;
    
    // Add styles
    fallback.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
    `;
    
    // Add to container
    this.container.appendChild(fallback);
    
    // Add event listener for configure button
    const configureBtn = fallback.querySelector('.configure-map-btn');
    configureBtn.addEventListener('click', () => {
      alert('Map configuration is handled by system administrators. Please contact support for assistance.');
    });
  }
  
  /**
   * Execute pending tasks
   */
  executePendingTasks() {
    // Execute all pending tasks
    this.pendingTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Error executing pending task:', error);
      }
    });
    
    // Clear pending tasks
    this.pendingTasks = [];
  }
  
  /**
   * Add event handler
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   * @returns {string} Handler ID for removal
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Map());
    }
    
    const handlers = this.eventHandlers.get(eventName);
    const handlerId = `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    handlers.set(handlerId, handler);
    
    return handlerId;
  }
  
  /**
   * Remove event handler
   * @param {string} handlerId - Handler ID
   * @returns {boolean} Success status
   */
  off(handlerId) {
    for (const [eventName, handlers] of this.eventHandlers.entries()) {
      if (handlers.has(handlerId)) {
        handlers.delete(handlerId);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Dispatch event
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  dispatchEvent(eventName, data = null) {
    if (!this.eventHandlers.has(eventName)) return;
    
    const handlers = this.eventHandlers.get(eventName);
    
    for (const handler of handlers.values()) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${eventName} event handler:`, error);
      }
    }
  }
  
  /**
   * Fetch GeoJSON from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} GeoJSON data
   */
  async fetchGeoJSON(url) {
    // Check cache if enabled
    if (this.config.enableCaching && this.dataCache.has(url)) {
      const cached = this.dataCache.get(url);
      
      // Check if cached data is still valid
      const now = Date.now();
      if (now - cached.timestamp < this.config.cacheLifetime * 1000) {
        return cached.data;
      }
      
      // Remove expired cache entry
      this.dataCache.delete(url);
    }
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON from ${url}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache data if enabled
      if (this.config.enableCaching) {
        this.dataCache.set(url, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching GeoJSON:', error);
      throw error;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners
    this.eventHandlers.clear();
    
    // Remove popups
    this.activePopups.forEach(popup => popup.remove());
    this.activePopups.clear();
    
    // Remove controls
    this.controls.clear();
    
    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

// Export to window
window.MapEngine = MapEngine;