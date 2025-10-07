#!/usr/bin/env python3
"""
Patch text content and alignment in Draw.io (diagrams.net) XML files
using a YAML configuration file.
"""

import re
import yaml
import os
from xml.etree import ElementTree as ET

def load_yaml_config(config_path):
    """Load text placement configuration from YAML file"""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def patch_drawio_xml(input_path, config, output_path):
    """Patch a Draw.io XML file with text placement configuration"""
    # Read the file as text since ElementTree doesn't preserve CDATA sections well
    with open(input_path, "r") as f:
        content = f.read()
    
    # Process each placement in the config
    for placement in config["placements"]:
        cell_id = placement["id"]
        new_text = placement["text"]
        align = placement.get("align", "center")
        
        # Create regex pattern to match the mxCell with the specified ID
        pattern = rf'<mxCell\s+id="{cell_id}"[^>]*value="([^"]*)"[^>]*>'
        
        # Format the text with HTML if needed
        formatted_text = new_text.replace("\n", "<br>")
        
        # Add alignment if specified
        if align == "left":
            formatted_text = f'<div style="text-align: left;">{formatted_text}</div>'
        elif align == "right":
            formatted_text = f'<div style="text-align: right;">{formatted_text}</div>'
        
        # Find and replace the value attribute
        match = re.search(pattern, content)
        if match:
            old_value = match.group(1)
            new_cell = match.group(0).replace(f'value="{old_value}"', f'value="{formatted_text}"')
            content = content.replace(match.group(0), new_cell)
            print(f"Updated text for cell: {cell_id}")
        else:
            print(f"Warning: Cell with ID '{cell_id}' not found")
    
    # Write the modified content to the output file
    with open(output_path, "w") as f:
        f.write(content)
    
    print(f"Updated XML saved to: {output_path}")

def main():
    # File paths
    input_file = "project_scout_flow.drawio"
    config_file = "assets/text_placements.yaml"
    output_file = "project_scout_flow_fixed.drawio"
    
    # Verify files exist
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        return
    
    if not os.path.exists(config_file):
        print(f"Error: Config file not found: {config_file}")
        return
    
    # Load configuration
    config = load_yaml_config(config_file)
    
    # Process the file
    patch_drawio_xml(input_file, config, output_file)

if __name__ == "__main__":
    main()