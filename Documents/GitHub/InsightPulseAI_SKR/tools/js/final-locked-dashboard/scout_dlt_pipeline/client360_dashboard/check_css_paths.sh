#!/bin/bash

# Check CSS paths and content types on the deployed dashboard
set -e

# URL of the deployed dashboard
DASHBOARD_URL="$1"
if [[ -z "$DASHBOARD_URL" ]]; then
    echo "Please provide the dashboard URL as an argument"
    echo "Example: ./check_css_paths.sh https://blue-coast-0acb6880f.6.azurestaticapps.net"
    exit 1
fi

echo "==== Checking CSS references and paths in ${DASHBOARD_URL} ===="

# Create a temp file
TMP_FILE=$(mktemp)
echo "Downloading HTML..."
curl -s "${DASHBOARD_URL}" > "${TMP_FILE}"

echo "CSS references in HTML:"
grep -n "stylesheet" "${TMP_FILE}" | grep -i "css"

echo -e "\nAttempting to access all potential CSS files:"

CSS_FILES=("css/dashboard.css" "css/tbwa-theme.css" "css/variables.css")

for css_file in "${CSS_FILES[@]}"; do
    echo -e "\nChecking ${css_file}:"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${DASHBOARD_URL}/${css_file}")
    echo "HTTP Status: ${STATUS}"
    
    if [ "${STATUS}" = "200" ]; then
        CONTENT_TYPE=$(curl -sI "${DASHBOARD_URL}/${css_file}" | grep -i "content-type" | cut -d' ' -f2-)
        echo "Content-Type: ${CONTENT_TYPE}"
        
        # Print first few lines of the file
        echo "First few lines of ${css_file}:"
        curl -s "${DASHBOARD_URL}/${css_file}" | head -5
        echo -e "..."
    else
        echo "File not accessible"
    fi
done

# Clean up
rm "${TMP_FILE}"

echo -e "\n==== Check completed ===="