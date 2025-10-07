/**
 * Scout Advisor Dashboard - Power BI Style Interactivity Module
 * Adds cross-filtering, interactive controls, enhanced tooltips, 
 * export functionality, and dynamic recommendations
 * 
 * @version 1.0.1
 * @compatible Chart.js 3.7.1, Bootstrap 5.2.3, Tailwind CSS
 * @TBWA Project Scout
 */

console.log("🏁 Dashboard interactivity JS loaded");

// TBWA SMP Brand Color Palette
const tbwaChartColors = {
  yellow: '#FFCF00',
  black: '#000000',
  slate: '#4B5563',
  red: '#EF4444',
  blue: '#3B82F6',
  gray: '#9CA3AF'
};

// Global filter state
let activeFilters = {
  region: null,
  category: null,
  timeRange: 'Last 30 Days',
  metric: 'performance'
};

// Global chart references
let marketingChart, risksChart, performanceChart;

/**
 * Initialize dashboard interactivity
 * Call this after document is loaded and charts are initialized
 */
function initDashboardInteractivity() {
  console.log('Initializing Scout Advisor Dashboard interactivity...');
  
  // Store references to charts
  marketingChart = getChartReference('marketingChart');
  risksChart = getChartReference('risksChart');
  performanceChart = getChartReference('performanceChart');
  
  // Initialize cross-filtering for charts
  initChartInteractions();
  
  // Initialize filter controls
  initFilterControls();
  
  // Initialize export functionality
  initExportButtons();
  
  // Initialize recommendations panel
  updateRecommendationPanel();
  
  console.log('Scout Advisor Dashboard interactivity initialized');
}

/**
 * Get Chart.js instance by canvas ID
 */
function getChartReference(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  return Chart.getChart(canvas);
}

/**
 * Initialize cross-filtering between charts
 */
function initChartInteractions() {
  // Marketing Chart click handling
  if (marketingChart) {
    marketingChart.canvas.onclick = function(evt) {
      const points = marketingChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
      if (points.length) {
        const index = points[0].index;
        toggleFilter('timeRange', marketingChart.data.labels[index]);
      }
    };
  }
  
  // Risks Chart click handling
  if (risksChart) {
    risksChart.canvas.onclick = function(evt) {
      const points = risksChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
      if (points.length) {
        const index = points[0].index;
        toggleFilter('category', risksChart.data.labels[index]);
      }
    };
  }
  
  // Performance Chart click handling
  if (performanceChart) {
    performanceChart.canvas.onclick = function(evt) {
      const points = performanceChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
      if (points.length) {
        const index = points[0].index;
        toggleFilter('timeRange', performanceChart.data.labels[index]);
      }
    };
  }
  
  // Add click event listeners to KPI cards
  const kpiCards = document.querySelectorAll('.dashboard-card');
  kpiCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.closest('.modal')) {  // Prevent triggering when modal is open
        const status = this.getAttribute('data-status');
        toggleFilter('status', status);
      }
    });
  });
  
  // Add click event listeners to insight cards
  const insightCards = document.querySelectorAll('.insight-card');
  insightCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.matches('button')) {  // Don't trigger when buttons are clicked
        const badge = this.querySelector('.status-badge');
        if (badge) {
          const impact = badge.textContent.trim();
          toggleFilter('impact', impact);
        }
      }
    });
  });
}

/**
 * Initialize filter controls
 */
