#!/bin/bash
# pulser_integration.sh - Integrate MCP prompts with Pulser CLI
# 
# This script creates the necessary configuration to use PulseDev MCP prompts
# with the Pulser CLI system.

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
PULSER_CLI_DIR="$PULSER_DIR/tools/js"
PULSER_COMMANDS_DIR="$PULSER_CLI_DIR/router/commands"
KALAW_INDEX_PATH="$SCRIPT_DIR/kalaw_mcp_prompts.yaml"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BOLD}Integrating MCP Prompts with Pulser CLI${NC}"
echo -e "Pulser Directory: ${BLUE}$PULSER_DIR${NC}"
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

if ! check_directory "$PULSER_CLI_DIR"; then
  echo -e "${RED}Error: Pulser CLI directory not found at $PULSER_CLI_DIR${NC}"
  exit 1
fi

if ! check_directory "$PULSER_COMMANDS_DIR"; then
  echo -e "${RED}Error: Pulser commands directory not found at $PULSER_COMMANDS_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Directories checked"
echo

# Step 2: Create MCP prompts command for Pulser CLI
echo -e "${BOLD}Step 2: Creating MCP prompts command for Pulser CLI${NC}"
MCP_PROMPTS_COMMAND="$PULSER_COMMANDS_DIR/mcp_prompts.js"

cat > "$MCP_PROMPTS_COMMAND" << 'EOF'
/**
 * MCP Prompts command for Pulser CLI
 * 
 * This command enables interaction with the PulseDev MCP prompts system through
 * the Pulser CLI. It provides prompt listing, switching, and recommendations.
 */

const fetch = require("node-fetch");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Default endpoint for PulseDev API
const PULSEDEV_API = process.env.PULSEDEV_API || "http://localhost:8000/api";

// Command handler
async function mcpPromptsCommand(args, logger) {
  const subcommand = args._[0] || "help";
  
  switch (subcommand) {
    case "list":
      return listPrompts(args, logger);
    case "info":
      return getPromptInfo(args, logger);
    case "switch":
      return switchPrompt(args, logger);
    case "recommend":
      return recommendPrompt(args, logger);
    case "status":
      return getStatus(args, logger);
    case "help":
    default:
      return showHelp(logger);
  }
}

