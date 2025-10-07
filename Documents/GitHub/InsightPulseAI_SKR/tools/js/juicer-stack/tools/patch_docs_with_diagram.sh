#!/bin/bash
# patch_docs_with_diagram.sh - Update documentation files with new diagram references
# Usage: ./patch_docs_with_diagram.sh [diagram-name] [project-root]

# Set colors for readable output
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Documentation Patch Tool for Architecture Diagrams        ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${2:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
DIAGRAM_NAME="${1:-AZURE_ARCHITECTURE_PRO}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PATCH_DIR="${PROJECT_ROOT}/docs/patches"
PATCH_FILE="${PATCH_DIR}/diagram_docs_patch_${TIMESTAMP}.patch"

# Create patch directory
mkdir -p "${PATCH_DIR}"

# Files to patch
README_PATH="${PROJECT_ROOT}/docs/README_FINAL.md"
STAKEHOLDER_PATH="${PROJECT_ROOT}/docs/STAKEHOLDER_BRIEF.md"
QA_CHECKLIST_PATH="${PROJECT_ROOT}/docs/QA_CHECKLIST_PROJECT_SCOUT.md"

# Check if files exist
if [ ! -f "${README_PATH}" ]; then
  README_PATH="${PROJECT_ROOT}/README.md"
fi

if [ ! -f "${STAKEHOLDER_PATH}" ]; then
  STAKEHOLDER_PATH="${PROJECT_ROOT}/docs/STAKEHOLDER_BRIEF.md"
  
  # Create it if it doesn't exist
  if [ ! -f "${STAKEHOLDER_PATH}" ]; then
    mkdir -p "$(dirname "${STAKEHOLDER_PATH}")"
    echo "# Project Scout - Stakeholder Brief" > "${STAKEHOLDER_PATH}"
    echo "" >> "${STAKEHOLDER_PATH}"
    echo "*This document provides a high-level overview of the Project Scout architecture for stakeholders.*" >> "${STAKEHOLDER_PATH}"
    echo "" >> "${STAKEHOLDER_PATH}"
  fi
fi

echo -e "${BLUE}Checking for diagram files...${RESET}"

# Check for diagram files
PNG_PATH="${PROJECT_ROOT}/docs/images/${DIAGRAM_NAME}.png"
SVG_PATH="${PROJECT_ROOT}/docs/images/${DIAGRAM_NAME}.svg"
THUMBNAIL_PATH="${PROJECT_ROOT}/docs/images/thumbnails/${DIAGRAM_NAME}_thumb.png"

if [ ! -f "${PNG_PATH}" ]; then
  echo -e "${RED}Error: PNG file not found at ${PNG_PATH}${RESET}"
  echo -e "${YELLOW}Patch bundle will be created but may not work correctly${RESET}"
fi

if [ ! -f "${SVG_PATH}" ]; then
  echo -e "${YELLOW}Warning: SVG file not found at ${SVG_PATH}${RESET}"
  echo -e "${YELLOW}Patch will only include PNG references${RESET}"
fi

if [ ! -f "${THUMBNAIL_PATH}" ]; then
  echo -e "${YELLOW}Warning: Thumbnail not found at ${THUMBNAIL_PATH}${RESET}"
  echo -e "${YELLOW}Patch will use full-size PNG instead of thumbnail${RESET}"
  THUMBNAIL_PATH="${PNG_PATH}"
fi

echo -e "${BLUE}Creating backup of original files...${RESET}"

# Create backups of original files
if [ -f "${README_PATH}" ]; then
  cp "${README_PATH}" "${README_PATH}.bak.${TIMESTAMP}"
  echo -e "${GREEN}✓ README backup created: ${README_PATH}.bak.${TIMESTAMP}${RESET}"
fi

if [ -f "${STAKEHOLDER_PATH}" ]; then
  cp "${STAKEHOLDER_PATH}" "${STAKEHOLDER_PATH}.bak.${TIMESTAMP}"
  echo -e "${GREEN}✓ Stakeholder brief backup created: ${STAKEHOLDER_PATH}.bak.${TIMESTAMP}${RESET}"
fi

if [ -f "${QA_CHECKLIST_PATH}" ]; then
  cp "${QA_CHECKLIST_PATH}" "${QA_CHECKLIST_PATH}.bak.${TIMESTAMP}"
  echo -e "${GREEN}✓ QA checklist backup created: ${QA_CHECKLIST_PATH}.bak.${TIMESTAMP}${RESET}"
fi

echo -e "${BLUE}Generating patch content...${RESET}"

# Create patch file header
cat > "${PATCH_FILE}" << EOL
# Architecture Diagram Documentation Patch
# Generated: $(date)
# Diagram: ${DIAGRAM_NAME}
#
# This patch updates documentation files with references to the new architecture diagram.
# Apply with: patch -p0 < ${PATCH_FILE}

EOL

# Function to generate patch for a file
generate_patch() {
  local file_path="$1"
  local temp_path="${file_path}.new.${TIMESTAMP}"
  local rel_path="${file_path#$PROJECT_ROOT/}"
  local section_title="$2"
  local section_marker="$3"
  
  if [ ! -f "${file_path}" ]; then
    echo "File not found: ${file_path}, skipping patch generation."
    return
  fi
  
  # Create a copy for modification
  cp "${file_path}" "${temp_path}"
  
  # Check if the file already has an architecture diagram section
  if grep -q "${section_marker}" "${file_path}"; then
    # Replace existing section
    if [ -f "${SVG_PATH}" ]; then
      # Use SVG if available
      sed -i.bak "/${section_marker}/,/^\$/ c\\
${section_title}\\
${section_marker}\\
\\
<img src=\"docs/images/${DIAGRAM_NAME}.svg\" alt=\"Architecture Diagram\" width=\"800\">\\
\\
*Architecture diagram showing the Project Scout medallion data flow with GenAI integration*\\
\\
[View full-size diagram](docs/images/${DIAGRAM_NAME}.png) | [View SVG](docs/images/${DIAGRAM_NAME}.svg)\\
" "${temp_path}"
    else
      # PNG only
      sed -i.bak "/${section_marker}/,/^\$/ c\\
${section_title}\\
${section_marker}\\
\\
![Architecture Diagram](docs/images/${DIAGRAM_NAME}.png)\\
\\
*Architecture diagram showing the Project Scout medallion data flow with GenAI integration*\\
\\
[View full-size diagram](docs/images/${DIAGRAM_NAME}.png)\\
" "${temp_path}"
    fi
  else
    # Add new section
    if [ -f "${SVG_PATH}" ]; then
      # Use SVG if available
      cat >> "${temp_path}" << EOL

${section_title}
${section_marker}

<img src="docs/images/${DIAGRAM_NAME}.svg" alt="Architecture Diagram" width="800">

*Architecture diagram showing the Project Scout medallion data flow with GenAI integration*

[View full-size diagram](docs/images/${DIAGRAM_NAME}.png) | [View SVG](docs/images/${DIAGRAM_NAME}.svg)

EOL
    else
      # PNG only
      cat >> "${temp_path}" << EOL

${section_title}
${section_marker}

![Architecture Diagram](docs/images/${DIAGRAM_NAME}.png)

*Architecture diagram showing the Project Scout medallion data flow with GenAI integration*

[View full-size diagram](docs/images/${DIAGRAM_NAME}.png)

EOL
    fi
  fi
  
  # Generate diff
  diff -u "${file_path}" "${temp_path}" | sed "s|${temp_path}|${rel_path}|g" >> "${PATCH_FILE}"
  
  # Clean up
  rm -f "${temp_path}" "${temp_path}.bak"
}

# Generate patches for each file
if [ -f "${README_PATH}" ]; then
  echo -e "${BLUE}Generating patch for README...${RESET}"
  generate_patch "${README_PATH}" "## Architecture Diagram" "<!-- ARCHITECTURE_DIAGRAM_SECTION -->"
fi

if [ -f "${STAKEHOLDER_PATH}" ]; then
  echo -e "${BLUE}Generating patch for Stakeholder Brief...${RESET}"
  generate_patch "${STAKEHOLDER_PATH}" "## System Architecture" "<!-- SYSTEM_ARCHITECTURE_SECTION -->"
fi

if [ -f "${QA_CHECKLIST_PATH}" ]; then
  echo -e "${BLUE}Generating patch for QA Checklist...${RESET}"
  generate_patch "${QA_CHECKLIST_PATH}" "## QA Reference Diagram" "<!-- QA_REFERENCE_DIAGRAM_SECTION -->"
fi

echo -e "${GREEN}✓ Patch file created: ${PATCH_FILE}${RESET}"

# Check if there's anything to patch
if [ ! -s "${PATCH_FILE}" ]; then
  echo -e "${YELLOW}Warning: Patch file is empty. No changes were needed.${RESET}"
  exit 0
fi

# Apply patch
echo -e "${BLUE}Applying patch to documentation files...${RESET}"
patch -p0 < "${PATCH_FILE}" && \
  echo -e "${GREEN}✓ Patch applied successfully${RESET}" || \
  echo -e "${RED}✗ Failed to apply patch${RESET}"

# Create PR or commit template
COMMIT_TEMPLATE="${PATCH_DIR}/commit_message_${TIMESTAMP}.txt"
cat > "${COMMIT_TEMPLATE}" << EOL
docs: update architecture diagram references

- Update README_FINAL.md with new architecture diagram
- Update STAKEHOLDER_BRIEF.md with system architecture section
- Update QA checklist with reference diagram
- Add diagram exports (PNG, SVG, thumbnail)

Diagram QA: PARTIAL_PASS (55% pass rate)
QA ID: ARCH-QA-${TIMESTAMP}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOL

echo -e "${GREEN}✓ Commit template created: ${COMMIT_TEMPLATE}${RESET}"

echo -e "\n${BLUE}Next Steps:${RESET}"
echo -e "1. Review the patched documentation files"
echo -e "2. Run validations again to ensure all documentation is consistent"
echo -e "3. Commit changes using the template: ${COMMIT_TEMPLATE}"
echo -e "4. Consider updating any additional documentation files"

exit 0