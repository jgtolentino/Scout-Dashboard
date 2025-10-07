#!/bin/bash
# diagram_qa_validate.sh - Quality assurance checks for architecture diagrams
# Usage: ./diagram_qa_validate.sh [diagram_path] [output_directory]

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

# Header
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Architecture Diagram QA Validator                          ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIAGRAM_PATH="${1:-${PROJECT_ROOT}/docs/architecture_src/architecture.drawio}"
OUTPUT_DIR="${2:-${PROJECT_ROOT}/docs/images}"
QA_RESULTS="${OUTPUT_DIR}/qa_results.txt"

# Create output directory
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/archive"
mkdir -p "${PROJECT_ROOT}/docs/architecture_src"

# Initialize results file
echo "Diagram QA Results for: ${DIAGRAM_PATH}" > "${QA_RESULTS}"
echo "Date: $(date)" >> "${QA_RESULTS}"
echo "----------------------------------------" >> "${QA_RESULTS}"

# Display initial information
echo -e "${BLUE}Diagram path: ${DIAGRAM_PATH}${RESET}"
echo -e "${BLUE}Output directory: ${OUTPUT_DIR}${RESET}"
echo -e "${BLUE}QA results will be saved to: ${QA_RESULTS}${RESET}"
echo ""

# Check if drawio CLI is available
if command -v draw.io &> /dev/null; then
    echo -e "${GREEN}✅ draw.io CLI detected${RESET}"
    echo "✅ draw.io CLI detected" >> "${QA_RESULTS}"
else
    echo -e "${YELLOW}⚠️ draw.io CLI not found - install for full validation${RESET}"
    echo "⚠️ draw.io CLI not found - install for full validation" >> "${QA_RESULTS}"
fi

# Check file exists
if [ -f "${DIAGRAM_PATH}" ]; then
    echo -e "${GREEN}✅ Diagram file exists${RESET}"
    echo "✅ Diagram file exists" >> "${QA_RESULTS}"
    
    # Check file size (basic proxy for complexity/resolution)
    FILE_SIZE=$(du -h "${DIAGRAM_PATH}" | cut -f1)
    echo -e "${BLUE}ℹ️ Diagram file size: ${FILE_SIZE}${RESET}"
    echo "ℹ️ Diagram file size: ${FILE_SIZE}" >> "${QA_RESULTS}"
    
    # Copy diagram to architecture_src if it's not already there
    if [[ "${DIAGRAM_PATH}" != "${PROJECT_ROOT}/docs/architecture_src/"* ]]; then
        BASENAME=$(basename "${DIAGRAM_PATH}")
        DEST_PATH="${PROJECT_ROOT}/docs/architecture_src/${BASENAME}"
        echo -e "${BLUE}Copying diagram to architecture_src directory...${RESET}"
        cp "${DIAGRAM_PATH}" "${DEST_PATH}"
        echo -e "${GREEN}✅ Diagram copied to: ${DEST_PATH}${RESET}"
        echo "✅ Diagram copied to architecture source directory" >> "${QA_RESULTS}"
    fi
    
    # Generate exports
    if command -v draw.io &> /dev/null; then
        echo -e "${BLUE}Generating exports...${RESET}"
        echo "Generating exports..." >> "${QA_RESULTS}"
        
        # Generate PNG export
        echo -e "${BLUE}Creating high-resolution PNG export...${RESET}"
        draw.io -x -f png -o "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" "${DIAGRAM_PATH}" && \
            echo -e "${GREEN}✅ PNG export successful${RESET}" && \
            echo "✅ PNG export successful: ${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" >> "${QA_RESULTS}" || \
            echo -e "${RED}❌ PNG export failed${RESET}" && \
            echo "❌ PNG export failed" >> "${QA_RESULTS}"
        
        # Generate SVG export
        echo -e "${BLUE}Creating SVG export for embedding...${RESET}"
        draw.io -x -f svg -o "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.svg" "${DIAGRAM_PATH}" && \
            echo -e "${GREEN}✅ SVG export successful${RESET}" && \
            echo "✅ SVG export successful: ${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.svg" >> "${QA_RESULTS}" || \
            echo -e "${RED}❌ SVG export failed${RESET}" && \
            echo "❌ SVG export failed" >> "${QA_RESULTS}"
        
        # Generate thumbnail
        echo -e "${BLUE}Creating thumbnail for README...${RESET}"
        draw.io -x -f png -s 2 -o "${OUTPUT_DIR}/temp_high_res.png" "${DIAGRAM_PATH}" && \
            convert "${OUTPUT_DIR}/temp_high_res.png" -resize 800x "${OUTPUT_DIR}/AZURE_ARCHITECTURE_THUMBNAIL.png" && \
            rm "${OUTPUT_DIR}/temp_high_res.png" && \
            echo -e "${GREEN}✅ Thumbnail created successfully${RESET}" && \
            echo "✅ Thumbnail created: ${OUTPUT_DIR}/AZURE_ARCHITECTURE_THUMBNAIL.png" >> "${QA_RESULTS}" || \
            echo -e "${RED}❌ Thumbnail creation failed${RESET}" && \
            echo "❌ Thumbnail creation failed" >> "${QA_RESULTS}"
        
        # Create archived version with timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        cp "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" "${OUTPUT_DIR}/archive/AZURE_ARCHITECTURE_${TIMESTAMP}.png" && \
            echo -e "${GREEN}✅ Archived version created${RESET}" && \
            echo "✅ Archived version created: ${OUTPUT_DIR}/archive/AZURE_ARCHITECTURE_${TIMESTAMP}.png" >> "${QA_RESULTS}"
        
        # Check PNG dimensions
        if command -v identify &> /dev/null; then
            PNG_DIMS=$(identify -format "%wx%h" "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png")
            echo -e "${BLUE}ℹ️ PNG dimensions: ${PNG_DIMS}${RESET}"
            echo "ℹ️ PNG dimensions: ${PNG_DIMS}" >> "${QA_RESULTS}"
            
            # Check if dimensions meet minimum requirements
            PNG_WIDTH=$(echo ${PNG_DIMS} | cut -d'x' -f1)
            if [ ${PNG_WIDTH} -ge 1600 ]; then
                echo -e "${GREEN}✅ PNG resolution meets minimum width (1600px)${RESET}"
                echo "✅ PNG resolution meets minimum width (1600px)" >> "${QA_RESULTS}"
            else
                echo -e "${RED}❌ PNG resolution below minimum width (1600px)${RESET}"
                echo "❌ PNG resolution below minimum width (1600px)" >> "${QA_RESULTS}"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Diagram file not found at: ${DIAGRAM_PATH}${RESET}"
    echo "❌ Diagram file not found at: ${DIAGRAM_PATH}" >> "${QA_RESULTS}"
