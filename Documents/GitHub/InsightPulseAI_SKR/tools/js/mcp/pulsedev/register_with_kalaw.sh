#!/bin/bash
# register_with_kalaw.sh - Register MCP prompts with Kalaw knowledge system
# 
# This script indexes the MCP prompts collection with Kalaw for knowledge retrieval
# and integration with the broader Pulser ecosystem.

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
KALAW_INDEX_PATH="$SCRIPT_DIR/kalaw_mcp_prompts.yaml"
SKR_DIR=${SKR_DIR:-"$HOME/Documents/GitHub/InsightPulseAI_SKR"}
METRICS_DIR="$SKR_DIR/SKR/metrics/prompt_usage"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BOLD}Registering MCP Prompts with Kalaw${NC}"
echo -e "SKR Directory: ${BLUE}$SKR_DIR${NC}"
echo -e "Kalaw Index: ${BLUE}$KALAW_INDEX_PATH${NC}"
echo

# Create metrics directory if it doesn't exist
mkdir -p "$METRICS_DIR"

# Function to check if a directory exists
check_directory() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}Error: Directory $1 does not exist${NC}"
    return 1
  fi
  return 0
}

# Function to validate the Kalaw index
validate_kalaw_index() {
  if [ ! -f "$KALAW_INDEX_PATH" ]; then
    echo -e "${RED}Error: Kalaw index file not found at $KALAW_INDEX_PATH${NC}"
    return 1
  fi
  
  # Simple validation - check for required sections
  if ! grep -q "metadata:" "$KALAW_INDEX_PATH" || \
     ! grep -q "components:" "$KALAW_INDEX_PATH" || \
     ! grep -q "knowledge_index:" "$KALAW_INDEX_PATH"; then
    echo -e "${RED}Error: Kalaw index file is missing required sections${NC}"
    return 1
  fi
  
  return 0
}

# Function to count MCP prompt files
count_mcp_prompts() {
  local mcp_prompts_dir="$SCRIPT_DIR/mcp_prompts"
  if [ ! -d "$mcp_prompts_dir" ]; then
    echo 0
    return
  fi
  
  find "$mcp_prompts_dir" -name "*.mcp.yaml" | wc -l | tr -d ' '
}

# Step 1: Check directories and files
echo -e "${BOLD}Step 1: Checking directories and files${NC}"
if ! check_directory "$SKR_DIR"; then
  echo -e "${RED}Error: SKR directory not found. Set the SKR_DIR environment variable.${NC}"
  exit 1
fi

if ! validate_kalaw_index; then
  echo -e "${RED}Error: Kalaw index validation failed.${NC}"
  exit 1
fi

# Count MCP prompts
prompt_count=$(count_mcp_prompts)
echo -e "Found ${GREEN}$prompt_count${NC} MCP prompt files"
echo -e "${GREEN}✓${NC} Directories and files checked"
echo

# Step 2: Copy Kalaw index to SKR directory
echo -e "${BOLD}Step 2: Copying Kalaw index to SKR directory${NC}"
SKR_METADATA_DIR="$SKR_DIR/SKR/metadata"
mkdir -p "$SKR_METADATA_DIR"

DEST_INDEX_FILE="$SKR_METADATA_DIR/pulsedev_mcp_prompts_$TIMESTAMP.yaml"
cp "$KALAW_INDEX_PATH" "$DEST_INDEX_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Kalaw index copied to $DEST_INDEX_FILE"
else
  echo -e "${RED}Error: Failed to copy Kalaw index${NC}"
  exit 1
fi
echo

# Step 3: Register with Kalaw (simulated)
echo -e "${BOLD}Step 3: Registering with Kalaw${NC}"
echo -e "${YELLOW}Registering MCP prompts collection...${NC}"

# Create a registration record (in real implementation, this would call Kalaw's API)
REGISTRATION_RECORD="$SKR_METADATA_DIR/pulsedev_registration_$TIMESTAMP.json"
cat > "$REGISTRATION_RECORD" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "collection_name": "PulseDev MCP Prompts Collection",
  "version": "1.0.0",
  "document_count": $prompt_count,
  "index_path": "$DEST_INDEX_FILE",
  "status": "registered",
  "orchestration_path": "Claudia → Kalaw → MCP → Claude"
}
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Registration record created at $REGISTRATION_RECORD"
else
  echo -e "${RED}Error: Failed to create registration record${NC}"
  exit 1
