#!/bin/bash
# setup.sh - Sets up the deploy optimization toolkit
# Usage: ./setup.sh [--route <route_name>]

set -e

# Default route
ROUTE="${1:-advisor}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️ Setting up Deploy Optimization Toolkit${NC}"

# Make all scripts executable
chmod +x ./hash_check.sh
chmod +x ./diff_analyzer.sh
chmod +x ./selective_packager.sh
chmod +x ./hot_redeploy.sh

# Create .vite-cache in route project
SRC_DIR="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/mockify-$ROUTE-ui"
if [ -d "$SRC_DIR" ]; then
  echo -e "${YELLOW}📊 Setting up Vite cache for $ROUTE...${NC}"
  mkdir -p "$SRC_DIR/.vite-cache"
  
  # Update vite.config.ts
  if [ -f "$SRC_DIR/vite.config.ts" ]; then
    node ./vite_cache_config.js "$SRC_DIR/vite.config.ts"
  fi
  
  # Update .gitignore
  if [ -f "$SRC_DIR/.gitignore" ]; then
    if ! grep -q ".vite-cache" "$SRC_DIR/.gitignore"; then
      echo -e "\n# Vite build cache\n.vite-cache" >> "$SRC_DIR/.gitignore"
      echo -e "${GREEN}✅ Updated .gitignore${NC}"
    else
      echo -e "${GREEN}✅ .gitignore already updated${NC}"
    fi
  else
    echo -e ".vite-cache" > "$SRC_DIR/.gitignore"
    echo -e "${GREEN}✅ Created .gitignore${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Source directory for route '$ROUTE' not found: $SRC_DIR${NC}"
  echo -e "${YELLOW}⚠️ Skipping route-specific setup${NC}"
fi

# Create system-level aliases for dash integration
ALIASES_FILE="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/pulser_aliases.sh"
if [ -f "$ALIASES_FILE" ]; then
  echo -e "${YELLOW}📊 Setting up system aliases...${NC}"
  
  # Check if aliases already exist
  if ! grep -q "dash_deploy()" "$ALIASES_FILE"; then
    cat >> "$ALIASES_FILE" << 'EOL'

# Deploy optimization toolkit integration
dash_deploy() {
  local route="${1:-advisor}"
  local options="${@:2}"
  node ~/Documents/GitHub/InsightPulseAI_SKR/tools/js/tools/cli/deploy_optimize/dash.deploy.js "$route" $options
}

dash_hot_redeploy() {
  local route="${1:-advisor}"
  ~/Documents/GitHub/InsightPulseAI_SKR/tools/js/tools/cli/deploy_optimize/hot_redeploy.sh "$route"
}

# Register with Dash agent
pulser_register_command dash_deploy "Deploy dashboard with optimizations" "route [--hot] [--skip-build] [--dry-run] [--prod|--test]"
pulser_register_command dash_hot_redeploy "Hot reload dashboard during development" "route"
EOL
    echo -e "${GREEN}✅ Added dash aliases to $ALIASES_FILE${NC}"
    echo -e "${YELLOW}⚠️ Run 'source $ALIASES_FILE' to load the new aliases${NC}"
  else
    echo -e "${GREEN}✅ Dash aliases already exist in $ALIASES_FILE${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Could not find aliases file: $ALIASES_FILE${NC}"
  echo -e "${YELLOW}⚠️ Skipping system aliases setup${NC}"
fi

echo -e "${GREEN}✅ Deploy Optimization Toolkit setup complete!${NC}"
echo -e "${BLUE}🚀 You can now use:${NC}"
echo -e "${YELLOW}   ./hot_redeploy.sh advisor${NC} - For quick development deployments"
echo -e "${YELLOW}   node ./dash.deploy.js advisor --hot${NC} - For Dash agent deployment"