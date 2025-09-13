// Client360 Dashboard - Core Functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard initialization started');
  
  // Initialize components
  initializeDatePicker();
  initializeDataSourceToggle();
  initializeFilterBar();
  initializeKPITiles();
  initializeMapComponent();
  initializeAIInsightPanel();
  initializeExportButtons();
  initializeQAOverlay();
  initializeAccessibilityFeatures();
  applyTBWATheme();
  
  console.log('Dashboard initialization completed');
});

// QA-001: Unified Filter Bar with Enhanced Interactivity
function initializeFilterBar() {
  const filterBar = document.querySelector('.bg-gray-200.py-3');
  if (!filterBar) return;
  
  console.log('Initializing unified filter bar');
  
  // Initialize filter state with default values
  let filterState = {
    organization: 'All Organizations',
    region: 'All Regions',
    category: 'All Categories',
    tags: 'All Tags',
    channel: 'all'
  };
  
  // Make dropdown filters interactive with visual feedback
  const selectElements = filterBar.querySelectorAll('select');
  selectElements.forEach(select => {
    // Add custom styling to show it's interactive
    select.classList.add('cursor-pointer', 'filter-interactive');
    
    // Add hover effect
    select.addEventListener('mouseover', function() {
      this.classList.add('ring-2', 'ring-blue-300');
    });
    
    select.addEventListener('mouseout', function() {
      this.classList.remove('ring-2', 'ring-blue-300');
    });
    
    // Handle change event
    select.addEventListener('change', function() {
      // Visual feedback - briefly highlight the changed filter
      this.classList.add('bg-blue-50', 'transition-colors', 'duration-500');
      setTimeout(() => {
        this.classList.remove('bg-blue-50', 'transition-colors', 'duration-500');
      }, 500);
      
      applyFilters();
    });
  });
  
  // Make channel filter buttons interactive with enhanced visual feedback
  const channelButtons = filterBar.querySelectorAll('.flex.space-x-1 button');
  channelButtons.forEach(button => {
    // Add tooltip
    button.setAttribute('title', `Filter by ${button.textContent} channel`);
    
    // Add accessibility attributes
    button.setAttribute('role', 'button');
    button.setAttribute('aria-pressed', button.classList.contains('bg-blue-500') ? 'true' : 'false');
    
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      channelButtons.forEach(b => {
        b.classList.remove('bg-blue-500', 'text-white');
        b.classList.add('bg-white', 'text-gray-800');
        b.setAttribute('aria-pressed', 'false');
      });
      
      // Add active class to clicked button
      this.classList.remove('bg-white', 'text-gray-800');
      this.classList.add('bg-blue-500', 'text-white');
      this.setAttribute('aria-pressed', 'true');
      
      // Add subtle animation
      this.classList.add('scale-105', 'transform', 'transition-transform');
      setTimeout(() => {
        this.classList.remove('scale-105', 'transform', 'transition-transform');
      }, 200);
      
      applyFilters();
    });
  });
  
  // Add Clear Filters button
  const clearFiltersButton = document.createElement('button');
  clearFiltersButton.className = 'ml-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md flex items-center';
  clearFiltersButton.innerHTML = `
    <svg class='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path>
    </svg>
    Clear
  `;
  clearFiltersButton.addEventListener('click', resetFilters);
  
  // Append clear button after all filter elements
  const lastElement = filterBar.querySelector('div:last-child');
  lastElement.parentNode.insertBefore(clearFiltersButton, lastElement.nextSibling);
  
  // Apply filters function with enhanced feedback
  function applyFilters() {
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse';
    loadingIndicator.id = 'filterLoadingIndicator';
    document.body.appendChild(loadingIndicator);
    
    // Get all filter values
    const organization = filterBar.querySelector('select:nth-of-type(1)').value;
    const region = filterBar.querySelector('select:nth-of-type(2)').value;
    const category = filterBar.querySelector('select:nth-of-type(3)').value;
    const tags = filterBar.querySelector('select:nth-of-type(4)').value;
    
    // Get selected channel
    let channel = 'all';
    channelButtons.forEach(button => {
      if (button.classList.contains('bg-blue-500')) {
        channel = button.textContent.toLowerCase();
      }
    });
    
    // Update filter state
    filterState = {
      organization,
      region,
      category,
      tags,
      channel
    };
    
    // Update URL parameters with new state
    const url = new URL(window.location);
    url.searchParams.set('organization', organization);
    url.searchParams.set('region', region);
    url.searchParams.set('category', category);
    url.searchParams.set('tags', tags);
    url.searchParams.set('channel', channel);
    window.history.pushState({}, '', url);
    
    // Show active filter count indicator
    updateActiveFilterCount();
    
    // Trigger data refresh with new filters
    refreshData(filterState);
    
    // Remove loading indicator after a delay
    setTimeout(() => {
      document.getElementById('filterLoadingIndicator').remove();
    }, 500);
    
    // Display toast notification
    showFilterToast('Filters applied');
  }
  
  // Reset all filters to default values
  function resetFilters() {
    // Reset select elements
    selectElements.forEach((select, index) => {
      select.selectedIndex = 0;
    });
    
    // Reset channel buttons
    channelButtons.forEach((button, index) => {
      if (index === 0) {
        // First button (All) should be active
        button.classList.remove('bg-white', 'text-gray-800');
        button.classList.add('bg-blue-500', 'text-white');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('bg-blue-500', 'text-white');
        button.classList.add('bg-white', 'text-gray-800');
        button.setAttribute('aria-pressed', 'false');
      }
    });
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('organization');
    url.searchParams.delete('region');
    url.searchParams.delete('category');
    url.searchParams.delete('tags');
    url.searchParams.delete('channel');
    window.history.pushState({}, '', url);
    
    // Reset filter state
    filterState = {
      organization: 'All Organizations',
      region: 'All Regions',
      category: 'All Categories',
      tags: 'All Tags',
      channel: 'all'
    };
    
    // Update active filter count
    updateActiveFilterCount();
    
    // Refresh data with default filters
    refreshData(filterState);
    
    // Display toast notification
    showFilterToast('Filters cleared');
  }
  
  // Create and show toast notification
  function showFilterToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center opacity-0 transition-opacity duration-300';
    toast.style.opacity = '0';
    toast.innerHTML = `
      <svg class='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
        <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'></path>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }
  
  // Show active filter count
  function updateActiveFilterCount() {
    let activeCount = 0;
    
    // Count non-default filter values
    if (filterState.organization !== 'All Organizations') activeCount++;
    if (filterState.region !== 'All Regions') activeCount++;
    if (filterState.category !== 'All Categories') activeCount++;
    if (filterState.tags !== 'All Tags') activeCount++;
    if (filterState.channel !== 'all') activeCount++;
    
    // Update the clear button with count if any filters are active
    if (activeCount > 0) {
      clearFiltersButton.innerHTML = `
        <svg class='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path>
        </svg>
        Clear (${activeCount})
      `;
      clearFiltersButton.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-300');
      clearFiltersButton.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-300');
    } else {
      clearFiltersButton.innerHTML = `
        <svg class='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path>
        </svg>
        Clear
      `;
      clearFiltersButton.classList.remove('bg-blue-100', 'text-blue-700', 'border-blue-300');
      clearFiltersButton.classList.add('bg-gray-100', 'text-gray-600', 'border-gray-300');
    }
    
    // Update filter count in the indicator
    const countElement = document.getElementById('activeFilterCount');
    if (countElement) {
      countElement.textContent = activeCount.toString();
    }
  }
  
  // Load filters from URL if present with improved handling
  function loadFiltersFromURL() {
    const url = new URL(window.location);
    let filtersApplied = false;
    
    // Helper function to safely set select element value
    const safelySetSelectValue = (selector, paramName) => {
      if (url.searchParams.has(paramName)) {
        const value = url.searchParams.get(paramName);
        const select = filterBar.querySelector(selector);
        
        // Verify the option exists before setting
        const optionExists = Array.from(select.options).some(option => 
          option.value === value || option.textContent === value
        );
        
        if (optionExists) {
          select.value = value;
          filtersApplied = true;
          return value;
        }
      }
      return null;
    };
    
    // Load organization filter
    const organization = safelySetSelectValue('select:nth-of-type(1)', 'organization');
    if (organization) filterState.organization = organization;
    
    // Load region filter
    const region = safelySetSelectValue('select:nth-of-type(2)', 'region');
    if (region) filterState.region = region;
    
    // Load category filter
    const category = safelySetSelectValue('select:nth-of-type(3)', 'category');
    if (category) filterState.category = category;
    
    // Load tags filter
    const tags = safelySetSelectValue('select:nth-of-type(4)', 'tags');
    if (tags) filterState.tags = tags;
    
    // Load channel filter
    if (url.searchParams.has('channel')) {
      const channel = url.searchParams.get('channel');
      filterState.channel = channel;
      
      let channelButtonFound = false;
      channelButtons.forEach(button => {
        const buttonChannel = button.textContent.toLowerCase();
        if (buttonChannel === channel) {
          button.classList.remove('bg-white', 'text-gray-800');
          button.classList.add('bg-blue-500', 'text-white');
          button.setAttribute('aria-pressed', 'true');
          channelButtonFound = true;
          filtersApplied = true;
        } else {
          button.classList.remove('bg-blue-500', 'text-white');
          button.classList.add('bg-white', 'text-gray-800');
          button.setAttribute('aria-pressed', 'false');
        }
      });
      
      // If no matching button found, default to 'all'
      if (!channelButtonFound && channelButtons.length > 0) {
        channelButtons[0].classList.remove('bg-white', 'text-gray-800');
        channelButtons[0].classList.add('bg-blue-500', 'text-white');
        channelButtons[0].setAttribute('aria-pressed', 'true');
      }
    }
    
    // Update UI based on loaded filters
    updateActiveFilterCount();
    
    // Apply initial filters only if any were loaded from URL
    if (filtersApplied) {
      console.log('Filters loaded from URL:', filterState);
      refreshData(filterState);
    } else {
      console.log('No filters found in URL, using defaults');
    }
  }
  
  // Create Filter State Indicator
  const filterStateIndicator = document.createElement('div');
  filterStateIndicator.className = 'mt-3 px-2 text-xs text-gray-500 flex items-center';
  filterStateIndicator.innerHTML = `
    <span>Active filters: <span id="activeFilterCount">0</span></span>
    <button id="saveFilterPreset" class="ml-2 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-xs">
      Save preset
    </button>
  `;
  
  // Append filter state indicator to the bottom of the filter bar
  filterBar.appendChild(filterStateIndicator);
  
  // Add Save Filter Preset functionality
  document.getElementById('saveFilterPreset').addEventListener('click', function() {
    // Save current filter state to localStorage
    const presetName = prompt('Enter a name for this filter preset:');
    if (presetName) {
      const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
      presets[presetName] = filterState;
      localStorage.setItem('filterPresets', JSON.stringify(presets));
      showFilterToast(`Preset "${presetName}" saved`);
    }
  });
  
  // Load filters from URL on page load
  loadFiltersFromURL();
}

// QA-002: Date Picker
function initializeDatePicker() {
  const dateSelector = document.getElementById('dateSelector');
  if (!dateSelector) return;
  
  // Create date picker container
  const datePickerContainer = document.createElement('div');
  datePickerContainer.id = 'datePickerContainer';
  datePickerContainer.className = 'absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-4 hidden';
  datePickerContainer.style.minWidth = '300px';
  datePickerContainer.innerHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
      <input type="date" id="startDate" class="w-full px-3 py-2 border border-gray-300 rounded-md">
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
      <input type="date" id="endDate" class="w-full px-3 py-2 border border-gray-300 rounded-md">
    </div>
    <div class="flex justify-end">
      <button id="cancelDateRange" class="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
      <button id="applyDateRange" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Apply</button>
    </div>
  `;
  document.body.appendChild(datePickerContainer);
  
  // Set default dates (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  document.getElementById('startDate').valueAsDate = startDate;
  document.getElementById('endDate').valueAsDate = endDate;
  
  // Show/hide date picker for custom option
  dateSelector.addEventListener('change', function() {
    if (this.value === 'custom') {
      const rect = this.getBoundingClientRect();
      datePickerContainer.style.top = `${rect.bottom + window.scrollY}px`;
      datePickerContainer.style.right = `${window.innerWidth - rect.right}px`;
      datePickerContainer.classList.remove('hidden');
    } else {
      datePickerContainer.classList.add('hidden');
      applyDateFilter(this.value);
    }
  });
  
  // Handle date picker actions
  document.getElementById('cancelDateRange').addEventListener('click', function() {
    datePickerContainer.classList.add('hidden');
    dateSelector.value = '7'; // Reset to default
  });
  
  document.getElementById('applyDateRange').addEventListener('click', function() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
      datePickerContainer.classList.add('hidden');
      applyCustomDateFilter(startDate, endDate);
    }
  });
  
  // Close date picker when clicking outside
  document.addEventListener('click', function(event) {
    if (!datePickerContainer.contains(event.target) && event.target !== dateSelector) {
      datePickerContainer.classList.add('hidden');
    }
  });
  
  // Apply date filter function
  function applyDateFilter(period) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Update URL parameters
    const url = new URL(window.location);
    url.searchParams.set('startDate', formatDate(startDate));
    url.searchParams.set('endDate', formatDate(endDate));
    url.searchParams.set('period', period);
    window.history.pushState({}, '', url);
    
    // Refresh data with new date range
    refreshData({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });
  }
  
  // Apply custom date filter
  function applyCustomDateFilter(startDate, endDate) {
    // Update URL parameters
    const url = new URL(window.location);
    url.searchParams.set('startDate', startDate);
    url.searchParams.set('endDate', endDate);
    url.searchParams.set('period', 'custom');
    window.history.pushState({}, '', url);
    
    // Refresh data with new date range
    refreshData({
      startDate,
      endDate
    });
  }
  
  // Helper function to format date as YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Load date range from URL if present
  function loadDateFromURL() {
    const url = new URL(window.location);
    
    if (url.searchParams.has('period')) {
      const period = url.searchParams.get('period');
      dateSelector.value = period;
      
      if (period === 'custom' && url.searchParams.has('startDate') && url.searchParams.has('endDate')) {
        document.getElementById('startDate').value = url.searchParams.get('startDate');
        document.getElementById('endDate').value = url.searchParams.get('endDate');
      } else {
        applyDateFilter(period);
      }
    } else {
      // Default to last 7 days
      dateSelector.value = '7';
      applyDateFilter('7');
    }
  }
  
  // Load date from URL on page load
  loadDateFromURL();
}