function initFilterControls() {
  // Date range picker
  const dateRange = document.querySelector('.date-range');
  if (dateRange) {
    dateRange.addEventListener('click', function() {
      // Simulating date picker toggle
      const currentText = this.querySelector('span').textContent;
      const options = ['Last 7 Days', 'Last 30 Days', 'Last Quarter', 'Year to Date'];
      const currentIndex = options.indexOf(currentText);
      const nextIndex = (currentIndex + 1) % options.length;
      
      this.querySelector('span').textContent = options[nextIndex];
      
      // Update filter and refresh dashboard
      toggleFilter('timeRange', options[nextIndex]);
    });
  }
  
  // Organization filter pills
  const filterPills = document.querySelectorAll('.filter-pill button');
  filterPills.forEach(button => {
    button.addEventListener('click', function() {
      const pill = this.closest('.filter-pill');
      const filterType = pill.querySelector('span.font-medium').textContent.trim().replace(':', '');
      const filterValue = pill.querySelector('span:not(.font-medium)').textContent.trim();
      
      // Remove filter and refresh dashboard
      toggleFilter(filterType.toLowerCase(), null);
      
      // Visual feedback - hide the pill
      pill.style.display = 'none';
    });
  });
  
  // Add filter button
  const addFilterButton = document.querySelector('button:has(.fa-plus)');
  if (addFilterButton) {
    addFilterButton.addEventListener('click', function() {
      // Simulating filter addition
      alert('Filter selection dialog would appear here. This is a UI mockup.');
    });
  }
  
  // Data source toggle (if exists)
  const dataSourceToggle = document.querySelector('.toggle-group');
  if (!dataSourceToggle) {
    console.warn("⚠️ Toggle group not found");
  } else {
    console.log("✅ Toggle group detected");
    const options = dataSourceToggle.querySelectorAll('.toggle-option');
    options.forEach(option => {
      option.addEventListener('click', function() {
        // Remove selected class from all options
        options.forEach(opt => opt.classList.remove('toggle-selected'));
        // Add selected class to clicked option
        this.classList.add('toggle-selected');
        
        // Update data source and refresh charts
        const dataSource = this.textContent.trim();
        localStorage.setItem('scout_data_source', dataSource);
        console.log(`💾 Data source set to: ${dataSource}`);
        
        // Simulate data refresh
        refreshChartData(dataSource);
      });
    });
  }
}

/**
 * Initialize export buttons
 */
function initExportButtons() {
  // Add export button next to charts
  const chartContainers = document.querySelectorAll('.bg-white.rounded-lg');
  chartContainers.forEach(container => {
    const header = container.querySelector('h3');
    if (header) {
      const buttonContainer = header.closest('div');
      
      // Create export button
      const exportButton = document.createElement('button');
      exportButton.className = 'text-tbwa-darkBlue hover:text-tbwa-darkBlue/80 hover:bg-tbwa-yellow/10 p-1 rounded text-sm ml-2';
      exportButton.innerHTML = '<i class="fas fa-download mr-1"></i> Export';
      
      // Add click handler
      exportButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Find the chart in this container
        const canvas = container.querySelector('canvas');
        if (canvas) {
          const chart = Chart.getChart(canvas);
          if (chart) {
            exportChartData(chart);
          }
        }
      });
      
      // Add to container
      if (buttonContainer.children.length > 1) {
        buttonContainer.insertBefore(exportButton, buttonContainer.children[1]);
      } else {
        buttonContainer.appendChild(exportButton);
      }
    }
  });
  
  // Main export button
  const mainExportButton = document.querySelector('button.btn-ghost-azure');
  if (mainExportButton) {
    mainExportButton.addEventListener('click', function() {
      exportDashboardData();
    });
  }
}

/**
 * Export chart data to CSV
 */
function exportChartData(chart) {
  // Create CSV content
  let csv = 'Label,Value\n';
  
  // Get chart data
  chart.data.labels.forEach((label, idx) => {
    // Handle multiple datasets
    if (chart.data.datasets.length > 1) {
      chart.data.datasets.forEach((dataset, datasetIdx) => {
        if (idx === 0) {
          csv += `${label},${dataset.data[idx]}\n`;
        } else {
          csv += `${label}_${datasetIdx},${dataset.data[idx]}\n`;
        }
      });
    } else {
      csv += `${label},${chart.data.datasets[0].data[idx]}\n`;
    }
  });
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chart.canvas.id}_data.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export all dashboard data to Excel/CSV
 */
