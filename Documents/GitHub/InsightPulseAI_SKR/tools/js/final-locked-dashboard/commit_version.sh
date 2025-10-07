#!/bin/bash
# Commit and tag version 2.2.1

set -e

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERSION="2.2.1"
COMMIT_MSG="v$VERSION: Fix GenAI dashboard issues and enhance security"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}     Scout Dashboard Version Commit     ${NC}"
echo -e "${BLUE}     Version: $VERSION                  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if there are changes to commit
if git diff --quiet && git diff --staged --quiet; then
  echo -e "${RED}No changes to commit. Aborting.${NC}"
  exit 1
fi

# List files that have been modified
echo -e "\n${YELLOW}Modified files:${NC}"
git status --porcelain

# Show diffs for key files
echo -e "\n${YELLOW}Diff for unified_genai_insights.js:${NC}"
git diff deployment-v2/public/js/unified_genai_insights.js | head -n 50
echo "... (trimmed) ..."

# Confirm commit
echo -e "\n${YELLOW}Ready to commit with message:${NC} $COMMIT_MSG"
echo -e "${YELLOW}Continue? (y/n)${NC}"
read -r response
if [[ "$response" != "y" ]]; then
  echo -e "${RED}Aborting commit.${NC}"
  exit 1
fi

# Stage all files
git add .

# Commit changes
git commit -m "$COMMIT_MSG" -m "
* Fixed critical issues in unified_genai_insights.js
* Enhanced security by replacing innerHTML with proper DOM methods
* Improved performance with element caching
* Added proper timer handling
* Updated deployment script with new options
* Created CI/CD pipeline for automated testing
* Added test suite for unit, smoke, and visual tests
* Implemented two-tier confidence filtering for insights
"

# Tag the commit
git tag -a "v$VERSION" -m "Version $VERSION"

echo -e "\n${GREEN}Changes committed and tagged as v$VERSION${NC}"
echo -e "${YELLOW}To push changes:${NC}"
echo -e "  git push origin main"
echo -e "  git push origin v$VERSION"

echo -e "\n${BLUE}Commit Summary:${NC}"
git show --stat HEAD