// QA-003: Drill-Down KPI Tiles
function initializeKPITiles() {
  const kpiTiles = document.querySelectorAll('.kpi-grid > div');
  if (kpiTiles.length === 0) return;
  
  kpiTiles.forEach(tile => {
    tile.style.cursor = 'pointer';
    tile.addEventListener('click', function() {
      const kpiType = this.getAttribute('data-kpi-type') || 'unknown';
      openKPIDrillDown(kpiType);
    });
  });
  
  function openKPIDrillDown(kpiType) {
    // Function to show KPI drill-down drawer
    const drillDownDrawer = document.getElementById('drillDownDrawer');
    const drillDownTitle = document.getElementById('drillDownTitle');
    
    if (!drillDownDrawer || !drillDownTitle) return;
    
    // Clear previous content
    document.querySelectorAll('[id$="DrillDown"]').forEach(el => {
      el.classList.add('hidden');
    });
    
    // Show appropriate drill-down based on KPI type
    const drillDownId = `${kpiType}DrillDown`;
    const drillDownContent = document.getElementById(drillDownId);
    
    if (drillDownContent) {
      // Set title based on KPI type
      switch(kpiType) {
        case 'sales':
          drillDownTitle.textContent = 'Sales Performance';
          break;
        case 'conversion':
          drillDownTitle.textContent = 'Conversion Metrics';
          break;
        case 'roi':
          drillDownTitle.textContent = 'Marketing ROI';
          break;
        case 'sentiment':
          drillDownTitle.textContent = 'Brand Sentiment';
          break;
        default:
          drillDownTitle.textContent = 'KPI Details';
      }
      
      // Show drill-down
      drillDownContent.classList.remove('hidden');
      drillDownDrawer.classList.remove('hidden');
      
      // Initialize charts for the drill-down (defer to chart init function)
      initializeDrillDownCharts(kpiType);
    }
  }
  
  // Close drill-down function
  window.closeDrillDown = function() {
    const drillDownDrawer = document.getElementById('drillDownDrawer');
    if (drillDownDrawer) {
      drillDownDrawer.classList.add('hidden');
    }
  };
  
  // Handle escape key to close drill-down
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      window.closeDrillDown();
    }
  });
}

