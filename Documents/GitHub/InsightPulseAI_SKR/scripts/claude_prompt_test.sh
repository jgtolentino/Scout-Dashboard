#!/bin/bash
# claude_prompt_test.sh
# Script for testing prompts with Claude as the executor
# Replaces clodrep prompt testing functionality

set -e

# Default values
MODEL="claude-3-7-sonnet"
CACHE_DIR="${HOME}/.pulser/prompt_cache"
USE_CACHE=true
PROMPT_NAME=""
PROMPT_FILE=""
PROMPT_INPUT=""
PROMPT_CONTEXT=""
PROMPT_TAGS=""
OUTPUT_FILE=""
PROMPT_VERSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      PROMPT_NAME="$2"
      shift 2
      ;;
    --file)
      PROMPT_FILE="$2"
      shift 2
      ;;
    --input)
      PROMPT_INPUT="$2"
      shift 2
      ;;
    --context)
      PROMPT_CONTEXT="$2"
      shift 2
      ;;
    --tags)
      PROMPT_TAGS="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --nocache)
      USE_CACHE=false
      shift
      ;;
    --version)
      PROMPT_VERSION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create cache directory if it doesn't exist
mkdir -p "$CACHE_DIR"

# Generate a cache key based on inputs
generate_cache_key() {
  local key
  key=$(echo "${PROMPT_NAME}:${PROMPT_FILE}:${PROMPT_INPUT}:${PROMPT_CONTEXT}:${MODEL}:${PROMPT_VERSION}" | md5sum | awk '{print $1}')
  echo "$key"
}

# Function to load a prompt from the prompt library
load_prompt_from_library() {
  local name="$1"
  local version="$2"
  
  # Path to the prompt library
  local PROMPT_LIBRARY_PATH="${HOME}/Documents/GitHub/InsightPulseAI_SKR/SKR/prompt_library"
  
  if [[ -z "$name" ]]; then
    echo "Error: Prompt name is required" >&2
    return 1
  fi
  
  # Check if prompt exists in library
  local prompt_dir="${PROMPT_LIBRARY_PATH}/${name}"
  if [[ ! -d "$prompt_dir" ]]; then
    echo "Error: Prompt '${name}' not found in prompt library" >&2
    return 1
  fi
  
  # If version specified, check for version
  if [[ -n "$version" ]]; then
    local version_file="${prompt_dir}/versions/${version}.txt"
    if [[ -f "$version_file" ]]; then
      cat "$version_file"
      return 0
    else
      echo "Error: Version '${version}' not found for prompt '${name}'" >&2
      return 1
    fi
  else
    # Use latest version (main prompt file)
    local main_file="${prompt_dir}/prompt.txt"
    if [[ -f "$main_file" ]]; then
      cat "$main_file"
      return 0
    else
      echo "Error: Main prompt file not found for '${name}'" >&2
      return 1
    fi
  fi
}

# Get prompt content
get_prompt_content() {
  if [[ -n "$PROMPT_FILE" && -f "$PROMPT_FILE" ]]; then
    # Load from specified file
    cat "$PROMPT_FILE"
  elif [[ -n "$PROMPT_NAME" ]]; then
    # Load from prompt library
    load_prompt_from_library "$PROMPT_NAME" "$PROMPT_VERSION"
  elif [[ -n "$PROMPT_INPUT" ]]; then
    # Use input directly
    echo "$PROMPT_INPUT"
  else
    echo "Error: No prompt source provided. Use --name, --file, or --input." >&2
    exit 1
  fi
}

# Check cache for existing result
check_cache() {
  local cache_key="$1"
  local cache_file="${CACHE_DIR}/${cache_key}.json"
  
  if [[ "$USE_CACHE" = true && -f "$cache_file" ]]; then
    cat "$cache_file"
    return 0
  fi
  
  return 1
}

# Save result to cache
save_to_cache() {
  local cache_key="$1"
  local result="$2"
  local cache_file="${CACHE_DIR}/${cache_key}.json"
  
  if [[ "$USE_CACHE" = true ]]; then
    echo "$result" > "$cache_file"
  fi
}

# Add prompt metadata
add_metadata() {
  local prompt="$1"
  
  # Add tags if provided
  if [[ -n "$PROMPT_TAGS" ]]; then
    prompt="Tags: ${PROMPT_TAGS}\n\n${prompt}"
  fi
  
  # Add context if provided
  if [[ -n "$PROMPT_CONTEXT" ]]; then
    prompt="Context: ${PROMPT_CONTEXT}\n\n${prompt}"
  fi
  
  echo -e "$prompt"
}

# Main execution
main() {
  # Get prompt content
  local prompt_content
  prompt_content=$(get_prompt_content)
  
  # Add metadata
  prompt_content=$(add_metadata "$prompt_content")
  
  # Generate cache key
  local cache_key
  cache_key=$(generate_cache_key)
  
  # Check cache
  if check_cache "$cache_key"; then
    echo "Result loaded from cache"
    return 0
  fi
  
  # Prepare Claude invocation
  local temp_file
  temp_file=$(mktemp)
  echo "$prompt_content" > "$temp_file"
  
  # Execute with Claude
  local result
  result=$(claude $MODEL --file "$temp_file")
  
  # Save to cache
  save_to_cache "$cache_key" "$result"
  
  # Save to output file if specified
  if [[ -n "$OUTPUT_FILE" ]]; then
    echo "$result" > "$OUTPUT_FILE"
    echo "Result saved to ${OUTPUT_FILE}"
  else
    # Print to stdout
    echo "$result"
  fi
  
  # Clean up
  rm "$temp_file"
}

# Run the main function
main