#!/bin/bash
# integrate_prompt_library.sh - Integrate distilled prompt library with PulseDev
# 
# This script integrates the distilled prompt library with PulseDev's MCP system.

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PULSER_DIR=${PULSER_DIR:-"$HOME/Documents/GitHub/InsightPulseAI_SKR"}
PROMPT_LIBRARY_DIR="$PULSER_DIR/prompt_library"
MCP_PROMPTS_DIR="$SCRIPT_DIR/mcp_prompts"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BOLD}Integrating Distilled Prompt Library with PulseDev${NC}"
echo -e "Pulser Directory: ${BLUE}$PULSER_DIR${NC}"
echo -e "Prompt Library Directory: ${BLUE}$PROMPT_LIBRARY_DIR${NC}"
echo -e "MCP Prompts Directory: ${BLUE}$MCP_PROMPTS_DIR${NC}"
echo

# Function to check if a directory exists
check_directory() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}Error: Directory $1 does not exist${NC}"
    return 1
  fi
  return 0
}

# Step 1: Check directories
echo -e "${BOLD}Step 1: Checking directories${NC}"
if ! check_directory "$PULSER_DIR"; then
  echo -e "${RED}Error: Pulser directory not found. Set the PULSER_DIR environment variable.${NC}"
  exit 1
fi

# Create prompt library directory if it doesn't exist
if [ ! -d "$PROMPT_LIBRARY_DIR" ]; then
  echo -e "${YELLOW}Prompt library directory not found. Creating...${NC}"
  mkdir -p "$PROMPT_LIBRARY_DIR"
fi

if [ ! -d "$MCP_PROMPTS_DIR" ]; then
  echo -e "${RED}Error: MCP prompts directory not found at $MCP_PROMPTS_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Directories checked"
echo

# Step 2: Check for distilled prompt library file
echo -e "${BOLD}Step 2: Checking for distilled prompt library file${NC}"
DISTILLED_LIBRARY_PATH=""

# Try different possible locations
possible_locations=(
  "$SCRIPT_DIR/pulser_prompt_library_distilled.yaml"
  "$PULSER_DIR/pulser_prompt_library_distilled.yaml"
  "$HOME/Downloads/pulser_prompt_library_distilled.yaml"
)

for location in "${possible_locations[@]}"; do
  if [ -f "$location" ]; then
    DISTILLED_LIBRARY_PATH="$location"
    break
  fi
done

if [ -z "$DISTILLED_LIBRARY_PATH" ]; then
  echo -e "${YELLOW}Distilled prompt library file not found.${NC}"
  echo -e "${YELLOW}Please enter the path to the distilled prompt library file:${NC}"
  read -e DISTILLED_LIBRARY_PATH
  
  if [ ! -f "$DISTILLED_LIBRARY_PATH" ]; then
    echo -e "${RED}Error: File not found at $DISTILLED_LIBRARY_PATH${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✓${NC} Using distilled prompt library at: $DISTILLED_LIBRARY_PATH"
echo

# Step 3: Copy distilled prompts to prompt library
echo -e "${BOLD}Step 3: Copying distilled prompts to prompt library${NC}"
cp "$DISTILLED_LIBRARY_PATH" "$PROMPT_LIBRARY_DIR/distilled_prompts.yaml"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Distilled prompts copied to $PROMPT_LIBRARY_DIR/distilled_prompts.yaml"
else
  echo -e "${RED}Error: Failed to copy distilled prompts${NC}"
  exit 1
fi
echo

# Step 4: Convert distilled prompts to MCP format
echo -e "${BOLD}Step 4: Converting distilled prompts to MCP format${NC}"
CLAUDE_MODELS_DIR="$MCP_PROMPTS_DIR/claude"
mkdir -p "$CLAUDE_MODELS_DIR"

# Ensure Python is available
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}Error: Python 3 is required but not found${NC}"
  exit 1
fi

# Create a temporary Python script to convert YAML
CONVERTER_SCRIPT=$(mktemp)
cat > "$CONVERTER_SCRIPT" << 'EOF'
#!/usr/bin/env python3
import yaml
import os
import sys

