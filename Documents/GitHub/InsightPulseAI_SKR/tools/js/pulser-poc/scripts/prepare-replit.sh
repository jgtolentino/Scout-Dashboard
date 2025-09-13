#!/bin/bash

echo "🚀 Preparing for Replit Deployment"
echo "================================="

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

# Create necessary directories
mkdir -p dist

# Copy lightweight dashboard as index.html
echo "📄 Copying lightweight dashboard..."
cp lightweight-dashboard.html dist/index.html

# Create a simple package verification
echo "📦 Verifying package structure..."
if [ -f "package.json" ] && [ -f "server.js" ] && [ -f ".replit" ]; then
    echo "✅ All required files present"
else
    echo "❌ Missing required files!"
    exit 1
fi

# Check API data
if [ -f "api/data/brands_500.json" ]; then
    echo "✅ Brands data found"
else
    echo "❌ Missing brands_500.json!"
    exit 1
fi

echo ""
echo "✨ Ready for Replit deployment!"
echo ""
echo "Next steps:"
echo "1. Upload this entire directory to Replit"
echo "2. Run 'npm ci' in Replit Shell"
echo "3. Run 'npm run build' to build production files"
echo "4. Run 'npm run start:prod' to test locally"
echo "5. Click Deploy → Autoscale"
echo ""
echo "📚 See REPLIT_DEPLOYMENT_GUIDE.md for detailed instructions"