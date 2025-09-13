#\!/bin/bash
# Simple theme parity test script

# Set Azure Static Web App URL
AZURE_URL="https://blue-coast-0acb6880f.6.azurestaticapps.net"

# Create test results directory
mkdir -p test_results

echo "Checking CSS variables file..."
curl -s "$AZURE_URL/css/variables.css" | grep -E "color-primary|color-secondary|box-shadow"

echo "Checking HTML for CSS references..."
curl -s "$AZURE_URL" | grep -o '<link.*href="css/.*\.css".*>' | sort

echo "Test completed."
ENDOFSCRIPT < /dev/null