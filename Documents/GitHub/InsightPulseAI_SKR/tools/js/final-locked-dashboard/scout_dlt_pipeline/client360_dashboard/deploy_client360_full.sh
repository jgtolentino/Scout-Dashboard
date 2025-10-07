#!/bin/bash

# deploy_client360_full.sh
# Comprehensive deployment script for Client360 Dashboard that includes:
# - Diff-aware deployment approach
# - LLM integration (Azure OpenAI)
# - Parquet file support for synthetic data
# - Data toggle functionality
# - Verification steps

set -e  # Exit on any error

# Set script to be verbose
set -x

# Configuration
VERSION="2.4.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/full_deploy_${TIMESTAMP}.log"
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
STORAGE_ACCOUNT="tbwaclient360sa"
SOURCE_DIR="./deploy_v2.3.2"
AZURE_OPENAI_CONFIG="./data/ai/config/azure_openai_config.json"
PARQUET_DIR="./data/synthetic"
API_KEY_FILE=".azure_deploy_key"
LAST_DEPLOY_SHA_FILE=".last_deploy_sha"
COMPONENT_CHANGED=""

# Create required directories
mkdir -p logs
mkdir -p reports
mkdir -p output
mkdir -p $(dirname "$AZURE_OPENAI_CONFIG")
mkdir -p "$PARQUET_DIR"
mkdir -p "$PARQUET_DIR/json"

# Display banner
echo "╔════════════════════════════════════════════════════════════╗" | tee -a "$DEPLOYMENT_LOG"
echo "║               CLIENT360 DASHBOARD DEPLOYMENT               ║" | tee -a "$DEPLOYMENT_LOG"
echo "║                       VERSION $VERSION                      ║" | tee -a "$DEPLOYMENT_LOG"
echo "╚════════════════════════════════════════════════════════════╝" | tee -a "$DEPLOYMENT_LOG"
echo "" | tee -a "$DEPLOYMENT_LOG"
echo "🕒 Deployment started at: $(date)" | tee -a "$DEPLOYMENT_LOG"
echo "📝 Logging to: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
echo "" | tee -a "$DEPLOYMENT_LOG"

# Process command line arguments
FORCE=false
SKIP_VERIFICATION=false
SKIP_OPENAI=false
SKIP_PARQUET=false
LOCAL_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE=true
      shift
      ;;
    --skip-verification)
      SKIP_VERIFICATION=true
      shift
      ;;
    --skip-openai)
      SKIP_OPENAI=true
      shift
      ;;
    --skip-parquet)
      SKIP_PARQUET=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1" | tee -a "$DEPLOYMENT_LOG"
      echo "Usage: $0 [--force] [--skip-verification] [--skip-openai] [--skip-parquet]" | tee -a "$DEPLOYMENT_LOG"
      exit 1
      ;;
  esac
done

# Check for required tools and dependencies
echo "🔍 Checking dependencies..." | tee -a "$DEPLOYMENT_LOG"

for cmd in az jq zip unzip curl; do
  if ! command -v $cmd &> /dev/null; then
    echo "❌ Required command '$cmd' is not installed or not in PATH" | tee -a "$DEPLOYMENT_LOG"
    echo "   Please install $cmd before proceeding" | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
done

# Check for Python but don't exit if missing
if ! command -v python &> /dev/null; then
  echo "⚠️ Python is not installed or not in PATH" | tee -a "$DEPLOYMENT_LOG"
  echo "   Parquet conversion features will be disabled" | tee -a "$DEPLOYMENT_LOG"
  SKIP_PARQUET=true
fi

# Check Azure CLI login status but create a LOCAL_ONLY mode if not available
if ! az account show &> /dev/null; then
  echo "⚠️ Azure CLI login not detected. Running in LOCAL_ONLY mode." | tee -a "$DEPLOYMENT_LOG"
  echo "   The deployment package will be created but not deployed to Azure." | tee -a "$DEPLOYMENT_LOG"
  LOCAL_ONLY=true
else
  LOCAL_ONLY=false
fi

# STEP 1: Setup Azure OpenAI Configuration
if [ "$SKIP_OPENAI" = false ]; then
  echo "🧠 Setting up Azure OpenAI configuration..." | tee -a "$DEPLOYMENT_LOG"
  
  # Create or update Azure OpenAI config file
  if [ ! -f "$AZURE_OPENAI_CONFIG" ]; then
    echo "📝 Creating Azure OpenAI configuration template..." | tee -a "$DEPLOYMENT_LOG"
    
    # Create a template Azure OpenAI config
    cat > "$AZURE_OPENAI_CONFIG" << EOL
{
    "endpoint": "https://your-azure-openai-resource.openai.azure.com/",
    "apiKey": "your-azure-openai-api-key",
    "apiVersion": "2023-05-15",
    "deploymentName": "tbwa-gpt4-turbo",
    "maxTokens": 800,
    "temperature": 0.7,
    "enabled": true
}
EOL
    echo "✅ Azure OpenAI config template created at $AZURE_OPENAI_CONFIG" | tee -a "$DEPLOYMENT_LOG"
    echo "⚠️ IMPORTANT: Update the config with your actual Azure OpenAI credentials before using." | tee -a "$DEPLOYMENT_LOG"
  else
    echo "✅ Using existing Azure OpenAI configuration" | tee -a "$DEPLOYMENT_LOG"
  fi
  
  # Check if OpenAI configuration has default values and warn user
  if [ -f "$AZURE_OPENAI_CONFIG" ]; then
    if grep -q "your-azure-openai" "$AZURE_OPENAI_CONFIG"; then
      echo "⚠️ WARNING: Azure OpenAI configuration contains default placeholder values" | tee -a "$DEPLOYMENT_LOG"
      echo "   You must update $AZURE_OPENAI_CONFIG with your actual Azure OpenAI credentials" | tee -a "$DEPLOYMENT_LOG"
    fi
  fi
  
  COMPONENT_CHANGED="${COMPONENT_CHANGED}azure-openai,"
