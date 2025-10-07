#!/bin/bash
# Diagram handler for Claude adapter
# Processes diagram requests and manages rendering

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
PARENT_DIR=$(dirname "$SCRIPT_DIR")
LOG_FILE="$PARENT_DIR/claude_session.log"
ARTIFACTS_DIR="$PARENT_DIR/artifacts"
RENDERER="$SCRIPT_DIR/svg_renderer.py"

# Ensure artifacts directory exists
mkdir -p "$ARTIFACTS_DIR"

# Log message
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [Diagram Handler] $1" >> "$LOG_FILE"
}

# Process a diagram request
process_diagram() {
  local format="$1"
  local input="$2"
  local output_name="$3"
  local is_text="$4"
  
  # Default output name if not provided
  if [ -z "$output_name" ]; then
    output_name="diagram_$(date +%Y%m%d_%H%M%S).svg"
  fi
  
  # Ensure output has .svg extension
  if [[ "$output_name" != *.svg ]]; then
    output_name="${output_name}.svg"
  fi
  
  # Full output path
  local output_path="$ARTIFACTS_DIR/$output_name"
  
  log_message "Processing $format diagram, output: $output_name"
  
  # Prepare renderer args
  local renderer_args=""
  if [ "$is_text" = "true" ]; then
    renderer_args="--text --input \"$input\" --output \"$output_path\" --format $format"
  else
    # Input is a file
    renderer_args="--input \"$input\" --output \"$output_path\" --format $format"
  fi
  
  # Run the renderer
  python3 "$RENDERER" $renderer_args
  
  # Check if rendering was successful
  if [ $? -eq 0 ]; then
    log_message "Successfully rendered diagram to $output_name"
    echo "Diagram saved to: $output_path"
    echo "View with: open \"$output_path\""
  else
    log_message "Failed to render diagram"
    echo "Error: Failed to render diagram" >&2
    return 1
  fi
  
  return 0
}

# Help function
show_help() {
  echo "Diagram Generator"
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --format FORMAT    Diagram format (mermaid, dot, plantuml, text)"
  echo "  --input INPUT      Input file path or text content (with --text)"
  echo "  --output NAME      Output filename (defaults to timestamp)"
  echo "  --text             Treat input as text content instead of file path"
  echo "  --help             Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --format mermaid --input diagram.mmd"
  echo "  $0 --format text --text --input \"A flowchart showing user login process\""
}

# Parse command line arguments
FORMAT="mermaid"
INPUT=""
OUTPUT=""
IS_TEXT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --input)
      INPUT="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --text)
      IS_TEXT="true"
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help
      exit 1
      ;;
  esac
done

# Validate input
if [ -z "$INPUT" ]; then
  echo "Error: No input specified" >&2
  show_help
  exit 1
fi

if [ "$IS_TEXT" = "false" ] && [ ! -f "$INPUT" ]; then
  echo "Error: Input file '$INPUT' not found" >&2
  exit 1
fi

# Process the diagram
process_diagram "$FORMAT" "$INPUT" "$OUTPUT" "$IS_TEXT"