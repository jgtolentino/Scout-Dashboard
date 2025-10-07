#!/bin/bash
# Dashboard Rollback Component Fix Script
# This script ensures that the rollback component styles are properly included in theme files
# and fixes the issues with the TBWA theme in the client360 dashboard

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}     Client360 Dashboard Rollback Component Fix      ${NC}"
echo -e "${CYAN}=====================================================${NC}\n"

# Create directories for logs and backups
mkdir -p logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/rollback_fix_${TIMESTAMP}.log"
BACKUP_DIR="backups_rollback_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backups of theme files...${NC}" | tee -a "$LOG_FILE"
cp -f client360_dashboard/src/themes/tbwa.scss "$BACKUP_DIR/tbwa.scss.bak"
cp -f client360_dashboard/src/styles/variables-tbwa.scss "$BACKUP_DIR/variables-tbwa.scss.bak"
cp -f client360_dashboard/src/styles/common.scss "$BACKUP_DIR/common.scss.bak"
cp -f client360_dashboard/scripts/build-tbwa-theme.sh "$BACKUP_DIR/build-tbwa-theme.sh.bak"
cp -f client360_dashboard/scripts/deploy_tbwa_theme.sh "$BACKUP_DIR/deploy_tbwa_theme.sh.bak"
cp -f client360_dashboard/deploy_to_azure.sh "$BACKUP_DIR/deploy_to_azure.sh.bak"

echo -e "${GREEN}✅ Created backups in $BACKUP_DIR${NC}" | tee -a "$LOG_FILE"

# Step 1: Ensure rollback component styles are in the TBWA theme file
echo -e "\n${BLUE}Step 1: Verify rollback component styles in TBWA theme${NC}" | tee -a "$LOG_FILE"

cd client360_dashboard

# Check if rollback styles exist in the TBWA theme
if ! grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${RED}⚠️ Rollback component styles missing from TBWA theme. Adding them now...${NC}" | tee -a "../$LOG_FILE"
  
  # Add the rollback component styles to the TBWA theme file
  cat >> src/themes/tbwa.scss << 'EOL'

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: var(--rollback-bg, var(--bg-card)); // Fallback to --bg-card if explicit var not available
  border: 3px solid var(--rollback-border, var(--color-secondary)); // TBWA Cyan - with fallback
  border-radius: var(--border-radius); // 8px
  padding: var(--spacing-lg); // 24px
  margin-bottom: var(--spacing-xl); // 32px
  box-shadow: var(--box-shadow); // 0 4px 6px rgba(0, 0, 0, 0.08)
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md); // 16px
    
    h3 {
      color: var(--rollback-title, var(--color-primary)); // TBWA Navy with fallback
      font-size: var(--font-size-xl); // 20px
      font-weight: var(--font-weight-semibold); // 600
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
      letter-spacing: var(--letter-spacing-tight); // Tight for headlines
      position: relative; // Added for the underline effect
      
      &:after { // Added underline effect similar to other TBWA elements
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 3px;
        background-color: var(--rollback-border, var(--color-secondary)); // TBWA Cyan with fallback
        border-radius: 1.5px;
      }
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-semibold); // 600
      font-size: var(--font-size-sm); // 14px
      border-radius: 6px; // Rounded corners for status
      padding: 0.25rem 0.75rem; // Padding for badge look
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: var(--spacing-xs); // 4px
      }
      
      &.active {
        color: var(--color-success);
        background-color: rgba(var(--color-success-rgb), 0.1); // Light green background
        
        &::before {
          background-color: var(--color-success);
        }
      }
      
      &.inactive {
        color: var(--color-warning);
        background-color: rgba(var(--color-warning-rgb), 0.1); // Light orange background
        
        &::before {
          background-color: var(--color-warning);
        }
      }
    }
  }
  
  &-content {
    margin-bottom: var(--spacing-md); // 16px
    margin-top: var(--spacing-md); // Added margin top to account for the header's underline
    
    p {
      color: var(--rollback-text, var(--text-secondary)); // Mid-grey with fallback
      margin-bottom: var(--spacing-sm); // 8px
      font-size: var(--font-size-sm); // 14px
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: var(--rollback-info-bg, rgba(var(--color-secondary-rgb), 0.1)); // Light cyan background with fallback
      padding: var(--spacing-sm) var(--spacing-md); // 8px 16px
      border-radius: var(--border-radius); // 8px
      margin-top: var(--spacing-sm); // 8px
      border-left: 3px solid var(--rollback-border, var(--color-secondary)); // Left border with fallback
      
      .version-label {
        font-weight: var(--font-weight-semibold); // 600
        color: var(--rollback-title, var(--color-primary)); // TBWA Navy with fallback
        font-size: var(--font-size-sm); // 14px
      }
      
      .version-value {
        font-family: monospace;
        color: var(--text-primary); // Charcoal
        font-size: var(--font-size-sm); // 14px
        background-color: rgba(var(--color-primary-rgb), 0.05); // Light blue background
        padding: 0.1rem 0.5rem;
        border-radius: 4px;
      }
    }
  }
  
  &-actions {
    display: flex;
    gap: var(--spacing-md); // 16px
    
    .btn-rollback {
      background-color: var(--rollback-action-primary, var(--color-primary)); // TBWA Navy with fallback
      color: white;
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg); // More consistent padding
      font-weight: var(--font-weight-semibold); // 600
      border-radius: 6px; // Per spec
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm); // 14px
      
      &:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-2px); // Slight elevation on hover
      }
      
      &:disabled {
        background-color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .btn-verify {
      background-color: var(--rollback-action-secondary, var(--color-secondary)); // TBWA Cyan with fallback
      color: var(--rollback-action-primary, var(--color-primary)); // TBWA Navy with fallback
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg); // More consistent padding
      font-weight: var(--font-weight-semibold); // 600
      border-radius: 6px; // Per spec
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm); // 14px
      
      &:hover {
        background-color: var(--color-secondary-dark);
        transform: translateY(-2px); // Slight elevation on hover
      }
    }
  }
  
  &-log {
    margin-top: var(--spacing-lg); // 24px
    background-color: var(--bg-tertiary); // Slightly darker background for contrast
    border-radius: var(--border-radius); // 8px
    padding: var(--spacing-md); // 16px
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--font-size-sm); // Slightly larger for better readability
    border-left: 3px solid var(--rollback-border, var(--color-secondary)); // Left border with fallback
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
EOL
  echo -e "${GREEN}✅ Added rollback component styles to TBWA theme${NC}" | tee -a "../$LOG_FILE"
