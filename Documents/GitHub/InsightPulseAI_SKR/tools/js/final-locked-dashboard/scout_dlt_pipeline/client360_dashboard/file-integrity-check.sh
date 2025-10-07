#!/bin/bash

# File Integrity Checker for Client360 Dashboard v2.3.3
# This script tracks ETags and SHA hashes for deployed files to ensure integrity
# Enhanced with Parquet file detection and special handling for AI files

set -e  # Exit on any error

echo "🔒 File Integrity Checker for Client360 Dashboard starting..."

# Configuration
RESOURCE_GROUP="tbwa-client360-dashboard"
STORAGE_ACCOUNT="tbwaclient360sa"  # Storage account linked to your Static Web App
SOURCE_DIR="./deploy_v2.3.2"
INTEGRITY_DB_FILE=".file_integrity.json"
PARQUET_DIR="./data/synthetic"
AI_CONFIG_DIR="./data/ai/config"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/integrity_check_${TIMESTAMP}.log"
VERBOSE=false
CHECK_REMOTE=true
EXPORT_FORMAT="text"
AZURE_OPENAI_CONFIG="./data/ai/config/azure_openai_config.json"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --local-only)
      CHECK_REMOTE=false
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --format)
      EXPORT_FORMAT="$2"
      shift 2
      ;;
    --source-dir)
      SOURCE_DIR="$2"
      shift 2
      ;;
    --parquet-dir)
      PARQUET_DIR="$2"
      shift 2
      ;;
    --ai-config-dir)
      AI_CONFIG_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--local-only] [--verbose|-v] [--format json|text|html] [--source-dir DIR] [--parquet-dir DIR] [--ai-config-dir DIR]"
      exit 1
      ;;
  esac
done

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p reports

# Function to calculate SHA256 hash of a file
calculate_sha() {
    local file="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        shasum -a 256 "$file" | cut -d ' ' -f 1
    else
        # Linux
        sha256sum "$file" | cut -d ' ' -f 1
    fi
}

# Initialize or load the integrity database
if [ -f "$INTEGRITY_DB_FILE" ]; then
    echo "📊 Loading existing integrity database..." | tee -a "$LOG_FILE"
else
    echo "📊 Initializing new integrity database..." | tee -a "$LOG_FILE"
    echo "{}" > "$INTEGRITY_DB_FILE"
fi

# Get storage account key if remote checking is enabled
if [ "$CHECK_REMOTE" = true ]; then
    echo "🔑 Getting storage account key..." | tee -a "$LOG_FILE"
    STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv)

    if [ -z "$STORAGE_KEY" ]; then
        echo "⚠️ Failed to get storage key. Cannot check remote ETags." | tee -a "$LOG_FILE"
        REMOTE_CHECK=false
    else
        REMOTE_CHECK=true
    fi
else
    echo "🔍 Skipping remote ETag checks (--local-only flag used)" | tee -a "$LOG_FILE"
    REMOTE_CHECK=false
fi

# Find all files in the source directory
echo "🔍 Scanning files in $SOURCE_DIR..." | tee -a "$LOG_FILE"
ALL_FILES=$(find "$SOURCE_DIR" -type f -not -path "*/\.*" | sort)

# Check for Parquet files in the parquet directory
if [ -d "$PARQUET_DIR" ]; then
    echo "🔍 Scanning for Parquet files in $PARQUET_DIR..." | tee -a "$LOG_FILE"
    PARQUET_FILES=$(find "$PARQUET_DIR" -name "*.parquet" | sort)
    if [ -n "$PARQUET_FILES" ]; then
        echo "✅ Found $(echo "$PARQUET_FILES" | wc -l | tr -d ' \t') Parquet files for synthetic data" | tee -a "$LOG_FILE"
    else
        echo "⚠️ No Parquet files found in $PARQUET_DIR. Synthetic data mode may not work correctly." | tee -a "$LOG_FILE"
    fi
