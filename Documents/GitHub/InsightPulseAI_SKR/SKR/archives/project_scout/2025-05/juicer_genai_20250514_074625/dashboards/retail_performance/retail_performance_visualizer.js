/**
 * Retail Performance Uplift Visualizer
 * 
 * This module handles visualization of retail performance metrics before and after campaigns,
 * with focus on uplift tracking and AI-driven insights.
 * 
 * @author Analytics Team
 * @version 1.0
 */

(function() {
  'use strict';
  
  /**
   * Configuration for the retail performance visualizer
   */
  const config = {
    apiEndpoint: '/api/retail-performance',
    refreshInterval: 300000, // 5 minutes
    defaultCampaignId: 'campaign-301',
    defaultComparisonPeriod: 'prev-month',
    chartColors: {
      primary: '#ff3300',
      secondary: '#002b49',
      tertiary: '#8a4fff',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
      
      electronics: '#4285F4',
      clothing: '#EA4335',
      home: '#34A853',
      grocery: '#FBBC05',
      beverages: '#8A4EE9',
      
      before: '#6c757d',
      after: '#ff3300',
      
      positive: '#4caf50',
      negative: '#f44336',
      neutral: '#ff9800'
    }
  };
  
  /**
   * RetailPerformanceVisualizer class handles dashboard functionality
   */
  class RetailPerformanceVisualizer {
    constructor(options = {}) {
      // Merge default config with options
      this.config = {...config, ...options};
      this.charts = {};
      this.data = {
        campaignId: this.config.defaultCampaignId,
        comparisonPeriod: this.config.defaultComparisonPeriod,
        campaignData: {},
        categoryData: {},
        skuData: {},
        brandData: {},
        filters: {
          campaign: 'campaign-301',
          store: 'all',
          category: 'all',
          comparisonPeriod: 'prev-month'
        }
      };
      
      // Refresh interval reference
      this.refreshInterval = null;
    }
    
    /**
     * Initialize the dashboard
     */
    init() {
      console.log('Initializing RetailPerformanceVisualizer...');
      this.loadData();
      
      // Set up automatic refresh
      this.refreshInterval = setInterval(() => {
        this.refreshData();
      }, this.config.refreshInterval);
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
      // Prepare simulated data
      this.data.campaignData = this.generateCampaignData();
      this.data.categoryData = this.generateCategoryData();
      this.data.skuData = this.generateSKUData();
      this.data.brandData = this.generateBrandData();
      this.data.voiceData = this.generateVoiceData();
      this.data.pricingData = this.generatePricingData();
      
      // Render charts with data
      this.renderCharts();
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
      }, 800);
    }
    
    /**
     * Render all charts
     */
    renderCharts() {
      this.renderCategoryUpliftChart();
      this.renderCampaignEffectivenessChart();
      this.renderVoiceSentimentChart();
      this.renderPricingEffectChart();
      this.renderBrandLiftChart();
    }
    
    /**
     * Render before/after category uplift chart
     */
    renderCategoryUpliftChart() {
      const ctx = document.getElementById('categoryUpliftChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.categoryUpliftChart) {
        this.charts.categoryUpliftChart.destroy();
      }
      
      // Get category data
      const data = this.data.categoryData;
      
      // Create chart
      this.charts.categoryUpliftChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.categories,
          datasets: [
            {
              label: 'Before Campaign',
              data: data.beforeValues,
              backgroundColor: this.config.chartColors.before,
              borderWidth: 0
            },
            {
              label: 'After Campaign',
              data: data.afterValues,
              backgroundColor: this.config.chartColors.after,
              borderWidth: 0
            }
          ]
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
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: $${value.toLocaleString()}`;
                },
                afterBody: function(context) {
                  const index = context[0].dataIndex;
                  const before = data.beforeValues[index];
                  const after = data.afterValues[index];
                  const change = ((after - before) / before * 100).toFixed(1);
                  return `Uplift: ${change}%`;
                }
              }
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
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              },
              title: {
                display: true,
                text: 'Sales Revenue'
              }
            }
          }
        }
      });
    }
    
    /**
     * Render campaign effectiveness chart
     */
    renderCampaignEffectivenessChart() {
      const ctx = document.getElementById('campaignEffectivenessChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.campaignEffectivenessChart) {
        this.charts.campaignEffectivenessChart.destroy();
      }
      
      // Create chart
      this.charts.campaignEffectivenessChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Sales Uplift', 'Traffic Increase', 'Basket Size', 'Conversion Rate', 'AI Engagement'],
          datasets: [
            {
              label: 'Current Campaign',
              data: [85, 92, 78, 88, 95],
              backgroundColor: this.hexToRGBA(this.config.chartColors.primary, 0.2),
              borderColor: this.config.chartColors.primary,
              borderWidth: 2,
              pointBackgroundColor: this.config.chartColors.primary,
              pointRadius: 4
            },
            {
              label: 'Previous Campaign',
              data: [65, 59, 90, 81, 56],
              backgroundColor: this.hexToRGBA(this.config.chartColors.secondary, 0.2),
              borderColor: this.config.chartColors.secondary,
              borderWidth: 2,
              pointBackgroundColor: this.config.chartColors.secondary,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              },
              suggestedMin: 30,
              suggestedMax: 100,
              ticks: {
                backdropColor: 'transparent'
              }
            }
          }
        }
      });
    }
    
    /**
     * Render voice sentiment correlation chart
     */
    renderVoiceSentimentChart() {
      const ctx = document.getElementById('voiceSentimentChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.voiceSentimentChart) {
        this.charts.voiceSentimentChart.destroy();
      }
      
      // Get voice sentiment data
      const data = this.data.voiceData;
      
      // Create chart
      this.charts.voiceSentimentChart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Positive Tone',
              data: data.positive,
              backgroundColor: this.hexToRGBA(this.config.chartColors.positive, 0.7),
              borderColor: this.config.chartColors.positive,
              pointRadius: 8,
              pointHoverRadius: 10
            },
            {
              label: 'Neutral Tone',
              data: data.neutral,
              backgroundColor: this.hexToRGBA(this.config.chartColors.neutral, 0.7),
              borderColor: this.config.chartColors.neutral,
              pointRadius: 8,
              pointHoverRadius: 10
            },
            {
              label: 'Negative Tone',
              data: data.negative,
              backgroundColor: this.hexToRGBA(this.config.chartColors.negative, 0.7),
              borderColor: this.config.chartColors.negative,
              pointRadius: 8,
              pointHoverRadius: 10
            }
          ]
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
                  const x = context.parsed.x.toFixed(1);
                  const y = context.parsed.y.toFixed(1);
                  return `${context.dataset.label}: Confidence ${x}, Purchase Rate ${y}%`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Voice Confidence Score'
              },
              min: 0,
              max: 10
            },
            y: {
              title: {
                display: true,
                text: 'Conversion Rate (%)'
              },
              min: 0,
              max: 100
            }
          }
        }
      });
    }
    
    /**
     * Render real-time pricing effect chart
     */
    renderPricingEffectChart() {
      const ctx = document.getElementById('pricingEffectChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.pricingEffectChart) {
        this.charts.pricingEffectChart.destroy();
      }
      
      // Get pricing data
      const data = this.data.pricingData;
      
      // Create chart
      this.charts.pricingEffectChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.timeLabels,
          datasets: [
            {
              label: 'Price Point ($)',
              data: data.prices,
              borderColor: this.config.chartColors.primary,
              backgroundColor: 'transparent',
              yAxisID: 'y',
              tension: 0.4
            },
            {
              label: 'Units Sold',
              data: data.units,
              borderColor: this.config.chartColors.tertiary,
              backgroundColor: this.hexToRGBA(this.config.chartColors.tertiary, 0.1),
              fill: true,
              yAxisID: 'y1',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Price ($)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Units Sold'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      });
    }
    
    /**
     * Render brand lift metrics chart
     */
    renderBrandLiftChart() {
      const ctx = document.getElementById('brandLiftChart');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.charts.brandLiftChart) {
        this.charts.brandLiftChart.destroy();
      }
      
      // Get brand lift data
      const data = this.data.brandData;
      
      // Create chart
      this.charts.brandLiftChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.metrics,
          datasets: [
            {
              label: 'Pre-Campaign',
              data: data.preCampaign,
              backgroundColor: this.config.chartColors.before
            },
            {
              label: 'Post-Campaign',
              data: data.postCampaign,
              backgroundColor: this.config.chartColors.primary
            }
          ]
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
                afterBody: function(context) {
                  const index = context[0].dataIndex;
                  const pre = data.preCampaign[index];
                  const post = data.postCampaign[index];
                  const change = ((post - pre) / pre * 100).toFixed(1);
                  return `Change: ${change}%`;
                }
              }
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
              max: 100,
              title: {
                display: true,
                text: 'Score (0-100)'
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
      // Update all charts with theme
      Object.values(this.charts).forEach(chart => {
        if (!chart.options.plugins) chart.options.plugins = {};
        if (!chart.options.plugins.legend) chart.options.plugins.legend = {};
        if (!chart.options.scales) chart.options.scales = {};
        
        // Update legend color
        chart.options.plugins.legend.labels = {
          color: isDarkMode ? '#fff' : '#666'
        };
        
        // Update scales if they exist
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks = { 
            color: isDarkMode ? '#fff' : '#666' 
          };
          chart.options.scales.x.grid = { 
            color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
          };
          if (chart.options.scales.x.title) {
            chart.options.scales.x.title.color = isDarkMode ? '#fff' : '#666';
          }
        }
        
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks = { 
            color: isDarkMode ? '#fff' : '#666' 
          };
          chart.options.scales.y.grid = { 
            color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
          };
          if (chart.options.scales.y.title) {
            chart.options.scales.y.title.color = isDarkMode ? '#fff' : '#666';
          }
        }
        
        if (chart.options.scales.y1) {
          chart.options.scales.y1.ticks = { 
            color: isDarkMode ? '#fff' : '#666' 
          };
          chart.options.scales.y1.grid = { 
            color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
          };
          if (chart.options.scales.y1.title) {
            chart.options.scales.y1.title.color = isDarkMode ? '#fff' : '#666';
          }
        }
        
        if (chart.options.scales.r) {
          chart.options.scales.r.ticks = { 
            color: isDarkMode ? '#fff' : '#666' 
          };
          chart.options.scales.r.grid = { 
            color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
          };
          chart.options.scales.r.angleLines = {
            color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          };
        }
        
        // Update chart
        chart.update();
      });
    }
    
    /**
     * Generate fake category data for demo
     */
    generateCategoryData() {
      const categories = ['Electronics', 'Clothing', 'Home Goods', 'Grocery', 'Beverages'];
      
      // Base values
      const beforeValues = [45000, 38000, 29000, 62000, 18000];
      
      // Calculate after values with uplift
      const afterValues = beforeValues.map(value => {
        const upliftPercent = Math.random() * 0.3 + 0.1; // 10-40% uplift
        return Math.round(value * (1 + upliftPercent));
      });
      
      return {
        categories,
        beforeValues,
        afterValues
      };
    }
    
    /**
     * Generate fake campaign data for demo
     */
    generateCampaignData() {
      // Would be replaced with actual API data
      return {
        id: 'campaign-301',
        name: 'Summer Sale 2025',
        startDate: '2025-05-15',
        endDate: '2025-06-30',
        status: 'active',
        metrics: {
          salesUplift: 18.7,
          trafficIncrease: 24.2,
          basketSizeGrowth: 12.3,
          aiRecommendationCTR: 82.4
        }
      };
    }
    
    /**
     * Generate fake SKU data for demo
     */
    generateSKUData() {
      // Would be replaced with actual API data
      return {
        topSKUs: [
          {
            name: 'Smart Speaker Elite X1',
            sku: 'EL-SPK-2025-X1',
            category: 'Electronics',
            price: 149.99,
            uplift: 42.8
          },
          {
            name: 'Premium Coffee Maker',
            sku: 'HG-KIT-1022-CM',
            category: 'Home Goods',
            price: 89.99,
            uplift: 35.2
          }
        ]
      };
    }
    
    /**
     * Generate fake brand data for demo
     */
    generateBrandData() {
      const metrics = ['Brand Awareness', 'Purchase Intent', 'Brand Preference', 'Recommendation Rate', 'Customer Satisfaction'];
      
      // Base values
      const preCampaign = [65, 58, 72, 60, 75];
      
      // Calculate post values with uplift
      const postCampaign = preCampaign.map(value => {
        const upliftPoints = Math.random() * 15 + 5; // 5-20 points uplift
        return Math.min(100, Math.round(value + upliftPoints));
      });
      
      return {
        metrics,
        preCampaign,
        postCampaign
      };
    }
    
    /**
     * Generate voice sentiment correlation data
     */
    generateVoiceData() {
      // Generate scatter plot data for voice sentiment to purchase correlation
      function generatePoints(count, baseX, baseY, spread) {
        const points = [];
        for (let i = 0; i < count; i++) {
          points.push({
            x: Math.max(0, Math.min(10, baseX + (Math.random() - 0.5) * spread)),
            y: Math.max(0, Math.min(100, baseY + (Math.random() - 0.5) * spread * 10))
          });
        }
        return points;
      }
      
      // Create three clusters of data points
      const positive = generatePoints(15, 8, 75, 2); // High confidence, high purchase
      const neutral = generatePoints(20, 5, 45, 3);  // Medium confidence, medium purchase
      const negative = generatePoints(12, 3, 25, 2); // Low confidence, low purchase
      
      return {
        positive,
        neutral,
        negative
      };
    }
    
    /**
     * Generate pricing effect time series data
     */
    generatePricingData() {
      // Generate time series for price changes and corresponding unit sales
      const timeLabels = [];
      const prices = [];
      const units = [];
      
      // Create 10 time periods
      for (let i = 0; i < 10; i++) {
        timeLabels.push(`Day ${i+1}`);
        
        // Price fluctuates between $45 and $55
        let price;
        if (i < 3) {
          price = 49.99; // Initial price
        } else if (i < 6) {
          price = 44.99; // Price drop
        } else if (i < 8) {
          price = 54.99; // Price increase
        } else {
          price = 49.99; // Back to initial price
        }
        
        // Units sold is generally inverse to price
        let unitsSold;
        if (i < 3) {
          unitsSold = 120 + Math.round(Math.random() * 20 - 10); // Base sales
        } else if (i < 6) {
          unitsSold = 180 + Math.round(Math.random() * 30 - 15); // Higher sales at lower price
        } else if (i < 8) {
          unitsSold = 80 + Math.round(Math.random() * 20 - 10); // Lower sales at higher price
        } else {
          unitsSold = 130 + Math.round(Math.random() * 20 - 10); // Back to slightly higher than base
        }
        
        prices.push(price);
        units.push(unitsSold);
      }
      
      return {
        timeLabels,
        prices,
        units
      };
    }
    
    /**
     * Helper to convert hex color to rgba
     */
    hexToRGBA(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  
  // Create and export the visualizer
  window.RetailPerformanceVisualizer = new RetailPerformanceVisualizer();
})();