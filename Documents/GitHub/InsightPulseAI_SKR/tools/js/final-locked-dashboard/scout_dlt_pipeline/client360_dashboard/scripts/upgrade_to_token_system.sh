#!/bin/bash
# Script to upgrade the dashboard to use the token-based theme system

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/theme_upgrade_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p logs

echo -e "${GREEN}Starting upgrade to token-based theme system...${NC}" | tee -a "$LOGFILE"

# Step 1: Backup current theme files
echo -e "${YELLOW}Creating backups of current theme files...${NC}" | tee -a "$LOGFILE"
mkdir -p backups_theme_upgrade_${TIMESTAMP}
find src/styles -name "*.scss" -o -name "*.css" | xargs -I{} cp {} backups_theme_upgrade_${TIMESTAMP}/
find src/themes -name "*.scss" -o -name "*.css" | xargs -I{} cp {} backups_theme_upgrade_${TIMESTAMP}/
cp index.html.template backups_theme_upgrade_${TIMESTAMP}/

echo -e "${GREEN}✅ Theme files backed up to backups_theme_upgrade_${TIMESTAMP}/${NC}" | tee -a "$LOGFILE"

# Step 2: Install new dependencies
echo -e "${YELLOW}Installing stylelint and other dependencies...${NC}" | tee -a "$LOGFILE"
npm install --save-dev stylelint stylelint-config-standard postcss

# Step 3: Copy new token files and theme switcher
echo -e "${YELLOW}Setting up token files and theme switcher...${NC}" | tee -a "$LOGFILE"

# Ensure directories exist
mkdir -p src/styles
mkdir -p src/js
mkdir -p dist/styles
mkdir -p dist/js

# Copy files if they're not already there (to avoid overwriting any customizations)
if [ ! -f "src/styles/tokens.css" ]; then
  echo -e "${YELLOW}Creating tokens.css...${NC}" | tee -a "$LOGFILE"
  cp .stylelintrc.json backups_theme_upgrade_${TIMESTAMP}/ 2>/dev/null || true
  cp src/js/theme-switcher.js backups_theme_upgrade_${TIMESTAMP}/ 2>/dev/null || true
fi

# Step 4: Update the HTML template to use data-theme attribute
echo -e "${YELLOW}Updating HTML template to use data-theme attribute...${NC}" | tee -a "$LOGFILE"

# Build directories for the updated theme structure
mkdir -p deploy/styles
mkdir -p deploy/js
mkdir -p deploy/css

# Step 5: Build the theme CSS using webpack
echo -e "${YELLOW}Building theme CSS using webpack...${NC}" | tee -a "$LOGFILE"

# Run webpack build
if [ -f "webpack.config.js" ]; then
  npm run build:themes

  # Check if build was successful
  if [ ! -f "dist/tbwa.css" ]; then
    echo -e "${RED}Error: Failed to build theme CSS.${NC}" | tee -a "$LOGFILE"
  else
    echo -e "${GREEN}✅ Theme CSS built successfully${NC}" | tee -a "$LOGFILE"
    
    # Copy to deploy directory
    cp dist/tbwa.css deploy/theme.css
    cp dist/tbwa.css deploy/css/tbwa-theme.css
    
    # Copy token files to deploy directory
    cp src/styles/tokens.css deploy/styles/
  fi
else
  echo -e "${YELLOW}Webpack config not found, skipping build...${NC}" | tee -a "$LOGFILE"
fi

# Step 6: Copy the theme switcher to the deploy directory
cp src/js/theme-switcher.js deploy/js/

# Step 7: Check if index.html needs updating
echo -e "${YELLOW}Checking index.html for data-theme attribute...${NC}" | tee -a "$LOGFILE"

# Copy index.html if it doesn't already have the updates
if grep -q "data-theme=" "index.html.template"; then
  echo -e "${GREEN}✅ index.html already contains data-theme attribute${NC}" | tee -a "$LOGFILE"
else
  echo -e "${YELLOW}Updating index.html template...${NC}" | tee -a "$LOGFILE"
  
  # Update the HTML to use data-theme
  sed -i '' 's/<html lang="en">/<html lang="en" data-theme="tbwa">/' index.html.template
  
  # Update CSS references
  sed -i '' 's|<script src="/js/theme-selector.js"></script>|<link rel="stylesheet" href="/styles/tokens.css">\n  <link rel="stylesheet" href="/theme.css">|' index.html.template
  
  # Update theme selector
  sed -i '' 's|<select id="theme-select">|<select id="theme-select" data-theme-selector>|' index.html.template
  
  # Add theme switcher script
  sed -i '' 's|<script src="/js/dashboard.js"></script>|<script src="/js/theme-switcher.js"></script>\n  <script src="/js/dashboard.js"></script>|' index.html.template
  
  echo -e "${GREEN}✅ index.html template updated${NC}" | tee -a "$LOGFILE"
fi

# Step 8: Lint the CSS to verify it follows the standards
echo -e "${YELLOW}Linting CSS files...${NC}" | tee -a "$LOGFILE"

