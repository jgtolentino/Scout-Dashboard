/**
 * TBWA Client 360 Dashboard - Enhanced Store Map Component
 * This file implements the geospatial store map visualization 
 * with barangay/city/municipality level granularity
 */

class StoreMap {
    constructor(elementId, options = {}) {
        this.elementId = elementId;
        this.options = Object.assign({
            metricKey: 'sales', // Default metric to visualize
            center: [14.5995, 120.9842], // Default center (Manila)
            zoom: 7,
            maxZoom: 18,
            minZoom: 5,
            tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            bubbleMinRadius: 8,
            bubbleMaxRadius: 25,
            colorScales: {
                sales: ['#fee8c8', '#fdbb84', '#e34a33'],
                stockouts: ['#eff3ff', '#bdd7e7', '#2171b5'],
                uptime: ['#edf8e9', '#bae4b3', '#238b45']
            },
            showBarangayData: true // Enable barangay-level data display
        }, options);

        this.map = null;
        this.markers = [];
        this.markerLayer = null;
        this.data = [];
        this.barangayData = []; // Store barangay-level data
        this.colorScale = null;
        this.metricRange = {
            min: 0,
            max: 100
        };
        this.barangayLayer = null; // GeoJSON layer for barangay boundaries
        this.municipalityLayer = null; // GeoJSON layer for municipality boundaries
        
        this.init();
    }
    