fi

# STEP 2: Setup Parquet Support
if [ "$SKIP_PARQUET" = false ]; then
  echo "📊 Setting up Parquet file support for synthetic data..." | tee -a "$DEPLOYMENT_LOG"
  
  # Check if any Parquet files exist
  PARQUET_FILES=$(find "$PARQUET_DIR" -name "*.parquet" 2>/dev/null)
  
  if [ -z "$PARQUET_FILES" ]; then
    echo "📝 No Parquet files found. Creating sample data..." | tee -a "$DEPLOYMENT_LOG"
    
    # Create sample store data JSON
    cat > "$PARQUET_DIR/json/stores.json" << EOL
[
  {
    "id": "S001",
    "name": "Manila Central Store",
    "region": "NCR",
    "storeType": "company-owned",
    "performance": 92,
    "sales": 325680,
    "stockouts": 5,
    "uptime": 98,
    "openDate": "2022-08-15",
    "lastRestock": "2025-05-15",
    "inventoryHealth": 95,
    "avgTraffic": 1250,
    "avgBasketSize": 260.54,
    "address": "123 Rizal Avenue, Manila",
    "manager": "Maria Santos",
    "contact": "+63 919 123 4567"
  },
  {
    "id": "S002",
    "name": "Cagayan de Oro Store",
    "region": "Mindanao",
    "storeType": "franchise",
    "performance": 85,
    "sales": 215430,
    "stockouts": 18,
    "uptime": 94,
    "openDate": "2023-01-08",
    "lastRestock": "2025-05-12",
    "inventoryHealth": 78,
    "avgTraffic": 820,
    "avgBasketSize": 381.07,
    "address": "456 Corrales Ave, Cagayan de Oro",
    "manager": "Paolo Mendoza",
    "contact": "+63 918 765 4321"
  }
]
EOL

    # Create sample sales data JSON
    cat > "$PARQUET_DIR/json/sales.json" << EOL
[
  {
    "storeId": "S001",
    "date": "2025-05-01",
    "totalSales": 15340,
    "transactions": 78,
    "topSellingCategory": "Beverage",
    "categoryBreakdown": {
      "Beverage": 5420,
      "Snacks": 4230,
      "Household": 3100,
      "Personal Care": 2590
    }
  },
  {
    "storeId": "S001",
    "date": "2025-05-02",
    "totalSales": 16750,
    "transactions": 85,
    "topSellingCategory": "Snacks",
    "categoryBreakdown": {
      "Beverage": 4980,
      "Snacks": 5340,
      "Household": 3200,
      "Personal Care": 3230
    }
  },
  {
    "storeId": "S002",
    "date": "2025-05-01",
    "totalSales": 12450,
    "transactions": 53,
    "topSellingCategory": "Beverage",
    "categoryBreakdown": {
      "Beverage": 4500,
      "Snacks": 3200,
      "Household": 2350,
      "Personal Care": 2400
    }
  }
]
EOL

    # Create sample AI insights JSON
    cat > "$PARQUET_DIR/json/ai_insights.json" << EOL
[
  {
    "id": "SIM-001",
    "type": "sales_performance",
    "storeId": "S001",
    "title": "Sales Growth Opportunity",
    "content": "Store S001 shows 15% growth potential in snack category based on recent customer traffic patterns.",
    "date": "2025-05-15",
    "category": "growth",
    "confidence": 0.89,
    "isSynthetic": true
  },
  {
    "id": "SIM-002",
    "type": "brand_analysis",
    "storeId": "S001",
    "title": "Brand Loyalty Insight",
    "content": "Top 3 brands by customer loyalty are Brand A (87%), Brand B (76%), and Brand C (68%).",
    "date": "2025-05-15",
    "category": "brand",
    "confidence": 0.92,
    "isSynthetic": true
  },
  {
    "id": "SIM-003",
    "type": "recommendation",
    "storeId": "S002",
    "title": "Inventory Optimization",
    "content": "Increasing stock of category B products by 15% could reduce stockouts and improve customer satisfaction.",
    "date": "2025-05-14",
    "category": "inventory",
    "confidence": 0.85,
    "isSynthetic": true
  }
]
EOL

    # Create Python conversion script
    cat > "$PARQUET_DIR/convert_json_to_parquet.py" << EOL
#!/usr/bin/env python3
"""
Convert JSON files to Parquet format for Client360 Dashboard
"""
import os
import json
import pandas as pd

def convert_file(json_file, parquet_file):
    print(f"Converting {json_file} to {parquet_file}")
    try:
        # Read JSON file
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Write to Parquet
        df.to_parquet(parquet_file, engine='pyarrow', compression='snappy')
        print(f"✅ Successfully converted {json_file} to {parquet_file}")
        return True
    except Exception as e:
        print(f"❌ Error converting {json_file}: {str(e)}")
        return False

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_dir = os.path.join(base_dir, 'json')
    
    # Check if json directory exists
    if not os.path.isdir(json_dir):
        print(f"❌ JSON directory {json_dir} not found")
        return
    
    # Convert each JSON file
    success_count = 0
    error_count = 0
    
    for filename in os.listdir(json_dir):
        if filename.endswith('.json'):
            json_file = os.path.join(json_dir, filename)
            parquet_file = os.path.join(base_dir, filename.replace('.json', '.parquet'))
            
            if convert_file(json_file, parquet_file):
                success_count += 1
            else:
                error_count += 1
    
    print(f"\nConversion complete: {success_count} successful, {error_count} failed")

