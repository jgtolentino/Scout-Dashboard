#!/bin/bash

# Diff-Aware Patch Deployment for Client360 Dashboard v2.3.3
# Enhanced with Azure OpenAI and Parquet data source support

set -e  # Exit on any error

echo "🔍 Diff-Aware Deployment for Client360 Dashboard starting..."

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
APP_NAME="tbwa-client360-dashboard-production"
SOURCE_DIR="./deploy_v2.3.2"
STORAGE_ACCOUNT="tbwaclient360sa"  # Storage account linked to your Static Web App
API_KEY_FILE=".azure_deploy_key"
LAST_DEPLOY_SHA_FILE=".last_deploy_sha"
LAST_DEPLOY_TAG="v2.3.2"  # Tag or commit hash of last deployment
INTEGRITY_DB_FILE=".file_integrity.json"  # File integrity database
PARQUET_DIR="./data/synthetic"
AZURE_OPENAI_CONFIG="./data/ai/config/azure_openai_config.json"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_LOG="logs/patch_deploy_${TIMESTAMP}.log"
VERSION="2.3.3"
COMPONENT_CHANGED=""  # Will be set based on changed files
DATA_TOGGLE_INTEGRATION=false  # Flag to indicate if data toggle integration is needed

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p reports

# Parse command line arguments
FROM_TAG=""
TO_TAG=""
FORCE=false
PRETEND=${PRETEND:-false}
INTEGRATE_AZURE_OPENAI=false
INTEGRATE_PARQUET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --from-tag)
      FROM_TAG="$2"
      shift 2
      ;;
    --to-tag)
      TO_TAG="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --integrate-azure-openai)
      INTEGRATE_AZURE_OPENAI=true
      shift
      ;;
    --integrate-parquet)
      INTEGRATE_PARQUET=true
      shift
      ;;
    --with-data-toggle)
      DATA_TOGGLE_INTEGRATION=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--from-tag TAG] [--to-tag TAG] [--force] [--integrate-azure-openai] [--integrate-parquet] [--with-data-toggle]"
      exit 1
      ;;
  esac
done

# Determine comparison base
if [ -n "$FROM_TAG" ]; then
    COMPARE_BASE=$FROM_TAG
    echo "📜 Using specified from-tag: $COMPARE_BASE" | tee -a "$DEPLOYMENT_LOG"
elif [ -f "$LAST_DEPLOY_SHA_FILE" ]; then
    LAST_DEPLOY_SHA=$(cat "$LAST_DEPLOY_SHA_FILE")
    echo "📜 Using last deployment SHA: $LAST_DEPLOY_SHA" | tee -a "$DEPLOYMENT_LOG"
    COMPARE_BASE=$LAST_DEPLOY_SHA
else
    echo "📜 No previous deployment SHA found, using tag $LAST_DEPLOY_TAG" | tee -a "$DEPLOYMENT_LOG"
    COMPARE_BASE=$LAST_DEPLOY_TAG
fi

# Determine comparison target
if [ -n "$TO_TAG" ]; then
    COMPARE_TARGET=$TO_TAG
    echo "📜 Using specified to-tag: $COMPARE_TARGET" | tee -a "$DEPLOYMENT_LOG"
else
    COMPARE_TARGET="HEAD"
fi

# Find modified files between comparison points
echo "🔍 Detecting changes from $COMPARE_BASE to $COMPARE_TARGET..." | tee -a "$DEPLOYMENT_LOG"

