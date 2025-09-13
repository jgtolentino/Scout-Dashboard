#!/bin/bash
set -euo pipefail

# Ask CES Deployment Script using Vercel CLI

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Deploy to production
echo "Deploying Ask CES to production..."
vercel --prod

echo "Deployment completed successfully!" 