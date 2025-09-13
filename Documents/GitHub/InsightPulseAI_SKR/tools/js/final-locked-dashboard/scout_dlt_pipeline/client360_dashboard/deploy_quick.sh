#!/bin/bash
# deploy_quick.sh - Simplified deployment script for Client360 Dashboard with AI Integration
# This is a modified version of deploy_with_ai.sh that skips time-consuming verification steps

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="logs"
LOG_FILE="${LOG_DIR}/deployment_${TIMESTAMP}.log"
BACKUP_DIR="client360_dashboard_${TIMESTAMP}"
OUTPUT_DIR="output"
AI_DIR="data"
AI_SCRIPTS_DIR="${AI_DIR}/scripts"
DEPLOY_DIR="deploy"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$OUTPUT_DIR"

# Log function
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

log "Starting Client360 Dashboard deployment with AI integration (quick mode)..."

# Create backup of the current deployment
log "Creating backup of current deployment..."
if [ -d "$DEPLOY_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR" 2>/dev/null || true
  log "Backup created in $BACKUP_DIR"
else
  log "Creating new deployment directory..."
  mkdir -p "$DEPLOY_DIR"
fi

# Set up AI directories
log "Setting up AI directories..."

# Create AI directories in deployment
mkdir -p "${DEPLOY_DIR}/data/ai/prompts"
mkdir -p "${DEPLOY_DIR}/data/ai/output"
mkdir -p "${DEPLOY_DIR}/data/ai/scripts"
mkdir -p "${DEPLOY_DIR}/data/ai/insights"

# Create a simple synthetic insights file
log "Creating sample synthetic insights JSON..."
cat > "${DEPLOY_DIR}/data/ai/insights/all_insights_latest.json" << 'EOL'
[
  {
    "category": "sales_insights",
    "InsightID": "SIM-INSIGHT-12345678",
    "entityID": "SIM-STORE-0001",
    "entityName": "Sari-Sari Store 1",
    "region": "National Capital Region",
    "cityMunicipality": "Manila",
    "GeneratedAt": "2025-05-21T12:34:56.789Z",
    "title": "Beverage Sales Growth Opportunity",
    "summary": "Beverages show strong growth potential with 15% higher margins than category average.",
    "content": {
      "title": "Beverage Sales Growth Opportunity",
      "summary": "Beverages show strong growth potential with 15% higher margins than category average.",
      "details": [
        "Beverage category has shown consistent growth over the past 30 days",
        "Weekday sales are 23% higher than weekend sales",
        "Top performers are soft drinks and instant coffee"
      ],
      "recommendations": [
        "Increase beverage visibility at store entrance",
        "Bundle beverages with popular snack items",
        "Implement weekday promotions to capitalize on traffic patterns"
      ],
      "confidence": 0.85,
      "priority": "high"
    },
    "isSynthetic": true,
    "dataSource": "Synthetic"
  },
  {
    "category": "brand_analysis",
    "InsightID": "SIM-INSIGHT-23456789",
    "entityID": "coca_cola",
    "entityName": "Coca-Cola",
    "GeneratedAt": "2025-05-21T12:35:56.789Z",
    "title": "Strong Brand Loyalty in Manila Region",
    "summary": "Coca-Cola shows exceptional customer loyalty with 85% repeat purchases.",
    "content": {
      "title": "Strong Brand Loyalty in Manila Region",
      "summary": "Coca-Cola shows exceptional customer loyalty with 85% repeat purchases.",
      "sentiment_analysis": {
        "overall_score": 0.78,
        "interpretation": "Strongly positive sentiment",
        "patterns": [
          "Consistent positive feedback on taste and price"
        ]
      },
      "recommendations": [
        "Leverage loyal customer base for new product introductions",
        "Develop in-store promotions highlighting customer loyalty"
      ],
      "confidence": 0.92,
      "priority": "medium"
    },
    "isSynthetic": true,
    "dataSource": "Synthetic"
  },
  {
    "category": "store_recommendations",
    "InsightID": "SIM-INSIGHT-34567890",
    "entityID": "SIM-STORE-0002",
    "entityName": "Sari-Sari Store 2",
    "region": "Calabarzon",
    "cityMunicipality": "Calamba",
    "GeneratedAt": "2025-05-21T12:36:56.789Z",
    "title": "Product Mix Optimization Plan",
    "summary": "Restructuring store layout and product mix could increase monthly sales by 22%.",
    "content": {
      "title": "Product Mix Optimization Plan",
      "summary": "Restructuring store layout and product mix could increase monthly sales by 22%.",
      "store_assessment": {
        "overall_rating": 7.2,
        "strengths": ["Good customer service", "Strong location"],
        "weaknesses": ["Limited shelf space", "Inefficient product mix"]
      },
      "product_mix_recommendations": [
        {
          "category": "Snacks",
          "recommendation": "Increase variety by 30%",
          "expected_impact": "15% sales lift"
        }
      ],
      "priority": "high"
    },
    "isSynthetic": true,
    "dataSource": "Synthetic"
  }
]
EOL

log "Creating AI insights component..."
# Create AI insights component JavaScript file
cat > "${DEPLOY_DIR}/js/ai_insights_component.js" << 'EOL'
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
EOL

# Create minimal demo dashboard if it doesn't exist
if [ ! -f "${DEPLOY_DIR}/index.html" ]; then
  log "Creating minimal demo dashboard..."
  
  mkdir -p "${DEPLOY_DIR}/js"
  mkdir -p "${DEPLOY_DIR}/css"
  
  # Create basic dashboard.js
  cat > "${DEPLOY_DIR}/js/dashboard.js" << 'EOL'
// Basic dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard initialized');
  
  // Create dashboard sections if they don't exist
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    // Store Performance section
    if (!document.querySelector('.store-performance-section')) {
      const section = document.createElement('div');
      section.className = 'store-performance-section dashboard-section';
      section.innerHTML = '<h2>Store Performance</h2><div class="section-content"><p>Store performance metrics will appear here.</p></div>';
      mainContent.appendChild(section);
    }
    
    // Brand Analysis section
    if (!document.querySelector('.brand-analysis-section')) {
      const section = document.createElement('div');
      section.className = 'brand-analysis-section dashboard-section';
      section.innerHTML = '<h2>Brand Analysis</h2><div class="section-content"><p>Brand analysis information will appear here.</p></div>';
      mainContent.appendChild(section);
    }
  }
  
  // Load AI insights component
  const aiScript = document.createElement('script');
  aiScript.src = './js/ai_insights_component.js';
  aiScript.async = true;
  document.head.appendChild(aiScript);
});
EOL

  # Create basic index.html
  cat > "${DEPLOY_DIR}/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client360 Dashboard</title>
  <link rel="stylesheet" href="./css/dashboard.css">
