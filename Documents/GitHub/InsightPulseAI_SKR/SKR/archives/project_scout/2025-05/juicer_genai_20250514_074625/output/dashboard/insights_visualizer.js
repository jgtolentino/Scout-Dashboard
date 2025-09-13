/**
 * Juicer Insights Visualizer
 * 
 * This module handles the visualization of GenAI-generated insights from
 * the Juicer platform, creating rich interactive charts and dashboards.
 * 
 * @author InsightPulseAI Team
 * @version 1.0
 */

(function() {
  'use strict';
  
  /**
   * Configuration object for the insights visualizer
   */
  const config = {
    apiEndpoint: '/api/insights',
    refreshInterval: 60000, // 1 minute
    defaultTimeRange: '30d',
    defaultConfidence: 0.7,
    chartColors: {
      primary: '#ff3300',
      secondary: '#002b49',
      general: '#8a4fff',
      brand: '#00a3e0',
      sentiment: '#ff7e47',
      trend: '#00c389'
    }
  };
  
  /**
   * InsightsVisualizer class handles all dashboard functionality
   */
  class InsightsVisualizer {
    constructor(options = {}) {
      // Merge default config with options
      this.config = {...config, ...options};
      this.charts = {};
      this.data = {
        insights: [],
        brands: [],
        tags: [],
        timeRange: this.config.defaultTimeRange
      };
      
      // Initialize dashboard when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
    
    /**
     * Initialize the dashboard
     */
    init() {
      console.log('Initializing InsightsVisualizer...');
      this.bindUIEvents();
      this.loadData();
      
      // Set up automatic refresh
      this.refreshInterval = setInterval(() => {
        this.refreshData();
      }, this.config.refreshInterval);
    }
    
    /**
     * Bind UI event handlers
     */
    bindUIEvents() {
      // Filter controls
      const timeRangeSelect = document.getElementById('timeRange');
      if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
          this.data.timeRange = timeRangeSelect.value + 'd';
          this.loadData();
        });
      }
      
      const brandFilter = document.getElementById('brandFilter');
      if (brandFilter) {
        brandFilter.addEventListener('change', () => {
          this.filterInsights();
        });
      }
      
      const insightTypeFilter = document.getElementById('insightType');
      if (insightTypeFilter) {
        insightTypeFilter.addEventListener('change', () => {
          this.filterInsights();
        });
      }
      
      const confidenceFilter = document.getElementById('confidenceFilter');
      if (confidenceFilter) {
        confidenceFilter.addEventListener('change', () => {
          this.filterInsights();
        });
      }
      
      // Dark mode toggle
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
          document.body.classList.toggle('dark-mode', darkModeToggle.checked);
          this.updateChartsTheme(darkModeToggle.checked);
        });
      }
      
      // Refresh button
      const refreshBtn = document.querySelector('.btn-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.refreshData();
        });
      }
      
      // Load more button
      const loadMoreBtn = document.querySelector('.btn-load-more');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          this.loadMoreInsights();
        });
      }
    }
    
    /**
     * Load initial data from API
     */
    loadData() {
      this.showLoading(true);
      
      // In a real implementation, this would make an API call
      // Here we simulate an API call with a timeout
      setTimeout(() => {
        this.simulateDataLoad();
        this.showLoading(false);
      }, 1000);
    }
    
    /**
     * Simulate data loading (for demo purposes)
     */
    simulateDataLoad() {
      // Simulate fetching insights data
      fetch(this.config.apiEndpoint + '?time_range=' + this.data.timeRange)
        .then(response => {
          // For demo, we'll just use the sample data
          this.data.insights = this.getSampleInsights();
          this.data.brands = this.extractBrands(this.data.insights);
          this.data.tags = this.extractTags(this.data.insights);
          
          // Update the dashboard
          this.updateStats();
          this.renderCharts();
          this.renderTagCloud();
          this.renderInsightCards();
        })
        .catch(error => {
          console.error('Error fetching insights:', error);
          // For demo, still load sample data
          this.data.insights = this.getSampleInsights();
          this.data.brands = this.extractBrands(this.data.insights);
          this.data.tags = this.extractTags(this.data.insights);
          
          this.updateStats();
          this.renderCharts();
          this.renderTagCloud();
          this.renderInsightCards();
        });
    }
    
    /**
     * Refresh data from API
     */
    refreshData() {
      console.log('Refreshing data...');
      const refreshBtn = document.querySelector('.btn-refresh');
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Refreshing...';
      }
      
      // In a real implementation, this would make an API call
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
      const loadingIndicators = document.querySelectorAll('.loading-indicator');
      loadingIndicators.forEach(indicator => {
        indicator.style.display = isLoading ? 'block' : 'none';
      });
      
      const contentElements = document.querySelectorAll('.content-container');
      contentElements.forEach(element => {
        element.style.opacity = isLoading ? '0.5' : '1';
      });
    }
    
    /**
     * Update dashboard statistics
     */
    updateStats() {
      // Update insight counts
      const totalInsights = this.data.insights.length;
      const brandInsights = this.data.insights.filter(i => i.insight_type === 'brand').length;
      const sentimentInsights = this.data.insights.filter(i => i.insight_type === 'sentiment').length;
      const averageConfidence = this.calculateAverageConfidence();
      
      // Update DOM elements
      const totalElement = document.querySelector('.total-insights');
      if (totalElement) totalElement.textContent = totalInsights;
      
      const brandElement = document.querySelector('.brand-insights');
      if (brandElement) brandElement.textContent = brandInsights;
      
      const sentimentElement = document.querySelector('.sentiment-insights');
      if (sentimentElement) sentimentElement.textContent = sentimentInsights;
      
      const confidenceElement = document.querySelector('.average-confidence');
      if (confidenceElement) confidenceElement.textContent = averageConfidence + '%';
    }
    
    /**
     * Calculate average confidence across all insights
     */
    calculateAverageConfidence() {
      if (this.data.insights.length === 0) return 0;
      
      const sum = this.data.insights.reduce((acc, insight) => {
        return acc + insight.confidence_score;
      }, 0);
      
      return Math.round((sum / this.data.insights.length) * 100);
    }
    
    /**
     * Render all dashboard charts
     */
    renderCharts() {
      this.renderBrandChart();
      this.renderSentimentChart();
    }
    
    /**
     * Render brand insights chart
     */
    renderBrandChart() {
      const ctx = document.getElementById('brandInsightsChart');
      if (!ctx) return;
      
      // Process data for chart
      const brandData = this.processBrandChartData();
      
      // Destroy existing chart if it exists
      if (this.charts.brandChart) {
        this.charts.brandChart.destroy();
      }
      
      // Create new chart
      this.charts.brandChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: brandData.labels,
          datasets: [
            {
              label: 'Insight Count',
              data: brandData.counts,
              backgroundColor: this.config.chartColors.brand,
              borderWidth: 0
            },
            {
              label: 'Avg. Confidence (%)',
              data: brandData.confidences,
              backgroundColor: this.config.chartColors.primary,
              borderWidth: 0,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Insights'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Confidence %'
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
     * Process data for brand chart
     */
    processBrandChartData() {
      const brandCounts = {};
      const brandConfidences = {};
      
      // Count insights and sum confidences by brand
      this.data.insights.forEach(insight => {
        if (insight.brands_mentioned && insight.brands_mentioned.length > 0) {
          insight.brands_mentioned.forEach(brand => {
            if (!brandCounts[brand]) {
              brandCounts[brand] = 0;
              brandConfidences[brand] = 0;
            }
            
            brandCounts[brand]++;
            brandConfidences[brand] += insight.confidence_score;
          });
        }
      });
      
      // Calculate average confidence for each brand
      Object.keys(brandConfidences).forEach(brand => {
        brandConfidences[brand] = Math.round((brandConfidences[brand] / brandCounts[brand]) * 100);
      });
      
      // Sort brands by count
      const sortedBrands = Object.keys(brandCounts).sort((a, b) => {
        return brandCounts[b] - brandCounts[a];
      });
      
      // Limit to top 6 brands
      const topBrands = sortedBrands.slice(0, 6);
      
      // Prepare data for chart
      return {
        labels: topBrands,
        counts: topBrands.map(brand => brandCounts[brand]),
        confidences: topBrands.map(brand => brandConfidences[brand])
      };
    }
    
    /**
     * Render sentiment trends chart
     */
    renderSentimentChart() {
      const ctx = document.getElementById('sentimentTrendsChart');
      if (!ctx) return;
      
      // Process data for chart
      const sentimentData = this.processSentimentChartData();
      
      // Destroy existing chart if it exists
      if (this.charts.sentimentChart) {
        this.charts.sentimentChart.destroy();
      }
      
      // Create new chart
      this.charts.sentimentChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sentimentData.weeks,
          datasets: sentimentData.datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Sentiment Score (%)'
              }
            }
          }
        }
      });
    }
    
    /**
     * Process data for sentiment chart
     */
    processSentimentChartData() {
      // In a real implementation, this would use real time-series data
      // For demo purposes, we'll create simulated data
      
      // Get top 3 brands
      const topBrands = this.data.brands.slice(0, 3);
      
      // Define time periods (last 4 weeks)
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      
      // Create datasets for each top brand
      const brandColors = [
        this.config.chartColors.primary,
        this.config.chartColors.brand,
        this.config.chartColors.sentiment
      ];
      
      const datasets = topBrands.map((brand, index) => {
        // Generate slightly increasing trend with some randomness
        const baseScore = 65 + Math.floor(Math.random() * 10);
        const data = weeks.map((_, i) => {
          return baseScore + (i * 2) + Math.floor(Math.random() * 5);
        });
        
        return {
          label: brand,
          data: data,
          borderColor: brandColors[index],
          backgroundColor: this.hexToRGBA(brandColors[index], 0.1),
          tension: 0.4,
          fill: true
        };
      });
      
      return {
        weeks,
        datasets
      };
    }
    
    /**
     * Render tag cloud visualization
     */
    renderTagCloud() {
      const tagCloudContainer = document.getElementById('tagCloud');
      if (!tagCloudContainer) return;
      
      // Clear existing content
      tagCloudContainer.innerHTML = '';
      
      // Get tag frequencies
      const tagFrequencies = {};
      this.data.tags.forEach(tag => {
        if (!tagFrequencies[tag]) {
          tagFrequencies[tag] = 0;
        }
        tagFrequencies[tag]++;
      });
      
      // Sort tags by frequency
      const sortedTags = Object.keys(tagFrequencies).sort((a, b) => {
        return tagFrequencies[b] - tagFrequencies[a];
      });
      
      // Limit to top 15 tags
      const topTags = sortedTags.slice(0, 15);
      
      // Calculate font sizes (min 0.9rem, max 1.5rem)
      const maxFreq = Math.max(...Object.values(tagFrequencies));
      const minFreq = Math.min(...Object.values(tagFrequencies));
      const fontSizeRange = 0.6; // 1.5 - 0.9
      
      // Create and append tag elements
      topTags.forEach(tag => {
        const frequency = tagFrequencies[tag];
        
        // Calculate font size
        let fontSize = 0.9;
        if (maxFreq !== minFreq) {
          const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
          fontSize = 0.9 + normalizedFreq * fontSizeRange;
        }
        
        // Create tag element
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.style.fontSize = `${fontSize}rem`;
        
        tagCloudContainer.appendChild(tagElement);
      });
    }
    
    /**
     * Render insight cards in the dashboard
     */
    renderInsightCards() {
      const insightsContainer = document.getElementById('insightsContainer');
      if (!insightsContainer) return;
      
      // For demo, we'll keep the existing HTML cards
      // In a real implementation, this would dynamically generate cards
      console.log('Rendering insight cards...');
    }
    
    /**
     * Filter insights based on current filter settings
     */
    filterInsights() {
      // Get filter values
      const brandFilter = document.getElementById('brandFilter').value;
      const typeFilter = document.getElementById('insightType').value;
      const confidenceFilter = parseFloat(document.getElementById('confidenceFilter').value);
      
      // Apply filters to data
      const filteredInsights = this.data.insights.filter(insight => {
        // Brand filter
        if (brandFilter !== 'all') {
          if (!insight.brands_mentioned || !insight.brands_mentioned.includes(brandFilter)) {
            return false;
          }
        }
        
        // Type filter
        if (typeFilter !== 'all' && insight.insight_type !== typeFilter) {
          return false;
        }
        
        // Confidence filter
        if (insight.confidence_score < confidenceFilter) {
          return false;
        }
        
        return true;
      });
      
      // Update the dashboard with filtered data
      console.log(`Filtered insights: ${filteredInsights.length} of ${this.data.insights.length}`);
      
      // In a real implementation, this would update the dashboard with filtered data
      // For demo, we'll just log the number of filtered insights
    }
    
    /**
     * Load more insights (pagination)
     */
    loadMoreInsights() {
      console.log('Loading more insights...');
      
      // In a real implementation, this would fetch the next page of insights
      // For demo, we'll just log a message
    }
    
    /**
     * Update charts theme based on dark mode setting
     */
    updateChartsTheme(isDarkMode) {
      // Update chart themes based on dark mode
      Object.values(this.charts).forEach(chart => {
        chart.options.plugins.legend.labels.color = isDarkMode ? '#fff' : '#666';
        chart.options.scales.x.ticks.color = isDarkMode ? '#fff' : '#666';
        chart.options.scales.y.ticks.color = isDarkMode ? '#fff' : '#666';
        chart.options.scales.y.grid.color = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        chart.options.scales.x.grid.color = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        
        if (chart.options.scales.y1) {
          chart.options.scales.y1.ticks.color = isDarkMode ? '#fff' : '#666';
        }
        
        chart.update();
      });
    }
    
    /**
     * Helper method to extract all brands from insights
     */
    extractBrands(insights) {
      const allBrands = new Set();
      
      insights.forEach(insight => {
        if (insight.brands_mentioned && Array.isArray(insight.brands_mentioned)) {
          insight.brands_mentioned.forEach(brand => {
            allBrands.add(brand);
          });
        }
      });
      
      return Array.from(allBrands);
    }
    
    /**
     * Helper method to extract all tags from insights
     */
    extractTags(insights) {
      const allTags = [];
      
      insights.forEach(insight => {
        if (insight.summary_tags && Array.isArray(insight.summary_tags)) {
          allTags.push(...insight.summary_tags);
        }
      });
      
      return allTags;
    }
    
    /**
     * Helper method to convert hex color to rgba
     */
    hexToRGBA(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * Get sample insights data for demo purposes
     */
    getSampleInsights() {
      // Sample data - in a real implementation, this would come from the API
      return [
        {
          insight_id: 'ins_001',
          insight_type: 'general',
          insight_title: 'Increasing focus on value meals across all demographics',
          insight_text: 'Analysis of 327 transcripts reveals that 64% of customers mention value when discussing meal options. This represents an increasing trend compared to previous periods.',
          confidence_score: 0.85,
          brands_mentioned: ['Jollibee', 'McDonald\'s', 'KFC'],
          summary_tags: ['pricing', 'value', 'economy', 'family'],
          generated_by: 'claude',
          processing_timestamp: '2025-05-02T10:30:00Z'
        },
        {
          insight_id: 'ins_002',
          insight_type: 'brand',
          insight_title: 'Brand loyalty stronger for customers using rewards programs',
          insight_text: 'Data from recent interactions shows Jollibee is frequently associated with loyalty programs, with 78% of mentions having positive sentiment.',
          confidence_score: 0.92,
          brands_mentioned: ['Jollibee'],
          summary_tags: ['loyalty', 'rewards', 'app', 'repeat'],
          generated_by: 'openai',
          processing_timestamp: '2025-05-03T14:45:00Z'
        },
        {
          insight_id: 'ins_003',
          insight_type: 'sentiment',
          insight_title: 'Positive sentiment toward expanded vegetarian options',
          insight_text: 'A recurring theme in 32% of analyzed conversations is the connection between vegetarian menu options and positive sentiment.',
          confidence_score: 0.76,
          brands_mentioned: ['KFC', 'Burger King'],
          summary_tags: ['vegetarian', 'health', 'menu', 'alternatives'],
          generated_by: 'claude',
          processing_timestamp: '2025-05-05T09:15:00Z'
        },
        {
          insight_id: 'ins_004',
          insight_type: 'trend',
          insight_title: 'Rising preference for breakfast items throughout the day',
          insight_text: 'Analysis of 215 transcripts reveals a growing customer demand for breakfast items to be available throughout the day, with 47% of customers expressing this preference.',
          confidence_score: 0.88,
          brands_mentioned: ['McDonald\'s', 'Jollibee', 'Wendy\'s'],
          summary_tags: ['breakfast', 'all-day', 'menu', 'convenience'],
          generated_by: 'deepseek',
          processing_timestamp: '2025-05-04T16:20:00Z'
        }
      ];
    }
  }
  
  // Export to global scope
  window.InsightsVisualizer = InsightsVisualizer;
})();