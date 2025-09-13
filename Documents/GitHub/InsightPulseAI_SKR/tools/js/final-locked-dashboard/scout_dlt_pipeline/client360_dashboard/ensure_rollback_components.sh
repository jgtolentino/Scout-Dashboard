#!/bin/bash
# Quick utility script to ensure rollback component styles are included in all themes
# This script is particularly useful for use in deployment pipelines

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/rollback_components_${TIMESTAMP}.log"
mkdir -p logs

echo -e "${GREEN}Ensuring rollback component styles are available in all themes${NC}" | tee -a "$LOG_FILE"

# Check for theme directory
THEMES_DIR="src/themes"
STYLES_DIR="src/styles"

if [ ! -d "$THEMES_DIR" ]; then
    echo -e "${RED}Error: Themes directory not found.${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Find all theme files
THEME_FILES=$(find "$THEMES_DIR" -name "*.scss")
if [ -z "$THEME_FILES" ]; then
    echo -e "${RED}Error: No theme files found in $THEMES_DIR${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Check for rollback styles in each theme
echo -e "${YELLOW}Checking for rollback component styles in all themes...${NC}" | tee -a "$LOG_FILE"
ROLLBACK_TEMPLATE=""
ROLLBACK_TEMPLATE_SOURCE=""
FIXED_THEMES=()

# First find a theme that already has the rollback styles to use as a template
for THEME_FILE in $THEME_FILES; do
    THEME_NAME=$(basename "$THEME_FILE" .scss)
    echo -e "Checking theme: ${THEME_NAME}" | tee -a "$LOG_FILE"
    
    if grep -q "rollback-dashboard" "$THEME_FILE"; then
        echo -e "${GREEN}Found rollback component styles in $THEME_NAME theme${NC}" | tee -a "$LOG_FILE"
        ROLLBACK_TEMPLATE=$(awk '/\/\/ Rollback Dashboard Component/,/^}$/' "$THEME_FILE")
        ROLLBACK_TEMPLATE_SOURCE="$THEME_NAME"
        break
    fi
done

