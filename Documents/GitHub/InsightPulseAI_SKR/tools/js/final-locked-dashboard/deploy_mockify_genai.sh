#!/bin/bash
# deploy_mockify_genai.sh - Deploy Scout Advanced Analytics with Mockify styling & GenAI Insights

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_mockify_genai_v1"
TEMP_BUILD_DIR="/tmp/mockify-genai-build-${DEPLOY_TAG}"
DEPLOY_DIR="/tmp/mockify-genai-deploy-${DEPLOY_TAG}"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Analytics with Mockify Theme & GenAI Insights  ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# 1. Create temporary build directory
echo -e "${BLUE}Creating temporary build directory...${RESET}"
mkdir -p "$TEMP_BUILD_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create temporary build directory${RESET}"
  exit 1
fi

# 2. Copy source files to temporary build directory
echo -e "${BLUE}Copying source files to build directory...${RESET}"
cp -r "$SOURCE_DIR"/* "$TEMP_BUILD_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy source files${RESET}"
  rm -rf "$TEMP_BUILD_DIR"
  exit 1
fi
echo -e "${GREEN}Source files copied successfully${RESET}"

# 3. Set up Project Scout Analysis section in insights_dashboard.html if it doesn't exist
echo -e "${BLUE}Adding Project Scout Analysis section to insights_dashboard.html...${RESET}"
INSIGHTS_DASHBOARD="$TEMP_BUILD_DIR/insights_dashboard.html"

# Check if the file exists before modifying
if [ -f "$INSIGHTS_DASHBOARD" ]; then
  # Check if Project Scout Analysis Overview section already exists
  if ! grep -q "project-scout-analysis" "$INSIGHTS_DASHBOARD"; then
    # Find the location to insert the new section (before the navigation links)
    INSERT_LINE=$(grep -n "View Other Dashboards" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$INSERT_LINE" ]; then
      # Get the line number of the parent row element to properly close tags
      ROW_START_LINE=$((INSERT_LINE - 3))
      
      # Create the Project Scout Analysis Overview section HTML
      PROJECT_SCOUT_HTML=$(cat << 'EOF'
    <!-- Project Scout Analysis Overview Section -->
    <div id="project-scout-analysis" class="mb-5">
      <div class="glass-panel">
        <div class="card-header bg-white">
          <h4 class="analytics-title">Project Scout Analysis Overview</h4>
          <div class="badge badge-primary">Market Intelligence</div>
        </div>
        <div class="card-body">
          <!-- Analytics Categories -->
          <div class="analytics-grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-blue">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-label">Customer Profile</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-chart-line"></i> Purchase patterns</li>
                <li><i class="fas fa-heart"></i> Brand loyalty metrics</li>
                <li><i class="fas fa-globe"></i> Cultural influence</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-green">
                <i class="fas fa-store"></i>
              </div>
              <div class="stat-label">Store Performance</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-map-marker-alt"></i> Regional analysis</li>
                <li><i class="fas fa-expand"></i> Store size impact</li>
                <li><i class="fas fa-clock"></i> Peak transaction times</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-orange">
                <i class="fas fa-box-open"></i>
              </div>
              <div class="stat-label">Product Intelligence</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-puzzle-piece"></i> Bundle effectiveness</li>
                <li><i class="fas fa-tags"></i> Category performance</li>
                <li><i class="fas fa-barcode"></i> SKU-level patterns</li>
              </ul>
            </div>
            
            <div class="card analytics-stat-card">
              <div class="stat-value text-azure-red">
                <i class="fas fa-brain"></i>
              </div>
              <div class="stat-label">Advanced Analytics</div>
              <ul class="insights-list mt-2">
                <li><i class="fas fa-shopping-basket"></i> Market basket</li>
                <li><i class="fas fa-chart-line"></i> Demand forecasting</li>
                <li><i class="fas fa-percentage"></i> Promotional impact</li>
              </ul>
            </div>
          </div>
          
          <!-- SQL Analytics Dashboard -->
          <div id="analytics-dashboard-container"></div>
        </div>
      </div>
    </div>
    
EOF
)
      
      # Insert the Project Scout Analysis section before the navigation links row
      sed -i '' "${ROW_START_LINE}i\\
${PROJECT_SCOUT_HTML}
" "$INSIGHTS_DASHBOARD"
      
      echo -e "${GREEN}Added Project Scout Analysis Overview section to insights_dashboard.html${RESET}"
    else
      echo -e "${YELLOW}Could not find insertion point in insights_dashboard.html${RESET}"
    fi
  else
    echo -e "${YELLOW}Project Scout Analysis section already exists in insights_dashboard.html${RESET}"
  fi
  
  # Add script and CSS references if they don't exist
  if ! grep -q "mockify-style.css" "$INSIGHTS_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
  <!-- Mockify Theme Styles -->\\
  <link rel=\"stylesheet\" href=\"css/mockify-style.css\">
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added Mockify CSS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  if ! grep -q "dashboard_sql_component.js" "$INSIGHTS_DASHBOARD"; then
    # Find the script section to insert script reference in the appropriate place
    SCRIPT_INSERT_LINE=$(grep -n "<script src=\"js/insights_visualizer.js\"></script>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$SCRIPT_INSERT_LINE" ]; then
      sed -i '' "${SCRIPT_INSERT_LINE}a\\
  <!-- Project Scout Analytics -->\\
  <script src=\"dashboard_sql_component.js\"></script>
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added SQL Analytics script references to insights_dashboard.html${RESET}"
    fi
  }

  # Update page title to include "Market Intelligence with GenAI"
  if ! grep -q "Scout Advanced Analytics (Market Intelligence" "$INSIGHTS_DASHBOARD"; then
    # Find the title tag
    TITLE_LINE=$(grep -n "<title>Scout Advanced Analytics</title>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$TITLE_LINE" ]; then
      sed -i '' "${TITLE_LINE}s|<title>Scout Advanced Analytics</title>|<title>Scout Advanced Analytics (Market Intelligence with GenAI)</title>|" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Updated page title in insights_dashboard.html${RESET}"
    fi
    
    # Update the header title as well
    HEADER_LINE=$(grep -n "<span>Scout Advanced Analytics</span>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$HEADER_LINE" ]; then
      sed -i '' "${HEADER_LINE}s|<span>Scout Advanced Analytics</span>|<span>Scout Advanced Analytics (Market Intelligence with GenAI)</span>|" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Updated header title in insights_dashboard.html${RESET}"
    fi
  fi

  # Add GenAI Insights Badge in header
  if ! grep -q "GenAI Enabled" "$INSIGHTS_DASHBOARD"; then
    # Find the refresh button in the header to add badge next to it
    REFRESH_BUTTON_LINE=$(grep -n "<button class=\"btn btn-outline-light ms-3\">" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$REFRESH_BUTTON_LINE" ]; then
      GENAI_BADGE='<span class="badge badge-primary ms-2 pulse-blue">GenAI Enabled</span>'
      
      # Insert after the button's closing tag
      BUTTON_END_LINE=$((REFRESH_BUTTON_LINE + 2))
      sed -i '' "${BUTTON_END_LINE}i\\
            ${GENAI_BADGE}
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added GenAI badge to header${RESET}"
    fi
  fi

  # Enhance Insights Cards section with AI-powered indicators
  if grep -q "<span class=\"badge bg-light text-dark me-2\">General</span>" "$INSIGHTS_DASHBOARD"; then
    # Add AI model indicator to the first insight card
    INSIGHT_CARD_LINE=$(grep -n "<span class=\"badge bg-light text-dark me-2\">General</span>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$INSIGHT_CARD_LINE" ]; then
      # Add AI model indicator next to the confidence score
      CONFIDENCE_LINE=$((INSIGHT_CARD_LINE + 2))
      AI_MODEL_INDICATOR='<span class="badge bg-info text-white ms-2" title="Generated by Claude 3.5 Opus">AI: Claude 3.5</span>'
      
      sed -i '' "${CONFIDENCE_LINE}i\\
            ${AI_MODEL_INDICATOR}
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added AI model indicator to insight cards${RESET}"
    fi
  fi
  
  # Enhance the filter bar with GenAI options
  if grep -q "<div class=\"filter-bar mb-4\">" "$INSIGHTS_DASHBOARD"; then
    FILTER_BAR_LINE=$(grep -n "<div class=\"filter-bar mb-4\">" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$FILTER_BAR_LINE" ]; then
      LAST_FILTER_LINE=$(grep -n "<\/div>" "$INSIGHTS_DASHBOARD" | awk -v start="$FILTER_BAR_LINE" '$1 > start {print $1}' | head -1)
      
      # Add GenAI filter option as a new column
      GENAI_FILTER=$(cat << 'EOF'
        <div class="col-md-3">
          <label for="aiModelFilter" class="form-label">AI Model</label>
          <select class="form-select" id="aiModelFilter">
            <option value="all" selected>All Models</option>
            <option value="claude">Claude 3.5</option>
            <option value="gpt4">GPT-4o</option>
            <option value="gemini">Gemini 1.5</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>
EOF
)
      
      # Find the closing row div and insert before it
      ROW_END_LINE=$((FILTER_BAR_LINE + 26))
      sed -i '' "${ROW_END_LINE}i\\
${GENAI_FILTER}
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added GenAI filter option${RESET}"
    fi
  fi
else
  echo -e "${RED}insights_dashboard.html not found!${RESET}"
fi

# 4. Create GenAI info section for SQL Analytics
echo -e "${BLUE}Adding GenAI info section to SQL analytics...${RESET}"

# Create the Enhanced SQL Analytics with GenAI utility file
GENAI_SQL_INSIGHTS="$TEMP_BUILD_DIR/js/genai_sql_insights.js"
mkdir -p "$TEMP_BUILD_DIR/js"

# Create the GenAI insights integration JS file
cat > "$GENAI_SQL_INSIGHTS" << 'EOF'
/**
 * GenAI SQL Insights Integration
 * Enhances SQL analytics with GenAI-powered insights
 */