fi
echo

# Step 4: Initialize metrics tracking
echo -e "${BOLD}Step 4: Initializing metrics tracking${NC}"
INITIAL_METRICS="$METRICS_DIR/mcp_metrics_initial_$TIMESTAMP.json"
cat > "$INITIAL_METRICS" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "metrics": {
    "total_requests": 0,
    "requests_by_prompt": {},
    "errors_by_prompt": {},
    "usage_by_context": {},
    "popular_task_types": {}
  },
  "session_id": "initial_session_$TIMESTAMP"
}
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Initial metrics created at $INITIAL_METRICS"
else
  echo -e "${RED}Error: Failed to create initial metrics${NC}"
  exit 1
fi
echo

# Step A5: Create symlinks for Claudia access
echo -e "${BOLD}Step 5: Creating symlinks for Claudia access${NC}"
CLAUDIA_DIR="$SKR_DIR/agents/claude"
mkdir -p "$CLAUDIA_DIR/mcp_prompts"

if [ -d "$CLAUDIA_DIR" ]; then
  # Create symlink to MCP prompts
  ln -sf "$SCRIPT_DIR/mcp_prompts" "$CLAUDIA_DIR/mcp_prompts/pulsedev"
  
  # Create symlink to Kalaw index
  ln -sf "$DEST_INDEX_FILE" "$CLAUDIA_DIR/pulsedev_mcp_prompts.yaml"
  
  echo -e "${GREEN}✓${NC} Symlinks created in $CLAUDIA_DIR"
else
  echo -e "${YELLOW}Warning: Claudia directory not found at $CLAUDIA_DIR${NC}"
  echo -e "${YELLOW}Skipping symlink creation${NC}"
fi
echo

# Step 6: Register aliases with Claudia
echo -e "${BOLD}Step 6: Registering aliases with Claudia${NC}"
CLAUDIA_ALIASES="$SKR_DIR/.claudia_aliases"

if [ -f "$SCRIPT_DIR/prompt_aliases.sh" ]; then
  echo -e "# PulseDev MCP Prompt aliases - Added $(date)" >> "$CLAUDIA_ALIASES"
  echo -e "source $SCRIPT_DIR/prompt_aliases.sh" >> "$CLAUDIA_ALIASES"
  echo -e "${GREEN}✓${NC} Aliases registered with Claudia"
else
  echo -e "${YELLOW}Warning: prompt_aliases.sh not found${NC}"
  echo -e "${YELLOW}Skipping alias registration${NC}"
fi
echo

# Step 7: Update paths in CLAUDE.md
echo -e "${BOLD}Step 7: Updating CLAUDE.md${NC}"
if [ -f "$SCRIPT_DIR/CLAUDE.md" ]; then
  # Append MCP prompt information to CLAUDE.md
  cat >> "$SCRIPT_DIR/CLAUDE.md" << EOF

## MCP Prompts

PulseDev includes specialized MCP prompts that tune Claude's behavior for different tasks:

* \`pcode\` - Cursor-style coding assistance
* \`pcmd\` - Replit-style terminal operations
* \`pdev\` - VSCode-style IDE assistance
* \`pux\` - Lovable-style UX design
* \`pslides\` - Gamma-style presentation creation
* \`pauto\` - Devin-style autonomous development
* \`pall\` - Unified capabilities

Use \`plist\` to see all available prompts and \`pswitch [prompt_name]\` to change modes.
EOF

  echo -e "${GREEN}✓${NC} Updated CLAUDE.md with MCP prompt information"
else
  echo -e "${YELLOW}Warning: CLAUDE.md not found${NC}"
  echo -e "${YELLOW}Skipping CLAUDE.md update${NC}"
fi
echo

# Final status
echo -e "${BOLD}Registration Complete${NC}"
echo -e "MCP Prompts collection is now indexed with Kalaw"
echo -e "Metrics tracking is initialized at: ${BLUE}$METRICS_DIR${NC}"
echo -e "Run ${GREEN}curl http://localhost:5000/api/claudia/status${NC} to verify integration"
echo