if __name__ == "__main__":
    main()
EOL

    # Make the conversion script executable
    chmod +x "$PARQUET_DIR/convert_json_to_parquet.py"
    
    # Check for pandas and pyarrow installation
    if python -c "import pandas, pyarrow" 2>/dev/null; then
      echo "🐍 Running Parquet conversion script..." | tee -a "$DEPLOYMENT_LOG"
      python "$PARQUET_DIR/convert_json_to_parquet.py" | tee -a "$DEPLOYMENT_LOG"
    else
      echo "⚠️ Python packages 'pandas' and 'pyarrow' are required for JSON to Parquet conversion" | tee -a "$DEPLOYMENT_LOG"
      echo "   Please install with: pip install pandas pyarrow" | tee -a "$DEPLOYMENT_LOG"
      echo "   Then run: python $PARQUET_DIR/convert_json_to_parquet.py" | tee -a "$DEPLOYMENT_LOG"
      
      # Create fallback JSON files instead of Parquet
      echo "📄 Creating fallback JSON files..." | tee -a "$DEPLOYMENT_LOG"
      mkdir -p "$PARQUET_DIR/fallback"
      cp "$PARQUET_DIR/json/"*.json "$PARQUET_DIR/fallback/" 2>/dev/null
    fi
  else
    echo "✅ Found existing Parquet files in $PARQUET_DIR:" | tee -a "$DEPLOYMENT_LOG"
    ls -la "$PARQUET_DIR"/*.parquet | tee -a "$DEPLOYMENT_LOG"
  fi
  
  COMPONENT_CHANGED="${COMPONENT_CHANGED}parquet-data,"
fi

# STEP 3: Setup data toggle functionality
echo "🔄 Setting up data toggle functionality..." | tee -a "$DEPLOYMENT_LOG"

# Check and add data toggle functionality
DASHBOARD_JS="$SOURCE_DIR/js/dashboard.js"
AI_INSIGHTS_JS="$SOURCE_DIR/js/components/ai_insights_component.js"

# Create data toggle folders if needed
mkdir -p "$SOURCE_DIR/js/components"
mkdir -p "$SOURCE_DIR/js/utils"

if [ -f "$DASHBOARD_JS" ]; then
  # Check if data toggle already exists
  if grep -q "dataSourceToggle" "$DASHBOARD_JS"; then
    echo "✅ Data toggle functionality already integrated in dashboard.js" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "🔄 Adding data toggle functionality to dashboard.js..." | tee -a "$DEPLOYMENT_LOG"
    
    # Create backup
    cp "$DASHBOARD_JS" "${DASHBOARD_JS}.bak.${TIMESTAMP}"
    
    # Add data toggle initialization to dashboard.js
    # Insert before the closing of document ready function
    sed -i.bak '$(document).ready(function() {/a\
    // Initialize data source toggle\
    initializeDataSourceToggle();\
    ' "$DASHBOARD_JS"
    
    # Add initializeDataSourceToggle function
    cat >> "$DASHBOARD_JS" << EOL

/**
 * Initializes the data source toggle functionality
 * Allows switching between live (Azure OpenAI) and synthetic (Parquet) data
 */
function initializeDataSourceToggle() {
  const toggleContainer = document.getElementById('dataSourceToggle');
  if (!toggleContainer) return;
  
  const liveBtn = document.getElementById('liveDataBtn');
  const syntheticBtn = document.getElementById('syntheticDataBtn');
  
  // Set default data source (from localStorage or default to synthetic)
  const currentSource = localStorage.getItem('dataSource') || 'synthetic';
  setDataSource(currentSource);
  
  // Update UI to reflect current data source
  updateDataSourceUI(currentSource);
  
  // Add event listeners
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      setDataSource('live');
      updateDataSourceUI('live');
    });
  }
  
  if (syntheticBtn) {
    syntheticBtn.addEventListener('click', () => {
      setDataSource('synthetic');
      updateDataSourceUI('synthetic');
    });
  }
}

/**
 * Sets the current data source and stores in localStorage
 * @param {string} source - 'live' or 'synthetic'
 */
function setDataSource(source) {
  localStorage.setItem('dataSource', source);
  window.DATA_SOURCE = source;
  
  // Dispatch custom event that components can listen for
  const event = new CustomEvent('dataSourceChanged', { detail: { source } });
  document.dispatchEvent(event);
}

/**
 * Updates UI elements to reflect the current data source
 * @param {string} source - 'live' or 'synthetic'
 */
function updateDataSourceUI(source) {
  const liveBtn = document.getElementById('liveDataBtn');
  const syntheticBtn = document.getElementById('syntheticDataBtn');
  const dataSourceBadges = document.querySelectorAll('.data-source-badge');
  
  // Update toggle buttons
  if (liveBtn) liveBtn.classList.toggle('active', source === 'live');
  if (syntheticBtn) syntheticBtn.classList.toggle('active', source === 'synthetic');
  
  // Update badges
  dataSourceBadges.forEach(badge => {
    badge.textContent = source === 'live' ? 'Live Data' : 'Simulated Data';
    badge.classList.toggle('badge-primary', source === 'live');
    badge.classList.toggle('badge-secondary', source === 'synthetic');
  });
}
EOL

    echo "✅ Data toggle functionality added to dashboard.js" | tee -a "$DEPLOYMENT_LOG"
  fi