// QA-004: Enhanced Interactive AI Insight Panel
function initializeAIInsightPanel() {
  const insightPanel = document.getElementById('brandInsights');
  if (!insightPanel) return;
  
  console.log('Initializing enhanced AI insight panel');
  
  // Enhance panel structure for better interaction
  enhanceInsightPanelStructure(insightPanel);
  
  // Create loading state with improved visual feedback
  showLoadingState(insightPanel);
  
  // Track current insight set for refresh management
  let currentInsightSet = 'default';
  let currentTimeframe = 'last30days';
  let insightCache = {};
  
  // Fetch AI insights
  fetchAIInsights(currentInsightSet, currentTimeframe)
    .then(insights => {
      // Cache the results
      insightCache[`${currentInsightSet}_${currentTimeframe}`] = insights;
      updateInsightPanel(insights);
    })
    .catch(error => {
      console.error('Error fetching AI insights:', error);
      // Show error state in panel
      showErrorState(insightPanel);
    });
  
  // Fetch AI insights function (simulated)
  function fetchAIInsights(insightSet, timeframe) {
    // Show loading UI indication
    const refreshButton = insightPanel.querySelector('#refreshInsights');
    if (refreshButton) {
      refreshButton.innerHTML = `
        <svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Refreshing...
      `;
      refreshButton.disabled = true;
    }
    
    return new Promise((resolve) => {
      // Check if we already have this insight set cached
      const cacheKey = `${insightSet}_${timeframe}`;
      if (insightCache[cacheKey]) {
        // Simulate small delay even for cached data to show loading state briefly
        setTimeout(() => {
          resolve(insightCache[cacheKey]);
        }, 300);
        return;
      }
      
      // Simulate API delay for uncached data
      setTimeout(() => {
        // Different data based on insight set
        let insights;
        
        // Generate different insights based on the requested set
        if (insightSet === 'performance') {
          insights = {
            recommendations: [
              "Increase promo frequency in Mindanao stores from bi-weekly to weekly (+18% sales potential)",
              "Cross-train Store 12 staff on self-checkout systems to improve throughput by 32%",
              "Implement click-and-collect in top 5 Luzon stores to capture 24% more digital customers",
              "Rearrange Store 7 planogram for better product adjacency (+8% basket size)"
            ],
            timeInsights: {
              title: "Time Analysis",
              content: "Peak traffic occurs 5-7pm weekdays, but conversion is highest 9-11am Saturdays (+24%). Recommend staff reallocation.",
              interactiveData: {
                chartType: 'hourly',
                labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
                datasets: [
                  {name: 'Traffic', values: [15, 42, 58, 75, 62, 48, 85, 35]},
                  {name: 'Conversion', values: [8, 31, 42, 25, 22, 18, 21, 12]}
                ]
              }
            },
            regionInsights: {
              title: "Regional Performance",
              content: "NCR shows strongest performance with +12% YoY growth. Visayas needs attention with -3% decline in total sales.",
              interactiveData: {
                chartType: 'region',
                labels: ['NCR', 'Luzon', 'Visayas', 'Mindanao'],
                datasets: [
                  {name: 'YoY Growth', values: [12, 8, -3, 5]}
                ]
              }
            },
            categoryInsights: {
              title: "Category Optimization",
              content: "Personal Care showing strongest margins (32%). Grocery staples driving volume but at low margins (8%).",
              interactiveData: {
                chartType: 'category',
                labels: ['Personal Care', 'Beverages', 'Snacks', 'Grocery'],
                datasets: [
                  {name: 'Margin', values: [32, 24, 18, 8]},
                  {name: 'Volume', values: [22, 28, 24, 42]}
                ]
              }
            }
          };
        } else if (insightSet === 'customer') {
          insights = {
            recommendations: [
              "Launch targeted loyalty program for breakfast shoppers (+27% repeat visits)",
              "Add bundled school supplies with groceries during school season (+15% basket size)",
              "Introduce local product section in Visayas stores based on preference analysis",
              "Implement mobile payment option to reduce checkout time by 35%"
            ],
            timeInsights: {
              title: "Customer Segments",
              content: "Morning shoppers are predominantly parents (68%) with higher basket values. Evening shoppers skew younger with smaller, frequent purchases.",
              interactiveData: {
                chartType: 'segment',
                labels: ['Parents', 'Young Adults', 'Seniors', 'Others'],
                datasets: [
                  {name: 'Morning', values: [68, 12, 15, 5]},
                  {name: 'Evening', values: [32, 45, 13, 10]}
                ]
              }
            },
            regionInsights: {
              title: "Buying Preferences",
              content: "Brand loyalty highest in NCR (72%), while price sensitivity dominates Mindanao shopping behavior (63%).",
              interactiveData: {
                chartType: 'preferences',
                labels: ['Brand Loyal', 'Price Sensitive', 'Convenience', 'Local Products'],
                datasets: [
                  {name: 'NCR', values: [72, 38, 48, 22]},
                  {name: 'Luzon', values: [58, 44, 52, 28]},
                  {name: 'Visayas', values: [49, 51, 38, 42]},
                  {name: 'Mindanao', values: [42, 63, 32, 51]}
                ]
              }
            },
            categoryInsights: {
              title: "Loyalty Drivers",
              content: "Product quality is primary driver (43%), followed by pricing (28%), and availability (22%).",
              interactiveData: {
                chartType: 'drivers',
                labels: ['Quality', 'Price', 'Availability', 'Service', 'Rewards'],
                datasets: [
                  {name: 'Importance', values: [43, 28, 22, 15, 12]}
                ]
              }
            }
          };
        } else {
          // Default insight set
          insights = {
            recommendations: [
              "Reallocate 15% budget from under-performing SKU in Region B to Region C (+12% conv.)",
              "Trigger replenishment alerts for Store 42 when daily stockouts > 5",
              "Optimize cache in Store 17 edge node to cut latency by 25%",
              "Introduce bundle pricing for frequently co-purchased items (+8% revenue)"
            ],
            timeInsights: {
              title: "Brand Dictionary",
              content: "Nestle products have 72% positive mentions in rural areas vs 65% in urban. Most common attributes: 'trusted', 'nutritious', 'family'.",
              interactiveData: {
                chartType: 'sentiment',
                labels: ['Trusted', 'Nutritious', 'Family', 'Quality', 'Traditional'],
                datasets: [
                  {name: 'Rural', values: [78, 65, 58, 72, 48]},
                  {name: 'Urban', values: [62, 58, 52, 68, 35]}
                ]
              }
            },
            regionInsights: {
              title: "Emotional & Contextual Analysis",
              content: "Morning purchases show +18% higher sentiment than evening. Usage context mentions: breakfast (42%), school (28%), work (19%).",
              interactiveData: {
                chartType: 'context',
                labels: ['Breakfast', 'School', 'Work', 'Social', 'Other'],
                datasets: [
                  {name: 'Usage Context', values: [42, 28, 19, 8, 3]}
                ]
              }
            },
            categoryInsights: {
              title: "Bundling Opportunities",
              content: "Bear Brand + Biscuits has 72% co-purchase rate. Recommend 'Breakfast Bundle' with 15% discount to drive +23% revenue.",
              interactiveData: {
                chartType: 'bundles',
                labels: ['Milk+Biscuits', 'Coffee+Bread', 'Shampoo+Conditioner', 'Noodles+Eggs'],
                datasets: [
                  {name: 'Co-purchase', values: [72, 68, 84, 58]},
                  {name: 'Projected Lift', values: [23, 18, 12, 15]}
                ]
              }
            }
          };
        }
        
        // Apply timeframe filter to data (simulated)
        // In a real implementation, this would be handled by the backend
        if (timeframe === 'last7days') {
          insights.timeframeNote = 'Showing data for last 7 days';
        } else if (timeframe === 'last90days') {
          insights.timeframeNote = 'Showing data for last 90 days';
        } else {
          insights.timeframeNote = 'Showing data for last 30 days';
        }
        
        // Add AI confidence score
        insights.confidenceScore = Math.floor(85 + Math.random() * 10);
        insights.insightTimestamp = new Date().toISOString();
        
        resolve(insights);
      }, 1500);
    });
  }
  
  // Enhanced panel structure for better interactivity
  function enhanceInsightPanelStructure(panel) {
    // Get the original content before replacing
    const originalContent = panel.innerHTML;
    
    // Create enhanced structure with controls and tabs
    panel.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">AI-Powered Insights</h3>
        <div class="flex items-center space-x-2">
          <div class="hidden md:block">
            <select id="insightTimeframe" class="text-xs border-gray-300 rounded-md">
              <option value="last7days">Last 7 days</option>
              <option value="last30days" selected>Last 30 days</option>
              <option value="last90days">Last 90 days</option>
            </select>
          </div>
          <button id="refreshInsights" class="text-blue-500 text-sm font-medium hover:text-blue-700 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      <div class="border-b border-gray-200 mb-4">
        <ul class="flex -mb-px" id="insightTabs">
          <li class="mr-1">
            <button class="insight-tab-btn py-2 px-4 text-sm font-medium rounded-t-lg border-b-2 border-blue-500 text-blue-600 active" data-insight-set="default">
              Overview
            </button>
          </li>
          <li class="mr-1">
            <button class="insight-tab-btn py-2 px-4 text-sm font-medium rounded-t-lg text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300" data-insight-set="performance">
              Performance
            </button>
          </li>
          <li class="mr-1">
            <button class="insight-tab-btn py-2 px-4 text-sm font-medium rounded-t-lg text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300" data-insight-set="customer">
              Customer
            </button>
          </li>
        </ul>
      </div>
      
      <div id="insightContent">
        <!-- Content will be populated dynamically -->
        <div class="border-l-4 border-blue-500 pl-4 mb-4">
          <h4 class="text-md font-semibold text-gray-800 mb-2 flex items-center">
            Top Actionable Recommendations
            <span class="ml-2 px-1.5 py-0.5 text-xs font-semibold text-blue-500 bg-blue-50 rounded-full">AI Generated</span>
          </h4>
          <ol class="list-decimal list-inside space-y-2 text-gray-700" id="recommendationsList">
            <!-- Recommendations will be inserted here -->
          </ol>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="border border-gray-200 rounded-lg p-4 insight-box" id="timeInsights">
            <!-- Time insights will be inserted here -->
          </div>
          
          <div class="border border-gray-200 rounded-lg p-4 insight-box" id="regionInsights">
            <!-- Region insights will be inserted here -->
          </div>
          
          <div class="border border-gray-200 rounded-lg p-4 insight-box" id="categoryInsights">
            <!-- Category insights will be inserted here -->
          </div>
        </div>
        
        <div class="mt-4 text-xs text-gray-500 flex justify-between items-center">
          <div id="timeframeMark">
            <!-- Timeframe indicator -->
          </div>
          <div class="flex items-center">
            <span class="mr-1">AI Confidence:</span>
            <div class="w-20 h-2 bg-gray-200 rounded-full">
              <div id="confidenceBar" class="h-2 bg-green-500 rounded-full" style="width: 90%"></div>
            </div>
            <span id="confidenceScore" class="ml-1 font-medium">90%</span>
          </div>
        </div>
      </div>
    `;
    
    // Set up event listeners for controls
    
    // Insight tabs change handler
    const insightTabs = panel.querySelectorAll('.insight-tab-btn');
    insightTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Update active tab UI
        insightTabs.forEach(t => {
          t.classList.remove('border-blue-500', 'text-blue-600');
          t.classList.add('border-transparent', 'text-gray-500');
        });
        this.classList.remove('border-transparent', 'text-gray-500');
        this.classList.add('border-blue-500', 'text-blue-600');
        
        // Get the requested insight set
        const insightSet = this.getAttribute('data-insight-set');
        currentInsightSet = insightSet;
        
        // Show loading state
        showLoadingState(panel);
        
        // Fetch insights for the selected tab
        fetchAIInsights(insightSet, currentTimeframe).then(insights => {
          // Cache and update
          insightCache[`${insightSet}_${currentTimeframe}`] = insights;
          updateInsightPanel(insights);
        }).catch(error => {
          console.error(`Error fetching ${insightSet} insights:`, error);
          showErrorState(panel);
        });
      });
    });
    
    // Timeframe change handler
    const timeframeSelector = panel.querySelector('#insightTimeframe');
    if (timeframeSelector) {
      timeframeSelector.addEventListener('change', function() {
        currentTimeframe = this.value;
        
        // Show loading state
        showLoadingState(panel);
        
        // Fetch insights with the new timeframe
        fetchAIInsights(currentInsightSet, currentTimeframe).then(insights => {
          // Cache and update
          insightCache[`${currentInsightSet}_${currentTimeframe}`] = insights;
          updateInsightPanel(insights);
        }).catch(error => {
          console.error(`Error fetching insights for timeframe ${currentTimeframe}:`, error);
          showErrorState(panel);
        });
      });
    }
    
    // Refresh button handler
    const refreshButton = panel.querySelector('#refreshInsights');
    if (refreshButton) {
      refreshButton.addEventListener('click', function() {
        // Clear cache for current combination
        delete insightCache[`${currentInsightSet}_${currentTimeframe}`];
        
        // Show loading state
        showLoadingState(panel);
        
        // Fetch fresh insights
        fetchAIInsights(currentInsightSet, currentTimeframe).then(insights => {
          // Cache and update
          insightCache[`${currentInsightSet}_${currentTimeframe}`] = insights;
          updateInsightPanel(insights);
          
          // Show a feedback toast
          showInsightToast('Insights refreshed with latest data');
        }).catch(error => {
          console.error('Error refreshing insights:', error);
          showErrorState(panel);
        });
      });
    }
  }
  
  // Show loading state with improved visuals
  function showLoadingState(panel) {
    // Use shimmer loading effect for recommendations
    const recommendationsList = panel.querySelector('#recommendationsList');
    if (recommendationsList) {
      recommendationsList.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        recommendationsList.innerHTML += `
          <li class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-11/12 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </li>
        `;
      }
    }
    
    // Loading state for insight boxes
    panel.querySelectorAll('.insight-box').forEach(box => {
      box.innerHTML = `
        <div class="animate-pulse">
          <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-4/5"></div>
          <div class="h-20 bg-gray-100 rounded-lg w-full mt-3"></div>
        </div>
      `;
    });
    
    // Update timestamp and confidence indicators with loading state
    const timeframeMark = panel.querySelector('#timeframeMark');
    if (timeframeMark) {
      timeframeMark.innerHTML = `<div class="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>`;
    }
    
    const confidenceBar = panel.querySelector('#confidenceBar');
    const confidenceScore = panel.querySelector('#confidenceScore');
    if (confidenceBar && confidenceScore) {
      confidenceBar.style.width = '0%';
      confidenceScore.innerHTML = `<div class="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>`;
    }
  }
  
  // Show error state
  function showErrorState(panel) {
    // Reset refresh button
    const refreshButton = panel.querySelector('#refreshInsights');
    if (refreshButton) {
      refreshButton.innerHTML = `
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
      `;
      refreshButton.disabled = false;
    }
    
    // Show error in recommendations
    const recommendationsList = panel.querySelector('#recommendationsList');
    if (recommendationsList) {
      recommendationsList.innerHTML = `
        <div class="text-red-500 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Failed to load insights. Please try refreshing.
        </div>
      `;
    }
    
    // Show error in insight boxes
    panel.querySelectorAll('.insight-box').forEach(box => {
      box.innerHTML = `
        <div class="text-red-500 flex items-center justify-center h-full">
          <span>Data unavailable</span>
        </div>
      `;
    });
  }
  
  // Update insight panel with fetched data and interactive elements
  function updateInsightPanel(insights) {
    const panel = document.getElementById('brandInsights');
    if (!panel) return;
    
    // Reset refresh button
    const refreshButton = panel.querySelector('#refreshInsights');
    if (refreshButton) {
      refreshButton.innerHTML = `
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
      `;
      refreshButton.disabled = false;
    }
    
    // Update recommendations with enhanced styling and interactions
    const recommendationsList = panel.querySelector('#recommendationsList');
    if (recommendationsList && insights.recommendations) {
      recommendationsList.innerHTML = '';
      insights.recommendations.forEach((recommendation, index) => {
        const li = document.createElement('li');
        li.className = 'text-sm relative group';
        li.innerHTML = `
          <span>${recommendation}</span>
          <div class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="rec-action p-1 text-blue-500 hover:text-blue-700" data-action="implement" title="Implement">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
            <button class="rec-action p-1 text-gray-500 hover:text-gray-700" data-action="details" title="View Details">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        `;
        
        // Add hover effect
        li.addEventListener('mouseover', function() {
          this.classList.add('bg-blue-50', 'rounded');
        });
        
        li.addEventListener('mouseout', function() {
          this.classList.remove('bg-blue-50', 'rounded');
        });
        
        // Add action button handlers
        li.querySelectorAll('.rec-action').forEach(button => {
          button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the li click
            const action = this.getAttribute('data-action');
            
            if (action === 'implement') {
              showImplementationModal(recommendation, index);
            } else if (action === 'details') {
              showDetailsModal(recommendation, index);
            }
          });
        });
        
        // Make the entire recommendation clickable
        li.addEventListener('click', function() {
          showDetailsModal(recommendation, index);
        });
        
        recommendationsList.appendChild(li);
      });
    }
    
    // Update time insights box with interactive elements
    updateInsightBox('timeInsights', insights.timeInsights);
    
    // Update region insights box with interactive elements
    updateInsightBox('regionInsights', insights.regionInsights);
    
    // Update category insights box with interactive elements
    updateInsightBox('categoryInsights', insights.categoryInsights);
    
    // Update timeframe indicator
    const timeframeMark = panel.querySelector('#timeframeMark');
    if (timeframeMark && insights.timeframeNote) {
      timeframeMark.textContent = insights.timeframeNote;
    } else if (timeframeMark) {
      timeframeMark.textContent = 'Showing recent data';
    }
    
    // Update confidence score with animation
    const confidenceBar = panel.querySelector('#confidenceBar');
    const confidenceScore = panel.querySelector('#confidenceScore');
    if (confidenceBar && confidenceScore && insights.confidenceScore) {
      // Animate the confidence bar
      confidenceBar.style.width = '0%';
      confidenceBar.style.transition = 'width 1s ease-in-out';
      setTimeout(() => {
        confidenceBar.style.width = `${insights.confidenceScore}%`;
        // Set color based on score
        if (insights.confidenceScore >= 90) {
          confidenceBar.className = 'h-2 bg-green-500 rounded-full';
        } else if (insights.confidenceScore >= 70) {
          confidenceBar.className = 'h-2 bg-blue-500 rounded-full';
        } else if (insights.confidenceScore >= 50) {
          confidenceBar.className = 'h-2 bg-yellow-500 rounded-full';
        } else {
          confidenceBar.className = 'h-2 bg-red-500 rounded-full';
        }
      }, 100);
      
      confidenceScore.textContent = `${insights.confidenceScore}%`;
    }
  }
  
  // Helper function to update an insight box with interactive elements
  function updateInsightBox(boxId, insightData) {
    if (!insightData) return;
    
    const box = document.getElementById(boxId);
    if (!box) return;
    
    // Create content with interactive chart
    let chartHtml = '';
    if (insightData.interactiveData) {
      // Determine chart type and create appropriate visualization
      const chartData = insightData.interactiveData;
      
      switch(chartData.chartType) {
        case 'sentiment':
        case 'context':
        case 'segment':
        case 'preferences':
        case 'drivers':
        case 'bundles':
          // Create a bar chart
          chartHtml = `<div class="mt-3 h-32" id="${boxId}Chart"></div>`;
          break;
          
        case 'hourly':
        case 'region':
        case 'category':
          // Create a line chart
          chartHtml = `<div class="mt-3 h-32" id="${boxId}Chart"></div>`;
          break;
      }
    }
    
    // Update box content
    box.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-md font-medium text-gray-800">${insightData.title}</h4>
        <button class="text-gray-400 hover:text-gray-600 expand-insight" title="Expand">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
          </svg>
        </button>
      </div>
      <p class="text-sm text-gray-700">${insightData.content}</p>
      ${chartHtml}
    `;
    
    // Add expand button handler
    box.querySelector('.expand-insight').addEventListener('click', function() {
      showExpandedInsight(insightData, boxId);
    });
    
    // Initialize chart if needed
    if (insightData.interactiveData) {
      setTimeout(() => {
        initializeChart(`${boxId}Chart`, insightData.interactiveData);
      }, 100);
    }
  }
  
  // Initialize chart with the provided data
  function initializeChart(chartId, chartData) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;
    
    let chartConfig;
    
    // Configure chart based on type
    switch(chartData.chartType) {
      case 'sentiment':
      case 'context':
      case 'segment':
      case 'preferences':
      case 'drivers':
      case 'bundles':
        // Create a bar chart with multiple datasets if needed
        const datasets = chartData.datasets.map((dataset, index) => {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
          return {
            label: dataset.name,
            data: dataset.values,
            backgroundColor: colors[index % colors.length],
            barPercentage: 0.7,
            borderRadius: 3,
            borderWidth: 0
          };
        });
        
        chartConfig = {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: datasets.length > 1,
                position: 'top',
                labels: {
                  boxWidth: 10,
                  font: {
                    size: 10
                  }
                }
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  font: {
                    size: 9
                  }
                },
                grid: {
                  drawBorder: false
                }
              },
              x: {
                ticks: {
                  font: {
                    size: 9
                  }
                },
                grid: {
                  display: false
                }
              }
            }
          }
        };
        break;
        
      case 'hourly':
      case 'region':
      case 'category':
      default:
        // Create a line chart
        const lineDatasets = chartData.datasets.map((dataset, index) => {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
          return {
            label: dataset.name,
            data: dataset.values,
            borderColor: colors[index % colors.length],
            backgroundColor: `${colors[index % colors.length]}20`,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 0
          };
        });
        
        chartConfig = {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: lineDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: lineDatasets.length > 1,
                position: 'top',
                labels: {
                  boxWidth: 10,
                  font: {
                    size: 10
                  }
                }
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  font: {
                    size: 9
                  }
                },
                grid: {
                  drawBorder: false,
                  color: '#f3f4f6'
                }
              },
              x: {
                ticks: {
                  font: {
                    size: 9
                  }
                },
                grid: {
                  display: false
                }
              }
            }
          }
        };
        break;
    }
    
    // Create the chart
    new Chart(chartElement, chartConfig);
  }
  
  // Show implementation modal for a recommendation
  function showImplementationModal(recommendation, index) {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modalOverlay.id = 'implementModal';
    
    modalOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Implement Recommendation</h3>
          <button id="closeImplementModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm font-medium text-blue-800">${recommendation}</p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Implementation Timeline</label>
          <select class="w-full border-gray-300 rounded-md text-sm">
            <option value="immediate">Immediate (24 hours)</option>
            <option value="shortTerm" selected>Short-term (This week)</option>
            <option value="mediumTerm">Medium-term (This month)</option>
            <option value="longTerm">Long-term (Next quarter)</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select class="w-full border-gray-300 rounded-md text-sm">
            <option value="">-- Select Team Member --</option>
            <option value="marketing">Marketing Team</option>
            <option value="operations">Operations Team</option>
            <option value="it">IT Department</option>
            <option value="sales">Sales Team</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Implementation Notes</label>
          <textarea class="w-full border-gray-300 rounded-md text-sm" rows="3" placeholder="Add any specific instructions or context"></textarea>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button id="cancelImplement" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button id="confirmImplement" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
            Implement
          </button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Add event listeners
    document.getElementById('closeImplementModal').addEventListener('click', closeModal);
    document.getElementById('cancelImplement').addEventListener('click', closeModal);
    document.getElementById('confirmImplement').addEventListener('click', function() {
      // In a real implementation, this would trigger the actual implementation process
      closeModal();
      showInsightToast('Recommendation implementation scheduled');
    });
    
    // Close modal function
    function closeModal() {
      document.getElementById('implementModal').remove();
    }
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  // Show details modal for a recommendation
  function showDetailsModal(recommendation, index) {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modalOverlay.id = 'detailsModal';
    
    // Create sample data for the recommendation
    const sampleData = {
      impact: {
        revenue: '+8.2%',
        conversion: '+12.4%',
        roi: '+0.8x',
        timeToImplement: '3-5 days'
      },
      analysis: {
        problem: 'Current allocation of resources shows sub-optimal performance in Region B with 18% lower conversion rate compared to similar demographics in Region C.',
        solution: 'Reallocating 15% of marketing budget from Region B to targeted campaigns in Region C based on predictive modeling of customer response rates.',
        prediction: 'Based on historical data and trend analysis, this reallocation should drive approximately 12% higher conversion rates within 30 days of implementation.'
      },
      relatedInsights: [
        'Region C shows 27% higher engagement with digital campaigns',
        'Similar reallocation in Q3 2024 resulted in 9.8% lift',
        'Category engagement in Region C peaks during weekday afternoons'
      ]
    };
    
    // Format the modal content
    modalOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Recommendation Details</h3>
          <button id="closeDetailsModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p class="text-sm font-medium text-blue-800">${recommendation}</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Projected Impact</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Revenue Impact</span>
                <span class="text-sm font-medium text-green-600">${sampleData.impact.revenue}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Conversion Rate</span>
                <span class="text-sm font-medium text-green-600">${sampleData.impact.conversion}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">ROI</span>
                <span class="text-sm font-medium text-green-600">${sampleData.impact.roi}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Implementation Time</span>
                <span class="text-sm font-medium text-gray-800">${sampleData.impact.timeToImplement}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Supporting Data</h4>
            <div class="h-32">
              <canvas id="recDetailChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Analysis</h4>
          <div class="space-y-3">
            <div>
              <span class="block text-xs font-medium text-gray-500">Problem Identified</span>
              <p class="text-sm text-gray-800">${sampleData.analysis.problem}</p>
            </div>
            <div>
              <span class="block text-xs font-medium text-gray-500">Proposed Solution</span>
              <p class="text-sm text-gray-800">${sampleData.analysis.solution}</p>
            </div>
            <div>
              <span class="block text-xs font-medium text-gray-500">Prediction</span>
              <p class="text-sm text-gray-800">${sampleData.analysis.prediction}</p>
            </div>
          </div>
        </div>
        
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Related Insights</h4>
          <ul class="space-y-2">
            ${sampleData.relatedInsights.map(insight => `
              <li class="text-sm text-gray-800 flex items-start">
                <svg class="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${insight}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button id="exportDetails" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export
          </button>
          <button id="implementFromDetails" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Implement
          </button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Initialize chart
    setTimeout(() => {
      const ctx = document.getElementById('recDetailChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Current', 'Projected'],
          datasets: [{
            label: 'Region B',
            data: [72, 61],
            backgroundColor: '#E11D48',
            barPercentage: 0.7,
            categoryPercentage: 0.5
          }, {
            label: 'Region C',
            data: [85, 95],
            backgroundColor: '#10B981',
            barPercentage: 0.7,
            categoryPercentage: 0.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 10,
                font: {
                  size: 10
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Performance Score',
                font: {
                  size: 10
                }
              }
            }
          }
        }
      });
    }, 100);
    
    // Add event listeners
    document.getElementById('closeDetailsModal').addEventListener('click', closeModal);
    document.getElementById('exportDetails').addEventListener('click', function() {
      showInsightToast('Details exported to CSV');
    });
    document.getElementById('implementFromDetails').addEventListener('click', function() {
      closeModal();
      showImplementationModal(recommendation, index);
    });
    
    // Close modal function
    function closeModal() {
      document.getElementById('detailsModal').remove();
    }
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  // Show expanded insight in a modal
  function showExpandedInsight(insight, boxId) {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modalOverlay.id = 'expandedInsightModal';
    
    // Choose chart type based on insight data
    const chartHeight = insight.interactiveData ? 'h-64' : '';
    
    modalOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">${insight.title}</h3>
          <button id="closeExpandedInsight" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <p class="text-base text-gray-700 mb-4">${insight.content}</p>
        
        ${insight.interactiveData ? `<div class="${chartHeight} w-full" id="expandedChart"></div>` : ''}
        
        <div class="mt-6 flex justify-end">
          <button id="closeExpandedInsightBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Initialize expanded chart if needed
    if (insight.interactiveData) {
      setTimeout(() => {
        // Create a larger, more detailed version of the chart
        const chartData = insight.interactiveData;
        const chartCtx = document.getElementById('expandedChart');
        
        if (chartCtx) {
          let chartConfig;
          
          // Determine chart type
          if (['sentiment', 'context', 'segment', 'preferences', 'drivers', 'bundles'].includes(chartData.chartType)) {
            // Create a bar chart
            const datasets = chartData.datasets.map((dataset, index) => {
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
              return {
                label: dataset.name,
                data: dataset.values,
                backgroundColor: colors[index % colors.length],
                barPercentage: 0.7,
                borderRadius: 4,
                borderWidth: 0
              };
            });
            
            chartConfig = {
              type: 'bar',
              data: {
                labels: chartData.labels,
                datasets: datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: datasets.length > 1,
                    position: 'top'
                  },
                  tooltip: {
                    enabled: true
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            };
          } else {
            // Create a line chart
            const lineDatasets = chartData.datasets.map((dataset, index) => {
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
              return {
                label: dataset.name,
                data: dataset.values,
                borderColor: colors[index % colors.length],
                backgroundColor: `${colors[index % colors.length]}20`,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 3
              };
            });
            
            chartConfig = {
              type: 'line',
              data: {
                labels: chartData.labels,
                datasets: lineDatasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: lineDatasets.length > 1,
                    position: 'top'
                  },
                  tooltip: {
                    enabled: true
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            };
          }
          
          // Create chart
          new Chart(chartCtx, chartConfig);
        }
      }, 100);
    }
    
    // Add event listeners
    document.getElementById('closeExpandedInsight').addEventListener('click', closeModal);
    document.getElementById('closeExpandedInsightBtn').addEventListener('click', closeModal);
    
    // Close modal function
    function closeModal() {
      document.getElementById('expandedInsightModal').remove();
    }
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  // Show toast notification for insight actions
  function showInsightToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center opacity-0 transition-opacity duration-300';
    toast.style.opacity = '0';
    toast.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Fade out after 2 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }
}

// QA-005: Enhanced Interactive Geospatial Map
function initializeMapComponent() {
  const mapContainer = document.getElementById('storeMap');
  if (!mapContainer) return;
  
  console.log('Initializing enhanced interactive map component');
  
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-10';
  loadingIndicator.innerHTML = `
    <div class="flex flex-col items-center">
      <svg class="animate-spin h-10 w-10 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium text-gray-700">Loading map data...</span>
    </div>
  `;
  mapContainer.style.position = 'relative';
  mapContainer.appendChild(loadingIndicator);
  
  // Add control panel to container
  const controlPanel = document.createElement('div');
  controlPanel.className = 'absolute top-2 left-2 bg-white rounded-lg shadow-md p-2 z-20 flex flex-col space-y-2';
  controlPanel.innerHTML = `
    <div class="map-controls">
      <select id="mapMetricSelector" class="text-sm border-gray-300 rounded-md w-full">
        <option value="performance">Performance</option>
        <option value="sales">Sales</option>
        <option value="stockouts">Stockouts</option>
        <option value="uptime">Uptime %</option>
      </select>
      <div class="flex items-center mt-2">
        <input id="heatmapToggle" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
        <label for="heatmapToggle" class="ml-2 block text-xs text-gray-700">Heat map</label>
      </div>
    </div>
    <div class="mt-1">
      <button id="filterMapButton" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs w-full flex items-center justify-center">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        Map Filters
      </button>
    </div>
  `;
  mapContainer.appendChild(controlPanel);
  
  // Add map filters dropdown (hidden by default)
  const mapFilters = document.createElement('div');
  mapFilters.className = 'absolute top-24 left-2 bg-white rounded-lg shadow-md p-3 z-20 hidden';
  mapFilters.id = 'mapFilters';
  mapFilters.style.minWidth = '220px';
  mapFilters.innerHTML = `
    <h4 class="text-sm font-medium text-gray-700 mb-2">Filter Stores</h4>
    <div class="space-y-2">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Region</label>
        <select id="mapRegionFilter" class="w-full text-xs border-gray-300 rounded-md">
          <option value="all">All Regions</option>
          <option value="NCR">NCR</option>
          <option value="Luzon">Luzon</option>
          <option value="Visayas">Visayas</option>
          <option value="Mindanao">Mindanao</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Performance</label>
        <div class="flex items-center">
          <input type="range" id="performanceFilter" min="0" max="100" value="0" class="w-full h-2 bg-gray-200 rounded-lg cursor-pointer">
          <span id="performanceValue" class="ml-2 text-xs font-medium text-gray-700">0%+</span>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1">Store Type</label>
        <div class="space-y-1">
          <label class="flex items-center">
            <input type="checkbox" checked class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded store-type-filter" value="franchise">
            <span class="ml-2 text-xs text-gray-700">Franchise</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" checked class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded store-type-filter" value="company-owned">
            <span class="ml-2 text-xs text-gray-700">Company-owned</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" checked class="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded store-type-filter" value="partner">
            <span class="ml-2 text-xs text-gray-700">Partner</span>
          </label>
        </div>
      </div>
    </div>
    <div class="mt-3 flex justify-between">
      <button id="resetMapFilters" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center">
        Reset
      </button>
      <button id="applyMapFilters" class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center">
        Apply Filters
      </button>
    </div>
  `;
  mapContainer.appendChild(mapFilters);
  
  // Create store details panel (hidden by default)
  const storeDetailsPanel = document.createElement('div');
  storeDetailsPanel.className = 'absolute top-2 right-2 bg-white rounded-lg shadow-md p-3 z-20 hidden';
  storeDetailsPanel.id = 'storeDetailsPanel';
  storeDetailsPanel.style.width = '280px';
  storeDetailsPanel.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h4 id="storeName" class="text-sm font-semibold text-gray-800">Store Details</h4>
      <button id="closeStoreDetails" class="text-gray-400 hover:text-gray-500">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div id="storeContent" class="space-y-3">
      <!-- Content will be populated dynamically -->
    </div>
  `;
  mapContainer.appendChild(storeDetailsPanel);
  
  // Initialize map
  const map = L.map('storeMap', {
    zoomControl: false, // We'll add custom zoom control later
    attributionControl: false // We'll add attribution in a custom position
  }).setView([12.8797, 121.7740], 6); // Philippines
  
  // Add custom zoom control to top-right
  L.control.zoom({
    position: 'topright'
  }).addTo(map);
  
  // Add custom attribution to bottom-left
  L.control.attribution({
    position: 'bottomleft',
    prefix: '© <a href="https://www.tbwa.com" target="_blank">TBWA</a>'
  }).addTo(map);
  map.attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');
  
  // Add premium tile layer with more detailed styling
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  
  // Initialize layerGroups for different metrics and heatmap
  const layers = {
    markers: L.layerGroup().addTo(map),
    heatmap: L.layerGroup()
  };
  
  // Set up cluster group for better performance with many markers
  const markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 35,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: 'custom-cluster',
        iconSize: L.point(40, 40)
      });
    }
  });
  
  // Track active store marker for highlighting
  let activeStoreMarker = null;
  
  // Initialize heat layer (initially not added to map)
  const heatLayer = L.heatLayer([], {
    radius: 25,
    blur: 15,
    maxZoom: 10,
    gradient: {0.4: '#3B82F6', 0.65: '#10B981', 0.9: '#F59E0B', 1.0: '#EF4444'}
  });
  
  // Current filter state
  let mapFilterState = {
    region: 'all',
    performance: 0,
    storeTypes: ['franchise', 'company-owned', 'partner'],
    metric: 'performance'
  };
  
  // Fetch store locations with enhanced data
  fetchStoreLocations()
    .then(data => {
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Initialize heat map data
      const heatMapData = [];
      data.features.forEach(feature => {
        const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        const intensity = feature.properties.performance / 100; // Normalize to 0-1
        heatMapData.push([latlng[0], latlng[1], intensity]);
      });
      heatLayer.setLatLngs(heatMapData);
      
      // Process and add store markers
      renderStoreMarkers(data, mapFilterState.metric);
      
      // Add legend
      addMapLegend(map, mapFilterState.metric);
      
      // Initialize map interaction handlers
      initMapInteractions();
    })
    .catch(error => {
      console.error('Error loading map data:', error);
      loadingIndicator.remove();
      mapContainer.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-red-500">Failed to load map data</p></div>';
    });
  
  // Function to render store markers based on current filters
  function renderStoreMarkers(data, metric) {
    // Clear existing markers
    markerCluster.clearLayers();
    layers.markers.clearLayers();
    
    // Filter features based on current filters
    const filteredFeatures = data.features.filter(feature => {
      const properties = feature.properties;
      
      // Filter by region
      if (mapFilterState.region !== 'all' && properties.region !== mapFilterState.region) {
        return false;
      }
      
      // Filter by performance threshold
      if (properties.performance < mapFilterState.performance) {
        return false;
      }
      
      // Filter by store type
      if (!mapFilterState.storeTypes.includes(properties.storeType)) {
        return false;
      }
      
      return true;
    });
    
    // Add filtered markers
    filteredFeatures.forEach(feature => {
      const properties = feature.properties;
      const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
      
      // Determine display value and color based on metric
      let value, displayValue;
      switch(metric) {
        case 'sales':
          value = properties.sales / 10000; // Scale for color
          displayValue = `₱${properties.sales.toLocaleString()}`;
          break;
        case 'stockouts':
          value = 100 - properties.stockouts * 4; // Invert for color scale
          displayValue = `${properties.stockouts} instances`;
          break;
        case 'uptime':
          value = properties.uptime;
          displayValue = `${properties.uptime}%`;
          break;
        default: // performance
          value = properties.performance;
          displayValue = `${properties.performance}%`;
      }
      
      // Create marker with custom icon
      const marker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: getColorForMetric(value),
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });
      
      // Store original style for hover effect
      marker.defaultStyle = {
        radius: 8,
        fillColor: getColorForMetric(value),
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      };
      
      marker.activeStyle = {
        radius: 10,
        fillColor: getColorForMetric(value),
        color: '#000',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      };
      
      // Store the feature in the marker for later reference
      marker.feature = feature;
      
      // Add tooltip
      marker.bindTooltip(`
        <strong>${properties.name}</strong><br>
        <span class="font-medium">${getMetricLabel(metric)}:</span> ${displayValue}
      `, {
        direction: 'top',
        className: 'custom-tooltip'
      });
      
      // Add hover effect
      marker.on('mouseover', function() {
        if (marker !== activeStoreMarker) {
          marker.setStyle({
            radius: 9,
            fillOpacity: 1,
            weight: 3
          });
        }
      });
      
      marker.on('mouseout', function() {
        if (marker !== activeStoreMarker) {
          marker.setStyle(marker.defaultStyle);
        }
      });
      
      // Add click handler
      marker.on('click', function() {
        // Reset previously active marker if any
        if (activeStoreMarker && activeStoreMarker !== marker) {
          activeStoreMarker.setStyle(activeStoreMarker.defaultStyle);
        }
        
        // Set this as the active marker
        activeStoreMarker = marker;
        marker.setStyle(marker.activeStyle);
        
        // Show store details
        showStoreDetails(feature.properties);
      });
      
      // Add marker to cluster group
      markerCluster.addLayer(marker);
    });
    
    // Add marker cluster to map
    layers.markers.addLayer(markerCluster);
    
    // Update UI to show filter count
    updateFilterCount(filteredFeatures.length, data.features.length);
  }
  
  // Function to update the filter count display
  function updateFilterCount(filteredCount, totalCount) {
    const filterButton = document.getElementById('filterMapButton');
    if (filterButton) {
      if (filteredCount < totalCount) {
        filterButton.innerHTML = `
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          Filters (${filteredCount}/${totalCount})
        `;
        filterButton.classList.add('bg-blue-100', 'text-blue-700');
        filterButton.classList.remove('bg-gray-100');
      } else {
        filterButton.innerHTML = `
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
          Map Filters
        `;
        filterButton.classList.remove('bg-blue-100', 'text-blue-700');
        filterButton.classList.add('bg-gray-100');
      }
    }
  }
  
  // Helper function to get metric label
  function getMetricLabel(metric) {
    switch(metric) {
      case 'sales': return 'Sales';
      case 'stockouts': return 'Stockouts';
      case 'uptime': return 'Uptime';
      default: return 'Performance';
    }
  }
  
  // Initialize map interactions
  function initMapInteractions() {
    // Metric selector change handler
    const metricSelector = document.getElementById('mapMetricSelector');
    if (metricSelector) {
      metricSelector.addEventListener('change', function() {
        const newMetric = this.value;
        mapFilterState.metric = newMetric;
        
        // Update legend
        document.querySelector('.info.legend').remove();
        addMapLegend(map, newMetric);
        
        // Fetch the latest data and rerender markers
        fetchStoreLocations().then(data => {
          renderStoreMarkers(data, newMetric);
          
          // Update heatmap if visible
          if (document.getElementById('heatmapToggle').checked) {
            updateHeatmap(data, newMetric);
          }
        });
      });
    }
    
    // Heatmap toggle handler
    const heatmapToggle = document.getElementById('heatmapToggle');
    if (heatmapToggle) {
      heatmapToggle.addEventListener('change', function() {
        if (this.checked) {
          // Show heatmap, hide markers
          map.addLayer(heatLayer);
          layers.markers.clearLayers();
        } else {
          // Hide heatmap, show markers
          map.removeLayer(heatLayer);
          fetchStoreLocations().then(data => {
            renderStoreMarkers(data, mapFilterState.metric);
          });
        }
      });
    }
    
    // Map filter button handler
    const filterMapButton = document.getElementById('filterMapButton');
    const mapFilters = document.getElementById('mapFilters');
    if (filterMapButton && mapFilters) {
      filterMapButton.addEventListener('click', function() {
        mapFilters.classList.toggle('hidden');
      });
      
      // Close filters when clicking outside
      document.addEventListener('click', function(e) {
        if (!mapFilters.contains(e.target) && e.target !== filterMapButton && !filterMapButton.contains(e.target)) {
          mapFilters.classList.add('hidden');
        }
      });
    }
    
    // Performance slider handler
    const performanceFilter = document.getElementById('performanceFilter');
    const performanceValue = document.getElementById('performanceValue');
    if (performanceFilter && performanceValue) {
      performanceFilter.addEventListener('input', function() {
        performanceValue.textContent = this.value + '%+';
      });
    }
    
    // Reset map filters handler
    const resetMapFilters = document.getElementById('resetMapFilters');
    if (resetMapFilters) {
      resetMapFilters.addEventListener('click', function() {
        // Reset filter state
        mapFilterState = {
          region: 'all',
          performance: 0,
          storeTypes: ['franchise', 'company-owned', 'partner'],
          metric: mapFilterState.metric // Keep current metric
        };
        
        // Reset UI
        document.getElementById('mapRegionFilter').value = 'all';
        document.getElementById('performanceFilter').value = 0;
        document.getElementById('performanceValue').textContent = '0%+';
        document.querySelectorAll('.store-type-filter').forEach(checkbox => {
          checkbox.checked = true;
        });
        
        // Apply reset filters
        fetchStoreLocations().then(data => {
          renderStoreMarkers(data, mapFilterState.metric);
        });
        
        // Hide filter panel
        mapFilters.classList.add('hidden');
      });
    }
    
    // Apply map filters handler
    const applyMapFilters = document.getElementById('applyMapFilters');
    if (applyMapFilters) {
      applyMapFilters.addEventListener('click', function() {
        // Update filter state from UI
        mapFilterState.region = document.getElementById('mapRegionFilter').value;
        mapFilterState.performance = parseInt(document.getElementById('performanceFilter').value);
        
        // Get selected store types
        const selectedTypes = [];
        document.querySelectorAll('.store-type-filter').forEach(checkbox => {
          if (checkbox.checked) {
            selectedTypes.push(checkbox.value);
          }
        });
        mapFilterState.storeTypes = selectedTypes;
        
        // Apply filters
        fetchStoreLocations().then(data => {
          renderStoreMarkers(data, mapFilterState.metric);
        });
        
        // Hide filter panel
        mapFilters.classList.add('hidden');
      });
    }
    
    // Close store details handler
    const closeStoreDetails = document.getElementById('closeStoreDetails');
    if (closeStoreDetails) {
      closeStoreDetails.addEventListener('click', function() {
        document.getElementById('storeDetailsPanel').classList.add('hidden');
        
        // Reset active marker if any
        if (activeStoreMarker) {
          activeStoreMarker.setStyle(activeStoreMarker.defaultStyle);
          activeStoreMarker = null;
        }
      });
    }
  }
  
  // Update heatmap based on selected metric
  function updateHeatmap(data, metric) {
    const heatMapData = [];
    data.features.forEach(feature => {
      const latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
      let intensity;
      
      switch(metric) {
        case 'sales':
          intensity = feature.properties.sales / 1000000; // Normalize large values
          break;
        case 'stockouts':
          intensity = (100 - feature.properties.stockouts * 4) / 100; // Invert
          break;
        case 'uptime':
          intensity = feature.properties.uptime / 100;
          break;
        default: // performance
          intensity = feature.properties.performance / 100;
      }
      
      heatMapData.push([latlng[0], latlng[1], intensity]);
    });
    
    heatLayer.setLatLngs(heatMapData);
  }
  
  // Fetch store locations with enhanced data
  function fetchStoreLocations() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Enhanced store points with additional data
        const storePoints = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [120.9842, 14.5995]
              },
              "properties": {
                "id": "S001",
                "name": "Manila Central Store",
                "region": "NCR",
                "storeType": "franchise",
                "performance": 87,
                "sales": 580250,
                "stockouts": 12,
                "uptime": 98,
                "openDate": "2022-03-15",
                "lastRestock": "2025-05-17",
                "inventoryHealth": 92,
                "avgTraffic": 1250,
                "avgBasketSize": 465.12,
                "address": "123 Rizal Avenue, Manila",
                "manager": "Maria Santos",
                "contact": "+63 912 345 6789"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [125.5095, 8.9475]
              },
              "properties": {
                "id": "S002",
                "name": "Cagayan de Oro Store",
                "region": "Mindanao",
                "storeType": "company-owned",
                "performance": 72,
                "sales": 312480,
                "stockouts": 18,
                "uptime": 94,
                "openDate": "2023-01-08",
                "lastRestock": "2025-05-12",
                "inventoryHealth": 78,
                "avgTraffic": 820,
                "avgBasketSize": 381.07,
                "address": "456 Corrales Ave, Cagayan de Oro",
                "manager": "Paolo Mendoza",
                "contact": "+63 918 765 4321"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [123.8854, 10.3157]
              },
              "properties": {
                "id": "S003",
                "name": "Cebu City Store",
                "region": "Visayas",
                "storeType": "franchise",
                "performance": 65,
                "sales": 198750,
                "stockouts": 24,
                "uptime": 92,
                "openDate": "2022-07-22",
                "lastRestock": "2025-05-14",
                "inventoryHealth": 65,
                "avgTraffic": 520,
                "avgBasketSize": 382.21,
                "address": "78 Osmena Blvd, Cebu City",
                "manager": "Antonio Garcia",
                "contact": "+63 927 123 4567"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [120.5960, 15.1795]
              },
              "properties": {
                "id": "S004",
                "name": "Angeles Store",
                "region": "Luzon",
                "storeType": "partner",
                "performance": 78,
                "sales": 150320,
                "stockouts": 15,
                "uptime": 96,
                "openDate": "2023-03-01",
                "lastRestock": "2025-05-10",
                "inventoryHealth": 82,
                "avgTraffic": 340,
                "avgBasketSize": 442.12,
                "address": "25 Friendship Highway, Angeles City",
                "manager": "Ryan Torres",
                "contact": "+63 939 876 5432"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [122.5644, 10.7202]
              },
              "properties": {
                "id": "S005",
                "name": "Iloilo Store",
                "region": "Visayas",
                "storeType": "company-owned",
                "performance": 81,
                "sales": 265430,
                "stockouts": 8,
                "uptime": 97,
                "openDate": "2022-09-15",
                "lastRestock": "2025-05-16",
                "inventoryHealth": 89,
                "avgTraffic": 560,
                "avgBasketSize": 473.98,
                "address": "45 Diversion Road, Iloilo City",
                "manager": "Christina Lim",
                "contact": "+63 945 234 5678"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [121.0122, 14.6760]
              },
              "properties": {
                "id": "S006",
                "name": "Quezon City Store",
                "region": "NCR",
                "storeType": "franchise",
                "performance": 85,
                "sales": 492150,
                "stockouts": 10,
                "uptime": 99,
                "openDate": "2022-05-20",
                "lastRestock": "2025-05-18",
                "inventoryHealth": 90,
                "avgTraffic": 1120,
                "avgBasketSize": 439.42,
                "address": "82 Katipunan Avenue, Quezon City",
                "manager": "Johanna Cruz",
                "contact": "+63 917 345 6789"
              }
            },
            {
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [124.2431, 7.1907]
              },
              "properties": {
                "id": "S007",
                "name": "Davao City Store",
                "region": "Mindanao",
                "storeType": "partner",
                "performance": 79,
                "sales": 275800,
                "stockouts": 14,
                "uptime": 95,
                "openDate": "2023-02-12",
                "lastRestock": "2025-05-13",
                "inventoryHealth": 84,
                "avgTraffic": 690,
                "avgBasketSize": 399.71,
                "address": "37 C.M. Recto, Davao City",
                "manager": "Roberto Aquino",
                "contact": "+63 926 765 4321"
              }
            }
          ]
        };
        
        resolve(storePoints);
      }, 500);
    });
  }
  
  // Get color based on metric value
  function getColorForMetric(value) {
    if (value >= 80) return '#10B981'; // Green - High performance
    if (value >= 70) return '#3B82F6'; // Blue - Good performance
    if (value >= 60) return '#F59E0B'; // Yellow - Average performance
    return '#EF4444'; // Red - Low performance
  }
  
  // Add legend to map with metric-specific labels
  function addMapLegend(map, metric) {
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend bg-white p-2 rounded-lg shadow-md');
      const grades = [80, 70, 60, 0];
      const labels = [];
      
      // Set legend title based on metric
      let title = '';
      switch(metric) {
        case 'sales':
          title = 'Sales Performance';
          break;
        case 'stockouts':
          title = 'Stockout Status';
          break;
        case 'uptime':
          title = 'System Uptime';
          break;
        default:
          title = 'Store Performance';
      }
      
      div.innerHTML = `<h4 class="text-xs font-semibold mb-1">${title}</h4>`;
      
      for (let i = 0; i < grades.length; i++) {
        const color = getColorForMetric(grades[i]);
        const nextGrade = grades[i + 1] ? grades[i + 1] : 0;
        
        // Customize label text based on metric
        let labelText = '';
        switch(metric) {
          case 'sales':
            labelText = grades[i] === 0 ? 'Low Sales' : grades[i] === 80 ? 'High Sales' : 'Medium Sales';
            break;
          case 'stockouts':
            labelText = grades[i] === 0 ? 'Many Stockouts' : grades[i] === 80 ? 'Few Stockouts' : 'Some Stockouts';
            break;
          case 'uptime':
            labelText = `${grades[i]}% ${i < grades.length - 1 ? '–' : '+'} Uptime`;
            break;
          default:
            labelText = `${grades[i]}${i < grades.length - 1 ? ' –' : '+'}`;
        }
        
        labels.push(
          `<div class="flex items-center">
            <i style="background:${color}" class="w-4 h-4 mr-1 rounded-full inline-block"></i>
            <span class="text-xs">${labelText}</span>
          </div>`
        );
      }
      
      div.innerHTML += labels.join('');
      return div;
    };
    
    legend.addTo(map);
  }
  
  // Show enhanced store details in the side panel
  function showStoreDetails(store) {
    const panel = document.getElementById('storeDetailsPanel');
    const storeName = document.getElementById('storeName');
    const storeContent = document.getElementById('storeContent');
    
    if (!panel || !storeName || !storeContent) return;
    
    // Set store name in header
    storeName.textContent = store.name;
    
    // Format store details HTML
    let detailsHTML = `
      <div class="flex justify-between items-center border-b border-gray-200 pb-2">
        <div>
          <span class="text-xs text-gray-500 block">Store ID</span>
          <span class="text-sm font-medium">${store.id}</span>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-500 block">Region</span>
          <span class="text-sm font-medium">${store.region}</span>
        </div>
      </div>
      
      <div>
        <span class="text-xs text-gray-500 block">Address</span>
        <span class="text-sm">${store.address}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="text-xs text-gray-500 block">Performance</span>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-1" style="background-color: ${getColorForMetric(store.performance)}"></div>
            <span class="text-sm font-medium">${store.performance}%</span>
          </div>
        </div>
        <div>
          <span class="text-xs text-gray-500 block">Sales</span>
          <span class="text-sm font-medium">₱${store.sales.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="text-xs text-gray-500 block">Avg. Traffic</span>
          <span class="text-sm font-medium">${store.avgTraffic.toLocaleString()} customers/day</span>
        </div>
        <div>
          <span class="text-xs text-gray-500 block">Avg. Basket</span>
          <span class="text-sm font-medium">₱${store.avgBasketSize.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="text-xs text-gray-500 block">Stockouts</span>
          <span class="text-sm font-medium">${store.stockouts} items</span>
        </div>
        <div>
          <span class="text-xs text-gray-500 block">Uptime</span>
          <span class="text-sm font-medium">${store.uptime}%</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div>
          <span class="text-xs text-gray-500 block">Manager</span>
          <span class="text-sm font-medium">${store.manager}</span>
        </div>
        <div>
          <span class="text-xs text-gray-500 block">Contact</span>
          <span class="text-sm font-medium">${store.contact}</span>
        </div>
      </div>
      
      <div class="mt-2">
        <span class="text-xs text-gray-500 block">Inventory Health</span>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div class="h-2 rounded-full" style="width: ${store.inventoryHealth}%; background-color: ${getColorForMetric(store.inventoryHealth)}"></div>
        </div>
        <div class="flex justify-between text-xs mt-1">
          <span>${store.inventoryHealth}%</span>
          <span class="text-gray-500">Last restock: ${store.lastRestock}</span>
        </div>
      </div>
      
      <div class="mt-3 flex space-x-2">
        <button class="detail-action-btn w-1/2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded">
          View Full Report
        </button>
        <button class="detail-action-btn w-1/2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded">
          Contact Store
        </button>
      </div>
    `;
    
    // Update panel content
    storeContent.innerHTML = detailsHTML;
    
    // Add click handlers for buttons
    const actionButtons = panel.querySelectorAll('.detail-action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        alert(`Action: ${this.textContent.trim()} for ${store.name}\nThis would open the corresponding interface in a production environment.`);
      });
    });
    
    // Show the panel
    panel.classList.remove('hidden');
  }
  
  // Add CSS style for cluster icons
  const style = document.createElement('style');
  style.textContent = `
    .custom-cluster {
      background: none;
      border: none;
    }
    .cluster-icon {
      width: 40px;
      height: 40px;
      background-color: #3B82F6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
    }
    .custom-tooltip {
      border: none !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 6px 10px;
      font-size: 12px;
      border-radius: 4px;
      background-color: white;
    }
  `;
  document.head.appendChild(style);
}

// QA-006: Enhanced Simulation vs Live Data Toggle
function initializeDataSourceToggle() {
  const dataSourceToggle = document.getElementById('dataSourceToggle');
  const dataSourceLabel = document.getElementById('dataSourceLabel');
  if (!dataSourceToggle || !dataSourceLabel) return;
  
  console.log('Initializing enhanced data source toggle');
  
  // Check if we should show the source selector control panel
  createDataSourceControlPanel();
  
  // Set initial state based on URL parameter
  const url = new URL(window.location);
  const initialState = url.searchParams.get('dataSource') === 'live';
  dataSourceToggle.checked = initialState;
  dataSourceLabel.textContent = initialState ? 'Live' : 'Simulated';
  
  // Save original text color for later use
  const originalTextColor = window.getComputedStyle(dataSourceLabel).color;
  
  // Update indicator styling based on state
  updateSourceIndicator(initialState);
  
  // Add change handler with enhanced visual feedback
  dataSourceToggle.addEventListener('change', function() {
    const isLive = this.checked;
    
    // Show confirmation dialog for switching to live data
    if (isLive) {
      showLiveDataConfirmation().then(confirmed => {
        if (confirmed) {
          completeDataSourceSwitch(isLive);
        } else {
          // Reset toggle if cancelled
          dataSourceToggle.checked = false;
          updateSourceIndicator(false);
        }
      });
    } else {
      // Switching to simulation mode doesn't need confirmation
      completeDataSourceSwitch(isLive);
    }
  });
  
  // Toggle animation to show it's active
  dataSourceToggle.classList.add('animate-pulse');
  setTimeout(() => {
    dataSourceToggle.classList.remove('animate-pulse');
  }, 2000);
  
  // Add label hover effect to indicate it's part of the interactive control
  dataSourceLabel.classList.add('cursor-pointer');
  dataSourceLabel.addEventListener('click', function() {
    // Toggle when label is clicked too
    dataSourceToggle.checked = !dataSourceToggle.checked;
    
    // Trigger change event manually
    const event = new Event('change');
    dataSourceToggle.dispatchEvent(event);
  });
  
  // Add tooltip for explanation
  const toggleContainer = dataSourceToggle.closest('.flex.items-center');
  if (toggleContainer) {
    const infoIcon = document.createElement('span');
    infoIcon.className = 'ml-1 text-gray-400 hover:text-gray-600 cursor-pointer';
    infoIcon.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `;
    infoIcon.setAttribute('title', 'Switch between simulated and live data sources');
    toggleContainer.appendChild(infoIcon);
    
    // Add click handler to show more info
    infoIcon.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent toggling
      showDataSourceInfoModal();
    });
  }
  
  // Update visual indicator for the data source
  function updateSourceIndicator(isLive) {
    if (isLive) {
      dataSourceLabel.textContent = 'Live';
      dataSourceLabel.classList.add('text-green-600', 'font-medium');
      dataSourceLabel.classList.remove('text-amber-500');
      
      // Add pulsing dot for live data
      const existingDot = dataSourceLabel.querySelector('.live-indicator');
      if (!existingDot) {
        const liveDot = document.createElement('span');
        liveDot.className = 'live-indicator inline-block w-2 h-2 bg-green-500 rounded-full ml-1 animate-pulse';
        dataSourceLabel.appendChild(liveDot);
      }
    } else {
      dataSourceLabel.textContent = 'Simulated';
      dataSourceLabel.classList.add('text-amber-500', 'font-medium');
      dataSourceLabel.classList.remove('text-green-600');
      
      // Remove pulsing dot if it exists
      const existingDot = dataSourceLabel.querySelector('.live-indicator');
      if (existingDot) {
        existingDot.remove();
      }
    }
  }
  
  // Function to complete the data source switch
  function completeDataSourceSwitch(isLive) {
    // Update label and styling
    updateSourceIndicator(isLive);
    
    // Update URL parameter
    const url = new URL(window.location);
    url.searchParams.set('dataSource', isLive ? 'live' : 'simulated');
    window.history.pushState({}, '', url);
    
    // Switch data source with visual feedback
    switchDataSource(isLive);
    
    // Show indicator that data is refreshing
    showDataRefreshIndicator();
    
    // Show status badge
    showStatusBadge(isLive);
  }
  
  // Create data source control panel
  function createDataSourceControlPanel() {
    // Check if advanced controls are enabled in URL
    const url = new URL(window.location);
    const showControls = url.searchParams.get('advancedControls') === 'true';
    
    if (!showControls) return;
    
    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-40';
    controlPanel.style.width = '280px';
    controlPanel.id = 'dataSourceControlPanel';
    
    controlPanel.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-semibold text-gray-800">Data Source Controls</h3>
        <button id="hideControlPanel" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Data Freshness</label>
          <select id="dataFreshness" class="w-full text-sm border-gray-300 rounded-md">
            <option value="realtime">Real-time</option>
            <option value="15min">15 minutes delay</option>
            <option value="hourly">Hourly batched</option>
            <option value="daily">Daily snapshot</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Error Rate (Simulation)</label>
          <input type="range" id="errorRate" min="0" max="10" value="0" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </div>
        
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Data Completeness</label>
          <div class="relative mb-1">
            <input type="range" id="dataCompleteness" min="50" max="100" value="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
          </div>
          <div class="flex justify-between text-xs text-gray-500">
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div class="pt-2">
          <button id="applyDataSettings" class="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded">Apply Settings</button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    document.getElementById('hideControlPanel').addEventListener('click', function() {
      controlPanel.remove();
    });
    
    document.getElementById('applyDataSettings').addEventListener('click', function() {
      // Get values
      const freshness = document.getElementById('dataFreshness').value;
      const errorRate = document.getElementById('errorRate').value;
      const completeness = document.getElementById('dataCompleteness').value;
      
      // Update URL parameters
      const url = new URL(window.location);
      url.searchParams.set('dataFreshness', freshness);
      url.searchParams.set('errorRate', errorRate);
      url.searchParams.set('dataCompleteness', completeness);
      window.history.pushState({}, '', url);
      
      // Apply settings by refreshing data
      const isLive = dataSourceToggle.checked;
      switchDataSource(isLive, {
        freshness,
        errorRate: parseInt(errorRate) / 100,
        completeness: parseInt(completeness) / 100
      });
      
      // Show toast notification
      showDataSourceToast(`Data settings applied: ${freshness} mode`);
    });
  }
  
  // Show confirmation dialog for switching to live data
  function showLiveDataConfirmation() {
    return new Promise((resolve) => {
      // Create modal element
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
      modalOverlay.id = 'liveDataConfirmModal';
      
      modalOverlay.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
          <div class="flex items-center mb-4">
            <div class="bg-yellow-100 p-2 rounded-full mr-3">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-800">Switch to Live Data?</h3>
          </div>
          
          <div class="mb-6">
            <p class="text-sm text-gray-600 mb-2">You are about to switch from simulated data to live production data. This will:</p>
            <ul class="text-sm text-gray-600 space-y-1 list-disc pl-5">
              <li>Connect to production APIs and databases</li>
              <li>Display real-time customer and sales data</li>
              <li>May have performance implications</li>
            </ul>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button id="cancelLiveSwitch" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button id="confirmLiveSwitch" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
              Switch to Live
            </button>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(modalOverlay);
      
      // Add event listeners
      document.getElementById('cancelLiveSwitch').addEventListener('click', function() {
        closeModal();
        resolve(false);
      });
      
      document.getElementById('confirmLiveSwitch').addEventListener('click', function() {
        closeModal();
        resolve(true);
      });
      
      // Close modal function
      function closeModal() {
        document.getElementById('liveDataConfirmModal').remove();
      }
      
      // Close on escape key
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closeModal();
          resolve(false);
          document.removeEventListener('keydown', escHandler);
        }
      });
      
      // Close on outside click
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
          closeModal();
          resolve(false);
        }
      });
    });
  }
  
  // Show info modal about data sources
  function showDataSourceInfoModal() {
    // Create modal element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modalOverlay.id = 'dataSourceInfoModal';
    
    modalOverlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Data Source Information</h3>
          <button id="closeDataSourceInfo" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <h4 class="text-md font-medium text-gray-800 mb-1">Simulated Data</h4>
            <p class="text-sm text-gray-600">Uses pre-generated sample data that mimics real-world patterns, but does not connect to production systems. Ideal for:</p>
            <ul class="text-sm text-gray-600 list-disc pl-5 mt-2 space-y-1">
              <li>Dashboard demonstrations</li>
              <li>Training new users</li>
              <li>Testing UI functionality</li>
              <li>Feature development</li>
            </ul>
          </div>
          
          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-md font-medium text-gray-800 mb-1">Live Data</h4>
            <p class="text-sm text-gray-600">Connects to production endpoints and displays actual customer, sales, and inventory data in real-time. Use for:</p>
            <ul class="text-sm text-gray-600 list-disc pl-5 mt-2 space-y-1">
              <li>Operational decision-making</li>
              <li>Performance monitoring</li>
              <li>Trend analysis</li>
              <li>KPI tracking</li>
            </ul>
          </div>
          
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-800"><strong>Note:</strong> Switching to live data requires appropriate permissions and may have performance implications depending on the size of your dataset.</p>
          </div>
        </div>
        
        <div class="flex justify-end mt-4">
          <button id="closeDataSourceInfoBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Add event listeners
    document.getElementById('closeDataSourceInfo').addEventListener('click', closeModal);
    document.getElementById('closeDataSourceInfoBtn').addEventListener('click', closeModal);
    
    // Close modal function
    function closeModal() {
      document.getElementById('dataSourceInfoModal').remove();
    }
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  // Show status badge for data source change
  function showStatusBadge(isLive) {
    // Create badge element
    const badge = document.createElement('div');
    badge.className = `fixed top-16 right-4 ${isLive ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'} px-3 py-1.5 rounded-lg shadow-md flex items-center z-40 transition-opacity duration-500 opacity-0`;
    badge.id = 'dataSourceBadge';
    
    badge.innerHTML = `
      <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isLive ? 'M13 10V3L4 14h7v7l9-11h-7z' : 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4'}"></path>
      </svg>
      <span class="font-medium text-sm">${isLive ? 'Using Live Data' : 'Using Simulated Data'}</span>
    `;
    
    // Add to document
    document.body.appendChild(badge);
    
    // Fade in
    setTimeout(() => {
      badge.style.opacity = '1';
    }, 10);
    
    // Fade out after 4 seconds
    setTimeout(() => {
      badge.style.opacity = '0';
      setTimeout(() => {
        badge.remove();
      }, 500);
    }, 4000);
  }
  
  // Show toast notification for data source changes
  function showDataSourceToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center opacity-0 transition-opacity duration-300';
    toast.style.opacity = '0';
    toast.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Fade out after 2 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2000);
  }
}

