#!/bin/bash

echo "🗺️ Geographic Heatmap Migration to project-scout"
echo "================================================="
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

echo "🔄 Syncing main branch..."
git checkout main
git pull origin main

echo "👤 Setting up git identity..."
git config user.name "jgtolentino"
git config user.email "jgtolentino_rn@yahoo.com"

echo "🌿 Creating feature branch: feature/transaction-heatmap-20250523"
git checkout -b feature/transaction-heatmap-20250523

echo "🔗 Fetching latest from Pulser..."
git fetch pulser

echo "🍒 Cherry-picking heatmap implementation..."
echo "  → Cherry-picking geographic heatmap (8958875)..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 8958875

echo "🔍 Verifying authorship..."
echo "Recent commits:"
git log --oneline -1 --pretty=format:"%h %an <%ae> %s"
echo
echo

echo "🚀 Pushing feature branch..."
git push -u origin feature/transaction-heatmap-20250523

echo
echo "✅ Geographic Heatmap migration complete!"
echo "🔗 Create PR at: https://github.com/tbwa-smp/project-scout/compare/feature/transaction-heatmap-20250523"
echo
echo "📋 What was migrated:"
echo "  ✅ Database migration for GeoDimension table"
echo "  ✅ sp_GetTransactionDensity stored procedure"
echo "  ✅ /api/transactions/heatmap endpoint"
echo "  ✅ HeatmapChart React component"
echo "  ✅ Comprehensive Playwright tests"
echo "  ✅ Updated desired-state manifest"