else
  echo -e "${GREEN}✅ Rollback component styles found in TBWA theme${NC}" | tee -a "../$LOG_FILE"
fi

# Step 2: Ensure rollback variables are in the TBWA variables file
echo -e "\n${BLUE}Step 2: Verify rollback variables in TBWA variables${NC}" | tee -a "../$LOG_FILE"

if ! grep -q "rollback-bg" src/styles/variables-tbwa.scss; then
  echo -e "${YELLOW}⚠️ Rollback variables missing from TBWA variables. Adding them now...${NC}" | tee -a "../$LOG_FILE"
  
  # Add the rollback component variables to the TBWA variables file
  cat >> src/styles/variables-tbwa.scss << 'EOL'

  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: #00C3EC;
  --rollback-title: #002B80;
  --rollback-text: #777777;
  --rollback-action-primary: #002B80;
  --rollback-action-secondary: #00C3EC;
  --rollback-info-bg: rgba(0, 195, 236, 0.1);
  --rollback-action-text: #FFFFFF;
  --rollback-action-text-secondary: #002B80;
  --rollback-header-height: 32px;
  --rollback-content-padding: 24px;
  --rollback-border-radius: 8px;
EOL
  echo -e "${GREEN}✅ Added rollback variables to TBWA variables${NC}" | tee -a "../$LOG_FILE"
else
  echo -e "${GREEN}✅ Rollback variables found in TBWA variables${NC}" | tee -a "../$LOG_FILE"
fi

# Step 3: Verify rollback component styles in build-tbwa-theme.sh script
echo -e "\n${BLUE}Step 3: Update build-tbwa-theme.sh script to ensure rollback styles${NC}" | tee -a "../$LOG_FILE"

if [ -f "scripts/build-tbwa-theme.sh" ]; then
  # Make sure the script is executable
  chmod +x scripts/build-tbwa-theme.sh
  
  # Update the build-tbwa-theme.sh script to ensure it checks for rollback styles
  if ! grep -q "if ! grep -q \"rollback-dashboard\" src/themes/tbwa.scss" scripts/build-tbwa-theme.sh; then
    echo -e "${YELLOW}⚠️ Updating build-tbwa-theme.sh to check for rollback styles...${NC}" | tee -a "../$LOG_FILE"
    
    # Create a temporary file for the updated script
    cat > "scripts/build-tbwa-theme.sh.new" << 'EOL'
#!/bin/bash
# Build script for TBWA theme CSS bundle

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building TBWA theme CSS bundle...${NC}"

# Check if webpack is installed
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx command not found. Please install Node.js and npm.${NC}"
  exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Check if the assets directory exists in dist
if [ ! -d "dist/assets" ]; then
  mkdir -p dist/assets