function exportDashboardData() {
  // Create CSV content with multiple sheets (in this mock, it's a single CSV)
  let csv = 'Scout Advisor Dashboard Export\n\n';
  
  // Add KPI data
  csv += 'KPI Metrics\n';
  csv += 'Metric,Value,Status\n';
  
  // Get KPI data from dashboard
  const kpiCards = document.querySelectorAll('.dashboard-card');
  kpiCards.forEach(card => {
    const title = card.querySelector('h3').textContent;
    const value = card.querySelector('.text-2xl').textContent;
    const status = card.getAttribute('data-status');
    csv += `${title},${value},${status}\n`;
  });
  
  csv += '\nChart Data\n';
  
  // Add chart data if available
  [marketingChart, risksChart, performanceChart].forEach(chart => {
    if (chart) {
      csv += `\n${chart.canvas.closest('.bg-white').querySelector('h3').textContent}\n`;
      csv += 'Label,Value\n';
      
      chart.data.labels.forEach((label, idx) => {
        if (chart.data.datasets.length > 1) {
          chart.data.datasets.forEach((dataset, datasetIdx) => {
            const datasetLabel = dataset.label || `Dataset ${datasetIdx+1}`;
            csv += `${label} (${datasetLabel}),${dataset.data[idx]}\n`;
          });
        } else {
          csv += `${label},${chart.data.datasets[0].data[idx]}\n`;
        }
      });
    }
  });
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scout_advisor_dashboard_export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Toggle a dashboard filter
 */
function toggleFilter(filterType, value) {
  // If same value, remove filter (toggle off)
  if (activeFilters[filterType] === value) {
    activeFilters[filterType] = null;
  } else {
    activeFilters[filterType] = value;
  }
  
  // Update UI to reflect filter state
  updateFilterUI();
  
  // Refresh dashboard with new filters
  refreshDashboard();
}

/**
 * Update UI to reflect current filter state
 */
function updateFilterUI() {
  // Update filter pills
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    const filterType = pill.querySelector('span.font-medium').textContent.trim().replace(':', '').toLowerCase();
    const filterValueSpan = pill.querySelector('span:not(.font-medium)');
    
    if (activeFilters[filterType]) {
      // Show pill and update value
      pill.style.display = 'inline-flex';
      filterValueSpan.textContent = activeFilters[filterType];
    } else {
      // Hide pill if filter is not active
      // Instead of hiding, we'll keep all pills visible in this mockup
    }
  });
  
  // Update date range if it's a filter
  const dateRange = document.querySelector('.date-range span');
  if (dateRange && activeFilters.timeRange) {
    dateRange.textContent = activeFilters.timeRange;
  }
  
  // Add visual indication of filtered state to charts
  [marketingChart, risksChart, performanceChart].forEach(chart => {
    if (chart) {
      // Add subtle border to indicate filtered state
      if (activeFilters.timeRange || activeFilters.category || activeFilters.region) {
        chart.canvas.style.border = '2px solid #FFD700';
      } else {
        chart.canvas.style.border = 'none';
      }
    }
  });
  
  // Update recommendation panel based on filters
  updateRecommendationPanel();
}

/**
 * Refresh dashboard with current filters
 */
function refreshDashboard() {
  console.log('Refreshing dashboard with filters:', activeFilters);
  
  // Simulate filtered data
  refreshChartData();
  
  // Update KPI cards based on filters
  updateKPICards();
  
  // Update insight cards based on filters
  updateInsightCards();
  
  // Update recommendation panel
  updateRecommendationPanel();
}

/**
 * Refresh chart data based on current filters
 */