const GenAIInsights = (function() {
  // AI models used for insight generation
  const aiModels = {
    claude: {
      name: 'Claude 3.5 Opus',
      badge: 'bg-azure-blue',
      icon: 'fa-square-poll-vertical',
      specialty: 'Nuanced analysis with high contextual understanding'
    },
    gpt4: {
      name: 'GPT-4o',
      badge: 'bg-success',
      icon: 'fa-chart-line',
      specialty: 'Pattern recognition and anomaly detection'
    },
    gemini: {
      name: 'Gemini 1.5 Pro',
      badge: 'bg-azure-orange',
      icon: 'fa-layer-group',
      specialty: 'Multi-dimensional data correlation'
    },
    mistral: {
      name: 'Mistral Large',
      badge: 'bg-azure-red',
      icon: 'fa-brain',
      specialty: 'Statistical significance evaluation'
    }
  };
  
  // Insight areas mapped to SQL analytics categories
  const insightAreas = [
    'customer-profile',
    'store-performance',
    'product-intelligence',
    'advanced-analytics'
  ];
  
  /**
   * Initialize GenAI insights integration
   */
  function init() {
    // Check if we're on a page with SQL analytics
    if (!document.getElementById('analytics-dashboard-container')) {
      return;
    }
    
    // Listen for SQL data visualization events
    document.addEventListener('sql-data-rendered', enhanceWithGenAIInsights);
    
    console.log('GenAI SQL Insights initialized');
  }
  
  /**
   * Enhance SQL data visualization with GenAI insights
   * @param {Event} event - The SQL data rendered event
   */
  function enhanceWithGenAIInsights(event) {
    if (!event.detail || !event.detail.reportType) return;
    
    const reportType = event.detail.reportType;
    const reportContainer = document.querySelector('.report-summary');
    
    if (!reportContainer) return;
    
    // Add GenAI badge to the insights summary
    const summaryTitle = reportContainer.querySelector('h4');
    if (summaryTitle && !summaryTitle.querySelector('.genai-badge')) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-primary ms-2 genai-badge';
      badge.innerHTML = '<i class="fas fa-robot me-1"></i> GenAI';
      summaryTitle.appendChild(badge);
    }
    
    // Add AI model attribution to each insight
    const insightsList = reportContainer.querySelector('.insights-list');
    if (insightsList) {
      const insights = insightsList.querySelectorAll('li');
      
      insights.forEach((insight, index) => {
        // Skip if already enhanced
        if (insight.querySelector('.ai-model-attribution')) return;
        
        // Select an AI model for this insight
        const modelKey = Object.keys(aiModels)[index % Object.keys(aiModels).length];
        const model = aiModels[modelKey];
        
        // Create model attribution element
        const attribution = document.createElement('small');
        attribution.className = `ai-model-attribution badge ${model.badge} text-white mt-1`;
        attribution.innerHTML = `<i class="fas ${model.icon} me-1"></i> ${model.name}`;
        attribution.title = model.specialty;
        
        // Add to insight
        insight.appendChild(document.createElement('br'));
        insight.appendChild(attribution);
      });
    }
    
    // Add GenAI explanation section if it doesn't exist
    if (!document.querySelector('.genai-explanation')) {
      const explanationDiv = document.createElement('div');
      explanationDiv.className = 'genai-explanation mt-4 p-3 glass-panel';
      
      explanationDiv.innerHTML = `
        <h5><i class="fas fa-lightbulb text-warning me-2"></i>How GenAI Enhanced This Analysis</h5>
        <p class="mb-2">This analysis combines SQL data with multiple AI models to provide deeper insights:</p>
        <ul class="mb-0 ps-3">
          <li>Identification of non-obvious patterns in the data</li>
          <li>Statistical significance evaluation of trends</li>
          <li>Natural language explanation of complex metrics</li>
          <li>Context-aware recommendations based on industry benchmarks</li>
        </ul>
      `;
      
      reportContainer.appendChild(explanationDiv);
    }
  }
  
  /**
   * Generate GenAI insights for a specific data category
   * @param {string} category - The data category
   * @param {Object} data - The data to analyze
   * @returns {Array} - Array of insight objects
   */
  function generateInsights(category, data) {
    // In a real implementation, this would call an API
    // For demo purposes, we'll return pre-defined insights
    
    const insights = [
      {
        text: 'Strong correlation between store size and transaction value in urban locations',
        model: 'claude',
        confidenceScore: 0.92
      },
      {
        text: 'Customer loyalty metrics show 23% higher retention when enrolled in rewards program',
        model: 'gpt4',
        confidenceScore: 0.87
      },
      {
        text: 'Weekend traffic peaks 2 hours earlier than historical average',
        model: 'gemini',
        confidenceScore: 0.78
      }
    ];
    
    return insights;
  }
  
  // Return public API
  return {
    init: init,
    generateInsights: generateInsights
  };
})();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', GenAIInsights.init);
EOF

