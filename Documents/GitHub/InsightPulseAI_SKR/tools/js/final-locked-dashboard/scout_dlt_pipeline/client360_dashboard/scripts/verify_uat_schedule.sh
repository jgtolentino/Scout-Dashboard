#!/bin/bash
# Verify UAT schedule and sign-off document
# This script validates the UAT schedule and sign-off document

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Verifying UAT schedule and sign-off for Client360 Dashboard...${NC}"

# Path to UAT document
UAT_DOC="../CLIENT360_UAT_SCHEDULE.md"

# Required sections in the UAT document
REQUIRED_SECTIONS=(
  "UAT Participants"
  "UAT Schedule"
  "UAT Test Environments"
  "Test Cases Overview"
  "Defect Management"
  "Exit Criteria"
  "Sign-Off Process"
)

# Required dates - must be in format YYYY-MM-DD or verbatim match
REQUIRED_DATES=(
  "May 22, 2025"
  "May 23–24, 2025"
  "May 25–26, 2025"
  "May 27, 2025"
)

# Required roles
REQUIRED_ROLES=(
  "UAT Lead"
  "QA Engineer"
  "Business Analyst"
  "Operations Representative"
  "IT Engineer"
  "Data Scientist"
  "Marketing Lead"
)

echo -e "${YELLOW}Checking UAT document exists...${NC}"
if [ ! -f "$UAT_DOC" ]; then
  echo -e "${RED}UAT document not found at: $UAT_DOC${NC}"
  exit 1
else
  echo -e "${GREEN}✅ UAT document found${NC}"
fi

echo -e "${YELLOW}Checking for required sections...${NC}"
MISSING_SECTIONS=0
for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q "$section" "$UAT_DOC"; then
    echo -e "${RED}❌ Missing required section: $section${NC}"
    MISSING_SECTIONS=$((MISSING_SECTIONS+1))
  fi
done

if [ $MISSING_SECTIONS -eq 0 ]; then
  echo -e "${GREEN}✅ All required sections found${NC}"
else
  echo -e "${RED}❌ Missing $MISSING_SECTIONS required sections${NC}"
fi

echo -e "${YELLOW}Checking for required dates...${NC}"
MISSING_DATES=0
for date in "${REQUIRED_DATES[@]}"; do
  if ! grep -q "$date" "$UAT_DOC"; then
    echo -e "${RED}❌ Missing required date: $date${NC}"
    MISSING_DATES=$((MISSING_DATES+1))
  fi
done

if [ $MISSING_DATES -eq 0 ]; then
  echo -e "${GREEN}✅ All required dates found${NC}"
else
  echo -e "${RED}❌ Missing $MISSING_DATES required dates${NC}"
fi

echo -e "${YELLOW}Checking for required roles...${NC}"
MISSING_ROLES=0
for role in "${REQUIRED_ROLES[@]}"; do
  if ! grep -q "$role" "$UAT_DOC"; then
    echo -e "${RED}❌ Missing required role: $role${NC}"
    MISSING_ROLES=$((MISSING_ROLES+1))
  fi
done

if [ $MISSING_ROLES -eq 0 ]; then
  echo -e "${GREEN}✅ All required roles found${NC}"
else
  echo -e "${RED}❌ Missing $MISSING_ROLES required roles${NC}"
fi

# Validate the document is properly formatted
echo -e "${YELLOW}Validating document format...${NC}"
if grep -q "^##" "$UAT_DOC" && grep -q "^\|" "$UAT_DOC" && grep -q "^[0-9]" "$UAT_DOC"; then
  echo -e "${GREEN}✅ Document format appears valid${NC}"
else
  echo -e "${YELLOW}⚠️ Document format may have issues${NC}"
fi

# Check Pulser integration
echo -e "${YELLOW}Checking Pulser integration...${NC}"
if grep -q "Pulser" "$UAT_DOC" && grep -q "Task ID" "$UAT_DOC"; then
  echo -e "${GREEN}✅ Pulser integration confirmed${NC}"
else
  echo -e "${RED}❌ Missing Pulser integration${NC}"
fi

# Check UAT environments
echo -e "${YELLOW}Checking UAT environments...${NC}"
if grep -q "https://blue-coast-0acb6880f.6.azurestaticapps.net" "$UAT_DOC"; then
  echo -e "${GREEN}✅ Production URL is correctly documented${NC}"
else
  echo -e "${RED}❌ Missing or incorrect production URL${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}UAT Validation Summary:${NC}"

if [ $MISSING_SECTIONS -eq 0 ] && [ $MISSING_DATES -eq 0 ] && [ $MISSING_ROLES -eq 0 ]; then
  echo -e "${GREEN}✅ All validation checks PASSED${NC}"
  echo -e "${GREEN}✅ UAT schedule and sign-off document is valid${NC}"
  echo -e "${GREEN}✅ UAT can proceed as scheduled on May 22, 2025${NC}"
  
  # Update Pulser status
  echo "UAT_STATUS=VALIDATED" > ./.uat_status
  echo "UAT_VALIDATION_DATE=$(date -u +"%Y-%m-%d")" >> ./.uat_status
  echo "UAT_DOCUMENT_PATH=$UAT_DOC" >> ./.uat_status
  
  exit 0
else
  echo -e "${RED}❌ Some validation checks FAILED${NC}"
  echo -e "${RED}❌ UAT schedule and sign-off document needs correction${NC}"
  echo -e "${YELLOW}⚠️ Please fix the issues and run this script again${NC}"
  
  # Update Pulser status
  echo "UAT_STATUS=INVALID" > ./.uat_status
  echo "UAT_VALIDATION_DATE=$(date -u +"%Y-%m-%d")" >> ./.uat_status
  echo "UAT_DOCUMENT_PATH=$UAT_DOC" >> ./.uat_status
  echo "UAT_MISSING_SECTIONS=$MISSING_SECTIONS" >> ./.uat_status
  echo "UAT_MISSING_DATES=$MISSING_DATES" >> ./.uat_status
  echo "UAT_MISSING_ROLES=$MISSING_ROLES" >> ./.uat_status
  
  exit 1
fi