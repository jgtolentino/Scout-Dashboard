# TBWA Brand Insights Diagram Integration

This document provides instructions for properly integrating icons and formatting text in the TBWA Brand Insights Flow diagram.

## The Easy Way: Direct XML Integration

The simplest and most reliable approach is to use the pre-generated icon XML cells:

1. Open your diagram file `project_scout_brand_mentions_flow_tbwa.drawio` in Draw.io (https://app.diagrams.net/)
2. Go to Edit → Edit XML... (or press Ctrl+Shift+X)
3. Find the section after the root cells (look for lines like this):
   ```xml
   <mxCell id="WIyWlLk6GJQsqaUBKTNV-0" />
   <mxCell id="WIyWlLk6GJQsqaUBKTNV-1" parent="WIyWlLk6GJQsqaUBKTNV-0" />
   ```
4. Paste ALL the contents from the files `direct_cells/all_cells.xml` and `direct_cells/more_icons.xml` right after those root cell lines
5. Click Apply

Your diagram should now contain properly formatted icons in the correct positions.

## Text Formatting

To fix text alignment in your diagram:

1. Open the diagram in Draw.io
2. Select a text element you want to left-align
3. From the Format panel, select Text → Align Left (or use the text toolbar)
4. Repeat for all text blocks
5. For titles, you may prefer to use center alignment

## Advanced: Using the Python Toolkit

If you need to process many diagrams or create new icons, you can use the Python toolkit:

1. For SVG to inline conversion:
   ```bash
   python3 claude_icon_inline_format.py
   ```

2. For text formatting:
   ```bash
   python3 drawio_text_patcher.py
   ```

3. To add icons to a diagram:
   ```bash
   python3 add_icons_to_diagram.py
   ```

4. To generate new icon cells:
   ```bash
   python3 generate_inline_svg.py
   # or
   python3 generate_more_icons.py
   ```

## Icon Reference

The diagram uses TBWA's visual identity with these specific icons:

- **Bronze Layer**: Raw data, gray/bronze
- **Silver Layer**: Clean data, blue processing
- **Gold Layer**: Insights, gold with black
- **Governance**: System control, black
- **QA/Monitoring**: Red with shield shape
- **Interaction**: Orange with speech bubble

Azure services are represented by their standard Azure icons.

## Troubleshooting

If icons don't appear in your diagram:
1. Verify the parent ID in the XML matches your diagram (usually "WIyWlLk6GJQsqaUBKTNV-1")
2. Check that your text alignment divs use single quotes, not double quotes
3. Try using the direct XML approach instead of the multi-step toolkit