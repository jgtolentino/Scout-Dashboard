#!/bin/bash

# Pulser Monorepo Migration Script
# Migrates from chaotic tools/js structure to clean monorepo layout

set -euo pipefail

echo "🚀 Starting Pulser Monorepo Migration..."

# Get the current directory (should be tools/js)
CURRENT_DIR=$(pwd)
echo "📍 Current directory: $CURRENT_DIR"

# Navigate to the true project root (2 levels up from tools/js)
PROJECT_ROOT=$(realpath ../../)
echo "📁 Project root: $PROJECT_ROOT"

# Create the new monorepo structure
echo "📂 Creating monorepo directory structure..."

# Create main directories
mkdir -p "$PROJECT_ROOT/pulser/frontend/src"
mkdir -p "$PROJECT_ROOT/pulser/frontend/public"
mkdir -p "$PROJECT_ROOT/pulser/api"
mkdir -p "$PROJECT_ROOT/pulser/scripts"
mkdir -p "$PROJECT_ROOT/pulser/docs"
mkdir -p "$PROJECT_ROOT/pulser/.github/workflows"

# Move API endpoints to proper structure
echo "🔄 Migrating API endpoints..."
if [ -d "api" ]; then
    cp -r api/* "$PROJECT_ROOT/pulser/api/"
fi

# Move frontend files (if they exist)
echo "🔄 Migrating frontend files..."
if [ -f "index.html" ]; then
    cp index.html "$PROJECT_ROOT/pulser/frontend/public/"
fi
if [ -f "package.json" ]; then
    cp package.json "$PROJECT_ROOT/pulser/frontend/"
fi
if [ -f "package-lock.json" ]; then
    cp package-lock.json "$PROJECT_ROOT/pulser/frontend/"
fi

# Move scripts
echo "🔄 Migrating deployment scripts..."
if [ -d "scripts" ]; then
    cp -r scripts/* "$PROJECT_ROOT/pulser/scripts/" 2>/dev/null || true
fi

# Copy essential deployment files
echo "🔄 Copying essential deployment files..."
if [ -f "staticwebapp.config.json" ]; then
    cp staticwebapp.config.json "$PROJECT_ROOT/pulser/"
fi

# Move GitHub workflows
echo "🔄 Migrating GitHub workflows..."
if [ -d ".github" ]; then
    cp -r .github/* "$PROJECT_ROOT/pulser/.github/"
fi

# Move documentation
echo "🔄 Migrating documentation..."
for doc in README*.md DEPLOYMENT*.md AZURE*.md; do
    if [ -f "$doc" ]; then
        cp "$doc" "$PROJECT_ROOT/pulser/docs/"
    fi
done

echo "✅ Monorepo structure created successfully!"

# Create the clean .gitignore
echo "📝 Creating clean .gitignore..."
cat > "$PROJECT_ROOT/pulser/.gitignore" << 'EOF'
# Dependencies
**/node_modules/
**/npm-debug.log*
**/yarn-debug.log*
**/yarn-error.log*

# Build outputs
**/dist/
**/build/
**/.next/
**/out/

# Environment files
**/.env
**/.env.local
**/.env.*.local

# IDE files
**/.vscode/
**/.idea/
*.swp
*.swo

# OS files
**/.DS_Store
**/Thumbs.db

# Logs
**/logs/
**/*.log

# Runtime data
**/pids/
**/*.pid
**/*.seed
**/*.pid.lock

# Coverage directory used by tools like istanbul
**/coverage/
**/.nyc_output/

# Azure Functions
**/bin/
**/obj/
**/.azure/

# Allow essential scripts and configs
!/scripts/
!/scripts/*.sh
!staticwebapp.config.json
!function.json
!host.json
!.gitignore
!README.md
!package.json
!package-lock.json
!tsconfig.json
EOF

echo "📋 Migration completed! Next steps:"
echo "1. Navigate to: cd $PROJECT_ROOT/pulser"
echo "2. Initialize git: git init"
echo "3. Stage clean files: git add ."
echo "4. Commit: git commit -m 'chore: migrate to clean monorepo structure'"
echo "5. Add remote and push"

echo "🎉 Pulser monorepo migration complete!"