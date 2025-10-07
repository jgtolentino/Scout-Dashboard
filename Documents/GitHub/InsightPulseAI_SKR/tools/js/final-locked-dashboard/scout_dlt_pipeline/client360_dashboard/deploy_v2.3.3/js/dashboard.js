// Client360 Dashboard - Core Functionality v2.3.3
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard v2.3.3 initialization started');
  
  // Set default simulation mode if not already defined
  if (typeof window.isSimulatedData === 'undefined') {
    window.isSimulatedData = true;
  }
  
  // Initialize components
  initializeDatePicker();
  initializeDataSourceToggle();
  initializeFilterBar();
  initializeKPITiles();
  initializeMapComponent();
  loadAIComponents(); // Modified to load AI components dynamically
  initializeExportButtons();
  initializeQAOverlay();
  initializeAccessibilityFeatures();
  applyTBWATheme();
  
  console.log('Dashboard v2.3.3 initialization completed');
});

// Function to dynamically load AI component scripts
function loadAIComponents() {
  console.log('Loading AI components...');
  
  // Define required scripts in order
  const aiScripts = [
    '/js/components/ai/azure_openai_client.js',
    '/js/components/ai/parquet_reader.js',
    '/js/components/ai/ai_insights_provider.js',
    '/js/components/ai/ai_insights.js'
  ];
  
  // Helper function to load script and return a promise
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
  
  // Load scripts sequentially
  async function loadScriptsSequentially() {
    for (const script of aiScripts) {
      try {
        await loadScript(script);
        console.log(`Loaded ${script}`);
      } catch (error) {
        console.error(error);
        // Continue loading other scripts even if one fails
      }
    }
    
    // Once all scripts are loaded, initialize AI panel
    if (typeof window.initializeAIInsightPanel === 'function') {
      console.log('Initializing AI Insight Panel');
      window.initializeAIInsightPanel();
    } else {
      console.warn('AI Insight Panel initialization function not available');
    }
  }
  
  // Start loading scripts
  loadScriptsSequentially();
}

