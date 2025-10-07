/**
 * @file brand_performance.js
 * @description Brand Performance Analytics with Competitive Analysis (PRD Section 3)
 * @version v2.4.0
 */

class BrandPerformance {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.charts = {};
    this.selectedBrand = null;
    this.comparisonBrands = [];
    this.data = {
      brands: [],
      competitiveData: [],
      healthIndicators: [],
      marketShare: []
    };
    this.config = {
      maxComparisons: 4,
      chartColors: {
        primary: '#ffc300',
        secondary: '#005bbb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        competitors: ['#6366f1', '#8b5cf6', '#ec4899', '#f97316']
      }
    };
    this.init();
  }

  init() {
    this.loadBrandData();
    this.createBrandPerformanceContainer();
    this.createBrandComparison();
    this.createCompetitivePositioning();
    this.createBrandHealthIndicators();
    this.attachEventListeners();
    this.attachDrillDownListeners();
  }

  loadBrandData() {
    this.data = {
      brands: this.generateBrandData(),
      competitiveData: this.generateCompetitiveData(),
      healthIndicators: this.generateHealthIndicators(),
      marketShare: this.generateMarketShareData()
    };
  }

  generateBrandData() {
    const brands = [
      'Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Mountain Dew',
      'Nestle', 'Maggi', 'Milo', 'Nescafe', 'KitKat',
      'Unilever', 'Dove', 'Surf', 'Knorr', 'Breyers',
      'P&G', 'Tide', 'Head & Shoulders', 'Pantene', 'Olay',
      'Colgate', 'Close-Up', 'Palmolive'
    ];

    return brands.map((brand, index) => ({
      name: brand,
      id: brand.toLowerCase().replace(/\s+/g, '-'),
      category: this.getBrandCategory(brand),
      marketShare: Math.random() * 25 + 5, // 5-30%
      shareOfVoice: Math.random() * 40 + 10, // 10-50%
      sentimentRating: Math.random() * 2 + 3, // 3-5 stars
      growthTrajectory: (Math.random() - 0.5) * 20, // -10% to +10%
      totalSales: Math.floor(Math.random() * 500000) + 100000,
      customerSatisfaction: Math.random() * 30 + 70, // 70-100%
      brandStrength: Math.random() * 40 + 60, // 60-100
      pricePosition: Math.random() * 50 + 25, // 25-75 (percentile)
      qualityPerception: Math.random() * 30 + 70, // 70-100
      availability: Math.random() * 20 + 80, // 80-100%
      customerPreference: Math.random() * 100
    }));
  }

  generateCompetitiveData() {
    return this.data.brands.map(brand => ({
      brandId: brand.id,
      brandName: brand.name,
      pricePosition: brand.pricePosition,
      qualityPerception: brand.qualityPerception,
      availability: brand.availability,
      customerPreference: brand.customerPreference,
      competitiveStrength: this.calculateCompetitiveStrength(brand),
      threats: this.generateThreats(brand),
      opportunities: this.generateOpportunities(brand)
    }));
  }

  generateHealthIndicators() {
    return this.data.brands.map(brand => ({
      brandId: brand.id,
      brandName: brand.name,
      brandRecognition: Math.random() * 30 + 70, // 70-100%
      purchaseIntent: Math.random() * 40 + 40, // 40-80%
      customerLoyalty: Math.random() * 50 + 30, // 30-80%
      priceSensitivity: Math.random() * 100, // 0-100 (lower is better)
      brandEquity: Math.random() * 40 + 60, // 60-100
      trustScore: Math.random() * 35 + 65, // 65-100
      recommendationScore: Math.random() * 50 + 50 // 50-100
    }));
  }

  generateMarketShareData() {
    const categories = ['Beverages', 'Personal Care', 'Household', 'Food & Snacks'];
    return categories.map(category => {
      const categoryBrands = this.data.brands.filter(b => b.category === category);
      return {
        category,
        totalMarket: Math.floor(Math.random() * 1000000) + 500000,
        brands: categoryBrands.map(brand => ({
          name: brand.name,
          share: brand.marketShare,
          revenue: brand.totalSales,
          growth: brand.growthTrajectory
        }))
      };
    });
  }

  createBrandPerformanceContainer() {
    const container = document.getElementById('brand-performance') || this.createContainer();
    container.innerHTML = `
      <div class="brand-performance-module">
        <div class="module-header">
          <h2 class="module-title">Brand Performance Analytics</h2>
          <div class="module-controls">
            <select id="brand-selector" class="brand-selector">
              <option value="">Select Primary Brand</option>
              ${this.data.brands.map(brand => `
                <option value="${brand.id}">${brand.name}</option>
              `).join('')}
            </select>
            <button id="compare-brands" class="btn btn-sm btn-outline">Compare Brands</button>
            <button id="export-brand-data" class="btn btn-sm btn-primary">Export</button>
          </div>
        </div>
        
        <div class="brand-tabs">
          <button class="brand-tab-btn active" data-tab="comparison">Brand Comparison</button>
          <button class="brand-tab-btn" data-tab="positioning">Competitive Positioning</button>
          <button class="brand-tab-btn" data-tab="health">Brand Health</button>
        </div>
        
        <div class="brand-tab-content">
          <div id="comparison-tab" class="brand-tab-panel active">
            <div class="brand-comparison-section"></div>
          </div>
          
          <div id="positioning-tab" class="brand-tab-panel">
            <div class="competitive-positioning-section"></div>
          </div>
          
          <div id="health-tab" class="brand-tab-panel">
            <div class="brand-health-section"></div>
          </div>
        </div>
      </div>
    `;
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'brand-performance';
    container.className = 'brand-performance-container';
    
    // Insert after transaction analytics or KPI section
    const insertAfter = document.querySelector('#transaction-analytics, .kpi-section, .metrics-overview');
    if (insertAfter) {
      insertAfter.after(container);
    } else {
      document.querySelector('.dashboard-container').appendChild(container);
    }
    
    return container;
  }

  createBrandComparison() {
    const container = document.querySelector('.brand-comparison-section');
    container.innerHTML = `
      <div class="brand-comparison">
        <div class="comparison-controls">
          <h3>Brand Comparison Analysis</h3>
          <div class="brand-selection">
            <div class="selected-brands" id="selected-brands">
              <div class="no-selection">Select brands to compare</div>
            </div>
            <div class="brand-grid">
              ${this.data.brands.map(brand => `
                <label class="brand-checkbox-item">
                  <input type="checkbox" value="${brand.id}" class="brand-compare-checkbox" data-brand-name="${brand.name}">
                  <span class="brand-name">${brand.name}</span>
                  <span class="brand-category">${brand.category}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="comparison-results" id="comparison-results" style="display: none;">
          <div class="comparison-metrics">
            <div class="metric-comparison-grid">
              <div class="comparison-chart">
                <canvas id="market-share-comparison"></canvas>
              </div>
              <div class="comparison-chart">
                <canvas id="growth-comparison"></canvas>
              </div>
              <div class="comparison-chart">
                <canvas id="sentiment-comparison"></canvas>
              </div>
              <div class="comparison-chart">
                <canvas id="share-of-voice-comparison"></canvas>
              </div>
            </div>
          </div>
          
          <div class="comparison-table">
            <table class="brand-metrics-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Market Share</th>
                  <th>Share of Voice</th>
                  <th>Sentiment</th>
                  <th>Growth</th>
                  <th>Customer Satisfaction</th>
                </tr>
              </thead>
              <tbody id="brand-comparison-table">
                <!-- Dynamic content -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  createCompetitivePositioning() {
    const container = document.querySelector('.competitive-positioning-section');
    container.innerHTML = `
      <div class="competitive-positioning">
        <div class="positioning-header">
          <h3>Competitive Positioning Matrix</h3>
          <div class="axis-controls">
            <select id="x-axis-metric">
              <option value="pricePosition">Price Position</option>
              <option value="qualityPerception">Quality Perception</option>
              <option value="availability">Availability</option>
              <option value="customerPreference">Customer Preference</option>
            </select>
            <span>vs</span>
            <select id="y-axis-metric">
              <option value="qualityPerception">Quality Perception</option>
              <option value="pricePosition">Price Position</option>
              <option value="availability">Availability</option>
              <option value="customerPreference">Customer Preference</option>
            </select>
          </div>
        </div>
        
        <div class="positioning-content">
          <div class="positioning-chart">
            <canvas id="positioning-scatter-chart"></canvas>
          </div>
          
          <div class="positioning-insights">
            <h4>Competitive Insights</h4>
            <div class="insight-list" id="positioning-insights">
              <!-- Dynamic insights -->
            </div>
          </div>
        </div>
        
        <div class="competitive-analysis">
          <div class="threat-analysis">
            <h4>Competitive Threats</h4>
            <div id="threat-list" class="analysis-list">
              <!-- Dynamic threats -->
            </div>
          </div>
          
          <div class="opportunity-analysis">
            <h4>Market Opportunities</h4>
            <div id="opportunity-list" class="analysis-list">
              <!-- Dynamic opportunities -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.createPositioningChart();
    this.populateCompetitiveAnalysis();
  }

  createBrandHealthIndicators() {
    const container = document.querySelector('.brand-health-section');
    container.innerHTML = `
      <div class="brand-health">
        <div class="health-header">
          <h3>TBWA Brand Health Framework</h3>
          <p class="framework-description">Comprehensive brand health assessment using TBWA's proprietary metrics</p>
        </div>
        
        <div class="health-dashboard">
          <div class="health-selector">
            <select id="health-brand-selector">
              <option value="">Select Brand for Health Analysis</option>
              ${this.data.brands.map(brand => `
                <option value="${brand.id}">${brand.name}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="health-metrics" id="health-metrics" style="display: none;">
            <div class="health-score-card">
              <div class="overall-health-score">
                <div class="score-circle" id="overall-health-circle">
                  <span class="score-value" id="overall-health-value">--</span>
                  <span class="score-label">Overall Health</span>
                </div>
              </div>
              
              <div class="health-components">
                <div class="health-component">
                  <div class="component-name">Brand Recognition</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="recognition-bar"></div>
                    <span class="bar-value" id="recognition-value">--</span>
                  </div>
                </div>
                
                <div class="health-component">
                  <div class="component-name">Purchase Intent</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="intent-bar"></div>
                    <span class="bar-value" id="intent-value">--</span>
                  </div>
                </div>
                
                <div class="health-component">
                  <div class="component-name">Customer Loyalty</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="loyalty-bar"></div>
                    <span class="bar-value" id="loyalty-value">--</span>
                  </div>
                </div>
                
                <div class="health-component">
                  <div class="component-name">Brand Equity</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="equity-bar"></div>
                    <span class="bar-value" id="equity-value">--</span>
                  </div>
                </div>
                
                <div class="health-component">
                  <div class="component-name">Trust Score</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="trust-bar"></div>
                    <span class="bar-value" id="trust-value">--</span>
                  </div>
                </div>
                
                <div class="health-component">
                  <div class="component-name">Recommendation Score</div>
                  <div class="component-bar">
                    <div class="bar-fill" id="recommendation-bar"></div>
                    <span class="bar-value" id="recommendation-value">--</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="health-trends">
              <canvas id="health-trends-chart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="health-recommendations" id="health-recommendations">
          <!-- Dynamic recommendations -->
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Brand selector
    document.getElementById('brand-selector')?.addEventListener('change', (e) => {
      this.selectedBrand = e.target.value;
      this.updateBrandAnalysis();
    });

    // Brand comparison checkboxes
    document.querySelectorAll('.brand-compare-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleBrandSelection(e);
      });
    });

    // Tab switching
    document.querySelectorAll('.brand-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchBrandTab(e.target.dataset.tab);
      });
    });

    // Health brand selector
    document.getElementById('health-brand-selector')?.addEventListener('change', (e) => {
      this.updateBrandHealth(e.target.value);
    });

    // Positioning chart controls
    document.getElementById('x-axis-metric')?.addEventListener('change', () => {
      this.updatePositioningChart();
    });
    
    document.getElementById('y-axis-metric')?.addEventListener('change', () => {
      this.updatePositioningChart();
    });

    // Export button
    document.getElementById('export-brand-data')?.addEventListener('click', () => {
      this.exportBrandData();
    });
  }

  attachDrillDownListeners() {
    // Listen for clicks on brand KPI tiles to trigger drill-down
    document.addEventListener('click', (e) => {
      if (e.target.closest('.kpi-tile[data-metric="brand"]')) {
        this.triggerBrandDrillDown();
      }
    });
  }

  triggerBrandDrillDown() {
    // Show brand performance module
    const container = document.getElementById('brand-performance');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
      container.classList.add('highlighted');
      setTimeout(() => {
        container.classList.remove('highlighted');
      }, 3000);
    }
  }

  handleBrandSelection(event) {
    const checkbox = event.target;
    const brandId = checkbox.value;
    const brandName = checkbox.dataset.brandName;

    if (checkbox.checked) {
      if (this.comparisonBrands.length >= this.config.maxComparisons) {
        checkbox.checked = false;
        alert(`Maximum ${this.config.maxComparisons} brands can be compared at once`);
        return;
      }
      this.comparisonBrands.push({ id: brandId, name: brandName });
    } else {
      this.comparisonBrands = this.comparisonBrands.filter(brand => brand.id !== brandId);
    }

    this.updateSelectedBrands();
    this.updateBrandComparison();
  }

  updateSelectedBrands() {
    const container = document.getElementById('selected-brands');
    if (this.comparisonBrands.length === 0) {
      container.innerHTML = '<div class="no-selection">Select brands to compare</div>';
    } else {
      container.innerHTML = this.comparisonBrands.map(brand => `
        <span class="selected-brand-tag">
          ${brand.name}
          <button class="remove-brand" data-brand-id="${brand.id}">×</button>
        </span>
      `).join('');
      
      // Attach remove listeners
      container.querySelectorAll('.remove-brand').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const brandId = e.target.dataset.brandId;
          document.querySelector(`.brand-compare-checkbox[value="${brandId}"]`).checked = false;
          this.comparisonBrands = this.comparisonBrands.filter(brand => brand.id !== brandId);
          this.updateSelectedBrands();
          this.updateBrandComparison();
        });
      });
    }
  }

  updateBrandComparison() {
    const resultsContainer = document.getElementById('comparison-results');
    if (this.comparisonBrands.length < 2) {
      resultsContainer.style.display = 'none';
      return;
    }

    resultsContainer.style.display = 'block';
    this.createComparisonCharts();
    this.populateComparisonTable();
  }

  createComparisonCharts() {
    const selectedBrands = this.comparisonBrands.map(cb => 
      this.data.brands.find(b => b.id === cb.id)
    ).filter(Boolean);

    // Market Share Comparison
    this.createMarketShareChart(selectedBrands);
    
    // Growth Comparison
    this.createGrowthChart(selectedBrands);
    
    // Sentiment Comparison
    this.createSentimentChart(selectedBrands);
    
    // Share of Voice Comparison
    this.createShareOfVoiceChart(selectedBrands);
  }

  createMarketShareChart(brands) {
    const ctx = document.getElementById('market-share-comparison').getContext('2d');
    if (this.charts.marketShareComparison) {
      this.charts.marketShareComparison.destroy();
    }
    
    this.charts.marketShareComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: brands.map(b => b.name),
        datasets: [{
          label: 'Market Share (%)',
          data: brands.map(b => b.marketShare),
          backgroundColor: this.config.chartColors.competitors.slice(0, brands.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Market Share Comparison'
          }
        }
      }
    });
  }

  switchBrandTab(tabName) {
    document.querySelectorAll('.brand-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.brand-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });
  }

  getBrandCategory(brandName) {
    const categoryMap = {
      'Coca-Cola': 'Beverages', 'Pepsi': 'Beverages', 'Sprite': 'Beverages', 'Fanta': 'Beverages', 'Mountain Dew': 'Beverages',
      'Nestle': 'Food & Snacks', 'Maggi': 'Food & Snacks', 'Milo': 'Beverages', 'Nescafe': 'Beverages', 'KitKat': 'Food & Snacks',
      'Unilever': 'Personal Care', 'Dove': 'Personal Care', 'Surf': 'Household', 'Knorr': 'Food & Snacks', 'Breyers': 'Food & Snacks',
      'P&G': 'Personal Care', 'Tide': 'Household', 'Head & Shoulders': 'Personal Care', 'Pantene': 'Personal Care', 'Olay': 'Personal Care',
      'Colgate': 'Personal Care', 'Close-Up': 'Personal Care', 'Palmolive': 'Personal Care'
    };
    return categoryMap[brandName] || 'Other';
  }

  calculateCompetitiveStrength(brand) {
    return (brand.marketShare + brand.customerSatisfaction + brand.brandStrength) / 3;
  }

  generateThreats(brand) {
    const threats = [
      'Strong competitor price reduction',
      'New product launch in category',
      'Declining brand perception',
      'Supply chain disruption',
      'Regulatory changes',
      'Market saturation'
    ];
    return threats.sort(() => 0.5 - Math.random()).slice(0, 2);
  }

  generateOpportunities(brand) {
    const opportunities = [
      'Untapped market segments',
      'Digital marketing expansion',
      'Product line extension',
      'Partnership opportunities',
      'Geographic expansion',
      'Premium positioning'
    ];
    return opportunities.sort(() => 0.5 - Math.random()).slice(0, 2);
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.BrandPerformance = BrandPerformance;
}

export default BrandPerformance;