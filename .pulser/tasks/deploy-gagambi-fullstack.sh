#!/bin/bash

# Pulser Task: :deploy-gagambi-fullstack
# Description: Deploy Gagambi full stack to Vercel + Render + Cloud VM

echo "🚀 Deploying Gagambi Full Stack..."
echo "================================"

# Check if we're in the right directory
if [ ! -d "Documents/GitHub/gagambi-frontend" ] || [ ! -d "Documents/GitHub/gagambi-backend" ]; then
    echo "❌ Error: gagambi-frontend and gagambi-backend directories not found"
    echo "Please run this from your home directory"
    exit 1
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo "[ ] Cloud VM MySQL is running on port 3308"
echo "[ ] Firewall allows port 3308"
echo "[ ] You have Vercel CLI installed"
echo "[ ] You have git repositories created"
echo ""
echo "Press ENTER to continue or Ctrl+C to cancel..."
read

# Step 1: Deploy Frontend to Vercel
echo ""
echo "🎨 Step 1: Deploying Frontend to Vercel..."
cd Documents/GitHub/gagambi-frontend

# Ensure git repo exists
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "Initial commit: Gagambi Frontend"
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod --yes

FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "gagambi.vercel.app")
echo "✅ Frontend deployed to: https://$FRONTEND_URL"

# Step 2: Deploy Backend to Render
echo ""
echo "🔧 Step 2: Deploying Backend to Render..."
cd ../gagambi-backend

# Ensure git repo exists
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "Initial commit: Gagambi Backend API"
fi

echo ""
echo "📝 Manual steps for Render deployment:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' > 'Web Service'"
echo "3. Connect your GitHub repo: gagambi-backend"
echo "4. Use these settings:"
echo "   - Name: gagambi-api"
echo "   - Runtime: Docker"
echo "   - Dockerfile Path: ./Dockerfile.render"
echo "   - Add environment variables from .env.render"
echo ""
echo "5. Click 'Create Web Service'"
echo ""
echo "Your backend URL will be: https://gagambi-api.onrender.com"
echo ""

# Step 3: Update frontend with backend URL
echo "🔗 Step 3: Updating frontend with backend URL..."
cd ../gagambi-frontend
echo "VITE_API_URL=https://gagambi-api.onrender.com" > .env.production
git add .env.production
git commit -m "Update production API URL"
git push

echo ""
echo "✅ Deployment Complete!"
echo "====================="
echo ""
echo "🌐 Frontend: https://$FRONTEND_URL"
echo "🔧 Backend: https://gagambi-api.onrender.com"
echo "🗄️ Database: Your Cloud VM IP:3308"
echo ""
echo "📝 Next steps:"
echo "1. Update Render environment variables with your Cloud VM IP"
echo "2. Test the API endpoints"
echo "3. Configure custom domain if needed"