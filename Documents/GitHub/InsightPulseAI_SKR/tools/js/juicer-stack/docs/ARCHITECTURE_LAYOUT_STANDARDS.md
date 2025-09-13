# 📐 Architecture Diagram Layout Standards

This document provides specific guidelines for addressing layout issues in architecture diagrams, with particular focus on preventing overlapping elements and optimizing connector lines.

## ⚠️ Common Layout Issues to Avoid

![Project Scout Architecture](images/AZURE_ARCHITECTURE_PRO.png)

*Reference diagram showing proper spacing and connections*

## 📋 Label Placement Standards

### ✅ Best Practices for Labels

1. **Component Labels**
   - Place labels **within** components when possible
   - Use consistent font size (11-12pt)
   - Ensure high contrast (dark text on light backgrounds, light text on dark backgrounds)
   - Keep labels concise (2-3 words maximum)

2. **Connector Labels**
   - Place small labels **adjacent to** arrows, not directly on top
   - Use lighter/italicized font to distinguish from component labels
   - Consider adding small background color to improve readability
   - Position connector labels to avoid crossing other connectors

3. **Layer Labels**
   - Place layer names at the **top** of each layer section
   - Use larger font (14-16pt) and layer-specific colors
   - Include brief description (optional) beneath the layer name

### ❌ Common Label and Icon Overlap Problems

| Problem | Solution |
|---------|----------|
| **Label-Connector Overlaps** | Adjust label position or add small padding/background |
| **Text-Icon Overlaps** | Place text below icon with adequate spacing (10px minimum) |
| **Text extending beyond component boundaries** | Reduce text length or adjust component size |
| **Inconsistent label placement** | Standardize placement (e.g., all labels centered) |
| **Icon-Icon Overlaps** | Maintain minimum spacing between icons (20px horizontally, 30px vertically) |
| **Low contrast text** | Ensure proper contrast ratios (4.5:1 minimum) |
| **Too many labels in a small area** | Consolidate components or use a legend |
| **Crowded icon clusters** | Group related icons and provide ample group spacing |

## 🔄 Connector Line Standards 

### ✅ Best Practices for Connectors

1. **Arrow Types**
   - Use **solid arrows** for direct data flows
   - Use **dashed arrows** for logical/optional connections
   - Use **thicker lines** for primary data flows
   - Use **thinner lines** for secondary/reference connections

2. **Connector Routing**
   - Route lines with **90-degree angles** (Manhattan routing)
   - Maintain **consistent spacing** between parallel connectors
   - Avoid crossing connectors where possible
   - Use waypoints to guide complex paths

3. **Connector Colors**
   - Use **neutral colors** (gray, black) for standard connections
   - Use **specific colors** to highlight special flows or operations
   - Maintain consistent color usage across the diagram
   - Consider using layer-specific connector colors

### ❌ Common Connector Problems to Fix

| Problem | Solution |
|---------|----------|
| Overlapping connector lines | Re-route using waypoints or adjust component positions |
| Diagonal lines across long distances | Use Manhattan routing (horizontal/vertical segments) |
| Crossing through components | Re-route around components |
| Inconsistent arrow directions | Standardize direction (usually left-to-right or top-to-bottom) |
| Too many connectors in one area | Reorganize components or consider grouping related elements |

## 🖼️ Icon Spacing and Positioning

### ✅ Best Practices for Icon Layout

1. **Consistent Icon Sizing**
   - Use **uniform icon dimensions** (64×64px recommended)
   - Scale proportionally when necessary
   - Maintain aspect ratio for all icons
   - Apply consistent border and padding settings

2. **Icon-to-Icon Spacing**
   - Maintain **minimum horizontal spacing** of 20px between icons
   - Use **minimum vertical spacing** of 30px between icon rows
   - Increase spacing between unrelated icon groups
   - Align icons to a grid for visual consistency

3. **Icon-to-Text Relationships**
   - Place text **below or to the right** of icons (never overlay text on icons)
   - Maintain consistent text position for all icons
   - Use 10px minimum spacing between icon and text
   - Group icon+text pairs as single logical components

4. **Visual Icon Hierarchies**
   - Size icons according to their importance
   - Place primary service icons more prominently
   - Create visual groups for related services
   - Use less prominent styling for auxiliary components

### ❌ Common Icon Problems to Fix

| Problem | Solution |
|---------|----------|
| **Inconsistent icon sizes** | Standardize all icons to same dimensions |
| **Icon-icon overlaps** | Increase spacing or reorganize layout |
| **Icon-text overlaps** | Move text below or beside icon with adequate spacing |
| **Misaligned icons** | Use grid alignment and snap-to-grid |
| **Inconsistent styling** | Apply consistent borders, colors, and effects |
| **Poor icon distribution** | Reorganize to create balanced layout with proper whitespace |
| **Oversized icons dominating diagram** | Scale important icons up by max 25%, not more |
| **Tiny, hard-to-see icons** | Ensure minimum icon size of 32×32px |

## 🧩 Component Spacing and Alignment

### ✅ Best Practices for Spacing

1. **Within Layers**
   - Maintain **consistent horizontal spacing** between components (20-30px)
   - Align components to an invisible grid
   - Group related components closer together
   - Provide clear separation between different functional groups

2. **Between Layers**
   - Use **generous vertical spacing** between layers (50-60px minimum)
   - Include distinct visual boundaries (backgrounds or lines)
   - Maintain consistent layer heights where possible
   - Order layers logically (e.g., Bronze → Silver → Gold → Platinum)

3. **Component Sizing**
   - Size components based on **relative importance**
   - Use **consistent sizes** for similar components
   - Avoid making any component too dominant unless warranted
   - Ensure adequate space for labels within components

## 🔍 QA Verification Techniques

1. **Scan Technique**
   - View the diagram at 50% zoom to spot alignment issues
   - Check horizontal alignment with a straight edge or grid
   - View at full zoom to verify label readability
   - Print in grayscale to test contrast issues

2. **Systematic Checks**
   - Verify each connector has a clear source and destination
   - Check all labels are fully visible and not truncated
   - Ensure consistent spacing between all similar elements
   - Verify that overlapping elements are intentional (rare cases only)

## 🔧 Fixing Layout Issues in draw.io

1. **For Overlapping Labels**
   - Use **Edit Style** to add padding/background to labels
   - Adjust label position with **Text Position** option
   - Use **Text Opacity** to make crossed labels more visible
   - Consider using **Autosize** for components to fit labels

2. **For Connector Problems**
   - Use **Waypoints** to add routing points to connectors
   - Enable **Connection Points** for precise connection locations
   - Use **Styles** to differentiate connector types
   - Try **Orthogonal Routing** or **Entity Relation** connector styles

3. **For Alignment Issues**
   - Enable **Grid** and **Snap to Grid** options
   - Use **Arrange** tools for consistent spacing
   - Apply **Align** functions to multiple selected components
   - Use **Distribute** to ensure even spacing

## 📚 References

- [QA_CHECKLIST_PROJECT_SCOUT.md](QA_CHECKLIST_PROJECT_SCOUT.md) - Complete QA guidelines
- [ICON_FALLBACK_POLICY.md](ICON_FALLBACK_POLICY.md) - Icon substitution standards
- [ARCHITECTURE_ICON_HANDLING.md](ARCHITECTURE_ICON_HANDLING.md) - General icon conventions
- [ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md](ARCHITECTURE_DIAGRAM_STYLE_GUIDE.md) - Diagram style standards