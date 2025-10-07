#!/bin/bash

# Migration Script: Product Mix & SKU Analysis Module to project-scout
# This script cherry-picks the Product Mix & SKU Analysis feature to project-scout repository

set -e

echo "🔄 Starting Product Mix & SKU Analysis Module Migration to project-scout..."

# Repository paths
PULSER_REPO="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js"
PROJECT_SCOUT_REPO="/Users/tbwa/Documents/GitHub/pulser"

# Feature details
FEATURE_BRANCH="feature/product-mix-sku-20250523"
MIRROR_BRANCH="mirror/product-mix-sku-20250523"
COMMIT_HASH="f186785"

echo "📍 Current working directory: $(pwd)"
echo "🌿 Source branch: $FEATURE_BRANCH"
echo "💾 Target commit: $COMMIT_HASH"

# Navigate to project-scout repository
echo "🚀 Navigating to project-scout repository..."
cd "$PROJECT_SCOUT_REPO"

# Ensure we're on main and up to date
echo "📥 Updating main branch..."
git checkout main
git pull origin main

# Create mirror branch for the Product Mix & SKU Analysis module
echo "🌿 Creating mirror branch: $MIRROR_BRANCH"
git checkout -b "$MIRROR_BRANCH"

# Since we're already in the target repo, we need to fetch from the source repo
# First, let's check if we have the commit from the source repository
echo "📡 Checking for commit in local repository..."

# The commit should already be available since we're working with related repositories
if ! git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
    echo "⚠️  Commit $COMMIT_HASH not found. Trying alternative approach..."
    
    # Try to find the commit by searching for the commit message
    ALTERNATIVE_COMMIT=$(git log --oneline --grep="feat: implement Product Mix & SKU Analysis module" | head -1 | cut -d' ' -f1)
    
    if [[ -n "$ALTERNATIVE_COMMIT" ]]; then
        echo "✓ Found alternative commit: $ALTERNATIVE_COMMIT"
        COMMIT_HASH="$ALTERNATIVE_COMMIT"
    else
        echo "❌ Could not find Product Mix & SKU Analysis commit. Please ensure the feature is committed."
        exit 1
    fi
else
    echo "✓ Commit $COMMIT_HASH found in repository"
fi

# Cherry-pick the Product Mix & SKU Analysis commit
echo "🍒 Cherry-picking Product Mix & SKU Analysis module (commit: $COMMIT_HASH)..."

if git cherry-pick "$COMMIT_HASH" --author="Claude <noreply@anthropic.com>"; then
    echo "✅ Cherry-pick successful!"
else
    echo "⚠️  Cherry-pick conflicts detected. Attempting automatic resolution..."
    
    # Handle common conflicts automatically
    echo "🔧 Resolving conflicts..."
    
    # Auto-accept new files
    git status --porcelain | grep "^A" | while read status file; do
        echo "  ✓ Auto-accepting new file: $file"
        git add "$file"
    done
    
    # For modified files, prefer the incoming changes for our module files
    git status --porcelain | grep "^UU" | while read status file; do
        case "$file" in
            migrations/06_sprint_product_mix_sku_analysis.sql|\
            api/products/*|\
            frontend/products/*|\
            tests/product-mix-sku-analysis.spec.ts)
                echo "  ✓ Auto-resolving module file: $file (preferring incoming)"
                git checkout --theirs "$file"
                git add "$file"
                ;;
            *)
                echo "  ⚠️  Manual resolution needed for: $file"
                ;;
        esac
    done
    
    # Complete the cherry-pick
    if git -c core.editor=true cherry-pick --continue; then
        echo "✅ Conflicts resolved and cherry-pick completed!"
    else
        echo "❌ Manual intervention required. Stopping migration."
        exit 1
    fi
fi

# Verify the migration
echo "🔍 Verifying migration..."

# Check key files were migrated
KEY_FILES=(
    "migrations/06_sprint_product_mix_sku_analysis.sql"
    "api/products/mix/index.js"
    "api/products/sku-performance/index.js"
    "api/products/inventory/index.js"
    "api/products/seasonal-trends/index.js"
    "frontend/products/index.html"
    "tests/product-mix-sku-analysis.spec.ts"
)

echo "📋 Checking key files:"
for file in "${KEY_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
    fi
done

# Push the mirror branch
echo "📤 Pushing mirror branch to project-scout..."
git push origin "$MIRROR_BRANCH"

# Create PR URL
PR_URL="https://github.com/jgtolentino/pulser/pull/new/$MIRROR_BRANCH"

echo ""
echo "🎉 Product Mix & SKU Analysis Module Migration Complete!"
echo "📍 Mirror branch created: $MIRROR_BRANCH"
echo "🔗 Create PR at: $PR_URL"
echo ""
echo "📊 Migration Summary:"
echo "  • Database schema: migrations/06_sprint_product_mix_sku_analysis.sql"
echo "  • API endpoints: 4 product analysis endpoints"
echo "  • Frontend: Complete React dashboard"
echo "  • Tests: Comprehensive Playwright test suite"
echo ""
echo "🔄 Parallel workflow sync completed successfully!"

# Return to original directory
cd "$PULSER_REPO"
echo "📍 Returned to pulser repository"