# Check if specified tag exists
if [ -n "$FROM_TAG" ] && ! git rev-parse "$FROM_TAG" >/dev/null 2>&1; then
    echo "⚠️ Warning: Tag $FROM_TAG doesn't exist. Using last deployment timestamp instead." | tee -a "$DEPLOYMENT_LOG"
    
    # Use file integrity check to detect changes instead
    echo "📊 Using file integrity database to detect changes..." | tee -a "$DEPLOYMENT_LOG"
    if [ -f "$INTEGRITY_DB_FILE" ]; then
        # Get changed files from integrity database
        REPORT_FILE="reports/changed_files_${TIMESTAMP}.json"
        
        # Check if report was created in the last 5 minutes; if not, create a new one
        LAST_REPORT=$(find reports -name "changed_files_*.json" -type f -mmin -5 | sort -r | head -n 1)
        
        if [ -n "$LAST_REPORT" ]; then
            echo "📊 Using recent integrity report: $LAST_REPORT" | tee -a "$DEPLOYMENT_LOG"
            CHANGED_FILES=$(jq -r '.files[].path' "$LAST_REPORT" | sed "s|^|$SOURCE_DIR/|")
        else
            echo "📊 Creating new integrity report..." | tee -a "$DEPLOYMENT_LOG"
            ./file-integrity-check.sh --local-only --format json
            LAST_REPORT=$(find reports -name "changed_files_*.json" -type f -mmin -5 | sort -r | head -n 1)
            if [ -n "$LAST_REPORT" ]; then
                CHANGED_FILES=$(jq -r '.files[].path' "$LAST_REPORT" | sed "s|^|$SOURCE_DIR/|")
            else
                echo "⚠️ Could not find integrity report. Using mock changes." | tee -a "$DEPLOYMENT_LOG"
                CHANGED_FILES="$SOURCE_DIR/VERSION_HIGHLIGHTS.md"
            fi
        fi
    else
        # Just use the one file we're simulating changes for
        echo "⚠️ No integrity database found. Using mock change." | tee -a "$DEPLOYMENT_LOG"
        CHANGED_FILES="$SOURCE_DIR/VERSION_HIGHLIGHTS.md"
    fi
else
    # Try git diff (will fail if tags don't exist)
    CHANGED_FILES=$(git diff --name-only $COMPARE_BASE $COMPARE_TARGET -- $SOURCE_DIR/ 2>/dev/null | sort)
    
    # If git diff fails or finds no changes, try using file integrity check
    if [ $? -ne 0 ] || [ -z "$CHANGED_FILES" ]; then
        echo "⚠️ Git diff failed or found no changes. Using file integrity database." | tee -a "$DEPLOYMENT_LOG"
        REPORT_FILE="reports/changed_files_${TIMESTAMP}.json"
        
        # Check if report was created in the last 5 minutes; if not, create a new one
        LAST_REPORT=$(find reports -name "changed_files_*.json" -type f -mmin -5 | sort -r | head -n 1)
        
        if [ -n "$LAST_REPORT" ]; then
            echo "📊 Using recent integrity report: $LAST_REPORT" | tee -a "$DEPLOYMENT_LOG"
            CHANGED_FILES=$(jq -r '.files[].path' "$LAST_REPORT" | sed "s|^|$SOURCE_DIR/|")
        else
            echo "📊 Creating new integrity report..." | tee -a "$DEPLOYMENT_LOG"
            ./file-integrity-check.sh --local-only --format json
            LAST_REPORT=$(find reports -name "changed_files_*.json" -type f -mmin -5 | sort -r | head -n 1)
            if [ -n "$LAST_REPORT" ]; then
                CHANGED_FILES=$(jq -r '.files[].path' "$LAST_REPORT" | sed "s|^|$SOURCE_DIR/|")
            else
                echo "⚠️ Could not find integrity report. Using mock changes." | tee -a "$DEPLOYMENT_LOG"
                CHANGED_FILES="$SOURCE_DIR/VERSION_HIGHLIGHTS.md"
            fi
        fi
    fi
fi

# If --integrate-azure-openai or --integrate-parquet is specified, add the data directory to changed files
if [ "$INTEGRATE_AZURE_OPENAI" = true ]; then
    echo "🔍 Adding Azure OpenAI integration files to deployment..." | tee -a "$DEPLOYMENT_LOG"
    # Check if Azure OpenAI config exists
    if [ ! -f "$AZURE_OPENAI_CONFIG" ]; then
        echo "⚠️ Azure OpenAI config not found. Creating template..." | tee -a "$DEPLOYMENT_LOG"
        mkdir -p "$(dirname "$AZURE_OPENAI_CONFIG")"
        
        # Create a template Azure OpenAI config
        cat > "$AZURE_OPENAI_CONFIG" << EOL
{
    "endpoint": "https://your-azure-openai-resource.openai.azure.com/",
    "apiKey": "your-azure-openai-api-key",
    "apiVersion": "2023-05-15",
    "deploymentName": "your-deployment-name",
    "maxTokens": 800,
    "temperature": 0.7,
    "enabled": true
}
EOL
        echo "✅ Azure OpenAI config template created at $AZURE_OPENAI_CONFIG" | tee -a "$DEPLOYMENT_LOG"
        echo "⚠️ Please update the config with your actual Azure OpenAI details before using." | tee -a "$DEPLOYMENT_LOG"
    fi

    # Add Azure OpenAI config to changed files
    CHANGED_FILES="$CHANGED_FILES\n$AZURE_OPENAI_CONFIG"
    
    # Set component changed flag
    COMPONENT_CHANGED="${COMPONENT_CHANGED}azure-openai,"
    
    # Set data toggle integration flag
    DATA_TOGGLE_INTEGRATION=true