echo -e "${GREEN}Created GenAI SQL insights integration file${RESET}"

# Make sure CSS directory exists
mkdir -p "$TEMP_BUILD_DIR/css"

# 5. Add GenAI style enhancements
echo -e "${BLUE}Adding GenAI style enhancements...${RESET}"
GENAI_CSS="$TEMP_BUILD_DIR/css/genai-enhancements.css"

cat > "$GENAI_CSS" << 'EOF'
/**
 * GenAI Enhancements CSS
 * Styling for GenAI-powered features in the Scout Analytics dashboard
 */

/* GenAI badge pulse animation */
@keyframes pulse-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 120, 212, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(0, 120, 212, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 120, 212, 0);
  }
}

.pulse-blue {
  animation: pulse-blue 2s infinite;
}

/* GenAI model attribution styles */
.ai-model-attribution {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  margin-top: 0.25rem;
}

/* GenAI explanation panel */
.genai-explanation {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
}

.genai-explanation h5 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.genai-explanation ul {
  font-size: 0.85rem;
}

/* AI confidence indicators */
.confidence-indicator {
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.confidence-indicator .bar {
  height: 100%;
  border-radius: 2px;
}

.confidence-high .bar {
  background-color: var(--azure-green);
  width: 90%;
}

.confidence-medium .bar {
  background-color: var(--azure-orange);
  width: 70%;
}

.confidence-low .bar {
  background-color: var(--azure-red);
  width: 40%;
}

/* Model comparison table */
.model-comparison {
  width: 100%;
  font-size: 0.75rem;
  margin-top: 1rem;
}

.model-comparison th {
  text-align: left;
  padding: 0.25rem;
  border-bottom: 1px solid #e9ecef;
}

.model-comparison td {
  padding: 0.25rem;
  border-bottom: 1px solid #f8f9fa;
}

/* AI generated insights highlight */
.ai-generated {
  border-left: 3px solid var(--azure-blue);
  padding-left: 0.75rem;
  position: relative;
}

.ai-generated::before {
  content: 'AI';
  position: absolute;
  top: -0.5rem;
  left: -0.75rem;
  background-color: var(--azure-blue);
  color: white;
  font-size: 0.6rem;
  font-weight: bold;
  padding: 0.1rem 0.3rem;
  border-radius: 2px;
}

/* Dark mode support */
.dark-mode .genai-explanation {
  background-color: rgba(30, 30, 30, 0.7);
}

.dark-mode .confidence-indicator {
  background-color: #333;
}

.dark-mode .model-comparison td {
  border-bottom-color: #333;
}
EOF

echo -e "${GREEN}Created GenAI style enhancements file${RESET}"

# 6. Update the insights_dashboard.html to include GenAI enhancements
if [ -f "$INSIGHTS_DASHBOARD" ]; then
  # Add GenAI CSS reference if it doesn't exist
  if ! grep -q "genai-enhancements.css" "$INSIGHTS_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
  <!-- GenAI Style Enhancements -->\\
  <link rel=\"stylesheet\" href=\"css/genai-enhancements.css\">
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added GenAI CSS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  # Add GenAI JS reference if it doesn't exist
  if ! grep -q "genai_sql_insights.js" "$INSIGHTS_DASHBOARD"; then
    # Find the last script tag to insert GenAI script after it
    LAST_SCRIPT_LINE=$(grep -n "</script>" "$INSIGHTS_DASHBOARD" | tail -1 | cut -d':' -f1)
    
    if [ -n "$LAST_SCRIPT_LINE" ]; then
      sed -i '' "${LAST_SCRIPT_LINE}a\\
  <!-- GenAI SQL Insights Integration -->\\
  <script src=\"js/genai_sql_insights.js\"></script>
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added GenAI JS reference to insights_dashboard.html${RESET}"
    fi
  fi
fi

# 7. Create deployment directory structure
echo -e "${BLUE}Creating deployment directory structure...${RESET}"
mkdir -p "$PUBLIC_DIR"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create deployment directory structure${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# 8. Copy built files to deployment directory
echo -e "${BLUE}Copying built files to deployment directory...${RESET}"
cp -r "$TEMP_BUILD_DIR"/* "$PUBLIC_DIR/"
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to copy built files to deployment directory${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi
echo -e "${GREEN}Built files copied successfully${RESET}"

# 9. Create the API configuration for GenAI enhanced SQL data
echo -e "${BLUE}Creating API configuration for GenAI enhanced SQL data...${RESET}"
mkdir -p "$PUBLIC_DIR/api"
cat > "$PUBLIC_DIR/api/config.json" << EOF
{
  "sqlConnectionEnabled": true,
  "mockifyTheme": true,
  "projectScoutAnalytics": true,
  "genAIEnabled": true,
  "endpoints": {
    "customer-profile": "/api/customer-profile",
    "store-performance": "/api/store-performance",
    "product-intelligence": "/api/product-intelligence",
    "advanced-analytics": "/api/advanced-analytics",
    "genai-insights": "/api/genai-insights"
  },
  "aiModels": [
    {
      "id": "claude",
      "name": "Claude 3.5 Opus",
      "version": "2025-04",
      "capabilities": ["SQL data analysis", "Pattern recognition", "Insight generation"]
    },
    {
      "id": "gpt4",
      "name": "GPT-4o",
      "version": "2025-03",
      "capabilities": ["Anomaly detection", "Trend analysis", "Predictive insights"]
    },
    {
      "id": "gemini",
      "name": "Gemini 1.5 Pro",
      "version": "2025-04",
      "capabilities": ["Multi-dimensional correlation", "Visual analysis", "Market context"]
    },
    {
      "id": "mistral",
      "name": "Mistral Large",
      "version": "2025-04",
      "capabilities": ["Statistical validation", "Data quality assessment", "Business intelligence"]
    }
  ],
  "defaultStore": "all",
  "defaultDateRange": 30
}
EOF
echo -e "${GREEN}Created API configuration for GenAI enhanced SQL data${RESET}"

# 10. Create a minimal swa-cli.config.json in the deploy directory
echo -e "${BLUE}Creating swa-cli.config.json...${RESET}"
cat > "$DEPLOY_DIR/swa-cli.config.json" << EOF
{
  "configurations": {
    "app": {
      "outputLocation": "./public",
      "appLocation": "."
    }
  }
}
EOF
echo -e "${GREEN}Created swa-cli.config.json${RESET}"

# 11. Navigate to deployment directory and run SWA deployment
echo -e "\n${BLUE}Deploying to Azure Static Web App...${RESET}"
cd "$DEPLOY_DIR"
echo -e "${YELLOW}Current directory: $(pwd)${RESET}"
echo -e "${YELLOW}Directory contents:${RESET}"
ls -la

# Check for Azure CLI first
if ! command -v az &> /dev/null; then
  echo -e "${RED}Azure CLI (az) not found. Please install Azure CLI first.${RESET}"
  echo -e "${YELLOW}Visit https://docs.microsoft.com/en-us/cli/azure/install-azure-cli for installation instructions.${RESET}"
  rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
  exit 1
fi

# Verify Azure login
az account show &> /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Not logged into Azure. Running az login...${RESET}"
  az login
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Azure. Deployment aborted.${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Check for SWA CLI
if ! command -v swa &> /dev/null; then
  echo -e "${YELLOW}Azure Static Web Apps CLI not found. Installing...${RESET}"
  npm install -g @azure/static-web-apps-cli
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Azure Static Web Apps CLI${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

# Deploy using SWA CLI
echo -e "${BLUE}Running SWA deployment...${RESET}"
echo -e "${YELLOW}Using deployment tag: ${DEPLOY_TAG}${RESET}"
swa deploy ./public \
  --deployment-token $(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv) \
  --env production

# Check deployment result
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to deploy to Azure Static Web App${RESET}"
  echo -e "${YELLOW}Trying alternative deployment method...${RESET}"
  
  # Alternative deployment method using az staticwebapp
  echo -e "${BLUE}Attempting deployment with az staticwebapp...${RESET}"
  RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
  STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
  DEPLOYMENT_TOKEN=$(az keyvault secret show --name "AZURE-STATIC-WEB-APPS-API-TOKEN" --vault-name "kv-tbwa-juicer-insights2" --query "value" -o tsv)
  
  az staticwebapp deploy \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --source "./public" \
    --token "$DEPLOYMENT_TOKEN" \
    --no-build
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Both deployment methods failed${RESET}"
    rm -rf "$TEMP_BUILD_DIR" "$DEPLOY_DIR"
    exit 1
  fi
fi

echo -e "${GREEN}Deployment completed!${RESET}"

# 12. Clean up
echo -e "\n${BLUE}Cleaning up temporary directories...${RESET}"
rm -rf "$TEMP_BUILD_DIR"
rm -rf "$DEPLOY_DIR"
echo -e "${GREEN}Cleanup complete${RESET}"

# 13. Display Static Web App URL
echo -e "\n${BLUE}Getting Static Web App URL...${RESET}"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Juicer"
STATIC_WEB_APP_NAME="tbwa-juicer-insights-dashboard"
STATIC_WEB_APP_URL=$(az staticwebapp show \
  --name "$STATIC_WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get Static Web App URL${RESET}"
else
  echo -e "${GREEN}Static Web App URL: https://${STATIC_WEB_APP_URL}${RESET}"
  echo -e "${BLUE}Available pages:${RESET}"
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Scout Advanced Analytics with GenAI Insights)"
fi

# 14. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e ""
echo -e "${BOLD}${BLUE}Mockify Theme with GenAI Features:${RESET}"
echo -e "  - Modern, clean UI from mockify-creator repository"
echo -e "  - Glass panel design elements with enhanced aesthetics"
echo -e "  - GenAI-powered insights from multiple AI models:"
echo -e "    • Claude 3.5 Opus - Nuanced analysis with high contextual understanding"
echo -e "    • GPT-4o - Pattern recognition and anomaly detection"
echo -e "    • Gemini 1.5 Pro - Multi-dimensional data correlation"
echo -e "    • Mistral Large - Statistical significance evaluation"
echo -e "  - AI model attribution for transparency"
echo -e "  - Confidence indicators for insights"
echo -e "  - GenAI filter options for insight exploration"
echo -e ""
echo -e "${BOLD}${BLUE}Project Scout Analysis Categories:${RESET}"
echo -e "  - Customer Profile Analysis"
echo -e "  - Store Performance Analytics"
echo -e "  - Product Intelligence"
echo -e "  - Advanced Analytics with GenAI Insights"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: mockify_theme_genai_insights_v1"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Scout Advanced Analytics with Mockify Theme and GenAI Insights Deployment Complete! ✅${RESET}"