# Diagram Icon Integration: Special Note

When working with Draw.io and inline SVG icons, there are two approaches that work consistently:

## 1. Direct XML Approach (Recommended)

This approach generates the complete XML elements with properly encoded SVG data that can be directly pasted into the diagram XML:

```python
# Run this to generate ready-to-use cells with inline SVG:
python3 generate_inline_svg.py
```

This will create a `direct_cells` directory with individual XML files for each cell and a combined file. You can then:

1. Open your diagram in Draw.io
2. Select Edit -> Edit XML... (or Ctrl+Shift+X)
3. Locate where you want to insert icons (usually right after the root cells)
4. Paste the XML content from `direct_cells/all_cells.xml`
5. Click Apply

## 2. Multi-step Toolkit Approach

The multi-step approach uses the toolkit scripts to:
1. Convert SVGs to inline format
2. Patch text content
3. Add icons to specified cells

This works well for simpler diagrams but may encounter encoding issues with complex SVGs.

## Icon Format Reference

The proper format for inline SVG in Draw.io is:

```xml
<mxCell id="icon_id" value="" style="html=1;image;image=data:image/svg+xml,%3C...encoded svg...%3E;fontSize=12;" vertex="1" parent="WIyWlLk6GJQsqaUBKTNV-1">
  <mxGeometry x="100" y="180" width="32" height="32" as="geometry" />
</mxCell>
```

The key is ensuring the SVG is properly URL-encoded and the parent ID matches your diagram's structure.