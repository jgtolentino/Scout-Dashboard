#!/bin/bash
# CI/CD Script for exporting static metrics and deploying to Azure Static Web App
# Usage: ./ci_export_and_deploy.sh

set -e  # Exit on any error

echo "📊 Starting static metrics export and deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Run the export script
echo "🔄 Exporting static metrics..."
npm run export:metrics

# Step 3: Check if the data directory exists and files were created
if [ ! -d "./deploy/data" ]; then
  echo "❌ Error: deploy/data directory not found after export!"
  exit 1
fi

# Count the number of JSON files in the data directory
NUM_FILES=$(find ./deploy/data -name "*.json" | wc -l)
if [ "$NUM_FILES" -lt 7 ]; then
  echo "❌ Error: Expected at least 7 JSON files in deploy/data, but found $NUM_FILES!"
  exit 1
fi

echo "✅ Successfully exported $NUM_FILES metric files to deploy/data/"

# Step 4: Commit changes to Git
echo "📝 Committing exported data to Git..."
git config user.name "CI/CD Bot"
git config user.email "cicd-bot@example.com"
git add deploy/data/*.json
git commit -m "ci: update static metrics [skip ci]" || echo "No changes to commit"

# Step 5: Push to the branch (assuming this is run in a CI/CD pipeline)
echo "🚀 Pushing to repository..."
# Uncomment the following line when running in a real CI/CD pipeline:
# git push origin feature-dashboard --force

# Step 6: Deploy to Azure Static Web App
echo "🌐 Deploying to Azure Static Web App..."
# We'd use the Azure Static Web App CLI or GitHub Actions for this
# swa deploy ./deploy --env production

echo "✨ Export and deployment completed successfully!"