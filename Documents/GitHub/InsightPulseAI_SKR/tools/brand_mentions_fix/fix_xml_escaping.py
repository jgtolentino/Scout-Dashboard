#!/usr/bin/env python3
"""
Fix XML escaping issues in Draw.io file
"""

import re
import os

def fix_xml_escaping(input_file, output_file):
    """Fix common XML escaping issues in Draw.io files"""
    print(f"Reading file: {input_file}")
    with open(input_file, "r") as f:
        content = f.read()
    
    # Fix common problematic patterns
    fixes = [
        # HTML tags that should be escaped in attribute values
        (r'value="([^"]*)<b>([^"]*)</b>([^"]*)"', r'value="\1&lt;b&gt;\2&lt;/b&gt;\3"'),
        (r'value="([^"]*)<div([^>]*)>([^"]*)</div>([^"]*)"', r'value="\1&lt;div\2&gt;\3&lt;/div&gt;\4"'),
        
        # Don't escape <br> tags that should be preserved
        (r'&lt;br&gt;', r'<br>'),
    ]
    
    # Apply all fixes
    fixed_content = content
    for pattern, replacement in fixes:
        fixed_content = re.sub(pattern, replacement, fixed_content)
    
    # Write fixed content
    with open(output_file, "w") as f:
        f.write(fixed_content)
    
    print(f"Fixed XML saved to: {output_file}")

def main():
    input_file = "project_scout_flow_final.drawio"
    output_file = "project_scout_flow_fixed_escaped.drawio"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        return
    
    fix_xml_escaping(input_file, output_file)

if __name__ == "__main__":
    main()