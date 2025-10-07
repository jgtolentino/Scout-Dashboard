#!/bin/bash
# CI Guardrail to prevent cloud API leakage
# Run this in CI to fail builds that introduce cloud dependencies

set -e

echo "🔒 Cloud API Leakage Guard"
echo "========================="
echo ""

# Define patterns to search for
CLOUD_PATTERNS="openai|anthropic|azure|claude|supabase"
SENSITIVE_PATTERNS="apiKey|api_key|API_KEY|secret|SECRET|token|TOKEN"

# Directories to exclude
EXCLUDE_DIRS="node_modules|.git|coverage|dist|build|.next|out"
EXCLUDE_FILES="README|LICENSE|CHANGELOG|package-lock.json|yarn.lock|.md$"

# Search for cloud references
echo "🔍 Scanning for cloud API references..."

FOUND_ISSUES=0

# Search in code files
CODE_MATCHES=$(grep -r -E "$CLOUD_PATTERNS" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.json" \
    --include="*.yaml" \
    --include="*.yml" \
    --include="*.env*" \
    . 2>/dev/null | \
    grep -v -E "$EXCLUDE_DIRS" | \
    grep -v -E "$EXCLUDE_FILES" | \
    grep -E "$SENSITIVE_PATTERNS" || true)

if [ -n "$CODE_MATCHES" ]; then
    echo "❌ Found cloud API references in code:"
    echo "$CODE_MATCHES" | sed 's/^/  /'
    FOUND_ISSUES=1
fi

# Check for hardcoded values
echo ""
echo "🔍 Checking for hardcoded secrets..."

HARDCODED=$(grep -r -E "(sk-[a-zA-Z0-9]{48}|key-[a-zA-Z0-9]{32}|['\"]AZURE['\"].*['\"][a-zA-Z0-9]{32})" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    . 2>/dev/null | \
    grep -v -E "$EXCLUDE_DIRS" || true)

if [ -n "$HARDCODED" ]; then
    echo "❌ Found potential hardcoded secrets:"
    echo "$HARDCODED" | sed 's/^/  /'
    FOUND_ISSUES=1
fi

# Check VS Code extension
echo ""
echo "🔍 Checking VS Code extension..."

EXT_CLOUD=$(grep -r "claude\|anthropic\|openai" cline-wrapper/src/ 2>/dev/null | \
    grep -v "// Local" | \
    grep -v "comment" || true)

if [ -n "$EXT_CLOUD" ]; then
    echo "❌ Found cloud references in VS Code extension:"
    echo "$EXT_CLOUD" | sed 's/^/  /'
    FOUND_ISSUES=1
fi

# Check configuration files
echo ""
echo "🔍 Checking configuration files..."

CONFIG_ISSUES=$(grep -r "enabled: true" . --include="*.yml" --include="*.yaml" 2>/dev/null | \
    grep -E "(claude|anthropic|openai|azure)" | \
    grep -v "enabled: false" || true)

if [ -n "$CONFIG_ISSUES" ]; then
    echo "❌ Found enabled cloud services in config:"
    echo "$CONFIG_ISSUES" | sed 's/^/  /'
    FOUND_ISSUES=1
fi

# Final report
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ No cloud API leaks detected!"
    echo "🎉 Safe to proceed with local-only operation"
    exit 0
else
    echo "❌ Cloud API references detected!"
    echo ""
    echo "🔧 To fix:"
    echo "  1. Remove all API keys and secrets"
    echo "  2. Replace cloud endpoints with local alternatives"
    echo "  3. Set all cloud services to 'enabled: false'"
    echo "  4. Run ./remove-cloud-refs.sh to clean automatically"
    echo ""
    echo "📚 For more info, see: MODELS.md"
    exit 1
fi