#!/bin/bash

# kalaw_register_doc.sh - Register and fetch PDF documents with metadata
# Usage: ./kalaw_register_doc.sh [doc_id] [doc_title] [doc_source] [source_url]

# Configuration
SKR_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
FETCH_SCRIPT="$SKR_ROOT/scripts/fetch_missing_artifact.sh"
LOG_FILE="$SKR_ROOT/SKR/skr_docs.yaml"
METADATA_DIR="$SKR_ROOT/SKR/metadata"

# Initialize with default parameters
DOC_ID=${1:-""}
DOC_TITLE=${2:-"Untitled Document"}
DOC_SOURCE=${3:-"manual"}
SOURCE_URL=${4:-""}
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Create necessary directories
mkdir -p "$METADATA_DIR"

# Validate parameters
if [ -z "$DOC_ID" ]; then
  echo "❌ Error: Missing document ID parameter."
  echo "Usage: ./kalaw_register_doc.sh [doc_id] [doc_title] [doc_source] [source_url]"
  exit 1
fi

# Clean the document ID (replace spaces with underscores, remove special characters)
DOC_ID=$(echo "$DOC_ID" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -cd '[:alnum:]_-')

# Create metadata file
METADATA_FILE="$METADATA_DIR/${DOC_ID}_meta.yaml"

echo "# Document Metadata" > "$METADATA_FILE"
echo "id: $DOC_ID" >> "$METADATA_FILE"
echo "title: \"$DOC_TITLE\"" >> "$METADATA_FILE"
echo "source: \"$DOC_SOURCE\"" >> "$METADATA_FILE"
if [ -n "$SOURCE_URL" ]; then
  echo "url: \"$SOURCE_URL\"" >> "$METADATA_FILE"
fi
echo "registered: \"$TIMESTAMP\"" >> "$METADATA_FILE"
echo "filename: \"skr_doc_${DOC_ID}.pdf\"" >> "$METADATA_FILE"

echo "📝 Created metadata file: $METADATA_FILE"

# Call the fetch_missing_artifact.sh script
if [ -f "$FETCH_SCRIPT" ]; then
  echo "🔄 Fetching document with ID: $DOC_ID"
  if bash "$FETCH_SCRIPT" "$DOC_ID" "$SOURCE_URL"; then
    echo "✅ Document fetched successfully"
    
    # Update metadata file status
    echo "status: available" >> "$METADATA_FILE"
    
    # Trigger Claudia for processing
    echo "🧠 Triggering Claudia for document processing..."
    Claudia
  else
    echo "⚠️ Document not found or download failed"
    echo "status: pending" >> "$METADATA_FILE"
  fi
else
  echo "❌ Error: Fetch script not found at $FETCH_SCRIPT"
  exit 1
fi

exit 0