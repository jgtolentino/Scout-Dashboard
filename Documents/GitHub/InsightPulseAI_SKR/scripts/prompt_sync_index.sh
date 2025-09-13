#!/bin/bash
# prompt_sync_index.sh
# Syncs the prompt library index using Claude as the executor
# Replaces the clodrep prompt sync functionality

set -e

# Configuration
PROMPT_LIBRARY_PATH="${HOME}/Documents/GitHub/InsightPulseAI_SKR/SKR/prompt_library"
INDEX_PATH="${HOME}/.pulser/prompt_index.json"
LOG_DIR="${HOME}/.pulser/logs"
LOG_FILE="${LOG_DIR}/prompt_sync_activity.log"
MODEL="claude-3-7-sonnet"

# Ensure directories exist
mkdir -p "$(dirname "$INDEX_PATH")"
mkdir -p "$LOG_DIR"

# Log function
log_message() {
  local message="$1"
  echo "$(date -Iseconds) | PROMPT_INDEX: $message" >> "$LOG_FILE"
  echo "$message"
}

# Scan the prompt library
scan_prompt_library() {
  local prompts=()
  
  # Check if prompt library exists
  if [[ ! -d "$PROMPT_LIBRARY_PATH" ]]; then
    log_message "Error: Prompt library not found at $PROMPT_LIBRARY_PATH"
    exit 1
  }
  
  # Get all prompt directories
  local prompt_dirs
  prompt_dirs=$(find "$PROMPT_LIBRARY_PATH" -type d -mindepth 1 -maxdepth 1)
  
  log_message "Scanning prompt library..."
  
  # Process each prompt directory
  local index_data='{"prompts":['
  local first=true
  
  for dir in $prompt_dirs; do
    local name=$(basename "$dir")
    local description=""
    local tags=""
    local versions=()
    
    # Skip hidden directories
    if [[ "$name" == .* ]]; then
      continue
    }
    
    # Check for prompt metadata
    if [[ -f "$dir/metadata.json" ]]; then
      description=$(jq -r '.description // ""' "$dir/metadata.json")
      tags=$(jq -r '.tags | join(",") // ""' "$dir/metadata.json")
    elif [[ -f "$dir/metadata.yaml" || -f "$dir/metadata.yml" ]]; then
      # Use yq if available
      if command -v yq &> /dev/null; then
        local meta_file="$dir/metadata.yaml"
        [[ ! -f "$meta_file" ]] && meta_file="$dir/metadata.yml"
        
        description=$(yq eval '.description // ""' "$meta_file")
        tags=$(yq eval '.tags | join(",") // ""' "$meta_file")
      fi
    fi
    
    # Check for versions
    if [[ -d "$dir/versions" ]]; then
      versions_json='['
      first_version=true
      
      for version_file in "$dir/versions/"*.txt; do
        if [[ -f "$version_file" ]]; then
          version_name=$(basename "$version_file" .txt)
          
          # Get creation time
          created=$(stat -c %y "$version_file" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$version_file")
          
          # Format version entry
          if [[ "$first_version" == true ]]; then
            first_version=false
          else
            versions_json+=","
          fi
          
          # Extract notes from first line if it starts with # NOTES:
          notes=""
          if [[ -f "$version_file" ]]; then
            first_line=$(head -n 1 "$version_file")
            if [[ "$first_line" == "# NOTES:"* ]]; then
              notes="${first_line#\# NOTES: }"
            fi
          fi
          
          versions_json+="{\"version\":\"$version_name\",\"created\":\"$created\",\"notes\":\"$notes\"}"
        fi
      done
      
      versions_json+=']'
    else
      versions_json='[]'
    fi
    
    # Add to index
    if [[ "$first" == true ]]; then
      first=false
    else
      index_data+=','
    fi
    
    index_data+="{\"name\":\"$name\",\"description\":\"$description\",\"tags\":[$([[ -n "$tags" ]] && echo "\"${tags//,/\",\"}\"" || echo "")],"
    index_data+="\"path\":\"$dir\",\"versions\":$versions_json}"
  done
  
  index_data+=']}'
  
  # Write index
  echo "$index_data" > "$INDEX_PATH"
  log_message "Prompt index updated with $(echo "$index_data" | jq '.prompts | length') prompts"
}

# Validate the index using Claude
validate_index() {
  log_message "Validating prompt index..."
  
  # Create a temporary file for the prompt
  local temp_file
  temp_file=$(mktemp)
  
  # Create validation prompt
  cat > "$temp_file" << EOF
You are an experienced prompt engineer helping me validate my prompt library index.

Here is the current index:
$(cat "$INDEX_PATH")

Please analyze this index and provide:
1. A summary of the prompt library (number of prompts, categories, etc.)
2. Any issues or inconsistencies you notice
3. Recommendations for organizing or improving the prompt library

Focus especially on identifying any missing metadata, poorly described prompts, or opportunities for better categorization.
EOF

  # Run Claude against the validation prompt
  local validation
  validation=$(claude $MODEL --file "$temp_file")
  
  # Save validation to log
  echo -e "\n--- PROMPT INDEX VALIDATION ($(date -Iseconds)) ---\n$validation\n---END VALIDATION---\n" >> "$LOG_FILE"
  
  # Clean up
  rm "$temp_file"
  
  # Print validation summary (first paragraph only)
  echo "$validation" | awk 'BEGIN{RS="";FS="\n"}{print $0;exit}'
}

# Generate documentation
generate_docs() {
  log_message "Generating prompt library documentation..."
  
  # Create a temporary file for the prompt
  local temp_file
  temp_file=$(mktemp)
  
  # Create documentation prompt
  cat > "$temp_file" << EOF
You are a documentation specialist helping me create a guide for our prompt library.

Here is the current prompt index:
$(cat "$INDEX_PATH")

Please generate a nicely formatted markdown guide for this prompt library with:
1. Introduction explaining what the prompt library is and how to use it
2. A table of contents
3. List of all prompts organized by category/tags
4. For each prompt, include:
   - Name
   - Description
   - Available versions (if any)
   - Tags
   - Example usage with the CLI

Format this as a comprehensive markdown document that can be used as our official prompt library documentation.
EOF

  # Run Claude against the documentation prompt
  local docs
  docs=$(claude $MODEL --file "$temp_file")
  
  # Save to documentation file
  local docs_file="${HOME}/Documents/GitHub/InsightPulseAI_SKR/docs/Pulser_PromptGuide.md"
  echo "$docs" > "$docs_file"
  
  # Clean up
  rm "$temp_file"
  
  log_message "Documentation generated at $docs_file"
}

# Main function
main() {
  log_message "Starting prompt index sync"
  
  # Scan the prompt library
  scan_prompt_library
  
  # Validate the index
  validate_index
  
  # Generate documentation
  generate_docs
  
  log_message "Prompt index sync completed"
}

# Run main
main