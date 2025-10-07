#!/usr/bin/env python3
"""
Add icons to Draw.io diagram based on a mapping configuration
"""

import os
import yaml
import re
from uuid import uuid4

def load_yaml_config(config_path):
    """Load icon mapping configuration from YAML file"""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

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

def add_icons_to_diagram(input_file, config, icons, output_file):
    """Add icons to cells based on mapping config"""
    # Read the file as text
    with open(input_file, "r") as f:
        content = f.read()
    
    # Get root model node position
    root_match = re.search(r'<root>\s*<mxCell id="[^"]+" />\s*<mxCell id="[^"]+" parent="[^"]+" />', content)
    if not root_match:
        print("Error: Could not find root cells in diagram")
        return
    
    root_end_pos = root_match.end()
    
    # Default icon properties
    defaults = config["icon_mapping"]["defaults"]
    
    # Add each icon as a new cell
    added_cells = []
    
    for cell_map in config["icon_mapping"]["cells"]:
        cell_id = cell_map["id"]
        icon_name = cell_map["icon"]
        
        # Skip if we don't have this icon
        if icon_name not in icons:
            print(f"Warning: Icon not found: {icon_name}")
            continue
            
        # Find the target cell to get its geometry
        cell_match = re.search(rf'<mxCell\s+id="{cell_id}"[^>]*>', content)
        if not cell_match:
            print(f"Warning: Cell with ID '{cell_id}' not found")
            continue
            
        # Check if cell has geometry
        geo_match = re.search(rf'<mxGeometry[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>', 
                             content[cell_match.start():cell_match.start() + 500])
        
        if not geo_match:
            print(f"Warning: Cell '{cell_id}' has no geometry")
            continue
            
        # Get cell geometry
        x = float(geo_match.group(1))
        y = float(geo_match.group(2))
        width = float(geo_match.group(3))
        height = float(geo_match.group(4))
        
        # Calculate icon position (default to top-left with offset)
        icon_x = x + defaults.get("x", 10)
        icon_y = y + defaults.get("y", 10) 
        icon_width = defaults.get("width", 32)
        icon_height = defaults.get("height", 32)
        
        # Generate a unique ID for the icon cell
        icon_cell_id = f"icon_{cell_id}_{uuid4().hex[:8]}"
        
        # Create new cell with the icon
        icon_cell = f"""
        <mxCell id="{icon_cell_id}" value="" style="html=1;image;image={icons[icon_name]};fontSize=12;fontColor=#FFFFFF;" vertex="1" parent="WIyWlLk6GJQsqaUBKTNV-1">
          <mxGeometry x="{icon_x}" y="{icon_y}" width="{icon_width}" height="{icon_height}" as="geometry" />
        </mxCell>"""
        
        added_cells.append(icon_cell)
        print(f"Added icon '{icon_name}' to cell '{cell_id}'")
    
    # Insert all new cells after the root cells
    if added_cells:
        content = content[:root_end_pos] + "\n".join(added_cells) + content[root_end_pos:]
    
    # Write updated content
    with open(output_file, "w") as f:
        f.write(content)
    
    print(f"Added {len(added_cells)} icons to diagram")
    print(f"Updated diagram saved to: {output_file}")

def main():
    # File paths
    input_file = "project_scout_flow_fixed.drawio"
    output_file = "project_scout_flow_final.drawio"
    config_file = "icon_mapping.yaml"
    icons_dir = "assets/icons_inline"
    
    # Verify files exist
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        return
    
    if not os.path.exists(config_file):
        print(f"Error: Config file not found: {config_file}")
        return
    
    if not os.path.isdir(icons_dir):
        print(f"Error: Icons directory not found: {icons_dir}")
        return
    
    # Load configuration
    config = load_yaml_config(config_file)
    
    # Load icons
    icons = load_inline_svg_icons(icons_dir)
    
    # Process the file
    add_icons_to_diagram(input_file, config, icons, output_file)

if __name__ == "__main__":
    main()