#!/bin/bash
# Sync Juicer Stack to Kalaw Knowledge Repository
# This script officially syncs the Juicer implementation to Kalaw's knowledge index

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${MAGENTA}║  Claudia Orchestration: Syncing Juicer Stack to Kalaw        ║${RESET}"
echo -e "${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
KALAW_KNOWLEDGE_DIR="${REPO_ROOT}/SKR/knowledge"
RELEASE_ID="PULSER-2.0.1-JUICER-20250512"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")

# Create Kalaw knowledge directory if needed
if [[ ! -d "$KALAW_KNOWLEDGE_DIR" ]]; then
  echo -e "${BLUE}Creating Kalaw knowledge directory...${RESET}"
  mkdir -p "$KALAW_KNOWLEDGE_DIR"
fi

# Create Juicer directory in Kalaw's knowledge base
JUICER_KNOWLEDGE_DIR="${KALAW_KNOWLEDGE_DIR}/juicer/${RELEASE_ID}"
mkdir -p "$JUICER_KNOWLEDGE_DIR"

# PHASE 1: Verify release is locked
echo -e "${CYAN}PHASE 1: Verifying locked release status${RESET}"
if grep -q "LOCKED | DO NOT MODIFY" "${SCRIPT_DIR}/RELEASE.md"; then
  echo -e "  ${GREEN}✓ Release is properly locked${RESET}"
else
  echo -e "  ${RED}✕ Release is not locked! Aborting sync.${RESET}"
  echo -e "  Please ensure RELEASE.md contains the proper lock statement."
  exit 1
fi

# PHASE 2: Copy files to Kalaw's knowledge repository
echo -e "${CYAN}PHASE 2: Copying knowledge artifacts to Kalaw repository${RESET}"

# Copy key files
echo -e "  ${BLUE}Copying core implementation files...${RESET}"
mkdir -p "${JUICER_KNOWLEDGE_DIR}/"{notebooks,dashboards,cli,pulser,router}

# Copy notebooks
cp "${SCRIPT_DIR}/notebooks/juicer_enrich_silver.py" "${JUICER_KNOWLEDGE_DIR}/notebooks/"
cp "${SCRIPT_DIR}/notebooks/juicer_ingest_bronze.sql" "${JUICER_KNOWLEDGE_DIR}/notebooks/"
echo -e "  ${GREEN}✓ Databricks notebooks copied${RESET}"

# Copy dashboards
cp "${SCRIPT_DIR}/dashboards/juicer_dash_shell.html" "${JUICER_KNOWLEDGE_DIR}/dashboards/"
cp "${SCRIPT_DIR}/dashboards/agent_brand_heatmap.dbviz" "${JUICER_KNOWLEDGE_DIR}/dashboards/"
echo -e "  ${GREEN}✓ Dashboard templates copied${RESET}"

# Copy CLI
cp "${SCRIPT_DIR}/cli/juicer_cli.py" "${JUICER_KNOWLEDGE_DIR}/cli/"
cp "${SCRIPT_DIR}/cli/requirements.txt" "${JUICER_KNOWLEDGE_DIR}/cli/"
echo -e "  ${GREEN}✓ CLI tools copied${RESET}"

# Copy router commands
cp "${REPO_ROOT}/tools/js/router/commands/juicer.js" "${JUICER_KNOWLEDGE_DIR}/router/"
echo -e "  ${GREEN}✓ Router command handlers copied${RESET}"

# Copy agent hooks
cp "${SCRIPT_DIR}/pulser/juicer_hook.yaml" "${JUICER_KNOWLEDGE_DIR}/pulser/"
echo -e "  ${GREEN}✓ Agent hooks copied${RESET}"

# Copy index files
cp "${SCRIPT_DIR}/kalaw_index.yaml" "${JUICER_KNOWLEDGE_DIR}/"
cp "${SCRIPT_DIR}/RELEASE.md" "${JUICER_KNOWLEDGE_DIR}/"
cp "${SCRIPT_DIR}/README.md" "${JUICER_KNOWLEDGE_DIR}/"
cp "${SCRIPT_DIR}/DEBUGGING.md" "${JUICER_KNOWLEDGE_DIR}/"
echo -e "  ${GREEN}✓ Documentation and index files copied${RESET}"

# PHASE 3: Generate knowledge record
echo -e "${CYAN}PHASE 3: Generating Kalaw knowledge record${RESET}"

