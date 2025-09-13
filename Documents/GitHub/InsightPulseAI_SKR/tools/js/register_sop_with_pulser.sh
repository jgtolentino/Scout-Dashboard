#!/bin/bash
# register_sop_with_pulser.sh
# Script to register the SOP registry with Pulser

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}"
echo "┌─────────────────────────────────────────────────┐"
echo "│                                                 │"
echo "│  InsightPulseAI SOP Registry Registration       │"
echo "│                                                 │"
echo "└─────────────────────────────────────────────────┘"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js before continuing."
    exit 1
fi

# Check that required files exist
if [ ! -f ./final-locked-dashboard/pulser_sop_profile.yaml ]; then
    echo -e "${RED}Error: SOP profile not found at ./final-locked-dashboard/pulser_sop_profile.yaml${NC}"
    exit 1
fi

if [ ! -f ./final-locked-dashboard/pulser_sop_profile_with_toggle.yaml ]; then
    echo -e "${RED}Error: Data toggle SOP profile not found at ./final-locked-dashboard/pulser_sop_profile_with_toggle.yaml${NC}"
    exit 1
fi

echo -e "${YELLOW}Preparing to register SOP registry with Pulser...${NC}"

# Create output directory if it doesn't exist
mkdir -p ./output/sop-registry

# Run the registration script
echo -e "${YELLOW}Running registration script...${NC}"
node register_sop_registry.js

# Check if script was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SOP Registry registration complete!${NC}"
    
    # Save implementation note
    IMPLEMENTATION_NOTE="# SOP Registry Implementation Note\n\nThe Standard Operating Procedure (SOP) registry has been successfully registered with the Pulser system on $(date).\n\nThis registry contains:\n\n1. Standard SOP Profile (v1.0)\n2. Data Toggle SOP Profile (v1.1)\n\nImplementation templates have been generated for the following applications:\n- PRISMA\n- GEZ\n- PulseUP\n- RetailEdge\n\nThe templates and documentation are available in the ./output/sop-registry directory.\n\nTo use the SOP registry with a new application, run:\n\`\`\`bash\npulser init sop --profile pulser_sop_profile_with_toggle.yaml --app APP_NAME\n\`\`\`"
    
    echo -e "$IMPLEMENTATION_NOTE" > ./SOP_REGISTRY_IMPLEMENTATION.md
    echo -e "${GREEN}Implementation note saved to ./SOP_REGISTRY_IMPLEMENTATION.md${NC}"
    
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Add the task routing configuration to your Pulser config"
    echo "2. Update your documentation to reference the SOP registry"
    echo "3. Apply the SOP to your application templates"
    
    exit 0
else
    echo -e "${RED}❌ SOP Registry registration failed.${NC}"
    echo "Please check the error messages above and try again."
    exit 1
fi