</head>
<body>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Client360 Dashboard</h1>
      <div class="dashboard-controls">
        <button id="refresh-data">Refresh Data</button>
        <select id="data-source">
          <option value="synthetic">Synthetic Data</option>
          <option value="real">Real Data</option>
        </select>
      </div>
    </header>
    
    <div class="dashboard-content">
      <aside class="dashboard-side-panel">
        <h2>Dashboard Tools</h2>
        <div class="dashboard-tools">
          <button id="export-csv">Export CSV</button>
          <button id="export-pptx">Export PPTX</button>
        </div>
      </aside>
      
      <main class="main-content">
        <!-- Dashboard sections will be populated by dashboard.js -->
      </main>
    </div>
    
    <footer class="dashboard-footer">
      <p>Client360 Dashboard v1.0 | TBWA Insights</p>
    </footer>
  </div>
  
  <script src="./js/dashboard.js"></script>
</body>
</html>
EOL

  # Create basic CSS
  cat > "${DEPLOY_DIR}/css/dashboard.css" << 'EOL'
/* Basic dashboard styles */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.dashboard-header {
  background-color: #0078d4;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
}

.dashboard-controls {
  display: flex;
  gap: 10px;
}

.dashboard-content {
  display: flex;
  flex: 1;
}

.dashboard-side-panel {
  width: 250px;
  background-color: white;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

.main-content {
  flex: 1;
  padding: 20px;
}

.dashboard-section {
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  padding: 15px;
  margin-bottom: 20px;
}

.dashboard-section h2 {
  margin-top: 0;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.dashboard-footer {
  background-color: #f5f5f5;
  padding: 10px 20px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

button, select {
  background-color: #0078d4;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #106ebe;
}

select {
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
}
EOL
else
  log "Using existing dashboard files..."
fi

# Generate a deployment verification report
log "Generating deployment verification report..."

# Create report file
REPORT_FILE="${OUTPUT_DIR}/deployment_verification_${TIMESTAMP}.md"

# Write report header
cat > "$REPORT_FILE" << EOL
# Client360 Dashboard Deployment Verification Report
**Deployment Timestamp:** $(date)

## Deployment Summary
- **Deployment ID:** ${TIMESTAMP}
- **Environment:** ${NODE_ENV:-development}
- **Backup Location:** \`${BACKUP_DIR}\`
- **Log File:** \`${LOG_FILE}\`

## Components Deployed

### Dashboard Components
EOL

# Check main dashboard files
if [ -f "${DEPLOY_DIR}/index.html" ]; then
  echo "- ✅ Main Dashboard (index.html)" >> "$REPORT_FILE"
else
  echo "- ❌ Main Dashboard (index.html) - MISSING" >> "$REPORT_FILE"
fi

if [ -f "${DEPLOY_DIR}/js/dashboard.js" ]; then
  echo "- ✅ Dashboard JavaScript (dashboard.js)" >> "$REPORT_FILE"
else
  echo "- ❌ Dashboard JavaScript (dashboard.js) - MISSING" >> "$REPORT_FILE"
fi

echo -e "\n### AI Components" >> "$REPORT_FILE"

# Check AI components
if [ -f "${DEPLOY_DIR}/js/ai_insights_component.js" ]; then
  echo "- ✅ AI Insights Component" >> "$REPORT_FILE"
else
  echo "- ❌ AI Insights Component - MISSING" >> "$REPORT_FILE"
fi

if [ -f "${DEPLOY_DIR}/data/ai/insights/all_insights_latest.json" ]; then
  echo "- ✅ Sample Insights Data" >> "$REPORT_FILE"
else
  echo "- ❌ Sample Insights Data - MISSING" >> "$REPORT_FILE"
fi

echo -e "\n## Next Steps" >> "$REPORT_FILE"
echo "1. Open ${DEPLOY_DIR}/index.html in your browser to view the dashboard" >> "$REPORT_FILE"
echo "2. Check that the AI insights components are displayed" >> "$REPORT_FILE"
echo "3. For full deployment, run the complete deploy_with_ai.sh script" >> "$REPORT_FILE"

log "Verification report generated: $REPORT_FILE"
log "Deployment completed successfully!"
log "To view the dashboard, open ${DEPLOY_DIR}/index.html in your browser"
log "For more details, see the verification report: ${OUTPUT_DIR}/deployment_verification_${TIMESTAMP}.md"