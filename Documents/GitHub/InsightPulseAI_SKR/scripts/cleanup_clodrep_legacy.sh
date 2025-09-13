#!/bin/bash
# cleanup_clodrep_legacy.sh
# Cleans up deprecated clodrep files and creates an archive
# May 10, 2025

set -e

# Configuration
REPO_ROOT="${HOME}/Documents/GitHub/InsightPulseAI_SKR"
ARCHIVE_DIR="${REPO_ROOT}/archive/clodrep"
LOG_FILE="${HOME}/.pulser/logs/clodrep_cleanup.log"

# Create necessary directories
mkdir -p "${ARCHIVE_DIR}"
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
  echo "[$(date -Iseconds)] $1" | tee -a "$LOG_FILE"
}

# Start
log "Starting clodrep legacy cleanup"

# Archive legacy files
archive_files() {
  local src="$1"
  local dest="${ARCHIVE_DIR}/$(basename "$1")"
  
  if [[ -f "$src" ]]; then
    log "Archiving $src to $dest"
    cp "$src" "$dest"
    log "Adding deprecation header to $src"
    
    # Add deprecation notice to the top of the file
    local tmp_file=$(mktemp)
    echo "# DEPRECATED: This file is deprecated and scheduled for removal." > "$tmp_file"
    echo "# It has been replaced by ClaudePromptExecutor." >> "$tmp_file"
    echo "# See /docs/CLODREP_DEPRECATION.md for details." >> "$tmp_file"
    echo "# Archive date: $(date -Iseconds)" >> "$tmp_file"
    echo "" >> "$tmp_file"
    cat "$src" >> "$tmp_file"
    mv "$tmp_file" "$src"
  else
    log "Warning: File $src not found, skipping"
  fi
}

# Update shell aliases to include deprecation warnings
update_aliases() {
  log "Updating shell aliases with deprecation warnings"
  
  local zshrc="${HOME}/.zshrc"
  
  if grep -q "alias.*clodrep" "$zshrc"; then
    log "Found clodrep aliases in .zshrc, updating with warnings"
    
    # Create backup
    cp "$zshrc" "${zshrc}.clodrep_backup"
    
    # Replace clodrep aliases with warning versions
    sed -i.bak 's/alias.*clodrep/alias clodrep="echo \\"⚠️ Warning: clodrep is deprecated. Using Claude prompt executor instead.\\" \&\& pulser prompt test"/' "$zshrc"
    
    log "Updated aliases in .zshrc"
  else
    log "No clodrep aliases found in .zshrc"
  fi
}

# Files to archive
legacy_files=(
  "${REPO_ROOT}/tools/js/clodrep_cli.js"
  "${REPO_ROOT}/scripts/clodrep_test.sh"
  "${REPO_ROOT}/scripts/clodrep_sync.py"
  "${REPO_ROOT}/agents/clodrep.yaml"
)

# Archive each file
for file in "${legacy_files[@]}"; do
  archive_files "$file"
done

# Update shell aliases
update_aliases

# Create archive manifest
log "Creating archive manifest"
(
  echo "# Clodrep Archive Manifest"
  echo "# Created: $(date -Iseconds)"
  echo "# This archive contains deprecated clodrep components replaced by ClaudePromptExecutor"
  echo ""
  echo "## Archived Files"
  for file in "${legacy_files[@]}"; do
    echo "- $(basename "$file")"
  done
) > "${ARCHIVE_DIR}/README.md"

log "Cleanup complete. Archived files to ${ARCHIVE_DIR}"
log "See ${REPO_ROOT}/docs/CLODREP_DEPRECATION.md for full details"

exit 0