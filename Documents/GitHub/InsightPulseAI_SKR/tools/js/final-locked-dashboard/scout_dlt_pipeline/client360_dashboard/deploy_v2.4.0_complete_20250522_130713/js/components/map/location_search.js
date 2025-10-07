/**
 * Location Search Component for Client360 Dashboard v2.4.0
 * Provides location search functionality for maps
 */

class LocationSearch {
  constructor(config = {}) {
    this.config = {
      mapEngine: null,
      containerId: 'location-search',
      placeholder: 'Search for a location...',
      limit: 5,
      countryCodes: ['ph'], // Philippines
      debounceTime: 300,
      minLength: 3,
      resultTypes: ['region', 'place', 'district', 'locality', 'neighborhood', 'address', 'poi'],
      markerColor: '#e31937',
      showClearButton: true,
      geocoderApiUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places/',
      accessToken: null,
      ...config
    };
    
    this.mapEngine = this.config.mapEngine;
    this.container = null;
    this.searchInput = null;
    this.resultsContainer = null;
    this.clearButton = null;
    this.marker = null;
    this.searchTimeout = null;
    this.cache = new Map();
    this.selectedResult = null;
    
    // Initialize if map engine is provided
    if (this.mapEngine) {
      this.initialize();
    }
  }
  
  /**
   * Initialize location search
   * @param {Object} mapEngine - Map engine instance
   */
  initialize(mapEngine = null) {
    if (mapEngine) {
      this.mapEngine = mapEngine;
    }
    
    if (!this.mapEngine) {
      console.error('Map engine is required for location search');
      return;
    }
    
    // Get the access token from map engine if not provided
    if (!this.config.accessToken && this.mapEngine.config.mapboxToken) {
      this.config.accessToken = this.mapEngine.config.mapboxToken;
    }
    
    // Create UI elements
    this.createSearchInterface();
    
    // Create marker for search results
    this.createMarker();
  }
  