fi

# Ensure the TBWA logo directory exists
if [ ! -d "assets/logos" ]; then
  mkdir -p assets/logos
fi

# Check if the webp logo exists
if [ ! -f "assets/logos/tbwasmp-logo.webp" ]; then
  echo -e "${YELLOW}Looking for tbwasmp-logo.webp...${NC}"
  
  # Check if the file has been downloaded to the user's Downloads folder
  USER_HOME=$(eval echo ~${USER})
  DOWNLOAD_PATHS=(
    "${USER_HOME}/Downloads/tbwasmp-logo.webp"
    "${USER_HOME}/Desktop/tbwasmp-logo.webp"
    "/tmp/tbwasmp-logo.webp"
  )
  
  LOGO_FOUND=false
  for SEARCH_PATH in "${DOWNLOAD_PATHS[@]}"; do
    if [ -f "$SEARCH_PATH" ]; then
      echo -e "${GREEN}Found the logo at: $SEARCH_PATH${NC}"
      cp "$SEARCH_PATH" "assets/logos/tbwasmp-logo.webp"
      LOGO_FOUND=true
      break
    fi
  done
  
  # If logo not found, search more efficiently in recent temp directories (last day)
  if [ "$LOGO_FOUND" = false ] && [ -d "/var/folders" ]; then
    echo -e "${YELLOW}Searching in recent temporary directories...${NC}"
    # Only search in folders modified in the last day to avoid long searches
    FOUND_LOGO=$(find /var/folders -type f -name "tbwasmp-logo.webp" -mtime -1 2>/dev/null | head -n 1)
    if [ -n "$FOUND_LOGO" ]; then
      echo -e "${GREEN}Found the logo at: $FOUND_LOGO${NC}"
      cp "$FOUND_LOGO" "assets/logos/tbwasmp-logo.webp"
      LOGO_FOUND=true
    fi
  fi
  
  # If logo still not found, create the SVG placeholder and update CSS
  if [ "$LOGO_FOUND" = false ]; then
    echo -e "${YELLOW}Warning: Could not find tbwasmp-logo.webp. Creating fallback SVG logo.${NC}"
    
    # Create a fallback SVG logo with correct TBWA colors
    cat > assets/logos/tbwa-logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">
  <rect width="160" height="40" fill="#002B80"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00C3EC" font-family="Arial" font-weight="bold" font-size="16">TBWA SMP</text>
</svg>
EOF
    
    # Update variables-tbwa.scss to use the SVG instead - create a new file and move it
    cat src/styles/variables-tbwa.scss | sed 's|url(.*/tbwasmp-logo.webp)|url(\"/assets/logos/tbwa-logo.svg\")|g' > src/styles/variables-tbwa.scss.new
    mv src/styles/variables-tbwa.scss.new src/styles/variables-tbwa.scss
    echo -e "${YELLOW}Updated variables-tbwa.scss to use fallback SVG logo${NC}"
    
    # Create a directory for the SVG if it doesn't exist
    mkdir -p client360/public/assets/logos
    
    # Verify the change was made
    if grep -q "tbwa-logo.svg" src/styles/variables-tbwa.scss; then
      echo -e "${GREEN}Successfully updated CSS to use SVG logo${NC}"
    else
      echo -e "${RED}Warning: Failed to update CSS file. Logo references may be broken.${NC}"
    fi
  fi
else
  echo -e "${GREEN}tbwasmp-logo.webp already exists.${NC}"
fi

# Ensure we have mimetype for webp in the deployment config
if [ -f "client360/public/staticwebapp.config.json" ]; then
  # Check if webp mime type is already in the config
  if ! grep -q '".webp"' "client360/public/staticwebapp.config.json"; then
    echo -e "${YELLOW}Adding WEBP mime type to staticwebapp.config.json...${NC}"
    sed -i '' 's|".svg": "image/svg+xml"|".svg": "image/svg+xml",\n    ".webp": "image/webp"|g' "client360/public/staticwebapp.config.json"
  fi
fi