// List available prompts
async function listPrompts(args, logger) {
  try {
    const response = await fetch(`${PULSEDEV_API}/ai/prompts?include_metadata=true`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prompts: ${response.statusText}`);
    }
    
    const data = await response.json();
    const prompts = data.prompts || [];
    const activePrompt = data.active_prompt;
    
    logger.info(chalk.bold("\nAvailable MCP Prompts:"));
    logger.info("-".repeat(50));
    
    prompts.forEach(prompt => {
      const isActive = prompt.name === activePrompt;
      const accessLevel = prompt.access_level || "internal";
      const accessColor = 
        accessLevel === "public" ? chalk.green :
        accessLevel === "beta" ? chalk.yellow :
        chalk.red;
      
      const promptName = isActive ? 
        chalk.bold.green(`➜ ${prompt.name}`) : 
        chalk.bold(`  ${prompt.name}`);
      
      const description = prompt.metadata?.description || "No description";
      const aliases = prompt.metadata?.aliases?.length ? 
        `(Aliases: ${prompt.metadata.aliases.join(", ")})` : 
        "";
      
      logger.info(`${promptName} - ${description} ${aliases} ${accessColor(`[${accessLevel}]`)}`)
    });
    
    logger.info("-".repeat(50));
    logger.info(`Active prompt: ${chalk.green(activePrompt || "None")}`);
    logger.info(`Total prompts: ${prompts.length}`);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error listing prompts: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get information about a specific prompt
async function getPromptInfo(args, logger) {
  const promptName = args._[1];
  
  if (!promptName) {
    logger.error("Prompt name is required");
    logger.info("Example: pulser mcp_prompts info cursor/chat_prompt");
    return { success: false };
  }
  
  try {
    const response = await fetch(`${PULSEDEV_API}/ai/prompts/${promptName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prompt info: ${response.statusText}`);
    }
    
    const prompt = await response.json();
    
    logger.info(chalk.bold(`\nPrompt Details: ${chalk.blue(prompt.name)}`));
    logger.info("-".repeat(50));
    
    logger.info(chalk.bold("Description:"), prompt.metadata?.description || "No description");
    logger.info(chalk.bold("Access Level:"), prompt.access_level || "internal");
    logger.info(chalk.bold("Active:"), prompt.active ? "Yes" : "No");
    
    if (prompt.metadata?.capabilities?.length) {
      logger.info(chalk.bold("\nCapabilities:"));
      prompt.metadata.capabilities.forEach(capability => {
        logger.info(`  • ${capability}`);
      });
    }
    
    if (prompt.metadata?.use_cases?.length) {
      logger.info(chalk.bold("\nUse Cases:"));
      prompt.metadata.use_cases.forEach(useCase => {
        logger.info(`  • ${useCase}`);
      });
    }
    
    if (prompt.requires?.length) {
      logger.info(chalk.bold("\nDependencies:"));
      prompt.requires.forEach(dep => {
        logger.info(`  • ${dep}`);
      });
    }
    
    if (prompt.metadata?.aliases?.length) {
      logger.info(chalk.bold("\nAliases:"));
      prompt.metadata.aliases.forEach(alias => {
        logger.info(`  • ${alias}`);
      });
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Error getting prompt info: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Switch to a different prompt
async function switchPrompt(args, logger) {
  const promptName = args._[1];
  
  if (!promptName) {
    logger.error("Prompt name is required");
    logger.info("Example: pulser mcp_prompts switch gamma/presentation_creator");
    return { success: false };
  }
  
  try {
    const response = await fetch(`${PULSEDEV_API}/ai/prompts/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt_name: promptName,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to switch prompt: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.status === "success") {
      logger.info(chalk.green(`Successfully switched to prompt: ${result.active_prompt}`));
    } else {
      logger.warn(`Switch result: ${result.status}`);
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Error switching prompt: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get prompt recommendations based on a query
async function recommendPrompt(args, logger) {
  const query = args._.slice(1).join(" ") || args.query;
  
  if (!query) {
    logger.error("Query is required");
    logger.info('Example: pulser mcp_prompts recommend "Create a React component for login"');
    return { success: false };
  }
  
  try {
    const response = await fetch(`${PULSEDEV_API}/api/prompts/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        max_recommendations: args.max || 3,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.statusText}`);
    }
    
    const result = await response.json();
    const recommendations = result.recommendations || [];
    
    logger.info(chalk.bold(`\nPrompt Recommendations for: ${query}`));
    logger.info("-".repeat(50));
    
    if (result.prompt_hint) {
      logger.info(chalk.bold("Detected hint:"), result.prompt_hint);
      logger.info("");
    }
    
    if (recommendations.length === 0) {
      logger.info("No recommendations available");
    } else {
      logger.info(chalk.bold("Top Recommendations:"));
      logger.info("");
      
      recommendations.forEach((rec, index) => {
        const scoreColor = 
          rec.score > 80 ? chalk.green :
          rec.score > 40 ? chalk.yellow :
          chalk.white;
        
        logger.info(`${index + 1}. ${chalk.bold(rec.name)} (Score: ${scoreColor(rec.score)})`);
        logger.info(`   ${rec.metadata?.description || "No description"}`);
        logger.info("");
      });
      
      logger.info(`To switch to a recommended prompt, run: ${chalk.cyan("pulser mcp_prompts switch [prompt_name]")}`);
    }
    
    return { success: true };
  } catch (error) {
    logger.error(`Error getting recommendations: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Get status of the MCP prompts system
async function getStatus(args, logger) {
  try {
    const response = await fetch(`${PULSEDEV_API}/claudia/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    
    const status = await response.json();
    
    logger.info(chalk.bold("\nMCP Prompts System Status:"));
    logger.info("-".repeat(50));
    
    // Claudia Bridge Status
    const claudiaStatus = status.claudia_bridge || {};
    logger.info(chalk.bold("Claudia Bridge:"));
    logger.info(`  Status: ${claudiaStatus.status === "connected" ? chalk.green("Connected") : chalk.red("Disconnected")}`);
    logger.info(`  Session ID: ${claudiaStatus.session_id || "None"}`);
    logger.info(`  Total Requests: ${claudiaStatus.total_requests || 0}`);
    
    // MCP Status
    const mcpStatus = status.mcp_status || {};
    logger.info(chalk.bold("\nMCP Status:"));
    logger.info(`  Connected: ${mcpStatus.connected ? chalk.green("Yes") : chalk.red("No")}`);
    logger.info(`  Active Prompt: ${chalk.cyan(mcpStatus.active_prompt || "None")}`);
    
    // Kalaw Status
    const kalawStatus = status.kalaw_status || {};
    logger.info(chalk.bold("\nKalaw Integration:"));
    logger.info(`  Indexed Components: ${kalawStatus.indexed_components || 0}`);
    logger.info(`  Indexed Concepts: ${kalawStatus.indexed_concepts || 0}`);
    
    return { success: true };
  } catch (error) {
    logger.error(`Error getting status: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Show help
function showHelp(logger) {
  logger.info(chalk.bold("\nMCP Prompts Command:"));
  logger.info("Manage AI behavior through the Model Context Protocol (MCP) prompts system");
  logger.info("");
  
  logger.info(chalk.bold("Usage:"));
  logger.info("  pulser mcp_prompts [subcommand] [options]");
  logger.info("");
  
  logger.info(chalk.bold("Subcommands:"));
  logger.info("  list              List all available MCP prompts");
  logger.info("  info <name>       Get detailed information about a prompt");
  logger.info("  switch <name>     Switch to a different prompt");
  logger.info("  recommend <query> Get prompt recommendations based on a query");
  logger.info("  status            Check the status of the MCP prompts system");
  logger.info("  help              Show this help message");
  logger.info("");
  
  logger.info(chalk.bold("Options:"));
  logger.info("  --max=<number>    Maximum number of recommendations to show");
  logger.info("");
  
  logger.info(chalk.bold("Examples:"));
  logger.info("  pulser mcp_prompts list");
  logger.info("  pulser mcp_prompts info cursor/chat_prompt");
  logger.info("  pulser mcp_prompts switch gamma/presentation_creator");
  logger.info('  pulser mcp_prompts recommend "Create a React component for a login form"');
  logger.info("  pulser mcp_prompts status");
  logger.info("");
  
  return { success: true };
}

module.exports = mcpPromptsCommand;
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Created MCP prompts command for Pulser CLI at $MCP_PROMPTS_COMMAND"
else
  echo -e "${RED}✗${NC} Failed to create MCP prompts command"
  exit 1
fi
echo

# Step 3: Register the command with the command registry
echo -e "${BOLD}Step 3: Registering command with Pulser CLI${NC}"
COMMAND_REGISTRY="$PULSER_CLI_DIR/router/command_registry.js"

if [ ! -f "$COMMAND_REGISTRY" ]; then
  echo -e "${RED}Error: Command registry not found at $COMMAND_REGISTRY${NC}"
  exit 1
fi

# Check if the command is already registered
if grep -q "mcp_prompts" "$COMMAND_REGISTRY"; then
  echo -e "${YELLOW}Command 'mcp_prompts' is already registered in the command registry${NC}"
else
  # Create a backup
  cp "$COMMAND_REGISTRY" "${COMMAND_REGISTRY}.bak.${TIMESTAMP}"
  
  # Add the command to the registry using sed
  sed -i '' -e "s/const commands = {/const commands = {\n  mcp_prompts: require('.\/commands\/mcp_prompts'),/" "$COMMAND_REGISTRY"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Registered MCP prompts command in the command registry"
  else
    echo -e "${RED}✗${NC} Failed to register command in registry"
    exit 1
  fi
fi
echo

# Step 4: Create aliases in .pulserrc
echo -e "${BOLD}Step 4: Creating aliases in .pulserrc${NC}"
PULSERRC="$PULSER_DIR/.pulserrc"

if [ ! -f "$PULSERRC" ]; then
  echo -e "${YELLOW}Warning: .pulserrc not found at $PULSERRC${NC}"
  echo -e "${YELLOW}Creating new .pulserrc file${NC}"
  
  # Create a new .pulserrc file
  cat > "$PULSERRC" << EOF
# Pulser Configuration

[aliases]
# MCP Prompts aliases - Added $(date)
plist = mcp_prompts list
pinfo = mcp_prompts info
pswitch = mcp_prompts switch
prec = mcp_prompts recommend
pstatus = mcp_prompts status
pcode = mcp_prompts switch cursor/chat_prompt
pcmd = mcp_prompts switch replit/command_runner
papi = mcp_prompts switch windsurf/tools
pux = mcp_prompts switch lovable/ux_designer
pcomp = mcp_prompts switch rork/component_logic
pslides = mcp_prompts switch gamma/presentation_creator
pdocs = mcp_prompts switch same/collaboration_agent
pdev = mcp_prompts switch vscode/code_assistant
pauto = mcp_prompts switch devin/autonomous_developer
pagent = mcp_prompts switch manus/agent_programmer
pall = mcp_prompts switch combined/pulsedev_unified
EOF

  echo -e "${GREEN}✓${NC} Created new .pulserrc file with MCP prompts aliases"
else
  # Create a backup
  cp "$PULSERRC" "${PULSERRC}.bak.${TIMESTAMP}"
  
  # Check if aliases section exists
  if grep -q "\\[aliases\\]" "$PULSERRC"; then
    # Aliases section exists, append to it
    cat >> "$PULSERRC" << EOF

# MCP Prompts aliases - Added $(date)
plist = mcp_prompts list
pinfo = mcp_prompts info
pswitch = mcp_prompts switch
prec = mcp_prompts recommend
pstatus = mcp_prompts status
pcode = mcp_prompts switch cursor/chat_prompt
pcmd = mcp_prompts switch replit/command_runner
papi = mcp_prompts switch windsurf/tools
pux = mcp_prompts switch lovable/ux_designer
pcomp = mcp_prompts switch rork/component_logic
pslides = mcp_prompts switch gamma/presentation_creator
pdocs = mcp_prompts switch same/collaboration_agent
pdev = mcp_prompts switch vscode/code_assistant
pauto = mcp_prompts switch devin/autonomous_developer
pagent = mcp_prompts switch manus/agent_programmer
pall = mcp_prompts switch combined/pulsedev_unified
EOF
  else
    # Aliases section doesn't exist, add it
    cat >> "$PULSERRC" << EOF

[aliases]
# MCP Prompts aliases - Added $(date)
plist = mcp_prompts list
pinfo = mcp_prompts info
pswitch = mcp_prompts switch
prec = mcp_prompts recommend
pstatus = mcp_prompts status
pcode = mcp_prompts switch cursor/chat_prompt
pcmd = mcp_prompts switch replit/command_runner
papi = mcp_prompts switch windsurf/tools
pux = mcp_prompts switch lovable/ux_designer
pcomp = mcp_prompts switch rork/component_logic
pslides = mcp_prompts switch gamma/presentation_creator
pdocs = mcp_prompts switch same/collaboration_agent
pdev = mcp_prompts switch vscode/code_assistant
pauto = mcp_prompts switch devin/autonomous_developer
pagent = mcp_prompts switch manus/agent_programmer
pall = mcp_prompts switch combined/pulsedev_unified
EOF
  fi
  
  echo -e "${GREEN}✓${NC} Added MCP prompts aliases to .pulserrc"
fi
echo

# Step 5: Update CLAUDE.md with MCP prompts information
echo -e "${BOLD}Step 5: Updating CLAUDE.md with MCP prompts information${NC}"
CLAUDE_MD="$PULSER_DIR/CLAUDE.md"

if [ ! -f "$CLAUDE_MD" ]; then
  echo -e "${YELLOW}Warning: CLAUDE.md not found at $CLAUDE_MD${NC}"
  echo -e "${YELLOW}Skipping CLAUDE.md update${NC}"
else
  # Create a backup
  cp "$CLAUDE_MD" "${CLAUDE_MD}.bak.${TIMESTAMP}"
  
  # Check if MCP Prompts section already exists
  if grep -q "## MCP Prompts" "$CLAUDE_MD"; then
    echo -e "${YELLOW}MCP Prompts section already exists in CLAUDE.md${NC}"
  else
    # Add MCP Prompts section to CLAUDE.md
    cat >> "$CLAUDE_MD" << EOF

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
    
    echo -e "${GREEN}✓${NC} Updated CLAUDE.md with MCP prompts information"
  fi
fi
echo

# Final status
echo -e "${BOLD}Integration Complete!${NC}"
echo -e "MCP Prompts have been integrated with Pulser CLI"
echo -e "You can now use the MCP prompts command and aliases in Pulser CLI"
echo -e "Try running: ${GREEN}pulser mcp_prompts list${NC} to see available prompts"
echo