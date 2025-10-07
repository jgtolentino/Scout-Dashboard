/**
 * TBWA Client 360 Dashboard - Enhanced Geospatial Store Map Component
 * This file implements the geospatial store map visualization
 */

class StoreMap {
    constructor(elementId, options = {}) {
        this.elementId = elementId;
        this.options = Object.assign({
            center: [12.8797, 121.7740], // Default center (Philippines)
            zoom: 6,                     // Initial zoom level
            maxZoom: 18,                 // Maximum zoom level
            minZoom: 5,                  // Minimum zoom level
            metricKey: 'sales_30d',      // Initial metric to display
            bubbleMinRadius: 5,          // Minimum marker size
            bubbleMaxRadius: 25,         // Maximum marker size
            tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            colorScales: {
                sales_30d: ['#e8f5e9', '#66bb6a', '#2e7d32'],     // Green scale
                sales_7d: ['#e3f2fd', '#42a5f5', '#1565c0'],      // Blue scale
                customer_count_30d: ['#f3e5f5', '#ab47bc', '#6a1b9a'], // Purple scale
                average_basket_size: ['#e0f2f1', '#26a69a', '#00695c'], // Teal scale
                growth_rate: ['#e8f5e9', '#66bb6a', '#2e7d32'],    // Green scale
                stockouts: ['#fff3e0', '#ff9800', '#e65100']      // Orange scale
            },
            showLegend: true, // Whether to show the legend
            enableClustering: false // Whether to enable marker clustering
        }, options);

        this.map = null;
        this.markers = [];
        this.markerLayer = null;
        this.legend = null;
        this.legendControl = null;
        this.data = [];
        this.filteredData = [];
        this.metricRange = {
            min: 0,
            max: 100
        };
        this.themeManager = window.themeManager || {
            getTheme: () => 'tbwa',
            onThemeChange: (callback) => {
                document.addEventListener('themeChanged', callback);
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('Initializing enhanced geospatial store map...');
        
        // Initialize map once DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this._initMap();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this._initMap();
            });
        }
        
        // Set up event listeners for metric selector
        const metricSelector = document.getElementById('map-metric-selector');
        if (metricSelector) {
            metricSelector.addEventListener('change', (e) => {
                this.setMetric(e.target.value);
            });
        }
        
