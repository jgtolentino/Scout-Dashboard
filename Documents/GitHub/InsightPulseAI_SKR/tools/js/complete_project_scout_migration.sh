#!/bin/bash

echo "🔄 Complete Project Scout Migration Workflow"
echo "=============================================="
echo

# Check if project-scout directory exists
PROJECT_SCOUT_DIR="/Users/tbwa/Library/Mobile Documents/com~apple~CloudDocs/Documents/GitHub/project-scout"

if [ ! -d "$PROJECT_SCOUT_DIR" ]; then
    echo "❌ Error: project-scout directory not found at $PROJECT_SCOUT_DIR"
    echo "Please check the path and try again."
    exit 1
fi

echo "📁 Navigating to project-scout directory..."
cd "$PROJECT_SCOUT_DIR"

# Function to create mirror branch
create_mirror_branch() {
    local branch_name=$1
    echo "🪞 Creating mirror branch: $branch_name"
    git checkout main
    git pull origin main
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
    echo "✅ Mirror branch $branch_name created"
}

echo "🚀 PHASE 1: Transaction Trends POC Migration"
echo "============================================="

# Step 1: Transaction Trends POC
echo "🔄 Syncing main branch..."
git checkout main
git pull origin main

echo "👤 Setting up git identity..."
git config user.name "jgtolentino"
git config user.email "jgtolentino_rn@yahoo.com"

echo "🌿 Creating feature branch: feature/transaction-trends-poc-20250523"
git checkout -b feature/transaction-trends-poc-20250523

echo "🔗 Adding Pulser remote and fetching..."
git remote add pulser https://github.com/jgtolentino/pulser.git 2>/dev/null || echo "Remote pulser already exists"
git fetch pulser

echo "🍒 Cherry-picking POC commits..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 8aad62e da0e77b 2591445 5cfe899

echo "🚀 Pushing POC feature branch..."
git push -u origin feature/transaction-trends-poc-20250523

echo "✅ Phase 1 complete!"
echo "🔗 POC PR: https://github.com/tbwa-smp/project-scout/compare/feature/transaction-trends-poc-20250523"
echo

read -p "⏸️  Please merge the POC PR, then press Enter to continue with Phase 2..."

echo
echo "🗺️ PHASE 2: Geographic Heatmap Migration"
echo "========================================="

# Step 2: Geographic Heatmap
echo "🔄 Syncing main branch..."
git checkout main
git pull origin main

echo "🌿 Creating heatmap feature branch: feature/transaction-heatmap-20250523"
git checkout -b feature/transaction-heatmap-20250523

echo "🍒 Cherry-picking heatmap commit..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 8958875

echo "🚀 Pushing heatmap feature branch..."
git push -u origin feature/transaction-heatmap-20250523

echo "✅ Phase 2 complete!"
echo "🔗 Heatmap PR: https://github.com/tbwa-smp/project-scout/compare/feature/transaction-heatmap-20250523"
echo

read -p "⏸️  Please merge the Heatmap PR, then press Enter to continue with Phase 3..."

echo
echo "🪞 PHASE 3: Create Mirror Branches"
echo "=================================="

# Step 3: Create mirror branches
create_mirror_branch "mirror/transactions-poc-20250523"
create_mirror_branch "mirror/transactions-heatmap-20250523"

echo
echo "🎉 MIGRATION COMPLETE!"
echo "======================"
echo "✅ Transaction Trends POC migrated and mirrored"
echo "✅ Geographic Heatmap migrated and mirrored"
echo "✅ Both features ready in project-scout repository"
echo
echo "📋 Next Steps:"
echo "1. Verify both features work in project-scout"
echo "2. Plan Product Mix & SKU Analysis module"
echo "3. Continue iterative development workflow"