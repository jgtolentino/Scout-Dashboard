# Project Scout Diagram Export & Visual QA Checklist

Use this checklist to manually export and validate the Project Scout architecture diagram.

## 📝 Manual Export Steps

### 1. PNG Export
- [ ] Open `/Users/tbwa/Downloads/Project_Scout_Final_Sanitized.drawio` in draw.io
- [ ] Navigate to: File → Export As → PNG...
- [ ] Set scale to `2x` or `3x` for high resolution
- [ ] Uncheck "Transparent Background"
- [ ] Save as:
  ```
  /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/images/AZURE_ARCHITECTURE_PRO.png
  ```

### 2. SVG Export
- [ ] Navigate to: File → Export As → SVG...
- [ ] Uncheck "Include a copy of my diagram"
- [ ] Save as:
  ```
  /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/images/AZURE_ARCHITECTURE_PRO.svg
  ```

### 3. Thumbnail Export (Optional)
- [ ] Navigate to: File → Export As → PNG...
- [ ] Set width to `800px`
- [ ] Save as:
  ```
  /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/docs/images/AZURE_ARCHITECTURE_THUMBNAIL.png
  ```

## 👁️ Visual QA Checklist

### Icon Fallback Check
- [ ] **Raspberry Pi Icon (Bronze Layer)**
  - [ ] Red rectangle with "Raspberry Pi Edge Device" label
  - [ ] Properly aligned with other Bronze layer components
  - [ ] Text is readable and properly positioned

- [ ] **Streamlit Dashboard Icon (Gold Layer)**
  - [ ] Orange-red rectangle with "Streamlit Dashboard" label
  - [ ] Properly aligned with other Gold layer components
  - [ ] Text is readable and properly positioned

- [ ] **Insights DB Icon (Platinum Layer)**
  - [ ] Consistent style with other Azure components
  - [ ] Proper positioning in the data flow
  - [ ] Text is readable and properly positioned

### Layout & Spacing Check
- [ ] Minimum 20px horizontal spacing between all components
- [ ] Minimum 30px vertical spacing between all components
- [ ] No text overlapping with connectors or other elements
- [ ] No icon overlaps
- [ ] Legend items properly separated and labeled
- [ ] Connectors follow Manhattan routing (90° angles)

### Typography Check
- [ ] Layer titles use 14-16pt font
- [ ] Component labels use 11-12pt font
- [ ] Consistent font family throughout (Segoe UI or Roboto)
- [ ] All text has sufficient background/padding for readability
- [ ] No truncated labels or text overflow

### Color & Visibility Check
- [ ] Bronze layer uses #CD7F32 color
- [ ] Silver layer uses #C0C0C0 color
- [ ] Gold layer uses #FFD700 color
- [ ] Platinum layer uses #FF9F78 color
- [ ] Supporting services section properly color-coded
- [ ] Connector types visually distinguishable

## 🔄 Post-Export Validation

Once the files are exported, run these validation commands from the tools directory:

```bash
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js/juicer-stack/tools

# Generate thumbnails and copies
./generate_thumbnails.sh ../docs/images/AZURE_ARCHITECTURE_PRO.png

# Validate diagram
./diagram_qa_validate.sh ../docs/images/AZURE_ARCHITECTURE_PRO.png
```

## 📋 Export Verification

- [ ] PNG exported successfully at high resolution
- [ ] SVG exported successfully as vector graphic
- [ ] Thumbnail generated (optional)
- [ ] All exports are accessible in the docs/images directory
- [ ] QA validation passes with no critical errors
- [ ] Documentation references updated to point to new files

## 📝 Notes

Use this area to document any issues or observations during the export process:

```
(Your notes here)
```

---

When completed, this checklist can be saved to document the QA process for future reference.