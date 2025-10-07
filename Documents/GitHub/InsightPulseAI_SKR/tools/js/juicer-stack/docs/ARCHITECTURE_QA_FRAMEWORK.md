# Architecture Diagram QA Framework

This document outlines a comprehensive framework for troubleshooting, validating, and ensuring high-quality architecture diagrams, with specific focus on draw.io diagrams for the Project Scout architecture.

![Project Scout Architecture](images/AZURE_ARCHITECTURE_PRO.png)

*This reference diagram must pass all QA checks before being used in documentation*

## 1. 🛠 Troubleshooting Fix Matrix

| Issue | Fix Applied | Checklist Item | Status |
|-------|-------------|----------------|--------|
| ❌ `Namespace prefix qa for custom-icon` error | Removed invalid `qa:` prefix from `mxCell` elements | ✅ `Diagram XML uses only standard namespaces` | ✅ Fixed |
| ❌ Placeholder icons rendering as broken | Replaced with colored rectangles (e.g., Raspberry Pi = red box) | ✅ `Fallback icons must be rectangular and labeled` | ✅ Fixed |
| ❌ Diagram export fails in CI | Manual export via Draw.io (PNG, SVG) with 2x resolution | ✅ `All diagrams must be manually exported if CLI fails` | ✅ Fixed |
| ❌ Icon-text overlaps | QA spacing policy applied (≥20px horizontal, ≥30px vertical) | ✅ `No icon-to-text overlap under QA spacing policy` | ✅ Fixed |
| ❌ Inconsistent sizing | Icons resized to 64×64px | ✅ `All icons 64×64 unless exception documented` | ✅ Fixed |

## 2. 📋 QA Checklist (Auto + Manual)

### XML Integrity
- [ ] No invalid namespaces or unrecognized tags
- [ ] No namespace prefixes on attributes (e.g., `qa:`, `ci:`)
- [ ] All XML elements properly closed
- [ ] No XML parsing errors when opened in draw.io

### Fallback Icon Handling
- [ ] Boxes used for missing icons with clear labels
- [ ] Raspberry Pi represented as red rectangle with label
- [ ] Dashboard represented as orange-red rectangle with "Streamlit Dashboard" label
- [ ] Fallback colors consistent with style guide
- [ ] All fallback icons properly documented in `MISSING_AZURE_ICONS.md`

### Spacing and Layout
- [ ] Minimum 20px horizontal spacing between components
- [ ] Minimum 30px vertical spacing between components
- [ ] No text overlapping with connectors
- [ ] No icon-to-icon overlaps
- [ ] No icon-to-text overlaps
- [ ] Legend items properly spaced and aligned

### Styling and Consistency
- [ ] All icons sized consistently (64×64px standard)
- [ ] Layer titles use 14pt font
- [ ] Regular labels use 12pt font
- [ ] Consistent font family throughout (Segoe UI or Roboto)
- [ ] Layer boundaries clearly visible with color-coding
- [ ] Connectors follow Manhattan routing (90° angles)

### Export Quality
- [ ] PNG exported at 2x scale for high resolution
- [ ] SVG exported for vector-based usage
- [ ] Thumbnail (800px width) created for documentation
- [ ] All exports match the current version of the diagram
- [ ] No visual artifacts or rendering issues in exports

## 3. 🧰 QA Toolset

### Automated Validation Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `sanitize_drawio_xml.js` | Remove invalid namespace prefixes | `node sanitize_drawio_xml.js [input-path] [output-path]` |
| `check_diagram_overlaps.js` | Check for spacing and overlap issues | `node check_diagram_overlaps.js [diagram-path]` |
| `diagram_qa.js` | Comprehensive diagram QA | `node diagram_qa.js [diagram-path] [output-dir]` |
| `diagram_qa_validate.sh` | Bash-based diagram validation | `./diagram_qa_validate.sh [diagram-path]` |

### Manual QA Process

1. **Preparation**:
   - Open the diagram in draw.io
   - Run `sanitize_drawio_xml.js` if XML issues are suspected
   - Save as a new version with a clear naming convention