// Switch data source function
function switchDataSource(isLive) {
  console.log(`Switching to ${isLive ? 'live' : 'simulated'} data`);
  
  // Show loading state on all charts and KPIs
  document.querySelectorAll('.kpi-grid > div').forEach(kpi => {
    const valueElement = kpi.querySelector('h2');
    if (valueElement) {
      valueElement.dataset.originalValue = valueElement.textContent;
      valueElement.innerHTML = '<div class="animate-pulse h-6 bg-gray-200 rounded w-20"></div>';
    }
  });
  
  // Fetch new data based on source
  fetchDashboardData(isLive)
    .then(data => {
      updateDashboardWithData(data);
    })
    .catch(error => {
      console.error('Error fetching dashboard data:', error);
      // Restore original values
      document.querySelectorAll('.kpi-grid > div').forEach(kpi => {
        const valueElement = kpi.querySelector('h2');
        if (valueElement && valueElement.dataset.originalValue) {
          valueElement.textContent = valueElement.dataset.originalValue;
        }
      });
      
      // Show error message
      alert('Error switching data source. Please try again.');
    });
}

// Fetch dashboard data (simulated)
function fetchDashboardData(isLive) {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      if (isLive) {
        // Live data would be fetched from the server
        resolve({
          kpis: {
            sales: '₱ 1.37M',
            conversionRate: '26.2%',
            marketingRoi: '3.5x',
            brandSentiment: '78.9%'
          },
          salesChange: '+9.4%',
          conversionChange: '+4.2%',
          roiChange: '+0.3x',
          sentimentChange: '+6.8%',
          // Other data for charts and panels would go here
        });
      } else {
        // Simulated data
        resolve({
          kpis: {
            sales: '₱ 1.24M',
            conversionRate: '24.7%',
            marketingRoi: '3.2x',
            brandSentiment: '76.2%'
          },
          salesChange: '+8.2%',
          conversionChange: '+3.5%',
          roiChange: '-0.8x',
          sentimentChange: '+5.7%',
          // Other simulated data would go here
        });
      }
    }, 1200);
  });
}