function refreshChartData(dataSource) {
  // Verify data source and log it
  dataSource = dataSource || localStorage.getItem('scout_data_source') || 'Simulated';
  console.log(`🔄 Refreshing chart data with source: ${dataSource}`);
  
  // Log to diagnostic overlay if available
  if (window.logDiagnostic) {
    window.logDiagnostic(`Refreshing chart data with source: ${dataSource}`, 'info');
  }
  
  // Update Marketing Chart
  if (marketingChart) {
    try {
      // Apply filters and get new data
      const newData = applyFiltersToData(marketingChart.data.datasets[0].data, 0.1);
      
      // Update chart with TBWA colors
      marketingChart.data.datasets[0].data = newData;
      marketingChart.data.datasets[0].backgroundColor = tbwaChartColors.blue;
      marketingChart.data.datasets[0].borderColor = tbwaChartColors.black;
      marketingChart.update();
      
      console.log('✅ Marketing chart updated');
    } catch (error) {
      console.error('⚠️ Error updating marketing chart:', error);
      // Re-initialize if chart instance was lost
      marketingChart = getChartReference('marketingChart');
      if (marketingChart) marketingChart.update();
    }
  } else {
    console.warn('⚠️ Marketing chart not available');
  }
  
  // Update Risks Chart
  if (risksChart) {
    try {
      // Risks chart data should react to category filter
      if (activeFilters.category) {
        // Emphasize the selected category
        const emphasizedData = risksChart.data.datasets[0].data.map((val, idx) => {
          return risksChart.data.labels[idx] === activeFilters.category ? val * 1.2 : val * 0.8;
        });
        risksChart.data.datasets[0].data = emphasizedData;
      } else {
        // Reset to original-like data
        risksChart.data.datasets[0].data = [4, 9, 4];
      }
      
      // Apply TBWA colors
      risksChart.data.datasets[0].backgroundColor = [
        tbwaChartColors.blue,
        tbwaChartColors.yellow,
        tbwaChartColors.red
      ];
      risksChart.data.datasets[0].borderColor = tbwaChartColors.black;
      risksChart.update();
      
      console.log('✅ Risks chart updated');
    } catch (error) {
      console.error('⚠️ Error updating risks chart:', error);
      // Re-initialize if chart instance was lost
      risksChart = getChartReference('risksChart');
      if (risksChart) risksChart.update();
    }
  } else {
    console.warn('⚠️ Risks chart not available');
  }
  
  // Update Performance Chart
  if (performanceChart) {
    try {
      // Apply time range filter
      let newData;
      if (activeFilters.timeRange === 'Last 7 Days') {
        newData = [99.8, 99.9, 100, 100, 99.9, 100, 99.95];
      } else {
        // Random variation for other time ranges
        newData = applyFiltersToData(performanceChart.data.datasets[0].data, 0.05);
      }
      
      // Apply TBWA colors
      performanceChart.data.datasets[0].data = newData;
      performanceChart.data.datasets[0].backgroundColor = tbwaChartColors.yellow;
      performanceChart.data.datasets[0].borderColor = tbwaChartColors.black;
      performanceChart.update();
      
      console.log('✅ Performance chart updated');
    } catch (error) {
      console.error('⚠️ Error updating performance chart:', error);
      // Re-initialize if chart instance was lost
      performanceChart = getChartReference('performanceChart');
      if (performanceChart) performanceChart.update();
    }
  } else {
    console.warn('⚠️ Performance chart not available');
  }
  
  // Update UI to reflect data source
  updateDataSourceUI(dataSource);
}

/**
 * Update data source UI elements to reflect current selection
 */
function updateDataSourceUI(dataSource) {
  const dataSourceToggle = document.querySelector('.toggle-group');
  if (!dataSourceToggle) return;
  
  const options = dataSourceToggle.querySelectorAll('.toggle-option');
  options.forEach(option => {
    if (option.textContent.trim() === dataSource) {
      option.classList.add('toggle-selected');
    } else {
      option.classList.remove('toggle-selected');
    }
  });
}

/**
 * Apply filter effects to data array with random variation
 */
function applyFiltersToData(data, variationFactor) {
  return data.map(val => {
    // Random variation within the factor
    const variation = (Math.random() * 2 - 1) * variationFactor;
    
    // Apply variation and ensure positive values
    return Math.max(0, val * (1 + variation));
  });
}

/**
 * Update KPI cards based on current filters
 */
function updateKPICards() {
  const kpiCards = document.querySelectorAll('.dashboard-card');
  kpiCards.forEach(card => {
    // Get status and apply filter effects
    const status = card.getAttribute('data-status');
    
    // Skip if status filter doesn't match
    if (activeFilters.status && activeFilters.status !== status) {
      card.style.opacity = '0.5';
    } else {
      card.style.opacity = '1';
    }
    
    // Apply subtle animation to indicate update
    card.style.transition = 'all 0.3s ease';
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
      card.style.transform = 'translateY(0)';
    }, 300);
  });
}

/**
 * Update insight cards based on current filters
 */
