#!/bin/bash

# Create the MockifyCreator folder on Desktop
DESKTOP_DIR="$HOME/Desktop/MockifyCreator"
SOURCE_DIR="$(dirname "$0")/mockify-creator"

echo "📁 Creating MockifyCreator folder on Desktop..."
mkdir -p "$DESKTOP_DIR"

# Copy all MockifyCreator files
echo "📋 Copying files..."

# Core files
cp "$SOURCE_DIR/server.js" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ server.js"
cp "$SOURCE_DIR/package.json" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ package.json"
cp "$SOURCE_DIR/.replit" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ .replit"
cp "$SOURCE_DIR/replit.nix" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ replit.nix"
cp "$SOURCE_DIR/.gitignore" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ .gitignore"
cp "$SOURCE_DIR/.env.example" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ .env.example"

# Documentation
cp "$SOURCE_DIR/README.md" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ README.md"
cp "$SOURCE_DIR/MOCKIFY_CREATOR_DEPLOYMENT.md" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ MOCKIFY_CREATOR_DEPLOYMENT.md"
cp "$SOURCE_DIR/REPLIT_SECRETS_GUIDE.md" "$DESKTOP_DIR/" 2>/dev/null && echo "✅ REPLIT_SECRETS_GUIDE.md"

# Scripts directory
mkdir -p "$DESKTOP_DIR/scripts"
cp "$SOURCE_DIR/scripts/generate-secrets.js" "$DESKTOP_DIR/scripts/" 2>/dev/null && echo "✅ scripts/generate-secrets.js"
cp "$SOURCE_DIR/scripts/test-secrets.js" "$DESKTOP_DIR/scripts/" 2>/dev/null && echo "✅ scripts/test-secrets.js"

echo ""
echo "✨ All files copied to: $DESKTOP_DIR"
echo ""
echo "📝 Next steps:"
echo "1. Open the MockifyCreator folder on your Desktop"
echo "2. Copy these files to your MockifyCreator GitHub repo"
echo "3. Push to GitHub and import to Replit"
echo "4. Follow the deployment guide in MOCKIFY_CREATOR_DEPLOYMENT.md"

# Open the folder (macOS)
open "$DESKTOP_DIR" 2>/dev/null