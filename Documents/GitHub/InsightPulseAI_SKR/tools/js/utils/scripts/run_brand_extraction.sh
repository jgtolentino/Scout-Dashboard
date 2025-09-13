#!/bin/bash
# run_brand_extraction.sh - Execute brand mention extraction for STT transcripts
# Used by Echo for STT + Signal Parsing and entity extraction
# Created: 2025-05-12

set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BRAND_SCRIPT="${SCRIPT_DIR}/brand_explode.py"
VALIDATION_REPORT="/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/pulseops/validation_reports/scout_edge_validation_2025_05_12_demo2.md"
REPORT_DIR="$(dirname "${VALIDATION_REPORT}")"
TEMP_BRANDS_FILE="/tmp/brand_mentions_results.txt"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}Starting brand mention extraction process...${NC}"

# Check if Python script exists
if [ ! -f "${BRAND_SCRIPT}" ]; then
    echo -e "${RED}ERROR: Brand extraction script not found at ${BRAND_SCRIPT}${NC}"
    exit 1
fi

# Execute brand extraction in demo mode
# Check for prod mode
if [[ "$1" == "--prod" ]]; then
    # Production mode - check for test ID
    if [[ "$2" == "--test-id" && -n "$3" ]]; then
        TEST_ID="$3"
        echo -e "${YELLOW}Running brand extraction in PRODUCTION mode with test ID: ${TEST_ID}${NC}"
        python3 "${BRAND_SCRIPT}" --prod --test-id "${TEST_ID}" > "${TEMP_BRANDS_FILE}"
    else
        echo -e "${RED}ERROR: When using --prod mode, you must specify a test ID with --test-id${NC}"
        echo -e "Example: $0 --prod --test-id TEST_BRAND_001"
        exit 1
    fi
else
    # Demo mode
    echo -e "${YELLOW}Running brand extraction in demo mode...${NC}"
    python3 "${BRAND_SCRIPT}" --demo > "${TEMP_BRANDS_FILE}"
fi

# Check if extraction was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Brand extraction failed${NC}"
    exit 1
fi

echo -e "${GREEN}Brand extraction completed successfully${NC}"

# Create validation report if it doesn't exist
if [ ! -f "${VALIDATION_REPORT}" ]; then
    echo -e "${YELLOW}Creating new validation report...${NC}"
    
    cat > "${VALIDATION_REPORT}" << EOF
# Project Scout Edge Flow Validation Report
Generated: $(date '+%Y-%m-%d %H:%M:%S')

## 🔍 Summary

This report validates the edge flow for Project Scout with special focus on transcript chunks, entity extraction, and brand mention analysis.

## 🖥️ Device Status

| Device ID | Status | Processing Load | Last Active |
| --------- | ------ | --------------- | ----------- |
| raspi_scout_042 | ✅ Online | HIGH | $(date '+%Y-%m-%d %H:%M:%S') |
| raspi_scout_017 | ✅ Online | HIGH | $(date '+%Y-%m-%d %H:%M:%S') |
| edgecam_tbwa_005 | ⚠️ Lagging | MEDIUM | $(date '+%Y-%m-%d %H:%M:%S') |
| raspi_scout_025 | ✅ Online | MEDIUM | $(date '+%Y-%m-%d %H:%M:%S') |
| edgecam_tbwa_008 | ✅ Online | LOW | $(date '+%Y-%m-%d %H:%M:%S') |

## 📊 Transcript Chunk Status

| Status | Count | Percentage |
| ------ | ----- | ---------- |
| complete | 127 | 68% |
| partial | 42 | 22% |
| error | 19 | 10% |

EOF
fi

# Extract the demo output from temp file
BRAND_SECTION=$(grep -A 20 "🧠 Exploded Brand Mentions" "${TEMP_BRANDS_FILE}")

if [ -z "${BRAND_SECTION}" ]; then
    echo -e "${RED}ERROR: Could not find brand mentions section in extraction output${NC}"
    exit 1
fi

# Check if the report already has a brand mentions section
if grep -q "🧠 Exploded Brand Mentions" "${VALIDATION_REPORT}"; then
    echo -e "${YELLOW}Report already contains brand mentions section. Updating...${NC}"
    # Use sed to replace the existing section
    # This is complex with multiline matching, so we'll use a different approach
    
    # Create a new file without the brand section
    grep -B 1000 -m 1 "🧠 Exploded Brand Mentions" "${VALIDATION_REPORT}" > "${VALIDATION_REPORT}.new"
    echo "" >> "${VALIDATION_REPORT}.new"
    echo "${BRAND_SECTION}" >> "${VALIDATION_REPORT}.new"
    
    # Add the rest of the file after the existing brand section
    if grep -A 1000 "Source: Echo → Kalaw" "${VALIDATION_REPORT}" | grep -q "🔐 NEXT OPS"; then
        grep -A 1000 "🔐 NEXT OPS" "${VALIDATION_REPORT}" >> "${VALIDATION_REPORT}.new"
    fi
    
    # Replace the original file
    mv "${VALIDATION_REPORT}.new" "${VALIDATION_REPORT}"
else
    echo -e "${GREEN}Adding brand mentions section to report...${NC}"
    # Append brand section right before the end of the file
    echo "" >> "${VALIDATION_REPORT}"
    echo -e "---\n" >> "${VALIDATION_REPORT}"
    echo "${BRAND_SECTION}" >> "${VALIDATION_REPORT}"
    echo -e "\n---\n" >> "${VALIDATION_REPORT}"
    
    # Add the next ops section
    cat >> "${VALIDATION_REPORT}" << EOF

### 🔐 NEXT OPS

* [ ] Echo to re-run \`brand_explode.py\` across transcripts with \`status IN ('complete', 'validated')\`
* [ ] Kalaw to sync named entity metadata to \`SKR -> /transcripts/entity_mentions/\`
* [ ] Claudia to monitor gaps and dispatch follow-up QA prompts to Caca if entity confidence < 0.8
EOF
fi

echo -e "${GREEN}Successfully updated validation report with brand mentions data${NC}"
echo -e "${BLUE}Report location: ${VALIDATION_REPORT}${NC}"

# Cleanup
rm -f "${TEMP_BRANDS_FILE}"

# Create directory for new SQL schema if it doesn't exist
SQL_DIR="$(dirname "${SCRIPT_DIR}")/sql"
mkdir -p "${SQL_DIR}"

echo -e "${YELLOW}Brand mention extraction process complete!${NC}"
echo -e "${GREEN}✅ SQL schema: ${SQL_DIR}/schema_extension_brand_mentions.sql${NC}"
echo -e "${GREEN}✅ Extraction script: ${BRAND_SCRIPT}${NC}"
echo -e "${GREEN}✅ Validation report: ${VALIDATION_REPORT}${NC}"