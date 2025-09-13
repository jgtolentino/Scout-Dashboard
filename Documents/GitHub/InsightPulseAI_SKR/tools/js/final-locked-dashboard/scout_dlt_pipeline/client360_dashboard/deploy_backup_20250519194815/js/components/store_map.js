/**
 * TBWA Client 360 Dashboard - Store Map Component
 * This file implements the geospatial store map visualization
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
            }
        }, options);

        this.map = null;
        this.markers = [];
        this.markerLayer = null;
        this.data = [];
        this.colorScale = null;
        this.metricRange = {
            min: 0,
            max: 100
        };
        
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
        
        // Add Philippines outline (optional)
        this._addPhilippinesOutline();
    }
    
    _addPhilippinesOutline() {
        // Simplified Philippines GeoJSON outline
        // This could be replaced with a more detailed GeoJSON if needed
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
            })
            .catch(error => {
                console.warn('Philippines outline not loaded.', error);
            });
    }
    
    async loadData(filters = {}) {
        try {
            // In a real implementation, this would fetch from the Scout DLT pipeline
            // For now, we'll use simulated data
            if (window.dashboardController && window.dashboardController.dataConnector) {
                // Reuse the dashboard controller's data connector if available
                const retailData = await window.dashboardController.dataConnector.getRetailPerformance(filters);
                this.data = this._generateStoreData(retailData);
            } else {
                // Fallback to completely simulated data
                this.data = this._getSimulatedStoreData();
            }
            
            this._calculateMetricRange();
            this.updateMarkers();
        } catch (error) {
            console.error('Error loading store data:', error);
        }
    }
    
    _calculateMetricRange() {
        if (!this.data || this.data.length === 0) return;
        
        const metricKey = this.options.metricKey;
        const values = this.data.map(store => store.metrics[metricKey]);
        
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
            this.markers.push(marker);
            marker.addTo(this.markerLayer);
        });
    }
    
    _createStoreMarker(store, metricKey) {
        const value = store.metrics[metricKey];
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
                <h4 class="font-bold">${store.name}</h4>
                <p>${store.address}</p>
                <div class="metric-value">
                    <strong>${this._getMetricLabel(metricKey)}:</strong> ${formattedValue}
                </div>
                <div class="region">
                    <strong>Region:</strong> ${store.region}
                </div>
                <div class="store-type">
                    <strong>Type:</strong> ${store.type}
                </div>
            </div>
        `, {
            direction: 'top',
            offset: [0, -radius]
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
                storeName: store.name,
                storeRegion: store.region,
                storeMetrics: store.metrics
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
    
    _generateStoreData(retailData) {
        // Generate store data based on retail performance
        const storeData = [];
        
        // Store locations for key regions
        const regionCenters = {
            'NCR': { lat: 14.5995, lng: 120.9842 },
            'Luzon': { lat: 16.0212, lng: 120.2188 },
            'Visayas': { lat: 10.3157, lng: 123.8854 },
            'Mindanao': { lat: 7.1907, lng: 125.4553 }
        };
        
        // Store types to distribute across regions
        const storeTypes = ['Sari-Sari Store', 'Supermarket', 'Convenience Store', 'Department Store'];
        
        // Generate 3-4 stores per region
        retailData.regions.forEach(region => {
            const regionCenter = regionCenters[region.name];
            if (!regionCenter) return;
            
            // Number of stores for this region
            const storeCount = 3 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < storeCount; i++) {
                // Create slight variations in location
                const latOffset = (Math.random() - 0.5) * 0.5;
                const lngOffset = (Math.random() - 0.5) * 0.5;
                
                // Calculate metrics based on region performance
                const salesBase = region.value / storeCount;
                const salesVariation = salesBase * 0.2 * (Math.random() - 0.5);
                
                storeData.push({
                    id: `store-${region.name.toLowerCase()}-${i + 1}`,
                    name: `${region.name} ${storeTypes[i % storeTypes.length]} ${i + 1}`,
                    lat: regionCenter.lat + latOffset,
                    lng: regionCenter.lng + lngOffset,
                    region: region.name,
                    type: storeTypes[i % storeTypes.length],
                    address: `${Math.floor(Math.random() * 100) + 1} Main St., ${region.name}`,
                    metrics: {
                        sales: salesBase + salesVariation,
                        stockouts: Math.floor(Math.random() * 15),
                        uptime: 85 + Math.floor(Math.random() * 15)
                    }
                });
            }
        });
        
        return storeData;
    }
    
    _getSimulatedStoreData() {
        // Completely simulated data if no retail data is available
        return [
            {
                id: "store-ncr-1",
                name: "NCR Supermarket 1",
                lat: 14.5995,
                lng: 120.9842,
                region: "NCR",
                type: "Supermarket",
                address: "123 Manila Ave., NCR",
                metrics: {
                    sales: 58000,
                    stockouts: 2,
                    uptime: 98
                }
            },
            {
                id: "store-ncr-2",
                name: "NCR Convenience Store 2",
                lat: 14.6342,
                lng: 121.0277,
                region: "NCR",
                type: "Convenience Store",
                address: "456 Quezon Blvd., NCR",
                metrics: {
                    sales: 42000,
                    stockouts: 5,
                    uptime: 94
                }
            },
            {
                id: "store-luzon-1",
                name: "Luzon Department Store 1",
                lat: 16.0212,
                lng: 120.2188,
                region: "Luzon",
                type: "Department Store",
                address: "78 Pangasinan St., Luzon",
                metrics: {
                    sales: 37000,
                    stockouts: 8,
                    uptime: 92
                }
            },
            {
                id: "store-visayas-1",
                name: "Visayas Sari-Sari Store 1",
                lat: 10.3157,
                lng: 123.8854,
                region: "Visayas",
                type: "Sari-Sari Store",
                address: "12 Cebu Lane, Visayas",
                metrics: {
                    sales: 24000,
                    stockouts: 12,
                    uptime: 88
                }
            },
            {
                id: "store-mindanao-1",
                name: "Mindanao Supermarket 1",
                lat: 7.1907,
                lng: 125.4553,
                region: "Mindanao",
                type: "Supermarket",
                address: "34 Davao Road, Mindanao",
                metrics: {
                    sales: 29000,
                    stockouts: 7,
                    uptime: 90
                }
            }
        ];
    }
    
    // Public method to filter stores based on dashboard filters
    filterStores(filters = {}) {
        // Implement filter logic based on region, type, etc.
        // This will be connected to the dashboard's filter system
        if (!this.data || this.data.length === 0) return;
        
        let filteredData = [...this.data];
        
        // Apply region filter
        if (filters.region && filters.region !== 'all') {
            filteredData = filteredData.filter(store => 
                store.region.toLowerCase() === filters.region.toLowerCase());
        }
        
        // Apply store type filter
        if (filters.storeType && filters.storeType !== 'all') {
            filteredData = filteredData.filter(store => 
                store.type.toLowerCase() === filters.storeType.toLowerCase());
        }
        
        // Calculate new metric range for filtered data
        const metricKey = this.options.metricKey;
        const values = filteredData.map(store => store.metrics[metricKey]);
        
        this.metricRange = {
            min: Math.min(...values),
            max: Math.max(...values)
        };
        
        // Update markers with filtered data
        this.markerLayer.clearLayers();
        this.markers = [];
        
        filteredData.forEach(store => {
            const marker = this._createStoreMarker(store, metricKey);
            this.markers.push(marker);
            marker.addTo(this.markerLayer);
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
        const { storeId, storeName, storeRegion, storeMetrics } = e.detail;
        
        // Set drill-down title
        const drillDownTitle = document.getElementById('drillDownTitle');
        if (drillDownTitle) {
            drillDownTitle.textContent = `Store Details: ${storeName}`;
        }
        
        // Update metrics visualization
        if (storeMetrics) {
            // Update sales metric
            document.getElementById('storeSalesValue').textContent = `₱ ${formatNumber(storeMetrics.sales)}`;
            document.getElementById('storeSalesBar').style.width = `${(storeMetrics.sales / 100000) * 100}%`;
            
            // Update stockouts metric (inverse scale - lower is better)
            document.getElementById('storeStockoutsValue').textContent = storeMetrics.stockouts;
            document.getElementById('storeStockoutsBar').style.width = `${(storeMetrics.stockouts / 20) * 100}%`;
            
            // Update uptime metric
            document.getElementById('storeUptimeValue').textContent = `${storeMetrics.uptime}%`;
            document.getElementById('storeUptimeBar').style.width = `${storeMetrics.uptime}%`;
            
            // Update metrics table
            const metricsTable = document.getElementById('storeMetricsTable');
            if (metricsTable) {
                metricsTable.innerHTML = '';
                
                // Add sales row
                const salesRow = document.createElement('tr');
                salesRow.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sales</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${formatNumber(storeMetrics.sales)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₱ ${formatNumber(storeMetrics.sales * 0.85)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">+15%</td>
                `;
                metricsTable.appendChild(salesRow);
                
                // Add stockouts row
                const stockoutsRow = document.createElement('tr');
                stockoutsRow.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Stockouts</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${storeMetrics.stockouts}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.round(storeMetrics.stockouts * 1.2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">-20%</td>
                `;
                metricsTable.appendChild(stockoutsRow);
                
                // Add uptime row
                const uptimeRow = document.createElement('tr');
                uptimeRow.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Uptime</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${storeMetrics.uptime}%</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Math.round(storeMetrics.uptime * 0.95)}%</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-500">+5%</td>
                `;
                metricsTable.appendChild(uptimeRow);
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
                            data: generateMonthlyData(storeMetrics.sales),
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