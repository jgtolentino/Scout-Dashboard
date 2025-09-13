#!/bin/bash

echo "🚀 Transaction Trends POC Migration to project-scout"
echo "====================================================="
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

echo "🌿 Creating feature branch: feature/transaction-trends-poc-20250523"
git checkout -b feature/transaction-trends-poc-20250523

echo "🔗 Adding Pulser remote and fetching..."
git remote add pulser https://github.com/jgtolentino/pulser.git 2>/dev/null || echo "Remote pulser already exists"
git fetch pulser

echo "🍒 Cherry-picking commits with proper authorship..."

echo "  → Cherry-picking show-ready demo mode (8aad62e)..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 8aad62e

echo "  → Cherry-picking drill-down functionality (da0e77b)..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" da0e77b

echo "  → Cherry-picking user access setup (2591445)..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 2591445

echo "  → Cherry-picking post-deployment docs (5cfe899)..."
git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" 5cfe899

echo "🔍 Verifying authorship..."
echo "Recent commits:"
git log --oneline -4 --pretty=format:"%h %an <%ae> %s"
echo
echo

echo "🚀 Pushing feature branch..."
git push -u origin feature/transaction-trends-poc-20250523

echo
echo "✅ Transaction Trends POC migration complete!"
echo "🔗 Create PR at: https://github.com/tbwa-smp/project-scout/compare/feature/transaction-trends-poc-20250523"
echo
echo "📋 Next steps:"
echo "1. Review and merge the PR"
echo "2. Create mirror branch: mirror/transactions-poc-20250523"
echo "3. Proceed with Geographic Heatmap migration"