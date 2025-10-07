/**
 * Enhanced Store Map Component for Client360 Dashboard v2.3.3
 * Provides interactive geographical visualization with GeoJSON integration
 * Implements PRD requirement F7.5 - Interactive Region Map
 */

class StoreMapComponent {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    
    // Default options
    this.options = {
      mapboxToken: 'pk.placeholder.token', // Should be set through secure config in production
      initialView: {
        center: [121.0, 14.6], // Manila, Philippines
        zoom: 6
      },
      enableClustering: true,
      enableHeatmap: true,
      dataUrl: {
        regions: '/data/regions.geojson',
        municipalities: '/data/municipalities.geojson',
        barangays: '/data/barangays.geojson',
        storeMarkers: '/data/store_markers.json'
      },
      ...options
    };
    
    // State properties
    this.map = null;
    this.currentLayers = [];
    this.currentView = 'regions'; // regions, municipalities, barangays
    this.currentFilters = {};
    this.selectedRegion = null;
    this.selectedMunicipality = null;
    this.tooltip = null;
    this.detailsPanel = null;
    this.markers = [];
    
    // Initialize when container is available
    if (this.container) {
      this.init();
    } else {
      console.error('Map container not found:', this.containerId);
    }
  }
  
  /**
   * Initialize the map component
   */
  init() {
    this.loadMapboxDependencies()
      .then(() => {
        this.initMap();
        this.createControls();
        
        // Set mapbox token
        mapboxgl.accessToken = this.options.mapboxToken;
      })
      .catch(error => {
        console.error('Error initializing map:', error);
        this.showErrorMessage('Failed to load map. Please refresh the page or try again later.');
      });
  }
  
  /**
   * Load Mapbox dependencies if not already loaded
   * @returns {Promise} Resolves when dependencies are loaded
   */
  loadMapboxDependencies() {
    return new Promise((resolve, reject) => {
      // Check if Mapbox is already loaded
      if (window.mapboxgl) {
        resolve();
        return;
      }
      
      // Load Mapbox script
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js';
      script.onerror = () => reject(new Error('Failed to load Mapbox script'));
      
      // Load Mapbox styles
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css';
      
      // Add elements to document
      document.head.appendChild(link);
      document.head.appendChild(script);
      
      // Wait for script to load
      script.onload = () => resolve();
    });
  }
  
  /**
   * Initialize the map
   */
  initMap() {
    // Show loading indicator
    this.container.innerHTML = '<div class="map-loading">Loading map...</div>';
    
    // Create map instance
    this.map = new mapboxgl.Map({
      container: this.containerId,
      style: 'mapbox://styles/mapbox/light-v10',
      center: this.options.initialView.center,
      zoom: this.options.initialView.zoom,
      minZoom: 5,
      maxZoom: 16
    });
    
    // Add navigation controls
    this.map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true }),
      'top-right'
    );
    
    // Create map tooltip
    this.createTooltip();
    
    // Create details panel
    this.createDetailsPanel();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load initial data when map is ready
    this.map.on('load', () => {
      this.loadMapData();
    });
  }
  
  /**
   * Create map overlay controls
   */
  createControls() {
    // Create control container
    const controlContainer = document.createElement('div');
    controlContainer.className = 'map-controls absolute top-2 left-2 bg-white rounded-lg shadow-md p-2 z-10';
    
    // Create view selector
    const viewSelector = document.createElement('div');
    viewSelector.className = 'mb-2';
    viewSelector.innerHTML = `
      <label class="block text-xs text-gray-600 mb-1">Map View</label>
      <select id="${this.containerId}-view-selector" class="w-full text-sm border border-gray-300 rounded p-1">
        <option value="regions">Regions</option>
        <option value="municipalities">Municipalities</option>
        <option value="barangays">Barangays</option>
      </select>
    `;
    
    // Create data visualization selector
    const visualizationSelector = document.createElement('div');
    visualizationSelector.className = 'mb-2';
    visualizationSelector.innerHTML = `
      <label class="block text-xs text-gray-600 mb-1">Visualization</label>
      <select id="${this.containerId}-viz-selector" class="w-full text-sm border border-gray-300 rounded p-1">
        <option value="choropleth">Sales Choropleth</option>
        <option value="stores">Store Count</option>
        <option value="growth">Growth Rate</option>
        <option value="marketshare">Market Share</option>
      </select>
    `;
    
    // Create toggle buttons for map features
    const toggleButtons = document.createElement('div');
    toggleButtons.className = 'flex space-x-2 mb-2';
    toggleButtons.innerHTML = `
      <button id="${this.containerId}-toggle-heatmap" class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 flex items-center">
        <span class="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
        Heatmap
      </button>
      <button id="${this.containerId}-toggle-clusters" class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 flex items-center">
        <span class="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
        Clusters
      </button>
    `;
    
    // Create legend
    const legend = document.createElement('div');
    legend.id = `${this.containerId}-legend`;
    legend.className = 'text-xs border-t border-gray-200 pt-2 mt-2';
    legend.innerHTML = `
      <div class="text-gray-600 mb-1">Sales (₱)</div>
      <div class="flex items-center justify-between">
        <div>0</div>
        <div class="flex-1 mx-1 h-2 bg-gradient-to-r from-blue-50 to-blue-700 rounded"></div>
        <div>100K+</div>
      </div>
    `;
    
    // Assemble controls
    controlContainer.appendChild(viewSelector);
    controlContainer.appendChild(visualizationSelector);
    controlContainer.appendChild(toggleButtons);
    controlContainer.appendChild(legend);
    
    // Add controls to map container
    this.container.appendChild(controlContainer);
    
    // Add event listeners once map is created
    setTimeout(() => {
      // View selector change event
      const viewSel = document.getElementById(`${this.containerId}-view-selector`);
      if (viewSel) {
        viewSel.addEventListener('change', (e) => {
          this.setMapView(e.target.value);
        });
      }
      
      // Visualization selector change event
      const vizSel = document.getElementById(`${this.containerId}-viz-selector`);
      if (vizSel) {
        vizSel.addEventListener('change', (e) => {
          this.setVisualizationType(e.target.value);
        });
      }
      
      // Toggle heatmap button
      const heatmapBtn = document.getElementById(`${this.containerId}-toggle-heatmap`);
      if (heatmapBtn) {
        heatmapBtn.addEventListener('click', () => {
          this.toggleHeatmap();
          heatmapBtn.classList.toggle('bg-red-100');
          heatmapBtn.classList.toggle('bg-gray-100');
        });
      }
      
      // Toggle clusters button
      const clustersBtn = document.getElementById(`${this.containerId}-toggle-clusters`);
      if (clustersBtn) {
        clustersBtn.addEventListener('click', () => {
          this.toggleClusters();
          clustersBtn.classList.toggle('bg-blue-100');
          clustersBtn.classList.toggle('bg-gray-100');
        });
      }
    }, 0);
  }
  
  /**
   * Load map data based on current view
   */
  loadMapData() {
    // Determine if we're using simulated or live data
    const dataMode = window.isSimulatedData ? 'simulated' : 'live';
    
    // Adjust URL based on data mode
    let dataUrl = this.options.dataUrl[this.currentView];
    dataUrl = dataUrl.replace('/data/', `/data/${dataMode}/`);
    
    // Fetch GeoJSON data
    fetch(dataUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${this.currentView} data`);
        }
        return response.json();
      })
      .then(data => {
        this.renderMapData(data);
        
        // Load store markers if enabled
        if (this.options.enableClustering || this.options.enableHeatmap) {
          this.loadStoreMarkers();
        }
      })
      .catch(error => {
        console.error(`Error loading ${this.currentView} data:`, error);
        this.showErrorMessage(`Failed to load ${this.currentView} data`);
      });
  }
  
  /**
   * Load store marker data for clustering and heatmap
   */
  loadStoreMarkers() {
    // Determine if we're using simulated or live data
    const dataMode = window.isSimulatedData ? 'simulated' : 'live';
    
    // Adjust URL based on data mode
    let dataUrl = this.options.dataUrl.storeMarkers;
    dataUrl = dataUrl.replace('/data/', `/data/${dataMode}/`);
    
    // Fetch marker data
    fetch(dataUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load store markers');
        }
        return response.json();
      })
      .then(data => {
        // Convert to GeoJSON if needed
        const geojson = this.isGeoJSON(data) ? data : this.convertToGeoJSON(data);
        
        // Add source for markers
        if (!this.map.getSource('stores')) {
          this.map.addSource('stores', {
            type: 'geojson',
            data: geojson,
            cluster: this.options.enableClustering,
            clusterMaxZoom: 14,
            clusterRadius: 50
          });
          
          // Add cluster layers
          this.addClusterLayers();
          
          // Add heatmap layer
          this.addHeatmapLayer();
        } else {
          // Update existing source
          this.map.getSource('stores').setData(geojson);
        }
      })
      .catch(error => {
        console.error('Error loading store markers:', error);
      });
  }
  
  /**
   * Check if data is already in GeoJSON format
   * @param {Object} data - Data to check
   * @returns {boolean} True if data is GeoJSON
   */
  isGeoJSON(data) {
    return data && data.type === 'FeatureCollection' && Array.isArray(data.features);
  }
  
  /**
   * Convert array of store locations to GeoJSON
   * @param {Array} data - Array of store locations
   * @returns {Object} GeoJSON FeatureCollection
   */
  convertToGeoJSON(data) {
    if (!Array.isArray(data)) {
      throw new Error('Invalid store data format');
    }
    
    return {
      type: 'FeatureCollection',
      features: data.map(store => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [store.longitude, store.latitude]
        },
        properties: {
          id: store.id,
          name: store.name,
          address: store.address,
          city: store.city,
          region: store.region,
          sales: store.sales,
          growth: store.growth,
          storeType: store.type
        }
      }))
    };
  }
  
  /**
   * Add cluster layers to map
   */
  addClusterLayers() {
    // Add cluster layers
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'stores',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          20, '#f1f075',
          50, '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          20, 30,
          50, 40
        ]
      }
    });
    
    // Add cluster count labels
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'stores',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });
    
    // Add unclustered point layer
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'stores',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
    
    // Add event handler for clicking on clusters
    this.map.on('click', 'clusters', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      
      // Get cluster expansion zoom level
      this.map.getSource('stores').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          
          // Zoom to cluster
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });
    
    // Add event handlers for hovering over clusters
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
    
    // Add event handler for clicking on unclustered points
    this.map.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      
      // Show store details
      this.showStoreDetails(properties, coordinates);
    });
    
    // Add event handlers for hovering over unclustered points
    this.map.on('mouseenter', 'unclustered-point', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      
      // Show tooltip
      const properties = e.features[0].properties;
      this.showTooltip(properties, e.lngLat);
    });
    
    this.map.on('mouseleave', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = '';
      this.hideTooltip();
    });
    
    // Set visibility based on options
    this.setClusterVisibility(this.options.enableClustering);
  }
  
  /**
   * Add heatmap layer to map
   */
  addHeatmapLayer() {
    this.map.addLayer({
      id: 'stores-heat',
      type: 'heatmap',
      source: 'stores',
      paint: {
        // Increase weight as sales increases
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'sales'],
          0, 0,
          100000, 1
        ],
        // Increase intensity as zoom level increases
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        // Assign color values from cool to hot
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
        // Adjust radius by zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        // Decrease opacity as zoom increases
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          9, 0.5
        ]
      }
    }, 'clusters');
    
    // Set visibility based on options
    this.setHeatmapVisibility(this.options.enableHeatmap);
  }
  
  /**
   * Render map data
   * @param {Object} data - GeoJSON data
   */
  renderMapData(data) {
    // Clear any existing layers
    this.clearMapLayers();
    
    // Add source for GeoJSON data
    if (!this.map.getSource(this.currentView)) {
      this.map.addSource(this.currentView, {
        type: 'geojson',
        data: data
      });
    } else {
      // Update existing source
      this.map.getSource(this.currentView).setData(data);
    }
    
    // Add fill layer
    this.map.addLayer({
      id: `${this.currentView}-fill`,
      type: 'fill',
      source: this.currentView,
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
        'fill-opacity': 0.7
      }
    });
    this.currentLayers.push(`${this.currentView}-fill`);
    
    // Add outline layer
    this.map.addLayer({
      id: `${this.currentView}-line`,
      type: 'line',
      source: this.currentView,
      paint: {
        'line-color': '#000',
        'line-width': 0.5,
        'line-opacity': 0.5
      }
    });
    this.currentLayers.push(`${this.currentView}-line`);
    
    // Add hover effect
    this.map.on('mousemove', `${this.currentView}-fill`, (e) => {
      if (e.features.length > 0) {
        // Set cursor to pointer
        this.map.getCanvas().style.cursor = 'pointer';
        
        // Show tooltip
        this.showTooltip(e.features[0].properties, e.lngLat);
      }
    });
    
    this.map.on('mouseleave', `${this.currentView}-fill`, () => {
      this.map.getCanvas().style.cursor = '';
      this.hideTooltip();
    });
    
    // Add click interaction
    this.map.on('click', `${this.currentView}-fill`, (e) => {
      if (e.features.length > 0) {
        // Get region data
        const feature = e.features[0];
        
        // Show detailed panel with region data
        this.showDetailsPanel(feature.properties);
        
        // Handle drill-down behavior
        if (this.currentView === 'regions') {
          this.selectedRegion = feature.properties.id;
          // Could zoom to region and load municipalities
        } else if (this.currentView === 'municipalities') {
          this.selectedMunicipality = feature.properties.id;
          // Could zoom to municipality and load barangays
        }
      }
    });
    
    // Update legend based on current visualization
    this.updateLegend(this.currentView);
  }
  
  /**
   * Clear existing map layers
   */
  clearMapLayers() {
    // Remove existing layers
    this.currentLayers.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });
    
    // Reset current layers
    this.currentLayers = [];
  }
  
  /**
   * Set map view (regions, municipalities, barangays)
   * @param {string} view - Map view type
   */
  setMapView(view) {
    if (this.currentView === view) return;
    
    // Update current view
    this.currentView = view;
    
    // Reset selection if changing to higher level
    if (view === 'regions') {
      this.selectedRegion = null;
      this.selectedMunicipality = null;
    } else if (view === 'municipalities') {
      this.selectedMunicipality = null;
    }
    
    // Load new data
    this.loadMapData();
  }
  
  /**
   * Set visualization type
   * @param {string} vizType - Visualization type
   */
  setVisualizationType(vizType) {
    // Update fill color based on visualization type
    if (!this.map.getLayer(`${this.currentView}-fill`)) return;
    
    if (vizType === 'choropleth') {
      this.map.setPaintProperty(`${this.currentView}-fill`, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        0, '#f7fbff',
        20000, '#c7dcef',
        40000, '#72b2d7',
        60000, '#2878b8',
        80000, '#08519c',
        100000, '#08306b'
      ]);
    } else if (vizType === 'stores') {
      this.map.setPaintProperty(`${this.currentView}-fill`, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'stores'],
        0, '#f7fcf5',
        20, '#ccebc5',
        50, '#a8ddb5',
        100, '#7bccc4',
        200, '#43a2ca',
        500, '#0868ac'
      ]);
    } else if (vizType === 'growth') {
      this.map.setPaintProperty(`${this.currentView}-fill`, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'growth'],
        -10, '#d7191c',
        -5, '#fdae61',
        0, '#ffffbf',
        5, '#a6d96a',
        10, '#1a9641'
      ]);
    } else if (vizType === 'marketshare') {
      this.map.setPaintProperty(`${this.currentView}-fill`, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'market_share'],
        0, '#f7f4f9',
        10, '#e7e1ef',
        20, '#d4b9da',
        30, '#c994c7',
        40, '#df65b0',
        50, '#e7298a',
        60, '#ce1256',
        70, '#980043'
      ]);
    }
    
    // Update legend based on visualization type
    this.updateLegend(vizType);
  }
  
  /**
   * Update legend based on visualization type
   * @param {string} vizType - Visualization type
   */
  updateLegend(vizType) {
    const legend = document.getElementById(`${this.containerId}-legend`);
    if (!legend) return;
    
    let content = '';
    
    if (vizType === 'choropleth' || vizType === 'regions' || vizType === 'municipalities' || vizType === 'barangays') {
      content = `
        <div class="text-gray-600 mb-1">Sales (₱)</div>
        <div class="flex items-center justify-between">
          <div>0</div>
          <div class="flex-1 mx-1 h-2 bg-gradient-to-r from-blue-50 to-blue-700 rounded"></div>
          <div>100K+</div>
        </div>
      `;
    } else if (vizType === 'stores') {
      content = `
        <div class="text-gray-600 mb-1">Store Count</div>
        <div class="flex items-center justify-between">
          <div>0</div>
          <div class="flex-1 mx-1 h-2 bg-gradient-to-r from-green-50 to-blue-700 rounded"></div>
          <div>500+</div>
        </div>
      `;
    } else if (vizType === 'growth') {
      content = `
        <div class="text-gray-600 mb-1">Growth Rate (%)</div>
        <div class="flex items-center justify-between">
          <div>-10%</div>
          <div class="flex-1 mx-1 h-2 bg-gradient-to-r from-red-500 via-yellow-200 to-green-500 rounded"></div>
          <div>+10%</div>
        </div>
      `;
    } else if (vizType === 'marketshare') {
      content = `
        <div class="text-gray-600 mb-1">Market Share (%)</div>
        <div class="flex items-center justify-between">
          <div>0%</div>
          <div class="flex-1 mx-1 h-2 bg-gradient-to-r from-purple-50 to-pink-800 rounded"></div>
          <div>70%+</div>
        </div>
      `;
    }
    
    legend.innerHTML = content;
  }
  
  /**
   * Toggle heatmap visibility
   */
  toggleHeatmap() {
    if (!this.map.getLayer('stores-heat')) return;
    
    const currentVisibility = this.map.getLayoutProperty('stores-heat', 'visibility');
    const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';
    
    this.setHeatmapVisibility(newVisibility === 'visible');
  }
  
  /**
   * Set heatmap visibility
   * @param {boolean} visible - Whether heatmap should be visible
   */
  setHeatmapVisibility(visible) {
    if (!this.map.getLayer('stores-heat')) return;
    
    this.map.setLayoutProperty(
      'stores-heat',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
  
  /**
   * Toggle clusters visibility
   */
  toggleClusters() {
    if (!this.map.getLayer('clusters')) return;
    
    const currentVisibility = this.map.getLayoutProperty('clusters', 'visibility');
    const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';
    
    this.setClusterVisibility(newVisibility === 'visible');
  }
  
  /**
   * Set clusters visibility
   * @param {boolean} visible - Whether clusters should be visible
   */
  setClusterVisibility(visible) {
    if (!this.map.getLayer('clusters')) return;
    
    const layers = ['clusters', 'cluster-count', 'unclustered-point'];
    
    layers.forEach(layer => {
      this.map.setLayoutProperty(
        layer,
        'visibility',
        visible ? 'visible' : 'none'
      );
    });
  }
  
  /**
   * Set up map event handlers
   */
  setupEventHandlers() {
    // Add resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Add data source toggle handler
    document.addEventListener('dataSourceToggled', (e) => {
      this.loadMapData();
    });
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (this.map) {
      this.map.resize();
    }
  }
  
  /**
   * Create map tooltip
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'absolute bg-white p-2 rounded shadow-lg text-sm z-30 pointer-events-none hidden';
    this.tooltip.style.transform = 'translate(-50%, -110%)';
    this.container.appendChild(this.tooltip);
  }
  
  /**
   * Show tooltip with properties
   * @param {Object} properties - Feature properties
   * @param {Object} lngLat - Longitude and latitude
   */
  showTooltip(properties, lngLat) {
    if (!this.tooltip || !this.map) return;
    
    let content = '';
    
    // Format content based on properties
    if (properties.name) {
      content += `<div class="font-semibold">${properties.name}</div>`;
    }
    
    if (properties.stores !== undefined) {
      content += `<div class="flex justify-between gap-2"><span>Stores:</span><span>${properties.stores}</span></div>`;
    }
    
    if (properties.value !== undefined) {
      content += `<div class="flex justify-between gap-2"><span>Sales:</span><span>₱${Number(properties.value).toLocaleString()}</span></div>`;
    }
    
    if (properties.growth !== undefined) {
      const growthColor = properties.growth >= 0 ? 'text-green-600' : 'text-red-600';
      content += `<div class="flex justify-between gap-2"><span>Growth:</span><span class="${growthColor}">${properties.growth >= 0 ? '+' : ''}${properties.growth}%</span></div>`;
    }
    
    if (properties.market_share !== undefined) {
      content += `<div class="flex justify-between gap-2"><span>Share:</span><span>${properties.market_share}%</span></div>`;
    }
    
    // Update tooltip content
    this.tooltip.innerHTML = content;
    
    // Calculate position
    const point = this.map.project(lngLat);
    
    // Position tooltip
    this.tooltip.style.left = `${point.x}px`;
    this.tooltip.style.top = `${point.y}px`;
    this.tooltip.classList.remove('hidden');
  }
  
  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.add('hidden');
    }
  }
  
  /**
   * Create details panel
   */
  createDetailsPanel() {
    this.detailsPanel = document.createElement('div');
    this.detailsPanel.className = 'absolute right-2 top-12 bg-white rounded-lg shadow-xl w-72 z-20 transform translate-x-full transition-transform duration-300';
    this.container.appendChild(this.detailsPanel);
  }
  
  /**
   * Show details panel with properties
   * @param {Object} properties - Feature properties
   */
  showDetailsPanel(properties) {
    if (!this.detailsPanel) return;
    
    // Format content based on properties
    let content = `
      <div class="p-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">${properties.name || 'Unknown'}</h3>
          <button id="${this.containerId}-close-details" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-4">
    `;
    
    // Add metrics cards
    content += `
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-blue-50 p-3 rounded-lg">
          <div class="text-sm text-gray-600">Sales</div>
          <div class="text-lg font-semibold text-blue-700">₱${Number(properties.value || 0).toLocaleString()}</div>
        </div>
        <div class="bg-green-50 p-3 rounded-lg">
          <div class="text-sm text-gray-600">Stores</div>
          <div class="text-lg font-semibold text-green-700">${properties.stores || 0}</div>
        </div>
      </div>
    `;
    
    // Add performance metrics
    content += `
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h4>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm">Growth</span>
            <div class="flex items-center">
              <span class="text-sm font-medium ${properties.growth >= 0 ? 'text-green-600' : 'text-red-600'}">${properties.growth >= 0 ? '+' : ''}${properties.growth || 0}%</span>
              <svg class="w-4 h-4 ml-1 ${properties.growth >= 0 ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${properties.growth >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}"></path>
              </svg>
            </div>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm">Market Share</span>
            <span class="text-sm font-medium">${properties.market_share || 0}%</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-sm">Active SKUs</span>
            <span class="text-sm font-medium">${properties.skus || 0}</span>
          </div>
        </div>
      </div>
    `;
    
    // Add action buttons
    content += `
      <div class="space-y-2">
        <button id="${this.containerId}-view-details" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          View Detailed Report
        </button>
        <button id="${this.containerId}-add-to-watchlist" class="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium flex items-center justify-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Add to Watchlist
        </button>
      </div>
    `;
    
    content += '</div>';
    
    // Update panel content
    this.detailsPanel.innerHTML = content;
    
    // Show panel
    this.detailsPanel.classList.remove('translate-x-full');
    
    // Add close button functionality
    document.getElementById(`${this.containerId}-close-details`).addEventListener('click', () => {
      this.hideDetailsPanel();
    });
    
    // Add view details button functionality
    document.getElementById(`${this.containerId}-view-details`).addEventListener('click', () => {
      // Navigate to details page
      if (this.currentView === 'regions') {
        window.location.href = `/region/${properties.id}`;
      } else if (this.currentView === 'municipalities') {
        window.location.href = `/municipality/${properties.id}`;
      } else if (this.currentView === 'barangays') {
        window.location.href = `/barangay/${properties.id}`;
      }
    });
    
    // Add watchlist button functionality
    document.getElementById(`${this.containerId}-add-to-watchlist`).addEventListener('click', () => {
      this.addToWatchlist(properties);
    });
  }
  
  /**
   * Hide details panel
   */
  hideDetailsPanel() {
    if (this.detailsPanel) {
      this.detailsPanel.classList.add('translate-x-full');
    }
  }
  
  /**
   * Show store details
   * @param {Object} properties - Store properties
   * @param {Array} coordinates - Store coordinates
   */
  showStoreDetails(properties, coordinates) {
    // Format properties for details panel
    const panelProperties = {
      id: properties.id,
      name: properties.name,
      value: properties.sales,
      stores: 1,
      growth: properties.growth,
      market_share: 0, // Calculate or provide if available
      skus: 0, // Calculate or provide if available
      type: 'store'
    };
    
    // Show details panel
    this.showDetailsPanel(panelProperties);
  }
  
  /**
   * Add location to watchlist
   * @param {Object} properties - Location properties
   */
  addToWatchlist(properties) {
    // Get existing watchlist from localStorage
    const watchlist = JSON.parse(localStorage.getItem('mapWatchlist') || '[]');
    
    // Add new item if not already in list
    if (!watchlist.some(item => item.id === properties.id)) {
      watchlist.push({
        id: properties.id,
        name: properties.name,
        type: this.currentView.slice(0, -1), // Remove 's' from end
        addedAt: new Date().toISOString()
      });
      
      // Save updated watchlist
      localStorage.setItem('mapWatchlist', JSON.stringify(watchlist));
      
      // Show success notification
      if (typeof window.showToast === 'function') {
        window.showToast(`Added ${properties.name} to watchlist`, 'success');
      }
      
      // Update button to show "Added"
      const watchlistButton = document.getElementById(`${this.containerId}-add-to-watchlist`);
      if (watchlistButton) {
        watchlistButton.innerHTML = `
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Added to Watchlist
        `;
        watchlistButton.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-800');
        watchlistButton.classList.add('bg-green-100', 'text-green-700');
        watchlistButton.disabled = true;
      }
    }
  }
  
  /**
   * Show error message in map container
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    this.container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-4 bg-gray-100 rounded-lg">
        <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-700">Map data unavailable</h3>
        <p class="text-sm text-gray-600 text-center mt-1">${message}</p>
        <button id="${this.containerId}-retry" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Retry
        </button>
      </div>
    `;
    
    // Add retry button functionality
    document.getElementById(`${this.containerId}-retry`).addEventListener('click', () => {
      this.init();
    });
  }
}

// Export to window
window.StoreMapComponent = StoreMapComponent;

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Check if map container exists
  const mapContainer = document.getElementById('store-map');
  if (mapContainer) {
    // Create new map instance
    window.storeMap = new StoreMapComponent('store-map', {
      enableClustering: true,
      enableHeatmap: true
    });
  }
});