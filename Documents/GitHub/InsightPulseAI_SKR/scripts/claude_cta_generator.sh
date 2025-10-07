#!/bin/bash
# claude_cta_generator.sh
# Script for generating CTA text using ClaudePromptExecutor
# Integrates with the cta-demo web interface

set -e

# Configuration
PROMPT_LIBRARY_PATH="${HOME}/Documents/GitHub/InsightPulseAI_SKR/SKR/prompt_library"
CTA_PROMPT_PATH="${PROMPT_LIBRARY_PATH}/cta_generator/prompt.txt"
CLAUDE_PROMPT_TEST="${HOME}/Documents/GitHub/InsightPulseAI_SKR/scripts/claude_prompt_test.sh"
MODEL="claude-3-7-sonnet"
TEMP_DIR="/tmp"
LOG_DIR="${HOME}/.pulser/logs"
LOG_FILE="${LOG_DIR}/cta_generator.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log function
log_message() {
  local message="$1"
  echo "[$(date -Iseconds)] CTA_GENERATOR: $message" >> "$LOG_FILE"
}

# Parse arguments
PROMPT_TEXT=""
INPUT_FILE=""
OUTPUT_FILE=""
TEMPLATE="conversion"
INDUSTRY=""
GOAL=""
PRODUCT=""
AUDIENCE=""
OFFER=""
DEADLINE=""
VARIATIONS=false
EMOJI=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prompt)
      PROMPT_TEXT="$2"
      shift 2
      ;;
    --file)
      INPUT_FILE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --template)
      TEMPLATE="$2"
      shift 2
      ;;
    --industry)
      INDUSTRY="$2"
      shift 2
      ;;
    --goal)
      GOAL="$2"
      shift 2
      ;;
    --product)
      PRODUCT="$2"
      shift 2
      ;;
    --audience)
      AUDIENCE="$2"
      shift 2
      ;;
    --offer)
      OFFER="$2"
      shift 2
      ;;
    --deadline)
      DEADLINE="$2"
      shift 2
      ;;
    --variations)
      VARIATIONS=true
      shift
      ;;
    --emoji)
      EMOJI=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Function to build prompt from template
build_prompt() {
  local template_file="$CTA_PROMPT_PATH"
  local temp_prompt="${TEMP_DIR}/cta_prompt_$$.txt"
  
  # Check if base template exists
  if [[ ! -f "$template_file" ]]; then
    log_message "Error: CTA prompt template not found at $template_file"
    echo "Error: CTA prompt template not found."
    exit 1
  }
  
  # Copy base template
  cp "$template_file" "$temp_prompt"
  
  # Process template conditionals
  if [[ "$TEMPLATE" == "conversion" ]]; then
    # Keep conversion block
    sed -i.bak 's/{{#eq template "conversion"}}//' "$temp_prompt"
    sed -i.bak 's/{{\/eq}}//' "$temp_prompt"
    
    # Remove other template blocks
    sed -i.bak '/{{#eq template "engagement"}}/,/{{\/eq}}/d' "$temp_prompt"
    sed -i.bak '/{{#eq template "urgency"}}/,/{{\/eq}}/d' "$temp_prompt"
    
    # Replace parameters
    sed -i.bak "s/{{parameters.industry}}/$INDUSTRY/" "$temp_prompt"
    sed -i.bak "s/{{parameters.goal}}/$GOAL/" "$temp_prompt"
  elif [[ "$TEMPLATE" == "engagement" ]]; then
    # Keep engagement block
    sed -i.bak 's/{{#eq template "engagement"}}//' "$temp_prompt"
    sed -i.bak 's/{{\/eq}}//' "$temp_prompt"
    
    # Remove other template blocks
    sed -i.bak '/{{#eq template "conversion"}}/,/{{\/eq}}/d' "$temp_prompt"
    sed -i.bak '/{{#eq template "urgency"}}/,/{{\/eq}}/d' "$temp_prompt"
    
    # Replace parameters
    sed -i.bak "s/{{parameters.product}}/$PRODUCT/" "$temp_prompt"
    sed -i.bak "s/{{parameters.audience}}/$AUDIENCE/" "$temp_prompt"
  elif [[ "$TEMPLATE" == "urgency" ]]; then
    # Keep urgency block
    sed -i.bak 's/{{#eq template "urgency"}}//' "$temp_prompt"
    sed -i.bak 's/{{\/eq}}//' "$temp_prompt"
    
    # Remove other template blocks
    sed -i.bak '/{{#eq template "conversion"}}/,/{{\/eq}}/d' "$temp_prompt"
    sed -i.bak '/{{#eq template "engagement"}}/,/{{\/eq}}/d' "$temp_prompt"
    
    # Replace parameters
    sed -i.bak "s/{{parameters.offer}}/$OFFER/" "$temp_prompt"
    sed -i.bak "s/{{parameters.deadline}}/$DEADLINE/" "$temp_prompt"
  fi
  
  # Process options
  if [[ "$VARIATIONS" == true ]]; then
    sed -i.bak 's/{{#if options.variations}}//' "$temp_prompt"
    sed -i.bak 's/{{options.variations}}/3/' "$temp_prompt"
    sed -i.bak 's/{{\/if}}//' "$temp_prompt"
  else
    sed -i.bak '/{{#if options.variations}}/,/{{\/if}}/d' "$temp_prompt"
  fi
  
  if [[ "$EMOJI" == true ]]; then
    sed -i.bak 's/{{#if options.emoji}}//' "$temp_prompt"
    sed -i.bak 's/{{\/if}}//' "$temp_prompt"
  else
    sed -i.bak '/{{#if options.emoji}}/,/{{\/if}}/d' "$temp_prompt"
  fi
  
  # Return the path to the temporary prompt file
  echo "$temp_prompt"
}

# Main function
main() {
  local prompt_file=""
  
  # Log execution
  log_message "Executing CTA generator with template: $TEMPLATE"
  
  # Handle different prompt sources
  if [[ -n "$PROMPT_TEXT" ]]; then
    prompt_file="${TEMP_DIR}/cta_direct_$$.txt"
    echo "$PROMPT_TEXT" > "$prompt_file"
    log_message "Using direct prompt text"
  elif [[ -n "$INPUT_FILE" && -f "$INPUT_FILE" ]]; then
    prompt_file="$INPUT_FILE"
    log_message "Using input file: $INPUT_FILE"
  else
    # Build prompt from template
    prompt_file=$(build_prompt)
    log_message "Built prompt from template for $TEMPLATE"
  fi
  
  # Execute the prompt with Claude
  log_message "Executing prompt with ClaudePromptExecutor"
  
  local claude_args=("--file" "$prompt_file" "--model" "$MODEL")
  
  if [[ -n "$OUTPUT_FILE" ]]; then
    claude_args+=("--output" "$OUTPUT_FILE")
  fi
  
  # Run Claude prompt test script
  "$CLAUDE_PROMPT_TEST" "${claude_args[@]}"
  
  # Cleanup temporary files
  if [[ "$prompt_file" == /tmp/* ]]; then
    rm -f "$prompt_file" "${prompt_file}.bak"
  fi
  
  log_message "CTA generation complete"
}

# Run the main function
main