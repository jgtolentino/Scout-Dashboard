/**
 * Client360 Dashboard - Global Search Component
 * Implements full-text search across insights, store IDs, campaigns, and other dashboard data
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize global search functionality
  initGlobalSearch();
  
  // Initialize export functionality
  initExportFunctionality();
});

/**
 * Initialize global search functionality
 */
function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  const searchButton = document.getElementById('global-search-button');
  
  if (!searchInput || !searchButton) {
    console.warn('Global search elements not found in the DOM');
    return;
  }
  
  // Search results container - create if it doesn't exist
  let searchResultsContainer = document.getElementById('search-results-container');
  if (!searchResultsContainer) {
    searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'search-results-container';
    searchResultsContainer.className = 'search-results-container';
    document.body.appendChild(searchResultsContainer);
  }
  
  // Add event listeners for search execution
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  // Add focus/blur events for visual enhancement
  searchInput.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
  });
  
  searchInput.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
    // Don't hide results immediately to allow for click actions
    setTimeout(() => {
      if (!searchResultsContainer.contains(document.activeElement)) {
        searchResultsContainer.style.display = 'none';
      }
    }, 200);
  });
  
  // Track search history in localStorage
  searchInput.addEventListener('input', function() {
    // Show autocomplete suggestions based on history and data
    if (this.value.length >= 2) {
      showAutocompleteSuggestions(this.value);
    } else {
      searchResultsContainer.style.display = 'none';
    }
  });
  
  // Add click handler to close search results when clicking outside
  document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target) && 
        !searchButton.contains(event.target) && 
        !searchResultsContainer.contains(event.target)) {
      searchResultsContainer.style.display = 'none';
    }
  });
  
  // Initialize search keyboard shortcuts
  initSearchShortcuts();
}

/**
 * Perform search functionality
 */
function performSearch() {
  const searchInput = document.getElementById('global-search-input');
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) return;
  
  // Show loading indicator
  showSearchLoading();
  
  // Save search term to history
  saveSearchHistory(searchTerm);
  
  // Perform search across different data sources
  Promise.all([
    searchStores(searchTerm),
    searchInsights(searchTerm),
    searchCampaigns(searchTerm),
    searchMetrics(searchTerm)
  ])
  .then(results => {
    // Combine and display results
    displaySearchResults(searchTerm, results);
    
    // Hide loading indicator
    hideSearchLoading();
  })
  .catch(error => {
    console.error('Search error:', error);
    showSearchError('An error occurred while searching. Please try again.');
    hideSearchLoading();
  });
}

/**
 * Search stores data
 */
