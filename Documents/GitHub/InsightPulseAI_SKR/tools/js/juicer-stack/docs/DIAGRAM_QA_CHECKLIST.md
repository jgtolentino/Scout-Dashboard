# Architecture Diagram QA Checklist

This document provides a comprehensive QA checklist for creating professional-grade architecture diagrams, with specific focus on Azure-based Medallion architecture visuals like those used in Project Scout.

## ✅ Diagram QA Layer for Production-Ready Visuals

### 1. 🔠 Typography & Text Standards

- [ ] Use **consistent font** across all elements (Segoe UI or Roboto recommended)
- [ ] Apply **standard font sizes**:
  - [ ] Titles: 16–18 pt
  - [ ] Labels: 11–12 pt
  - [ ] Notes: 10 pt (muted gray or italic)
- [ ] **Center-align** text within icons or shape containers
- [ ] No **text overflow** — adjust shape size if content wraps
- [ ] Capitalize consistently (e.g., "Azure Data Lake," not "azure datalake")

### 2. 📐 Spacing & Layout Precision

- [ ] Align all icons **on a baseline grid** (e.g., 50px vertical intervals)
- [ ] Use **equal padding/margins** between layers (Bronze → Silver → Gold → Platinum)
- [ ] Avoid overlap — no icon should touch or bleed into another
- [ ] Center **flow arrows** precisely between source/target elements
- [ ] Maintain consistent spacing between parallel components

### 3. 🎨 Visual Consistency

- [ ] Use **official Azure icons** only — always from [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)
- [ ] Maintain consistent icon size (recommended 48x48 or 64x64 px)
- [ ] Apply **Azure color palette**:
  - [ ] Blue for Azure services
  - [ ] Orange for GenAI / dashboards
  - [ ] Gray for supporting infrastructure
  - [ ] Medallion tiers color-coded consistently:
    - [ ] Bronze: `#CD7F32` or `#B08D57`
    - [ ] Silver: `#C0C0C0` or `#A8A9AD` 
    - [ ] Gold: `#FFD700` or `#D4AF37`
    - [ ] Platinum: `#FF9F78` or `#E5E4E2`
- [ ] Remove unnecessary background shadings unless used to group logically
- [ ] Apply consistent line styles and thicknesses for connections

### 4. 🧩 Structural & Logical Integrity

- [ ] Medallion tiers should always flow: `Edge → Bronze → Silver → Gold → Platinum`
- [ ] GenAI Insights must clearly show:
  - [ ] **Input** from Gold Layer
  - [ ] **Output** to Dashboards and Insights DB
- [ ] Ensure every component is **labeled** (no floating icons)
- [ ] Verify data flow direction is shown clearly with arrows
- [ ] Confirm no orphaned components (all connected to the architecture)

### 5. 📷 Export & Snapshot QA

- [ ] Export PNG at **2x resolution** (minimum 1600x900) for clarity
- [ ] Export **SVG** for embedding into markdown or websites
- [ ] Run headless screenshot check post-deployment to ensure:
  - [ ] Render accuracy
  - [ ] Asset integrity (no broken icons)
  - [ ] Responsive layout holds in browser
- [ ] Verify image loads correctly in project README/documentation

## 📁 File Output Standards

- [ ] Save high-resolution PNG: `/docs/images/AZURE_ARCHITECTURE_PRO.png`
- [ ] Export SVG for markdown embedding: `/docs/images/AZURE_ARCHITECTURE_PRO.svg`
- [ ] Create thumbnail version: `/docs/images/AZURE_ARCHITECTURE_THUMBNAIL.png`
- [ ] Store editable source file: `/docs/architecture_src/architecture.drawio`
- [ ] Include versioned copies in `/docs/images/archive/` folder

## 👁️ Automation Support

### Manual Validation Script