else
    echo "⚠️ Parquet directory $PARQUET_DIR does not exist. Creating it..." | tee -a "$LOG_FILE"
    mkdir -p "$PARQUET_DIR"
    PARQUET_FILES=""
fi

# Check for Azure OpenAI configuration
if [ -f "$AZURE_OPENAI_CONFIG" ]; then
    echo "✅ Azure OpenAI configuration found at $AZURE_OPENAI_CONFIG" | tee -a "$LOG_FILE"
    # Validate the configuration file (basic JSON validation)
    if jq empty "$AZURE_OPENAI_CONFIG" 2>/dev/null; then
        echo "✅ Azure OpenAI configuration is valid JSON" | tee -a "$LOG_FILE"
    else
        echo "⚠️ Azure OpenAI configuration is not valid JSON. Live AI insights may not work correctly." | tee -a "$LOG_FILE"
    fi
else
    echo "⚠️ Azure OpenAI configuration not found at $AZURE_OPENAI_CONFIG. Live AI insights may not work correctly." | tee -a "$LOG_FILE"
    # Create AI config directory if it doesn't exist
    mkdir -p "$(dirname "$AZURE_OPENAI_CONFIG")"
fi

# Temporary file for updated integrity database
TEMP_DB_FILE=$(mktemp)
echo "{" > "$TEMP_DB_FILE"

CHANGED_FILES=""
UNCHANGED_FILES=""
FIRST_ENTRY=true

