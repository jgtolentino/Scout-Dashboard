#!/bin/bash
# Add Pulser Robot 3D commands to agent_routing.yaml

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
YAML_FILE="$SCRIPT_DIR/agent_routing.yaml"

# Check if the file exists
if [ ! -f "$YAML_FILE" ]; then
    echo "Error: agent_routing.yaml not found at $YAML_FILE"
    exit 1
fi

# Make a backup
cp "$YAML_FILE" "${YAML_FILE}.bak"

# Add Pulser Robot route to the routes section
# We'll use sed to insert after the 3D rendering or visualization route
sed -i.tmp '/intent: "3D rendering or visualization"/,/fallback: "Echo"/ {
    /fallback: "Echo"/a \
\
  - intent: "create pulser robot"\
    agent: "Claude"\
    target: "blender"\
    bridge: "blender_mcp_bridge"\
    priority: "high"\
    context: ["pulser", "robot", "mascot", "3D", "model", "character"]\
    examples:\
      - "Create a 3D Pulser robot mascot"\
      - "Generate the Pulser robot in Blender"\
      - "Make a 3D model of the Pulser mascot"\
    fallback: "Maya"
}' "$YAML_FILE"

# Add to intent recognition patterns
sed -i.tmp '/intent_recognition:/,/  data_validation:/ {
    /  data_validation:/i \
  pulser_robot:\
    keywords: ["pulser", "robot", "mascot", "3D model", "character"]\
    phrases:\
      - "create pulser robot"\
      - "make pulser mascot"\
      - "generate pulser robot"\
      - "build pulser 3D model"\
      - "design robot mascot"
}' "$YAML_FILE"

# Clean up temporary files
rm -f "${YAML_FILE}.tmp"

echo "Updated agent_routing.yaml with Pulser Robot commands"
echo "Original file backed up to ${YAML_FILE}.bak"