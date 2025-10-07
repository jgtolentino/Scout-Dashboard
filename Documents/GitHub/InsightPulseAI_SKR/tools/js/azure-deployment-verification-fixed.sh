#!/bin/bash
# Scout Dashboard Deployment Verification Script
# Verifies that the deployed dashboard is accessible and working correctly

# Text formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration - modify these variables
DEPLOYMENT_URL=${DEPLOYMENT_URL:-"https://delightful-glacier-03349aa0f.6.azurestaticapps.net"}
BASE_URL=$DEPLOYMENT_URL

# URLs to check
URLS=(
  "/"
  "/index.html"
  "/staticwebapp.config.json"
  "/advisor/index.html"
  "/edge/index.html"
  "/ops/index.html"
)

# Function to check a URL
check_url() {
  local url="$1"
  local full_url="$BASE_URL$url"
  local redirect=""
  
  echo -e "${BLUE}Checking: $full_url${NC}"
  
  # Get HTTP response code with curl, following redirects
  local response=$(curl -s -o /dev/null -w "%{http_code},%{redirect_url}" "$full_url")
  local status_code=$(echo "$response" | cut -d',' -f1)
  redirect=$(echo "$response" | cut -d',' -f2)
  
  # Evaluate the response
  if [ "$status_code" == "200" ]; then
    echo -e "${GREEN}✅ URL is accessible (HTTP 200)${NC}"
    return 0
  elif [ "$status_code" == "301" ] || [ "$status_code" == "302" ]; then
    echo -e "${YELLOW}⚠️ URL redirects (HTTP $status_code) to: $redirect${NC}"
    # Check the redirect target if it's within our domain
    if [[ "$redirect" == "$BASE_URL"* ]]; then
      local redirect_path="${redirect#$BASE_URL}"
      echo -e "${BLUE}  Checking redirect target: $redirect${NC}"
      local redirect_response=$(curl -s -o /dev/null -w "%{http_code}" "$redirect")
      if [ "$redirect_response" == "200" ]; then
        echo -e "${GREEN}  ✅ Redirect target is accessible (HTTP 200)${NC}"
        return 0
      else
        echo -e "${RED}  ❌ Redirect target returns HTTP $redirect_response${NC}"
        return 1
      fi
    else
      echo -e "${YELLOW}  ⚠️ Redirect target is outside our domain${NC}"
      return 0
    fi
  else
    echo -e "${RED}❌ URL returns HTTP $status_code${NC}"
    return 1
  fi
}

# Check if we can connect to the base URL
echo -e "${BLUE}Verifying connection to: $BASE_URL${NC}"
if ! curl -s --head "$BASE_URL" > /dev/null; then
  echo -e "${RED}❌ Cannot connect to $BASE_URL${NC}"
  echo -e "${YELLOW}Please check if:"
  echo -e "1. The deployment URL is correct"
  echo -e "2. The deployment has completed successfully"
  echo -e "3. There are no network issues${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Connection to $BASE_URL successful${NC}"
echo -e "\n${BLUE}Performing detailed verification...${NC}"

# Track failures
failures=0

# Check each URL
for url in "${URLS[@]}"; do
  echo -e "\n${YELLOW}=== Testing URL: $url ===${NC}"
  if ! check_url "$url"; then
    ((failures++))
  fi
done

# Summary
echo -e "\n${YELLOW}=== Verification Summary ===${NC}"
if [ $failures -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! The deployment appears to be working correctly.${NC}"
else
  echo -e "${RED}❌ $failures checks failed. Please investigate the issues above.${NC}"
fi

echo -e "\n${BLUE}Dashboard URLs:${NC}"
echo -e "${GREEN}Main URL:${NC} $BASE_URL/advisor"
echo -e "${GREEN}Legacy URL:${NC} $BASE_URL/insights_dashboard.html"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Manually test the dashboard in a browser"
echo -e "2. Verify all UI components and interactions work"
echo -e "3. Check browser console for JavaScript errors"
echo -e "4. Test on mobile devices for responsive design"