  /**
   * Create search interface
   */
  createSearchInterface() {
    // Get or create container
    this.container = document.getElementById(this.config.containerId);
    
    if (!this.container) {
      // Create container
      this.container = document.createElement('div');
      this.container.id = this.config.containerId;
      this.container.className = 'location-search-container';
      
      // Position on map
      this.container.style.position = 'absolute';
      this.container.style.top = '10px';
      this.container.style.left = '10px';
      this.container.style.zIndex = '1';
      this.container.style.width = '300px';
      this.container.style.maxWidth = 'calc(100% - 20px)';
      
      // Add to map container
      if (this.mapEngine.container) {
        this.mapEngine.container.appendChild(this.container);
      }
    }
    
    // Create search form
    const searchForm = document.createElement('form');
    searchForm.className = 'location-search-form';
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.search(this.searchInput.value);
    });
    
    // Create search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = this.config.placeholder;
    this.searchInput.className = 'location-search-input';
    this.searchInput.autocomplete = 'off';
    
    // Add input event listeners
    this.searchInput.addEventListener('input', () => {
      this.handleInput();
    });
    
    this.searchInput.addEventListener('focus', () => {
      // Show results container if there are cached results
      if (this.resultsContainer && this.resultsContainer.childElementCount > 0) {
        this.resultsContainer.style.display = 'block';
      }
      
      // Show clear button if there's text
      if (this.clearButton && this.searchInput.value.length > 0) {
        this.clearButton.style.display = 'block';
      }
    });
    
    // Create clear button
    if (this.config.showClearButton) {
      this.clearButton = document.createElement('button');
      this.clearButton.className = 'location-search-clear';
      this.clearButton.type = 'button';
      this.clearButton.innerHTML = '&times;';
      this.clearButton.style.display = 'none';
      
      this.clearButton.addEventListener('click', () => {
        this.clearSearch();
      });
      
      searchForm.appendChild(this.clearButton);
    }
    
    // Add search input to form
    searchForm.appendChild(this.searchInput);
    
    // Create results container
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'location-search-results';
    this.resultsContainer.style.display = 'none';
    
    // Add elements to container
    this.container.appendChild(searchForm);
    this.container.appendChild(this.resultsContainer);
    
    // Add document click listener to hide results
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });
    
    // Add basic styles
    const style = document.createElement('style');
    style.textContent = `
      .location-search-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        background: white;
        overflow: hidden;
      }
      
      .location-search-form {
        position: relative;
        display: flex;
      }
      
      .location-search-input {
        flex: 1;
        padding: 10px 40px 10px 10px;
        border: none;
        border-radius: 4px;
        outline: none;
        width: 100%;
        box-sizing: border-box;
      }
      
      .location-search-clear {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 40px;
        background: transparent;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
      }
      
      .location-search-clear:hover {
        color: #333;
      }
      
      .location-search-results {
        max-height: 300px;
        overflow-y: auto;
        background: white;
        border-top: 1px solid #eee;
      }
      
      .location-search-result {
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }
      
      .location-search-result:hover {
        background: #f5f5f5;
      }
      
      .location-search-result-primary {
        font-weight: 500;
      }
      
      .location-search-result-secondary {
        font-size: 12px;
        color: #666;
        margin-top: 2px;
      }
      
      .location-search-no-results {
        padding: 10px;
        color: #666;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Create marker for search results
   */
  createMarker() {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'search-result-marker';
    markerElement.style.width = '24px';
    markerElement.style.height = '24px';
    markerElement.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyI+PC9jaXJjbGU+PC9zdmc+)';
    markerElement.style.backgroundSize = 'cover';
    markerElement.style.backgroundPosition = 'center';
    markerElement.style.filter = `drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))`;
    
    // Replace color in SVG
    if (this.config.markerColor) {
      markerElement.style.backgroundImage = markerElement.style.backgroundImage.replace('#ffffff', this.config.markerColor);
    }
    
    // Create marker (but don't add to map yet)
    this.marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'bottom'
    });
  }
  
  /**
   * Handle input events
   */
  handleInput() {
    const query = this.searchInput.value.trim();
    
    // Show/hide clear button
    if (this.clearButton) {
      this.clearButton.style.display = query.length > 0 ? 'block' : 'none';
    }
    
    // Cancel previous search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Check query length
    if (query.length < this.config.minLength) {
      this.hideResults();
      return;
    }
    
    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.search(query);
    }, this.config.debounceTime);
  }
  
  /**
   * Search for locations
   * @param {string} query - Search query
   */
  async search(query) {
    if (!query || query.length < this.config.minLength) return;
    
    // Check cache first
    const cacheKey = query.toLowerCase();
    if (this.cache.has(cacheKey)) {
      this.showResults(this.cache.get(cacheKey), query);
      return;
    }
    
    // Show loading state
    this.showLoading();
    
    try {
      // Construct request URL
      let url = `${this.config.geocoderApiUrl}${encodeURIComponent(query)}.json?access_token=${this.config.accessToken}`;
      
      // Add options
      if (this.config.limit) {
        url += `&limit=${this.config.limit}`;
      }
      
      if (this.config.countryCodes && this.config.countryCodes.length > 0) {
        url += `&country=${this.config.countryCodes.join(',')}`;
      }
      
      if (this.config.resultTypes && this.config.resultTypes.length > 0) {
        url += `&types=${this.config.resultTypes.join(',')}`;
      }
      
      // Get map bounds to improve results
      if (this.mapEngine && this.mapEngine.map) {
        const bounds = this.mapEngine.map.getBounds();
        url += `&bbox=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      }
      
      // Fetch results
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache results
      this.cache.set(cacheKey, data.features);
      
      // Display results
      this.showResults(data.features, query);
    } catch (error) {
      console.error('Error searching for locations:', error);
      this.showError(error.message);
    }
  }
  
  /**
   * Show search results
   * @param {Array} results - Search results
   * @param {string} query - Search query
   */
  showResults(results, query) {
    if (!this.resultsContainer) return;
    
    // Clear previous results
    this.resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'location-search-no-results';
      noResults.textContent = `No results found for "${query}"`;
      this.resultsContainer.appendChild(noResults);
    } else {
      // Create result elements
      results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'location-search-result';
        
        const primaryText = document.createElement('div');
        primaryText.className = 'location-search-result-primary';
        primaryText.textContent = result.text || result.place_name.split(',')[0];
        
        const secondaryText = document.createElement('div');
        secondaryText.className = 'location-search-result-secondary';
        secondaryText.textContent = result.place_name;
        
        resultElement.appendChild(primaryText);
        resultElement.appendChild(secondaryText);
        
        // Add click handler
        resultElement.addEventListener('click', () => {
          this.selectResult(result);
        });
        
        this.resultsContainer.appendChild(resultElement);
      });
    }
    
    // Show results container
    this.resultsContainer.style.display = 'block';
  }
  
  /**
   * Show loading state
   */
  showLoading() {
    if (!this.resultsContainer) return;
    
    this.resultsContainer.innerHTML = '<div class="location-search-no-results">Searching...</div>';
    this.resultsContainer.style.display = 'block';
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (!this.resultsContainer) return;
    
    this.resultsContainer.innerHTML = `<div class="location-search-no-results">Error: ${message}</div>`;
    this.resultsContainer.style.display = 'block';
  }
  
  /**
   * Hide results container
   */
  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'none';
    }
  }
  
  /**
   * Select a search result
   * @param {Object} result - Selected result
   */
  selectResult(result) {
    if (!this.mapEngine || !this.mapEngine.map) return;
    
    // Store selected result
    this.selectedResult = result;
    
    // Update input value
    this.searchInput.value = result.place_name;
    
    // Hide results
    this.hideResults();
    
    // Set marker
    this.marker.setLngLat(result.center).addTo(this.mapEngine.map);
    
    // Fly to location
    this.mapEngine.map.flyTo({
      center: result.center,
      zoom: this.getZoomLevel(result),
      duration: 1000
    });
    
    // Create popup if not provided
    if (result.place_type && result.place_type.includes('address')) {
      new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '300px'
      })
        .setLngLat(result.center)
        .setHTML(`<div class="location-popup"><h4>${result.text}</h4><p>${result.place_name}</p></div>`)
        .addTo(this.mapEngine.map);
    }
    
    // Fire custom event
    this.dispatch('result_selected', {
      result: this.selectedResult
    });
  }
  
  /**
   * Get appropriate zoom level based on result type
   * @param {Object} result - Search result
   * @returns {number} Zoom level
   */
  getZoomLevel(result) {
    if (!result.place_type || result.place_type.length === 0) {
      return 13; // Default zoom
    }
    
    // Get first place type
    const placeType = result.place_type[0];
    
    switch (placeType) {
      case 'country':
        return 5;
      case 'region':
        return 7;
      case 'district':
        return 9;
      case 'place':
        return 11;
      case 'locality':
      case 'neighborhood':
        return 13;
      case 'address':
        return 15;
      case 'poi':
        return 16;
      default:
        return 13;
    }
  }
  
  /**
   * Clear search input and results
   */
  clearSearch() {
    // Clear input
    this.searchInput.value = '';
    
    // Hide clear button
    if (this.clearButton) {
      this.clearButton.style.display = 'none';
    }
    
    // Hide results
    this.hideResults();
    
    // Remove marker
    if (this.marker) {
      this.marker.remove();
    }
    
    // Clear selected result
    this.selectedResult = null;
    
    // Focus input
    this.searchInput.focus();
    
    // Fire custom event
    this.dispatch('search_cleared');
  }
  
  /**
   * Get selected result
   * @returns {Object|null} Selected result
   */
  getSelectedResult() {
    return this.selectedResult;
  }
  
  /**
   * Dispatch custom event
   * @param {string} name - Event name
   * @param {Object} detail - Event details
   */
  dispatch(name, detail = {}) {
    const event = new CustomEvent(`location_search_${name}`, {
      bubbles: true,
      detail: {
        ...detail,
        source: this
      }
    });
    
    this.container.dispatchEvent(event);
  }
}

// Export to window
window.LocationSearch = LocationSearch;