function updateInsightCards() {
  const insightCards = document.querySelectorAll('.insight-card');
  insightCards.forEach(card => {
    const badge = card.querySelector('.status-badge');
    
    // Skip if impact filter doesn't match
    if (activeFilters.impact && badge && !badge.textContent.includes(activeFilters.impact)) {
      card.style.opacity = '0.5';
    } else {
      card.style.opacity = '1';
    }
    
    // Apply subtle animation to indicate update
    card.style.transition = 'all 0.3s ease';
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
      card.style.transform = 'translateY(0)';
    }, 300);
  });
}

/**
 * Update recommendation panel based on current filters
 */
function updateRecommendationPanel() {
  const assistantCard = document.querySelector('.assistant-card');
  if (!assistantCard) return;
  
  let recommendationText = '';
  let recommendationTitle = '';
  
  // Generate recommendations based on current filters
  if (activeFilters.category === 'High') {
    recommendationTitle = 'AI detects critical risk factors requiring immediate attention';
    recommendationText = 'Based on filtered high-risk factors, prioritize immediate mitigation for these specific threats to maintain brand integrity and performance metrics.';
  } else if (activeFilters.status === 'warning') {
    recommendationTitle = 'Opportunity to improve warning-state metrics';
    recommendationText = 'Selected warning metrics suggest optimization potential in competitor analysis. Consider implementing tactical responses to recent market shifts.';
  } else if (activeFilters.timeRange === 'Last 7 Days') {
    recommendationTitle = 'Recent trend detected in weekly performance';
    recommendationText = 'Short-term data indicates a significant upward trend in brand visibility. Consider capitalizing on this momentum with increased social media engagement.';
  } else {
    // Default recommendation
    recommendationTitle = 'AI detects surge in bundling of salty snacks with cola in Barangay Pineda';
    recommendationText = 'Based on recent sales data and social media analysis, there\'s a significant trend toward purchasing salty snacks and cola together in the Pineda area, providing an opportunity for targeted bundling strategies.';
  }
  
  // Update the card
  const titleElement = assistantCard.querySelector('.flex.items-center.gap-2.mb-3 span');
  const textElement = assistantCard.querySelector('p.text-sm.text-gray-600');
  
  if (titleElement) titleElement.textContent = recommendationTitle;
  if (textElement) textElement.textContent = recommendationText;
  
  // Apply visual indicator that content has been updated
  assistantCard.style.transition = 'all 0.3s ease';
  assistantCard.style.borderLeftColor = '#F6E14D';
  assistantCard.style.boxShadow = '0 0 10px rgba(246, 225, 77, 0.3)';
  
  setTimeout(() => {
    assistantCard.style.borderLeftColor = '';
    assistantCard.style.boxShadow = '';
  }, 1500);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for Chart.js to initialize
  setTimeout(() => {
    initDashboardInteractivity();
    
    // Reapply stored data source selection from localStorage
    const savedSource = localStorage.getItem('scout_data_source') || 'Simulated';
    console.log(`📋 Restoring saved data source: ${savedSource}`);
    refreshChartData(savedSource);
  }, 500);
});

// Add custom tooltip styles
function addCustomTooltipStyles() {
  // Create style element
  const style = document.createElement('style');
  style.textContent = `
    /* Custom Chart.js Tooltip Styles */
    .chartjs-tooltip {
      background-color: rgba(0, 0, 0, 0.8) !important;
      border-radius: 4px !important;
      color: #ffffff !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important;
      padding: 8px 12px !important;
      pointer-events: none !important;
      position: absolute !important;
      transform: translate(-50%, 0) !important;
      transition: opacity 0.1s ease !important;
      z-index: 100 !important;
      max-width: 200px !important;
      border-left: 3px solid ${tbwaChartColors.yellow} !important;
    }
    
    .chartjs-tooltip-header {
      font-weight: bold !important;
      margin-bottom: 6px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      padding-bottom: 3px !important;
      color: ${tbwaChartColors.yellow} !important;
    }
    
    .chartjs-tooltip-body {
      display: flex !important;
      flex-direction: column !important;
    }
    
    .chartjs-tooltip-body-item {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin: 2px 0 !important;
    }
  `;
  
  // Add to document
  document.head.appendChild(style);
}

// Add custom tooltip styles when document loads
document.addEventListener('DOMContentLoaded', addCustomTooltipStyles);