#!/bin/bash

# Direct Migration Script: Product Mix & SKU Analysis Module to project-scout
# This script directly copies files and creates commits in project-scout repository

set -e

echo "🔄 Starting Direct Product Mix & SKU Analysis Module Migration to project-scout..."

# Repository paths
SOURCE_REPO="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js"
TARGET_REPO="/Users/tbwa/Documents/GitHub/pulser"

# Feature details
MIRROR_BRANCH="mirror/product-mix-sku-20250523"

echo "📍 Source repository: $SOURCE_REPO"
echo "📍 Target repository: $TARGET_REPO"
echo "🌿 Target branch: $MIRROR_BRANCH"

# Navigate to target repository
echo "🚀 Navigating to project-scout repository..."
cd "$TARGET_REPO"

# Ensure we're on main and up to date
echo "📥 Updating main branch..."
git checkout main
git pull origin main

# Create mirror branch for the Product Mix & SKU Analysis module
echo "🌿 Creating mirror branch: $MIRROR_BRANCH"

# Delete existing branch if it exists
if git branch | grep -q "$MIRROR_BRANCH"; then
    echo "🗑️  Deleting existing branch: $MIRROR_BRANCH"
    git branch -D "$MIRROR_BRANCH"
fi

# Also delete remote branch if it exists
if git branch -r | grep -q "origin/$MIRROR_BRANCH"; then
    echo "🗑️  Deleting remote branch: origin/$MIRROR_BRANCH"
    git push origin --delete "$MIRROR_BRANCH" || true
fi

git checkout -b "$MIRROR_BRANCH"

# Copy the Product Mix & SKU Analysis module files
echo "📁 Copying Product Mix & SKU Analysis module files..."

# Create necessary directories
mkdir -p api/products/{mix,sku-performance,inventory,seasonal-trends}
mkdir -p frontend/products
mkdir -p migrations
mkdir -p tests

# Copy migration file
echo "  ✓ Copying database migration..."
cp "$SOURCE_REPO/migrations/06_sprint_product_mix_sku_analysis.sql" migrations/

# Copy API endpoints
echo "  ✓ Copying API endpoints..."
cp "$SOURCE_REPO/api/products/mix/index.js" api/products/mix/
cp "$SOURCE_REPO/api/products/mix/function.json" api/products/mix/
cp "$SOURCE_REPO/api/products/sku-performance/index.js" api/products/sku-performance/
cp "$SOURCE_REPO/api/products/sku-performance/function.json" api/products/sku-performance/
cp "$SOURCE_REPO/api/products/inventory/index.js" api/products/inventory/
cp "$SOURCE_REPO/api/products/inventory/function.json" api/products/inventory/
cp "$SOURCE_REPO/api/products/seasonal-trends/index.js" api/products/seasonal-trends/
cp "$SOURCE_REPO/api/products/seasonal-trends/function.json" api/products/seasonal-trends/

# Copy frontend
echo "  ✓ Copying frontend dashboard..."
cp "$SOURCE_REPO/frontend/products/index.html" frontend/products/

# Copy tests
echo "  ✓ Copying test suite..."
cp "$SOURCE_REPO/tests/product-mix-sku-analysis.spec.ts" tests/

# Add all files to git
echo "📝 Adding files to git..."
git add migrations/06_sprint_product_mix_sku_analysis.sql
git add api/products/
git add frontend/products/
git add tests/product-mix-sku-analysis.spec.ts

# Create commit
echo "💾 Creating commit..."
git commit -m "feat: implement Product Mix & SKU Analysis module

- Add comprehensive database schema with ProductDimension, InventoryFact, SalesFact tables
- Implement 4 specialized API endpoints for product analysis
- Create interactive React dashboard with multiple visualization components
- Add comprehensive Playwright test suite
- Support for product mix analysis, SKU performance tracking, inventory density mapping, and seasonal trends

Co-Authored-By: Claude <noreply@anthropic.com>"

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

# Show commit details
echo "📊 Commit details:"
git log -1 --stat

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
cd "$SOURCE_REPO"
echo "📍 Returned to source repository"