fi

if [ "$INTEGRATE_PARQUET" = true ]; then
    echo "🔍 Adding Parquet integration files to deployment..." | tee -a "$DEPLOYMENT_LOG"
    
    # Check if Parquet directory exists
    if [ ! -d "$PARQUET_DIR" ]; then
        echo "⚠️ Parquet directory not found. Creating it..." | tee -a "$DEPLOYMENT_LOG"
        mkdir -p "$PARQUET_DIR"
    fi
    
    # Check if any Parquet files exist
    PARQUET_FILES=$(find "$PARQUET_DIR" -name "*.parquet" 2>/dev/null)
    if [ -z "$PARQUET_FILES" ]; then
        echo "⚠️ No Parquet files found. Creating sample data..." | tee -a "$DEPLOYMENT_LOG"
        
        # Create a sample JSON file that will be used to generate the Parquet file
        SAMPLE_JSON_DIR="./data/synthetic/json"
        mkdir -p "$SAMPLE_JSON_DIR"
        
        # Sample store data JSON
        cat > "$SAMPLE_JSON_DIR/stores.json" << EOL
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
        
        # Note about tools for converting JSON to Parquet
        echo "✅ Created sample JSON data in $SAMPLE_JSON_DIR/stores.json" | tee -a "$DEPLOYMENT_LOG"
        echo "⚠️ NOTE: You'll need to manually convert this JSON to Parquet using a tool like Apache Arrow, PyArrow, or pandas." | tee -a "$DEPLOYMENT_LOG"
        echo "⚠️ Example Python code to convert JSON to Parquet:" | tee -a "$DEPLOYMENT_LOG"
        echo "import pandas as pd" | tee -a "$DEPLOYMENT_LOG"
        echo "df = pd.read_json('$SAMPLE_JSON_DIR/stores.json')" | tee -a "$DEPLOYMENT_LOG"
        echo "df.to_parquet('$PARQUET_DIR/stores.parquet')" | tee -a "$DEPLOYMENT_LOG"
    else
        echo "✅ Found existing Parquet files in $PARQUET_DIR" | tee -a "$DEPLOYMENT_LOG"
    fi
    
    # Add Parquet directory to changed files
    for parquet_file in $PARQUET_FILES; do
        CHANGED_FILES="$CHANGED_FILES\n$parquet_file"
    done
    
    # Set component changed flag
    COMPONENT_CHANGED="${COMPONENT_CHANGED}parquet-data,"
    
    # Set data toggle integration flag
    DATA_TOGGLE_INTEGRATION=true
fi

# If data toggle integration is enabled, add the dashboard.js and ai_insights_component.js to the changed files
if [ "$DATA_TOGGLE_INTEGRATION" = true ]; then
    echo "🔍 Adding data toggle integration files to deployment..." | tee -a "$DEPLOYMENT_LOG"
    
    # Check if dashboard.js exists
    DASHBOARD_JS="$SOURCE_DIR/js/dashboard.js"
    if [ -f "$DASHBOARD_JS" ]; then
        CHANGED_FILES="$CHANGED_FILES\n$DASHBOARD_JS"
    fi
    
    # Check if ai_insights_component.js exists
    AI_INSIGHTS_JS="$SOURCE_DIR/js/ai_insights_component.js"
    if [ -f "$AI_INSIGHTS_JS" ]; then
        CHANGED_FILES="$CHANGED_FILES\n$AI_INSIGHTS_JS"
    fi
    
    # Set component changed flag
    COMPONENT_CHANGED="${COMPONENT_CHANGED}data-toggle,"
}

if [ -z "$CHANGED_FILES" ] && [ "$FORCE" != "true" ]; then
    echo "✅ No changes detected to deploy." | tee -a "$DEPLOYMENT_LOG"
    echo "Run with --force to deploy all files regardless."
    exit 0
elif [ -z "$CHANGED_FILES" ] && [ "$FORCE" = "true" ]; then
    echo "⚠️ No changes detected but --force flag used. Will deploy all files." | tee -a "$DEPLOYMENT_LOG"
    # If --force is used and no specific files changed, include all files in the directory
    CHANGED_FILES=$(find $SOURCE_DIR -type f -not -path "*/\.*" | sort)
