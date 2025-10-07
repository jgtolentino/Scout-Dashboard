/**
 * Retail Edge Interaction Visualizer
 * 
 * This module handles visualization of edge device interactions data
 * for retail environments, including STT, face detection, and brand mentions.
 * 
 * @author InsightPulseAI Team
 * @version 1.1
 */

(function() {
  'use strict';
  
  /**
   * Configuration for the retail edge visualizer
   */
  const config = {
    apiEndpoint: '/api/retail-edge',
    refreshInterval: 300000, // 5 minutes
    defaultTimeRange: '7d',
    chartColors: {
      // Default colors if TBWA theme is not available
      primary: '#002b49', // TBWA Navy
      secondary: '#FFE600', // TBWA Yellow
      tertiary: '#00AEEF', // TBWA Cyan
      success: '#00AEEF', // TBWA Cyan
      warning: '#FF6B00', // TBWA Orange
      danger: '#E11900', // TBWA Red
      info: '#00AEEF', // TBWA Cyan
      face: '#7E57C2', // Purple
      speech: '#00AEEF', // TBWA Cyan
      brand: '#002b49', // TBWA Navy
      interaction: '#FF6B00' // TBWA Orange
    }
  };
  
  /**
   * RetailEdgeVisualizer class handles dashboard functionality
   */
  class RetailEdgeVisualizer {
    constructor(options = {}) {
      // Merge default config with options
      this.config = {...config, ...options};
      this.charts = {};
      this.data = {
        interactions: [],
        events: [],
        nodes: [],
        timeRange: this.config.defaultTimeRange,
        filters: {
          store: 'all',
          deviceType: 'all',
          eventType: 'all'
        }
      };
      
      // Update colors if TBWA theme is available
      this.updateConfigColors();
      
      // Refresh interval reference
      this.refreshInterval = null;
    }
    
    /**
     * Initialize the dashboard
     */
    init() {
      console.log('Initializing RetailEdgeVisualizer...');
      this.loadData();
      
      // Set up automatic refresh
      this.refreshInterval = setInterval(() => {
        this.refreshData();
      }, this.config.refreshInterval);
    }
    
    /**
     * Update config colors from TBWA theme if available
     */
    updateConfigColors() {
      // Check if TBWA theme is available
      if (window.TBWA_THEME && window.TBWA_THEME.palette) {
        // Update with TBWA colors
        this.config.chartColors.primary = window.TBWA_THEME.palette.navy;
        this.config.chartColors.secondary = window.TBWA_THEME.palette.yellow;
        this.config.chartColors.tertiary = window.TBWA_THEME.palette.cyan;
        this.config.chartColors.success = window.TBWA_THEME.palette.cyan;
        this.config.chartColors.warning = window.TBWA_THEME.palette.orange;
        this.config.chartColors.danger = window.TBWA_THEME.palette.red;
        this.config.chartColors.info = window.TBWA_THEME.palette.cyan;
        this.config.chartColors.brand = window.TBWA_THEME.palette.navy;
        this.config.chartColors.interaction = window.TBWA_THEME.palette.orange;
        
        console.log('TBWA theme colors applied to visualizer');
      }
    }
    
    /**
     * Apply TBWA theme to all charts
     */
    applyTbwaTheme() {
      if (!window.TBWA_THEME) return;
      
      // Apply to all existing charts
      Object.values(this.charts).forEach(chart => {
        if (window.TBWA_THEME.apply) {
          window.TBWA_THEME.apply(chart);
        }
      });
      
      console.log('TBWA theme applied to all charts');
    }
    
    /**
     * Load initial data
     */
    loadData() {
      this.showLoading(true);
      
      // In a real implementation, this would make an API call
      // For demo, we simulate with timeout
      setTimeout(() => {
        this.simulateDataLoad();
        this.showLoading(false);
      }, 1000);
    }
    
    /**
     * Simulate data loading (for demo purposes)
     */
    simulateDataLoad() {
      // Simulate loading interaction data
      this.data.interactions = this.generateInteractionData();
      this.data.events = this.generateEventsData();
      this.data.nodes = this.generateNodesData();
      
      // Render charts
      this.renderCharts();
      
      // Apply TBWA theme if available
      if (window.TBWA_THEME && window.TBWA_THEME.apply) {
        this.applyTbwaTheme();
      }
    }
    
    /**
     * Refresh data
     */
    refreshData() {
      const refreshBtn = document.querySelector('.btn-refresh');
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Refreshing...';
      }
      
      // Simulate API refresh
      setTimeout(() => {
        this.loadData();
        
        if (refreshBtn) {
          refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Refresh';
        }
      }, 1000);
    }
    
    /**
     * Show or hide loading indicators
     */
    showLoading(isLoading) {
      const chartContainers = document.querySelectorAll('.chart-container');
      
      if (isLoading) {
        chartContainers.forEach(container => {
          container.style.opacity = '0.5';
        });
      } else {
        chartContainers.forEach(container => {
          container.style.opacity = '1';
        });
      }
    }
    
    /**
     * Filter dashboard data based on criteria
     */
    filterData(filters) {
      console.log('Filtering data:', filters);
      this.data.filters = filters;
      
      // Re-render with filters applied
      this.showLoading(true);
      
      // Simulate API call with filters
      setTimeout(() => {
        this.renderCharts();
        this.showLoading(false);
        
        // Re-apply TBWA theme if available
        if (window.TBWA_THEME && window.TBWA_THEME.apply) {
          this.applyTbwaTheme();
        }
      }, 800);
    }
    
    /**
     * Render all charts
     */
    renderCharts() {
      this.renderInteractionsChart();
      this.renderEventTypesChart();
      this.renderBrandHeatmapChart();
      this.renderDwellTimeChart();
    }
    
    /**
     * Render interactions by hour chart
     */
    renderInteractionsChart() {
      const ctx = document.getElementById('interactionsChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.interactionsChart) {
        this.charts.interactionsChart.destroy();
      }
      
      // Apply filters to data if needed
      let filteredData = this.data.interactions;
      
      // Generate labels for hours (last 24 hours)
      const labels = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(now.getHours() - i);
        labels.push(hour.getHours() + ':00');
      }
      
      // Create chart
      this.charts.interactionsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Face Detections',
              data: filteredData.faceData,
              borderColor: this.config.chartColors.face,
              backgroundColor: this.hexToRGBA(this.config.chartColors.face, 0.1),
              tension: 0.4,
              fill: true
            },
            {
              label: 'Speech Events',
              data: filteredData.speechData,
              borderColor: this.config.chartColors.speech,
              backgroundColor: this.hexToRGBA(this.config.chartColors.speech, 0.1),
              tension: 0.4,
              fill: true
            },
            {
              label: 'Brand Mentions',
              data: filteredData.brandData,
              borderColor: this.config.chartColors.brand,
              backgroundColor: this.hexToRGBA(this.config.chartColors.brand, 0.1),
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Events'
              }
            }
          }
        }
      });
    }
    
    /**
     * Render event types distribution chart
     */
    renderEventTypesChart() {
      const ctx = document.getElementById('eventTypesChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.eventTypesChart) {
        this.charts.eventTypesChart.destroy();
      }
      
      // Get colors from TBWA theme if available
      const colors = [
        this.config.chartColors.face,
        this.config.chartColors.speech, 
        this.config.chartColors.brand,
        this.config.chartColors.interaction
      ];
      
      // Create chart
      this.charts.eventTypesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Face Detection', 'Speech Recognition', 'Brand Mentions', 'Interactions'],
          datasets: [{
            data: [532, 428, 287, 154],
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          },
          cutout: '65%'
        }
      });
    }
    
    /**
     * Render brand mentions heatmap
     */
    renderBrandHeatmapChart() {
      const ctx = document.getElementById('brandHeatmapChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.brandHeatmapChart) {
        this.charts.brandHeatmapChart.destroy();
      }
      
      // Create chart data
      const brands = ['Apple', 'Samsung', 'Nike', 'Coca-Cola', 'Pepsi'];
      const locations = ['Entrance', 'Center Aisle', 'Electronics', 'Checkout', 'Display Area'];
      
      // Generate sample data for the heatmap
      const data = [];
      for (let i = 0; i < brands.length; i++) {
        for (let j = 0; j < locations.length; j++) {
          // Random value between 0 and 100
          const value = Math.floor(Math.random() * 100);
          data.push({
            x: locations[j],
            y: brands[i],
            v: value
          });
        }
      }
      
      // TBWA color scale for heatmap (navy to yellow)
      const getColor = (value) => {
        // If TBWA theme is available, use its colors
        if (window.TBWA_THEME && window.TBWA_THEME.palette) {
          // Create a gradient between navy and yellow based on value
          const navyColor = this.hexToRGB(window.TBWA_THEME.palette.navy);
          const yellowColor = this.hexToRGB(window.TBWA_THEME.palette.yellow);
          
          // Interpolate between colors
          const r = Math.round(navyColor.r + (yellowColor.r - navyColor.r) * (value / 100));
          const g = Math.round(navyColor.g + (yellowColor.g - navyColor.g) * (value / 100));
          const b = Math.round(navyColor.b + (yellowColor.b - navyColor.b) * (value / 100));
          
          return `rgba(${r}, ${g}, ${b}, 0.7)`;
        } else {
          // Fallback red-blue scale
          const r = Math.min(255, Math.floor(value * 2.55));
          const g = 50;
          const b = Math.min(255, Math.floor(255 - value * 2.55));
          return `rgba(${r}, ${g}, ${b}, 0.7)`;
        }
      };
      
      // Create heat map using a bubble chart
      this.charts.brandHeatmapChart = new Chart(ctx, {
        type: 'bubble',
        data: {
          datasets: [{
            data: data.map(item => ({
              x: item.x,
              y: item.y,
              r: Math.max(item.v / 10, 3) // Scale for visibility
            })),
            backgroundColor: data.map(item => getColor(item.v))
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const dataPoint = data[context.dataIndex];
                  return `${dataPoint.y} at ${dataPoint.x}: ${dataPoint.v} mentions`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'category',
              position: 'bottom',
              title: {
                display: true,
                text: 'Store Location'
              }
            },
            y: {
              type: 'category',
              position: 'left',
              title: {
                display: true,
                text: 'Brand'
              }
            }
          }
        }
      });
    }
    
    /**
     * Render dwell time vs conversion chart
     */
    renderDwellTimeChart() {
      const ctx = document.getElementById('dwellTimeChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.dwellTimeChart) {
        this.charts.dwellTimeChart.destroy();
      }
      
      // Create scattered data for dwell time (x) vs conversion (y)
      const dwellData = [];
      for (let i = 0; i < 50; i++) {
        // Dwell time: 10s to 240s
        const dwellTime = Math.floor(Math.random() * 230) + 10;
        
        // Conversion probability follows a curve - higher with moderate dwell times
        let conversionProb;
        if (dwellTime < 30) {
          conversionProb = dwellTime * 0.5 / 30; // Low for very short times
        } else if (dwellTime < 120) {
          conversionProb = 0.5 + (dwellTime - 30) * 0.5 / 90; // Rises to peak around 2 mins
        } else {
          conversionProb = 1.0 - (dwellTime - 120) * 0.7 / 120; // Falls for very long times
        }
        
        // Add some noise
        conversionProb = Math.min(1.0, Math.max(0, conversionProb + (Math.random() - 0.5) * 0.3));
        
        dwellData.push({
          x: dwellTime,
          y: conversionProb,
          productCategory: ['Electronics', 'Clothing', 'Groceries', 'Home Goods', 'Beverages'][Math.floor(Math.random() * 5)]
        });
      }
      
      // Use TBWA colors if available
      let colors = [];
      if (window.TBWA_THEME && window.TBWA_THEME.colors) {
        colors = window.TBWA_THEME.colors.slice(0, 5);
      } else {
        colors = [
          this.config.chartColors.primary,
          this.config.chartColors.secondary,
          this.config.chartColors.tertiary,
          this.config.chartColors.warning,
          this.config.chartColors.success
        ];
      }
      
      // Group by product category
      const categories = ['Electronics', 'Clothing', 'Groceries', 'Home Goods', 'Beverages'];
      const datasets = categories.map((category, index) => {
        const color = colors[index] || this.getRandomColor();
        return {
          label: category,
          data: dwellData.filter(d => d.productCategory === category).map(d => ({x: d.x, y: d.y})),
          backgroundColor: this.hexToRGBA(color, 0.7),
          borderColor: color,
          pointRadius: 6,
          pointHoverRadius: 8
        };
      });
      
      // Create chart
      this.charts.dwellTimeChart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const x = context.parsed.x;
                  const y = context.parsed.y;
                  return `${context.dataset.label}: ${x}s dwell time, ${(y * 100).toFixed(1)}% conversion`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Dwell Time (seconds)'
              },
              min: 0,
              max: 240
            },
            y: {
              title: {
                display: true,
                text: 'Conversion Probability'
              },
              min: 0,
              max: 1,
              ticks: {
                callback: function(value) {
                  return (value * 100) + '%';
                }
              }
            }
          }
        }
      });
    }
    
    /**
     * Update charts theme based on dark mode setting
     */
    updateChartsTheme(isDarkMode) {
      // Determine text and grid colors
      const textColor = isDarkMode ? '#fff' : '#666';
      const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      
      // Update all charts with theme
      Object.values(this.charts).forEach(chart => {
        if (!chart.options.plugins) chart.options.plugins = {};
        if (!chart.options.plugins.legend) chart.options.plugins.legend = {};
        if (!chart.options.scales) chart.options.scales = {};
        
        // Update legend color
        chart.options.plugins.legend.labels = {
          color: textColor
        };
        
        // Update scales if they exist
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks = { 
            color: textColor
          };
          chart.options.scales.x.grid = { 
            color: gridColor
          };
          if (chart.options.scales.x.title) {
            chart.options.scales.x.title.color = textColor;
          }
        }
        
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks = { 
            color: textColor
          };
          chart.options.scales.y.grid = { 
            color: gridColor
          };
          if (chart.options.scales.y.title) {
            chart.options.scales.y.title.color = textColor;
          }
        }
        
        // Update chart
        chart.update();
      });
      
      // Re-apply TBWA theme if available
      if (window.TBWA_THEME && window.TBWA_THEME.apply) {
        this.applyTbwaTheme();
      }
    }
    
    /**
     * Generate fake interaction data for demo
     */
    generateInteractionData() {
      // Generate random interaction data for the past 24 hours
      const faceData = [];
      const speechData = [];
      const brandData = [];
      
      for (let i = 0; i < 24; i++) {
        // Face detection follows a bell curve through the day
        const hourFactor = 1 - Math.abs((i - 12) / 12);
        
        // Base values with daily patterns
        const faceBase = Math.floor(5 + hourFactor * 40);
        const speechBase = Math.floor(3 + hourFactor * 30);
        const brandBase = Math.floor(2 + hourFactor * 20);
        
        // Add randomness
        faceData.push(Math.max(0, faceBase + Math.floor(Math.random() * 15) - 5));
        speechData.push(Math.max(0, speechBase + Math.floor(Math.random() * 12) - 4));
        brandData.push(Math.max(0, brandBase + Math.floor(Math.random() * 10) - 3));
      }
      
      return {
        faceData,
        speechData,
        brandData
      };
    }
    
    /**
     * Generate fake events data for demo
     */
    generateEventsData() {
      // This would be replaced with actual API data
      return [];
    }
    
    /**
     * Generate fake nodes data for demo
     */
    generateNodesData() {
      // This would be replaced with actual API data
      return [];
    }
    
    /**
     * Helper to convert hex color to rgba
     */
    hexToRGBA(hex, alpha) {
      const rgb = this.hexToRGB(hex);
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    }
    
    /**
     * Helper to convert hex color to RGB object
     */
    hexToRGB(hex) {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Handle shorthand hex
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      
      return { r, g, b };
    }
    
    /**
     * Get a random color
     */
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
  }
  
  // Create and export the visualizer
  window.RetailEdgeVisualizer = new RetailEdgeVisualizer();
})();