        // Listen for theme changes
        this.themeManager.onThemeChange(() => {
            this._updateThemeStyles();
        });
    }
    
    _initMap() {
        const mapElement = document.getElementById(this.elementId);
        if (!mapElement) {
            console.error(`Map element with ID "${this.elementId}" not found.`);
            return;
        }
        
        // Add loading overlay
        this._addLoadingOverlay(mapElement);
        
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
        
        // Add Philippines outline
        this._addPhilippinesOutline();
        
        // Add scale control
        L.control.scale({ imperial: false }).addTo(this.map);
        
        // Add legend
        if (this.options.showLegend) {
            this._createLegend();
        }
        
        // Apply theme styles
        this._updateThemeStyles();
        
        // Add responsive handler
        window.addEventListener('resize', this.resize.bind(this));
    }
    
    _addLoadingOverlay(mapElement) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'map-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading map data...</div>
        `;
        loadingOverlay.id = `${this.elementId}-loading`;
        mapElement.appendChild(loadingOverlay);
    }
    
    _showLoading() {
        const overlay = document.getElementById(`${this.elementId}-loading`);
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }
    
    _hideLoading() {
        const overlay = document.getElementById(`${this.elementId}-loading`);
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    _updateThemeStyles() {
        const theme = this.themeManager.getTheme();
        const mapElement = document.getElementById(this.elementId);
        
        if (mapElement) {
            // Set theme attribute for CSS styling
            mapElement.setAttribute('data-theme', theme);
        }
        
        // Update legend if present
        if (this.legend) {
            this._updateLegend();
        }
    }
    
    _addPhilippinesOutline() {
        fetch('./data/philippines_outline.geojson')
            .then(response => response.json())
            .then(data => {
                const theme = this.themeManager.getTheme();
                const outlineColor = theme === 'tbwa' ? '#0057B8' : '#FF5500';
                
                L.geoJSON(data, {
                    style: {
                        color: outlineColor,
                        weight: 2,
                        opacity: 0.6,
                        fillColor: outlineColor,
                        fillOpacity: 0.1
                    }
                }).addTo(this.map);
            })
            .catch(error => {
                console.warn('Philippines outline not loaded:', error);
            });
    }
    
    _createLegend() {
        // Create a custom legend control
        this.legendControl = L.control({ position: 'bottomright' });
        
        this.legendControl.onAdd = () => {
            this.legend = L.DomUtil.create('div', 'map-legend');
            this._updateLegend();
            return this.legend;
        };
        
        this.legendControl.addTo(this.map);
    }
    
    _updateLegend() {
        if (!this.legend) return;
        
        const metricKey = this.options.metricKey;
        const colorScale = this.options.colorScales[metricKey] || this.options.colorScales.sales_30d;
        const metricLabel = this._getMetricLabel(metricKey);
        
        // Format value ranges
        const min = this._formatMetricValue(this.metricRange.min, metricKey);
        const mid = this._formatMetricValue((this.metricRange.min + this.metricRange.max) / 2, metricKey);
        const max = this._formatMetricValue(this.metricRange.max, metricKey);
        
        // Create legend content
        this.legend.innerHTML = `
            <h4>${metricLabel}</h4>
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${colorScale[2]};"></span>
                    <span class="legend-label">High: ${max}</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${colorScale[1]};"></span>
                    <span class="legend-label">Medium: ${mid}</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${colorScale[0]};"></span>
                    <span class="legend-label">Low: ${min}</span>
                </div>
            </div>
            <div class="legend-note">Bubble size indicates relative value</div>
        `;
    }
    
    async loadData(filters = {}) {
        this._showLoading();
        
        try {
            // Check if SQL connector is available
            if (window.sqlConnector) {
                // Get store data from SQL connector
                const stores = await window.sqlConnector.getStores();
                const metrics = await window.sqlConnector.getStoreMetrics();
                
                // Combine stores and metrics data
                this.data = this._processStoreData(stores, metrics);
            } else if (window.dashboardController && window.dashboardController.dataConnector) {
                // Use dashboard controller's data connector
                const retailData = await window.dashboardController.dataConnector.getRetailPerformance(filters);
                this.data = retailData.stores || [];
            } else {
                // Fallback to fetch from JSON file
                await this._loadSampleData();
            }
            
            // Calculate initial metric range
            this._calculateMetricRange();
            
            // Update markers
            this.updateMarkers();
            
            // Update legend
            if (this.options.showLegend) {
                this._updateLegend();
            }
            
            // Hide loading overlay
            this._hideLoading();
        } catch (error) {
            console.error('Error loading store data:', error);
            // Fallback to sample data
            await this._loadSampleData();
            this._hideLoading();
        }
    }
    
    async _loadSampleData() {
        // Try to load enhanced store locations if available
        try {
            const response = await fetch('./data/sample_data/enhanced_store_locations.json');
            const data = await response.json();
            
            // Convert to our store format
            this.data = data.locations.map(store => ({
                id: store.store_id,
                name: store.name,
                storeType: store.store_type,
                owner: store.owner,
                contactNumber: store.contact_number,
                address: `${store.address.street}, ${store.address.barangay}, ${store.address.city_municipality}`,
                fullAddress: {
                    street: store.address.street,
                    barangay: store.address.barangay,
                    cityMunicipality: store.address.city_municipality,
                    province: store.address.province,
                    region: store.address.region,
                    postalCode: store.address.postal_code
                },
                region: store.address.region,
                lat: store.geolocation.latitude,
                lng: store.geolocation.longitude,
                metrics: {
                    sales_30d: store.metrics.sales_30d,
                    sales_7d: store.metrics.sales_7d,
                    customer_count_30d: store.metrics.customer_count_30d,
                    average_basket_size: store.metrics.average_basket_size,
                    growth_rate: store.metrics.growth_rate
                },
                topBrands: store.top_brands,
                topCategories: store.top_categories
            }));
        } catch (error) {
            console.warn('Could not load enhanced store locations:', error);
            
            // Fallback to simpler GeoJSON if available
            try {
                const response = await fetch('./data/sample_data/enhanced_stores.geojson');
                const data = await response.json();
                
                // Convert GeoJSON to our store format
                this.data = data.features.map(feature => {
                    const p = feature.properties;
                    return {
                        id: p.store_id,
                        name: p.name,
                        storeType: p.store_type,
                        owner: p.owner,
                        contactNumber: p.contact_number,
                        address: `${p.street}, ${p.barangay}, ${p.city_municipality}`,
                        fullAddress: {
                            street: p.street,
                            barangay: p.barangay,
                            cityMunicipality: p.city_municipality,
                            province: p.province,
                            region: p.region,
                            postalCode: p.postal_code
                        },
                        region: p.region,
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        metrics: {
                            sales_30d: p.sales_30d,
                            sales_7d: p.sales_7d,
                            customer_count_30d: p.customer_count_30d,
                            average_basket_size: p.average_basket_size,
                            growth_rate: p.growth_rate
                        },
                        topBrands: p.top_brands,
                        topCategories: p.top_categories
                    };
                });
            } catch (error) {
                console.error('Could not load any store data:', error);
                // Create dummy data as last resort
                this.data = this._getSimulatedStoreData();
            }
        }
    }
    
    _processStoreData(stores, metrics) {
        return stores.map(store => {
            // Find matching metrics
            const storeMetrics = metrics.find(m => m.store_id === store.store_id) || {};
            
            return {
                id: store.store_id,
                name: store.store_name,
                storeType: store.store_type_name,
                owner: store.owner,
                contactNumber: store.contact_number,
                address: `${store.street_address}, ${store.barangay_name}, ${store.city_municipality}`,
                fullAddress: {
                    street: store.street_address,
                    barangay: store.barangay_name,
                    cityMunicipality: store.city_municipality,
                    province: store.province_name,
                    region: store.region_name,
                    postalCode: store.postal_code
                },
                region: store.region_name,
                lat: store.latitude,
                lng: store.longitude,
                metrics: {
                    sales_30d: storeMetrics.sales_30d || 0,
                    sales_7d: storeMetrics.sales_7d || 0,
                    customer_count_30d: storeMetrics.customer_count_30d || 0,
                    average_basket_size: storeMetrics.average_basket_size || 0,
                    growth_rate: storeMetrics.growth_rate_pct || 0,
                    stockouts: Math.floor(Math.random() * 10) // Simulated stockouts
                }
            };
        });
    }
    
    _calculateMetricRange() {
        if (!this.data || this.data.length === 0) return;
        
        const metricKey = this.options.metricKey;
        const values = this.data.map(store => {
            return store.metrics[metricKey] || 0;
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
        
        // Apply filters to data if available
        this.filteredData = this.data;
        
        // Create markers for each store
        this.filteredData.forEach(store => {
            const marker = this._createStoreMarker(store, metricKey);
            this.markers.push(marker);
            marker.addTo(this.markerLayer);
        });
    }
    
    _createStoreMarker(store, metricKey) {
        // Use fallback value of 0 if the metric doesn't exist
        const value = store.metrics[metricKey] || 0;
        const normalizedValue = this._normalizeValue(value, this.metricRange.min, this.metricRange.max);
        
        // Calculate radius based on normalized value
        const radius = this._calculateRadius(normalizedValue);
        
        // Determine color based on metric type and value
        const color = this._getColorForValue(normalizedValue, metricKey);
        
        // Format the metric value for display
        const formattedValue = this._formatMetricValue(value, metricKey);
        
        // Create circle marker
        const marker = L.circleMarker([store.lat, store.lng], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        // Add tooltip
        marker.bindTooltip(`
            <div class="store-tooltip">
                <h4 class="tooltip-title">${store.name}</h4>
                <p class="tooltip-address">${store.address}</p>
                <div class="tooltip-type">${store.storeType}</div>
                <div class="tooltip-metric">
                    <span class="metric-name">${this._getMetricLabel(metricKey)}:</span>
                    <span class="metric-value">${formattedValue}</span>
                </div>
            </div>
        `, {
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
    
    _handleMarkerClick(store) {
        // Dispatch event to open the drill-down drawer with store details
        window.dispatchEvent(new CustomEvent('openStoreDetail', { 
            detail: { 
                storeId: store.id,
                store: store
            }
        }));
        
        // Alternative approach if the event isn't handled
        if (typeof window.toggleDrillDown === 'function') {
            // Set up the store drill-down content
            this._populateStoreDetailView(store);
            
            // Open the drill-down drawer
            window.toggleDrillDown('storeDrillDown');
        }
    }
    
    _populateStoreDetailView(store) {
        // Get the drill-down container
        const drillDown = document.getElementById('storeDrillDown');
        if (!drillDown) {
            console.warn('Store drill-down container not found');
            return;
        }
        
        // Set the title
        const drillDownTitle = document.getElementById('drillDownTitle');
        if (drillDownTitle) {
            drillDownTitle.textContent = `Store Details: ${store.name}`;
        }
        
        // Create store detail content
        drillDown.innerHTML = `
            <div class="store-detail">
                <div class="store-header">
                    <div class="store-info">
                        <h3>${store.name}</h3>
                        <p class="store-address">${store.address}</p>
                        <span class="store-type">${store.storeType}</span>
                    </div>
                    <div class="store-contact">
                        <p><strong>Owner:</strong> ${store.owner}</p>
                        <p><strong>Contact:</strong> ${store.contactNumber}</p>
                        <p><strong>Region:</strong> ${store.region}</p>
                    </div>
                </div>
                
                <div class="store-metrics-grid">
                    <div class="metric-card">
                        <h4>Monthly Sales</h4>
                        <div class="metric-value">₱ ${this._formatNumber(store.metrics.sales_30d)}</div>
                        <div class="metric-change positive">+${store.metrics.growth_rate}%</div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Weekly Sales</h4>
                        <div class="metric-value">₱ ${this._formatNumber(store.metrics.sales_7d)}</div>
                        <div class="metric-change positive">+${Math.round(store.metrics.growth_rate * 0.8)}%</div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Customers</h4>
                        <div class="metric-value">${store.metrics.customer_count_30d}</div>
                        <div class="metric-change positive">+${Math.round(store.metrics.growth_rate * 0.5)}%</div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Basket Size</h4>
                        <div class="metric-value">₱ ${store.metrics.average_basket_size}</div>
                        <div class="metric-change neutral">+0.8%</div>
                    </div>
                </div>
                
                <div class="store-charts">
                    <div class="chart-section">
                        <h4>Sales Performance</h4>
                        <div class="chart-container">
                            <canvas id="storeSalesChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-section top-categories">
                        <h4>Top Categories</h4>
                        <ul class="categories-list">
                            ${this._generateCategoryListItems(store)}
                        </ul>
                    </div>
                </div>
                
                <div class="store-actions">
                    <button class="btn btn-primary" id="viewStoreReport">View Full Report</button>
                    <button class="btn btn-secondary" id="exportStoreData">Export Data</button>
                </div>
            </div>
        `;
        
        // Initialize sales chart
        setTimeout(() => {
            this._initializeSalesChart(store);
            
            // Add event listeners to buttons
            const viewReportBtn = document.getElementById('viewStoreReport');
            if (viewReportBtn) {
                viewReportBtn.addEventListener('click', () => {
                    alert(`Full report for ${store.name} would open in a new tab`);
                });
            }
            
            const exportDataBtn = document.getElementById('exportStoreData');
            if (exportDataBtn) {
                exportDataBtn.addEventListener('click', () => {
                    alert(`Data for ${store.name} would be exported`);
                });
            }
        }, 100);
    }
    
    _generateCategoryListItems(store) {
        const topCategories = store.topCategories || ['Beverage', 'Snack', 'Dairy'];
        const topBrands = store.topBrands || ['Del Monte', 'Oishi', 'Alaska'];
        
        // Generate random percentages that sum to 100%
        const total = 100;
        let remaining = total;
        const percentages = [];
        
        for (let i = 0; i < topCategories.length - 1; i++) {
            // Leave at least 5% for the last category
            const max = remaining - 5 * (topCategories.length - i - 1);
            const min = 5;
            const percent = Math.floor(Math.random() * (max - min + 1)) + min;
            percentages.push(percent);
            remaining -= percent;
        }
        percentages.push(remaining);
        
        // Create list items
        return topCategories.map((category, index) => {
            const percent = percentages[index];
            const brand = topBrands[index % topBrands.length];
            
            return `
                <li class="category-item">
                    <div class="category-info">
                        <span class="category-name">${category}</span>
                        <span class="category-percent">${percent}%</span>
                    </div>
                    <div class="category-bar-container">
                        <div class="category-bar" style="width: ${percent}%"></div>
                    </div>
                    <div class="category-brand">Top brand: ${brand}</div>
                </li>
            `;
        }).join('');
    }
    
    _initializeSalesChart(store) {
        const canvas = document.getElementById('storeSalesChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Generate 6 months of data
        const labels = [];
        const data = [];
        
        // Get month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        
        // Generate data for the last 6 months
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12; // Handle wrap-around
            labels.push(monthNames[monthIndex]);
            
            // Generate sales data with a general upward trend
            const baseSales = store.metrics.sales_30d / 6;
            const growthFactor = 1 + (store.metrics.growth_rate / 100) * (i / 5);
            const randomVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
            
            data.push(Math.round(baseSales * growthFactor * randomVariation));
        }
        
        // Get theme colors
        const theme = this.themeManager.getTheme();
        const primaryColor = theme === 'tbwa' ? '#0057B8' : '#FF5500';
        
        // Create the chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Sales',
                    data: data,
                    backgroundColor: primaryColor,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₱ ${new Intl.NumberFormat().format(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '₱ ' + new Intl.NumberFormat().format(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    _normalizeValue(value, min, max) {
        // If min and max are the same, return mid-point
        if (min === max) return 0.5;
        
        // Calculate normalized value between 0 and 1
        return (value - min) / (max - min);
    }
    
    _calculateRadius(normalizedValue) {
        const { bubbleMinRadius, bubbleMaxRadius } = this.options;
        return bubbleMinRadius + normalizedValue * (bubbleMaxRadius - bubbleMinRadius);
    }
    
    _getColorForValue(normalizedValue, metricKey) {
        const colorScale = this.options.colorScales[metricKey] || this.options.colorScales.sales_30d;
        
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
            case 'sales_30d':
            case 'sales_7d':
                return `₱ ${this._formatNumber(value)}`;
            case 'customer_count_30d':
                return `${value} customers`;
            case 'average_basket_size':
                return `₱ ${value}`;
            case 'growth_rate':
                return `${value}%`;
            case 'stockouts':
                return `${value} items`;
            default:
                return value.toString();
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
            sales_30d: 'Monthly Sales',
            sales_7d: 'Weekly Sales',
            customer_count_30d: 'Customer Count',
            average_basket_size: 'Basket Size',
            growth_rate: 'Growth Rate',
            stockouts: 'Stockouts'
        };
        return labels[metricKey] || metricKey;
    }
    
    _getSimulatedStoreData() {
        // Simulate data for Philippines regions
        return [
            {
                id: "store-ncr-1",
                name: "NCR Supermarket 1",
                storeType: "Supermarket",
                owner: "Juan dela Cruz",
                contactNumber: "+63-917-123-4567",
                address: "123 Manila Ave., Makati",
                fullAddress: {
                    street: "123 Manila Ave.",
                    barangay: "Poblacion",
                    cityMunicipality: "Makati",
                    province: "Metro Manila",
                    region: "NCR",
                    postalCode: "1210"
                },
                region: "NCR",
                lat: 14.5995,
                lng: 120.9842,
                metrics: {
                    sales_30d: 58000,
                    sales_7d: 12500,
                    customer_count_30d: 420,
                    average_basket_size: 138,
                    growth_rate: 8.5,
                    stockouts: 2
                },
                topBrands: ["Del Monte", "Oishi", "Alaska"],
                topCategories: ["Beverage", "Snack", "Dairy"]
            },
            {
                id: "store-luzon-1",
                name: "Luzon Grocery Store",
                storeType: "Grocery",
                owner: "Maria Santos",
                contactNumber: "+63-918-234-5678",
                address: "45 Provincial Road, Baguio",
                fullAddress: {
                    street: "45 Provincial Road",
                    barangay: "Burnham",
                    cityMunicipality: "Baguio",
                    province: "Benguet",
                    region: "CAR",
                    postalCode: "2600"
                },
                region: "CAR",
                lat: 16.4023,
                lng: 120.5960,
                metrics: {
                    sales_30d: 42000,
                    sales_7d: 9000,
                    customer_count_30d: 310,
                    average_basket_size: 135,
                    growth_rate: 6.2,
                    stockouts: 4
                },
                topBrands: ["Alaska", "Del Monte", "Champion"],
                topCategories: ["Dairy", "Beverage", "Household"]
            },
            {
                id: "store-visayas-1",
                name: "Visayas Mini Mart",
                storeType: "Mini Mart",
                owner: "Pedro Reyes",
                contactNumber: "+63-919-345-6789",
                address: "67 Osmeña Blvd., Cebu City",
                fullAddress: {
                    street: "67 Osmeña Blvd.",
                    barangay: "Lahug",
                    cityMunicipality: "Cebu City",
                    province: "Cebu",
                    region: "Central Visayas",
                    postalCode: "6000"
                },
                region: "Central Visayas",
                lat: 10.3157,
                lng: 123.8854,
                metrics: {
                    sales_30d: 36500,
                    sales_7d: 7800,
                    customer_count_30d: 280,
                    average_basket_size: 130,
                    growth_rate: 7.8,
                    stockouts: 3
                },
                topBrands: ["Oishi", "Del Monte", "Peerless"],
                topCategories: ["Snack", "Beverage", "Personal Care"]
            },
            {
                id: "store-mindanao-1",
                name: "Mindanao Sari-Sari Store",
                storeType: "Sari-Sari Store",
                owner: "Abdul Rahman",
                contactNumber: "+63-920-456-7890",
                address: "22 Bangsamoro St., Davao",
                fullAddress: {
                    street: "22 Bangsamoro St.",
                    barangay: "Poblacion",
                    cityMunicipality: "Davao City",
                    province: "Davao del Sur",
                    region: "Davao",
                    postalCode: "8000"
                },
                region: "Davao",
                lat: 7.1907,
                lng: 125.4553,
                metrics: {
                    sales_30d: 28700,
                    sales_7d: 6100,
                    customer_count_30d: 210,
                    average_basket_size: 136,
                    growth_rate: 9.3,
                    stockouts: 5
                },
                topBrands: ["Peerless", "Alaska", "Oishi"],
                topCategories: ["Household", "Dairy", "Snack"]
            }
        ];
    }
    
    // PUBLIC METHODS
    
    // Set the metric to be displayed
    setMetric(metricKey) {
        if (!this.options.colorScales[metricKey]) {
            console.warn(`Unknown metric key: ${metricKey}`);
            return;
        }
        
        this.options.metricKey = metricKey;
        this._calculateMetricRange();
        this.updateMarkers();
        
        if (this.options.showLegend) {
            this._updateLegend();
        }
    }
    
    // Apply filters to the map
    applyFilters(filters = {}) {
        // Store the filters
        this.filters = filters;
        
        // Filter data based on criteria
        this.filteredData = this.data.filter(store => {
            // Region filter
            if (filters.region && filters.region !== 'all') {
                // Handle different region spelling/capitalization
                const storeRegion = store.region.toLowerCase();
                const filterRegion = filters.region.toLowerCase();
                
                if (!storeRegion.includes(filterRegion) && !filterRegion.includes(storeRegion)) {
                    return false;
                }
            }
            
            // Store type filter
            if (filters.storeType && filters.storeType !== 'all') {
                const storeType = store.storeType.toLowerCase();
                const filterType = filters.storeType.toLowerCase();
                
                if (!storeType.includes(filterType) && !filterType.includes(storeType)) {
                    return false;
                }
            }
            
            // Add more filters as needed
            
            return true;
        });
        
        // Recalculate metric range for filtered data
        const metricKey = this.options.metricKey;
        const values = this.filteredData.map(store => store.metrics[metricKey] || 0);
        
        if (values.length > 0) {
            this.metricRange = {
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }
        
        // Update markers
        this.updateMarkers();
        
        // Update legend
        if (this.options.showLegend) {
            this._updateLegend();
        }
        
        // If a region was specified, zoom to that region
        if (filters.region && filters.region !== 'all') {
            this.setRegionView(filters.region);
        }
    }
    
    // Resize the map (call when container size changes)
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
    
    // Set the map view to a specific region
    setRegionView(region) {
        if (!this.map) return;
        
        // Normalize region name
        region = region.toLowerCase();
        
        // Define region views
        const regionViews = {
            'ncr': { center: [14.5995, 120.9842], zoom: 11 },
            'metro manila': { center: [14.5995, 120.9842], zoom: 11 },
            'car': { center: [16.4023, 120.5960], zoom: 9 },
            'cordillera': { center: [16.4023, 120.5960], zoom: 9 },
            'ilocos': { center: [17.5508, 120.7220], zoom: 9 },
            'cagayan valley': { center: [16.9754, 121.8107], zoom: 8 },
            'central luzon': { center: [15.4755, 120.5963], zoom: 9 },
            'calabarzon': { center: [14.1008, 121.0794], zoom: 9 },
            'mimaropa': { center: [12.8797, 121.1731], zoom: 8 },
            'bicol': { center: [13.4213, 123.4142], zoom: 8 },
            'western visayas': { center: [11.0050, 122.5373], zoom: 8 },
            'central visayas': { center: [10.3157, 123.8854], zoom: 9 },
            'eastern visayas': { center: [11.2543, 125.0008], zoom: 8 },
            'zamboanga': { center: [8.1527, 123.2660], zoom: 8 },
            'northern mindanao': { center: [8.4542, 124.6319], zoom: 8 },
            'davao': { center: [7.1907, 125.4553], zoom: 9 },
            'soccsksargen': { center: [6.2705, 124.6873], zoom: 8 },
            'caraga': { center: [8.8015, 125.7407], zoom: 8 },
            'barmm': { center: [7.0085, 124.2928], zoom: 8 },
            'bangsamoro': { center: [7.0085, 124.2928], zoom: 8 },
            'all': { center: [12.8797, 121.7740], zoom: 6 }
        };
        
        // Find the matching region or use a close match
        let regionView = regionViews.all; // Default to all Philippines
        
        for (const [key, view] of Object.entries(regionViews)) {
            if (region.includes(key) || key.includes(region)) {
                regionView = view;
                break;
            }
        }
        
        // Set the view
        this.map.setView(regionView.center, regionView.zoom);
    }
}

// Export the StoreMap class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoreMap;
}