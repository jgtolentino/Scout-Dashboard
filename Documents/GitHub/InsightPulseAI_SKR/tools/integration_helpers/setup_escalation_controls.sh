#!/bin/bash
# setup_escalation_controls.sh
#
# Setup script for Pulser and Claude escalation controls
# This script initializes the necessary directories and configurations
# for enforcing the escalation controls defined in CLAUDE.md

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Escalation Controls for Pulser/Claude...${NC}"

# Create required directories
mkdir -p ~/.pulser/logs
echo -e "${GREEN}✅ Created log directories${NC}"

# Initialize empty audit log if it doesn't exist
if [ ! -f ~/.pulser/logs/Claudia.audit ]; then
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | SYSTEM | Escalation control audit log initialized" > ~/.pulser/logs/Claudia.audit
  echo -e "${GREEN}✅ Initialized Claudia.audit log${NC}"
else
  echo -e "${YELLOW}ℹ️ Claudia.audit log already exists${NC}"
fi

# Initialize empty session tracking if it doesn't exist
if [ ! -f ~/.pulser/logs/claudia_tagged_sessions.json ]; then
  echo "[]" > ~/.pulser/logs/claudia_tagged_sessions.json
  echo -e "${GREEN}✅ Initialized claudia_tagged_sessions.json${NC}"
else
  echo -e "${YELLOW}ℹ️ Tagged sessions log already exists${NC}"
fi

# Check if router integration is needed
if grep -q "task_filter" "$(dirname "$0")/../js/router/index.js"; then
  echo -e "${YELLOW}ℹ️ Router already contains task_filter integration${NC}"
else
  echo -e "${YELLOW}⚠️ Router needs manual integration of task_filter.js${NC}"
  echo -e "${YELLOW}Please add the following import to the router/index.js file:${NC}"
  echo "const { filterTask } = require('./commands/task_filter');"
  echo
  echo -e "${YELLOW}And add the following before line ~108 in processCommand():${NC}"
  echo "  // Check if task needs escalation"
  echo "  const filterResult = await filterTask(input, context);"
  echo "  if (filterResult.isEscalated) {"
  echo "    return filterResult.message;"
  echo "  }"
fi

# Add escalation_rbac entry to SPECIAL_COMMANDS if needed
if grep -q ":escalate_rbac" "$(dirname "$0")/../js/router/index.js"; then
  echo -e "${YELLOW}ℹ️ Escalation tags already in SPECIAL_COMMANDS${NC}"
else
  echo -e "${YELLOW}⚠️ SPECIAL_COMMANDS needs manual update${NC}"
  echo -e "${YELLOW}Please add the following to the SPECIAL_COMMANDS object in router/index.js:${NC}"
  echo "  ':escalate_rbac': handleEscalate,"
  echo "  ':escalate_billing': handleEscalate,"
  echo "  ':escalate_compliance': handleEscalate,"
  echo
  echo -e "${YELLOW}And add this function at the end:${NC}"
  echo "async function handleEscalate(input, context) {"
  echo "  try {"
  echo "    const escalateCommand = require('./commands/escalate');"
  echo "    return await escalateCommand.execute(input.substring(input.indexOf(' ')).trim(), context);"
  echo "  } catch (error) {"
  echo "    return \`Error handling escalation: \${error.message}\`;"
  echo "  }"
  echo "}"
fi

# Check if the human override environment variable exists in the current shell
if [ -z "$ALLOW_HUMAN_OVERRIDE" ]; then
  echo -e "${YELLOW}⚠️ ALLOW_HUMAN_OVERRIDE is not set${NC}"
  echo -e "${YELLOW}To enable human override (for testing only):${NC}"
  echo "export ALLOW_HUMAN_OVERRIDE=true"
else
  if [ "$ALLOW_HUMAN_OVERRIDE" = "true" ]; then
    echo -e "${RED}⚠️ WARNING: ALLOW_HUMAN_OVERRIDE is currently set to true!${NC}"
    echo -e "${RED}This will bypass escalation controls. Only use for testing.${NC}"
  else
    echo -e "${GREEN}✅ ALLOW_HUMAN_OVERRIDE is set to false (default)${NC}"
  fi
fi

# Log this setup in the audit log
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") | SYSTEM | Escalation controls setup script executed by $USER" >> ~/.pulser/logs/Claudia.audit

echo
echo -e "${GREEN}Escalation Controls Setup Complete!${NC}"
echo -e "${YELLOW}Please review README_ESCALATION_CONTROLS.md for usage instructions.${NC}"