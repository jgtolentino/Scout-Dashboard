#!/usr/bin/env python3
"""
Generate directly usable inline SVG for Draw.io diagrams
"""

import os
import urllib.parse
import re

def clean_svg(svg_content):
    """Clean SVG content for inline use"""
    # Replace double quotes with single quotes
    svg_content = svg_content.replace('"', "'")
    
    # Remove newlines and extra spaces
    svg_content = re.sub(r'\s+', ' ', svg_content)
    
    # Trim whitespace
    svg_content = svg_content.strip()
    
    return svg_content

def generate_inline_svg(svg_file):
    """Generate inline SVG format for Draw.io"""
    with open(svg_file, 'r') as f:
        svg_content = f.read()
    
    # Clean the SVG content
    svg_content = clean_svg(svg_content)
    
    # URL encode the SVG content
    encoded_svg = urllib.parse.quote(svg_content)
    
    # Format as inline SVG for Draw.io
    inline_svg = f"data:image/svg+xml,{encoded_svg}"
    
    return inline_svg

def generate_direct_cell(cell_id, svg_file, x, y, width=32, height=32):
    """Generate a direct mxCell with inline SVG that can be copied into a Draw.io file"""
    # Get the inline SVG
    inline_svg = generate_inline_svg(svg_file)
    
    # Create the cell XML
    cell_xml = f'''<mxCell id="{cell_id}" value="" style="html=1;image;image={inline_svg};fontSize=12;fontColor=#FFFFFF;" vertex="1" parent="WIyWlLk6GJQsqaUBKTNV-1">
  <mxGeometry x="{x}" y="{y}" width="{width}" height="{height}" as="geometry" />
</mxCell>'''
    
    return cell_xml

def main():
    # Create output directory
    os.makedirs('direct_cells', exist_ok=True)
    
    # Configuration of cells to generate
    cells = [
        {
            "id": "icon_bronze_layer",
            "svg": "assets/icons/bronze_icon.svg",
            "x": 90,
            "y": 180,
            "width": 40,
            "height": 40
        },
        {
            "id": "icon_silver_layer",
            "svg": "assets/icons/silver_icon.svg",
            "x": 90,
            "y": 320,
            "width": 40,
            "height": 40
        },
        {
            "id": "icon_gold_layer",
            "svg": "assets/icons/gold_icon.svg",
            "x": 90,
            "y": 540,
            "width": 40,
            "height": 40
        },
        {
            "id": "icon_event_hub",
            "svg": "assets/icons/event-hubs.svg",
            "x": 320,
            "y": 220,
            "width": 32,
            "height": 32
        }
    ]
    
    # Generate each cell
    for cell in cells:
        try:
            cell_xml = generate_direct_cell(
                cell["id"],
                cell["svg"],
                cell["x"],
                cell["y"],
                cell.get("width", 32),
                cell.get("height", 32)
            )
            
            # Save to file
            output_file = f"direct_cells/{cell['id']}.xml"
            with open(output_file, 'w') as f:
                f.write(cell_xml)
            
            print(f"Generated cell: {cell['id']} -> {output_file}")
            
        except Exception as e:
            print(f"Error generating cell {cell['id']}: {e}")
    
    # Also provide all cells in a single file
    all_cells_file = "direct_cells/all_cells.xml"
    with open(all_cells_file, 'w') as f:
        for cell in cells:
            try:
                cell_xml = generate_direct_cell(
                    cell["id"],
                    cell["svg"],
                    cell["x"],
                    cell["y"],
                    cell.get("width", 32),
                    cell.get("height", 32)
                )
                f.write(cell_xml + "\n\n")
            except Exception as e:
                print(f"Error adding cell {cell['id']} to combined file: {e}")
    
    print(f"\nAll cells also saved to: {all_cells_file}")
    print("\nTo use these cells, copy the XML directly into your Draw.io file's XML source.")

if __name__ == "__main__":
    main()