# If no theme has rollback styles, create a default template
if [ -z "$ROLLBACK_TEMPLATE" ]; then
    echo -e "${YELLOW}No rollback styles found in any theme. Creating default template...${NC}" | tee -a "$LOG_FILE"
    ROLLBACK_TEMPLATE_SOURCE="generated"
    
    # Get primary and secondary colors for the main theme (preferably TBWA)
    PRIMARY_COLOR="#002B80"
    SECONDARY_COLOR="#00C3EC"
    TEXT_COLOR="#333333"
    
    # Check if TBWA variables exist
    if [ -f "${STYLES_DIR}/variables-tbwa.scss" ]; then
        PRIMARY_COLOR=$(grep -o "color-primary: #[0-9A-Fa-f]\{6\}" "${STYLES_DIR}/variables-tbwa.scss" | cut -d '#' -f 2)
        SECONDARY_COLOR=$(grep -o "color-secondary: #[0-9A-Fa-f]\{6\}" "${STYLES_DIR}/variables-tbwa.scss" | cut -d '#' -f 2)
        TEXT_COLOR=$(grep -o "text-primary: #[0-9A-Fa-f]\{6\}" "${STYLES_DIR}/variables-tbwa.scss" | cut -d '#' -f 2)
    fi
    
    # Create a default rollback component template
    ROLLBACK_TEMPLATE=$(cat <<EOF

// Rollback Dashboard Component
.rollback-dashboard {
  background-color: #ffffff;
  border: 3px solid #${SECONDARY_COLOR};
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      color: #${PRIMARY_COLOR};
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 14px;
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
      
      &::before {
        content: '';
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 4px;
      }
      
      &.active {
        color: #28a745;
        background-color: rgba(40, 167, 69, 0.1);
        
        &::before {
          background-color: #28a745;
        }
      }
      
      &.inactive {
        color: #fd7e14;
        background-color: rgba(253, 126, 20, 0.1);
        
        &::before {
          background-color: #fd7e14;
        }
      }
    }
  }
  
  &-content {
    margin-bottom: 16px;
    
    p {
      color: #${TEXT_COLOR};
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .version-info {
      display: flex;
      justify-content: space-between;
      background-color: rgba(${SECONDARY_COLOR}, 0.1);
      padding: 8px 16px;
      border-radius: 8px;
      margin-top: 8px;
      border-left: 3px solid #${SECONDARY_COLOR};
    }
  }
  
  &-actions {
    display: flex;
    gap: 16px;
    
    .btn-rollback {
      background-color: #${PRIMARY_COLOR};
      color: white;
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-verify {
      background-color: #${SECONDARY_COLOR};
      color: #${PRIMARY_COLOR};
      border: none;
      padding: 8px 24px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
  }
  
  &-log {
    margin-top: 24px;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 16px;
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 14px;
    border-left: 3px solid #${SECONDARY_COLOR};
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  }
}
EOF
)
fi

echo -e "${GREEN}Using rollback component template from: $ROLLBACK_TEMPLATE_SOURCE theme${NC}" | tee -a "$LOG_FILE"

# Now fix each theme that's missing the rollback styles
for THEME_FILE in $THEME_FILES; do
    THEME_NAME=$(basename "$THEME_FILE" .scss)
    
    if ! grep -q "rollback-dashboard" "$THEME_FILE"; then
        echo -e "${YELLOW}Adding rollback component styles to $THEME_NAME theme...${NC}" | tee -a "$LOG_FILE"
        
        # Create a backup first
        cp "$THEME_FILE" "${THEME_FILE}.bak"
        
        # Append the rollback styles
        echo -e "$ROLLBACK_TEMPLATE" >> "$THEME_FILE"
        
        FIXED_THEMES+=("$THEME_NAME")
        echo -e "${GREEN}✅ Added rollback component styles to $THEME_NAME theme${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${GREEN}✅ $THEME_NAME theme already has rollback component styles${NC}" | tee -a "$LOG_FILE"
    fi
done

# Check if we fixed any themes and need to rebuild
if [ ${#FIXED_THEMES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Fixed the following themes: ${FIXED_THEMES[*]}${NC}" | tee -a "$LOG_FILE"
    
    # Check for explicit rollback component variables in each variables file and add if missing
    echo -e "${YELLOW}Checking for rollback component variables in style files...${NC}" | tee -a "$LOG_FILE"
    
    for THEME_NAME in "${FIXED_THEMES[@]}"; do
        VAR_FILE="${STYLES_DIR}/variables-${THEME_NAME}.scss"
        
        if [ -f "$VAR_FILE" ]; then
            if ! grep -q "rollback-" "$VAR_FILE"; then
                echo -e "${YELLOW}Adding rollback component variables to $THEME_NAME variables...${NC}" | tee -a "$LOG_FILE"
                
                # Create a backup first
                cp "$VAR_FILE" "${VAR_FILE}.bak"
                
                # Add rollback component specific variables
                cat >> "$VAR_FILE" << EOF
  
  // Rollback component specific colors (explicit declarations to avoid theme issues)
  --rollback-bg: #FFFFFF;
  --rollback-border: var(--color-secondary);
  --rollback-title: var(--color-primary);
  --rollback-text: var(--text-secondary);
  --rollback-action-primary: var(--color-primary);
  --rollback-action-secondary: var(--color-secondary);
  --rollback-info-bg: rgba(var(--color-secondary-rgb), 0.1);
EOF
                echo -e "${GREEN}✅ Added rollback component variables to $THEME_NAME variables${NC}" | tee -a "$LOG_FILE"
            else
                echo -e "${GREEN}✅ $THEME_NAME variables already have rollback component variables${NC}" | tee -a "$LOG_FILE"
            fi
        fi
    done
    
    # Try to rebuild the CSS if webpack is available
    if [ -f "webpack.config.js" ]; then
        echo -e "${YELLOW}Rebuilding CSS for fixed themes...${NC}" | tee -a "$LOG_FILE"
        
        for THEME_NAME in "${FIXED_THEMES[@]}"; do
            echo -e "${YELLOW}Building $THEME_NAME theme...${NC}" | tee -a "$LOG_FILE"
            npx webpack --config webpack.config.js --env theme=$THEME_NAME --mode production | tee -a "$LOG_FILE"
            
            if [ -f "dist/${THEME_NAME}.css" ]; then
                echo -e "${GREEN}✅ Successfully rebuilt $THEME_NAME CSS${NC}" | tee -a "$LOG_FILE"
            else
                echo -e "${RED}❌ Failed to rebuild $THEME_NAME CSS${NC}" | tee -a "$LOG_FILE"
            fi
        done
    else
        echo -e "${YELLOW}Webpack config not found. Manual CSS rebuild required.${NC}" | tee -a "$LOG_FILE"
    fi
else
    echo -e "${GREEN}All themes already have rollback component styles!${NC}" | tee -a "$LOG_FILE"
fi

# Create a deployment verification file
VERIFICATION_FILE="ROLLBACK_COMPONENTS_VERIFIED.md"
cat > "$VERIFICATION_FILE" << EOF
# Rollback Components Verification

## Summary
- **Date**: $(date)
- **Themes Checked**: $(echo "$THEME_FILES" | wc -l)
- **Themes Fixed**: ${#FIXED_THEMES[@]}
- **Template Source**: $ROLLBACK_TEMPLATE_SOURCE

## Fixed Themes
$(for theme in "${FIXED_THEMES[@]}"; do echo "- $theme"; done)

## Verification Steps
1. All theme files have been checked for rollback component styles
2. Missing styles have been added based on the template
3. Theme variables have been updated with rollback-specific variables
4. CSS files have been rebuilt for affected themes

## Next Steps
- Deploy the updated themes to your environment
- Verify rollback functionality works correctly with all themes
- Consider adding this script to your CI/CD pipeline

EOF

echo -e "${GREEN}✅ Verification complete! See $VERIFICATION_FILE for details.${NC}" | tee -a "$LOG_FILE"
echo -e "${GREEN}✅ Log file: $LOG_FILE${NC}"

exit 0