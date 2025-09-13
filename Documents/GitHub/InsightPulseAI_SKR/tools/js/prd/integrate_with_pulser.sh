#!/bin/bash
# integrate_with_pulser.sh
# Adds the PRD generator to Pulser's task registry and CLI commands

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Integrating PRD Generator with Pulser CLI...${NC}"

# Get the absolute path to the PRD generator
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PRD_GENERATOR_PATH="$SCRIPT_DIR/generate_prd.py"
PULSER_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)

echo -e "${YELLOW}PRD Generator Path:${NC} $PRD_GENERATOR_PATH"
echo -e "${YELLOW}Pulser Root Path:${NC} $PULSER_ROOT"

# Check if the script exists
if [ ! -f "$PRD_GENERATOR_PATH" ]; then
    echo -e "\033[0;31mERROR: PRD Generator script not found at $PRD_GENERATOR_PATH\033[0m"
    exit 1
fi

# Ensure the script is executable
chmod +x "$PRD_GENERATOR_PATH"

# Create the CLI alias command
echo -e "${BLUE}Creating CLI command alias...${NC}"

# Check if .pulserrc exists
PULSERRC_PATH="$PULSER_ROOT/.pulserrc"
if [ ! -f "$PULSERRC_PATH" ]; then
    echo -e "\033[0;31mWARNING: .pulserrc not found at $PULSERRC_PATH\033[0m"
    echo -e "Will create CLI alias in .zshrc instead"
    
    # Add to .zshrc
    ALIAS_CMD="alias :generate-prd='python3 $PRD_GENERATOR_PATH'"
    
    if grep -q ":generate-prd" ~/.zshrc; then
        echo -e "${YELLOW}Alias already exists in .zshrc. Updating...${NC}"
        sed -i '' "s|alias :generate-prd.*|$ALIAS_CMD|" ~/.zshrc
    else
        echo -e "${GREEN}Adding alias to .zshrc${NC}"
        echo "" >> ~/.zshrc
        echo "# Pulser PRD Generator alias" >> ~/.zshrc
        echo "$ALIAS_CMD" >> ~/.zshrc
    fi
    
    echo -e "${GREEN}CLI alias created in .zshrc${NC}"
else
    # Check if commands section exists in .pulserrc
    if grep -q "commands:" "$PULSERRC_PATH"; then
        echo -e "${YELLOW}Commands section found in .pulserrc${NC}"
        
        # Check if generate-prd is already registered
        if grep -q "generate-prd:" "$PULSERRC_PATH"; then
            echo -e "${YELLOW}generate-prd command already exists in .pulserrc. Updating...${NC}"
            # Complex sed command to replace the existing command definition
            # This is a placeholder - in a real implementation, you'd use a more robust approach
            echo -e "${YELLOW}Command update in .pulserrc requires manual editing.${NC}"
            echo -e "${YELLOW}Please add the following to your .pulserrc file:${NC}"
        else
            echo -e "${GREEN}Adding generate-prd command to .pulserrc${NC}"
            # Create a temporary file with the new command
            TEMP_FILE=$(mktemp)
            awk '/commands:/{print;print "  generate-prd:";print "    description: \"Generate a structured Product Requirements Document\"";print "    script: \"python3 '"$PRD_GENERATOR_PATH"'\"";print "    aliases: [\":generate-prd\"]";next}1' "$PULSERRC_PATH" > "$TEMP_FILE"
            mv "$TEMP_FILE" "$PULSERRC_PATH"
        fi
    else
        echo -e "${YELLOW}Commands section not found in .pulserrc. Adding section...${NC}"
        # Add commands section with the PRD generator
        echo "" >> "$PULSERRC_PATH"
        echo "commands:" >> "$PULSERRC_PATH"
        echo "  generate-prd:" >> "$PULSERRC_PATH"
        echo "    description: \"Generate a structured Product Requirements Document\"" >> "$PULSERRC_PATH"
        echo "    script: \"python3 $PRD_GENERATOR_PATH\"" >> "$PULSERRC_PATH"
        echo "    aliases: [\":generate-prd\"]" >> "$PULSERRC_PATH"
    fi
    
    echo -e "${GREEN}CLI command integrated in .pulserrc${NC}"
fi

# Create task registry entry if the file exists
TASK_REGISTRY="$PULSER_ROOT/task_registry.yaml"
if [ -f "$TASK_REGISTRY" ]; then
    echo -e "${BLUE}Adding PRD Generator to task registry...${NC}"
    
    # Check if PRD generator is already in the registry
    if grep -q "generate-prd:" "$TASK_REGISTRY"; then
        echo -e "${YELLOW}PRD Generator already in task registry. Skipping...${NC}"
    else
        # Add to task registry
        echo "" >> "$TASK_REGISTRY"
        echo "generate-prd:" >> "$TASK_REGISTRY"
        echo "  name: \"PRD Generator\"" >> "$TASK_REGISTRY"
        echo "  description: \"Generate structured Product Requirements Documents\"" >> "$TASK_REGISTRY"
        echo "  script: \"$PRD_GENERATOR_PATH\"" >> "$TASK_REGISTRY"
        echo "  output_format: [\"markdown\", \"yaml\"]" >> "$TASK_REGISTRY"
        echo "  agent: \"Claudia\"" >> "$TASK_REGISTRY"
        echo "  tags: [\"product\", \"requirements\", \"documentation\"]" >> "$TASK_REGISTRY"
        
        echo -e "${GREEN}PRD Generator added to task registry${NC}"
    fi
else
    echo -e "${YELLOW}Task registry not found at $TASK_REGISTRY. Skipping registry integration.${NC}"
fi

# Check if ~/.claude.json exists for Claude integration
CLAUDE_CONFIG="$HOME/.claude.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${BLUE}Adding PRD Generator to Claude configuration...${NC}"
    
    # This would require a JSON parser to modify properly
    # For now, we'll just provide instructions
    echo -e "${YELLOW}To integrate with Claude, add the following to your ~/.claude.json:${NC}"
    echo -e "${YELLOW}In the 'commands' section:${NC}"
    echo ""
    echo -e "\"generate-prd\": {"
    echo -e "  \"description\": \"Generate a structured Product Requirements Document\","
    echo -e "  \"script\": \"python3 $PRD_GENERATOR_PATH\""
    echo -e "}"
fi

echo ""
echo -e "${GREEN}PRD Generator Integration Complete!${NC}"
echo -e "${BLUE}You can now use the PRD generator with:${NC}"
echo -e "  :generate-prd"
echo ""
echo -e "${YELLOW}Note: You may need to restart your shell or source your .zshrc to use the new command.${NC}"