#!/usr/bin/env python3
"""
Generate additional inline SVG icons for Draw.io diagrams
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
            "id": "icon_guardrails",
            "svg": "assets/icons/guardrails_icon.svg",
            "x": 780,
            "y": 460,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_system",
            "svg": "assets/icons/system_icon.svg",
            "x": 330,
            "y": 220,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_interaction",
            "svg": "assets/icons/interaction_icon.svg",
            "x": 500,
            "y": 580,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_azure_ml",
            "svg": "assets/icons/machine-learning-service.svg",
            "x": 180,
            "y": 370,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_azure_sql",
            "svg": "assets/icons/synapse-analytics.svg",
            "x": 180,
            "y": 570,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_raspberry_pi",
            "svg": "assets/icons/raspberry-pi.svg",
            "x": 140,
            "y": 80,
            "width": 32,
            "height": 32
        },
        {
            "id": "icon_key_vault",
            "svg": "assets/icons/key-vault.svg",
            "x": 770,
            "y": 240,
            "width": 32,
            "height": 32
        }
    ]
    
    # Generate each cell
    with open('direct_cells/more_icons.xml', 'w') as f:
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
                print(f"Generated cell: {cell['id']}")
                
            except Exception as e:
                print(f"Error generating cell {cell['id']}: {e}")
    
    print(f"\nAdditional icons saved to: direct_cells/more_icons.xml")
    print("\nTo use these cells, copy the XML directly into your Draw.io file's XML source.")

if __name__ == "__main__":
    main()