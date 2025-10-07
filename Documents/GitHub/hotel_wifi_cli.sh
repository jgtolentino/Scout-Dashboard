#!/bin/bash

# Hotel Wi-Fi CLI Login Script
# Clean, legitimate approach - no spoofing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Hotel Wi-Fi CLI Login Tool${NC}"
echo "================================"

# Step 1: Check for captive portal
echo -e "\n${YELLOW}Step 1: Detecting captive portal...${NC}"
REDIRECT_URL=$(curl -s -I http://captive.apple.com | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')

if [ -z "$REDIRECT_URL" ]; then
    echo -e "${GREEN}✓ No captive portal detected - you may already be connected!${NC}"
    echo "Testing connection..."
    if curl -s --head --connect-timeout 5 https://www.google.com | grep "200 OK" > /dev/null; then
        echo -e "${GREEN}✓ Internet connection confirmed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ No internet connection detected${NC}"
    fi
else
    echo -e "Portal detected at: ${REDIRECT_URL}"
fi

# Step 2: Analyze the login page
echo -e "\n${YELLOW}Step 2: Analyzing login page...${NC}"
TEMP_FILE="/tmp/hotel_portal.html"
curl -s -L "$REDIRECT_URL" > "$TEMP_FILE"

# Extract form action
FORM_ACTION=$(grep -oE 'action="[^"]*"' "$TEMP_FILE" | head -1 | cut -d'"' -f2)
echo "Form action: $FORM_ACTION"

# Find input fields
echo -e "\n${YELLOW}Found input fields:${NC}"
grep -oE 'name="[^"]*"' "$TEMP_FILE" | sort -u | grep -v "hidden"

# Step 3: Get credentials
echo -e "\n${YELLOW}Step 3: Enter credentials${NC}"
read -p "Room number/Username: " USERNAME
read -s -p "Password/Access code: " PASSWORD
echo ""

# Step 4: Attempt login
echo -e "\n${YELLOW}Step 4: Attempting login...${NC}"

# Handle relative URLs
if [[ "$FORM_ACTION" == /* ]]; then
    BASE_URL=$(echo "$REDIRECT_URL" | grep -oE 'https?://[^/]+')
    FORM_ACTION="${BASE_URL}${FORM_ACTION}"
elif [[ "$FORM_ACTION" != http* ]]; then
    BASE_PATH=$(dirname "$REDIRECT_URL")
    FORM_ACTION="${BASE_PATH}/${FORM_ACTION}"
fi

# Common field name patterns
USER_FIELDS=("username" "user" "login" "room" "roomNumber" "guest" "guestCode")
PASS_FIELDS=("password" "pass" "code" "accessCode" "pin")

# Try different field combinations
for user_field in "${USER_FIELDS[@]}"; do
    for pass_field in "${PASS_FIELDS[@]}"; do
        echo "Trying: ${user_field}/${pass_field}..."
        
        RESPONSE=$(curl -s -X POST "$FORM_ACTION" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -H "Referer: $REDIRECT_URL" \
            -d "${user_field}=${USERNAME}" \
            -d "${pass_field}=${PASSWORD}" \
            -d "terms=on" \
            -d "accept=1" \
            -c /tmp/hotel_cookies.txt \
            -w "\nHTTP_CODE:%{http_code}")
        
        HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
            echo -e "${GREEN}✓ Login submitted successfully${NC}"
            break 2
        fi
    done
done

# Step 5: Verify connection
echo -e "\n${YELLOW}Step 5: Verifying connection...${NC}"
sleep 3

if curl -s --head --connect-timeout 5 https://www.google.com | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}✓ Success! You're connected to the internet!${NC}"
else
    echo -e "${RED}✗ Login may have failed${NC}"
    echo "Possible issues:"
    echo "- Wrong credentials format (try UPPERCASE room number)"
    echo "- Different field names needed"
    echo "- Time-based restrictions"
    echo -e "\nTry running: ${YELLOW}open $REDIRECT_URL${NC} to login via browser"
fi

# Cleanup
rm -f "$TEMP_FILE" /tmp/hotel_cookies.txt