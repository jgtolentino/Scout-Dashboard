/**
 * Enhanced Map Tooltip Component
 * Supports updated location hierarchy fields (Region, CityMunicipality, Barangay)
 * For Client360 Dashboard - May 21, 2025
 */

// Import required dependencies (may vary based on project setup)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency, formatPercentage } from '../utils/formatters';

/**
 * Create enhanced map tooltips with full location hierarchy
 * @param {Object} store - Store data object
 * @param {Object} options - Configuration options
 * @returns {Object} Marker with enhanced tooltip
 */
export function createEnhancedMarker(store, options = {}) {
  // Default configuration
  const config = {
    radius: options.radius || 8,
    fillColor: getMarkerColor(store),
    color: '#fff',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    ...options
  };

  // Create marker at store coordinates
  const marker = L.circleMarker([store.latitude, store.longitude], config);
  
  // Add data attributes for QA overlay and testing
  marker.options.store_id = store.store_id;
  marker.options.uptime = store.uptime;
  marker.options.latency = store.latency;
  marker.options.region = store.region;
  marker.options.city = store.cityMunicipality;
  marker.options.barangay = store.barangay;
  
  // Create enhanced tooltip content with location hierarchy
  const tooltipContent = createTooltipContent(store);
  
  // Bind tooltip with custom options
  marker.bindTooltip(tooltipContent, {
    className: 'store-marker-tooltip',
    direction: 'top',
    offset: [0, -10],
    sticky: false,
    opacity: 0.9
  });
  
  return marker;
}

/**
 * Create tooltip HTML content
 * @param {Object} store - Store data
 * @returns {String} HTML content for tooltip
 */
function createTooltipContent(store) {
  // Format metrics
  const uptimeFormatted = formatPercentage(store.uptime || 0);
  const latencyFormatted = `${store.latency || 0}ms`;
  const salesFormatted = store.sales ? formatCurrency(store.sales) : 'N/A';
  
  // Create location string with hierarchy
  const locationString = createLocationString(store);
  
  // Create tooltip HTML
  return `
    <div class="store-tooltip">
      <div class="store-tooltip-header">
        <strong>${store.store_name || 'Store ' + store.store_id}</strong>
        <span class="store-tooltip-id">#${store.store_id}</span>
      </div>
      
      <div class="store-tooltip-location">
        <i class="fas fa-map-marker-alt"></i> ${locationString}
      </div>
      
      <div class="store-tooltip-metrics">
        <div class="store-tooltip-metric">
          <span class="metric-label">Uptime:</span>
          <span class="metric-value ${getUptimeClass(store.uptime)}">${uptimeFormatted}</span>
        </div>
        
        <div class="store-tooltip-metric">
          <span class="metric-label">Latency:</span>
          <span class="metric-value ${getLatencyClass(store.latency)}">${latencyFormatted}</span>
        </div>
        
        ${store.sales ? `
        <div class="store-tooltip-metric">
          <span class="metric-label">Sales:</span>
          <span class="metric-value">${salesFormatted}</span>
        </div>
        ` : ''}
      </div>
      
      ${store.manager_name ? `
      <div class="store-tooltip-footer">
        <i class="fas fa-user"></i> ${store.manager_name}
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Create formatted location string from hierarchy fields
 * @param {Object} store - Store data
 * @returns {String} Formatted location string
 */
function createLocationString(store) {
  const parts = [];
  
  // Add barangay if available
  if (store.barangay) {
    parts.push(store.barangay);
  }
  
  // Add city/municipality if available
  if (store.cityMunicipality) {
    parts.push(store.cityMunicipality);
  }
  
  // Add region if available
  if (store.region) {
    // Format region (remove parenthetical parts for display)
    const formattedRegion = store.region.replace(/\s*\([^)]*\)/g, '');
    parts.push(formattedRegion);
  }
  
  // If we have any parts, join them with commas
  // Otherwise, use the original location field or a default message
  return parts.length > 0 
    ? parts.join(', ')
    : (store.location || 'No location data');
}

/**
 * Determine marker color based on store metrics and category
 * @param {Object} store - Store data
 * @returns {String} Color hex code
 */
function getMarkerColor(store) {
  // Color based on uptime if available
  if (typeof store.uptime === 'number') {
    if (store.uptime >= 98) return '#36B37E'; // Green (healthy)
    if (store.uptime >= 90) return '#FFAB00'; // Yellow (warning)
    return '#FF5630'; // Red (critical)
  }
  
  // Color based on region if available
  if (store.region) {
    // Use region-specific colors
    const regionColors = {
      'National Capital Region (NCR)': '#0052CC', // Azure blue
      'CALABARZON (Region IV-A)': '#00B8D9', // Light blue
      'Central Visayas (Region VII)': '#36B37E', // Green
      'Davao Region (Region XI)': '#6554C0', // Purple
      'Central Luzon (Region III)': '#FFAB00' // Orange
    };
    
    // Return color for region or default color
    return regionColors[store.region] || '#FF991F'; // Default orange
  }
  
  // Default color
  return '#FF991F';
}

/**
 * Get CSS class based on uptime value
 * @param {Number} uptime - Uptime percentage
 * @returns {String} CSS class name
 */
function getUptimeClass(uptime) {
  if (typeof uptime !== 'number') return '';
  if (uptime >= 98) return 'metric-success';
  if (uptime >= 90) return 'metric-warning';
  return 'metric-danger';
}

/**
 * Get CSS class based on latency value
 * @param {Number} latency - Latency in milliseconds
 * @returns {String} CSS class name
 */
function getLatencyClass(latency) {
  if (typeof latency !== 'number') return '';
  if (latency <= 100) return 'metric-success';
  if (latency <= 300) return 'metric-warning';
  return 'metric-danger';
}

/**
 * Enhanced map tooltip styles
 * Add these to your CSS or include inline
 */
export const tooltipStyles = `
.store-marker-tooltip {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.store-tooltip {
  font-family: var(--font-family-base, 'Inter', sans-serif);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
  border-radius: var(--border-radius, 4px);
  background-color: var(--bg-card, white);
  box-shadow: var(--box-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, #DFE1E6);
  min-width: 220px;
  max-width: 280px;
}

.store-tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs, 4px);
  color: var(--text-primary, #1D1D1D);
  font-weight: var(--font-weight-semibold, 600);
}

.store-tooltip-id {
  color: var(--text-muted, #7A869A);
  font-size: var(--font-size-xs, 12px);
}

.store-tooltip-location {
  margin-bottom: var(--spacing-sm, 8px);
  color: var(--text-secondary, #505F79);
  font-size: var(--font-size-sm, 14px);
}

.store-tooltip-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
  margin-bottom: var(--spacing-sm, 8px);
}

.store-tooltip-metric {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm, 14px);
}

.metric-label {
  color: var(--text-secondary, #505F79);
}

.metric-value {
  font-weight: var(--font-weight-medium, 500);
}

.metric-success {
  color: var(--color-success, #36B37E);
}

.metric-warning {
  color: var(--color-warning, #FFAB00);
}

.metric-danger {
  color: var(--color-danger, #FF5630);
}

.store-tooltip-footer {
  color: var(--text-secondary, #505F79);
  font-size: var(--font-size-xs, 12px);
  border-top: 1px solid var(--border-color, #DFE1E6);
  padding-top: var(--spacing-xs, 4px);
}
`;

export default {
  createEnhancedMarker,
  tooltipStyles
};