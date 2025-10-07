#!/bin/bash

# Deployment Verification Script for Client360 Dashboard v2.3.3
# Validates deployment integrity and data source functionality (Azure OpenAI & Parquet)

set -e  # Exit on any error

echo "🧪 Client360 Dashboard Deployment Verification starting..."

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
PARQUET_DIR="./data/synthetic"
AZURE_OPENAI_CONFIG="./data/ai/config/azure_openai_config.json"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERIFICATION_LOG="logs/verification_${TIMESTAMP}.log"
VERSION="2.3.3"

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p reports

# Parse command line arguments
URL=""
VERIFY_AZURE_OPENAI=false
VERIFY_PARQUET=false
VERIFY_DATA_TOGGLE=false
CHECK_ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      URL="$2"
      shift 2
      ;;
    --verify-azure-openai)
      VERIFY_AZURE_OPENAI=true
      shift
      ;;
    --verify-parquet)
      VERIFY_PARQUET=true
      shift
      ;;
    --verify-data-toggle)
      VERIFY_DATA_TOGGLE=true
      shift
      ;;
    --check-all)
      CHECK_ALL=true
      VERIFY_AZURE_OPENAI=true
      VERIFY_PARQUET=true
      VERIFY_DATA_TOGGLE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--url URL] [--verify-azure-openai] [--verify-parquet] [--verify-data-toggle] [--check-all]"
      exit 1
      ;;
  esac
done

# Get the URL of the deployed app if not provided
if [ -z "$URL" ]; then
    echo "🔍 Getting deployment URL from Azure..." | tee -a "$VERIFICATION_LOG"
    URL=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)
    
    if [ -z "$URL" ]; then
        echo "⚠️ Failed to get deployment URL from Azure. Please provide the URL with --url parameter." | tee -a "$VERIFICATION_LOG"
        exit 1
    fi
    
    # Add https:// prefix if not present
    if [[ "$URL" != http* ]]; then
        URL="https://$URL"
    fi
fi

echo "🌐 Verifying deployment at: $URL" | tee -a "$VERIFICATION_LOG"

# Verify basic connectivity
echo "🔍 Checking basic connectivity..." | tee -a "$VERIFICATION_LOG"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Basic connectivity check passed (HTTP $HTTP_STATUS)" | tee -a "$VERIFICATION_LOG"
else
    echo "❌ Basic connectivity check failed (HTTP $HTTP_STATUS)" | tee -a "$VERIFICATION_LOG"
    echo "Please verify the deployment was successful and the URL is correct." | tee -a "$VERIFICATION_LOG"
    exit 1
fi

# Verify required resources
echo "🔍 Verifying required resources..." | tee -a "$VERIFICATION_LOG"

# Check for Azure OpenAI configuration if requested
if [ "$VERIFY_AZURE_OPENAI" = true ]; then
    echo "🔍 Checking Azure OpenAI integration..." | tee -a "$VERIFICATION_LOG"
    
    if [ -f "$AZURE_OPENAI_CONFIG" ]; then
        echo "✅ Azure OpenAI config file exists" | tee -a "$VERIFICATION_LOG"
        
        # Validate the configuration file (basic JSON validation)
        if jq empty "$AZURE_OPENAI_CONFIG" 2>/dev/null; then
            echo "✅ Azure OpenAI config is valid JSON" | tee -a "$VERIFICATION_LOG"
            
            # Check if it has real credentials (not placeholders)
            OPENAI_ENDPOINT=$(jq -r '.endpoint' "$AZURE_OPENAI_CONFIG")
            OPENAI_API_KEY=$(jq -r '.apiKey' "$AZURE_OPENAI_CONFIG")
            
            if [[ "$OPENAI_ENDPOINT" == *"your-azure-openai-resource"* ]]; then
                echo "⚠️ Azure OpenAI endpoint is still using placeholder value" | tee -a "$VERIFICATION_LOG"
                echo "   Update the endpoint in $AZURE_OPENAI_CONFIG with your actual Azure OpenAI endpoint" | tee -a "$VERIFICATION_LOG"
            else
                echo "✅ Azure OpenAI endpoint is properly configured" | tee -a "$VERIFICATION_LOG"
            fi
            
            if [[ "$OPENAI_API_KEY" == "your-azure-openai-api-key" ]]; then
                echo "⚠️ Azure OpenAI API key is still using placeholder value" | tee -a "$VERIFICATION_LOG"
                echo "   Update the API key in $AZURE_OPENAI_CONFIG with your actual Azure OpenAI API key" | tee -a "$VERIFICATION_LOG"
            else
                echo "✅ Azure OpenAI API key is properly configured" | tee -a "$VERIFICATION_LOG"
            fi
        else
            echo "❌ Azure OpenAI config is not valid JSON" | tee -a "$VERIFICATION_LOG"
            echo "   Please fix the JSON format in $AZURE_OPENAI_CONFIG" | tee -a "$VERIFICATION_LOG"
        fi
    else
        echo "❌ Azure OpenAI config file not found at $AZURE_OPENAI_CONFIG" | tee -a "$VERIFICATION_LOG"
        echo "   Please ensure the file exists and is properly configured" | tee -a "$VERIFICATION_LOG"
    fi
