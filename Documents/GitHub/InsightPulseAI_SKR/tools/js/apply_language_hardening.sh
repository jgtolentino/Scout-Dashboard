#!/bin/bash
# apply_language_hardening.sh - Script to apply enforcement language hardening changes
# Part of patch: enforcement-language-hardening-v1

set -e

REPO_ROOT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR"
BACKUP_DIR="$REPO_ROOT/backup_pre_language_hardening"
LOG_FILE="$REPO_ROOT/logs/claude_sweep/enforcement_language_replacements.md"
DATE=$(date +"%Y-%m-%d")

echo "📝 Applying enforcement language hardening (enforcement-language-hardening-v1)..."

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "💾 Creating backups in $BACKUP_DIR..."

# Function to apply patch
apply_patch() {
  local original="$1"
  local patched="$2"
  
  if [ ! -f "$patched" ]; then
    echo "❌ Patched file not found: $patched"
    return 1
  fi
  
  if [ -f "$original" ]; then
    # Create backup
    cp "$original" "$BACKUP_DIR/$(basename "$original").$DATE.bak"
    echo "📋 Backed up: $original"
    
    # Apply patch
    cp "$patched" "$original"
    echo "✅ Applied patch: $original"
  else
    echo "❌ Original file not found: $original"
    return 1
  fi
}

# Apply SOP patches
echo "🔄 Applying SOP patches..."
apply_patch "$REPO_ROOT/docs/sops/prompt_usage_sop.md" "$REPO_ROOT/docs/sops/prompt_usage_sop.md.patched"
apply_patch "$REPO_ROOT/docs/sops/qa_validation_sop.md" "$REPO_ROOT/docs/sops/qa_validation_sop.md.patched"
apply_patch "$REPO_ROOT/docs/sops/cli_command_sop.md" "$REPO_ROOT/docs/sops/cli_command_sop.md.patched"

# Apply .pulserrc patch
echo "🔄 Applying .pulserrc patch..."
apply_patch "$REPO_ROOT/tools/js/final-locked-dashboard/.pulserrc" "$REPO_ROOT/tools/js/final-locked-dashboard/.pulserrc.patched"

echo "📊 Patch Summary:"
echo "- Modified 4 files"
echo "- Hardened language with 'MUST' instead of 'should'"
echo "- Added explicit enforcement comments"
echo "- Added fallback enforcement section in .pulserrc"

echo "🔍 See complete details in: $LOG_FILE"
echo "✅ All changes applied successfully!"

echo ""
echo "Next steps:"
echo "1. Review changes to ensure correct functioning"
echo "2. Run tests to verify no unintended consequences"
echo "3. Commit changes with message: 'Patch: enforcement-language-hardening-v1'"
echo ""
echo "To roll back changes if needed, run:"
echo "  cd $BACKUP_DIR && for f in *.bak; do cp \$f \"\${f%.$DATE.bak}\"; done"