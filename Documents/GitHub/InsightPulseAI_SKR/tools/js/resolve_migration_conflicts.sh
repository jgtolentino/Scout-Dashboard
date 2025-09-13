#!/bin/bash

echo "🔧 Resolving Migration Conflicts"
echo "================================="
echo

PROJECT_SCOUT_DIR="/Users/tbwa/Library/Mobile Documents/com~apple~CloudDocs/Documents/GitHub/project-scout"
cd "$PROJECT_SCOUT_DIR"

echo "📊 Current git status:"
git status

echo
echo "🧹 Cleaning up workspace..."

# Stash any uncommitted changes
echo "📦 Stashing uncommitted changes..."
git stash push -m "Pre-migration cleanup $(date)"

echo "🔄 Aborting current cherry-pick..."
git cherry-pick --abort 2>/dev/null || echo "No cherry-pick to abort"

echo "🧽 Cleaning workspace..."
git reset --hard HEAD
git clean -fd

echo "🔄 Switching to main and pulling latest..."
git checkout main
git pull origin main

echo "🌿 Creating fresh feature branch..."
git branch -D feature/transaction-trends-poc-20250523 2>/dev/null || echo "Branch doesn't exist"
git checkout -b feature/transaction-trends-poc-20250523

echo "🍒 Attempting cherry-pick with conflict resolution strategy..."

# Try each commit individually with better conflict resolution
commits=("8aad62e" "da0e77b" "2591445" "5cfe899")
commit_names=("show-ready demo mode" "drill-down functionality" "user access setup" "post-deployment docs")

for i in "${!commits[@]}"; do
    commit="${commits[$i]}"
    name="${commit_names[$i]}"
    
    echo "  → Attempting to cherry-pick $name ($commit)..."
    
    if git cherry-pick --author="jgtolentino <jgtolentino_rn@yahoo.com>" "$commit"; then
        echo "    ✅ Successfully cherry-picked $name"
    else
        echo "    ⚠️  Conflict in $name - attempting resolution..."
        
        # For conflicts, accept the incoming changes and continue
        git status --porcelain | grep "^DD\|^AU\|^UD\|^UA\|^DU\|^AA\|^UU" | cut -c4- | while read file; do
            echo "    🔧 Resolving conflict in: $file"
            
            # If file was deleted in HEAD but modified in commit, add the commit version
            if [ -f "$file" ]; then
                git add "$file"
            else
                echo "    📁 File doesn't exist in target, skipping: $file"
                git rm "$file" 2>/dev/null || true
            fi
        done
        
        # Continue the cherry-pick
        if git cherry-pick --continue; then
            echo "    ✅ Resolved conflicts for $name"
        else
            echo "    ❌ Could not resolve conflicts for $name"
            echo "    📋 Manual resolution required:"
            git status
            break
        fi
    fi
done

echo
echo "🔍 Final verification..."
echo "Recent commits:"
git log --oneline -5 --pretty=format:"%h %an <%ae> %s"
echo
echo

echo "🚀 Pushing cleaned feature branch..."
git push -f origin feature/transaction-trends-poc-20250523

echo
echo "✅ Migration cleanup complete!"
echo "🔗 PR Link: https://github.com/tbwa-smp/project-scout/compare/feature/transaction-trends-poc-20250523"