else
  echo "⚠️ dashboard.js not found at $DASHBOARD_JS" | tee -a "$DEPLOYMENT_LOG"
  echo "   Creating a new dashboard.js file with data toggle functionality..." | tee -a "$DEPLOYMENT_LOG"
  
  mkdir -p "$(dirname "$DASHBOARD_JS")"
  
  # Create new dashboard.js with data toggle functionality
  cat > "$DASHBOARD_JS" << EOL
/**
 * Client360 Dashboard - Main JavaScript
 * Version $VERSION
 */

$(document).ready(function() {
  console.log('Client360 Dashboard initialized');
  
  // Initialize data source toggle
  initializeDataSourceToggle();
  
  // Other initializations can go here
});

/**
 * Initializes the data source toggle functionality
 * Allows switching between live (Azure OpenAI) and synthetic (Parquet) data
 */
function initializeDataSourceToggle() {
  const toggleContainer = document.getElementById('dataSourceToggle');
  if (!toggleContainer) return;
  
  const liveBtn = document.getElementById('liveDataBtn');
  const syntheticBtn = document.getElementById('syntheticDataBtn');
  
  // Set default data source (from localStorage or default to synthetic)
  const currentSource = localStorage.getItem('dataSource') || 'synthetic';
  setDataSource(currentSource);
  
  // Update UI to reflect current data source
  updateDataSourceUI(currentSource);
  
  // Add event listeners
  if (liveBtn) {
    liveBtn.addEventListener('click', () => {
      setDataSource('live');
      updateDataSourceUI('live');
    });
  }
  
  if (syntheticBtn) {
    syntheticBtn.addEventListener('click', () => {
      setDataSource('synthetic');
      updateDataSourceUI('synthetic');
    });
  }
}

/**
 * Sets the current data source and stores in localStorage
 * @param {string} source - 'live' or 'synthetic'
 */
function setDataSource(source) {
  localStorage.setItem('dataSource', source);
  window.DATA_SOURCE = source;
  
  // Dispatch custom event that components can listen for
  const event = new CustomEvent('dataSourceChanged', { detail: { source } });
  document.dispatchEvent(event);
}

/**
 * Updates UI elements to reflect the current data source
 * @param {string} source - 'live' or 'synthetic'
 */
function updateDataSourceUI(source) {
  const liveBtn = document.getElementById('liveDataBtn');
  const syntheticBtn = document.getElementById('syntheticDataBtn');
  const dataSourceBadges = document.querySelectorAll('.data-source-badge');
  
  // Update toggle buttons
  if (liveBtn) liveBtn.classList.toggle('active', source === 'live');
  if (syntheticBtn) syntheticBtn.classList.toggle('active', source === 'synthetic');
  
  // Update badges
  dataSourceBadges.forEach(badge => {
    badge.textContent = source === 'live' ? 'Live Data' : 'Simulated Data';
    badge.classList.toggle('badge-primary', source === 'live');
    badge.classList.toggle('badge-secondary', source === 'synthetic');
  });
}
EOL

  echo "✅ Created new dashboard.js with data toggle functionality" | tee -a "$DEPLOYMENT_LOG"
fi

# Create or update AI insights component with data source toggle
if [ ! -f "$AI_INSIGHTS_JS" ]; then
  echo "🧠 Creating AI insights component with data source toggle support..." | tee -a "$DEPLOYMENT_LOG"
  
  mkdir -p "$(dirname "$AI_INSIGHTS_JS")"
  
  # Create AI insights component
  cat > "$AI_INSIGHTS_JS" << EOL
/**
 * Client360 Dashboard - AI Insights Component
 * Version $VERSION
 */

// Configuration
const AI_CONFIG = {
  // Environment-specific settings
  SYNTHETIC_DATA_ENABLED: true, // Always have synthetic data as a fallback
  SYNTHETIC_DATA_PATH: '/data/synthetic/ai_insights.parquet',
  AZURE_OPENAI_ENABLED: true,
  
  // General settings
  INSIGHTS_PER_PAGE: 3,
  REFRESH_INTERVAL_MINUTES: 30
};

// Cache for data
const AI_INSIGHTS_CACHE = {
  live: null,
  synthetic: null,
  lastFetch: {
    live: null,
    synthetic: null
  }
};

/**
 * Initialize the AI Insights component
 */
function initializeAIInsights() {
  console.log('Initializing AI Insights component');
  
  // Listen for data source changes
  document.addEventListener('dataSourceChanged', handleDataSourceChange);
  
  // Get the current data source or default to synthetic
  const dataSource = window.DATA_SOURCE || localStorage.getItem('dataSource') || 'synthetic';
  
  // Initial load of insights
  loadInsights(dataSource);
  
  // Set up filter handlers
  setupInsightFilters();
}

/**
 * Handle data source change event
 * @param {CustomEvent} event - Data source change event
 */
function handleDataSourceChange(event) {
  const { source } = event.detail;
  console.log('Data source changed to: ' + source);
  
  // Load insights for the new data source
  loadInsights(source);
}

/**
 * Load insights data based on current data source
 * @param {string} source - 'live' or 'synthetic'
 */