def convert_to_mcp_format(input_file, output_dir):
    """Convert distilled prompts to MCP format."""
    try:
        with open(input_file, 'r') as f:
            data = yaml.safe_load(f)
        
        if not data:
            print("Error: No data found in the input file")
            return False
        
        # Process each model in the distilled library
        for model_name, model_data in data.items():
            # Skip if not a dict (could be metadata)
            if not isinstance(model_data, dict):
                continue
                
            # Create model directory
            model_dir = os.path.join(output_dir, model_name.split('.')[0])
            os.makedirs(model_dir, exist_ok=True)
            
            # Create MCP prompt file
            output_file = os.path.join(model_dir, f"{model_name.split('.')[-1]}.mcp.yaml")
            
            # Build MCP format
            mcp_data = {
                "metadata": {
                    "name": model_name,
                    "description": model_data.get("description", f"{model_name} based prompt"),
                    "version": model_data.get("version", "1.0.0"),
                    "model": model_data.get("model_id", "claude-3"),
                    "author": "Pulser",
                    "aliases": [model_name.split('.')[-1]],
                    "capabilities": model_data.get("capabilities", ["Code generation", "Task completion"]),
                    "use_cases": model_data.get("use_cases", ["General purpose assistance"])
                },
                "system_prompt": model_data.get("system_prompt", "You are Claude, an AI assistant."),
                "requires": model_data.get("requires", []),
                "access_level": model_data.get("access_level", "public")
            }
            
            # Write to file
            with open(output_file, 'w') as f:
                yaml.dump(mcp_data, f, default_flow_style=False, sort_keys=False)
            
            print(f"Created MCP prompt: {output_file}")
        
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_to_mcp.py <input_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    if convert_to_mcp_format(input_file, output_dir):
        print("Conversion completed successfully")
    else:
        print("Conversion failed")
        sys.exit(1)
EOF

# Run the converter script
python3 "$CONVERTER_SCRIPT" "$PROMPT_LIBRARY_DIR/distilled_prompts.yaml" "$CLAUDE_MODELS_DIR"
conversion_status=$?

# Clean up
rm "$CONVERTER_SCRIPT"

