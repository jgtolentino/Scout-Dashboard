#!/bin/bash
# deploy_mockify_genai_unified.sh
# Deploy Scout Advanced Analytics with Mockify styling & Unified GenAI Integration
# No model-specific badges, indicators, or pulse animations

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Configuration
SOURCE_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/final-locked-dashboard"
DEPLOY_TAG="scout_mockify_genai_unified_v1"
TEMP_BUILD_DIR="/tmp/mockify-genai-build-${DEPLOY_TAG}"
DEPLOY_DIR="/tmp/mockify-genai-deploy-${DEPLOY_TAG}"
PUBLIC_DIR="$DEPLOY_DIR/public"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Deploy Scout Analytics with Mockify Theme & Unified GenAI      ${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}"
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
echo -e "${BLUE}Setting up Project Scout Analysis section...${RESET}"
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
  fi

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

  # Add Unified GenAI Badge in header (without pulse animation)
  if ! grep -q "Unified GenAI" "$INSIGHTS_DASHBOARD"; then
    # Find the refresh button in the header to add badge next to it
    REFRESH_BUTTON_LINE=$(grep -n "<button class=\"btn btn-outline-light ms-3\">" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$REFRESH_BUTTON_LINE" ]; then
      GENAI_BADGE='<span class="badge badge-primary ms-2">Unified GenAI</span>'
      
      # Insert after the button's closing tag
      BUTTON_END_LINE=$((REFRESH_BUTTON_LINE + 2))
      sed -i '' "${BUTTON_END_LINE}i\\
            ${GENAI_BADGE}
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added Unified GenAI badge to header${RESET}"
    fi
  fi
else
  echo -e "${RED}insights_dashboard.html not found!${RESET}"
fi

# 4. Create simplified GenAI info section for SQL Analytics
echo -e "${BLUE}Creating unified GenAI integration for SQL analytics...${RESET}"

# Create the Enhanced SQL Analytics with GenAI utility file
GENAI_SQL_INSIGHTS="$TEMP_BUILD_DIR/js/unified_genai_insights.js"
mkdir -p "$TEMP_BUILD_DIR/js"

# Create the unified GenAI insights integration JS file (without model attributions)
cat > "$GENAI_SQL_INSIGHTS" << 'EOF'
/**
 * Unified GenAI Insights Integration
 * Enhances SQL analytics with GenAI-powered insights without model-specific indicators
 */

const UnifiedGenAI = (function() {
  // Initialize GenAI insights integration
  function init() {
    // Check if we're on a page with SQL analytics
    if (!document.getElementById('analytics-dashboard-container')) {
      return;
    }
    
    // Listen for SQL data visualization events
    document.addEventListener('sql-data-rendered', enhanceWithGenAIInsights);
    console.log('Unified GenAI initialized');
    
    // Add unified style to existing insights
    enhanceExistingInsights();
  }
  
  // Enhance SQL data visualization with GenAI insights
  function enhanceWithGenAIInsights(event) {
    if (!event.detail || !event.detail.reportType) return;
    
    const reportType = event.detail.reportType;
    const reportContainer = document.querySelector('.report-summary');
    
    if (!reportContainer) return;
    
    // Add unified GenAI badge to the insights summary
    const summaryTitle = reportContainer.querySelector('h4');
    if (summaryTitle && !summaryTitle.querySelector('.genai-badge')) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-primary ms-2 genai-badge';
      badge.innerHTML = '<i class="fas fa-lightbulb me-1"></i> GenAI Enhanced';
      summaryTitle.appendChild(badge);
    }
    
    // Add GenAI explanation section if it doesn't exist
    if (!document.querySelector('.genai-explanation')) {
      const explanationDiv = document.createElement('div');
      explanationDiv.className = 'genai-explanation mt-4 p-3 glass-panel';
      
      explanationDiv.innerHTML = `
        <h5><i class="fas fa-lightbulb text-warning me-2"></i>GenAI Enhanced Analysis</h5>
        <p class="mb-2">This analysis uses artificial intelligence to provide deeper insights:</p>
        <ul class="mb-0 ps-3">
          <li>Pattern identification across complex datasets</li>
          <li>Statistical significance evaluation of trends</li>
          <li>Natural language explanation of metrics</li>
          <li>Context-aware recommendations</li>
        </ul>
      `;
      
      reportContainer.appendChild(explanationDiv);
    }
  }
  
  // Apply unified styling to existing insight elements
  function enhanceExistingInsights() {
    // Look for existing insight cards
    const insightCards = document.querySelectorAll('.card-insight-general, .card-insight-brand');
    
    insightCards.forEach(card => {
      // Remove any model-specific badges
      const modelBadges = card.querySelectorAll('.model-badge, .model-indicator');
      modelBadges.forEach(badge => badge.remove());
      
      // Replace model-specific information with unified badge
      const cardHeader = card.querySelector('.card-header');
      if (cardHeader) {
        // Check if unified badge already exists
        if (!cardHeader.querySelector('.unified-genai-badge')) {
          const unifiedBadge = document.createElement('span');
          unifiedBadge.className = 'badge bg-primary text-white ms-2 unified-genai-badge';
          unifiedBadge.textContent = 'GenAI';
          cardHeader.appendChild(unifiedBadge);
        }
      }
      
      // Replace any model attribution text with generic AI generation text
      const attributionText = card.querySelector('.text-muted small');
      if (attributionText && attributionText.textContent.includes('Generated by')) {
        const dateText = attributionText.textContent.split('•')[1] || '';
        attributionText.textContent = `Generated by AI • ${dateText.trim()}`;
      }
      
      // Add glass panel effect
      card.classList.add('glass-panel');
    });
  }
  
  // Generate unified GenAI insights for a specific data category
  function generateInsights(category, data) {
    // In a real implementation, this would call an API
    // For demonstration purposes, we'll return pre-defined insights
    
    const insights = [
      {
        text: 'Customer segments showing highest growth also demonstrate 37% higher brand loyalty metrics',
        confidenceScore: 0.92
      },
      {
        text: 'Weekend traffic patterns show new peak times that differ from historical averages',
        confidenceScore: 0.87
      },
      {
        text: 'Bundle promotions generating 23% higher average transaction value across all demographics',
        confidenceScore: 0.84
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
document.addEventListener('DOMContentLoaded', UnifiedGenAI.init);
EOF

echo -e "${GREEN}Created unified GenAI insights integration file${RESET}"

# Make sure CSS directory exists
mkdir -p "$TEMP_BUILD_DIR/css"

# 5. Add Unified GenAI style enhancements
echo -e "${BLUE}Adding unified GenAI styles...${RESET}"
GENAI_CSS="$TEMP_BUILD_DIR/css/unified-genai.css"

cat > "$GENAI_CSS" << 'EOF'
/**
 * Unified GenAI Styles
 * Styling for GenAI-powered features with clean, model-agnostic approach
 */

/* Unified GenAI badge */
.unified-genai-badge {
  background-color: var(--azure-blue);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
}

/* GenAI explanation panel */
.genai-explanation {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
  border-left: 3px solid var(--azure-blue);
}

.genai-explanation h5 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--azure-blue-dark);
}

.genai-explanation ul {
  font-size: 0.85rem;
}

/* Confidence indicators (simplified) */
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
  background-color: var(--azure-blue);
}

.confidence-high .bar {
  width: 90%;
}

.confidence-medium .bar {
  width: 70%;
}

.confidence-low .bar {
  width: 40%;
}

/* GenAI badge */
.genai-badge {
  background-color: var(--azure-blue);
  color: white;
  font-size: 0.75rem;
  padding: 0.25em 0.5em;
  border-radius: 4px;
}

/* Glass panel effect for GenAI content */
.glass-panel {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.glass-panel:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* Dark mode support */
.dark-mode .genai-explanation {
  background-color: rgba(40, 40, 40, 0.7);
  border-left: 3px solid var(--azure-blue);
}

.dark-mode .confidence-indicator {
  background-color: #333;
}

.dark-mode .glass-panel {
  background-color: rgba(40, 40, 40, 0.7);
  border: 1px solid rgba(70, 70, 70, 0.3);
}
EOF

echo -e "${GREEN}Created unified GenAI style file${RESET}"

# 6. Update the insights_dashboard.html to include unified GenAI enhancements
if [ -f "$INSIGHTS_DASHBOARD" ]; then
  # Add GenAI CSS reference if it doesn't exist
  if ! grep -q "unified-genai.css" "$INSIGHTS_DASHBOARD"; then
    # Find the head closing tag to insert CSS reference before it
    CSS_INSERT_LINE=$(grep -n "</head>" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$CSS_INSERT_LINE" ]; then
      sed -i '' "${CSS_INSERT_LINE}i\\
  <!-- Unified GenAI Styles -->\\
  <link rel=\"stylesheet\" href=\"css/unified-genai.css\">
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added Unified GenAI CSS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  # Add GenAI JS reference if it doesn't exist
  if ! grep -q "unified_genai_insights.js" "$INSIGHTS_DASHBOARD"; then
    # Find the last script tag to insert GenAI script after it
    LAST_SCRIPT_LINE=$(grep -n "</script>" "$INSIGHTS_DASHBOARD" | tail -1 | cut -d':' -f1)
    
    if [ -n "$LAST_SCRIPT_LINE" ]; then
      sed -i '' "${LAST_SCRIPT_LINE}a\\
  <!-- Unified GenAI Insights Integration -->\\
  <script src=\"js/unified_genai_insights.js\"></script>
" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Added Unified GenAI JS reference to insights_dashboard.html${RESET}"
    fi
  fi
  
  # Remove any AI model filter if it exists
  if grep -q "id=\"aiModelFilter\"" "$INSIGHTS_DASHBOARD"; then
    AI_MODEL_FILTER_LINE=$(grep -n "id=\"aiModelFilter\"" "$INSIGHTS_DASHBOARD" | head -1 | cut -d':' -f1)
    
    if [ -n "$AI_MODEL_FILTER_LINE" ]; then
      # Find the start and end of the div element
      DIV_START_LINE=$((AI_MODEL_FILTER_LINE - 2))
      DIV_END_LINE=$((DIV_START_LINE + 10))
      
      # Delete the entire div element
      sed -i '' "${DIV_START_LINE},${DIV_END_LINE}d" "$INSIGHTS_DASHBOARD"
      echo -e "${GREEN}Removed AI model filter from insights_dashboard.html${RESET}"
    fi
  fi
  
  # Remove model attribution from insight cards if they exist
  if grep -q "model-attribution" "$INSIGHTS_DASHBOARD"; then
    # Replace model attribution with generic AI attribution
    sed -i '' 's/Generated by \(Claude\|GPT-4\|Gemini\|Mistral\)/Generated by AI/g' "$INSIGHTS_DASHBOARD"
    
    # Remove model-specific badges
    sed -i '' 's/<span class="model-badge.*<\/span>//g' "$INSIGHTS_DASHBOARD"
    
    echo -e "${GREEN}Removed model-specific attributions from insights_dashboard.html${RESET}"
  fi
  
  # Remove pulse animations if they exist
  if grep -q "pulse-animation" "$INSIGHTS_DASHBOARD"; then
    sed -i '' 's/class=".*pulse-animation.*"/class=""/g' "$INSIGHTS_DASHBOARD"
    echo -e "${GREEN}Removed pulse animations from insights_dashboard.html${RESET}"
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
  "unifiedGenAI": true,
  "endpoints": {
    "customer-profile": "/api/customer-profile",
    "store-performance": "/api/store-performance",
    "product-intelligence": "/api/product-intelligence",
    "advanced-analytics": "/api/advanced-analytics",
    "genai-insights": "/api/unified-insights"
  },
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
  echo -e "  - ${GREEN}https://${STATIC_WEB_APP_URL}/insights_dashboard.html${RESET} (Scout Advanced Analytics with Unified GenAI)"
fi

# 14. Final Summary
echo -e "\n${BOLD}${GREEN}Deployment Summary${RESET}"
echo -e "${BLUE}-----------------------------------${RESET}"
echo -e "Source Directory: ${SOURCE_DIR}"
echo -e "Deployment Tag: ${DEPLOY_TAG}"
echo -e ""
echo -e "${BOLD}${BLUE}Mockify Theme with Unified GenAI Features:${RESET}"
echo -e "  - Modern UI from mockify-creator repository with glass morphism"
echo -e "  - Unified GenAI-powered insights without model-specific indicators"
echo -e "  - No pulse animations or model badges for clean presentation"
echo -e "  - Consistent AI integration across all analytics components"
echo -e ""
echo -e "${BOLD}${BLUE}Project Scout Analysis Categories:${RESET}"
echo -e "  - Customer Profile Analysis (demographics, loyalty, influence)"
echo -e "  - Store Performance Analytics (regional, size impact, peak times)"
echo -e "  - Product Intelligence (bundles, categories, SKUs, BUMO)"
echo -e "  - Advanced Analytics (market basket, forecasting, promotions)"
echo -e ""
echo -e "${BOLD}${GREEN}Deployment Log:${RESET}"
echo -e "patch_id: mockify_theme_unified_genai_v1"
echo -e "Log timestamp: $(date +"%Y-%m-%d %H:%M:%S")"
echo -e "${BOLD}${GREEN}Scout Advanced Analytics with Mockify Theme and Unified GenAI Deployment Complete! ✅${RESET}"