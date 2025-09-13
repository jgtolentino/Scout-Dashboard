/**
 * TBWA Client 360 Dashboard - Store Map Module
 * This file handles the geospatial store map functionality
 */

class StoreMap {
    constructor(elementId, options = {}) {
        this.elementId = elementId;
        this.options = {
            center: [14.6, 121.0], // Default center (Philippines)
            zoom: 6,
            metricKey: 'sales',
            ...options
        };
        this.map = null;
        this.markers = [];
        this.storeData = [];
        
        this.init();
    }
    
    init() {
        // Initialize the map
        this.map = L.map(this.elementId).setView(this.options.center, this.options.zoom);
        
        // Add the tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add scale control
        L.control.scale().addTo(this.map);
        
        // Register events
        this.registerEvents();
    }
    
    registerEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.map) {
                this.map.invalidateSize();
            }
        });
        
        // Handle metric change
        document.addEventListener('metricChange', (e) => {
            if (e.detail && e.detail.metricKey) {
                this.options.metricKey = e.detail.metricKey;
                this.updateMarkers();
            }
        });
        
        // Handle filter changes
        document.addEventListener('filterChange', () => {
            this.loadData();
        });
    }
    
    loadData() {
        // In a real implementation, this would fetch data from the DLT connector
        // For now, we'll use simulated data
        const simulatedStores = [
            { id: 'sari-112', name: 'Store 112', lat: 14.656, lng: 121.029, sales: 428000, stockouts: 12, uptime: 98.5, region: 'NCR' },
            { id: 'sari-115', name: 'Store 115', lat: 14.632, lng: 120.982, sales: 345000, stockouts: 8, uptime: 99.2, region: 'NCR' },
            { id: 'sari-118', name: 'Store 118', lat: 14.587, lng: 121.056, sales: 382000, stockouts: 15, uptime: 97.8, region: 'NCR' },
            { id: 'sari-120', name: 'Store 120', lat: 14.701, lng: 121.112, sales: 298000, stockouts: 5, uptime: 99.5, region: 'NCR' },
            { id: 'sari-125', name: 'Store 125', lat: 14.568, lng: 121.023, sales: 412000, stockouts: 10, uptime: 98.1, region: 'NCR' },
            { id: 'sari-201', name: 'Store 201', lat: 16.412, lng: 120.596, sales: 275000, stockouts: 18, uptime: 96.3, region: 'Luzon' },
            { id: 'sari-205', name: 'Store 205', lat: 15.987, lng: 120.812, sales: 315000, stockouts: 9, uptime: 97.9, region: 'Luzon' },
            { id: 'sari-208', name: 'Store 208', lat: 15.326, lng: 119.968, sales: 285000, stockouts: 14, uptime: 96.8, region: 'Luzon' },
            { id: 'sari-212', name: 'Store 212', lat: 13.945, lng: 121.612, sales: 265000, stockouts: 11, uptime: 97.2, region: 'Luzon' },
            { id: 'sari-301', name: 'Store 301', lat: 10.315, lng: 123.885, sales: 195000, stockouts: 20, uptime: 95.7, region: 'Visayas' },
            { id: 'sari-305', name: 'Store 305', lat: 10.712, lng: 122.562, sales: 220000, stockouts: 16, uptime: 96.5, region: 'Visayas' },
            { id: 'sari-308', name: 'Store 308', lat: 11.245, lng: 124.982, sales: 185000, stockouts: 22, uptime: 94.8, region: 'Visayas' },
            { id: 'sari-401', name: 'Store 401', lat: 7.192, lng: 125.455, sales: 165000, stockouts: 25, uptime: 93.5, region: 'Mindanao' },
            { id: 'sari-405', name: 'Store 405', lat: 8.487, lng: 124.652, sales: 152000, stockouts: 19, uptime: 95.2, region: 'Mindanao' },
            { id: 'sari-408', name: 'Store 408', lat: 6.913, lng: 122.065, sales: 143000, stockouts: 21, uptime: 94.6, region: 'Mindanao' }
        ];
        
        // Apply filters
        let filteredStores = simulatedStores;
        const regionFilter = document.querySelector('select[data-filter-type="region"]');
        if (regionFilter && regionFilter.value !== 'all') {
            filteredStores = simulatedStores.filter(store => store.region === regionFilter.value);
        }
        
        this.storeData = filteredStores;
        this.updateMarkers();
    }
    
    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        // Add new markers
        this.storeData.forEach(store => {
            // Determine marker style based on metric key
            const metricValue = store[this.options.metricKey];
            const radius = this.calculateRadius(metricValue);
            const color = this.calculateColor(metricValue, this.options.metricKey);
            
            // Create marker
            const marker = L.circleMarker([store.lat, store.lng], {
                radius: radius,
                fillColor: color,
                color: '#FFFFFF',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7
            });
            
            // Add tooltip
            marker.bindTooltip(this.createTooltipContent(store), {
                direction: 'top',
                offset: [0, -8],
                opacity: 1
            });
            
            // Add click event
            marker.on('click', () => this.handleMarkerClick(store));
            
            // Add to map and store reference
            marker.addTo(this.map);
            this.markers.push(marker);
        });
        
        // Adjust map view if needed
        if (this.markers.length > 0) {
            const bounds = L.featureGroup(this.markers).getBounds();
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    calculateRadius(value) {
        // Scale the radius based on the metric value
        const metricKey = this.options.metricKey;
        
        if (metricKey === 'sales') {
            // For sales, use a logarithmic scale
            return Math.log(value / 10000) * 2;
        } else if (metricKey === 'stockouts') {
            // For stockouts, use a linear scale
            return Math.sqrt(value) * 1.5;
        } else if (metricKey === 'uptime') {
            // For uptime, use a fixed size
            return 6;
        } else {
            // Default
            return 5;
        }
    }
    
    calculateColor(value, metricKey) {
        // Determine color based on metric and value
        if (metricKey === 'sales') {
            // Green gradient for sales (more sales = darker green)
            const normalizedValue = Math.min(Math.max(value / 500000, 0), 1);
            return this.interpolateColor('#BDEFB3', '#1B5E20', normalizedValue);
        } else if (metricKey === 'stockouts') {
            // Red gradient for stockouts (more stockouts = darker red)
            const normalizedValue = Math.min(Math.max(value / 30, 0), 1);
            return this.interpolateColor('#FFCDD2', '#B71C1C', normalizedValue);
        } else if (metricKey === 'uptime') {
            // Blue gradient for uptime (higher uptime = darker blue)
            const normalizedValue = Math.min(Math.max((value - 90) / 10, 0), 1);
            return this.interpolateColor('#BBDEFB', '#0D47A1', normalizedValue);
        } else {
            // Default color
            return '#3B82F6';
        }
    }
    
    interpolateColor(color1, color2, factor) {
        // Convert hex colors to RGB
        const hex2rgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        
        // Convert RGB to hex
        const rgb2hex = (rgb) => {
            return '#' + rgb.map(v => {
                const hex = Math.round(v).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        };
        
        // Interpolate between two colors
        const rgb1 = hex2rgb(color1);
        const rgb2 = hex2rgb(color2);
        const result = rgb1.map((c, i) => Math.round(c + factor * (rgb2[i] - c)));
        
        return rgb2hex(result);
    }
    
    createTooltipContent(store) {
        // Format metric value
        let metricValue;
        if (this.options.metricKey === 'sales') {
            metricValue = `₱ ${(store.sales / 1000).toFixed(0)}K`;
        } else if (this.options.metricKey === 'stockouts') {
            metricValue = `${store.stockouts} items`;
        } else if (this.options.metricKey === 'uptime') {
            metricValue = `${store.uptime.toFixed(1)}%`;
        } else {
            metricValue = store[this.options.metricKey];
        }
        
        // Create tooltip content
        return `
            <div class="store-tooltip">
                <h3 class="font-semibold text-gray-800">${store.name}</h3>
                <p class="text-sm text-gray-600">Region: ${store.region}</p>
                <div class="mt-2 pt-2 border-t border-gray-200">
                    <p class="font-medium">${this.getMetricName()}: ${metricValue}</p>
                </div>
            </div>
        `;
    }
    
    getMetricName() {
        // Get formatted metric name
        switch (this.options.metricKey) {
            case 'sales':
                return 'Total Sales';
            case 'stockouts':
                return 'Stockout Count';
            case 'uptime':
                return 'Device Uptime';
            default:
                return this.options.metricKey.charAt(0).toUpperCase() + this.options.metricKey.slice(1);
        }
    }
    
    handleMarkerClick(store) {
        // Dispatch event to open drill-down drawer for this store
        window.dispatchEvent(new CustomEvent('openStoreDetail', { 
            detail: { 
                storeId: store.id,
                storeName: store.name,
                storeRegion: store.region
            }
        }));
    }
    
    setMetric(metricKey) {
        // Update the metric and refresh the map
        this.options.metricKey = metricKey;
        this.updateMarkers();
    }
    
    resize() {
        // Invalidate the map size when container is resized
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create metric selector element
    const metricSelector = document.getElementById('mapMetricSelector');
    if (metricSelector) {
        metricSelector.addEventListener('change', (e) => {
            // Dispatch metric change event
            document.dispatchEvent(new CustomEvent('metricChange', {
                detail: { metricKey: e.target.value }
            }));
        });
    }
});