2. **Validation**:
   - Run `check_diagram_overlaps.js` to identify spacing issues
   - Fix any reported overlaps or spacing problems in draw.io
   - Run `diagram_qa.js` for a comprehensive QA report

3. **Export**:
   - Use `export_diagram.sh` as a guide for manual export
   - Export PNG with 2x resolution
   - Export SVG for vector usage
   - Create a thumbnail if needed

4. **Documentation**:
   - Update README_FINAL.md with new diagram link
   - Update QA_CHECKLIST_PROJECT_SCOUT.md with new diagram
   - Update ICON_FALLBACK_POLICY.md if new fallbacks were added

## 4. 🔄 QA Workflow Integration

### CI/CD Integration

```yaml
- name: Validate Architecture Diagram
  run: |
    chmod +x ./tools/js/juicer-stack/tools/diagram_qa_validate.sh
    ./tools/js/juicer-stack/tools/diagram_qa_validate.sh ./docs/architecture_src/Project_Scout_Final.drawio

- name: Generate QA Report
  run: |
    node ./tools/js/juicer-stack/tools/diagram_qa.js ./docs/architecture_src/Project_Scout_Final.drawio ./docs/images

- name: Check for Layout Issues
  run: |
    node ./tools/js/juicer-stack/tools/check_diagram_overlaps.js ./docs/architecture_src/Project_Scout_Final.drawio
```

### Pull Request Validation

1. Run the QA tools on any PR that modifies architecture diagrams
2. Add QA results as PR comments
3. Require passing QA checks before merging
4. Include screenshot comparisons for visual validation

## 5. 📚 Architecture Diagram Standards

For detailed standards and guidelines, refer to:

- [QA_CHECKLIST_PROJECT_SCOUT.md](QA_CHECKLIST_PROJECT_SCOUT.md) - Complete QA guidelines
- [ICON_FALLBACK_POLICY.md](ICON_FALLBACK_POLICY.md) - Icon substitution standards
- [ARCHITECTURE_ICON_HANDLING.md](ARCHITECTURE_ICON_HANDLING.md) - General icon conventions
- [ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md](ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md) - Diagram style standards
- [ARCHITECTURE_LAYOUT_STANDARDS.md](ARCHITECTURE_LAYOUT_STANDARDS.md) - Layout and connector guidelines

## 6. 🔍 Troubleshooting Common Issues

### XML Namespace Errors

**Problem**: Error messages like "Namespace prefix qa for custom-icon on mxCell is not defined"

**Solution**:
```bash
# Run the sanitization script
node /tools/js/juicer-stack/tools/sanitize_drawio_xml.js input.drawio output.drawio
```

### Layout and Spacing Issues

**Problem**: Overlapping elements or inconsistent spacing

**Solution**:
```bash
# Identify specific overlap issues
node /tools/js/juicer-stack/tools/check_diagram_overlaps.js diagram.drawio

# Fix issues manually in draw.io:
# 1. Use Arrange > Align/Distribute tools
# 2. Enable snap to grid (View > Grid)
# 3. Use padding in text elements
```

### Export Quality Issues

**Problem**: Blurry or low-quality exports

**Solution**:
```bash
# Use the export helper script for guidance
./tools/js/juicer-stack/tools/export_diagram.sh

# Manual export steps:
# 1. File > Export as > PNG... with scale 2x
# 2. File > Export as > SVG... for vector quality
```

### Icon Fallback Issues

**Problem**: Missing or broken icons

**Solution**:
1. Check `ICON_FALLBACK_POLICY.md` for approved fallbacks
2. Replace with appropriate colored rectangle
3. Add proper label to the fallback
4. Document in `MISSING_AZURE_ICONS.md`

## 7. 📆 QA Maintenance Schedule

- **Daily**: Run automated QA on any modified diagrams
- **Weekly**: Full QA audit of all architecture diagrams
- **Monthly**: Review and update QA tools and standards
- **Quarterly**: Comprehensive review of fallback icons for official replacements