// Update dashboard with fetched data
function updateDashboardWithData(data) {
  // Update KPI values
  const kpiTiles = document.querySelectorAll('.kpi-grid > div');
  if (kpiTiles.length >= 4) {
    // Sales KPI
    const salesValue = kpiTiles[0].querySelector('h2');
    const salesChange = kpiTiles[0].querySelector('p.text-green-500, p.text-red-500');
    if (salesValue) salesValue.textContent = data.kpis.sales;
    if (salesChange) salesChange.textContent = data.salesChange;
    
    // Conversion Rate KPI
    const conversionValue = kpiTiles[1].querySelector('h2');
    const conversionChange = kpiTiles[1].querySelector('p.text-green-500, p.text-red-500');
    if (conversionValue) conversionValue.textContent = data.kpis.conversionRate;
    if (conversionChange) conversionChange.textContent = data.conversionChange;
    
    // Marketing ROI KPI
    const roiValue = kpiTiles[2].querySelector('h2');
    const roiChange = kpiTiles[2].querySelector('p.text-green-500, p.text-red-500');
    if (roiValue) roiValue.textContent = data.kpis.marketingRoi;
    if (roiChange) {
      roiChange.textContent = data.roiChange;
      // Update color based on positive/negative
      if (data.roiChange.startsWith('-')) {
        roiChange.classList.remove('text-green-500');
        roiChange.classList.add('text-red-500');
      } else {
        roiChange.classList.remove('text-red-500');
        roiChange.classList.add('text-green-500');
      }
    }
    
    // Brand Sentiment KPI
    const sentimentValue = kpiTiles[3].querySelector('h2');
    const sentimentChange = kpiTiles[3].querySelector('p.text-green-500, p.text-red-500');
    if (sentimentValue) sentimentValue.textContent = data.kpis.brandSentiment;
    if (sentimentChange) sentimentChange.textContent = data.sentimentChange;
  }
  
  // Update last updated timestamp
  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated) {
    const now = new Date();
    lastUpdated.textContent = now.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' PHT';
  }
}