function searchStores(term) {
  return new Promise((resolve) => {
    // In a real implementation, this would be an API call
    // For now, use simulated data
    const storesData = window.simulatedStoreData || [];
    const results = storesData.filter(store => {
      const searchableText = [
        store.name, 
        store.store_id,
        store.address?.barangay, 
        store.address?.city_municipality,
        store.address?.province,
        store.address?.region
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(term.toLowerCase());
    }).slice(0, 5);
    
    setTimeout(() => resolve({
      source: 'stores',
      results: results
    }), 300);
  });
}

/**
 * Search insights data
 */
function searchInsights(term) {
  return new Promise((resolve) => {
    // In a real implementation, this would be an API call
    fetch('./data/ai/insights/all_insights_latest.json')
      .then(response => response.json())
      .then(data => {
        const results = data.filter(insight => {
          const searchableText = [
            insight.title,
            insight.summary,
            insight.content?.text
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(term.toLowerCase());
        }).slice(0, 3);
        
        resolve({
          source: 'insights',
          results: results
        });
      })
      .catch(error => {
        console.warn('Error searching insights:', error);
        resolve({
          source: 'insights',
          results: []
        });
      });
  });
}

/**
 * Search campaigns data
 */
function searchCampaigns(term) {
  return new Promise((resolve) => {
    // Simulated campaigns data
    const campaigns = [
      { id: 'cmp-001', name: 'Summer Promotion 2025', status: 'active' },
      { id: 'cmp-002', name: 'Back to School Sale', status: 'upcoming' },
      { id: 'cmp-003', name: 'Holiday Special', status: 'completed' },
      { id: 'cmp-004', name: 'Loyalty Program Launch', status: 'active' },
      { id: 'cmp-005', name: 'Brand Awareness Push', status: 'active' }
    ];
    
    const results = campaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(term.toLowerCase()) ||
      campaign.id.toLowerCase().includes(term.toLowerCase())
    );
    
    setTimeout(() => resolve({
      source: 'campaigns',
      results: results
    }), 200);
  });
}

/**
 * Search metrics data
 */
function searchMetrics(term) {
  return new Promise((resolve) => {
    // Simulated metrics/KPIs data
    const metrics = [
      { id: 'sales', name: 'Total Sales', category: 'performance' },
      { id: 'conversion', name: 'Conversion Rate', category: 'performance' },
      { id: 'roi', name: 'Marketing ROI', category: 'marketing' },
      { id: 'uptime', name: 'Device Uptime', category: 'devices' },
      { id: 'sentiment', name: 'Brand Sentiment', category: 'brand' }
    ];
    
    const results = metrics.filter(metric => 
      metric.name.toLowerCase().includes(term.toLowerCase()) ||
      metric.category.toLowerCase().includes(term.toLowerCase())
    );
    
    setTimeout(() => resolve({
      source: 'metrics',
      results: results
    }), 100);
  });
}

/**
 * Display search results
 */
function displaySearchResults(term, results) {
  const searchResultsContainer = document.getElementById('search-results-container');
  
  // Flatten and categorize results
  const [storesResults, insightsResults, campaignsResults, metricsResults] = results;
  
  const totalResults = 
    storesResults.results.length + 
    insightsResults.results.length + 
    campaignsResults.results.length + 
    metricsResults.results.length;
  
  if (totalResults === 0) {
    searchResultsContainer.innerHTML = `
      <div class="search-results-header">
        <h3>Search Results for "${term}"</h3>
        <button class="close-search-results">×</button>
      </div>
      <div class="no-results">No results found. Try different keywords.</div>
    `;
    searchResultsContainer.style.display = 'block';
    
    // Add event listener for close button
    const closeButton = searchResultsContainer.querySelector('.close-search-results');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        searchResultsContainer.style.display = 'none';
      });
    }
    
    return;
  }
  
  // Build results HTML
  let resultsHTML = `
    <div class="search-results-header">
      <h3>Search Results for "${term}"</h3>
      <button class="close-search-results">×</button>
    </div>
    <div class="search-results-count">${totalResults} results found</div>
    <div class="search-results-content">
  `;
  
  // Add stores results
  if (storesResults.results.length > 0) {
    resultsHTML += `
      <div class="result-category">
        <h4>Stores</h4>
        <div class="result-items">
    `;
    
    storesResults.results.forEach(store => {
      resultsHTML += `
        <div class="result-item" data-type="store" data-id="${store.store_id}">
          <div class="result-icon">🏪</div>
          <div class="result-details">
            <div class="result-title">${store.name}</div>
            <div class="result-subtitle">${store.address?.city_municipality || ''}, ${store.address?.province || ''}</div>
          </div>
        </div>
      `;
    });
    
    resultsHTML += `
        </div>
      </div>
    `;
  }
  
  // Add insights results
  if (insightsResults.results.length > 0) {
    resultsHTML += `
      <div class="result-category">
        <h4>Insights</h4>
        <div class="result-items">
    `;
    
    insightsResults.results.forEach(insight => {
      resultsHTML += `
        <div class="result-item" data-type="insight" data-id="${insight.id}">
          <div class="result-icon">💡</div>
          <div class="result-details">
            <div class="result-title">${insight.title}</div>
            <div class="result-subtitle">${insight.summary.substring(0, 60)}${insight.summary.length > 60 ? '...' : ''}</div>
          </div>
        </div>
      `;
    });
    
    resultsHTML += `
        </div>
      </div>
    `;
  }
  
  // Add campaigns results
  if (campaignsResults.results.length > 0) {
    resultsHTML += `
      <div class="result-category">
        <h4>Campaigns</h4>
        <div class="result-items">
    `;
    
    campaignsResults.results.forEach(campaign => {
      const statusClass = campaign.status === 'active' ? 'status-active' : 
                          campaign.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
      
      resultsHTML += `
        <div class="result-item" data-type="campaign" data-id="${campaign.id}">
          <div class="result-icon">📊</div>
          <div class="result-details">
            <div class="result-title">${campaign.name}</div>
            <div class="result-subtitle">
              <span class="status-indicator ${statusClass}">${campaign.status}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    resultsHTML += `
        </div>
      </div>
    `;
  }
  
  // Add metrics results
  if (metricsResults.results.length > 0) {
    resultsHTML += `
      <div class="result-category">
        <h4>Metrics</h4>
        <div class="result-items">
    `;
    
    metricsResults.results.forEach(metric => {
      resultsHTML += `
        <div class="result-item" data-type="metric" data-id="${metric.id}">
          <div class="result-icon">📈</div>
          <div class="result-details">
            <div class="result-title">${metric.name}</div>
            <div class="result-subtitle">Category: ${metric.category}</div>
          </div>
        </div>
      `;
    });
    
    resultsHTML += `
        </div>
      </div>
    `;
  }
  
  resultsHTML += `
    </div>
  `;
  
  // Update the container with results
  searchResultsContainer.innerHTML = resultsHTML;
  searchResultsContainer.style.display = 'block';
  
  // Add event listeners for result actions
  addResultItemListeners(searchResultsContainer);
  
  // Add event listener for close button
  const closeButton = searchResultsContainer.querySelector('.close-search-results');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      searchResultsContainer.style.display = 'none';
    });
  }
}

/**
 * Add click event listeners to search result items
 */
function addResultItemListeners(container) {
  const resultItems = container.querySelectorAll('.result-item');
  
  resultItems.forEach(item => {
    item.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      const id = this.getAttribute('data-id');
      
      // Handle different result types
      switch (type) {
        case 'store':
          navigateToStore(id);
          break;
        case 'insight':
          navigateToInsight(id);
          break;
        case 'campaign':
          navigateToCampaign(id);
          break;
        case 'metric':
          navigateToMetric(id);
          break;
      }
      
      // Hide search results
      container.style.display = 'none';
    });
  });
}

/**
 * Navigate to a store detail view
 */
function navigateToStore(storeId) {
  // In real implementation, navigate to store details
  // For now, trigger the store drill-down
  if (window.dispatchEvent && typeof CustomEvent === 'function') {
    const storeData = window.simulatedStoreData?.find(store => store.store_id === storeId);
    
    if (storeData) {
      window.dispatchEvent(new CustomEvent('openStoreDetail', { 
        detail: { 
          storeId: storeData.store_id,
          storeName: storeData.name,
          storeAddress: storeData.address || {},
          storeMetrics: storeData.metrics || {}
        }
      }));
    }
  }
}

/**
 * Navigate to an insight detail view
 */
function navigateToInsight(insightId) {
  // In real implementation, navigate to insight details
  // For demo, we'll show a notification
  showNotification(`Navigating to insight ${insightId}`);
}

/**
 * Navigate to a campaign detail view
 */
function navigateToCampaign(campaignId) {
  // In real implementation, navigate to campaign details
  // For demo, we'll show a notification
  showNotification(`Navigating to campaign ${campaignId}`);
}

/**
 * Navigate to a metric detail view
 */
function navigateToMetric(metricId) {
  // In real implementation, open the metric drill-down
  if (typeof openKPIDrillDown === 'function') {
    openKPIDrillDown(metricId);
  } else {
    showNotification(`Navigating to metric ${metricId}`);
  }
}

/**
 * Save search term to history
 */
function saveSearchHistory(term) {
  try {
    let searchHistory = JSON.parse(localStorage.getItem('client360_search_history') || '[]');
    
    // Remove duplicates and add to beginning
    searchHistory = searchHistory.filter(item => item !== term);
    searchHistory.unshift(term);
    
    // Keep only the most recent 20 searches
    if (searchHistory.length > 20) {
      searchHistory = searchHistory.slice(0, 20);
    }
    
    localStorage.setItem('client360_search_history', JSON.stringify(searchHistory));
  } catch (error) {
    console.warn('Error saving search history:', error);
  }
}

/**
 * Show autocomplete suggestions based on search history and data
 */
function showAutocompleteSuggestions(term) {
  const searchResultsContainer = document.getElementById('search-results-container');
  
  // Load search history
  let searchHistory;
  try {
    searchHistory = JSON.parse(localStorage.getItem('client360_search_history') || '[]');
  } catch (error) {
    searchHistory = [];
  }
  
  // Filter history matches
  const historyMatches = searchHistory
    .filter(item => item.toLowerCase().includes(term.toLowerCase()))
    .slice(0, 5);
  
  // Quick suggestions based on common searches
  const quickSuggestions = [
    'sales performance',
    'device uptime',
    'brand sentiment',
    'store stockouts',
    'top campaigns',
    'NCR region',
    'Makati City'
  ].filter(item => item.toLowerCase().includes(term.toLowerCase()));
  
  // Show suggestions
  const allSuggestions = [...historyMatches, ...quickSuggestions.filter(item => !historyMatches.includes(item))];
  
  if (allSuggestions.length === 0) {
    searchResultsContainer.style.display = 'none';
    return;
  }
  
  let suggestionsHTML = `
    <div class="search-suggestions">
      <div class="suggestions-header">
        <h3>Suggestions</h3>
      </div>
      <div class="suggestions-list">
  `;
  
  allSuggestions.forEach(suggestion => {
    suggestionsHTML += `
      <div class="suggestion-item">
        <div class="suggestion-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
        </div>
        <div class="suggestion-text">${suggestion}</div>
      </div>
    `;
  });
  
  suggestionsHTML += `
      </div>
    </div>
  `;
  
  searchResultsContainer.innerHTML = suggestionsHTML;
  searchResultsContainer.style.display = 'block';
  
  // Add click handler for suggestion items
  const suggestionItems = searchResultsContainer.querySelectorAll('.suggestion-item');
  suggestionItems.forEach(item => {
    item.addEventListener('click', function() {
      const searchInput = document.getElementById('global-search-input');
      searchInput.value = this.querySelector('.suggestion-text').textContent;
      searchInput.focus();
      performSearch();
    });
  });
}

/**
 * Show loading indicator during search
 */
function showSearchLoading() {
  const searchInput = document.getElementById('global-search-input');
  const searchButton = document.getElementById('global-search-button');
  
  if (searchButton) {
    searchButton.disabled = true;
    searchButton.classList.add('loading');
    searchButton.innerHTML = '<div class="spinner"></div>';
  }
  
  if (searchInput) {
    searchInput.disabled = true;
  }
}

/**
 * Hide loading indicator
 */
function hideSearchLoading() {
  const searchInput = document.getElementById('global-search-input');
  const searchButton = document.getElementById('global-search-button');
  
  if (searchButton) {
    searchButton.disabled = false;
    searchButton.classList.remove('loading');
    searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>';
  }
  
  if (searchInput) {
    searchInput.disabled = false;
  }
}

/**
 * Show search error message
 */
function showSearchError(message) {
  const searchResultsContainer = document.getElementById('search-results-container');
  
  searchResultsContainer.innerHTML = `
    <div class="search-results-header">
      <h3>Search Error</h3>
      <button class="close-search-results">×</button>
    </div>
    <div class="search-error">${message}</div>
  `;
  searchResultsContainer.style.display = 'block';
  
  // Add event listener for close button
  const closeButton = searchResultsContainer.querySelector('.close-search-results');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      searchResultsContainer.style.display = 'none';
    });
  }
}

/**
 * Initialize search keyboard shortcuts
 */
function initSearchShortcuts() {
  document.addEventListener('keydown', function(e) {
    // CTRL+K or CMD+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('global-search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // ESC to close search results
    if (e.key === 'Escape') {
      const searchResultsContainer = document.getElementById('search-results-container');
      if (searchResultsContainer && searchResultsContainer.style.display === 'block') {
        searchResultsContainer.style.display = 'none';
      }
    }
  });
}

/**
 * Show notification
 */
function showNotification(message, duration = 3000) {
  // Create notification element if it doesn't exist
  let notificationElement = document.getElementById('dashboard-notification');
  if (!notificationElement) {
    notificationElement = document.createElement('div');
    notificationElement.id = 'dashboard-notification';
    notificationElement.className = 'dashboard-notification';
    document.body.appendChild(notificationElement);
  }
  
  notificationElement.textContent = message;
  notificationElement.classList.add('show');
  
  setTimeout(() => {
    notificationElement.classList.remove('show');
  }, duration);
}

/**
 * Initialize export functionality
 */
function initExportFunctionality() {
  const exportButton = document.getElementById('export-button');
  
  if (!exportButton) {
    console.warn('Export button not found in the DOM');
    return;
  }
  
  exportButton.addEventListener('click', function() {
    showExportOptions();
  });
}

/**
 * Show export options modal
 */
function showExportOptions() {
  // Create export modal if it doesn't exist
  let exportModal = document.getElementById('export-modal');
  if (!exportModal) {
    exportModal = document.createElement('div');
    exportModal.id = 'export-modal';
    exportModal.className = 'export-modal';
    exportModal.innerHTML = `
      <div class="export-modal-content">
        <div class="export-modal-header">
          <h3>Export Dashboard Data</h3>
          <button class="close-export-modal">×</button>
        </div>
        <div class="export-modal-body">
          <p>Select export format and options:</p>
          
          <div class="export-section">
            <h4>Format</h4>
            <div class="export-format-options">
              <div class="export-format-option">
                <input type="radio" name="export-format" id="format-csv" value="csv" checked>
                <label for="format-csv">
                  <div class="format-icon">📄</div>
                  <div class="format-name">CSV</div>
                </label>
              </div>
              <div class="export-format-option">
                <input type="radio" name="export-format" id="format-excel" value="excel">
                <label for="format-excel">
                  <div class="format-icon">📊</div>
                  <div class="format-name">Excel</div>
                </label>
              </div>
              <div class="export-format-option">
                <input type="radio" name="export-format" id="format-pdf" value="pdf">
                <label for="format-pdf">
                  <div class="format-icon">📑</div>
                  <div class="format-name">PDF</div>
                </label>
              </div>
              <div class="export-format-option">
                <input type="radio" name="export-format" id="format-pptx" value="pptx">
                <label for="format-pptx">
                  <div class="format-icon">🖼️</div>
                  <div class="format-name">PowerPoint</div>
                </label>
              </div>
            </div>
          </div>
          
          <div class="export-section">
            <h4>Content</h4>
            <div class="export-content-options">
              <div class="export-option">
                <input type="checkbox" id="export-current-view" checked>
                <label for="export-current-view">Current view with applied filters</label>
              </div>
              <div class="export-option">
                <input type="checkbox" id="export-all-data">
                <label for="export-all-data">All dashboard data</label>
              </div>
              <div class="export-option">
                <input type="checkbox" id="export-charts">
                <label for="export-charts">Include chart images</label>
              </div>
              <div class="export-option">
                <input type="checkbox" id="export-insights">
                <label for="export-insights">Include AI insights</label>
              </div>
            </div>
          </div>
          
          <div class="export-section">
            <h4>Date Range</h4>
            <div class="export-date-range">
              <div class="date-field">
                <label for="export-start-date">Start Date</label>
                <input type="date" id="export-start-date">
              </div>
              <div class="date-field">
                <label for="export-end-date">End Date</label>
                <input type="date" id="export-end-date">
              </div>
            </div>
          </div>
        </div>
        <div class="export-modal-footer">
          <button class="cancel-export">Cancel</button>
          <button class="export-button-primary">Export</button>
        </div>
      </div>
    `;
    document.body.appendChild(exportModal);
    
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('export-start-date').valueAsDate = thirtyDaysAgo;
    document.getElementById('export-end-date').valueAsDate = today;
    
    // Add event listeners
    document.querySelector('.close-export-modal').addEventListener('click', () => {
      exportModal.style.display = 'none';
    });
    
    document.querySelector('.cancel-export').addEventListener('click', () => {
      exportModal.style.display = 'none';
    });
    
    document.querySelector('.export-button-primary').addEventListener('click', () => {
      performExport();
      exportModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) {
        exportModal.style.display = 'none';
      }
    });
    
    // Toggle options based on format selection
    const formatRadios = document.querySelectorAll('input[name="export-format"]');
    formatRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        const isPptx = this.value === 'pptx';
        const isPdf = this.value === 'pdf';
        
        // Charts are always included in PDF/PPT
        document.getElementById('export-charts').checked = isPptx || isPdf;
        document.getElementById('export-charts').disabled = isPptx || isPdf;
      });
    });
  }
  
  // Display the modal
  exportModal.style.display = 'flex';
}

/**
 * Perform the export action
 */
function performExport() {
  // Get selected export options
  const format = document.querySelector('input[name="export-format"]:checked').value;
  const exportCurrentView = document.getElementById('export-current-view').checked;
  const exportAllData = document.getElementById('export-all-data').checked;
  const exportCharts = document.getElementById('export-charts').checked;
  const exportInsights = document.getElementById('export-insights').checked;
  const startDate = document.getElementById('export-start-date').value;
  const endDate = document.getElementById('export-end-date').value;
  
  // Build export parameters
  const exportParams = {
    format,
    exportCurrentView,
    exportAllData,
    exportCharts,
    exportInsights,
    dateRange: {
      start: startDate,
      end: endDate
    }
  };
  
  // Show loading state
  showNotification(`Preparing ${format.toUpperCase()} export...`);
  
  // In a real application, this would call an API to generate the export
  setTimeout(() => {
    console.log('Export parameters:', exportParams);
    
    // Simulate export completion
    if (format === 'csv' || format === 'excel') {
      simulateFileDownload(`client360_dashboard_export_${formatDateForFilename(new Date())}.${format}`, format);
    } else if (format === 'pdf') {
      simulateFileDownload(`client360_dashboard_report_${formatDateForFilename(new Date())}.pdf`, 'pdf');
    } else if (format === 'pptx') {
      simulateFileDownload(`client360_dashboard_presentation_${formatDateForFilename(new Date())}.pptx`, 'pptx');
    }
    
    showNotification(`${format.toUpperCase()} export completed`);
  }, 1500);
}

/**
 * Simulate file download (for demo purposes)
 */
function simulateFileDownload(filename, type) {
  // In a real application, this would trigger a file download
  // For demo, we'll just log to console
  console.log(`Simulating download of: ${filename}`);
  showNotification(`${filename} downloaded`);
  
  // If we want to simulate a real download interface, we could create a notification with a download link
  const downloadNotification = document.createElement('div');
  downloadNotification.className = 'download-notification';
  downloadNotification.innerHTML = `
    <div class="download-icon">✓</div>
    <div class="download-info">
      <div class="download-title">Export completed</div>
      <div class="download-filename">${filename}</div>
    </div>
    <button class="close-notification">×</button>
  `;
  
  document.body.appendChild(downloadNotification);
  
  // Show the notification
  setTimeout(() => {
    downloadNotification.classList.add('show');
  }, 100);
  
  // Add close event
  downloadNotification.querySelector('.close-notification').addEventListener('click', () => {
    downloadNotification.classList.remove('show');
    setTimeout(() => {
      downloadNotification.remove();
    }, 300);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    downloadNotification.classList.remove('show');
    setTimeout(() => {
      downloadNotification.remove();
    }, 300);
  }, 5000);
}

/**
 * Format date for filename (YYYYMMDD)
 */
function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Initialize simulated store data for search functionality
window.simulatedStoreData = [
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
  },
  {
    store_id: "sari-003",
    name: "Pedro's General Store",
    store_type: "General Store",
    address: {
      barangay: "San Miguel",
      city_municipality: "Davao City",
      province: "Davao del Sur",
      region: "Davao Region"
    },
    geolocation: {
      latitude: 7.0707,
      longitude: 125.6087
    },
    metrics: {
      sales: 51250,
      stockouts: 8,
      uptime: 97
    }
  },
  {
    store_id: "sari-004",
    name: "Elena's Tindahan",
    store_type: "Sari-Sari Store",
    address: {
      barangay: "Sta. Cruz",
      city_municipality: "Manila",
      province: "Metro Manila",
      region: "NCR"
    },
    geolocation: {
      latitude: 14.5885,
      longitude: 120.9822
    },
    metrics: {
      sales: 35680,
      stockouts: 15,
      uptime: 88
    }
  },
  {
    store_id: "sari-005",
    name: "Garcia's Market",
    store_type: "Mini Mart",
    address: {
      barangay: "Poblacion",
      city_municipality: "Iloilo City",
      province: "Iloilo",
      region: "Western Visayas"
    },
    geolocation: {
      latitude: 10.7202,
      longitude: 122.5621
    },
    metrics: {
      sales: 47200,
      stockouts: 6,
      uptime: 94
    }
  }
];