# Ensure the rollback styles are in the TBWA theme file
echo -e "${YELLOW}Checking for rollback component styles in TBWA theme...${NC}"
if ! grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${RED}Rollback component styles not found in TBWA theme! Adding them now...${NC}"
  
  # Add the rollback component styles to the TBWA theme file
  cat >> src/themes/tbwa.scss << 'EOL'

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: var(--rollback-bg, #FFFFFF);
  border: 3px solid var(--rollback-border, #00C3EC);
  border-radius: var(--rollback-border-radius, 8px);
  padding: var(--rollback-content-padding, 24px);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--box-shadow);
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    height: var(--rollback-header-height, 32px);
    
    h3 {
      color: var(--rollback-title, #002B80);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
      position: relative;
      
      &:after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 3px;
        background-color: var(--rollback-border, #00C3EC);
        border-radius: 1.5px;
      }
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: var(--spacing-xs);
      }
      
      &.active {
        color: var(--color-success);
        background-color: rgba(var(--color-success-rgb), 0.1);
        
        &::before {
          background-color: var(--color-success);
        }
      }
      
      &.inactive {
        color: var(--color-warning);
        background-color: rgba(var(--color-warning-rgb), 0.1);
        
        &::before {
          background-color: var(--color-warning);
        }
      }
    }
  }
  
  &-content {
    margin-bottom: var(--spacing-md);
    margin-top: var(--spacing-md);
    
    p {
      color: var(--rollback-text, #777777);
      margin-bottom: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: var(--rollback-info-bg, rgba(0, 195, 236, 0.1));
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--rollback-border-radius, 8px);
      margin-top: var(--spacing-sm);
      border-left: 3px solid var(--rollback-border, #00C3EC);
      
      .version-label {
        font-weight: var(--font-weight-semibold);
        color: var(--rollback-title, #002B80);
        font-size: var(--font-size-sm);
      }
      
      .version-value {
        font-family: monospace;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        background-color: rgba(var(--color-primary-rgb), 0.05);
        padding: 0.1rem 0.5rem;
        border-radius: 4px;
      }
    }
  }
  
  &-actions {
    display: flex;
    gap: var(--spacing-md);
    
    .btn-rollback {
      background-color: var(--rollback-action-primary, #002B80);
      color: var(--rollback-action-text, #FFFFFF);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
      
      &:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-2px);
      }
      
      &:disabled {
        background-color: var(--text-muted);
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .btn-verify {
      background-color: var(--rollback-action-secondary, #00C3EC);
      color: var(--rollback-action-text-secondary, #002B80);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
      
      &:hover {
        background-color: var(--color-secondary-dark);
        transform: translateY(-2px);
      }
    }
  }
  
  &-log {
    margin-top: var(--spacing-lg);
    background-color: var(--bg-tertiary);
    border-radius: var(--rollback-border-radius, 8px);
    padding: var(--spacing-md);
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--font-size-sm);
    border-left: 3px solid var(--rollback-border, #00C3EC);
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
EOL
  echo -e "${GREEN}Successfully added rollback component styles to TBWA theme${NC}"
else
  echo -e "${GREEN}✅ Rollback component styles found in TBWA theme${NC}"
fi

# Verify that the variables-tbwa.scss file has the necessary rollback variables
echo -e "${YELLOW}Checking for rollback variables in TBWA variables file...${NC}"
if ! grep -q "--rollback-bg" src/styles/variables-tbwa.scss; then
  echo -e "${YELLOW}Adding rollback component variables to TBWA variables file...${NC}"
  cat >> src/styles/variables-tbwa.scss << 'EOL'

  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: #00C3EC;
  --rollback-title: #002B80;
  --rollback-text: #777777;
  --rollback-action-primary: #002B80;
  --rollback-action-secondary: #00C3EC;
  --rollback-info-bg: rgba(0, 195, 236, 0.1);
  --rollback-action-text: #FFFFFF;
  --rollback-action-text-secondary: #002B80;
  --rollback-header-height: 32px;
  --rollback-content-padding: 24px;
  --rollback-border-radius: 8px;
EOL
  echo -e "${GREEN}✅ Added rollback component variables to TBWA variables file${NC}"
fi

# Build only the TBWA theme using webpack with production mode
echo -e "${YELLOW}Running webpack to build TBWA theme in production mode...${NC}"
npx webpack --config webpack.config.js --env theme=tbwa --mode production

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}✅ TBWA theme CSS bundle built successfully!${NC}"
  
  # Verify the built CSS contains rollback styles
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}✅ Rollback component styles verified in compiled CSS${NC}"
  else
    echo -e "${RED}❌ Error: Rollback component styles not found in compiled CSS! This indicates a build issue.${NC}"
    exit 1
  fi
  
  # Copy either the webp logo or the SVG logo to the assets directory
  if [ -f "assets/logos/tbwasmp-logo.webp" ]; then
    mkdir -p dist/assets/logos
    cp assets/logos/tbwasmp-logo.webp dist/assets/logos/
    echo -e "${GREEN}✅ TBWA SMP logo (webp) copied to dist/assets/logos/tbwasmp-logo.webp${NC}"
  else
    mkdir -p dist/assets/logos
    cp assets/logos/tbwa-logo.svg dist/assets/logos/
    echo -e "${GREEN}✅ TBWA logo (SVG fallback) copied to dist/assets/logos/tbwa-logo.svg${NC}"
  fi
  
  # List the generated files
  echo -e "${YELLOW}Generated files:${NC}"
  ls -la dist/
  ls -la dist/assets/ 2>/dev/null || echo "No assets directory found"
  if [ -d "dist/assets/logos" ]; then
    ls -la dist/assets/logos/
  fi
else
  echo -e "${RED}❌ Failed to build TBWA theme CSS bundle.${NC}"
  exit 1
fi
EOL
    
    # Replace the original script with the new one
    mv "scripts/build-tbwa-theme.sh.new" "scripts/build-tbwa-theme.sh"
    chmod +x "scripts/build-tbwa-theme.sh"
    echo -e "${GREEN}✅ Updated build-tbwa-theme.sh script${NC}" | tee -a "../$LOG_FILE"
  else
    echo -e "${GREEN}✅ build-tbwa-theme.sh already includes rollback style checks${NC}" | tee -a "../$LOG_FILE"
  fi
else
  echo -e "${YELLOW}Creating build-tbwa-theme.sh script...${NC}" | tee -a "../$LOG_FILE"
  
  # Create the directory if it doesn't exist
  mkdir -p scripts
  
  # Create the script
  cat > "scripts/build-tbwa-theme.sh" << 'EOL'
#!/bin/bash
# Build script for TBWA theme CSS bundle

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building TBWA theme CSS bundle...${NC}"

# Check if webpack is installed
if ! command -v npx &> /dev/null; then
  echo -e "${RED}Error: npx command not found. Please install Node.js and npm.${NC}"
  exit 1
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Ensure the rollback styles are in the TBWA theme file
echo -e "${YELLOW}Checking for rollback component styles in TBWA theme...${NC}"
if ! grep -q "rollback-dashboard" src/themes/tbwa.scss; then
  echo -e "${RED}Rollback component styles not found in TBWA theme! Adding them now...${NC}"
  
  # Add the rollback component styles to the TBWA theme file
  cat >> src/themes/tbwa.scss << 'EOF'

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: var(--rollback-bg, #FFFFFF);
  border: 3px solid var(--rollback-border, #00C3EC);
  border-radius: var(--rollback-border-radius, 8px);
  padding: var(--rollback-content-padding, 24px);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--box-shadow);
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    height: var(--rollback-header-height, 32px);
    
    h3 {
      color: var(--rollback-title, #002B80);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
      position: relative;
      
      &:after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 40px;
        height: 3px;
        background-color: var(--rollback-border, #00C3EC);
        border-radius: 1.5px;
      }
    }
  }
  
  &-content {
    margin-bottom: var(--spacing-md);
    margin-top: var(--spacing-md);
    
    p {
      color: var(--rollback-text, #777777);
      margin-bottom: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: var(--rollback-info-bg, rgba(0, 195, 236, 0.1));
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--rollback-border-radius, 8px);
      margin-top: var(--spacing-sm);
      border-left: 3px solid var(--rollback-border, #00C3EC);
    }
  }
  
  &-actions {
    display: flex;
    gap: var(--spacing-md);
    
    .btn-rollback {
      background-color: var(--rollback-action-primary, #002B80);
      color: white;
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
    }
    
    .btn-verify {
      background-color: var(--rollback-action-secondary, #00C3EC);
      color: var(--rollback-action-primary, #002B80);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-weight: var(--font-weight-semibold);
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: var(--font-size-sm);
    }
  }
  
  &-log {
    margin-top: var(--spacing-lg);
    background-color: var(--bg-tertiary);
    border-radius: var(--rollback-border-radius, 8px);
    padding: var(--spacing-md);
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--font-size-sm);
    border-left: 3px solid var(--rollback-border, #00C3EC);
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
EOF
  echo -e "${GREEN}Successfully added rollback component styles to TBWA theme${NC}"
else
  echo -e "${GREEN}✅ Rollback component styles found in TBWA theme${NC}"
fi

# Verify that the variables-tbwa.scss file has the necessary rollback variables
echo -e "${YELLOW}Checking for rollback variables in TBWA variables file...${NC}"
if ! grep -q "--rollback-bg" src/styles/variables-tbwa.scss; then
  echo -e "${YELLOW}Adding rollback component variables to TBWA variables file...${NC}"
  cat >> src/styles/variables-tbwa.scss << 'EOF'

  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: #00C3EC;
  --rollback-title: #002B80;
  --rollback-text: #777777;
  --rollback-action-primary: #002B80;
  --rollback-action-secondary: #00C3EC;
  --rollback-info-bg: rgba(0, 195, 236, 0.1);
  --rollback-action-text: #FFFFFF;
  --rollback-action-text-secondary: #002B80;
  --rollback-header-height: 32px;
  --rollback-content-padding: 24px;
  --rollback-border-radius: 8px;
EOF
  echo -e "${GREEN}✅ Added rollback component variables to TBWA variables file${NC}"
fi

# Build only the TBWA theme using webpack with production mode
echo -e "${YELLOW}Running webpack to build TBWA theme in production mode...${NC}"
npx webpack --config webpack.config.js --env theme=tbwa --mode production

# Check if the build was successful
if [ -f "dist/tbwa.css" ]; then
  echo -e "${GREEN}✅ TBWA theme CSS bundle built successfully!${NC}"
  
  # Verify the built CSS contains rollback styles
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}✅ Rollback component styles verified in compiled CSS${NC}"
  else
    echo -e "${RED}❌ Error: Rollback component styles not found in compiled CSS! This indicates a build issue.${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Failed to build TBWA theme CSS bundle.${NC}"
  exit 1
fi
EOL
  
  # Make the script executable
  chmod +x "scripts/build-tbwa-theme.sh"
  echo -e "${GREEN}✅ Created build-tbwa-theme.sh script${NC}" | tee -a "../$LOG_FILE"
fi

# Step 4: Build the theme to verify everything works
echo -e "\n${BLUE}Step 4: Building TBWA theme to verify rollback styles...${NC}" | tee -a "../$LOG_FILE"

# Run the build script
if ./scripts/build-tbwa-theme.sh >> "../$LOG_FILE" 2>&1; then
  echo -e "${GREEN}✅ Successfully built TBWA theme with rollback styles${NC}" | tee -a "../$LOG_FILE"
  
  # Verify that rollback styles are in the compiled output
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}✅ Verified rollback styles in compiled CSS${NC}" | tee -a "../$LOG_FILE"
  else
    echo -e "${RED}❌ Error: Rollback styles not found in compiled CSS${NC}" | tee -a "../$LOG_FILE"
    exit 1
  fi
else
  echo -e "${RED}❌ Failed to build TBWA theme. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

# Step 5: Create a script to verify rollback component
echo -e "\n${BLUE}Step 5: Creating verification script for rollback component...${NC}" | tee -a "../$LOG_FILE"

# Create a script to verify the rollback component exists in the theme and the deployment
cat > "scripts/verify_rollback_component.sh" << 'EOL'
#!/bin/bash
# Verify rollback component exists and is deployed correctly

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Verifying rollback component in theme CSS...${NC}"

# Check if dist directory exists with theme CSS
if [ ! -d "dist" ] || [ ! -f "dist/tbwa.css" ]; then
  echo -e "${YELLOW}Dist folder or theme CSS not found. Building theme first...${NC}"
  ./scripts/build-tbwa-theme.sh
fi

# Verify that rollback styles are in the CSS
if grep -q "rollback-dashboard" dist/tbwa.css; then
  echo -e "${GREEN}✅ Rollback component styles found in compiled CSS${NC}"
else
  echo -e "${RED}❌ Error: Rollback component styles missing from compiled CSS!${NC}"
  echo -e "${YELLOW}Attempting to rebuild theme with fixed styles...${NC}"
  ./scripts/build-tbwa-theme.sh
  
  # Check again after rebuild
  if grep -q "rollback-dashboard" dist/tbwa.css; then
    echo -e "${GREEN}✅ Fixed: Rollback component styles now found in compiled CSS${NC}"
  else
    echo -e "${RED}❌ Error: Could not add rollback styles to theme CSS.${NC}"
    exit 1
  fi
fi

# Check deployment directory if it exists
DEPLOY_DIR="deploy"
if [ -d "$DEPLOY_DIR" ]; then
  echo -e "${YELLOW}Checking rollback styles in deployment directory...${NC}"
  
  # Check if theme CSS exists in the deployment directory
  THEME_FILES=$(find "$DEPLOY_DIR" -name "*theme*.css" -o -name "*.css" | grep -v "node_modules")
  
  if [ -z "$THEME_FILES" ]; then
    echo -e "${YELLOW}No theme CSS files found in deployment directory.${NC}"
    echo -e "${YELLOW}Copying theme CSS file to deployment directory...${NC}"
    
    # Create CSS directory if it doesn't exist
    mkdir -p "$DEPLOY_DIR/css"
    
    # Copy theme CSS to deployment directory
    cp dist/tbwa.css "$DEPLOY_DIR/theme.css"
    cp dist/tbwa.css "$DEPLOY_DIR/css/tbwa-theme.css"
    
    echo -e "${GREEN}✅ Copied theme CSS to deployment directory${NC}"
  else
    echo -e "${YELLOW}Found these theme CSS files in deployment:${NC}"
    echo "$THEME_FILES"
    
    # Check if any of the CSS files contain rollback styles
    ROLLBACK_FOUND=false
    for CSS_FILE in $THEME_FILES; do
      if grep -q "rollback-dashboard" "$CSS_FILE"; then
        ROLLBACK_FOUND=true
        echo -e "${GREEN}✅ Rollback styles found in $CSS_FILE${NC}"
      fi
    done
    
    if [ "$ROLLBACK_FOUND" = false ]; then
      echo -e "${RED}❌ Error: Rollback styles not found in deployment CSS files!${NC}"
      echo -e "${YELLOW}Updating deployment CSS files with correct rollback styles...${NC}"
      
      # Copy updated theme CSS to all theme files in the deployment directory
      for CSS_FILE in $THEME_FILES; do
        cp dist/tbwa.css "$CSS_FILE"
        echo -e "${GREEN}✅ Updated $CSS_FILE with rollback styles${NC}"
      done
    fi
  fi
else
  echo -e "${YELLOW}Deployment directory not found. No deployment verification possible.${NC}"
fi

echo -e "${GREEN}✅ Rollback component verification complete${NC}"
EOL

# Make the script executable
chmod +x "scripts/verify_rollback_component.sh"
echo -e "${GREEN}✅ Created rollback component verification script${NC}" | tee -a "../$LOG_FILE"

# Step 6: Run the verification script
echo -e "\n${BLUE}Step 6: Running verification script...${NC}" | tee -a "../$LOG_FILE"

if ./scripts/verify_rollback_component.sh >> "../$LOG_FILE" 2>&1; then
  echo -e "${GREEN}✅ Rollback component verification successful${NC}" | tee -a "../$LOG_FILE"
else
  echo -e "${RED}❌ Rollback component verification failed. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

# Step 7: Create a deployment wrapper script
echo -e "\n${BLUE}Step 7: Creating optimized deployment script...${NC}" | tee -a "../$LOG_FILE"

cat > "deploy_fixed_dashboard.sh" << 'EOL'
#!/bin/bash
# Deploy fixed dashboard with rollback component to Azure

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}     Client360 Dashboard Deployment with Rollback    ${NC}"
echo -e "${CYAN}=====================================================${NC}\n"

# Create directories for logs
mkdir -p logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/deploy_fixed_${TIMESTAMP}.log"

echo -e "${YELLOW}Step 1: Building TBWA theme with rollback component...${NC}" | tee -a "$LOG_FILE"

# Run the build script
cd client360_dashboard
if ./scripts/build-tbwa-theme.sh >> "../$LOG_FILE" 2>&1; then
  echo -e "${GREEN}✅ Successfully built TBWA theme with rollback styles${NC}" | tee -a "../$LOG_FILE"
else
  echo -e "${RED}❌ Failed to build TBWA theme. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

echo -e "${YELLOW}Step 2: Verifying rollback component...${NC}" | tee -a "$LOG_FILE"

# Run the verification script
if ./scripts/verify_rollback_component.sh >> "../$LOG_FILE" 2>&1; then
  echo -e "${GREEN}✅ Rollback component verification successful${NC}" | tee -a "../$LOG_FILE"
else
  echo -e "${RED}❌ Rollback component verification failed. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

echo -e "${YELLOW}Step 3: Deploying to Azure...${NC}" | tee -a "$LOG_FILE"

# Check if deploy_to_azure.sh exists
if [ -f "./deploy_to_azure.sh" ]; then
  # Run the deploy script
  if ./deploy_to_azure.sh >> "../$LOG_FILE" 2>&1; then
    echo -e "${GREEN}✅ Deployment successful${NC}" | tee -a "../$LOG_FILE"
  else
    echo -e "${RED}❌ Deployment failed. Check the log file for details: $LOG_FILE${NC}" | tee -a "../$LOG_FILE"
    exit 1
  fi
else
  echo -e "${RED}❌ deploy_to_azure.sh script not found${NC}" | tee -a "../$LOG_FILE"
  exit 1
fi

cd ..
echo -e "\n${GREEN}✅ Dashboard deployment with rollback component completed successfully${NC}" | tee -a "$LOG_FILE"
EOL

# Make the script executable
chmod +x "deploy_fixed_dashboard.sh"
echo -e "${GREEN}✅ Created optimized deployment script${NC}" | tee -a "../$LOG_FILE"

# Step 8: Create a documentation file
echo -e "\n${BLUE}Step 8: Creating documentation...${NC}" | tee -a "../$LOG_FILE"

cat > "ROLLBACK_COMPONENT_IMPLEMENTATION.md" << 'EOL'
# Rollback Component Implementation Guide

## Overview

The rollback component provides a seamless way for users to revert to previous stable versions of the dashboard. This guide explains how the rollback component is implemented within the TBWA theme system.

## Component Structure

The rollback component consists of the following key elements:

1. **Header** - With title and status indicator
2. **Content** - Description and version information
3. **Actions** - Rollback and verification buttons
4. **Log** - For displaying rollback operation logs

## CSS Implementation

The component's styles are defined in two places:

1. **Theme variables (`variables-tbwa.scss`)** - Color and dimension variables
2. **Theme styles (`tbwa.scss`)** - Component structure and visual presentation

### Theme Variables

The rollback component has dedicated variables to ensure consistent theming:

```scss
--rollback-bg: #FFFFFF;
--rollback-border: #00C3EC;
--rollback-title: #002B80;
--rollback-text: #777777;
--rollback-action-primary: #002B80;
--rollback-action-secondary: #00C3EC;
--rollback-info-bg: rgba(0, 195, 236, 0.1);
--rollback-action-text: #FFFFFF;
--rollback-action-text-secondary: #002B80;
--rollback-header-height: 32px;
--rollback-content-padding: 24px;
--rollback-border-radius: 8px;
```

## Using the Rollback Component

To add a rollback dashboard to your UI, use the following HTML structure:

```html
<div class="rollback-dashboard">
  <div class="rollback-dashboard-header">
    <h3>Dashboard Rollback</h3>
    <div class="status-indicator active">Active</div>
  </div>
  
  <div class="rollback-dashboard-content">
    <p>The rollback feature allows you to restore a previous version of the dashboard if issues are encountered.</p>
    <div class="version-info">
      <span class="version-label">Current Version:</span>
      <span class="version-value">v2.3.1</span>
    </div>
    <div class="version-info">
      <span class="version-label">Previous Stable Version:</span>
      <span class="version-value">v2.2.0</span>
    </div>
  </div>
  
  <div class="rollback-dashboard-actions">
    <button class="btn-rollback">Rollback to v2.2.0</button>
    <button class="btn-verify">Verify Current Version</button>
  </div>
  
  <div class="rollback-dashboard-log" style="display: none;">
    <pre>Rollback operation log will appear here...</pre>
  </div>
</div>
```

## Integration with Deployment Process

The rollback component is automatically included in the TBWA theme CSS bundle. The build and deployment scripts include verification to ensure the rollback styles are properly compiled and deployed.

Scripts involved:
- `build-tbwa-theme.sh` - Builds the theme with rollback styles
- `verify_rollback_component.sh` - Verifies rollback styles exist in CSS
- `deploy_fixed_dashboard.sh` - Deployment wrapper script 

## Troubleshooting

If the rollback component is not appearing correctly:

1. Verify the theme CSS bundle contains rollback styles:
   ```
   grep "rollback-dashboard" dist/tbwa.css
   ```

2. Ensure the HTML structure matches the expected component structure

3. Run the verification script:
   ```
   ./scripts/verify_rollback_component.sh
   ```

4. If styles are missing, rebuild the theme:
   ```
   ./scripts/build-tbwa-theme.sh
   ```

## Future Enhancements

Future versions may include:
- Automated version detection 
- Preview functionality before rollback
- Extended logging capabilities
- Integration with CI/CD pipelines
EOL

echo -e "${GREEN}✅ Created component documentation${NC}" | tee -a "../$LOG_FILE"

# Return to the original directory
cd ..

echo -e "\n${CYAN}=====================================================${NC}"
echo -e "${GREEN}✅ Dashboard rollback fix complete!${NC}"
echo -e "${CYAN}=====================================================${NC}\n"

echo -e "Fixed files:"
echo -e "  - client360_dashboard/src/themes/tbwa.scss"
echo -e "  - client360_dashboard/src/styles/variables-tbwa.scss\n"

echo -e "Created scripts:"
echo -e "  - client360_dashboard/scripts/build-tbwa-theme.sh (updated)"
echo -e "  - client360_dashboard/scripts/verify_rollback_component.sh (new)"
echo -e "  - client360_dashboard/deploy_fixed_dashboard.sh (new)"
echo -e "  - client360_dashboard/ROLLBACK_COMPONENT_IMPLEMENTATION.md (new)\n"

echo -e "To deploy the fixed dashboard to Azure, run:"
echo -e "${CYAN}  ./client360_dashboard/deploy_fixed_dashboard.sh${NC}\n"

echo -e "Log file: ${LOG_FILE}"
echo -e "Backups: ${BACKUP_DIR}"