```bash
#!/bin/bash
# diagram_qa_validate.sh - Basic validation for draw.io diagrams

DIAGRAM_PATH="$1"
OUTPUT_DIR="${2:-./output}"
QA_RESULTS="${OUTPUT_DIR}/qa_results.txt"

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Initialize results file
echo "Diagram QA Results for: ${DIAGRAM_PATH}" > "${QA_RESULTS}"
echo "Date: $(date)" >> "${QA_RESULTS}"
echo "----------------------------------------" >> "${QA_RESULTS}"

# Check if drawio CLI is available
if command -v draw.io &> /dev/null; then
    echo "✅ draw.io CLI detected" >> "${QA_RESULTS}"
else
    echo "❌ draw.io CLI not found - install for full validation" >> "${QA_RESULTS}"
fi

# Check file exists
if [ -f "${DIAGRAM_PATH}" ]; then
    echo "✅ Diagram file exists" >> "${QA_RESULTS}"
    
    # Check file size (basic proxy for complexity/resolution)
    FILE_SIZE=$(du -h "${DIAGRAM_PATH}" | cut -f1)
    echo "ℹ️ Diagram file size: ${FILE_SIZE}" >> "${QA_RESULTS}"
    
    # Generate exports
    if command -v draw.io &> /dev/null; then
        echo "Generating exports..." >> "${QA_RESULTS}"
        
        # Generate PNG export
        draw.io -x -f png -o "${OUTPUT_DIR}/architecture.png" "${DIAGRAM_PATH}" && \
            echo "✅ PNG export successful" >> "${QA_RESULTS}" || \
            echo "❌ PNG export failed" >> "${QA_RESULTS}"
        
        # Generate SVG export
        draw.io -x -f svg -o "${OUTPUT_DIR}/architecture.svg" "${DIAGRAM_PATH}" && \
            echo "✅ SVG export successful" >> "${QA_RESULTS}" || \
            echo "❌ SVG export failed" >> "${QA_RESULTS}"
        
        # Check PNG dimensions
        if command -v identify &> /dev/null; then
            PNG_DIMS=$(identify -format "%wx%h" "${OUTPUT_DIR}/architecture.png")
            echo "ℹ️ PNG dimensions: ${PNG_DIMS}" >> "${QA_RESULTS}"
            
            # Check if dimensions meet minimum requirements
            PNG_WIDTH=$(echo ${PNG_DIMS} | cut -d'x' -f1)
            if [ ${PNG_WIDTH} -ge 1600 ]; then
                echo "✅ PNG resolution meets minimum width (1600px)" >> "${QA_RESULTS}"
            else
                echo "❌ PNG resolution below minimum width (1600px)" >> "${QA_RESULTS}"
            fi
        fi
    fi
else
    echo "❌ Diagram file not found at: ${DIAGRAM_PATH}" >> "${QA_RESULTS}"
fi

# Basic XML parsing to check for common issues
if command -v xmllint &> /dev/null; then
    # Count number of text elements
    TEXT_COUNT=$(xmllint --xpath "count(//text)" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo "ℹ️ Text elements count: ${TEXT_COUNT}" >> "${QA_RESULTS}"
    
    # Count number of shapes
    SHAPE_COUNT=$(xmllint --xpath "count(//mxCell[@vertex='1'])" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo "ℹ️ Shape elements count: ${SHAPE_COUNT}" >> "${QA_RESULTS}"
    
    # Count number of connections
    CONN_COUNT=$(xmllint --xpath "count(//mxCell[@edge='1'])" "${DIAGRAM_PATH}" 2>/dev/null || echo "0")
    echo "ℹ️ Connection elements count: ${CONN_COUNT}" >> "${QA_RESULTS}"
    
    # Basic test - every shape should have a label
    if [ "${TEXT_COUNT}" -lt "${SHAPE_COUNT}" ]; then
        echo "⚠️ Possible unlabeled shapes detected (more shapes than text elements)" >> "${QA_RESULTS}"
    fi
fi

echo "----------------------------------------" >> "${QA_RESULTS}"
echo "QA check complete. See results in: ${QA_RESULTS}"
echo "Exports saved to: ${OUTPUT_DIR}"
```

### GitHub Actions Integration

Create a `.github/workflows/diagram-qa.yml` file with:

```yaml
name: Architecture Diagram QA

on:
  push:
    paths:
      - '**/*.drawio'
      - 'docs/architecture_src/**'
  pull_request:
    paths:
      - '**/*.drawio'
      - 'docs/architecture_src/**'
  workflow_dispatch:

jobs:
  diagram-qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install draw.io CLI
        run: |
          wget https://github.com/jgraph/drawio-desktop/releases/download/v21.1.2/drawio-amd64-21.1.2.deb
          sudo dpkg -i drawio-amd64-21.1.2.deb
          
      - name: Install validation tools
        run: |
          sudo apt-get update
          sudo apt-get install -y libxml2-utils imagemagick
        
      - name: Create output directories
        run: |
          mkdir -p ./docs/images
          mkdir -p ./docs/images/archive
          
      - name: Run diagram validation
        run: |
          chmod +x ./tools/js/juicer-stack/tools/diagram_qa_validate.sh
          ./tools/js/juicer-stack/tools/diagram_qa_validate.sh ./docs/architecture_src/architecture.drawio ./docs/images
          
      - name: Archive results
        uses: actions/upload-artifact@v3
        with:
          name: diagram-qa-results
          path: |
            ./docs/images/qa_results.txt
            ./docs/images/architecture.png
            ./docs/images/architecture.svg
```

## 🔄 Recommended Workflow

1. Create initial diagram with draw.io
2. Run the QA checklist before finalizing
3. Use automation scripts to validate and export
4. Commit both source (.drawio) and exports (.png, .svg)
5. Update documentation links to reference new diagram

## 🛠️ Tools & Resources

- **Draw.io Desktop**: https://github.com/jgraph/drawio-desktop/releases
- **Azure Architecture Icons**: https://learn.microsoft.com/en-us/azure/architecture/icons/
- **Headless Screenshot**: Use tools/js/juicer-stack/tools/shogun_dashboard_capture.sh
- **Color Palette Reference**: 
  ```
  Azure Blue: #0078D4
  Azure Dark Blue: #004578
  Azure Light Blue: #83BFEA
  GenAI Orange: #FF8C00
  Dashboard Orange: #FF6347
  ```

## 📝 Notes for Medallion Architecture

For Medallion architecture diagrams specifically:

1. Always show data flow direction clearly from Edge → Bronze → Silver → Gold → Platinum
2. Use specific color coding for each layer (bronze, silver, gold, platinum)
3. Include data storage components at each layer
4. Show transformations between layers
5. For GenAI insights, clearly illustrate:
   - LLM Integration
   - Insights generation process
   - Storage of results
   - Visualization components

## ✨ Final Checklist Before Release

- [ ] Architecture accurately represents current implementation
- [ ] All components are labeled clearly
- [ ] Data flow is indicated with properly directed arrows
- [ ] Visual hierarchy helps understand the system at a glance
- [ ] Design is consistent with other project documentation
- [ ] Exports are high quality and properly placed in documentation
- [ ] Diagram has been reviewed by at least one other team member