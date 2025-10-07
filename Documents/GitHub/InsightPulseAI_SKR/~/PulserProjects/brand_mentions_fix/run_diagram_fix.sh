#!/bin/bash
# Script to run the complete diagram fix workflow

set -e  # Exit on error

echo "===== TBWA Diagram Fix Workflow ====="
echo "1. Converting SVG icons to inline format..."
python claude_icon_inline_format.py

echo -e "\n2. Patching text in diagram..."
python drawio_text_patcher.py

echo -e "\n3. Adding icons to diagram..."
python add_icons_to_diagram.py

echo -e "\nWorkflow completed successfully!"
echo "The fixed diagram is available at: project_scout_flow_final.drawio"
echo "Open this file in Draw.io (diagrams.net) to verify the changes."
echo "====================================="