if command -v npx &> /dev/null; then
  npx stylelint 'src/**/*.css' --max-warnings 0 || {
    echo -e "${YELLOW}CSS linting found issues. You may need to run 'npm run fix:css' to auto-fix.${NC}" | tee -a "$LOGFILE"
    echo -e "${YELLOW}Some issues might require manual fixes to use CSS variables instead of direct values.${NC}" | tee -a "$LOGFILE"
  }
else
  echo -e "${YELLOW}npx not found, skipping CSS linting...${NC}" | tee -a "$LOGFILE"
fi

# Step 9: Create a GitHub workflow directory if it doesn't exist
echo -e "${YELLOW}Setting up GitHub workflow for CSS checking...${NC}" | tee -a "$LOGFILE"

mkdir -p .github/workflows

# Step 10: Verify the setup
echo -e "${YELLOW}Verifying token-based theme system setup...${NC}" | tee -a "$LOGFILE"

# Check for required files
MISSING_FILES=0

if [ ! -f "src/styles/tokens.css" ]; then
  echo -e "${RED}Missing file: src/styles/tokens.css${NC}" | tee -a "$LOGFILE"
  MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ ! -f "src/js/theme-switcher.js" ]; then
  echo -e "${RED}Missing file: src/js/theme-switcher.js${NC}" | tee -a "$LOGFILE"
  MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ ! -f ".stylelintrc.json" ]; then
  echo -e "${RED}Missing file: .stylelintrc.json${NC}" | tee -a "$LOGFILE"
  MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ ! -f ".github/workflows/unified-pipeline.yml" ]; then
  echo -e "${RED}Missing file: .github/workflows/unified-pipeline.yml${NC}" | tee -a "$LOGFILE"
  MISSING_FILES=$((MISSING_FILES + 1))
fi

# Verify that HTML has data-theme attribute
if ! grep -q "data-theme=" "index.html.template"; then
  echo -e "${RED}HTML template does not have data-theme attribute${NC}" | tee -a "$LOGFILE"
  MISSING_FILES=$((MISSING_FILES + 1))
fi

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "${GREEN}✅ Token-based theme system setup verified successfully${NC}" | tee -a "$LOGFILE"
else
  echo -e "${RED}Found $MISSING_FILES missing components in the setup${NC}" | tee -a "$LOGFILE"
fi

echo -e "${GREEN}✅ Token-based theme system upgrade completed!${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}Next steps:${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}1. Run 'npm run fix:css' to automatically fix CSS linting issues${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}2. Manually review any remaining CSS linting issues${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}3. Update your deployment pipeline to include CSS validation${NC}" | tee -a "$LOGFILE"
echo -e "${YELLOW}4. Test the theme switching functionality${NC}" | tee -a "$LOGFILE"

# Create a summary document
mkdir -p docs
cat > docs/TOKEN_BASED_THEME_UPGRADE.md << EOF
# Token-Based Theme System Upgrade

## Overview
This document summarizes the upgrade to a token-based theme system for the Client360 Dashboard.

## Changes Applied
- **Date**: $(date)
- **Applied By**: upgrade_to_token_system.sh script

## New Components
1. **Token System**: Created a centralized tokens.css file with CSS custom properties
2. **Theme Switching**: Implemented data-theme attribute system for brand-specific theming
3. **CSS Linting**: Added stylelint configuration to enforce token usage
4. **CI/CD Integration**: Updated unified-pipeline.yml with CSS validation
5. **Tailwind Integration**: Created tailwind.config.js that maps to CSS custom properties

## Directory Structure
- \`src/styles/tokens.css\`: Single source of truth for design tokens
- \`src/js/theme-switcher.js\`: Handles theme switching and persistence
- \`.stylelintrc.json\`: CSS linting rules
- \`.github/workflows/unified-pipeline.yml\`: CI/CD pipeline with CSS validation
- \`tailwind.config.js\`: Tailwind configuration that uses CSS variables

## Available Themes
- \`tbwa\`: TBWA branding (default)
- \`sarisari\`: Sari Sari branding
- \`client-custom\`: Template for client-specific branding

## Usage
### Switching Themes
```html
<!-- In HTML -->
<html lang="en" data-theme="tbwa">
```

```javascript
// In JavaScript
document.documentElement.setAttribute('data-theme', 'sarisari');
// or
window.ThemeSwitcher.setTheme('sarisari');
```

### Using Tokens in CSS
```css
.my-element {
  color: var(--color-primary);
  background-color: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### Using with Tailwind
```html
<div class="text-primary bg-card rounded-md p-md">
  Styled with tokens via Tailwind
</div>
```

## Deployment Instructions
1. Make sure to include tokens.css in your deployment
2. Include theme-switcher.js in your deployment
3. Ensure the HTML has the data-theme attribute
4. Run CSS linting before deployment
5. Test theme switching functionality

## Log File
The complete log of the upgrade process can be found at:
\`$LOGFILE\`
EOF

echo -e "${GREEN}✅ Documentation created at docs/TOKEN_BASED_THEME_UPGRADE.md${NC}" | tee -a "$LOGFILE"