fi

# Group changes by component
echo "📊 Analyzing changes by component..." | tee -a "$DEPLOYMENT_LOG"
AI_INSIGHTS_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "ai_insights|ai-insights|azure_openai" || echo "")
PARQUET_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "parquet|synthetic" || echo "")
MAP_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "store_map|map\." || echo "")
KPI_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "kpi|dashboard\.js" || echo "")
UI_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "index\.html|\.css" || echo "")
TOGGLE_CHANGES=$(echo -e "$CHANGED_FILES" | grep -E "toggle|data_source" || echo "")

# Add component changed flags based on file changes
if [ -n "$AI_INSIGHTS_CHANGES" ] && [[ "$COMPONENT_CHANGED" != *"azure-openai"* ]]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}ai-insights,"
fi
if [ -n "$PARQUET_CHANGES" ] && [[ "$COMPONENT_CHANGED" != *"parquet-data"* ]]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}parquet-data,"
fi
if [ -n "$MAP_CHANGES" ]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}store-map,"
fi
if [ -n "$KPI_CHANGES" ]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}kpi-dashboard,"
fi
if [ -n "$UI_CHANGES" ]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}ui-layout,"
fi
if [ -n "$TOGGLE_CHANGES" ] && [[ "$COMPONENT_CHANGED" != *"data-toggle"* ]]; then
    COMPONENT_CHANGED="${COMPONENT_CHANGED}data-toggle,"
fi
COMPONENT_CHANGED=$(echo $COMPONENT_CHANGED | sed 's/,$//')  # Remove trailing comma

# Print summary of changes
echo "📝 Changes detected in $SOURCE_DIR:" | tee -a "$DEPLOYMENT_LOG"
echo -e "$CHANGED_FILES" | tee -a "$DEPLOYMENT_LOG"
echo "" | tee -a "$DEPLOYMENT_LOG"
echo "🔄 Components affected: $COMPONENT_CHANGED" | tee -a "$DEPLOYMENT_LOG"

# Create a temporary folder for only the changed files (maintaining folder structure)
TEMP_DIR="temp_deploy_${TIMESTAMP}"
mkdir -p "$TEMP_DIR"

