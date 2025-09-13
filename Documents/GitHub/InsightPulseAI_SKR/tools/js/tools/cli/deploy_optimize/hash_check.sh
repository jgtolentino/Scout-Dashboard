#!/bin/bash
# hash_check.sh - Hash-based build diffing to avoid unnecessary deploys
# Usage: ./hash_check.sh <directory> <file_to_check>

set -e

DIRECTORY="${1:-dist}"
FILE_TO_CHECK="${2:-index.html}"
HASH_FILE="./.build-hash"

# Check if built output exists
if [ ! -d "$DIRECTORY" ]; then
  echo "🏗️ No previous build found. Building fresh."
  exit 0
fi

if [ ! -f "$DIRECTORY/$FILE_TO_CHECK" ]; then
  echo "🏗️ Key file $FILE_TO_CHECK not found. Building fresh."
  exit 0
fi

# Calculate hash of current build
calculate_hash() {
  find "$DIRECTORY" -type f -name "*.html" -o -name "*.js" -o -name "*.css" | 
    sort | 
    xargs cat | 
    sha256sum | 
    awk '{print $1}'
}

# Store previous hash if exists
if [ -f "$HASH_FILE" ]; then
  OLD_HASH=$(cat "$HASH_FILE")
else
  OLD_HASH=""
  echo "📝 No previous hash record found."
fi

# Calculate current hash before build
CURRENT_HASH=$(calculate_hash)

echo "📊 Previous build hash: ${OLD_HASH:0:10}..."
echo "📊 Current files hash: ${CURRENT_HASH:0:10}..."

# Compare hashes and determine if build is needed
if [ "$OLD_HASH" = "$CURRENT_HASH" ]; then
  echo "✅ No changes detected in build output. Skipping build."
  exit 1
else
  echo "🔄 Changes detected. Proceeding with build."
  echo "$CURRENT_HASH" > "$HASH_FILE"
  exit 0
fi