    init() {
        // Initialize map once DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this._initMap();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this._initMap();
            });
        }
        
        // Set up event listeners for metric selector
        const metricSelector = document.getElementById('mapMetricSelector');
        if (metricSelector) {
            metricSelector.addEventListener('change', (e) => {
                this.options.metricKey = e.target.value;
                this.updateMarkers();
            });
        }

        // Set up granularity selector for barangay/municipality view
        const granularitySelector = document.getElementById('mapGranularitySelector');
        if (granularitySelector) {
            granularitySelector.addEventListener('change', (e) => {
                const granularity = e.target.value;
                this.options.showBarangayData = granularity === 'barangay';
                this.updateMapView();
            });
        }
    }
    
    _initMap() {
        const mapElement = document.getElementById(this.elementId);
        if (!mapElement) {
            console.error(`Map element with ID "${this.elementId}" not found.`);
            return;
        }
        
        // Initialize Leaflet map
        this.map = L.map(this.elementId).setView(this.options.center, this.options.zoom);
        
        // Add tile layer (base map)
        L.tileLayer(this.options.tileLayer, {
            attribution: this.options.attribution,
            maxZoom: this.options.maxZoom,
            minZoom: this.options.minZoom
        }).addTo(this.map);
        
        // Create marker layer group
        this.markerLayer = L.layerGroup().addTo(this.map);
        
        // Add Philippines outline and regional boundaries
        this._addPhilippinesOutline();
        
        // Add zoom level listener to adjust detail
        this.map.on('zoomend', () => {
            this._adjustDetailByZoom();
        });
    }
    
    _addPhilippinesOutline() {
        // Philippines GeoJSON outline
        fetch('./data/philippines_outline.geojson')
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    style: {
                        color: '#0057B8',
                        weight: 2,
                        opacity: 0.6,
                        fillColor: '#0057B8',
                        fillOpacity: 0.1
                    }
                }).addTo(this.map);

                // Load municipality and barangay boundaries if available
                this._loadBarangayData();
            })
            .catch(error => {
                console.warn('Philippines outline not loaded.', error);
            });
    }

    _loadBarangayData() {
        // Load barangay level data from JSON
        fetch('./data/sample_data/barangay_performance.json')
            .then(response => response.json())
            .then(data => {
                this.barangayData = data.data;
                console.log('Barangay data loaded:', this.barangayData.length, 'barangays');
            })
            .catch(error => {
                console.warn('Barangay data not loaded.', error);
            });

        // Load municipality boundaries GeoJSON
        fetch('./data/municipalities.geojson')
            .then(response => response.json())
            .then(data => {
                this.municipalityLayer = L.geoJSON(data, {
                    style: {
                        color: '#0057B8',
                        weight: 1,
                        opacity: 0.4,
                        fillColor: '#0057B8',
                        fillOpacity: 0.05
                    },
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            layer.bindTooltip(feature.properties.name);
                        }
                    }
                });
                
                // Only add to map at appropriate zoom levels
                if (this.map.getZoom() >= 8) {
                    this.municipalityLayer.addTo(this.map);
                }
            })
            .catch(error => {
                console.warn('Municipality boundaries not loaded.', error);
            });
            
        // Load barangay boundaries GeoJSON
        fetch('./data/barangays.geojson')
            .then(response => response.json())
            .then(data => {
                this.barangayLayer = L.geoJSON(data, {
                    style: {
                        color: '#0076C0',
                        weight: 1,
                        opacity: 0.4,
                        fillColor: '#0076C0',
                        fillOpacity: 0.05
                    },
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            // Create enhanced tooltip with store count and sales data
                            const barangayName = feature.properties.name;
                            const cityMunicipality = feature.properties.city_municipality;
                            const storeCount = feature.properties.store_count || 0;
                            
                            let tooltipContent = `<strong>${barangayName}</strong>, ${cityMunicipality}<br>Stores: ${storeCount}`;
                            
                            // Find matching barangay data for additional metrics
                            const barangayInfo = this.barangayData.find(b => 
                                b.barangay === barangayName && 
                                b.city_municipality === cityMunicipality
                            );
                            
                            if (barangayInfo) {
                                tooltipContent += `<br>Total Sales: ₱ ${this._formatNumber(barangayInfo.sales.total)}`;
                                tooltipContent += `<br>Growth: ${barangayInfo.sales.growth_rate}%`;
                            }
                            
                            layer.bindTooltip(tooltipContent);
                            
                            // Add click handler for barangay
                            layer.on('click', (e) => {
                                this._handleBarangayClick(feature.properties, e.latlng);
                            });
                        }
                    }
                });
                
                // Only add barangay layer at high zoom levels
                if (this.map.getZoom() >= 11) {
                    this.barangayLayer.addTo(this.map);
                }
            })
            .catch(error => {
                console.warn('Barangay boundaries not loaded.', error);
            });
    }
    
    _handleBarangayClick(properties, latlng) {
        // Find the barangay data
        const barangayName = properties.name;
        const cityMunicipality = properties.city_municipality;
        
        const barangayData = this.barangayData.find(b => 
            b.barangay === barangayName && 
            b.city_municipality === cityMunicipality
        );
        
        if (barangayData) {
            // Create and open a popup with detailed barangay info
            L.popup()
                .setLatLng(latlng)
                .setContent(this._createBarangayPopup(barangayData))
                .openOn(this.map);
        }
    }
    
    async loadData(filters = {}) {
        try {
            // Show loading state
            this._showLoading();

            // Load enhanced store location data with barangay/city information
            const storeDataResponse = await fetch('./data/sample_data/enhanced_store_locations.json');
            if (!storeDataResponse.ok) throw new Error('Failed to load store location data');
            
            const storeData = await storeDataResponse.json();
            this.data = storeData.locations;
            
            console.log('Enhanced store data loaded:', this.data.length, 'stores');
            
            // Calculate metric ranges for visualization
            this._calculateMetricRange();
            
            // Update the markers on the map
            this.updateMarkers();
            
            // Hide loading state
            this._hideLoading();
        } catch (error) {
            console.error('Error loading store data:', error);
            this._hideLoading();
            
            // Fall back to simulated data if real data loading fails
            this._loadSimulatedData();
        }
    }

    _loadSimulatedData() {
        // Simulated data as fallback
        this.data = [
            {
                store_id: "sari-001",
                name: "Mang Juan's Sari-Sari Store",
                store_type: "Sari-Sari Store",
                address: {
                    barangay: "Poblacion",
                    city_municipality: "Makati City",
                    province: "Metro Manila",
                    region: "NCR"
                },
                geolocation: {
                    latitude: 14.5547,
                    longitude: 121.0244
                },
                metrics: {
                    sales: 42500,
                    stockouts: 12,
                    uptime: 95
                }
            },
            {
                store_id: "sari-002",
                name: "Maria's Mini Mart",
                store_type: "Mini Mart",
                address: {
                    barangay: "Lahug",
                    city_municipality: "Cebu City",
                    province: "Cebu",
                    region: "Central Visayas"
                },
                geolocation: {
                    latitude: 10.3157,
                    longitude: 123.8854
                },
                metrics: {
                    sales: 38750,
                    stockouts: 5,
                    uptime: 92
                }
            }
        ];
        
        this._calculateMetricRange();
        this.updateMarkers();
    }
    
    _showLoading() {
        const mapElement = document.getElementById(this.elementId);
        if (!mapElement) return;
        
        // Create loading overlay if it doesn't exist
        let loadingOverlay = mapElement.querySelector('.map-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'map-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading map data...</div>
            `;
            mapElement.appendChild(loadingOverlay);
        }
        
        loadingOverlay.style.display = 'flex';
    }
    
    _hideLoading() {
        const mapElement = document.getElementById(this.elementId);
        if (!mapElement) return;
        
        const loadingOverlay = mapElement.querySelector('.map-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    _calculateMetricRange() {
        if (!this.data || this.data.length === 0) return;
        
        const metricKey = this.options.metricKey;
        
        // Handle the nested metrics structure in enhanced data
        const values = this.data.map(store => {
            if (store.metrics && store.metrics[metricKey] !== undefined) {
                return store.metrics[metricKey];
            } else if (store.metrics && store.metrics['sales_30d'] !== undefined && metricKey === 'sales') {
                return store.metrics['sales_30d']; // Map 'sales' to 'sales_30d' for compatibility
            }
            return 0; // Default value if metric not found
        });
        
        this.metricRange = {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }
    
    updateMarkers() {
        // Clear existing markers
        this.markerLayer.clearLayers();
        this.markers = [];
        
        if (!this.data || this.data.length === 0) return;
        
        const metricKey = this.options.metricKey;
        
        // Create markers for each store
        this.data.forEach(store => {
            const marker = this._createStoreMarker(store, metricKey);
            if (marker) {
                this.markers.push(marker);
                marker.addTo(this.markerLayer);
            }
        });
    }
    
    _createStoreMarker(store, metricKey) {
        // Get coordinates from new enhanced data structure
        const lat = store.geolocation ? store.geolocation.latitude : store.lat;
        const lng = store.geolocation ? store.geolocation.longitude : store.lng;
        
        if (!lat || !lng) {
            console.warn('Missing coordinates for store:', store.name || store.id);
            return null;
        }
        
        // Get metric value
        let value;
        if (store.metrics && store.metrics[metricKey] !== undefined) {
            value = store.metrics[metricKey];
        } else if (store.metrics && store.metrics['sales_30d'] !== undefined && metricKey === 'sales') {
            value = store.metrics['sales_30d']; // Map 'sales' to 'sales_30d' for compatibility
        } else if (store.metrics && metricKey === 'uptime') {
            value = 90 + Math.random() * 10; // Generate random uptime if not available
        } else if (store.metrics && metricKey === 'stockouts') {
            value = Math.floor(Math.random() * 15); // Generate random stockouts if not available
        } else {
            value = 0;
        }
        
        const normalizedValue = this._normalizeValue(value, this.metricRange.min, this.metricRange.max);
        
        // Calculate radius based on normalized value
        const radius = this._calculateRadius(normalizedValue);
        
        // Determine color based on metric type and value
        const color = this._getColorForValue(normalizedValue, metricKey);
        
        // Format the metric value for display
        const formattedValue = this._formatMetricValue(value, metricKey);
        
        // Create circle marker
        const marker = L.circleMarker([lat, lng], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        // Add tooltip with enhanced location info
        marker.bindTooltip(this._createEnhancedTooltip(store, metricKey, formattedValue), {
            direction: 'top',
            offset: [0, -radius],
            className: 'store-map-tooltip'
        });
        
        // Add click handler for drill-down
        marker.on('click', () => {
            this._handleMarkerClick(store);
        });
        
        return marker;
    }
    
    _createEnhancedTooltip(store, metricKey, formattedValue) {
        // Extract location info from enhanced data structure
        const storeName = store.name || 'Unknown Store';
        const storeType = store.store_type || store.type || 'Store';
        
        // Enhanced address information
        const address = store.address || {};
        const barangay = address.barangay || '-';
        const cityMunicipality = address.city_municipality || '-';
        const province = address.province || '-';
        const region = address.region || '-';
        
        // Metrics information
        const metrics = store.metrics || {};
        const growth = metrics.growth_rate ? `(${metrics.growth_rate > 0 ? '+' : ''}${metrics.growth_rate}%)` : '';
        
        return `
            <div class="store-tooltip">
                <h4 class="tooltip-title">${storeName}</h4>
                <div class="tooltip-type">${storeType}</div>
                <div class="tooltip-address">
                    <strong>Barangay:</strong> ${barangay}<br>
                    <strong>City/Municipality:</strong> ${cityMunicipality}<br>
                    <strong>Province:</strong> ${province}<br>
                    <strong>Region:</strong> ${region}
                </div>
                <div class="tooltip-metric">
                    <span class="metric-name">${this._getMetricLabel(metricKey)}:</span>
                    <span class="metric-value">${formattedValue} ${growth}</span>
                </div>
            </div>
        `;
    }
    
    _handleMarkerClick(store) {
        // Dispatch event to open the drill-down drawer with store details
        window.dispatchEvent(new CustomEvent('openStoreDetail', { 
            detail: { 
                storeId: store.store_id || store.id,
                storeName: store.name,
                storeAddress: store.address || {},
                storeMetrics: store.metrics || {}
            }
        }));
        
        // Alternative approach if the event isn't handled:
        if (typeof toggleDrillDown === 'function') {
            // Set up the store drill-down data
            const drillDownTitle = document.getElementById('drillDownTitle');
            if (drillDownTitle) {
                drillDownTitle.textContent = `Store Details: ${store.name}`;
            }
            
            // Open the drill-down drawer
            toggleDrillDown('storeDrillDown');
        }
        
        // Zoom and center on the store location
        if (this.map) {
            const lat = store.geolocation ? store.geolocation.latitude : store.lat;
            const lng = store.geolocation ? store.geolocation.longitude : store.lng;
            
            if (lat && lng) {
                this.map.setView([lat, lng], 13, {
                    animate: true,
                    duration: 1
                });
            }
        }
    }
    
    _normalizeValue(value, min, max) {
        if (min === max) return 0.5;
        return (value - min) / (max - min);
    }
    
    _calculateRadius(normalizedValue) {
        const { bubbleMinRadius, bubbleMaxRadius } = this.options;
        return bubbleMinRadius + normalizedValue * (bubbleMaxRadius - bubbleMinRadius);
    }
    
    _getColorForValue(normalizedValue, metricKey) {
        const colorScale = this.options.colorScales[metricKey] || this.options.colorScales.sales;
        
        if (normalizedValue <= 0.33) {
            return colorScale[0];
        } else if (normalizedValue <= 0.66) {
            return colorScale[1];
        } else {
            return colorScale[2];
        }
    }
    
    _formatMetricValue(value, metricKey) {
        switch (metricKey) {
            case 'sales':
                return `₱ ${this._formatNumber(value)}`;
            case 'stockouts':
                return `${value} items`;
            case 'uptime':
                return `${value}%`;
            default:
                return value;
        }
    }
    
    _formatNumber(num) {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(2)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    }
    
    _getMetricLabel(metricKey) {
        const labels = {
            sales: 'Sales',
            stockouts: 'Stockouts',
            uptime: 'Uptime'
        };
        return labels[metricKey] || metricKey;
    }
    
    _adjustDetailByZoom() {
        const currentZoom = this.map.getZoom();
        
        // Show/hide municipality and barangay boundaries based on zoom level
        if (this.municipalityLayer) {
            if (currentZoom >= 8) {
                if (!this.map.hasLayer(this.municipalityLayer)) {
                    this.municipalityLayer.addTo(this.map);
                }
            } else {
                if (this.map.hasLayer(this.municipalityLayer)) {
                    this.map.removeLayer(this.municipalityLayer);
                }
            }
        }
        
        if (this.barangayLayer) {
            if (currentZoom >= 11) {
                if (!this.map.hasLayer(this.barangayLayer)) {
                    this.barangayLayer.addTo(this.map);
                }
            } else {
                if (this.map.hasLayer(this.barangayLayer)) {
                    this.map.removeLayer(this.barangayLayer);
                }
            }
        }
        
        // Adjust marker size based on zoom level
        if (currentZoom >= 11) {
            this.options.bubbleMinRadius = 10;
            this.options.bubbleMaxRadius = 30;
        } else if (currentZoom >= 8) {
            this.options.bubbleMinRadius = 8;
            this.options.bubbleMaxRadius = 25;
        } else {
            this.options.bubbleMinRadius = 6;
            this.options.bubbleMaxRadius = 20;
        }
        
        // Update markers with new sizes
        this.updateMarkers();
    }
    
    updateMapView() {
        // Update map view based on whether to show barangay data or not
        if (this.options.showBarangayData) {
            // Show barangay data - increase zoom level if needed
            if (this.map.getZoom() < 10) {
                this.map.setZoom(10);
            }
            
            if (this.barangayLayer && !this.map.hasLayer(this.barangayLayer)) {
                this.barangayLayer.addTo(this.map);
            }
        } else {
            // Show municipality/city level - decrease zoom if too zoomed in
            if (this.map.getZoom() > 12) {
                this.map.setZoom(8);
            }
            
            if (this.barangayLayer && this.map.hasLayer(this.barangayLayer)) {
                this.map.removeLayer(this.barangayLayer);
            }
        }
        
        // Update markers
        this.updateMarkers();
    }
    
    // Public method to filter stores based on dashboard filters
    filterStores(filters = {}) {
        // Skip if no data
        if (!this.data || this.data.length === 0) return;
        
        let filteredData = [...this.data];
        
        // Filter by region
        if (filters.region && filters.region !== 'all') {
            filteredData = filteredData.filter(store => {
                const storeRegion = store.address ? store.address.region : store.region;
                return storeRegion && storeRegion.toLowerCase() === filters.region.toLowerCase();
            });
        }
        
        // Filter by province/city
        if (filters.province && filters.province !== 'all') {
            filteredData = filteredData.filter(store => {
                const storeProvince = store.address ? store.address.province : store.province;
                return storeProvince && storeProvince.toLowerCase() === filters.province.toLowerCase();
            });
        }

        // Filter by city/municipality
        if (filters.city && filters.city !== 'all') {
            filteredData = filteredData.filter(store => {
                const storeCity = store.address ? store.address.city_municipality : store.city_municipality;
                return storeCity && storeCity.toLowerCase() === filters.city.toLowerCase();
            });
        }

        // Filter by barangay
        if (filters.barangay && filters.barangay !== 'all') {
            filteredData = filteredData.filter(store => {
                const storeBarangay = store.address ? store.address.barangay : store.barangay;
                return storeBarangay && storeBarangay.toLowerCase() === filters.barangay.toLowerCase();
            });
        }
        
        // Filter by store type
        if (filters.storeType && filters.storeType !== 'all') {
            filteredData = filteredData.filter(store => {
                const storeType = store.store_type || store.type;
                return storeType && storeType.toLowerCase() === filters.storeType.toLowerCase();
            });
        }
        
        // Calculate new metric range for filtered data
        this._recalculateMetricRange(filteredData);
        
        // Update markers with filtered data
        this.updateFilteredMarkers(filteredData);
    }
    
    _recalculateMetricRange(filteredData) {
        if (!filteredData || filteredData.length === 0) return;
        
        const metricKey = this.options.metricKey;
        const values = filteredData.map(store => {
            if (store.metrics && store.metrics[metricKey] !== undefined) {
                return store.metrics[metricKey];
            } else if (store.metrics && store.metrics['sales_30d'] !== undefined && metricKey === 'sales') {
                return store.metrics['sales_30d'];
            }
            return 0;
        });
        
        this.metricRange = {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }
    
    updateFilteredMarkers(filteredData) {
        // Clear existing markers
        this.markerLayer.clearLayers();
        this.markers = [];
        
        // Add filtered markers
        filteredData.forEach(store => {
            const marker = this._createStoreMarker(store, this.options.metricKey);
            if (marker) {
                this.markers.push(marker);
                marker.addTo(this.markerLayer);
            }
        });
    }
    
    // Public method to resize the map when container size changes
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
    
    // Public method to set map view to a specific region
    setRegionView(region) {
        if (!this.map) return;
        
        const regionCenters = {
            'NCR': { center: [14.5995, 120.9842], zoom: 11 },
            'Luzon': { center: [16.0212, 120.2188], zoom: 9 },
            'Visayas': { center: [10.3157, 123.8854], zoom: 9 },
            'Mindanao': { center: [7.1907, 125.4553], zoom: 9 },
            'all': { center: [12.8797, 121.7740], zoom: 6 }
        };
        
        const regionView = regionCenters[region] || regionCenters.all;
        this.map.setView(regionView.center, regionView.zoom);
    }

    // Highlight barangay on hover (if barangay layer exists)
    _addBarangayHighlight(barangayLayer) {
        if (!barangayLayer) return;
        
        barangayLayer.eachLayer(layer => {
            layer.on({
                mouseover: e => {
                    const layer = e.target;
                    layer.setStyle({
                        weight: 3,
                        color: '#0078ff',
                        dashArray: '',
                        fillOpacity: 0.2
                    });
                    layer.bringToFront();
                },
                mouseout: e => {
                    barangayLayer.resetStyle(e.target);
                },
                click: e => {
                    // Zoom to barangay and show relevant info
                    this.map.fitBounds(e.target.getBounds());
                    
                    // Get barangay name
                    const barangayName = e.target.feature.properties.name;
                    
                    // Find barangay data
                    const barangayData = this.barangayData.find(b => b.barangay === barangayName);
                    
                    if (barangayData) {
                        // Display barangay info popup
                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(this._createBarangayPopup(barangayData))
                            .openOn(this.map);
                    }
                }
            });
        });
    }
    
    _createBarangayPopup(barangayData) {
        // Format barangay statistics for popup
        return `
            <div class="barangay-popup">
                <h3>${barangayData.barangay}, ${barangayData.city_municipality}</h3>
                <p><strong>Region:</strong> ${barangayData.region}</p>
                <p><strong>Store Count:</strong> ${barangayData.store_count}</p>
                <p><strong>Total Sales:</strong> ₱ ${this._formatNumber(barangayData.sales.total)}</p>
                <p><strong>Growth Rate:</strong> ${barangayData.sales.growth_rate}%</p>
                <h4>Top Product Categories</h4>
                <ul>
                    ${Object.entries(barangayData.product_categories)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([category, percentage]) => 
                            `<li>${category}: ${percentage}%</li>`
                        ).join('')}
                </ul>
            </div>
        `;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Create store drill-down template if it doesn't exist
    const storeDrillDown = document.getElementById('storeDrillDown');
    if (!storeDrillDown) {
        const drillDownContent = document.createElement('div');
        drillDownContent.id = 'storeDrillDown';
        drillDownContent.className = 'hidden';
        drillDownContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h4 class="text-md font-semibold text-gray-800 mb-4">Store Performance</h4>
                    <canvas id="storePerformanceChart" height="250"></canvas>
                </div>
                <div>
                    <h4 class="text-md font-semibold text-gray-800 mb-4">Key Metrics</h4>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700">Sales</span>
                                <span class="text-sm font-medium text-gray-700" id="storeSalesValue">₱ 0</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div id="storeSalesBar" class="bg-blue-500 h-2.5 rounded-full" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700">Stockouts</span>
                                <span class="text-sm font-medium text-gray-700" id="storeStockoutsValue">0</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div id="storeStockoutsBar" class="bg-red-500 h-2.5 rounded-full" style="width: 0%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700">Uptime</span>
                                <span class="text-sm font-medium text-gray-700" id="storeUptimeValue">0%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div id="storeUptimeBar" class="bg-green-500 h-2.5 rounded-full" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="text-md font-semibold text-gray-800 mb-4">Location Details</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div class="text-sm text-gray-500 mb-1">Barangay</div>
                        <div class="text-sm font-medium" id="storeBarangay">-</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500 mb-1">City/Municipality</div>
                        <div class="text-sm font-medium" id="storeCity">-</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500 mb-1">Province</div>
                        <div class="text-sm font-medium" id="storeProvince">-</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-500 mb-1">Region</div>
                        <div class="text-sm font-medium" id="storeRegion">-</div>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region Avg</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="storeMetricsTable">
                        <!-- Metrics rows will be populated dynamically -->
                    </tbody>
                </table>
            </div>
        `;
        
        // Add the drill-down to the content container
        const drillDownContainer = document.querySelector('#drillDownDrawer > div > div:nth-child(2)');
        if (drillDownContainer) {
            drillDownContainer.appendChild(drillDownContent);
        }
    }
    
    // Event listener for custom store detail event
    window.addEventListener('openStoreDetail', (e) => {
        // Populate drill-down data
        const { storeId, storeName, storeAddress = {}, storeMetrics = {} } = e.detail;
        
        // Set drill-down title
        const drillDownTitle = document.getElementById('drillDownTitle');
        if (drillDownTitle) {
            drillDownTitle.textContent = `Store Details: ${storeName}`;
        }
        
        // Update location details
        document.getElementById('storeBarangay').textContent = storeAddress.barangay || '-';
        document.getElementById('storeCity').textContent = storeAddress.city_municipality || '-';
        document.getElementById('storeProvince').textContent = storeAddress.province || '-';
        document.getElementById('storeRegion').textContent = storeAddress.region || '-';
        
        // Update metrics visualization
        if (storeMetrics) {
            // Get sales value (either 'sales' or 'sales_30d')
            const salesValue = storeMetrics.sales || storeMetrics.sales_30d || 0;
            
            // Update sales metric
            document.getElementById('storeSalesValue').textContent = `₱ ${formatNumber(salesValue)}`;
            document.getElementById('storeSalesBar').style.width = `${Math.min((salesValue / 100000) * 100, 100)}%`;
            
            // Update stockouts metric (inverse scale - lower is better)
            const stockoutsValue = storeMetrics.stockouts || 0;
            document.getElementById('storeStockoutsValue').textContent = stockoutsValue;
            document.getElementById('storeStockoutsBar').style.width = `${Math.min((stockoutsValue / 20) * 100, 100)}%`;
            
            // Update uptime metric
            const uptimeValue = storeMetrics.uptime || 0;
            document.getElementById('storeUptimeValue').textContent = `${uptimeValue}%`;
            document.getElementById('storeUptimeBar').style.width = `${uptimeValue}%`;
            
            // Update metrics table
            const metricsTable = document.getElementById('storeMetricsTable');
            if (metricsTable) {
                metricsTable.innerHTML = '';
                
                // Add sales row
                const salesRow = document.createElement('tr');
                salesRow.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sales</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${formatNumber(salesValue)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${formatNumber(salesValue * 0.85)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">+15%</td>
                `;
                metricsTable.appendChild(salesRow);
                
                // Add growth rate row if available
                if (storeMetrics.growth_rate) {
                    const growthRow = document.createElement('tr');
                    const growthValue = storeMetrics.growth_rate;
                    const growthClass = growthValue >= 0 ? 'text-green-500' : 'text-red-500';
                    const growthSign = growthValue >= 0 ? '+' : '';
                    
                    growthRow.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Growth Rate</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${growthClass}">${growthSign}${growthValue}%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+8.4%</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${growthClass}">${growthSign}${(growthValue - 8.4).toFixed(1)}%</td>
                    `;
                    metricsTable.appendChild(growthRow);
                }
                
                // Add customer count row if available
                if (storeMetrics.customer_count_30d) {
                    const customersRow = document.createElement('tr');
                    customersRow.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Customers (30d)</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${storeMetrics.customer_count_30d}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.round(storeMetrics.customer_count_30d * 0.9)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">+10%</td>
                    `;
                    metricsTable.appendChild(customersRow);
                }
                
                // Add basket size row if available
                if (storeMetrics.average_basket_size) {
                    const basketRow = document.createElement('tr');
                    basketRow.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Avg Basket Size</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${storeMetrics.average_basket_size}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${Math.round(storeMetrics.average_basket_size * 0.95)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">+5%</td>
                    `;
                    metricsTable.appendChild(basketRow);
                }
            }
            
            // Initialize store performance chart
            const chartCtx = document.getElementById('storePerformanceChart');
            if (chartCtx) {
                const chart = new Chart(chartCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Sales',
                            data: generateMonthlyData(salesValue),
                            backgroundColor: '#3B82F6',
                            borderWidth: 0,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        return '₱ ' + formatNumber(value);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        
        // Open the drill-down drawer
        toggleDrillDown('storeDrillDown');
    });
    
    // Helper functions for store details
    function formatNumber(num) {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(2)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    }
    
    function generateMonthlyData(baseValue) {
        const data = [];
        // Generate last 6 months of data with variations
        for (let i = 0; i < 6; i++) {
            const monthFactor = 0.85 + (i * 0.03); // Gradually increasing trend
            const randomVariation = (Math.random() * 0.1) - 0.05; // ±5% random variation
            data.push(baseValue * (monthFactor + randomVariation));
        }
        return data;
    }
});