# Check each file for changes
for file in $ALL_FILES; do
    # Extract the relative path within SOURCE_DIR
    rel_path=${file#$SOURCE_DIR/}
    
    # Calculate file hash
    current_sha=$(calculate_sha "$file")
    
    # Get stored file info
    stored_info=$(jq -r --arg path "$rel_path" '.[$path] // ""' "$INTEGRITY_DB_FILE")
    
    # Get stored SHA hash
    if [ -n "$stored_info" ]; then
        stored_sha=$(echo "$stored_info" | jq -r '.sha // ""')
    else
        stored_sha=""
    fi
    
    # Check for ETag if remote check is possible
    if [ "$REMOTE_CHECK" = true ]; then
        # Get ETag from Azure Storage
        remote_etag=$(az storage blob show \
            --account-name $STORAGE_ACCOUNT \
            --account-key $STORAGE_KEY \
            --container-name "\$web" \
            --name "$rel_path" \
            --query "properties.etag" -o tsv 2>/dev/null || echo "")
    else
        remote_etag=""
    fi
    
    # Determine if file has changed
    if [ "$stored_sha" != "$current_sha" ]; then
        status="CHANGED"
        CHANGED_FILES="$CHANGED_FILES$rel_path\n"
    else
        status="UNCHANGED"
        UNCHANGED_FILES="$UNCHANGED_FILES$rel_path\n"
    fi
    
    # Output file status
    echo "📄 $rel_path: $status (SHA: ${current_sha:0:8}...)" | tee -a "$LOG_FILE"
    
    # Update the integrity database
    if [ "$FIRST_ENTRY" = true ]; then
        FIRST_ENTRY=false
    else
        echo "," >> "$TEMP_DB_FILE"
    fi
    
    cat >> "$TEMP_DB_FILE" << EOL
  "$rel_path": {
    "sha": "$current_sha",
    "etag": "$remote_etag",
    "last_checked": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "size": $(stat -f%z "$file" 2>/dev/null || stat --format="%s" "$file"),
    "file_type": "${file##*.}"
  }
EOL
done

# Add Parquet files to integrity database
if [ -n "$PARQUET_FILES" ]; then
    for file in $PARQUET_FILES; do
        # Extract the relative path
        rel_path=${file#./}
        
        # Calculate file hash
        current_sha=$(calculate_sha "$file")
        
        # Get stored file info
        stored_info=$(jq -r --arg path "$rel_path" '.[$path] // ""' "$INTEGRITY_DB_FILE")
        
        # Get stored SHA hash
        if [ -n "$stored_info" ]; then
            stored_sha=$(echo "$stored_info" | jq -r '.sha // ""')
        else
            stored_sha=""
        fi
        
        # Determine if file has changed
        if [ "$stored_sha" != "$current_sha" ]; then
            status="CHANGED"
            CHANGED_FILES="$CHANGED_FILES$rel_path\n"
        else
            status="UNCHANGED"
            UNCHANGED_FILES="$UNCHANGED_FILES$rel_path\n"
        fi
        
        # Output file status
        echo "📄 $rel_path: $status (SHA: ${current_sha:0:8}...)" | tee -a "$LOG_FILE"
        
        # Update the integrity database
        echo "," >> "$TEMP_DB_FILE"
        
        cat >> "$TEMP_DB_FILE" << EOL
  "$rel_path": {
    "sha": "$current_sha",
    "last_checked": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "size": $(stat -f%z "$file" 2>/dev/null || stat --format="%s" "$file"),
    "file_type": "parquet"
  }
EOL
    done
fi

# Add Azure OpenAI config to integrity database if it exists
if [ -f "$AZURE_OPENAI_CONFIG" ]; then
    # Calculate file hash
    current_sha=$(calculate_sha "$AZURE_OPENAI_CONFIG")
    
    # Extract the relative path
    rel_path=${AZURE_OPENAI_CONFIG#./}
    
    # Get stored file info
    stored_info=$(jq -r --arg path "$rel_path" '.[$path] // ""' "$INTEGRITY_DB_FILE")
    
    # Get stored SHA hash
    if [ -n "$stored_info" ]; then
        stored_sha=$(echo "$stored_info" | jq -r '.sha // ""')
    else
        stored_sha=""
    fi
    
    # Determine if file has changed
    if [ "$stored_sha" != "$current_sha" ]; then
        status="CHANGED"
        CHANGED_FILES="$CHANGED_FILES$rel_path\n"
    else
        status="UNCHANGED"
        UNCHANGED_FILES="$UNCHANGED_FILES$rel_path\n"
    fi
    
    # Output file status
    echo "📄 $rel_path: $status (SHA: ${current_sha:0:8}...)" | tee -a "$LOG_FILE"
    
    # Update the integrity database
    echo "," >> "$TEMP_DB_FILE"
    
    cat >> "$TEMP_DB_FILE" << EOL
  "$rel_path": {
    "sha": "$current_sha",
    "last_checked": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "size": $(stat -f%z "$AZURE_OPENAI_CONFIG" 2>/dev/null || stat --format="%s" "$AZURE_OPENAI_CONFIG"),
    "file_type": "json",
    "content_type": "azure_openai_config"
  }
EOL
fi

# Close the JSON object
echo "}" >> "$TEMP_DB_FILE"

# Move the temporary file to the integrity database
mv "$TEMP_DB_FILE" "$INTEGRITY_DB_FILE"

# Show summary
echo "" | tee -a "$LOG_FILE"
echo "📊 Integrity Check Summary:" | tee -a "$LOG_FILE"
CHANGED_COUNT=$(echo -e "$CHANGED_FILES" | grep -v "^$" | wc -l)
UNCHANGED_COUNT=$(echo -e "$UNCHANGED_FILES" | grep -v "^$" | wc -l)
TOTAL_COUNT=$((CHANGED_COUNT + UNCHANGED_COUNT))

echo "✅ Total files scanned: $TOTAL_COUNT" | tee -a "$LOG_FILE"
echo "🔄 Changed files: $CHANGED_COUNT" | tee -a "$LOG_FILE"
echo "⏹️ Unchanged files: $UNCHANGED_COUNT" | tee -a "$LOG_FILE"

# Create changed files report if there are changes
if [ "$CHANGED_COUNT" -gt 0 ]; then
    # Create report based on selected format
    case "$EXPORT_FORMAT" in
        "json")
            CHANGED_FILES_REPORT="reports/changed_files_${TIMESTAMP}.json"
            echo "📝 Creating JSON changed files report: $CHANGED_FILES_REPORT" | tee -a "$LOG_FILE"
            
            # Create JSON report
            echo "{" > "$CHANGED_FILES_REPORT"
            echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$CHANGED_FILES_REPORT"
            echo "  \"total_files\": $TOTAL_COUNT," >> "$CHANGED_FILES_REPORT"
            echo "  \"changed_files\": $CHANGED_COUNT," >> "$CHANGED_FILES_REPORT"
            echo "  \"unchanged_files\": $UNCHANGED_COUNT," >> "$CHANGED_FILES_REPORT"
            echo "  \"parquet_files\": $(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t')," >> "$CHANGED_FILES_REPORT"
            echo "  \"azure_openai_config\": $([ -f "$AZURE_OPENAI_CONFIG" ] && echo "true" || echo "false")," >> "$CHANGED_FILES_REPORT"
            echo "  \"files\": [" >> "$CHANGED_FILES_REPORT"
            
            # Add each changed file to the JSON
            FIRST_FILE=true
            echo -e "$CHANGED_FILES" | while read -r file; do
                if [ -n "$file" ]; then
                    if [ "$FIRST_FILE" = true ]; then
                        FIRST_FILE=false
                    else
                        echo "," >> "$CHANGED_FILES_REPORT"
                    fi
                    
                    # Get file info from integrity database
                    file_info=$(jq -r --arg path "$file" '.[$path]' "$INTEGRITY_DB_FILE")
                    file_sha=$(echo "$file_info" | jq -r '.sha // ""')
                    file_type=$(echo "$file_info" | jq -r '.file_type // ""')
                    
                    echo "    {" >> "$CHANGED_FILES_REPORT"
                    echo "      \"path\": \"$file\"," >> "$CHANGED_FILES_REPORT"
                    echo "      \"sha\": \"$file_sha\"," >> "$CHANGED_FILES_REPORT"
                    echo "      \"file_type\": \"$file_type\"" >> "$CHANGED_FILES_REPORT"
                    echo -n "    }" >> "$CHANGED_FILES_REPORT"
                fi
            done
            
            echo "" >> "$CHANGED_FILES_REPORT"
            echo "  ]" >> "$CHANGED_FILES_REPORT"
            echo "}" >> "$CHANGED_FILES_REPORT"
            ;;
            
        "html")
            CHANGED_FILES_REPORT="reports/changed_files_${TIMESTAMP}.html"
            echo "📝 Creating HTML changed files report: $CHANGED_FILES_REPORT" | tee -a "$LOG_FILE"
            
            # Create HTML report
            cat > "$CHANGED_FILES_REPORT" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Integrity Check Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
        h1 { color: #0078d4; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        h2 { color: #0078d4; margin-top: 20px; }
        .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .summary span { font-weight: bold; }
        .file-list { border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .file-item { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .file-item:last-child { border-bottom: none; }
        .file-item:nth-child(odd) { background-color: #f9f9f9; }
        .file-item.parquet { background-color: #e6f7ff; }
        .file-item.azure-openai { background-color: #e6ffe6; }
        .footer { margin-top: 30px; color: #777; font-size: 0.9em; text-align: center; }
        .data-section { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>File Integrity Check Report</h1>
    
    <div class="summary">
        <p>Timestamp: <span>${TIMESTAMP}</span></p>
        <p>Total Files: <span>${TOTAL_COUNT}</span></p>
        <p>Changed Files: <span>${CHANGED_COUNT}</span></p>
        <p>Unchanged Files: <span>${UNCHANGED_COUNT}</span></p>
        <p>Parquet Files: <span>$(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t')</span></p>
        <p>Azure OpenAI Config: <span>$([ -f "$AZURE_OPENAI_CONFIG" ] && echo "Present" || echo "Missing")</span></p>
    </div>
    
    <div class="data-section">
        <h2>Data Source Status</h2>
        <p><strong>Live Data (Azure OpenAI):</strong> $([ -f "$AZURE_OPENAI_CONFIG" ] && echo "✅ Configured" || echo "⚠️ Not configured")</p>
        <p><strong>Synthetic Data (Parquet):</strong> $([ -n "$PARQUET_FILES" ] && echo "✅ Available ($(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t') files)" || echo "⚠️ Not available")</p>
    </div>
    
    <h2>Changed Files</h2>
    <div class="file-list">
EOL
            
            # Add each changed file to the HTML
            echo -e "$CHANGED_FILES" | while read -r file; do
                if [ -n "$file" ]; then
                    # Determine file type class
                    if [[ "$file" == *"parquet"* ]]; then
                        file_class="parquet"
                    elif [[ "$file" == *"azure_openai"* ]]; then
                        file_class="azure-openai"
                    else
                        file_class=""
                    fi
                    
                    echo "        <div class=\"file-item ${file_class}\">$file</div>" >> "$CHANGED_FILES_REPORT"
                fi
            done
            
            # Close the HTML
            cat >> "$CHANGED_FILES_REPORT" << EOL
    </div>
    
    <div class="footer">
        <p>Generated on $(date) by file-integrity-check.sh</p>
    </div>
</body>
</html>
EOL
            ;;
            
        *)  # Default to text format
            CHANGED_FILES_REPORT="reports/changed_files_${TIMESTAMP}.txt"
            echo "📝 Creating text changed files report: $CHANGED_FILES_REPORT" | tee -a "$LOG_FILE"
            echo -e "Changed files detected on ${TIMESTAMP}:\n" > "$CHANGED_FILES_REPORT"
            echo -e "Total Files: ${TOTAL_COUNT}" >> "$CHANGED_FILES_REPORT"
            echo -e "Changed Files: ${CHANGED_COUNT}" >> "$CHANGED_FILES_REPORT"
            echo -e "Unchanged Files: ${UNCHANGED_COUNT}" >> "$CHANGED_FILES_REPORT"
            echo -e "Parquet Files: $(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t')" >> "$CHANGED_FILES_REPORT"
            echo -e "Azure OpenAI Config: $([ -f "$AZURE_OPENAI_CONFIG" ] && echo "Present" || echo "Missing")\n" >> "$CHANGED_FILES_REPORT"
            
            echo -e "Data Source Status:" >> "$CHANGED_FILES_REPORT"
            echo -e "Live Data (Azure OpenAI): $([ -f "$AZURE_OPENAI_CONFIG" ] && echo "✅ Configured" || echo "⚠️ Not configured")" >> "$CHANGED_FILES_REPORT"
            echo -e "Synthetic Data (Parquet): $([ -n "$PARQUET_FILES" ] && echo "✅ Available ($(echo "$PARQUET_FILES" | grep -v "^$" | wc -l | tr -d ' \t') files)" || echo "⚠️ Not available")\n" >> "$CHANGED_FILES_REPORT"
            
            echo -e "Changed Files List:\n" >> "$CHANGED_FILES_REPORT"
            echo -e "$CHANGED_FILES" >> "$CHANGED_FILES_REPORT"
            ;;
    esac
    
    echo "✅ Changed files list has been saved to $CHANGED_FILES_REPORT" | tee -a "$LOG_FILE"
    echo "🚀 You should run patch-deploy-diff-aware.sh to deploy only the changed files." | tee -a "$LOG_FILE"
    echo "   Example: ./patch-deploy-diff-aware.sh" | tee -a "$LOG_FILE"
else
    echo "✅ No changed files detected." | tee -a "$LOG_FILE"
    echo "🎉 Deployment is not needed." | tee -a "$LOG_FILE"
fi

echo "🔒 File integrity check completed. Results saved to $LOG_FILE"