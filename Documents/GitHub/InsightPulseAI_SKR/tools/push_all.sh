#!/bin/bash
# push_all.sh - Automatically commit and push changes to GitHub

cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR

# Run verification before pushing
echo "Running pre-push verification..."
./scripts/pulser-verify.sh
if [ $? -ne 0 ]; then
  echo "❌ Verification failed, aborting push"
  exit 1
fi

git add .
git commit -m "🔄 Auto-sync: $(date '+%Y-%m-%d %H:%M')"
git push origin main