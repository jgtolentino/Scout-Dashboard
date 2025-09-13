/**
 * AI Insights Component for Client360 Dashboard
 * This component renders AI-generated insights in the dashboard
 */

// Configuration
const AI_INSIGHTS_ENABLED = true;
const AI_INSIGHTS_ENDPOINT = './data/ai/insights/all_insights_latest.json';
const SYNTHETIC_DATA_ENABLED = true;

// Initialize the AI insights component
function initAIInsights() {
  console.log('Initializing AI Insights component...');
  
  // Create container elements if they don't exist
  createInsightContainers();
  
  // Load insights data
  loadInsightsData();
}

// Create insight container elements
function createInsightContainers() {
  // Store Performance section
  const storePerformanceSection = document.querySelector('.store-performance-section');
  if (storePerformanceSection) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'sales-insights-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Sales Insights</h3><div class="insights-content"></div>';
    storePerformanceSection.appendChild(insightsContainer);
  }
  
  // Brand Analysis section
  const brandAnalysisSection = document.querySelector('.brand-analysis-section');
  if (brandAnalysisSection) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'brand-insights-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Brand Insights</h3><div class="insights-content"></div>';
    brandAnalysisSection.appendChild(insightsContainer);
  }
  
  // Recommendations panel
  const sidePanel = document.querySelector('.dashboard-side-panel');
  if (sidePanel) {
    const insightsContainer = document.createElement('div');
    insightsContainer.id = 'recommendations-container';
    insightsContainer.className = 'insights-container';
    insightsContainer.innerHTML = '<h3>AI Recommendations</h3><div class="insights-content"></div>';
    sidePanel.appendChild(insightsContainer);
  }
}

// Load insights data from endpoint
function loadInsightsData() {
  if (!AI_INSIGHTS_ENABLED) {
    console.log('AI Insights are disabled.');
    return;
  }
  
  fetch(AI_INSIGHTS_ENDPOINT)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load AI insights data');
      }
      return response.json();
    })
    .then(data => {
      console.log('AI insights data loaded:', data.length, 'insights');
      
      // Filter insights by type and synthetic status
      const salesInsights = data.filter(insight => 
        insight.category === 'sales_insights' && 
        (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
      );
      
      const brandInsights = data.filter(insight => 
        insight.category === 'brand_analysis' && 
        (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
      );
      
      const recommendations = data.filter(insight => 
        insight.category === 'store_recommendations' && 
        (SYNTHETIC_DATA_ENABLED || !insight.isSynthetic)
      );
      
      // Render insights
      renderSalesInsights(salesInsights);
      renderBrandInsights(brandInsights);
      renderRecommendations(recommendations);
    })
    .catch(error => {
      console.error('Error loading AI insights:', error);
      
      // Show fallback content
      showFallbackContent();
    });
}

// Render sales insights
function renderSalesInsights(insights) {
  const container = document.querySelector('#sales-insights-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No sales insights available.</p>';
    return;
  }
  
  // Take most recent insight
  const insight = insights[0];
  
  container.innerHTML = `
    <div class="insight-card">
      <div class="insight-header">
        <h4>${insight.title}</h4>
        <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
      </div>
      <p class="insight-summary">${insight.summary}</p>
      <div class="insight-details">
        <div class="insight-generated">Generated: ${new Date(insight.GeneratedAt).toLocaleString()}</div>
      </div>
    </div>
  `;
}

// Render brand insights
function renderBrandInsights(insights) {
  const container = document.querySelector('#brand-insights-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No brand insights available.</p>';
    return;
  }
  
  let html = '';
  
  // Take up to 3 most recent insights
  insights.slice(0, 3).forEach(insight => {
    html += `
      <div class="insight-card">
        <div class="insight-header">
          <h4>${insight.title}</h4>
          <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
        </div>
        <p class="insight-summary">${insight.summary}</p>
        <div class="insight-details">
          <div class="insight-generated">Generated: ${new Date(insight.GeneratedAt).toLocaleString()}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Render recommendations
function renderRecommendations(insights) {
  const container = document.querySelector('#recommendations-container .insights-content');
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<p class="no-insights">No recommendations available.</p>';
    return;
  }
  
  let html = '';
  
  // Take up to 5 most recent recommendations
  insights.slice(0, 5).forEach(insight => {
    html += `
      <div class="insight-card">
        <div class="insight-header">
          <h4>${insight.title}</h4>
          <span class="insight-badge ${insight.dataSource.toLowerCase()}">${insight.dataSource}</span>
        </div>
        <p class="insight-summary">${insight.summary}</p>
        <div class="insight-details">
          <div class="insight-priority">Priority: ${insight.content.priority || 'Medium'}</div>
          <div class="insight-generated">Generated: ${new Date(insight.GeneratedAt).toLocaleString()}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Show fallback content when insights can't be loaded
function showFallbackContent() {
  const containers = document.querySelectorAll('.insights-container .insights-content');
  
  containers.forEach(container => {
    container.innerHTML = `
      <div class="insight-card fallback">
        <div class="insight-header">
          <h4>AI Insights Unavailable</h4>
        </div>
        <p class="insight-summary">AI-generated insights are currently unavailable. Please check your configuration or try again later.</p>
      </div>
    `;
  });
}

// Add CSS styles for AI insights
function addInsightsStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .insights-container {
      margin: 15px 0;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    
    .insights-container h3 {
      margin-top: 0;
      font-size: 16px;
      color: #333;
    }
    
    .insight-card {
      margin-bottom: 10px;
      padding: 12px;
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .insight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .insight-header h4 {
      margin: 0;
      font-size: 14px;
      color: #333;
    }
    
    .insight-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .insight-badge.synthetic {
      background-color: #e9f5ff;
      color: #0078d4;
    }
    
    .insight-badge.real {
      background-color: #dff6dd;
      color: #107c10;
    }
    
    .insight-summary {
      margin: 8px 0;
      font-size: 13px;
      color: #555;
    }
    
    .insight-details {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #777;
    }
    
    .no-insights {
      font-style: italic;
      color: #777;
      text-align: center;
    }
    
    .insight-card.fallback {
      background-color: #f9f9f9;
      border: 1px dashed #ddd;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
  addInsightsStyles();
  initAIInsights();
});
