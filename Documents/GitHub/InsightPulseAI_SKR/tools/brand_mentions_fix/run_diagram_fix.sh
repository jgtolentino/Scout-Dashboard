#!/bin/bash
# Script to run the complete diagram fix workflow

set -e  # Exit on error

echo "===== TBWA Diagram Fix Workflow ====="
echo "1. Installing required Python packages..."
pip install pyyaml

echo -e "\n2. Converting SVG icons to inline format..."
python3 claude_icon_inline_format.py

echo -e "\n3. Patching text in diagram..."
python3 drawio_text_patcher.py

echo -e "\n4. Adding icons to diagram..."
python3 add_icons_to_diagram.py

echo -e "\n5. Fixing XML escaping issues..."
if [ -f "project_scout_flow_final.drawio" ]; then
    echo "   Creating safe version of diagram..."
    cp project_scout_flow_final.drawio project_scout_flow_final_safe.drawio
    sed -i.bak 's/<b>/\&lt;b\&gt;/g' project_scout_flow_final_safe.drawio
    sed -i.bak 's/<\/b>/\&lt;\/b\&gt;/g' project_scout_flow_final_safe.drawio
    sed -i.bak 's/<div/\&lt;div/g' project_scout_flow_final_safe.drawio
    sed -i.bak 's/<\/div>/\&lt;\/div\&gt;/g' project_scout_flow_final_safe.drawio
    echo "   Fixed version saved as: project_scout_flow_final_safe.drawio"
fi

echo -e "\nWorkflow completed successfully!"
echo "The fixed diagram is available at: project_scout_flow_final.drawio"
echo "Open this file in Draw.io (diagrams.net) to verify the changes."
echo "====================================="