fi

# Basic XML parsing to check for common issues (if xmllint is available)
if command -v xmllint &> /dev/null; then
    echo -e "${BLUE}Performing XML validation and analysis...${RESET}"
    
    # Count number of text elements
    TEXT_COUNT=$(xmllint --xpath "count(//text)" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo -e "${BLUE}ℹ️ Text elements count: ${TEXT_COUNT}${RESET}"
    echo "ℹ️ Text elements count: ${TEXT_COUNT}" >> "${QA_RESULTS}"
    
    # Count number of shapes
    SHAPE_COUNT=$(xmllint --xpath "count(//mxCell[@vertex='1'])" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo -e "${BLUE}ℹ️ Shape elements count: ${SHAPE_COUNT}${RESET}"
    echo "ℹ️ Shape elements count: ${SHAPE_COUNT}" >> "${QA_RESULTS}"
    
    # Count number of connections
    CONN_COUNT=$(xmllint --xpath "count(//mxCell[@edge='1'])" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo -e "${BLUE}ℹ️ Connection elements count: ${CONN_COUNT}${RESET}"
    echo "ℹ️ Connection elements count: ${CONN_COUNT}" >> "${QA_RESULTS}"
    
    # Basic test - every shape should have a label
    if [ "${TEXT_COUNT}" -lt "${SHAPE_COUNT}" ]; then
        echo -e "${YELLOW}⚠️ Possible unlabeled shapes detected (more shapes than text elements)${RESET}"
        echo "⚠️ Possible unlabeled shapes detected (more shapes than text elements)" >> "${QA_RESULTS}"
    fi

    # Check for fallback icons
    if command -v grep &> /dev/null; then
        CUSTOM_ICON_COUNT=$(grep -c "qa:custom-icon" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
        UNOFFICIAL_VISUAL_COUNT=$(grep -ci "unofficial visual" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")

        if [ "${CUSTOM_ICON_COUNT}" -gt 0 ] || [ "${UNOFFICIAL_VISUAL_COUNT}" -gt 0 ]; then
            echo -e "${BLUE}ℹ️ Found ${CUSTOM_ICON_COUNT} elements with custom icon attribute${RESET}"
            echo "ℹ️ Found ${CUSTOM_ICON_COUNT} elements with custom icon attribute" >> "${QA_RESULTS}"
            echo -e "${BLUE}ℹ️ Found ${UNOFFICIAL_VISUAL_COUNT} elements with unofficial visual annotation${RESET}"
            echo "ℹ️ Found ${UNOFFICIAL_VISUAL_COUNT} elements with unofficial visual annotation" >> "${QA_RESULTS}"

            # Check for missing icons documentation
            MISSING_ICONS_FILE="${SCRIPT_DIR}/../docs/MISSING_AZURE_ICONS.md"
            if [ -f "${MISSING_ICONS_FILE}" ]; then
                echo -e "${GREEN}✅ Fallback icons properly documented${RESET}"
                echo "✅ Fallback icons properly documented" >> "${QA_RESULTS}"
            else
                echo -e "${YELLOW}⚠️ Missing icons documentation not found - create ${MISSING_ICONS_FILE}${RESET}"
                echo "⚠️ Missing icons documentation not found" >> "${QA_RESULTS}"
            fi
        fi
    else
        echo -e "${BLUE}ℹ️ Grep not available, skipping fallback icon checks${RESET}"
        echo "ℹ️ Grep not available, skipping fallback icon checks" >> "${QA_RESULTS}"
    fi

    # Basic labeled shape check result
    if [ "${TEXT_COUNT}" -ge "${SHAPE_COUNT}" ]; then
        echo -e "${GREEN}✅ All shapes appear to be labeled${RESET}"
        echo "✅ All shapes appear to be labeled" >> "${QA_RESULTS}"
    fi
    
    # Check for connections
    if [ "${CONN_COUNT}" -eq 0 ]; then
        echo -e "${RED}❌ No connections found - diagram may be incomplete${RESET}"
        echo "❌ No connections found - diagram may be incomplete" >> "${QA_RESULTS}"
    else
        # Basic test - connections between components
        EXPECTED_MIN_CONN=$(echo "${SHAPE_COUNT} - 1" | bc)
        if [ "${CONN_COUNT}" -ge "${EXPECTED_MIN_CONN}" ]; then
            echo -e "${GREEN}✅ Connection count looks reasonable${RESET}"
            echo "✅ Connection count looks reasonable" >> "${QA_RESULTS}"
        else
            echo -e "${YELLOW}⚠️ Fewer connections than expected - diagram may be disconnected${RESET}"
            echo "⚠️ Fewer connections than expected - diagram may be disconnected" >> "${QA_RESULTS}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ xmllint not found - skipping XML analysis${RESET}"
    echo "⚠️ xmllint not found - skipping XML analysis" >> "${QA_RESULTS}"
fi

# Run visual QA using headless screenshot if available
SCREENSHOT_SCRIPT="${SCRIPT_DIR}/shogun_dashboard_capture.sh"
if [ -f "${SCREENSHOT_SCRIPT}" ] && [ -f "${OUTPUT_DIR}/AZURE_ARCHITECTURE_PRO.png" ]; then
    echo -e "${BLUE}Running visual QA with headless screenshot...${RESET}"
    echo "Running visual QA with headless screenshot..." >> "${QA_RESULTS}"
    
    # Generate a simple HTML file to display the diagram
    HTML_PAGE="${OUTPUT_DIR}/diagram_preview.html"
    cat > "${HTML_PAGE}" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>Architecture Diagram Preview</title>
    <style>
        body { font-family: Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 20px; }
        .diagram-container { max-width: 100%; text-align: center; }
        img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        h1 { color: #0078D4; }
    </style>
</head>
<body>
    <h1>Architecture Diagram Preview</h1>
    <div class="diagram-container">
        <img src="AZURE_ARCHITECTURE_PRO.png" alt="Azure Architecture Diagram">
    </div>
</body>
</html>
EOL
    
    # Take screenshot of the rendered diagram
    DIAGRAM_SCREENSHOT="${OUTPUT_DIR}/diagram_render_check.png"
    chmod +x "${SCREENSHOT_SCRIPT}"
    "${SCREENSHOT_SCRIPT}" "file://${HTML_PAGE}" "${DIAGRAM_SCREENSHOT}" && \
        echo -e "${GREEN}✅ Visual render check successful${RESET}" && \
        echo "✅ Visual render check successful: ${DIAGRAM_SCREENSHOT}" >> "${QA_RESULTS}" || \
        echo -e "${RED}❌ Visual render check failed${RESET}" && \
        echo "❌ Visual render check failed" >> "${QA_RESULTS}"
    
    echo -e "${BLUE}Visual QA check completed${RESET}"
    echo "Visual QA check completed" >> "${QA_RESULTS}"
else
    echo -e "${YELLOW}⚠️ Skipping visual QA (screenshot script or PNG export not found)${RESET}"
    echo "⚠️ Skipping visual QA (screenshot script or PNG export not found)" >> "${QA_RESULTS}"
fi

echo -e "${BLUE}----------------------------------------${RESET}"
echo "----------------------------------------" >> "${QA_RESULTS}"
echo -e "${GREEN}QA check complete. Results saved to: ${QA_RESULTS}${RESET}"
echo -e "${GREEN}Exports saved to: ${OUTPUT_DIR}${RESET}"

# README update helper
echo -e "\n${BLUE}To update your README with the new diagram, use:${RESET}"
echo -e "${YELLOW}
![Azure Architecture](docs/images/AZURE_ARCHITECTURE_PRO.png)

*Click for [full-size diagram](docs/images/AZURE_ARCHITECTURE_PRO.png)*
${RESET}"

echo -e "\n${BLUE}For SVG embedding in markdown, use:${RESET}"
echo -e "${YELLOW}
<img src=\"docs/images/AZURE_ARCHITECTURE_PRO.svg\" alt=\"Azure Architecture Diagram\" width=\"800\">
${RESET}"

# Optional manual QA reminders
echo -e "\n${BLUE}Don't forget to manually check:${RESET}"
echo -e "1. Typography consistency (Segoe UI or Roboto font)"
echo -e "2. Proper color-coding for Medallion layers"
echo -e "3. Logical flow of components"
echo -e "4. All components are properly labeled"