fi

# Check for Parquet files if requested
if [ "$VERIFY_PARQUET" = true ]; then
    echo "🔍 Checking Parquet integration..." | tee -a "$VERIFICATION_LOG"
    
    if [ -d "$PARQUET_DIR" ]; then
        echo "✅ Parquet directory exists" | tee -a "$VERIFICATION_LOG"
        
        # Check if any Parquet files exist
        PARQUET_FILES=$(find "$PARQUET_DIR" -name "*.parquet" 2>/dev/null)
        PARQUET_COUNT=$(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t')
        
        if [ "$PARQUET_COUNT" -gt 0 ]; then
            echo "✅ Found $PARQUET_COUNT Parquet files in $PARQUET_DIR" | tee -a "$VERIFICATION_LOG"
            
            # List all Parquet files
            echo "   Parquet files:" | tee -a "$VERIFICATION_LOG"
            echo "$PARQUET_FILES" | sed 's/^/   - /' | tee -a "$VERIFICATION_LOG"
        else
            echo "❌ No Parquet files found in $PARQUET_DIR" | tee -a "$VERIFICATION_LOG"
            echo "   Please create or copy Parquet files to this directory for synthetic data support" | tee -a "$VERIFICATION_LOG"
            
            # Check if JSON samples exist
            JSON_DIR="$PARQUET_DIR/json"
            if [ -d "$JSON_DIR" ]; then
                JSON_FILES=$(find "$JSON_DIR" -name "*.json" 2>/dev/null)
                JSON_COUNT=$(echo "$JSON_FILES" | grep -v "^$" | wc -l | tr -d ' \t')
                
                if [ "$JSON_COUNT" -gt 0 ]; then
                    echo "   Found $JSON_COUNT JSON sample files that can be converted to Parquet format" | tee -a "$VERIFICATION_LOG"
                    echo "   Example Python code to convert JSON to Parquet:" | tee -a "$VERIFICATION_LOG"
                    echo "   ```python" | tee -a "$VERIFICATION_LOG"
                    echo "   import pandas as pd" | tee -a "$VERIFICATION_LOG"
                    echo "   df = pd.read_json('$JSON_DIR/$(basename $(echo "$JSON_FILES" | head -n1))')" | tee -a "$VERIFICATION_LOG"
                    echo "   df.to_parquet('$PARQUET_DIR/$(basename $(echo "$JSON_FILES" | head -n1) .json).parquet')" | tee -a "$VERIFICATION_LOG"
                    echo "   ```" | tee -a "$VERIFICATION_LOG"
                fi
            fi
        fi
    else
        echo "❌ Parquet directory not found at $PARQUET_DIR" | tee -a "$VERIFICATION_LOG"
        echo "   Please create this directory and add Parquet files for synthetic data support" | tee -a "$VERIFICATION_LOG"
    fi
fi

# Check for data toggle functionality if requested
if [ "$VERIFY_DATA_TOGGLE" = true ]; then
    echo "🔍 Checking data toggle integration..." | tee -a "$VERIFICATION_LOG"
    
    # Define the files that should be updated to support data toggle
    DASHBOARD_JS="./deploy_v2.3.2/js/dashboard.js"
    AI_INSIGHTS_JS="./deploy_v2.3.2/js/ai_insights_component.js"
    
    # Check dashboard.js
    if [ -f "$DASHBOARD_JS" ]; then
        echo "✅ Dashboard.js file exists" | tee -a "$VERIFICATION_LOG"
        
        # Check if it contains data toggle functionality
        if grep -q "initializeDataSourceToggle" "$DASHBOARD_JS"; then
            echo "✅ Data toggle initialization found in dashboard.js" | tee -a "$VERIFICATION_LOG"
        else
            echo "❌ Data toggle initialization not found in dashboard.js" | tee -a "$VERIFICATION_LOG"
            echo "   Please ensure initializeDataSourceToggle function is properly implemented" | tee -a "$VERIFICATION_LOG"
        fi
        
        # Check for Azure OpenAI and Parquet integration
        if grep -q "azure.*openai" "$DASHBOARD_JS" || grep -q "AZURE_OPENAI" "$DASHBOARD_JS"; then
            echo "✅ Azure OpenAI references found in dashboard.js" | tee -a "$VERIFICATION_LOG"
        else
            echo "⚠️ No Azure OpenAI references found in dashboard.js" | tee -a "$VERIFICATION_LOG"
        fi
        
        if grep -q "parquet" "$DASHBOARD_JS" || grep -q "synthetic.*data" "$DASHBOARD_JS"; then
            echo "✅ Synthetic/Parquet data references found in dashboard.js" | tee -a "$VERIFICATION_LOG"
        else
            echo "⚠️ No synthetic/Parquet data references found in dashboard.js" | tee -a "$VERIFICATION_LOG"
        fi
    else
        echo "❌ Dashboard.js file not found at $DASHBOARD_JS" | tee -a "$VERIFICATION_LOG"
    fi
    
    # Check ai_insights_component.js
    if [ -f "$AI_INSIGHTS_JS" ]; then
        echo "✅ AI insights component file exists" | tee -a "$VERIFICATION_LOG"
        
        # Check if it contains data source configuration
        if grep -q "SYNTHETIC_DATA_ENABLED" "$AI_INSIGHTS_JS"; then
            echo "✅ Synthetic data toggle found in AI insights component" | tee -a "$VERIFICATION_LOG"
        else
            echo "❌ Synthetic data toggle not found in AI insights component" | tee -a "$VERIFICATION_LOG"
            echo "   Please ensure SYNTHETIC_DATA_ENABLED flag is properly implemented" | tee -a "$VERIFICATION_LOG"
        fi
    else
        echo "❌ AI insights component file not found at $AI_INSIGHTS_JS" | tee -a "$VERIFICATION_LOG"
    fi
fi

# Perform runtime verification using curl to check key components
echo "🔍 Performing runtime verification..." | tee -a "$VERIFICATION_LOG"

# Check if index.html loads and contains expected components
INDEX_CONTENT=$(curl -s "$URL")

if echo "$INDEX_CONTENT" | grep -q "Client360 Dashboard"; then
    echo "✅ Index page loads and contains dashboard title" | tee -a "$VERIFICATION_LOG"
else
    echo "❌ Index page does not contain expected dashboard title" | tee -a "$VERIFICATION_LOG"
fi

# Check for data toggle in the page
if echo "$INDEX_CONTENT" | grep -q "dataSourceToggle"; then
    echo "✅ Data source toggle found in the page" | tee -a "$VERIFICATION_LOG"
else
    echo "⚠️ Data source toggle not found in the page" | tee -a "$VERIFICATION_LOG"
fi

# Check for AI insights component
if echo "$INDEX_CONTENT" | grep -q "ai_insights_component.js" || echo "$INDEX_CONTENT" | grep -q "ai-insights"; then
    echo "✅ AI insights component references found in the page" | tee -a "$VERIFICATION_LOG"
else
    echo "⚠️ AI insights component references not found in the page" | tee -a "$VERIFICATION_LOG"
fi

# Check for map component
if echo "$INDEX_CONTENT" | grep -q "store_map.js" || echo "$INDEX_CONTENT" | grep -q "initializeMapComponent"; then
    echo "✅ Map component references found in the page" | tee -a "$VERIFICATION_LOG"
else
    echo "⚠️ Map component references not found in the page" | tee -a "$VERIFICATION_LOG"
fi

# Generate verification report
echo "📝 Generating verification report..." | tee -a "$VERIFICATION_LOG"
VERIFICATION_REPORT="reports/verification_report_${TIMESTAMP}.md"

cat > "$VERIFICATION_REPORT" << EOL
# Client360 Dashboard Deployment Verification Report

## Summary
- **Version:** ${VERSION}
- **Timestamp:** $(date)
- **URL:** ${URL}
- **Log:** ${VERIFICATION_LOG}

## Verification Results

### Basic Connectivity
- HTTP Status: ${HTTP_STATUS} ($([ "$HTTP_STATUS" -eq 200 ] && echo "✅ Passed" || echo "❌ Failed"))

EOL

# Add Azure OpenAI verification results if applicable
if [ "$VERIFY_AZURE_OPENAI" = true ]; then
    cat >> "$VERIFICATION_REPORT" << EOL
### Azure OpenAI Integration
- Config File: $([ -f "$AZURE_OPENAI_CONFIG" ] && echo "✅ Present" || echo "❌ Missing")
$([ -f "$AZURE_OPENAI_CONFIG" ] && jq empty "$AZURE_OPENAI_CONFIG" 2>/dev/null && echo "- JSON Format: ✅ Valid" || echo "- JSON Format: ❌ Invalid")
$([ -f "$AZURE_OPENAI_CONFIG" ] && [[ "$(jq -r '.endpoint' "$AZURE_OPENAI_CONFIG")" != *"your-azure-openai-resource"* ]] && echo "- Endpoint: ✅ Configured" || echo "- Endpoint: ⚠️ Using placeholder")
$([ -f "$AZURE_OPENAI_CONFIG" ] && [[ "$(jq -r '.apiKey' "$AZURE_OPENAI_CONFIG")" != "your-azure-openai-api-key" ]] && echo "- API Key: ✅ Configured" || echo "- API Key: ⚠️ Using placeholder")

EOL
fi

# Add Parquet verification results if applicable
if [ "$VERIFY_PARQUET" = true ]; then
    PARQUET_COUNT=$(find "$PARQUET_DIR" -name "*.parquet" 2>/dev/null | wc -l | tr -d ' \t')
    cat >> "$VERIFICATION_REPORT" << EOL
### Parquet Integration
- Directory: $([ -d "$PARQUET_DIR" ] && echo "✅ Present" || echo "❌ Missing")
- Files: ${PARQUET_COUNT} Parquet files $([ "$PARQUET_COUNT" -gt 0 ] && echo "✅" || echo "⚠️")

EOL
fi

# Add data toggle verification results if applicable
if [ "$VERIFY_DATA_TOGGLE" = true ]; then
    cat >> "$VERIFICATION_REPORT" << EOL
### Data Toggle Integration
- Dashboard.js: $([ -f "$DASHBOARD_JS" ] && echo "✅ Present" || echo "❌ Missing")
$([ -f "$DASHBOARD_JS" ] && grep -q "initializeDataSourceToggle" "$DASHBOARD_JS" && echo "- Toggle Init: ✅ Found" || echo "- Toggle Init: ❌ Not found")
- AI Insights Component: $([ -f "$AI_INSIGHTS_JS" ] && echo "✅ Present" || echo "❌ Missing")
$([ -f "$AI_INSIGHTS_JS" ] && grep -q "SYNTHETIC_DATA_ENABLED" "$AI_INSIGHTS_JS" && echo "- Synthetic Data Flag: ✅ Found" || echo "- Synthetic Data Flag: ❌ Not found")

EOL
fi

# Add runtime verification results
cat >> "$VERIFICATION_REPORT" << EOL
### Runtime Check
- Index Page: $(echo "$INDEX_CONTENT" | grep -q "Client360 Dashboard" && echo "✅ Loads correctly" || echo "❌ Missing expected content")
- Data Toggle UI: $(echo "$INDEX_CONTENT" | grep -q "dataSourceToggle" && echo "✅ Present" || echo "⚠️ Not found")
- AI Insights: $(echo "$INDEX_CONTENT" | grep -q "ai_insights_component.js\|ai-insights" && echo "✅ Referenced" || echo "⚠️ Not found")
- Map Component: $(echo "$INDEX_CONTENT" | grep -q "store_map.js\|initializeMapComponent" && echo "✅ Referenced" || echo "⚠️ Not found")

## Recommendations

EOL

# Add recommendations based on verification results
if [ -f "$AZURE_OPENAI_CONFIG" ] && [[ "$(jq -r '.endpoint' "$AZURE_OPENAI_CONFIG" 2>/dev/null)" == *"your-azure-openai-resource"* ]]; then
    echo "1. Update Azure OpenAI configuration with actual endpoint and API key" >> "$VERIFICATION_REPORT"
fi

if [ "$PARQUET_COUNT" -eq 0 ]; then
    echo "$([ -f "$AZURE_OPENAI_CONFIG" ] && [[ "$(jq -r '.endpoint' "$AZURE_OPENAI_CONFIG" 2>/dev/null)" == *"your-azure-openai-resource"* ]] && echo "2" || echo "1"). Add Parquet files for synthetic data support" >> "$VERIFICATION_REPORT"
fi

cat >> "$VERIFICATION_REPORT" << EOL

## Next Steps

1. Test the data toggle functionality by switching between Live and Simulated data
2. Verify that AI insights load correctly in both data modes
3. Check that the map displays all store locations with correct data
4. Validate filter and search functionality

EOL

echo "✅ Verification report generated: $VERIFICATION_REPORT" | tee -a "$VERIFICATION_LOG"
echo "📊 Verification complete! Results saved to: $VERIFICATION_REPORT"