function loadInsights(source) {
  const container = document.getElementById('aiInsightsContainer');
  if (!container) return;
  
  // Show loading state
  container.innerHTML = '<div class="loading">Loading AI insights...</div>';
  
  // Check if we have cached data that's still fresh
  const now = new Date();
  const cacheTTL = AI_CONFIG.REFRESH_INTERVAL_MINUTES * 60 * 1000; // in ms
  
  if (
    AI_INSIGHTS_CACHE[source] && 
    AI_INSIGHTS_CACHE.lastFetch[source] && 
    (now - AI_INSIGHTS_CACHE.lastFetch[source]) < cacheTTL
  ) {
    // Use cached data
    renderInsights(AI_INSIGHTS_CACHE[source], source);
    return;
  }
  
  // Load fresh data
  if (source === 'live' && AI_CONFIG.AZURE_OPENAI_ENABLED) {
    // Load from Azure OpenAI
    fetch('/api/ai-insights')
      .then(response => response.json())
      .then(data => {
        AI_INSIGHTS_CACHE.live = data;
        AI_INSIGHTS_CACHE.lastFetch.live = now;
        renderInsights(data, 'live');
      })
      .catch(error => {
        console.error('Error fetching live AI insights:', error);
        // Fallback to synthetic data
        loadInsights('synthetic');
      });
  } else {
    // Load synthetic data from Parquet files
    if (AI_CONFIG.SYNTHETIC_DATA_ENABLED) {
      // In a real implementation, we'd have a proper Parquet loader
      // For now, simulate with a JSON fetch
      fetch('/data/ai/insights/all_insights_latest.json')
        .then(response => response.json())
        .then(data => {
          // Add synthetic flag to all entries
          data = data.map(item => ({
            ...item,
            isSynthetic: true
          }));
          
          AI_INSIGHTS_CACHE.synthetic = data;
          AI_INSIGHTS_CACHE.lastFetch.synthetic = now;
          renderInsights(data, 'synthetic');
        })
        .catch(error => {
          console.error('Error fetching synthetic AI insights:', error);
          container.innerHTML = '<div class="error">Failed to load AI insights</div>';
        });
    } else {
      container.innerHTML = '<div class="error">No data source available for AI insights</div>';
    }
  }
}

/**
 * Render insights to the container
 * @param {Array} insights - Array of insight objects
 * @param {string} source - Data source ('live' or 'synthetic')
 */