# Create knowledge record
cat > "${KALAW_KNOWLEDGE_DIR}/records/juicer_sync_${TIMESTAMP}.md" << EOF
# Juicer Stack Knowledge Sync
**Reference:** ${RELEASE_ID}  
**Sync Date:** $(date "+%Y-%m-%d %H:%M:%S")  
**Status:** COMPLETED

## Summary
Juicer Stack implementation has been synced to Kalaw's knowledge repository. This implementation provides a PowerBI-like AI + BI system embedded directly into the Pulser stack.

## Components
- Databricks notebooks for data processing
- Dashboard templates for visualization
- CLI tools for interaction
- Agent hooks for orchestration

## Retrieval Commands
Knowledge can be retrieved via the following commands:

\`\`\`
:kalaw recall juicer-stack specification
:kalaw lookup "pulser 2.0.x juicer"
:kalaw search "brand detection dashboard"
\`\`\`

## Orchestration Record
This sync was performed by Claudia as part of the orchestration record ${RELEASE_ID}.
Knowledge indexing is now available for all agents in the InsightPulseAI system.

## Path
\`${JUICER_KNOWLEDGE_DIR}\`
EOF

echo -e "  ${GREEN}✓ Knowledge record created${RESET}"

# PHASE 4: Update Claudia orchestration log
echo -e "${CYAN}PHASE 4: Updating Claudia orchestration log${RESET}"

# Create orchestration log entry
mkdir -p "${REPO_ROOT}/logs/claudia_orchestration"
cat > "${REPO_ROOT}/logs/claudia_orchestration/juicer_lock_${TIMESTAMP}.log" << EOF
ORCHESTRATION_RECORD: ${RELEASE_ID}
TIMESTAMP: $(date "+%Y-%m-%d %H:%M:%S")
ACTION: LOCK_AND_SYNC
MODULE: JUICER_STACK
VERSION: 2.0.1
STATUS: COMPLETED
AGENTS: Claudia,Kalaw,Echo,Maya,Sunnies
PATH: ${JUICER_KNOWLEDGE_DIR}
RETRIEVAL_KEY: pulser-2.0.x-juicer
EOF

echo -e "  ${GREEN}✓ Orchestration log updated${RESET}"

# PHASE 5: Verification
echo -e "${CYAN}PHASE 5: Verifying sync${RESET}"

# Verify all required files exist in the knowledge directory
FILES_TO_CHECK=(
  "notebooks/juicer_enrich_silver.py"
  "notebooks/juicer_ingest_bronze.sql"
  "dashboards/juicer_dash_shell.html"
  "dashboards/agent_brand_heatmap.dbviz"
  "cli/juicer_cli.py"
  "router/juicer.js"
  "pulser/juicer_hook.yaml"
  "kalaw_index.yaml"
  "RELEASE.md"
)

ALL_FILES_PRESENT=true
for FILE in "${FILES_TO_CHECK[@]}"; do
  if [[ ! -f "${JUICER_KNOWLEDGE_DIR}/${FILE}" ]]; then
    echo -e "  ${RED}✕ Missing file: ${FILE}${RESET}"
    ALL_FILES_PRESENT=false
  fi
done

if $ALL_FILES_PRESENT; then
  echo -e "  ${GREEN}✓ All required files verified in Kalaw knowledge repository${RESET}"
else
  echo -e "  ${RED}✕ Some files are missing! Sync may be incomplete.${RESET}"
  exit 1
fi

# PHASE 6: Complete
echo -e "${CYAN}PHASE 6: Sync completed${RESET}"
echo -e "${GREEN}${BOLD}Juicer Stack has been successfully synced to Kalaw's knowledge repository!${RESET}"
echo -e "Reference ID: ${YELLOW}${RELEASE_ID}${RESET}"
echo -e "Knowledge path: ${YELLOW}${JUICER_KNOWLEDGE_DIR}${RESET}"
echo -e ""
echo -e "${BLUE}To retrieve this knowledge, use:${RESET}"
echo -e "  ${YELLOW}:kalaw recall juicer-stack specification${RESET}"
echo -e "  ${YELLOW}:kalaw lookup \"pulser 2.0.x juicer\"${RESET}"
echo -e ""
echo -e "${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${MAGENTA}${BOLD}║  ORCHESTRATION COMPLETE - IMPLEMENTATION LOCKED              ║${RESET}"
echo -e "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"