// Enhanced Data Source Toggle with AI Integration
function initializeDataSourceToggle() {
  const dataToggle = document.getElementById('data-source-toggle');
  const dataSourceValue = document.getElementById('data-source-value');
  
  if (!dataToggle || !dataSourceValue) return;
  
  console.log('Initializing data source toggle');
  
  // Setup initial toggle position based on simulation mode
  dataToggle.checked = !window.isSimulatedData;
  dataSourceValue.textContent = window.isSimulatedData ? 'Simulated' : 'Live';
  
  // Add enhanced styling to toggle
  const toggleParent = dataToggle.closest('.data-source-toggle');
  if (toggleParent) {
    toggleParent.classList.add('relative', 'inline-block');
    
    // Add data source badge with current status
    const dataSourceBadge = document.createElement('div');
    dataSourceBadge.className = `absolute -top-3 -right-2 px-1.5 py-0.5 text-xs font-semibold rounded-full z-10 ${window.isSimulatedData ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`;
    dataSourceBadge.textContent = 'v2.3.3';
    toggleParent.appendChild(dataSourceBadge);
  }
  
  dataToggle.addEventListener('change', function() {
    // Update simulation mode
    window.isSimulatedData = !this.checked;
    dataSourceValue.textContent = window.isSimulatedData ? 'Simulated' : 'Live';
    
    // Update data source badge in insights section
    const dataBadge = document.querySelector('.ai-insights-section .data-badge');
    if (dataBadge) {
      dataBadge.textContent = window.isSimulatedData ? 'Synthetic Data' : 'Live Data';
      dataBadge.className = `data-badge ${window.isSimulatedData ? 'synthetic' : 'live'}`;
    }
    
    // Notify AI provider of the change if available
    if (window.aiInsightsProvider && typeof window.aiInsightsProvider.setSimulationMode === 'function') {
      window.aiInsightsProvider.setSimulationMode(window.isSimulatedData);
    }
    
    // Refresh data with new mode
    refreshData({ simulationMode: window.isSimulatedData });
    
    // Show notification
    showToast(`Switched to ${window.isSimulatedData ? 'simulated' : 'live'} data mode`);
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center opacity-0 transition-opacity duration-300';
  
  // Set color based on type
  if (type === 'error') {
    toast.classList.add('bg-red-600', 'text-white');
  } else if (type === 'success') {
    toast.classList.add('bg-green-600', 'text-white');
  } else {
    toast.classList.add('bg-gray-800', 'text-white');
  }
  
  // Add icon based on type
  let icon = '';
  if (type === 'error') {
    icon = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else if (type === 'success') {
    icon = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  } else {
    icon = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }
  
  toast.innerHTML = `${icon} ${message}`;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Animate out after delay
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Enhanced Map Component for GeoJSON Support
function initializeMapComponent() {
  const mapContainer = document.getElementById('store-map');
  if (!mapContainer) return;
  
  console.log('Initializing map component with GeoJSON support');
  
  // Load dependencies if needed
  if (!window.mapboxgl) {
    const mapboxScript = document.createElement('script');
    mapboxScript.src = 'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js';
    document.head.appendChild(mapboxScript);
    
    const mapboxStyles = document.createElement('link');
    mapboxStyles.rel = 'stylesheet';
    mapboxStyles.href = 'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css';
    document.head.appendChild(mapboxStyles);
    
    // Wait for mapbox to load
    mapboxScript.onload = function() {
      initializeMapWithGeoJSON();
    };
  } else {
    initializeMapWithGeoJSON();
  }
  
  // Initialize map with GeoJSON data
  function initializeMapWithGeoJSON() {
    // Set Mapbox token (in production, this would be secured)
    mapboxgl.accessToken = 'pk.placeholder.token';
    
    // Create map
    const map = new mapboxgl.Map({
      container: 'store-map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [121.0, 14.6], // Manila, Philippines
      zoom: 6
    });
    
    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Load GeoJSON data when map is ready
    map.on('load', function() {
      loadMapData(map);
    });
  }
  
  // Load GeoJSON data for map
  function loadMapData(map) {
    // Determine GeoJSON file based on current theme
    const theme = document.body.classList.contains('tbwa-theme') ? 'tbwa' : 'sarisari';
    const geoJsonPath = `/data/${window.isSimulatedData ? 'simulated' : 'live'}/regions.geojson`;
    
    // Load GeoJSON data
    fetch(geoJsonPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load GeoJSON data');
        }
        return response.json();
      })
      .then(data => {
        // Add GeoJSON source
        map.addSource('regions', {
          type: 'geojson',
          data: data
        });
        
        // Add choropleth layer
        map.addLayer({
          id: 'regions-fill',
          type: 'fill',
          source: 'regions',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'value'],
              0, '#f7fbff',
              100, '#08519c'
            ],
            'fill-opacity': 0.7
          }
        });
        
        // Add outline layer
        map.addLayer({
          id: 'regions-outline',
          type: 'line',
          source: 'regions',
          paint: {
            'line-color': '#000',
            'line-width': 0.5,
            'line-opacity': 0.5
          }
        });
        
        // Add hover effect
        map.on('mousemove', 'regions-fill', (e) => {
          if (e.features.length > 0) {
            // Show tooltip
            showMapTooltip(e.features[0], e.lngLat);
          }
        });
        
        map.on('mouseleave', 'regions-fill', () => {
          // Hide tooltip
          hideMapTooltip();
        });
        
        // Add click interaction
        map.on('click', 'regions-fill', (e) => {
          if (e.features.length > 0) {
            // Get region data
            const feature = e.features[0];
            
            // Show detailed panel with region data
            showRegionDetails(feature.properties);
          }
        });
      })
      .catch(error => {
        console.error('Error loading GeoJSON data:', error);
        
        // Show error message in map container
        mapContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full p-4 bg-gray-100 rounded-lg">
            <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-700">Map data unavailable</h3>
            <p class="text-sm text-gray-600 text-center mt-1">Unable to load geographic data. Please try again later.</p>
          </div>
        `;
      });
  }
  
  // Show tooltip with region data
  function showMapTooltip(feature, lngLat) {
    const tooltip = document.getElementById('map-tooltip') || createMapTooltip();
    
    // Set tooltip content
    tooltip.innerHTML = `
      <h4 class="font-semibold">${feature.properties.name}</h4>
      <div class="flex justify-between">
        <span>Sales:</span>
        <span class="font-medium">₱${(feature.properties.value * 1000).toLocaleString()}</span>
      </div>
      <div class="flex justify-between">
        <span>Stores:</span>
        <span class="font-medium">${feature.properties.stores}</span>
      </div>
    `;
    
    // Position tooltip
    const mapRect = document.getElementById('store-map').getBoundingClientRect();
    const left = lngLat.lng + mapRect.left;
    const top = lngLat.lat + mapRect.top;
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = 'block';
  }
  
  // Hide map tooltip
  function hideMapTooltip() {
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
  
  // Create map tooltip element
  function createMapTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.className = 'absolute bg-white p-2 rounded shadow-lg text-sm z-30 pointer-events-none';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
  }
  
  // Show detailed panel with region data
  function showRegionDetails(properties) {
    // Get or create region details panel
    let detailsPanel = document.getElementById('region-details-panel');
    
    if (!detailsPanel) {
      detailsPanel = document.createElement('div');
      detailsPanel.id = 'region-details-panel';
      detailsPanel.className = 'fixed right-4 top-20 bg-white rounded-lg shadow-xl w-80 z-20 transform translate-x-full transition-transform duration-300';
      
      document.body.appendChild(detailsPanel);
    }
    
    // Set panel content
    detailsPanel.innerHTML = `
      <div class="p-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">${properties.name}</h3>
          <button id="close-region-details" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="text-sm text-gray-600">Sales</div>
            <div class="text-lg font-semibold text-blue-700">₱${(properties.value * 1000).toLocaleString()}</div>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <div class="text-sm text-gray-600">Stores</div>
            <div class="text-lg font-semibold text-green-700">${properties.stores}</div>
          </div>
        </div>
        
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h4>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm">Growth</span>
              <div class="flex items-center">
                <span class="text-sm font-medium ${properties.growth >= 0 ? 'text-green-600' : 'text-red-600'}">${properties.growth >= 0 ? '+' : ''}${properties.growth}%</span>
                <svg class="w-4 h-4 ml-1 ${properties.growth >= 0 ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${properties.growth >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}"></path>
                </svg>
              </div>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-sm">Market Share</span>
              <span class="text-sm font-medium">${properties.market_share}%</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-sm">Active SKUs</span>
              <span class="text-sm font-medium">${properties.skus.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <button id="view-region-details" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          View Detailed Report
        </button>
      </div>
    `;
    
    // Show panel
    setTimeout(() => {
      detailsPanel.classList.remove('translate-x-full');
    }, 10);
    
    // Add close button functionality
    document.getElementById('close-region-details').addEventListener('click', function() {
      detailsPanel.classList.add('translate-x-full');
    });
    
    // Add view details button functionality
    document.getElementById('view-region-details').addEventListener('click', function() {
      window.location.href = `/region/${properties.id}`;
    });
  }
}

// Function to refresh data (stub)
function refreshData(params) {
  console.log('Refreshing data with params:', params);
  
  // In a real implementation, this would make API calls
  // For now, it just updates the last refresh time
  
  const refreshTimeEl = document.getElementById('data-refresh-time');
  if (refreshTimeEl) {
    const now = new Date();
    refreshTimeEl.textContent = `Today at ${now.toLocaleTimeString()}`;
  }
  
  // If simulation mode changed, reload AI insights
  if (params && 'simulationMode' in params) {
    // Reload AI insights if available
    if (typeof window.loadAIInsights === 'function') {
      window.loadAIInsights();
    }
  }
}

// Export Buttons Functionality
function initializeExportButtons() {
  // Implementation varies based on dashboard, but the core is to support data export
  const exportButtons = document.querySelectorAll('[data-export]');
  
  exportButtons.forEach(button => {
    button.addEventListener('click', function() {
      const format = this.getAttribute('data-export');
      exportDashboardData(format);
    });
  });
}

// Export dashboard data
function exportDashboardData(format) {
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse';
  document.body.appendChild(loadingIndicator);
  
  // Simulate export process
  setTimeout(() => {
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Show success notification
    showToast(`Dashboard data exported as ${format.toUpperCase()}`, 'success');
    
    // For CSV and Excel formats, simulate file download
    if (format === 'csv' || format === 'excel') {
      const link = document.createElement('a');
      link.download = `client360_dashboard_${format === 'csv' ? 'data.csv' : 'data.xlsx'}`;
      link.href = '#';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, 1500);
}

// QA Overlay functionality
function initializeQAOverlay() {
  const qaToggle = document.getElementById('qa-overlay-toggle');
  if (!qaToggle) return;
  
  console.log('Initializing QA overlay');
  
  // Create QA overlay container if it doesn't exist
  let qaOverlay = document.getElementById('qa-overlay');
  if (!qaOverlay) {
    qaOverlay = document.createElement('div');
    qaOverlay.id = 'qa-overlay';
    qaOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center hidden';
    
    qaOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center border-b p-4">
          <h2 class="text-xl font-semibold">QA Verification</h2>
          <button id="close-qa-overlay" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="overflow-auto p-4 flex-grow">
          <div id="qa-checklist" class="space-y-4">
            <!-- QA checklist items will be loaded here -->
            <div class="animate-pulse space-y-4">
              <div class="h-6 bg-gray-200 rounded w-3/4"></div>
              <div class="h-6 bg-gray-200 rounded"></div>
              <div class="h-6 bg-gray-200 rounded"></div>
              <div class="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        
        <div class="border-t p-4 flex justify-end">
          <button id="run-qa-checks" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Run QA Checks</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(qaOverlay);
    
    // Add close button functionality
    document.getElementById('close-qa-overlay').addEventListener('click', function() {
      qaOverlay.classList.add('hidden');
    });
    
    // Add run QA checks functionality
    document.getElementById('run-qa-checks').addEventListener('click', function() {
      runQAChecks();
    });
  }
  
  // Toggle QA overlay
  qaToggle.addEventListener('click', function() {
    qaOverlay.classList.toggle('hidden');
    
    // If showing, load QA checklist
    if (!qaOverlay.classList.contains('hidden')) {
      loadQAChecklist();
    }
  });
  
  // Load QA checklist
  function loadQAChecklist() {
    const qaChecklist = document.getElementById('qa-checklist');
    if (!qaChecklist) return;
    
    // Fetch QA checklist data
    fetch('/data/qa/checklist.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load QA checklist');
        }
        return response.json();
      })
      .then(data => {
        // Render QA checklist
        qaChecklist.innerHTML = '';
        
        data.forEach((category, index) => {
          const categoryEl = document.createElement('div');
          categoryEl.className = 'mb-6';
          
          categoryEl.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">${category.name}</h3>
            <div class="space-y-2">
              ${category.items.map((item, i) => `
                <div class="flex items-start p-2 hover:bg-gray-50 rounded">
                  <input type="checkbox" id="qa-item-${index}-${i}" class="mt-1 qa-checkbox" ${item.status === 'passed' ? 'checked' : ''}>
                  <div class="ml-3">
                    <label for="qa-item-${index}-${i}" class="block font-medium">${item.name}</label>
                    <p class="text-sm text-gray-600">${item.description}</p>
                    ${item.status === 'failed' ? `
                      <div class="mt-1 p-2 bg-red-50 text-red-700 rounded text-sm">
                        ${item.error || 'Failed to pass this check'}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          
          qaChecklist.appendChild(categoryEl);
        });
        
        // Add event listeners to checkboxes
        const checkboxes = document.querySelectorAll('.qa-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            // In a real implementation, this would update the QA check status
            console.log(`QA check ${this.id} ${this.checked ? 'passed' : 'failed'}`);
          });
        });
      })
      .catch(error => {
        console.error('Error loading QA checklist:', error);
        
        qaChecklist.innerHTML = `
          <div class="text-center p-4">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="text-lg font-semibold text-gray-700">Failed to load QA checklist</h3>
            <p class="text-sm text-gray-600 mt-1">Please try again later</p>
          </div>
        `;
      });
  }
  
  // Run QA checks
  function runQAChecks() {
    const runButton = document.getElementById('run-qa-checks');
    if (!runButton) return;
    
    // Disable button and show loading state
    runButton.disabled = true;
    runButton.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Running...
    `;
    
    // Simulate QA checks
    setTimeout(() => {
      // Re-enable button
      runButton.disabled = false;
      runButton.innerHTML = 'Run QA Checks';
      
      // Reload QA checklist with updated status
      loadQAChecklist();
      
      // Show notification
      showToast('QA checks completed', 'success');
    }, 2000);
  }
}

// Initialize Accessibility Features
function initializeAccessibilityFeatures() {
  console.log('Initializing accessibility features');
  
  // Add keyboard navigation for all interactive elements
  const interactiveElements = document.querySelectorAll('button, a, input, select, [tabindex]');
  interactiveElements.forEach(element => {
    // Ensure proper tabindex
    if (!element.hasAttribute('tabindex') && !element.disabled) {
      element.setAttribute('tabindex', '0');
    }
    
    // Add keyboard event listeners for buttons
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      element.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.click();
        }
      });
    }
    
    // Add ARIA labels for elements without text
    if (element.tagName === 'BUTTON' && !element.textContent.trim() && !element.getAttribute('aria-label')) {
      // Attempt to set reasonable label based on icon or context
      if (element.querySelector('svg')) {
        const parentText = element.closest('.section-header, .card-header')?.querySelector('h2, h3, h4')?.textContent;
        if (parentText) {
          element.setAttribute('aria-label', `${parentText} button`);
        } else {
          element.setAttribute('aria-label', 'Action button');
        }
      }
    }
  });
  
  // Add high contrast mode toggle
  const themeSelector = document.getElementById('theme-select');
  if (themeSelector) {
    // Add high contrast option if it doesn't exist
    if (!Array.from(themeSelector.options).some(option => option.value === 'high-contrast')) {
      const highContrastOption = document.createElement('option');
      highContrastOption.value = 'high-contrast';
      highContrastOption.textContent = 'High Contrast';
      themeSelector.appendChild(highContrastOption);
    }
    
    // Handle high contrast mode
    themeSelector.addEventListener('change', function() {
      if (this.value === 'high-contrast') {
        document.body.classList.add('high-contrast-mode');
      } else {
        document.body.classList.remove('high-contrast-mode');
      }
    });
  }
  
  // Add screen reader announcements for dynamic content
  const srAnnouncer = document.createElement('div');
  srAnnouncer.id = 'sr-announcer';
  srAnnouncer.setAttribute('aria-live', 'polite');
  srAnnouncer.className = 'sr-only';
  document.body.appendChild(srAnnouncer);
  
  // Expose announcement function
  window.announceForScreenReader = function(message) {
    srAnnouncer.textContent = message;
    
    // Clear after a delay to prevent duplicate announcements
    setTimeout(() => {
      srAnnouncer.textContent = '';
    }, 1000);
  };
}

// Apply TBWA theme
function applyTBWATheme() {
  const themeSelector = document.getElementById('theme-select');
  if (!themeSelector) return;
  
  // Default to TBWA theme
  if (themeSelector.value === 'tbwa') {
    document.body.classList.add('tbwa-theme');
    document.body.classList.remove('sarisari-theme');
  }
  
  themeSelector.addEventListener('change', function() {
    if (this.value === 'tbwa') {
      document.body.classList.add('tbwa-theme');
      document.body.classList.remove('sarisari-theme', 'high-contrast-mode');
    } else if (this.value === 'sarisari') {
      document.body.classList.add('sarisari-theme');
      document.body.classList.remove('tbwa-theme', 'high-contrast-mode');
    } else if (this.value === 'high-contrast') {
      document.body.classList.add('high-contrast-mode');
      document.body.classList.remove('tbwa-theme', 'sarisari-theme');
    }
    
    // Update favicon based on theme
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = this.value === 'tbwa' ? '/favicon-tbwa.ico' : '/favicon.ico';
    }
    
    // Update logo
    const logo = document.querySelector('.header-logo');
    if (logo) {
      logo.style.backgroundImage = `url('/img/logo-${this.value}.png')`;
    }
  });
}