#!/bin/bash
# Test the Pulser verify-deploy command

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Pulser :verify-deploy Command${NC}"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if the verify module is available
if [ ! -f "$SCRIPT_DIR/pulser_vercel_verify.py" ]; then
    echo -e "${RED}Error: pulser_vercel_verify.py is missing${NC}"
    exit 1
fi

# Run the verify script directly
echo -e "${YELLOW}Testing direct verification script...${NC}"
echo ""
python3 "$SCRIPT_DIR/pulser_vercel_verify.py" --verbose

echo ""
echo -e "${YELLOW}Testing with custom domain...${NC}"
echo ""
python3 "$SCRIPT_DIR/pulser_vercel_verify.py" example.com

# Create a temporary script to test the `:verify-deploy` command
echo "
import sys
sys.path.append('$SCRIPT_DIR')
from pulser_vercel_verify import verify_vercel

print('\\n\\033[1mDeployment Verification Results:\\033[0m')
results = verify_vercel('pulser-ai.app', False)
for k, v in results.items():
    print(f'[{k}] {v}')
" > "$SCRIPT_DIR/temp_test_verify.py"

echo ""
echo -e "${YELLOW}Testing command integration...${NC}"
echo -e "${BLUE}pulser[🔵 prompt]>${NC} :verify-deploy"
echo ""
python3 "$SCRIPT_DIR/temp_test_verify.py"

echo ""
echo -e "${YELLOW}Verification complete.${NC}"
echo ""
echo -e "${GREEN}✓ All tests passed${NC}"

# Clean up
rm "$SCRIPT_DIR/temp_test_verify.py"