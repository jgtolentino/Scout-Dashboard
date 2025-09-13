#!/bin/bash
# deploy_with_ai.sh - Comprehensive deployment script for Client360 Dashboard with AI Integration
# This script handles the full deployment process including AI components

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

# Environment variables
ENV_FILE=".env.local"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$OUTPUT_DIR"

# Log function
log() {
  echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# Check if required files exist
check_required_files() {
  log "Checking required files..."
  
  # Check deployment files
  if [ ! -d "$DEPLOY_DIR" ]; then
    log "ERROR: Deploy directory not found: $DEPLOY_DIR"
    exit 1
  fi
  
  # Check AI components
  if [ ! -f "${AI_DIR}/model_routing.yaml" ]; then
    log "ERROR: AI model routing configuration not found: ${AI_DIR}/model_routing.yaml"
    exit 1
  fi
  
  # Check environment file
  if [ ! -f "$ENV_FILE" ]; then
    log "WARNING: Environment file not found: $ENV_FILE"
    log "Creating environment file from example..."
    cp "${AI_DIR}/.env.example" "$ENV_FILE"
    log "Please edit $ENV_FILE with your actual configuration values before running this script again."
    exit 1
  fi
  
  log "All required files present."
}

# Create a backup of the current deployment
create_backup() {
  log "Creating backup of current deployment..."
  
  if [ -d "$DEPLOY_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR"
    log "Backup created in $BACKUP_DIR"
  else
    log "WARNING: No current deployment to backup."
  fi
}

# Load environment variables
load_environment() {
  log "Loading environment variables..."
  
  if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    log "Environment variables loaded from $ENV_FILE"
  else
    log "ERROR: Environment file not found: $ENV_FILE"
    exit 1
  fi
}

# Set up AI directories
setup_ai_directories() {
  log "Setting up AI directories..."
  
  # Create AI directories in deployment
  mkdir -p "${DEPLOY_DIR}/data/ai/prompts"
  mkdir -p "${DEPLOY_DIR}/data/ai/output"
  mkdir -p "${DEPLOY_DIR}/data/ai/scripts"
  
  # Copy AI components
  cp "${AI_DIR}/model_routing.yaml" "${DEPLOY_DIR}/data/ai/"
  cp "${AI_DIR}/prompts"/* "${DEPLOY_DIR}/data/ai/prompts/"
  cp "${AI_DIR}/scripts"/* "${DEPLOY_DIR}/data/ai/scripts/"
  cp "${AI_DIR}/fabricate_ai_insights.py" "${DEPLOY_DIR}/data/ai/"
  cp "${AI_DIR}/ai_insights_table.sql" "${DEPLOY_DIR}/data/ai/"
  cp "${AI_DIR}/pulser_ai_insights.yaml" "${DEPLOY_DIR}/data/ai/"
  cp "${AI_DIR}/README_AI_INTEGRATION.md" "${DEPLOY_DIR}/data/ai/"
  
  log "AI directories and files setup complete."
}

# Verify AI components 
verify_ai_components() {
  log "Verifying AI components..."
  
  # Ensure Python is installed
  if ! command -v python3 &> /dev/null; then
    log "ERROR: Python 3 is not installed."
    exit 1
  fi
  
  # Check for required Python packages
  python3 -m pip install -q openai azure-identity azure-keyvault-secrets pandas pyarrow pyyaml python-dotenv

  # Run the verification script
  log "Running AI verification script..."
  python3 "${AI_SCRIPTS_DIR}/verify_azure_openai.py" --verify-only --config "${AI_DIR}/model_routing.yaml" >> "$LOG_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    log "AI components verified successfully."
  else
    log "WARNING: AI components verification had issues. Check the log for details."
    # Continue deployment - AI features will be in place but may need configuration
  fi
}

# Process database migration for AI insights
setup_database() {
  log "Setting up database for AI insights..."
  
  if [ ! -z "$DATABRICKS_HOST" ] && [ ! -z "$DATABRICKS_TOKEN" ] && [ ! -z "$DATABRICKS_HTTP_PATH" ]; then
    log "Databricks credentials found. Attempting to set up database schema..."
    
    # Check if Databricks CLI is installed
    if command -v databricks &> /dev/null; then
      log "Running AI insights database migration..."
      databricks sql query --file "${AI_DIR}/ai_insights_table.sql" >> "$LOG_FILE" 2>&1
      
      if [ $? -eq 0 ]; then
        log "Database migration completed successfully."
      else
        log "WARNING: Database migration had issues. Check the log for details."
        # Continue deployment - schemas will need to be set up manually
      fi
    else
      log "WARNING: Databricks CLI not installed. Database migration skipped."
      # Continue deployment - schemas will need to be set up manually
    fi
  else
    log "WARNING: Databricks credentials not found. Database migration skipped."
    # Continue deployment - schemas will need to be set up manually
  fi
}

# Generate synthetic insights for development if enabled
generate_synthetic_insights() {
  log "Checking if synthetic data generation is enabled..."
  
  if [ "${ENABLE_SYNTHETIC_DATA:-false}" = "true" ]; then
    log "Generating synthetic insights for development..."
    
    # Run the insights generation script
    python3 "${AI_DIR}/fabricate_ai_insights.py" --mode synthetic --output json >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
      log "Synthetic insights generated successfully."
      
      # Copy synthetic insights to deployment
      mkdir -p "${DEPLOY_DIR}/data/ai/insights"
      cp "${AI_DIR}/output"/* "${DEPLOY_DIR}/data/ai/insights/" 2>/dev/null || true
    else
      log "WARNING: Synthetic insights generation had issues. Check the log for details."
      # Continue deployment
    fi
  else
    log "Synthetic data generation is disabled. Skipping."
  fi
}

# Run the main dashboard build and deployment
deploy_dashboard() {
  log "Running main dashboard deployment..."
  
  # Check if there's an existing deployment script
  if [ -f "./deploy_end_to_end.sh" ]; then
    log "Using existing end-to-end deployment script..."
    ./deploy_end_to_end.sh >> "$LOG_FILE" 2>&1
  elif [ -f "./deploy_fixed_dashboard.sh" ]; then
    log "Using fixed dashboard deployment script..."
    ./deploy_fixed_dashboard.sh >> "$LOG_FILE" 2>&1
  elif [ -f "../deploy_pipeline.sh" ]; then
    log "Using pipeline deployment script..."
    ../deploy_pipeline.sh >> "$LOG_FILE" 2>&1
  else
    log "WARNING: No existing deployment script found. Just deploying AI components."
    # Continue with just the AI components
  fi
  
  log "Dashboard deployment complete."
}

# Update dashboard with AI components
integrate_ai_to_dashboard() {
  log "Integrating AI components with dashboard..."
  
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
        <div class="insight-generated">Generated: ${new Date(insight.generatedAt).toLocaleString()}</div>
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
          <div class="insight-generated">Generated: ${new Date(insight.generatedAt).toLocaleString()}</div>
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
          <div class="insight-generated">Generated: ${new Date(insight.generatedAt).toLocaleString()}</div>
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

  # Update main dashboard.js to include the AI insights component
  if [ -f "${DEPLOY_DIR}/js/dashboard.js" ]; then
    # Check if the AI component is already referenced
    if ! grep -q "ai_insights_component.js" "${DEPLOY_DIR}/js/dashboard.js"; then
      log "Adding AI insights component reference to dashboard.js..."
      
      # Add script reference at the end of the file
      echo "// Load AI insights component
document.addEventListener('DOMContentLoaded', function() {
  // Create script element for AI insights component
  const aiScript = document.createElement('script');
  aiScript.src = './js/ai_insights_component.js';
  aiScript.async = true;
  document.head.appendChild(aiScript);
});" >> "${DEPLOY_DIR}/js/dashboard.js"
    else
      log "AI insights component already referenced in dashboard.js"
    fi
  else
    log "WARNING: dashboard.js not found. Manual integration of AI component will be required."
  fi
  
  # Update index.html to include AI insights component
  if [ -f "${DEPLOY_DIR}/index.html" ]; then
    # Check if the AI component is already referenced
    if ! grep -q "ai_insights_component.js" "${DEPLOY_DIR}/index.html"; then
      log "Adding AI insights component reference to index.html..."
      
      # Add script reference before closing body tag
      sed -i '' 's/<\/body>/<script src="\.\/js\/ai_insights_component.js"><\/script>\n<\/body>/g' "${DEPLOY_DIR}/index.html"
    else
      log "AI insights component already referenced in index.html"
    fi
  else
    log "WARNING: index.html not found. Manual integration of AI component will be required."
  fi
  
  log "AI components integrated with dashboard."
}

# Deploy to Azure if configured
deploy_to_azure() {
  log "Checking for Azure deployment configuration..."
  
  if [ ! -z "$AZURE_STATIC_WEB_APP_NAME" ] && [ ! -z "$AZURE_RESOURCE_GROUP" ]; then
    log "Azure deployment configuration found. Attempting to deploy..."
    
    # Check if Azure CLI is installed
    if command -v az &> /dev/null; then
      log "Deploying to Azure Static Web App: $AZURE_STATIC_WEB_APP_NAME"
      
      # Login to Azure if not already logged in
      az account show &> /dev/null || az login >> "$LOG_FILE" 2>&1
      
      # Deploy to Azure Static Web App
      az staticwebapp deploy \
        --name "$AZURE_STATIC_WEB_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --source "$DEPLOY_DIR" \
        --deployment-token "${AZURE_STATIC_WEB_APP_DEPLOYMENT_TOKEN:-}" >> "$LOG_FILE" 2>&1
      
      if [ $? -eq 0 ]; then
        log "Azure deployment completed successfully."
        log "Dashboard is available at: https://${AZURE_STATIC_WEB_APP_NAME}.azurestaticapps.net"
      else
        log "WARNING: Azure deployment had issues. Check the log for details."
      fi
    else
      log "WARNING: Azure CLI not installed. Azure deployment skipped."
    fi
  else
    log "Azure deployment configuration not found. Skipping Azure deployment."
  fi
}

# Generate a deployment verification report
generate_verification_report() {
  log "Generating deployment verification report..."
  
  # Create report file
  REPORT_FILE="${OUTPUT_DIR}/deployment_verification_${TIMESTAMP}.md"
  
  # Write report header
  cat > "$REPORT_FILE" << EOL
# Client360 Dashboard Deployment Verification Report
**Deployment Timestamp:** $(date)

## Deployment Summary
- **Deployment ID:** ${TIMESTAMP}
- **Environment:** ${NODE_ENV:-production}
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
  if [ -f "${DEPLOY_DIR}/data/ai/model_routing.yaml" ]; then
    echo "- ✅ AI Model Routing Configuration" >> "$REPORT_FILE"
  else
    echo "- ❌ AI Model Routing Configuration - MISSING" >> "$REPORT_FILE"
  fi
  
  if [ -f "${DEPLOY_DIR}/js/ai_insights_component.js" ]; then
    echo "- ✅ AI Insights Component" >> "$REPORT_FILE"
  else
    echo "- ❌ AI Insights Component - MISSING" >> "$REPORT_FILE"
  fi
  
  if [ -d "${DEPLOY_DIR}/data/ai/prompts" ]; then
    PROMPT_COUNT=$(ls -1 "${DEPLOY_DIR}/data/ai/prompts" | wc -l | tr -d ' ')
    echo "- ✅ Prompt Templates (${PROMPT_COUNT} files)" >> "$REPORT_FILE"
  else
    echo "- ❌ Prompt Templates - MISSING" >> "$REPORT_FILE"
  fi
  
  # Check for synthetic insights
  if [ -d "${DEPLOY_DIR}/data/ai/insights" ]; then
    INSIGHT_COUNT=$(ls -1 "${DEPLOY_DIR}/data/ai/insights" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$INSIGHT_COUNT" -gt 0 ]; then
      echo "- ✅ Synthetic Insights (${INSIGHT_COUNT} files)" >> "$REPORT_FILE"
    else
      echo "- ⚠️ Synthetic Insights - No files found" >> "$REPORT_FILE"
    fi
  else
    echo "- ⚠️ Synthetic Insights - Directory not found" >> "$REPORT_FILE"
  fi
  
  echo -e "\n## Next Steps" >> "$REPORT_FILE"
  echo "1. Verify the dashboard is accessible at your deployment URL" >> "$REPORT_FILE"
  echo "2. Check that all components are loading correctly" >> "$REPORT_FILE"
  echo "3. If using synthetic data, verify that insights are displayed" >> "$REPORT_FILE"
  echo "4. For production, configure database access and disable synthetic data" >> "$REPORT_FILE"
  
  # Add Azure deployment information if applicable
  if [ ! -z "$AZURE_STATIC_WEB_APP_NAME" ]; then
    echo -e "\n## Azure Deployment" >> "$REPORT_FILE"
    echo "- **Static Web App:** ${AZURE_STATIC_WEB_APP_NAME}" >> "$REPORT_FILE"
    echo "- **URL:** https://${AZURE_STATIC_WEB_APP_NAME}.azurestaticapps.net" >> "$REPORT_FILE"
  fi
  
  log "Verification report generated: $REPORT_FILE"
}

# Main execution
log "Starting Client360 Dashboard deployment with AI integration..."

# Execute deployment steps
check_required_files
create_backup
load_environment
setup_ai_directories
verify_ai_components
setup_database
generate_synthetic_insights
deploy_dashboard
integrate_ai_to_dashboard
deploy_to_azure
generate_verification_report

log "Deployment completed successfully!"
log "Verification report: ${OUTPUT_DIR}/deployment_verification_${TIMESTAMP}.md"