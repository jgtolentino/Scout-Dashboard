/**
 * Map Interaction Handler
 * Handles map marker clicks and store information display
 */
class MapInteractionHandler {
    constructor(mapContainerId = 'performance-map', options = {}) {
        this.mapContainerId = mapContainerId;
        this.options = {
            defaultZoom: 6,
            center: [121.7740, 12.8797], // Philippines center
            markerSize: 8,
            ...options
        };
        
        this.map = null;
        this.storeData = null;
        this.currentPopup = null;
        this.currentDrawer = null;
        
        this.init();
    }

    async init() {
        await this.loadStoreData();
        this.initializeMap();
        this.bindEvents();
    }

    async loadStoreData() {
        try {
            // Use simulation API client if available
            if (window.simApiClient && window.simApiClient.isSimulationMode()) {
                const response = await window.simApiClient.loadSimulationData('stores.geojson');
                this.storeData = await response.json();
            } else {
                const response = await fetch('/api/stores.geojson');
                this.storeData = await response.json();
            }
        } catch (error) {
            console.error('Failed to load store data:', error);
            // Fallback store data
            this.storeData = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [120.9842, 14.5995] },
                        properties: {
                            store_id: "demo-001",
                            name: "Demo Store",
                            location: "Metro Manila",
                            revenue: 250000,
                            performance_score: 85.0
                        }
                    }
                ]
            };
        }
    }

    initializeMap() {
        const container = document.getElementById(this.mapContainerId);
        if (!container) {
            console.error(`Map container '${this.mapContainerId}' not found`);
            return;
        }

        // Create map visualization
        this.renderMapVisualization(container);
        this.addMapMarkers();
    }

    renderMapVisualization(container) {
        // Create SVG-based map for demo purposes (lightweight alternative to full mapping library)
        container.innerHTML = `
            <div class="map-wrapper">
                <div class="map-header">
                    <h4>Store Locations & Performance</h4>
                    <div class="map-controls">
                        <button class="map-btn" data-action="zoom-in" title="Zoom In">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="map-btn" data-action="zoom-out" title="Zoom Out">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="map-btn" data-action="reset-view" title="Reset View">
                            <i class="fas fa-home"></i>
                        </button>
                    </div>
                </div>
                
                <div class="map-container">
                    <svg class="map-svg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                        <!-- Philippines outline (simplified) -->
                        <path class="country-outline" d="M200,150 Q250,100 300,120 L350,140 Q400,130 450,150 L500,180 Q520,200 510,250 L480,300 Q460,350 420,380 L380,400 Q340,420 300,410 L250,390 Q200,370 180,320 L160,270 Q150,220 170,180 Z" 
                              fill="#e8f4f8" stroke="#4a90a4" stroke-width="2"/>
                        
                        <!-- Store markers will be added here -->
                        <g class="store-markers"></g>
                    </svg>
                    
                    <div class="map-legend">
                        <div class="legend-item">
                            <div class="legend-marker" style="background-color: #28a745;"></div>
                            <span>High Performance (90%+)</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-marker" style="background-color: #ffc107;"></div>
                            <span>Good Performance (70-89%)</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-marker" style="background-color: #dc3545;"></div>
                            <span>Needs Improvement (<70%)</span>
                        </div>
                    </div>
                </div>
                
                <div class="map-footer">
                    <div class="map-stats">
                        <div class="stat-item">
                            <span class="stat-value">${this.storeData.features.length}</span>
                            <span class="stat-label">Total Stores</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.getActiveStores()}</span>
                            <span class="stat-label">Active</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.getHighPerformingStores()}</span>
                            <span class="stat-label">High Performance</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addMapStyles();
    }

    addMapMarkers() {
        const markersGroup = document.querySelector('.store-markers');
        if (!markersGroup) return;

        this.storeData.features.forEach((store, index) => {
            const props = store.properties;
            const coords = this.projectCoordinates(store.geometry.coordinates);
            
            const markerColor = this.getMarkerColor(props.performance_score);
            const markerSize = this.getMarkerSize(props.revenue);
            
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            marker.setAttribute('cx', coords.x);
            marker.setAttribute('cy', coords.y);
            marker.setAttribute('r', markerSize);
            marker.setAttribute('fill', markerColor);
            marker.setAttribute('stroke', '#ffffff');
            marker.setAttribute('stroke-width', '2');
            marker.setAttribute('data-store-id', props.store_id);
            marker.setAttribute('class', 'store-marker');
            marker.style.cursor = 'pointer';
            marker.style.transition = 'all 0.3s ease';
            
            // Add hover effects
            marker.addEventListener('mouseenter', () => {
                marker.setAttribute('r', markerSize * 1.3);
                marker.style.filter = 'drop-shadow(0 0 8px rgba(0,0,0,0.3))';
                this.showQuickTooltip(marker, props);
            });
            
            marker.addEventListener('mouseleave', () => {
                marker.setAttribute('r', markerSize);
                marker.style.filter = 'none';
                this.hideQuickTooltip();
            });
            
            // Add click handler
            marker.addEventListener('click', () => {
                this.handleMarkerClick(props);
            });
            
            markersGroup.appendChild(marker);
        });
    }

    projectCoordinates([lng, lat]) {
        // Simple projection for demo (converts lat/lng to SVG coordinates)
        // In production, use proper map projection
        const x = ((lng - 115) / 15) * 800; // Rough conversion for Philippines
        const y = ((20 - lat) / 15) * 600;
        return { x: Math.max(50, Math.min(750, x)), y: Math.max(50, Math.min(550, y)) };
    }

    getMarkerColor(performanceScore) {
        if (performanceScore >= 90) return '#28a745'; // Green - High performance
        if (performanceScore >= 70) return '#ffc107'; // Yellow - Good performance
        return '#dc3545'; // Red - Needs improvement
    }

    getMarkerSize(revenue) {
        // Scale marker size based on revenue
        const minSize = 6;
        const maxSize = 14;
        const maxRevenue = 500000;
        const size = minSize + ((revenue / maxRevenue) * (maxSize - minSize));
        return Math.max(minSize, Math.min(maxSize, size));
    }

    getActiveStores() {
        return this.storeData.features.filter(store => 
            store.properties.status === 'active'
        ).length;
    }

    getHighPerformingStores() {
        return this.storeData.features.filter(store => 
            store.properties.performance_score >= 90
        ).length;
    }

    showQuickTooltip(marker, storeProps) {
        this.hideQuickTooltip(); // Remove any existing tooltip
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-quick-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${storeProps.name}</strong>
                <span class="tooltip-score">${storeProps.performance_score}%</span>
            </div>
            <div class="tooltip-body">
                <div>${storeProps.location}</div>
                <div>Revenue: ₱${storeProps.revenue.toLocaleString()}</div>
            </div>
        `;
        
        // Position tooltip
        const rect = marker.getBoundingClientRect();
        const mapRect = document.querySelector('.map-container').getBoundingClientRect();
        
        tooltip.style.cssText = `
            position: absolute;
            left: ${rect.left - mapRect.left + 20}px;
            top: ${rect.top - mapRect.top - 80}px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            max-width: 200px;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.querySelector('.map-container').appendChild(tooltip);
        this.currentTooltip = tooltip;
    }

    hideQuickTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    handleMarkerClick(storeProps) {
        console.log('Map marker clicked:', storeProps.store_id);
        
        // Hide tooltip
        this.hideQuickTooltip();
        
        // Open detailed store drawer
        this.openStoreDrawer(storeProps);
        
        // Optional: Also trigger any existing drill-down functionality
        if (window.drillDownHandler) {
            // Could integrate with existing drill-down system
            console.log('Could integrate with drill-down system for store:', storeProps.store_id);
        }
    }

    openStoreDrawer(storeProps) {
        // Close any existing drawer
        this.closeStoreDrawer();
        
        const drawer = document.createElement('div');
        drawer.className = 'store-detail-drawer';
        drawer.innerHTML = this.generateStoreDrawerContent(storeProps);
        
        document.body.appendChild(drawer);
        this.currentDrawer = drawer;
        
        // Animate in
        setTimeout(() => {
            drawer.classList.add('open');
        }, 10);
        
        // Add event listeners
        this.addDrawerEventListeners(drawer);
    }

    generateStoreDrawerContent(store) {
        const statusClass = store.status === 'active' ? 'status-active' : 'status-warning';
        const performanceClass = store.performance_score >= 90 ? 'performance-excellent' :
                                store.performance_score >= 70 ? 'performance-good' : 'performance-poor';
        
        return `
            <div class="drawer-header">
                <div class="store-title">
                    <h3>${store.name}</h3>
                    <span class="store-type">${store.type}</span>
                </div>
                <button class="close-btn" aria-label="Close store details">&times;</button>
            </div>
            
            <div class="drawer-content">
                <div class="store-overview">
                    <div class="store-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                    </div>
                    <div class="store-performance ${performanceClass}">
                        <div class="performance-score">${store.performance_score}%</div>
                        <div class="performance-label">Performance Score</div>
                    </div>
                </div>
                
                <div class="store-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
                        <p>${store.address || store.location}</p>
                        ${store.phone ? `<p><i class="fas fa-phone"></i> ${store.phone}</p>` : ''}
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-chart-bar"></i> Performance Metrics</h4>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="metric-value">₱${store.revenue.toLocaleString()}</div>
                                <div class="metric-label">Monthly Revenue</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${store.conversion_rate}%</div>
                                <div class="metric-label">Conversion Rate</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${store.footfall.toLocaleString()}</div>
                                <div class="metric-label">Monthly Footfall</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${store.rating}/5.0</div>
                                <div class="metric-label">Customer Rating</div>
                            </div>
                        </div>
                    </div>
                    
                    ${store.services ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-concierge-bell"></i> Services</h4>
                            <div class="services-tags">
                                ${store.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-info-circle"></i> Store Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Manager:</span>
                                <span class="info-value">${store.manager || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Staff Count:</span>
                                <span class="info-value">${store.staff_count}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Store Size:</span>
                                <span class="info-value">${store.size_sqm} sqm</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Hours:</span>
                                <span class="info-value">${store.opening_hours || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${store.issues ? `
                        <div class="detail-section issues-section">
                            <h4><i class="fas fa-exclamation-triangle"></i> Issues & Improvements</h4>
                            <ul class="issues-list">
                                ${store.issues.map(issue => `<li>${issue}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                <div class="drawer-actions">
                    <button class="btn btn-primary" onclick="window.mapInteractionHandler.viewStoreAnalytics('${store.store_id}')">
                        <i class="fas fa-chart-line"></i>
                        View Analytics
                    </button>
                    <button class="btn btn-secondary" onclick="window.mapInteractionHandler.exportStoreReport('${store.store_id}')">
                        <i class="fas fa-download"></i>
                        Export Report
                    </button>
                </div>
            </div>
        `;
    }

    addDrawerEventListeners(drawer) {
        // Close button
        const closeBtn = drawer.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.closeStoreDrawer());

        // ESC key
        const escListener = (e) => {
            if (e.key === 'Escape') {
                this.closeStoreDrawer();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        // Click outside to close
        const outsideClickListener = (e) => {
            if (!drawer.contains(e.target)) {
                this.closeStoreDrawer();
                document.removeEventListener('click', outsideClickListener);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', outsideClickListener);
        }, 100);
    }

    closeStoreDrawer() {
        if (this.currentDrawer) {
            this.currentDrawer.classList.remove('open');
            setTimeout(() => {
                if (this.currentDrawer && this.currentDrawer.parentNode) {
                    this.currentDrawer.remove();
                }
                this.currentDrawer = null;
            }, 300);
        }
    }

    addMapStyles() {
        const styleId = 'map-interaction-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .map-wrapper {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .map-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }

            .map-header h4 {
                margin: 0;
                color: #333;
                font-size: 1.125rem;
            }

            .map-controls {
                display: flex;
                gap: 0.25rem;
            }

            .map-btn {
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 0.5rem;
                cursor: pointer;
                transition: all 0.2s;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .map-btn:hover {
                background: #007bff;
                color: white;
            }

            .map-container {
                position: relative;
                height: 400px;
                overflow: hidden;
            }

            .map-svg {
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, #e3f2fd 0%, #bbdefb 100%);
            }

            .country-outline {
                transition: fill 0.3s ease;
            }

            .store-marker {
                transition: all 0.3s ease;
            }

            .store-marker:hover {
                transform: scale(1.2);
            }

            .map-legend {
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: rgba(255,255,255,0.95);
                padding: 0.75rem;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                font-size: 0.8rem;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }

            .legend-item:last-child {
                margin-bottom: 0;
            }

            .legend-marker {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 1px solid #fff;
            }

            .map-footer {
                padding: 1rem;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .map-stats {
                display: flex;
                justify-content: space-around;
                text-align: center;
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .stat-value {
                font-size: 1.25rem;
                font-weight: bold;
                color: #007bff;
            }

            .stat-label {
                font-size: 0.75rem;
                color: #6c757d;
                text-transform: uppercase;
            }

            /* Store Detail Drawer Styles */
            .store-detail-drawer {
                position: fixed;
                top: 0;
                right: -500px;
                width: 500px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 20px rgba(0,0,0,0.15);
                z-index: 1001;
                transition: right 0.3s ease;
                overflow-y: auto;
            }

            .store-detail-drawer.open {
                right: 0;
            }

            .drawer-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 1.5rem;
                border-bottom: 1px solid #e9ecef;
                background: #f8f9fa;
            }

            .store-title h3 {
                margin: 0 0 0.25rem 0;
                color: #333;
                font-size: 1.25rem;
            }

            .store-type {
                background: #007bff;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
            }

            .drawer-content {
                padding: 1.5rem;
            }

            .store-overview {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .store-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 500;
            }

            .store-status.status-active {
                color: #28a745;
            }

            .store-status.status-warning {
                color: #ffc107;
            }

            .store-performance {
                text-align: center;
            }

            .performance-score {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 0.25rem;
            }

            .performance-excellent { color: #28a745; }
            .performance-good { color: #ffc107; }
            .performance-poor { color: #dc3545; }

            .performance-label {
                font-size: 0.875rem;
                color: #6c757d;
            }

            .detail-section {
                margin-bottom: 1.5rem;
            }

            .detail-section h4 {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
                color: #333;
                font-size: 1rem;
            }

            .metrics-grid,
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .metric-item,
            .info-item {
                text-align: center;
                padding: 0.75rem;
                background: #f8f9fa;
                border-radius: 6px;
            }

            .metric-value {
                font-size: 1.125rem;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 0.25rem;
            }

            .metric-label {
                font-size: 0.8rem;
                color: #6c757d;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                text-align: left;
            }

            .info-label {
                font-weight: 500;
                color: #6c757d;
            }

            .info-value {
                color: #333;
            }

            .services-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .service-tag {
                background: #e9ecef;
                color: #495057;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
            }

            .issues-section {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 1rem;
            }

            .issues-list {
                margin: 0;
                padding-left: 1.25rem;
            }

            .issues-list li {
                margin-bottom: 0.5rem;
                color: #856404;
            }

            .drawer-actions {
                display: flex;
                gap: 1rem;
                padding: 1.5rem;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
            }

            .btn {
                flex: 1;
                padding: 0.75rem 1rem;
                border-radius: 6px;
                border: none;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: #007bff;
                color: white;
            }

            .btn-primary:hover {
                background: #0056b3;
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background: #545b62;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6c757d;
                padding: 0.25rem;
                line-height: 1;
            }

            .close-btn:hover {
                color: #333;
            }

            @media (max-width: 768px) {
                .store-detail-drawer {
                    width: 100%;
                    right: -100%;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    bindEvents() {
        // Map control buttons
        const mapControls = document.querySelector('.map-controls');
        if (mapControls) {
            mapControls.addEventListener('click', (e) => {
                const btn = e.target.closest('.map-btn');
                if (!btn) return;

                const action = btn.dataset.action;
                this.handleMapControl(action);
            });
        }
    }

    handleMapControl(action) {
        switch (action) {
            case 'zoom-in':
                this.showNotification('Zoom In - Demo Mode', 'info');
                break;
            case 'zoom-out':
                this.showNotification('Zoom Out - Demo Mode', 'info');
                break;
            case 'reset-view':
                this.showNotification('View Reset - Demo Mode', 'info');
                break;
        }
    }

    // Public methods for drawer actions
    viewStoreAnalytics(storeId) {
        this.showNotification(`Opening analytics for store ${storeId}`, 'info');
        // Could integrate with existing drill-down system
    }

    exportStoreReport(storeId) {
        this.showNotification(`Exporting report for store ${storeId}`, 'info');
        // Could integrate with export functionality
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `map-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1002;
            font-size: 0.875rem;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Public API
    getStoreData() {
        return this.storeData;
    }

    getMarkers() {
        return document.querySelectorAll('.store-marker');
    }

    refresh() {
        this.loadStoreData().then(() => {
            this.initializeMap();
        });
    }
}

// Initialize map interaction when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the map container to be available
    setTimeout(() => {
        window.mapInteractionHandler = new MapInteractionHandler();
    }, 1000);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapInteractionHandler;
}