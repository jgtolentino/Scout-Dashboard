/**
 * Medallion Data Connector Integration for SalesInteractionBrands
 * 
 * This file contains the necessary updates to integrate the SalesInteractionBrands table
 * with the MedallionDataConnector. Copy the relevant sections to update your connector.
 */

// Add new endpoints in fetchRealData method
async fetchRealData(layer, endpoint, params, cacheKey) {
  console.log(`Medallion Data Connector: Fetching real data from ${layer} layer: ${endpoint}`);
  
  try {
    // API base URL
    const baseUrl = this.config.apiBaseUrl;
    
    // Ensure we have auth token if needed
    if (this.config.useRealData && !this.authToken) {
      await this.authenticate();
    }
    
    // Set up request options with auth token
    const options = {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    };
    
    // Format params for URL
    const queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          queryParams.append(key, params[key]);
        }
      });
    }
    
    // Custom endpoint handling for brand mentions geographic data
    if (endpoint === 'brand_mentions' || 
        endpoint === 'store_density' || 
        endpoint === 'sales_volume' || 
        endpoint === 'combo_frequency') {
      
      // Use the stored procedure with geo level, brand ID, etc.
      const geoParams = new URLSearchParams();
      geoParams.append('geoLevel', params.geoLevel || 'barangay');
      if (params.brandId && params.brandId !== 'all') {
        geoParams.append('brandID', params.brandId);
      }
      geoParams.append('days', params.timePeriod || params.days || 30);
      geoParams.append('mode', endpoint);
      
      // Call the GetChoroplethData stored procedure
      const url = `${baseUrl}/choropleth?${geoParams.toString()}`;
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch choropleth data: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    }
    
    // Handle other endpoints normally
    const url = `${baseUrl}/${layer}/${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Cache the data
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error(`Medallion Data Connector: Error fetching real data for ${layer}/${endpoint}`, error);
    this.config.onError(error);
    
    // Try to use simulated data as fallback
    console.log(`Medallion Data Connector: Using simulated data fallback for ${layer}/${endpoint}`);
    return this.fetchSimulatedData(layer, endpoint, params, cacheKey);
  }
}

// Add these methods to MedallionDataConnector class

/**
 * Get brand mentions by geography for choropleth map
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} GeoJSON data for choropleth map
 */
async getBrandMentionsByGeo(params = {}) {
  // Ensure mode is set to brands for brand mentions
  const brandParams = {
    ...params,
    mode: 'brands'
  };
  
  return this.getChoroplethData(brandParams);
}

/**
 * Get store density by geography for choropleth map
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} GeoJSON data for choropleth map
 */
async getStoreDensityByGeo(params = {}) {
  // Ensure mode is set to stores for store density
  const storeParams = {
    ...params,
    mode: 'stores'
  };
  
  return this.getChoroplethData(storeParams);
}

/**
 * Get sales volume by geography for choropleth map
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} GeoJSON data for choropleth map
 */
async getSalesVolumeByGeo(params = {}) {
  // Ensure mode is set to sales for sales volume
  const salesParams = {
    ...params,
    mode: 'sales'
  };
  
  return this.getChoroplethData(salesParams);
}

/**
 * Get combo frequency by geography for choropleth map
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} GeoJSON data for choropleth map
 */
async getComboFrequencyByGeo(params = {}) {
  // Ensure mode is set to combos for combo frequency
  const comboParams = {
    ...params,
    mode: 'combos'
  };
  
  return this.getChoroplethData(comboParams);
}

// Updated loadChoroplethMapData method in DashboardIntegrator to use the new endpoints
async loadChoroplethMapData(filters) {
  try {
    this.logMessage('Loading choropleth map data');
    
    // Check if the choropleth map element exists
    const mapContainer = document.getElementById('geo-map');
    if (!mapContainer) {
      this.logMessage('Choropleth map container not found, skipping update');
      return;
    }
    
    // Check if the ChoroplethMap class exists
    if (typeof ChoroplethMap === 'undefined') {
      this.logError('ChoroplethMap class not found. Make sure choropleth_map.js is loaded.');
      return;
    }
    
    // Get additional map-specific filters
    const mapFilters = {
      ...filters,
      geoLevel: document.getElementById('geoLevel')?.value || 'barangay',
      brandId: document.getElementById('brandFilter')?.value || 'all',
      timePeriod: parseInt(document.getElementById('timeFilter')?.value || '30', 10)
    };
    
    // Determine map mode
    const activeMapModeButton = document.querySelector('[data-map-mode].active');
    const mapMode = activeMapModeButton ? activeMapModeButton.getAttribute('data-map-mode') : 'stores';
    
    // Fetch geo data from appropriate endpoint based on mode
    let geojsonData;
    
    if (mapMode === 'brands') {
      // Brand mentions mode
      geojsonData = await this.medallionConnector.getBrandMentionsByGeo(mapFilters);
    } else if (mapMode === 'sales') {
      // Sales volume mode
      geojsonData = await this.medallionConnector.getSalesVolumeByGeo(mapFilters);
    } else if (mapMode === 'stores') {
      // Store density mode
      geojsonData = await this.medallionConnector.getStoreDensityByGeo(mapFilters);
    } else if (mapMode === 'combos') {
      // Combo frequency mode
      geojsonData = await this.medallionConnector.getComboFrequencyByGeo(mapFilters);
    } else {
      // Default to brand mentions
      geojsonData = await this.medallionConnector.getBrandMentionsByGeo(mapFilters);
    }
    
    // Store the data
    this.loadedData.choroplethData = geojsonData;
    
    // Initialize or update the choropleth map
    if (!window.choroplethMap) {
      // Create a new choropleth map
      window.choroplethMap = new ChoroplethMap({
        containerId: 'geo-map',
        mode: mapMode,
        geoLevel: mapFilters.geoLevel,
        data: geojsonData,
        darkMode: document.body.classList.contains('dark-mode'),
        onMapClick: (e, feature) => this.handleChoroplethMapClick(e, feature)
      });
    } else {
      // Update existing map
      window.choroplethMap.updateMode(mapMode);
      window.choroplethMap.updateGeoLevel(mapFilters.geoLevel);
      window.choroplethMap.updateData(geojsonData);
      
      // Update dark mode if needed
      if (document.body.classList.contains('dark-mode') !== window.choroplethMap.config.darkMode) {
        window.choroplethMap.updateDarkMode(document.body.classList.contains('dark-mode'));
      }
    }
    
    // Add data source indicator if it doesn't exist
    const mapSection = mapContainer.closest('.card');
    if (mapSection && !mapSection.querySelector('.data-source-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = `data-source-indicator float-end ${this.medallionConnector.config.useRealData ? 'data-source-real' : 'data-source-simulated'}`;
      indicator.setAttribute('data-update-text', 'true');
      indicator.textContent = this.medallionConnector.config.useRealData ? 'LIVE' : 'DEMO';
      
      const mapInfo = mapSection.querySelector('.map-info');
      if (mapInfo) {
        const dataSourceSpan = mapInfo.querySelector('.data-source-indicator');
        if (dataSourceSpan) {
          dataSourceSpan.replaceWith(indicator);
        } else {
          mapInfo.appendChild(indicator);
        }
      }
    }
    
    return geojsonData;
  } catch (error) {
    this.logError('Error loading choropleth map data:', error);
    
    // Set error message on the map container
    const mapContainer = document.getElementById('geo-map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Failed to load map data. Please try refreshing the page.
        </div>
      `;
    }
    
    throw error;
  }
}