# Process each changed file
echo -e "$CHANGED_FILES" | while read -r file; do
    if [ -n "$file" ]; then
        # Determine whether file is in the source directory or elsewhere
        if [[ "$file" == "$SOURCE_DIR"/* ]]; then
            # Extract the relative path within SOURCE_DIR
            rel_path=${file#$SOURCE_DIR/}
            target_dir="$TEMP_DIR"
        else
            # For files outside the source directory (like Parquet files or Azure OpenAI config)
            rel_path=${file#./}
            target_dir="$TEMP_DIR/data"
        fi
        
        # Create directory structure
        mkdir -p "$target_dir/$(dirname "$rel_path")"
        
        # Copy the file if it exists
        if [ -f "$file" ]; then
            cp "$file" "$target_dir/$(dirname "$rel_path")/"
            echo "📁 Prepared: $rel_path" | tee -a "$DEPLOYMENT_LOG"
        else
            echo "⚠️ File not found: $file" | tee -a "$DEPLOYMENT_LOG"
        fi
    fi
done

# Check if we're in pretend mode
if [ "$PRETEND" = "true" ]; then
    echo "🔍 Running in PRETEND mode - no actual deployment will occur" | tee -a "$DEPLOYMENT_LOG"
    STORAGE_KEY="PRETEND_KEY"
    
    # Create fake deployment record
    DEPLOYMENT_RECORD="reports/pretend_deployment_v${VERSION}_${TIMESTAMP}.md"
    mkdir -p reports
    
    echo "📝 PRETEND mode - would deploy these files:" | tee -a "$DEPLOYMENT_LOG"
    for file in $(find "$TEMP_DIR" -type f | sort); do
        echo "   - ${file#$TEMP_DIR/}" | tee -a "$DEPLOYMENT_LOG"
    done
    
    cat > "$DEPLOYMENT_RECORD" << EOL
# PRETEND Deployment Record - v${VERSION}

## Deployment Summary (SIMULATION ONLY)
- **Version:** ${VERSION}
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Components Modified:** ${COMPONENT_CHANGED}

## Data Source Integration
- **Azure OpenAI (Live Data):** $([ "$INTEGRATE_AZURE_OPENAI" = true ] && echo "✅ Integrated" || echo "⏺️ Not modified")
- **Parquet (Synthetic Data):** $([ "$INTEGRATE_PARQUET" = true ] && echo "✅ Integrated" || echo "⏺️ Not modified")
- **Data Toggle Components:** $([ "$DATA_TOGGLE_INTEGRATION" = true ] && echo "✅ Updated" || echo "⏺️ Not modified")

## Files That Would Be Deployed
\`\`\`
$(find "$TEMP_DIR" -type f | sort | sed "s|$TEMP_DIR/||")
\`\`\`

## Notes
This was a simulated deployment (PRETEND mode) - no actual files were deployed.
EOL
    
    echo "✅ PRETEND deployment report created: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"
    echo "🧹 Temporary files cleaned up" | tee -a "$DEPLOYMENT_LOG"
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Get storage account key
echo "🔑 Getting storage account key..." | tee -a "$DEPLOYMENT_LOG"
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv)

if [ -z "$STORAGE_KEY" ]; then
    echo "⚠️ Failed to get storage key. Falling back to SWA deployment API..." | tee -a "$DEPLOYMENT_LOG"
    # Get the API key from Azure
    echo "🔑 Retrieving SWA deployment key from Azure..." | tee -a "$DEPLOYMENT_LOG"
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
    
    # Create a temporary zip of only changed files
    echo "📦 Creating deployment package of changed files only..." | tee -a "$DEPLOYMENT_LOG"
    PATCH_ZIP="output/client360_v${VERSION}_patch_${TIMESTAMP}.zip"
    mkdir -p output
    (cd "$TEMP_DIR" && zip -r "../$PATCH_ZIP" . -x "*/\.*") | tee -a "$DEPLOYMENT_LOG"
    
    # Deploy using Azure CLI - SWA method
    echo "🚀 Deploying changed files to Azure Static Web App: $APP_NAME..." | tee -a "$DEPLOYMENT_LOG"
    az staticwebapp deploy \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --source "$PATCH_ZIP" \
        --api-key "$API_KEY" | tee -a "$DEPLOYMENT_LOG"
    
    DEPLOY_STATUS=$?
else
    # Deploy each file individually to Azure Blob Storage (which SWA uses)
    echo "🚀 Deploying changed files using Azure Storage API..." | tee -a "$DEPLOYMENT_LOG"
    
    # Loop through each changed file and upload it
    for file in $(find "$TEMP_DIR" -type f | sort); do
        # Extract the relative path
        rel_path=${file#$TEMP_DIR/}
        
        # Set the content type based on file extension
        case "${file##*.}" in
            js)
                content_type="application/javascript"
                ;;
            css)
                content_type="text/css"
                ;;
            html)
                content_type="text/html"
                ;;
            json)
                content_type="application/json"
                ;;
            jpg|jpeg)
                content_type="image/jpeg"
                ;;
            png)
                content_type="image/png"
                ;;
            svg)
                content_type="image/svg+xml"
                ;;
            parquet)
                content_type="application/octet-stream"
                ;;
            *)
                content_type="text/plain"
                ;;
        esac
        
        # Upload the file to blob storage
        az storage blob upload \
            --account-name $STORAGE_ACCOUNT \
            --account-key $STORAGE_KEY \
            --container-name "\$web" \
            --file "$file" \
            --name "$rel_path" \
            --content-type "$content_type" \
            --content-cache-control "public, max-age=3600" \
            --no-progress | tee -a "$DEPLOYMENT_LOG"
        
        echo "📤 Uploaded: $rel_path (Content-Type: $content_type)" | tee -a "$DEPLOYMENT_LOG"
    done
    
    DEPLOY_STATUS=$?
    
    # Purge CDN cache if we have CDN endpoint
    echo "🧹 Purging CDN cache..." | tee -a "$DEPLOYMENT_LOG"
    az cdn endpoint purge \
        --content-paths "/*" \
        --profile-name "tbwa-client360-cdn" \
        --name "$APP_NAME" \
        --resource-group $RESOURCE_GROUP | tee -a "$DEPLOYMENT_LOG" || \
        echo "⚠️ CDN purge failed or CDN not configured. Users may need to refresh their browser cache." | tee -a "$DEPLOYMENT_LOG"
fi