if [ $conversion_status -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Converted distilled prompts to MCP format in $CLAUDE_MODELS_DIR"
else
  echo -e "${RED}Error: Failed to convert distilled prompts${NC}"
  exit 1
fi
echo

# Step 5: Update Kalaw index
echo -e "${BOLD}Step 5: Updating Kalaw index${NC}"
KALAW_INDEX_PATH="$SCRIPT_DIR/kalaw_mcp_prompts.yaml"

if [ ! -f "$KALAW_INDEX_PATH" ]; then
  echo -e "${RED}Error: Kalaw index not found at $KALAW_INDEX_PATH${NC}"
  exit 1
fi

# Create a backup of the Kalaw index
cp "$KALAW_INDEX_PATH" "${KALAW_INDEX_PATH}.bak.${TIMESTAMP}"

# Use awk to append Claude models to the components section
awk -v claude_dir="$CLAUDE_MODELS_DIR" '
BEGIN {
  in_components = 0;
  added = 0;
}

/^components:/ {
  in_components = 1;
}

/^[a-z]/ && in_components {
  if (!added) {
    print "  - name: \"claude/haiku.mcp.yaml\"";
    print "    type: \"MCP System Prompt\"";
    print "    path: \"/mcp_prompts/claude/haiku.mcp.yaml\"";
    print "    purpose: \"Fast, efficient assistance with Claude 3 Haiku\"";
    print "    behavior: \"Optimized for speed and quick responses\"";
    print "    aliases:";
    print "      - \"haiku\"";
    print "      - \"fast\"";
    print "      - \"efficient\"";
    print "      - \"quick\"";
    print "    access_level: \"public\"";
    print "";
    print "  - name: \"claude/sonnet.mcp.yaml\"";
    print "    type: \"MCP System Prompt\"";
    print "    path: \"/mcp_prompts/claude/sonnet.mcp.yaml\"";
    print "    purpose: \"Balanced performance with Claude 3 Sonnet\"";
    print "    behavior: \"General-purpose AI assistant with strong capabilities\"";
    print "    aliases:";
    print "      - \"sonnet\"";
    print "      - \"balanced\"";
    print "      - \"default\"";
    print "      - \"standard\"";
    print "    access_level: \"public\"";
    print "";
    print "  - name: \"claude/opus.mcp.yaml\"";
    print "    type: \"MCP System Prompt\"";
    print "    path: \"/mcp_prompts/claude/opus.mcp.yaml\"";
    print "    purpose: \"Complex reasoning with Claude 3 Opus\"";
    print "    behavior: \"Advanced capabilities for complex tasks and deep reasoning\"";
    print "    aliases:";
    print "      - \"opus\"";
    print "      - \"advanced\"";
    print "      - \"complex\"";
    print "      - \"expert\"";
    print "    access_level: \"public\"";
    print "";
    added = 1;
  }
  in_components = 0;
}

{ print }
' "$KALAW_INDEX_PATH" > "${KALAW_INDEX_PATH}.new"

# Replace the old file with the new one
mv "${KALAW_INDEX_PATH}.new" "$KALAW_INDEX_PATH"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Updated Kalaw index with Claude models"
else
  echo -e "${RED}Error: Failed to update Kalaw index${NC}"
  echo -e "${YELLOW}Restoring backup...${NC}"
  mv "${KALAW_INDEX_PATH}.bak.${TIMESTAMP}" "$KALAW_INDEX_PATH"
  exit 1
fi
echo

# Step 6: Update .pulserrc
echo -e "${BOLD}Step 6: Updating .pulserrc${NC}"
PULSERRC="$PULSER_DIR/.pulserrc"

if [ ! -f "$PULSERRC" ]; then
  echo -e "${YELLOW}Warning: .pulserrc not found at $PULSERRC${NC}"
  echo -e "${YELLOW}Creating new .pulserrc file${NC}"
  
  # Create a new .pulserrc file
  cat > "$PULSERRC" << EOF
# Pulser Configuration

[paths]
prompt_library = $PROMPT_LIBRARY_DIR

[prompt_sources]
mcp_prompts = $MCP_PROMPTS_DIR
EOF

  echo -e "${GREEN}✓${NC} Created new .pulserrc file with prompt library paths"
else
  # Create a backup
  cp "$PULSERRC" "${PULSERRC}.bak.${TIMESTAMP}"
  
  # Check if paths section exists
  if grep -q "\\[paths\\]" "$PULSERRC"; then
    # Check if prompt_library already exists
    if grep -q "prompt_library" "$PULSERRC"; then
      echo -e "${YELLOW}prompt_library already exists in .pulserrc${NC}"
    else
      # Add prompt_library to paths section
      sed -i '' -e "/\\[paths\\]/a\\
prompt_library = $PROMPT_LIBRARY_DIR" "$PULSERRC"
      echo -e "${GREEN}✓${NC} Added prompt_library to .pulserrc paths section"
    fi
  else
    # Add paths section
    cat >> "$PULSERRC" << EOF

[paths]
prompt_library = $PROMPT_LIBRARY_DIR
EOF
    echo -e "${GREEN}✓${NC} Added paths section to .pulserrc"
  fi
  
  # Check if prompt_sources section exists
  if grep -q "\\[prompt_sources\\]" "$PULSERRC"; then
    # Check if mcp_prompts already exists
    if grep -q "mcp_prompts" "$PULSERRC"; then
      echo -e "${YELLOW}mcp_prompts already exists in .pulserrc${NC}"
    else
      # Add mcp_prompts to prompt_sources section
      sed -i '' -e "/\\[prompt_sources\\]/a\\
mcp_prompts = $MCP_PROMPTS_DIR" "$PULSERRC"
      echo -e "${GREEN}✓${NC} Added mcp_prompts to .pulserrc prompt_sources section"
    fi
  else
    # Add prompt_sources section
    cat >> "$PULSERRC" << EOF

[prompt_sources]
mcp_prompts = $MCP_PROMPTS_DIR
EOF
    echo -e "${GREEN}✓${NC} Added prompt_sources section to .pulserrc"
  fi
fi
echo

# Step 7: Update aliases
echo -e "${BOLD}Step 7: Updating prompt aliases${NC}"
PROMPT_ALIASES="$SCRIPT_DIR/prompt_aliases.sh"

if [ ! -f "$PROMPT_ALIASES" ]; then
  echo -e "${RED}Error: prompt_aliases.sh not found at $PROMPT_ALIASES${NC}"
  exit 1
fi

# Create a backup
cp "$PROMPT_ALIASES" "${PROMPT_ALIASES}.bak.${TIMESTAMP}"

# Add Claude model aliases
cat >> "$PROMPT_ALIASES" << EOF

# Claude model aliases
alias phaiku="$PROMPT_SWITCH switch claude/haiku"                  # Claude 3 Haiku (fast)
alias psonnet="$PROMPT_SWITCH switch claude/sonnet"                # Claude 3 Sonnet (balanced)
alias popus="$PROMPT_SWITCH switch claude/opus"                    # Claude 3 Opus (advanced)
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Added Claude model aliases to prompt_aliases.sh"
else
  echo -e "${RED}Error: Failed to update prompt aliases${NC}"
  echo -e "${YELLOW}Restoring backup...${NC}"
  mv "${PROMPT_ALIASES}.bak.${TIMESTAMP}" "$PROMPT_ALIASES"
  exit 1
fi
echo

# Step 8: Register with Kalaw
echo -e "${BOLD}Step 8: Registering with Kalaw${NC}"
$SCRIPT_DIR/register_with_kalaw.sh

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Registered updated MCP prompts with Kalaw"
else
  echo -e "${RED}Error: Failed to register with Kalaw${NC}"
  echo -e "${YELLOW}You may need to run ./register_with_kalaw.sh manually${NC}"
fi
echo

# Final status
echo -e "${BOLD}Integration Complete!${NC}"
echo -e "Distilled prompt library has been integrated with PulseDev"
echo -e "You can now use the following aliases to access Claude models:"
echo -e "  ${GREEN}phaiku${NC} - Fast, efficient Claude 3 Haiku"
echo -e "  ${GREEN}psonnet${NC} - Balanced Claude 3 Sonnet"
echo -e "  ${GREEN}popus${NC} - Advanced Claude 3 Opus"
echo -e "Try running: ${GREEN}pulser mcp_prompts list${NC} to see all available prompts"
echo