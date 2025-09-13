#!/usr/bin/env python3
"""
Convert SVG files to inline SVG format compatible with Draw.io
"""

import os
import urllib.parse

ICON_DIR = "assets/icons"
INLINE_OUT = "assets/icons_inline"

os.makedirs(INLINE_OUT, exist_ok=True)

for fname in os.listdir(ICON_DIR):
    if fname.endswith(".svg"):
        print(f"Processing {fname}...")
        with open(f"{ICON_DIR}/{fname}", "r") as f:
            raw_svg = f.read()
            
        # Clean up SVG for inline usage
        raw_svg = raw_svg.replace('"', "'").replace('\n', ' ').strip()
        
        # URL encode the SVG content for drawio
        encoded_svg = urllib.parse.quote(raw_svg)
        
        # Create inline format
        inline_svg = f"data:image/svg+xml,{encoded_svg}"
        
        output_name = fname.replace('.svg', '.txt')
        with open(f"{INLINE_OUT}/{output_name}", "w") as out:
            out.write(inline_svg)
            
        print(f"  -> Saved to {INLINE_OUT}/{output_name}")

print(f"Processed {len([f for f in os.listdir(ICON_DIR) if f.endswith('.svg')])} SVG files")