if [ $DEPLOY_STATUS -eq 0 ]; then
    # Store the current git commit SHA for future diffs
    git rev-parse HEAD > "$LAST_DEPLOY_SHA_FILE"
    echo "✅ Deployment completed successfully! Current commit SHA stored for future reference." | tee -a "$DEPLOYMENT_LOG"
    
    # Get the URL of the deployed app
    DEPLOYMENT_URL=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)
    
    echo "🌐 Dashboard is now available at: https://$DEPLOYMENT_URL" | tee -a "$DEPLOYMENT_LOG"
    
    # Create a deployment record
    DEPLOYMENT_RECORD="reports/patch_deployment_v${VERSION}_${TIMESTAMP}.md"
    mkdir -p reports
    cat > "$DEPLOYMENT_RECORD" << EOL
# Patch Deployment Record - v${VERSION}

## Deployment Summary
- **Version:** ${VERSION}
- **Timestamp:** $(date)
- **Resource Group:** $RESOURCE_GROUP
- **App Name:** $APP_NAME
- **Log:** $DEPLOYMENT_LOG
- **URL:** https://$DEPLOYMENT_URL
- **Components Modified:** ${COMPONENT_CHANGED}

## Data Source Integration
- **Azure OpenAI (Live Data):** $([ "$INTEGRATE_AZURE_OPENAI" = true ] && echo "✅ Integrated" || echo "⏺️ Not modified")
- **Parquet (Synthetic Data):** $([ "$INTEGRATE_PARQUET" = true ] && echo "✅ Integrated" || echo "⏺️ Not modified")
- **Data Toggle Components:** $([ "$DATA_TOGGLE_INTEGRATION" = true ] && echo "✅ Updated" || echo "⏺️ Not modified")

## Files Changed and Deployed
\`\`\`
$(find "$TEMP_DIR" -type f | sort | sed "s|$TEMP_DIR/||")
\`\`\`

## Deployment Method
$([ -z "$STORAGE_KEY" ] && echo "- Azure Static Web App API (zip upload)" || echo "- Azure Blob Storage Direct Upload (per-file)")

## QA Verification Notes
1. Focus testing on the modified components: ${COMPONENT_CHANGED}
2. Ensure no regressions in unchanged components
3. Verify URL: https://$DEPLOYMENT_URL
$([ "$DATA_TOGGLE_INTEGRATION" = true ] && echo "4. Test data toggle functionality between live and simulated data")

## Post-Deployment Instructions
1. Run the verification script: ./verify_deployment.sh
2. Document any issues in the deployment log
$([ "$INTEGRATE_AZURE_OPENAI" = true ] && echo "3. Update Azure OpenAI configuration in $AZURE_OPENAI_CONFIG with your actual credentials")
$([ "$INTEGRATE_PARQUET" = true ] && echo "4. Verify synthetic data is loading correctly when using the data toggle")
EOL

    echo "📝 Deployment record created: $DEPLOYMENT_RECORD" | tee -a "$DEPLOYMENT_LOG"
    echo "🧪 Please run QA tests to verify the deployment"
else
    echo "❌ Deployment failed. Check the logs for details: $DEPLOYMENT_LOG" | tee -a "$DEPLOYMENT_LOG"
    
    # Clean up
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Update Azure OpenAI integration note if relevant
if [ "$INTEGRATE_AZURE_OPENAI" = true ]; then
    echo "📝 Azure OpenAI integration note:" | tee -a "$DEPLOYMENT_LOG"
    echo "1. Update the Azure OpenAI configuration in $AZURE_OPENAI_CONFIG with your actual credentials" | tee -a "$DEPLOYMENT_LOG"
    echo "2. The 'Live' data source toggle will use Azure OpenAI for insights" | tee -a "$DEPLOYMENT_LOG"
fi

# Update Parquet integration note if relevant
if [ "$INTEGRATE_PARQUET" = true ]; then
    echo "📝 Parquet integration note:" | tee -a "$DEPLOYMENT_LOG"
    echo "1. Parquet files for synthetic data are stored in $PARQUET_DIR" | tee -a "$DEPLOYMENT_LOG"
    echo "2. The 'Simulated' data source toggle will use these files" | tee -a "$DEPLOYMENT_LOG"
    echo "3. More sample data can be created using tools like Apache Arrow, PyArrow, or pandas" | tee -a "$DEPLOYMENT_LOG"
fi

# Clean up
rm -rf "$TEMP_DIR"
echo "🧹 Temporary files cleaned up" | tee -a "$DEPLOYMENT_LOG"
echo "✅ Deployment completed successfully."