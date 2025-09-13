#!/usr/bin/env python3
"""
Embeds SVG icons into Draw.io (diagrams.net) diagrams.

This script:
1. Reads a Draw.io XML file
2. Finds image placeholders for icons
3. Replaces them with inline SVG data in Draw.io format
4. Saves the updated diagram
"""

import os
import re
import argparse
from xml.etree import ElementTree as ET

def load_inline_svg_icons(icons_dir):
    """Load all inline SVG icons from the specified directory"""
    icons = {}
    for filename in os.listdir(icons_dir):
        if filename.endswith('.txt'):
            icon_name = os.path.splitext(filename)[0]
            # Remove .svg if present in the filename (from original conversion)
            icon_name = icon_name.replace('.svg', '')
            
            with open(os.path.join(icons_dir, filename), 'r') as f:
                icon_data = f.read().strip()
                icons[icon_name] = icon_data
    
    print(f"Loaded {len(icons)} inline SVG icons")
    return icons

def embed_icons_in_drawio(input_file, icons, output_file):
    """Embed SVG icons into a Draw.io diagram"""
    # Read the file as text to preserve the format
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Count of replacements
    replaced = 0
    
    # Find all image cells that need icon replacement
    # Pattern targets mxCell elements with placeholder image styles
    image_pattern = r'<mxCell[^>]*style="[^"]*image;[^"]*imageRef=([^";]*)[^>]*" [^>]*>'
    
    # Process each match
    for match in re.finditer(image_pattern, content):
        full_match = match.group(0)
        icon_ref = match.group(1)
        
        # Check if we have this icon
        if icon_ref in icons:
            # Create new cell with embedded icon
            new_cell = full_match.replace(f'imageRef={icon_ref}', f'image={icons[icon_ref]}')
            content = content.replace(full_match, new_cell)
            replaced += 1
            print(f"Replaced icon: {icon_ref}")
        else:
            print(f"Warning: Icon not found: {icon_ref}")
    
    # Write updated content
    with open(output_file, 'w') as f:
        f.write(content)
    
    print(f"Replaced {replaced} icons in diagram")
    print(f"Updated diagram saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Embed SVG icons into Draw.io diagrams')
    parser.add_argument('--input', required=True, help='Input Draw.io file')
    parser.add_argument('--icons', required=True, help='Directory containing inline SVG icon data')
    parser.add_argument('--output', required=True, help='Output Draw.io file with embedded icons')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        return
    
    if not os.path.isdir(args.icons):
        print(f"Error: Icons directory not found: {args.icons}")
        return
    
    # Load icons
    icons = load_inline_svg_icons(args.icons)
    
    # Process the diagram
    embed_icons_in_drawio(args.input, icons, args.output)

if __name__ == "__main__":
    main()