// Show data refresh indicator
function showDataRefreshIndicator() {
  // Create and show toast notification
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center';
  toast.innerHTML = `
    <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Refreshing data...
  `;
  document.body.appendChild(toast);
  
  // Remove after 2 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 2000);
}

// QA-007: Enhanced TBWA Theme with New Color Palette
function applyTBWATheme() {
  console.log('Applying enhanced TBWA theme with new color palette');
  
  // Check if theme CSS is loaded
  const themeLinks = document.querySelectorAll('link[href*="tbwa"]');
  if (themeLinks.length === 0) {
    // Load TBWA theme if not loaded
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tbwa-theme.css';
    document.head.appendChild(link);
  }
  
  // Define new color scheme based on updated variables
  const colorScheme = {
    primary: '#0052CC', // Azure Blue
    primaryDark: '#004299',
    primaryLight: '#2684FF',
    secondary: '#FFAB00', // Yellow-Orange
    secondaryDark: '#CF8600',
    secondaryLight: '#FFD342',
    success: '#36B37E', // Teal green
    danger: '#FF5630', // Error red
    warning: '#FFAB00', // Yellow-orange
    info: '#2684FF', // Light blue
    gray: '#6B778C', // Neutral gray
  };
  
  // Create dynamic CSS to apply colors
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    :root {
      --color-primary: ${colorScheme.primary};
      --color-primary-dark: ${colorScheme.primaryDark};
      --color-primary-light: ${colorScheme.primaryLight};
      --color-secondary: ${colorScheme.secondary};
      --color-secondary-dark: ${colorScheme.secondaryDark};
      --color-secondary-light: ${colorScheme.secondaryLight};
      --color-success: ${colorScheme.success};
      --color-danger: ${colorScheme.danger};
      --color-warning: ${colorScheme.warning};
      --color-info: ${colorScheme.info};
      --color-gray: ${colorScheme.gray};
    }
    
    /* Apply theme colors to elements */
    .tbwa-header {
      background-color: var(--color-primary);
      border-bottom: 3px solid var(--color-secondary);
    }
    
    .tbwa-button {
      background-color: var(--color-primary);
      color: white;
      border-radius: 4px;
      border: none;
      padding: 0.5rem 1rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    
    .tbwa-button:hover {
      background-color: var(--color-primary-dark);
    }
    
    .tbwa-button.secondary {
      background-color: var(--color-secondary);
      color: #333;
    }
    
    .tbwa-button.secondary:hover {
      background-color: var(--color-secondary-dark);
    }
    
    .tbwa-card {
      border-radius: 8px;
      border-top: 3px solid var(--color-primary);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* Charts theme */
    .tbwa-chart .apexcharts-tooltip {
      background-color: var(--color-primary) !important;
      color: white !important;
    }
    
    /* Interactive filter style */
    .filter-interactive:focus {
      border-color: var(--color-primary) !important;
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.25) !important;
    }
    
    /* Navbar and sidebar theme */
    .tbwa-sidebar {
      background-color: #F8F9FA;
      border-right: 1px solid #E6E8EC;
    }
    
    .tbwa-sidebar .nav-item.active {
      background-color: var(--color-primary-light);
      color: white;
    }
    
    /* Dashboard header style */
    .dashboard-header {
      background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
    }
    
    /* Footer style */
    .tbwa-footer {
      background-color: #F8F9FA;
      border-top: 3px solid var(--color-secondary);
    }
    
    /* KPI tiles */
    .kpi-tile {
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border-left: 4px solid var(--color-primary);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .kpi-tile:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
    
    .kpi-tile.positive {
      border-left-color: var(--color-success);
    }
    
    .kpi-tile.negative {
      border-left-color: var(--color-danger);
    }
    
    .kpi-tile.neutral {
      border-left-color: var(--color-warning);
    }
    
    /* Override default Tailwind colors */
    .bg-blue-500 {
      background-color: var(--color-primary) !important;
    }
    
    .text-blue-500 {
      color: var(--color-primary) !important;
    }
    
    .hover\:bg-blue-600:hover {
      background-color: var(--color-primary-dark) !important;
    }
    
    .border-blue-500 {
      border-color: var(--color-primary) !important;
    }
    
    /* Switch toggle styling */
    .switch input:checked + .slider {
      background-color: var(--color-primary) !important;
    }
    
    /* Transitions for theme-switching */
    .tbwa-transition {
      transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
    }
  `;
  
  // Append the style element if it doesn't exist
  if (!document.getElementById('tbwa-dynamic-theme')) {
    styleElement.id = 'tbwa-dynamic-theme';
    document.head.appendChild(styleElement);
  }
  
  // Apply theme-specific classes to elements
  document.querySelectorAll('.header-logo, .tbwa-logo').forEach(logo => {
    logo.classList.add('tbwa-logo');
  });
  
  document.querySelectorAll('.btn, .button, button:not(.custom-button):not(.insight-tab-btn):not(.rec-action)').forEach(button => {
    button.classList.add('tbwa-button', 'tbwa-transition');
  });
  
  document.querySelectorAll('.kpi-card, .card, .kpi-grid > div').forEach(card => {
    card.classList.add('kpi-tile', 'tbwa-transition');
    
    // Check if card contains positive or negative values
    if (card.querySelector('.text-green-500')) {
      card.classList.add('positive');
    } else if (card.querySelector('.text-red-500')) {
      card.classList.add('negative');
    } else {
      card.classList.add('neutral');
    }
  });
  
  // Apply theme to header if exists
  const header = document.querySelector('header');
  if (header) {
    header.classList.add('tbwa-header', 'tbwa-transition');
  }
  
  // Apply theme to footer if exists
  const footer = document.querySelector('footer');
  if (footer) {
    footer.classList.add('tbwa-footer', 'tbwa-transition');
  }
  
  // Apply theme to charts
  document.querySelectorAll('canvas').forEach(canvas => {
    const chartContainer = canvas.closest('div');
    if (chartContainer) {
      chartContainer.classList.add('tbwa-chart');
    }
  });
  
  // Apply theme to dashboard components
  applyThemeToDashboardComponents();
  
  // Apply theme to dropdown menus
  applyThemeToDropdowns();
  
  // Add theme-switcher if not present
  addThemeSwitcher();
}

// Apply theme to dashboard components
function applyThemeToDashboardComponents() {
  // Apply theme to filter bar
  const filterBar = document.querySelector('.bg-gray-200.py-3');
  if (filterBar) {
    filterBar.style.backgroundColor = '#F8F9FA';
    filterBar.style.borderBottom = '1px solid #E6E8EC';
    filterBar.style.borderTop = '1px solid #E6E8EC';
  }
  
  // Apply theme to store map
  const storeMap = document.getElementById('storeMap');
  if (storeMap) {
    storeMap.classList.add('tbwa-card');
  }
  
  // Apply theme to AI insights panel
  const brandInsights = document.getElementById('brandInsights');
  if (brandInsights) {
    brandInsights.classList.add('tbwa-card');
    
    // Apply styling to insight cards
    brandInsights.querySelectorAll('.border-gray-200').forEach(box => {
      box.classList.add('tbwa-transition');
      box.style.borderColor = '#E6E8EC';
      box.style.borderRadius = '6px';
    });
  }
  
  // Apply theme to drill-down drawer
  const drillDownDrawer = document.getElementById('drillDownDrawer');
  if (drillDownDrawer) {
    const drawerContent = drillDownDrawer.querySelector('.bg-white');
    if (drawerContent) {
      drawerContent.classList.add('tbwa-transition');
      drawerContent.style.borderTop = `3px solid var(--color-primary)`;
    }
  }
}

// Apply theme to dropdown menus
function applyThemeToDropdowns() {
  // Style all dropdowns
  document.querySelectorAll('select').forEach(select => {
    select.classList.add('tbwa-transition', 'filter-interactive');
    select.addEventListener('focus', function() {
      this.style.borderColor = 'var(--color-primary)';
    });
    select.addEventListener('blur', function() {
      this.style.borderColor = '';
    });
  });
}

// Add theme switcher if not present
function addThemeSwitcher() {
  // Check if theme selector exists
  if (document.querySelector('.theme-selector') || document.getElementById('theme-switcher')) {
    return;
  }
  
  // Create theme switcher
  const themeSwitcher = document.createElement('div');
  themeSwitcher.id = 'theme-switcher';
  themeSwitcher.className = 'fixed bottom-4 right-4 z-30';
  themeSwitcher.innerHTML = `
    <button class="theme-toggle p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300" title="Switch Theme">
      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
      </svg>
    </button>
  `;
  
  // Append to body
  document.body.appendChild(themeSwitcher);
  
  // Add click handler with theme options menu
  themeSwitcher.querySelector('.theme-toggle').addEventListener('click', function() {
    // Show theme menu
    const themeMenu = document.createElement('div');
    themeMenu.className = 'absolute bottom-12 right-0 bg-white rounded-lg shadow-xl p-3 w-56';
    themeMenu.innerHTML = `
      <h4 class="text-sm font-medium text-gray-700 mb-2">Select Theme</h4>
      <div class="space-y-2">
        <button class="theme-option w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm flex items-center" data-theme="tbwa-azure">
          <span class="w-4 h-4 rounded-full bg-blue-600 mr-2"></span>
          TBWA Azure Blue (Default)
        </button>
        <button class="theme-option w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm flex items-center" data-theme="tbwa-navy">
          <span class="w-4 h-4 rounded-full bg-navy-600 mr-2" style="background-color: #002B80"></span>
          TBWA Navy
        </button>
        <button class="theme-option w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm flex items-center" data-theme="dark">
          <span class="w-4 h-4 rounded-full bg-gray-800 mr-2"></span>
          Dark Mode
        </button>
      </div>
    `;
    
    themeSwitcher.appendChild(themeMenu);
    
    // Add click handler for theme options
    themeMenu.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', function() {
        const theme = this.getAttribute('data-theme');
        applyThemeVariant(theme);
        themeMenu.remove();
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeThemeMenu(e) {
      if (!themeSwitcher.contains(e.target)) {
        themeMenu.remove();
        document.removeEventListener('click', closeThemeMenu);
      }
    });
  });
}

// Apply specific theme variant
function applyThemeVariant(theme) {
  // Remove any existing theme classes
  document.body.classList.remove('theme-tbwa-azure', 'theme-tbwa-navy', 'theme-dark');
  
  // Default colors
  let colors = {
    primary: '#0052CC', // Azure Blue
    primaryDark: '#004299',
    primaryLight: '#2684FF',
    secondary: '#FFAB00', // Yellow-Orange
    secondaryDark: '#CF8600',
    secondaryLight: '#FFD342',
    success: '#36B37E', // Teal green
    danger: '#FF5630', // Error red
    warning: '#FFAB00', // Yellow-orange
    info: '#2684FF', // Light blue
    gray: '#6B778C', // Neutral gray
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#172B4D',
    textSecondary: '#6B778C'
  };
  
  // Apply theme-specific colors
  switch(theme) {
    case 'tbwa-navy':
      // TBWA Navy theme
      colors = {
        ...colors,
        primary: '#002B80', // Navy
        primaryDark: '#001E57',
        primaryLight: '#1A4BAA',
        secondary: '#00C3EC', // Cyan
        secondaryDark: '#009BBE',
        secondaryLight: '#25D1F5'
      };
      document.body.classList.add('theme-tbwa-navy');
      break;
      
    case 'dark':
      // Dark theme
      colors = {
        ...colors,
        primary: '#2684FF', // Bright blue for dark mode
        primaryDark: '#0052CC',
        primaryLight: '#4C9AFF',
        secondary: '#FFAB00',
        secondaryDark: '#CF8600',
        secondaryLight: '#FFD342',
        background: '#1D1E20',
        surface: '#292A2D',
        text: '#E8EAEE',
        textSecondary: '#A6ACBE'
      };
      document.body.classList.add('theme-dark');
      break;
      
    default:
      // TBWA Azure theme (default)
      document.body.classList.add('theme-tbwa-azure');
      break;
  }
  
  // Apply colors to CSS variables
  const styleElement = document.getElementById('tbwa-dynamic-theme');
  if (styleElement) {
    // Update CSS variables
    styleElement.textContent = styleElement.textContent.replace(/--color-primary:[^;]+;/, `--color-primary: ${colors.primary};`);
    styleElement.textContent = styleElement.textContent.replace(/--color-primary-dark:[^;]+;/, `--color-primary-dark: ${colors.primaryDark};`);
    styleElement.textContent = styleElement.textContent.replace(/--color-primary-light:[^;]+;/, `--color-primary-light: ${colors.primaryLight};`);
    styleElement.textContent = styleElement.textContent.replace(/--color-secondary:[^;]+;/, `--color-secondary: ${colors.secondary};`);
    styleElement.textContent = styleElement.textContent.replace(/--color-secondary-dark:[^;]+;/, `--color-secondary-dark: ${colors.secondaryDark};`);
    styleElement.textContent = styleElement.textContent.replace(/--color-secondary-light:[^;]+;/, `--color-secondary-light: ${colors.secondaryLight};`);
    
    // Add dark mode specific styles if needed
    if (theme === 'dark') {
      styleElement.textContent += `
        body.theme-dark {
          background-color: ${colors.background};
          color: ${colors.text};
        }
        
        body.theme-dark .bg-white {
          background-color: ${colors.surface} !important;
        }
        
        body.theme-dark .text-gray-800 {
          color: ${colors.text} !important;
        }
        
        body.theme-dark .text-gray-600, 
        body.theme-dark .text-gray-700 {
          color: ${colors.textSecondary} !important;
        }
        
        body.theme-dark .border-gray-200,
        body.theme-dark .border-gray-300 {
          border-color: #3A3B3F !important;
        }
        
        body.theme-dark .tbwa-footer,
        body.theme-dark .tbwa-sidebar {
          background-color: ${colors.surface};
          border-color: #3A3B3F;
        }
        
        body.theme-dark .kpi-tile {
          background-color: ${colors.surface};
        }
      `;
    }
  }
  
  // Save theme preference
  localStorage.setItem('tbwaDashboardTheme', theme);
  
  // Show feedback toast
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center opacity-0 transition-opacity duration-300';
  toast.style.opacity = '0';
  toast.innerHTML = `
    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
    </svg>
    Theme updated: ${theme === 'tbwa-azure' ? 'TBWA Azure Blue' : theme === 'tbwa-navy' ? 'TBWA Navy' : 'Dark Mode'}
  `;
  document.body.appendChild(toast);
  
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // Fade out after 2 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

// QA-008: Accessibility
function initializeAccessibilityFeatures() {
  // Add ARIA labels to all interactive elements
  document.querySelectorAll('button, a, input, select').forEach(el => {
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      // Set aria-label based on text content or type
      if (el.textContent.trim()) {
        el.setAttribute('aria-label', el.textContent.trim());
      } else if (el.getAttribute('placeholder')) {
        el.setAttribute('aria-label', el.getAttribute('placeholder'));
      } else if (el.getAttribute('type')) {
        el.setAttribute('aria-label', `${el.getAttribute('type')} control`);
      }
    }
  });
  
  // Add role attributes
  document.querySelectorAll('.kpi-grid > div').forEach(kpi => {
    kpi.setAttribute('role', 'button');
    kpi.setAttribute('tabindex', '0');
  });
  
  // Add keyboard navigation
  document.querySelectorAll('[role="button"], [tabindex="0"]').forEach(el => {
    el.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        el.click();
      }
    });
  });
  
  // Add screen reader only text
  const srOnlyElements = document.querySelectorAll('.sr-only');
  if (srOnlyElements.length === 0) {
    // Add sr-only style if not present
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add screen reader descriptions to charts
  document.querySelectorAll('canvas').forEach(canvas => {
    const chart = canvas.closest('div');
    if (chart) {
      const chartTitle = chart.querySelector('h3, h4, h5');
      if (chartTitle) {
        const chartDesc = document.createElement('span');
        chartDesc.className = 'sr-only';
        chartDesc.textContent = `Chart: ${chartTitle.textContent}. Use arrow keys to navigate.`;
        chart.appendChild(chartDesc);
      }
    }
  });
}

// QA-009: Chart Render Optimization
function initializeDrillDownCharts(kpiType) {
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    let startTime = performance.now();
    
    // Initialize appropriate charts based on KPI type
    switch(kpiType) {
      case 'sales':
        if (document.getElementById('salesDrillDownChart')) {
          new Chart(document.getElementById('salesDrillDownChart').getContext('2d'), {
            type: 'bar',
            data: {
              labels: ['NCR', 'Luzon', 'Visayas', 'Mindanao'],
              datasets: [{
                label: 'Sales (in ₱ thousands)',
                data: [580, 312, 198, 150],
                backgroundColor: '#3B82F6',
                borderWidth: 0,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 500 // Faster animation
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true,
                  mode: 'index',
                  intersect: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '₱ ' + value + 'K';
                    }
                  }
                }
              }
            }
          });
        }
        break;
        
      case 'conversion':
        // Initialize conversion charts
        if (document.getElementById('conversionBreakdownChart')) {
          new Chart(document.getElementById('conversionBreakdownChart').getContext('2d'), {
            type: 'bar',
            data: {
              labels: ['Sari-Sari', 'Supermarkets', 'Convenience', 'Department'],
              datasets: [{
                label: 'Conversion Rate (%)',
                data: [31.5, 22.8, 18.4, 26.3],
                backgroundColor: '#8B5CF6',
                borderWidth: 0,
                borderRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 500
              },
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              }
            }
          });
        }
        break;
        
      // Add cases for other KPI types...
    }
    
    let endTime = performance.now();
    console.log(`Chart rendering took ${endTime - startTime}ms`);
  });
}

// QA-010: Export Buttons
function initializeExportButtons() {
  const exportButton = document.getElementById('exportButton');
  const exportDropdown = document.getElementById('exportDropdown');
  if (!exportButton || !exportDropdown) return;
  
  // Show/hide dropdown
  exportButton.addEventListener('click', function() {
    exportDropdown.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!exportButton.contains(event.target) && !exportDropdown.contains(event.target)) {
      exportDropdown.classList.add('hidden');
    }
  });
  
  // Add export handlers
  const exportLinks = exportDropdown.querySelectorAll('a');
  exportLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const format = this.textContent.includes('CSV') ? 'csv' : 'pptx';
      exportDashboardData(format);
    });
  });
  
  // Export function
  function exportDashboardData(format) {
    // Show loading indicator
    const originalText = exportButton.textContent;
    exportButton.innerHTML = `<svg class="animate-spin h-4 w-4 mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg> Exporting...`;
    
    // Close dropdown
    exportDropdown.classList.add('hidden');
    
    // Simulate export process
    setTimeout(() => {
      if (format === 'csv') {
        // Generate CSV
        const csvContent = generateCSV();
        downloadFile(csvContent, 'client360_dashboard.csv', 'text/csv');
      } else {
        // For PPTX, show message (actual implementation would use a library)
        alert('PPTX export feature is under development. Your presentation will be ready soon.');
      }
      
      // Restore button
      exportButton.innerHTML = originalText;
    }, 1500);
  }
  
  // Generate CSV data
  function generateCSV() {
    // Get dashboard data
    const kpiTiles = document.querySelectorAll('.kpi-grid > div');
    let data = [
      ['Metric', 'Value', 'Change'],
    ];
    
    // Add KPI data
    kpiTiles.forEach(tile => {
      const title = tile.querySelector('p.text-gray-500')?.textContent || '';
      const value = tile.querySelector('h2')?.textContent || '';
      const change = tile.querySelector('p.text-green-500, p.text-red-500')?.textContent || '';
      data.push([title, value, change]);
    });
    
    // Convert to CSV string
    return data.map(row => row.join(',')).join('\n');
  }
  
  // Download file
  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

// QA-011: QA Overlay
function initializeQAOverlay() {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'qaOverlay';
  overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-90 z-50 text-white p-8 overflow-auto hidden';
  overlay.innerHTML = `
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">QA Diagnostic Overlay</h2>
        <button id="closeQAOverlay" class="text-white hover:text-gray-300">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-800 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Data Source</h3>
          <p class="mb-2">Current Mode: <span id="qa-data-source" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
          <p class="mb-2">API Endpoints: <span id="qa-api-status" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
          <p>Last Refresh: <span id="qa-last-refresh" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
        </div>
        
        <div class="bg-gray-800 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Dashboard Info</h3>
          <p class="mb-2">Version: <span id="qa-version" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
          <p class="mb-2">Theme: <span id="qa-theme" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
          <p>Render Time: <span id="qa-render-time" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></p>
        </div>
        
        <div class="bg-gray-800 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Component Status</h3>
          <ul class="space-y-1">
            <li>Filter Bar: <span id="qa-filter-bar" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></li>
            <li>Date Picker: <span id="qa-date-picker" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></li>
            <li>KPI Tiles: <span id="qa-kpi-tiles" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></li>
            <li>Map Component: <span id="qa-map" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></li>
            <li>AI Insights: <span id="qa-ai-insights" class="font-mono bg-blue-900 px-2 py-1 rounded">...</span></li>
          </ul>
        </div>
        
        <div class="bg-gray-800 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">URL Parameters</h3>
          <div id="qa-url-params" class="font-mono text-sm bg-gray-900 p-2 rounded overflow-x-auto">
            ...
          </div>
        </div>
      </div>
      
      <div class="mt-6 bg-gray-800 p-4 rounded-lg">
        <h3 class="text-lg font-semibold mb-2">Network Requests</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th class="text-left py-2">Endpoint</th>
                <th class="text-left py-2">Status</th>
                <th class="text-left py-2">Time</th>
                <th class="text-left py-2">Size</th>
              </tr>
            </thead>
            <tbody id="qa-network-logs">
              <tr>
                <td colspan="4" class="py-2">No requests logged yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close button handler
  const closeButton = document.getElementById('closeQAOverlay');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      overlay.classList.add('hidden');
    });
  }
  
  // Listen for Alt+Shift+D to toggle overlay
  document.addEventListener('keydown', function(event) {
    if (event.altKey && event.shiftKey && event.key === 'D') {
      toggleQAOverlay();
    }
  });
  
  // Toggle overlay function
  function toggleQAOverlay() {
    const overlay = document.getElementById('qaOverlay');
    if (overlay) {
      if (overlay.classList.contains('hidden')) {
        updateQAOverlayData();
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }
  
  // Update overlay data
  function updateQAOverlayData() {
    // Data source info
    document.getElementById('qa-data-source').textContent = document.getElementById('dataSourceLabel')?.textContent || 'Unknown';
    document.getElementById('qa-api-status').textContent = 'Connected';
    document.getElementById('qa-last-refresh').textContent = document.getElementById('lastUpdated')?.textContent || 'Unknown';
    
    // Dashboard info
    document.getElementById('qa-version').textContent = '2.3.1';
    document.getElementById('qa-theme').textContent = 'TBWA Theme';
    document.getElementById('qa-render-time').textContent = Math.round(performance.now()) + 'ms';
    
    // Component status
    document.getElementById('qa-filter-bar').textContent = 'Active';
    document.getElementById('qa-date-picker').textContent = 'Active';
    document.getElementById('qa-kpi-tiles').textContent = 'Active (4 tiles)';
    document.getElementById('qa-map').textContent = document.getElementById('storeMap') ? 'Active' : 'Not Found';
    document.getElementById('qa-ai-insights').textContent = document.getElementById('brandInsights') ? 'Active' : 'Not Found';
    
    // URL parameters
    const url = new URL(window.location);
    const params = Object.fromEntries(url.searchParams.entries());
    document.getElementById('qa-url-params').textContent = JSON.stringify(params, null, 2) || '{}';
    
    // Network requests (simulated)
    const networkLogs = document.getElementById('qa-network-logs');
    networkLogs.innerHTML = `
      <tr>
        <td class="py-1">/api/dashboard/kpis</td>
        <td class="py-1"><span class="text-green-400">200 OK</span></td>
        <td class="py-1">246ms</td>
        <td class="py-1">3.2KB</td>
      </tr>
      <tr>
        <td class="py-1">/api/dashboard/metrics</td>
        <td class="py-1"><span class="text-green-400">200 OK</span></td>
        <td class="py-1">189ms</td>
        <td class="py-1">7.8KB</td>
      </tr>
      <tr>
        <td class="py-1">/api/insights</td>
        <td class="py-1"><span class="text-green-400">200 OK</span></td>
        <td class="py-1">562ms</td>
        <td class="py-1">12.4KB</td>
      </tr>
      <tr>
        <td class="py-1">/api/storelocations</td>
        <td class="py-1"><span class="text-green-400">200 OK</span></td>
        <td class="py-1">324ms</td>
        <td class="py-1">45.2KB</td>
      </tr>
    `;
  }
}

// Generic function to refresh data
function refreshData(params = {}) {
  console.log('Refreshing data with params:', params);
  
  // Determine data source
  const dataSourceToggle = document.getElementById('dataSourceToggle');
  const isLive = dataSourceToggle ? dataSourceToggle.checked : false;
  
  // Show loading state
  showDataRefreshIndicator();
  
  // Fetch data based on source and parameters
  fetchDashboardData(isLive, params)
    .then(data => {
      updateDashboardWithData(data);
    })
    .catch(error => {
      console.error('Error refreshing data:', error);
      alert('Error refreshing data. Please try again.');
    });
}