function renderInsights(insights, source) {
  const container = document.getElementById('aiInsightsContainer');
  if (!container) return;
  
  if (!insights || insights.length === 0) {
    container.innerHTML = '<div class="empty-state">No AI insights available</div>';
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Create data source badge
  const badge = document.createElement('div');
  badge.className = 'data-source-badge ' + (source === 'live' ? 'badge-primary' : 'badge-secondary');
  badge.textContent = source === 'live' ? 'Live Data' : 'Simulated Data';
  container.appendChild(badge);
  
  // Create insights container
  const insightsElement = document.createElement('div');
  insightsElement.className = 'insights-grid';
  
  // Add insights cards
  insights.forEach(insight => {
    const card = createInsightCard(insight);
    insightsElement.appendChild(card);
  });
  
  container.appendChild(insightsElement);
}

/**
 * Create an insight card element
 * @param {Object} insight - Insight data object
 * @return {HTMLElement} - Card element
 */
function createInsightCard(insight) {
  const card = document.createElement('div');
  card.className = 'insight-card ' + insight.type;
  card.dataset.category = insight.category || 'general';
  
  // Card header
  const header = document.createElement('div');
  header.className = 'insight-header';
  
  const title = document.createElement('h3');
  title.textContent = insight.title;
  header.appendChild(title);
  
  const type = document.createElement('span');
  type.className = 'insight-type';
  type.textContent = formatInsightType(insight.type);
  header.appendChild(type);
  
  card.appendChild(header);
  
  // Card content
  const content = document.createElement('div');
  content.className = 'insight-content';
  content.textContent = insight.content;
  card.appendChild(content);
  
  // Card footer
  const footer = document.createElement('div');
  footer.className = 'insight-footer';
  
  const date = document.createElement('span');
  date.className = 'insight-date';
  date.textContent = formatDate(insight.date);
  footer.appendChild(date);
  
  if (insight.confidence) {
    const confidence = document.createElement('span');
    confidence.className = 'insight-confidence';
    confidence.textContent = 'Confidence: ' + Math.round(insight.confidence * 100) + '%';
    footer.appendChild(confidence);
  }
  
  card.appendChild(footer);
  
  // Make card expandable
  card.addEventListener('click', () => {
    card.classList.toggle('expanded');
  });
  
  return card;
}

/**
 * Format insight type for display
 * @param {string} type - Raw insight type
 * @return {string} - Formatted insight type
 */
function formatInsightType(type) {
  if (!type) return 'General Insight';
  
  switch (type) {
    case 'sales_performance':
      return 'Sales Performance';
    case 'brand_analysis':
      return 'Brand Analysis';
    case 'recommendation':
      return 'Recommendation';
    default:
      return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
}

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @return {string} - Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date';
  
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Set up insight filter handlers
 */
function setupInsightFilters() {
  const filterSelect = document.getElementById('insightTypeFilter');
  if (!filterSelect) return;
  
  filterSelect.addEventListener('change', event => {
    const selectedType = event.target.value;
    const cards = document.querySelectorAll('.insight-card');
    
    cards.forEach(card => {
      if (selectedType === 'all' || card.classList.contains(selectedType)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAIInsights);
EOL

  echo "✅ Created AI insights component with data source toggle support" | tee -a "$DEPLOYMENT_LOG"
else
  echo "✅ Using existing AI insights component: $AI_INSIGHTS_JS" | tee -a "$DEPLOYMENT_LOG"
  
  # Check if data source toggle is already integrated
  if grep -q "SYNTHETIC_DATA_ENABLED\|dataSourceChanged" "$AI_INSIGHTS_JS"; then
    echo "✅ Data source toggle already integrated in AI insights component" | tee -a "$DEPLOYMENT_LOG"
  else
    echo "🔄 Updating AI insights component with data source toggle support..." | tee -a "$DEPLOYMENT_LOG"
    
    # Create backup
    cp "$AI_INSIGHTS_JS" "${AI_INSIGHTS_JS}.bak.${TIMESTAMP}"
    
    # This is a more complex change, so we check if there's a specific setup pattern
    # If we can't safely patch, we'll just notify
    echo "⚠️ AI insights component needs manual update to support data toggle" | tee -a "$DEPLOYMENT_LOG"
    echo "   Please modify $AI_INSIGHTS_JS to listen for 'dataSourceChanged' events" | tee -a "$DEPLOYMENT_LOG"
    echo "   and load data from either Azure OpenAI or Parquet files based on source" | tee -a "$DEPLOYMENT_LOG"
  fi
fi

COMPONENT_CHANGED="${COMPONENT_CHANGED}data-toggle,"

# STEP 4: Run the diff-aware deployment
echo "🚀 Preparing for diff-aware deployment..." | tee -a "$DEPLOYMENT_LOG"

# Check if force deploy is enabled
if [ "$FORCE" = "true" ]; then
  echo "⚠️ Force deployment enabled - will deploy all files regardless of changes" | tee -a "$DEPLOYMENT_LOG"
  DEPLOY_FLAGS="--force"
else
  DEPLOY_FLAGS=""
fi

# Add integration flags based on what we've set up
if [ "$SKIP_OPENAI" = "false" ]; then
  DEPLOY_FLAGS="$DEPLOY_FLAGS --integrate-azure-openai"
fi

if [ "$SKIP_PARQUET" = "false" ]; then
  DEPLOY_FLAGS="$DEPLOY_FLAGS --integrate-parquet"
fi

# Always enable data toggle
DEPLOY_FLAGS="$DEPLOY_FLAGS --with-data-toggle"

# Run the diff-aware deployment
echo "🚀 Running diff-aware deployment..." | tee -a "$DEPLOYMENT_LOG"

# Check if we're in LOCAL_ONLY mode
if [ "$LOCAL_ONLY" = true ]; then
  echo "🏠 Running in LOCAL_ONLY mode - skipping Azure deployment" | tee -a "$DEPLOYMENT_LOG"
  
  # Create local package instead
  DEPLOY_PACKAGE="output/client360_v${VERSION}_local_${TIMESTAMP}.zip"
  echo "📦 Creating local deployment package: $DEPLOY_PACKAGE" | tee -a "$DEPLOYMENT_LOG"
  mkdir -p output
  
  # Create package with all necessary files
  echo "📦 Adding source files to package..." | tee -a "$DEPLOYMENT_LOG"
  if [ -d "$SOURCE_DIR" ]; then
    zip -r "$DEPLOY_PACKAGE" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" -x "*/cypress/*" | tee -a "$DEPLOYMENT_LOG"
  else
    # Create a minimal deployment directory structure
    echo "⚠️ Source directory not found, creating minimal package" | tee -a "$DEPLOYMENT_LOG"
    mkdir -p deploy/js/components
    touch deploy/index.html
    zip -r "$DEPLOY_PACKAGE" deploy/* | tee -a "$DEPLOYMENT_LOG"
    rm -rf deploy
  fi
  
  # Add LLM integration files
  echo "📦 Adding LLM integration files..." | tee -a "$DEPLOYMENT_LOG"
  mkdir -p data/ai/config
  if [ "$SKIP_OPENAI" = false ]; then
    cp -f "$AZURE_OPENAI_CONFIG" data/ai/config/ 2>/dev/null || echo "{}" > data/ai/config/azure_openai_config.json
  fi
  zip -r "$DEPLOY_PACKAGE" data | tee -a "$DEPLOYMENT_LOG"
  
  echo "✅ Local package created: $DEPLOY_PACKAGE" | tee -a "$DEPLOYMENT_LOG"
  DEPLOY_STATUS=0
else
  # Execute the deployment with all flags
  if [ -f "./patch-deploy-diff-aware.sh" ]; then
    echo "🚀 Executing: ./patch-deploy-diff-aware.sh $DEPLOY_FLAGS" | tee -a "$DEPLOYMENT_LOG"
    ./patch-deploy-diff-aware.sh $DEPLOY_FLAGS | tee -a "$DEPLOYMENT_LOG"
    DEPLOY_STATUS=$?
  else
    echo "❌ patch-deploy-diff-aware.sh not found! Falling back to direct deployment..." | tee -a "$DEPLOYMENT_LOG"
    
    # Fallback to direct deployment using the deploy_v2.3.2_to_azure.sh script
    if [ -f "./deploy_v2.3.2_to_azure.sh" ]; then
      echo "🚀 Falling back to: ./deploy_v2.3.2_to_azure.sh" | tee -a "$DEPLOYMENT_LOG"
      ./deploy_v2.3.2_to_azure.sh | tee -a "$DEPLOYMENT_LOG"
      DEPLOY_STATUS=$?
    else
      echo "❌ No deployment scripts found! Creating a custom direct deployment..." | tee -a "$DEPLOYMENT_LOG"
      
      # Get the API key from Azure
      echo "🔑 Retrieving deployment key from Azure..." | tee -a "$DEPLOYMENT_LOG"
      API_KEY=$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query 'properties.apiKey' -o tsv)
      
      if [ -z "$API_KEY" ]; then
        echo "⚠️ Failed to retrieve API key. Checking if key file exists..." | tee -a "$DEPLOYMENT_LOG"
        
        # Check if we have the API key stored locally
        if [ ! -f "$API_KEY_FILE" ]; then
          echo "⚠️ Azure deployment key not found. Please create a file named $API_KEY_FILE containing your Static Web App deployment key." | tee -a "$DEPLOYMENT_LOG"
          echo "To retrieve your deployment key, run: az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP --query 'properties.apiKey' -o tsv"
          exit 1
        fi
        
        # Read the API key from the file
        API_KEY=$(cat "$API_KEY_FILE")
      else
        # Store the API key for future use
        echo "$API_KEY" > "$API_KEY_FILE"
        echo "✅ API key retrieved and stored for future use." | tee -a "$DEPLOYMENT_LOG"
      fi
      
      # Create a deployment package
      echo "📦 Creating deployment package..." | tee -a "$DEPLOYMENT_LOG"
      DEPLOY_ZIP="output/client360_v${VERSION}_deploy_${TIMESTAMP}.zip"
      mkdir -p output
      
      # Add source directory
      echo "📦 Adding source directory to package..." | tee -a "$DEPLOYMENT_LOG"
      zip -r "$DEPLOY_ZIP" "$SOURCE_DIR"/* -x "*/node_modules/*" -x "*/\.*" -x "*/cypress/*" | tee -a "$DEPLOYMENT_LOG"
      
      # Add Azure OpenAI config if enabled
      if [ "$SKIP_OPENAI" = "false" ] && [ -f "$AZURE_OPENAI_CONFIG" ]; then
        echo "📦 Adding Azure OpenAI configuration to package..." | tee -a "$DEPLOYMENT_LOG"
        
        # Create data/ai/config path inside the zip
        mkdir -p data/ai/config
        cp "$AZURE_OPENAI_CONFIG" data/ai/config/
        zip -r "$DEPLOY_ZIP" data/ai/config/* | tee -a "$DEPLOYMENT_LOG"
        rm -rf data/ai
      fi
      
      # Add Parquet files if enabled
      if [ "$SKIP_PARQUET" = "false" ]; then
        echo "📦 Adding Parquet files to package..." | tee -a "$DEPLOYMENT_LOG"
        
        # Find and add all parquet files
        PARQUET_FILES=$(find "$PARQUET_DIR" -name "*.parquet" 2>/dev/null)
        if [ -n "$PARQUET_FILES" ]; then
          mkdir -p data/synthetic
          cp "$PARQUET_DIR"/*.parquet data/synthetic/ 2>/dev/null
          zip -r "$DEPLOY_ZIP" data/synthetic/* | tee -a "$DEPLOYMENT_LOG"
          rm -rf data/synthetic
        else
          echo "⚠️ No Parquet files found to include in package" | tee -a "$DEPLOYMENT_LOG"
        fi
      fi
      
      # Deploy using Azure CLI
      echo "🚀 Deploying to Azure Static Web App: $APP_NAME..." | tee -a "$DEPLOYMENT_LOG"
      
      az staticwebapp deploy \
          --name "$APP_NAME" \
          --resource-group "$RESOURCE_GROUP" \
          --source "$DEPLOY_ZIP" \
          --api-key "$API_KEY" | tee -a "$DEPLOYMENT_LOG"
      
      DEPLOY_STATUS=$?
    fi
  fi
fi

# STEP 5: Verify deployment if it succeeded
if [ $DEPLOY_STATUS -ne 0 ]; then
  echo "❌ Deployment failed with status code $DEPLOY_STATUS!" | tee -a "$DEPLOYMENT_LOG"
  echo "   Please check the logs above for errors." | tee -a "$DEPLOYMENT_LOG"
  exit $DEPLOY_STATUS
fi

if [ "$SKIP_VERIFICATION" = "true" ]; then
  echo "⏩ Skipping verification as requested" | tee -a "$DEPLOYMENT_LOG"
else
  echo "🧪 Verifying deployment..." | tee -a "$DEPLOYMENT_LOG"
  
  if [ "$LOCAL_ONLY" = "true" ]; then
    echo "🏠 Running in LOCAL_ONLY mode - skipping Azure verification" | tee -a "$DEPLOYMENT_LOG"
    echo "📦 Verify the local package: output/client360_v${VERSION}_local_${TIMESTAMP}.zip" | tee -a "$DEPLOYMENT_LOG"
  else
    # Run verification script if available
    if [ -f "./verify_deployment.sh" ]; then
      echo "🧪 Executing: ./verify_deployment.sh --check-all" | tee -a "$DEPLOYMENT_LOG"
      ./verify_deployment.sh --check-all | tee -a "$DEPLOYMENT_LOG"
      VERIFY_STATUS=$?
      
      if [ $VERIFY_STATUS -ne 0 ]; then
        echo "⚠️ Verification failed with status code $VERIFY_STATUS" | tee -a "$DEPLOYMENT_LOG"
        echo "   Please check the verification log for details." | tee -a "$DEPLOYMENT_LOG"
      else
        echo "✅ Verification completed successfully" | tee -a "$DEPLOYMENT_LOG"
      fi
    else
      echo "⚠️ Verification script not found. Skipping verification." | tee -a "$DEPLOYMENT_LOG"
      
      # Get the URL of the deployed app
      echo "🔍 Getting deployment URL from Azure..." | tee -a "$DEPLOYMENT_LOG"
      if [ "$LOCAL_ONLY" = "false" ]; then
        DEPLOYMENT_URL=$(az staticwebapp show \
            --name "$APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --query "defaultHostname" -o tsv 2>/dev/null) || "Unknown URL"
        
        if [ -n "$DEPLOYMENT_URL" ]; then
          echo "🌐 Dashboard is available at: https://$DEPLOYMENT_URL" | tee -a "$DEPLOYMENT_LOG"
          echo "   Please verify the deployment manually by checking:" | tee -a "$DEPLOYMENT_LOG"
          echo "   - Dashboard loads correctly" | tee -a "$DEPLOYMENT_LOG"
          echo "   - AI Insights panel is displayed" | tee -a "$DEPLOYMENT_LOG"
          echo "   - Data toggle functionality works" | tee -a "$DEPLOYMENT_LOG"
          echo "   - Map component displays properly" | tee -a "$DEPLOYMENT_LOG"
        else
          echo "⚠️ Could not retrieve deployment URL" | tee -a "$DEPLOYMENT_LOG"
        fi
      fi
    fi
  fi
fi

# STEP 6: Generate deployment summary
echo "📝 Generating deployment summary..." | tee -a "$DEPLOYMENT_LOG"

# Get the URL of the deployed app if not in LOCAL_ONLY mode
if [ "$LOCAL_ONLY" = "false" ]; then
  DEPLOYMENT_URL=$(az staticwebapp show \
      --name "$APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query "defaultHostname" -o tsv 2>/dev/null) || "Unknown URL"
else
  DEPLOYMENT_URL="LOCAL_ONLY_MODE"
fi

DEPLOYMENT_RECORD="reports/full_deployment_v${VERSION}_${TIMESTAMP}.md"
mkdir -p reports

cat > "$DEPLOYMENT_RECORD" << EOL
# Client360 Dashboard Deployment Summary

## Deployment Details
- **Version:** ${VERSION}
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **URL:** ${DEPLOYMENT_URL:+https://$DEPLOYMENT_URL}
- **Deployment Log:** $DEPLOYMENT_LOG
- **Components Modified:** ${COMPONENT_CHANGED}
- **Mode:** $([ "$LOCAL_ONLY" = true ] && echo "LOCAL_ONLY (Package Creation)" || echo "AZURE (Full Deployment)")

## Integration Features
- **Azure OpenAI (Live Data):** $([ "$SKIP_OPENAI" = false ] && echo "✅ Integrated" || echo "⏺️ Skipped")
- **Parquet (Synthetic Data):** $([ "$SKIP_PARQUET" = false ] && echo "✅ Integrated" || echo "⏺️ Skipped")
- **Data Toggle Components:** ✅ Integrated
- **Diff-Aware Deployment:** $([ -f "./patch-deploy-diff-aware.sh" ] && [ "$LOCAL_ONLY" = false ] && echo "✅ Used" || echo "⏺️ Skipped")

## Verification Status
$([ "$SKIP_VERIFICATION" = false ] && [ -f "./verify_deployment.sh" ] && [ "$LOCAL_ONLY" = false ] && echo "✅ Verification completed" || echo "⏺️ Verification skipped")

## Post-Deployment Tasks
1. Update Azure OpenAI configuration with actual credentials:
   - Edit $AZURE_OPENAI_CONFIG if using placeholder values

2. Test the data toggle functionality:
   - Verify switching between "Live" and "Simulated" data sources
   - Confirm AI insights load correctly in both modes

3. Run comprehensive verification:
   \`\`\`bash
   ./verify_deployment.sh --check-all --url https://$DEPLOYMENT_URL
   \`\`\`

4. Set up automatic insights refresh if needed:
   \`\`\`bash
   # Using Pulser automation
   pulser run client360-ai-insights daily_insights
   \`\`\`

## Documentation
For more information, see:
- [Dashboard Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [AI Integration Guide](./data/README_AI_INTEGRATION.md)
- [Data Toggle Documentation](./README_DATA_TOGGLE.md)
EOL

echo "✅ Deployment summary generated: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"

# Final status
echo "" | tee -a "$DEPLOYMENT_LOG"
echo "╔════════════════════════════════════════════════════════════╗" | tee -a "$DEPLOYMENT_LOG"
if [ "$LOCAL_ONLY" = true ]; then
  echo "║              LOCAL PACKAGE CREATION: SUCCESS              ║" | tee -a "$DEPLOYMENT_LOG"
else
  echo "║                DEPLOYMENT STATUS: SUCCESS                 ║" | tee -a "$DEPLOYMENT_LOG"
fi
echo "╚════════════════════════════════════════════════════════════╝" | tee -a "$DEPLOYMENT_LOG"
echo "" | tee -a "$DEPLOYMENT_LOG"

if [ "$LOCAL_ONLY" = true ]; then
  echo "✅ Client360 Dashboard v$VERSION package created successfully!" | tee -a "$DEPLOYMENT_LOG"
  echo "📦 Package path: output/client360_v${VERSION}_local_${TIMESTAMP}.zip" | tee -a "$DEPLOYMENT_LOG"
else
  echo "✅ Client360 Dashboard v$VERSION deployed successfully!" | tee -a "$DEPLOYMENT_LOG"
  echo "🌐 Dashboard URL: https://$DEPLOYMENT_URL" | tee -a "$DEPLOYMENT_LOG"
fi

echo "📝 Deployment log: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
echo "📊 Deployment summary: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"
echo "" | tee -a "$DEPLOYMENT_LOG"
echo "🕒 Deployment completed at: $(date)" | tee -a "$DEPLOYMENT_LOG"