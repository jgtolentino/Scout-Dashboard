#!/bin/bash

# AppGenie Development Script
# This script provides easy access to AppGenie commands

# Set working directory to script location
cd "$(dirname "$0")"

# Create necessary directories if they don't exist
mkdir -p ./data ./logs ./logs/agents ./dist

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}"
echo "    _                  _____            _      "
echo "   / \   _ __  _ __   / ___| ___ _ __  (_) ___ "
echo "  / _ \ | '_ \| '_ \ | |  _ / _ \ '_ \ | |/ _ \\"
echo " / ___ \| |_) | |_) || |_| |  __/ | | || |  __/"
echo "/_/   \_\ .__/| .__/  \____|\___|_| |_|/ |\___|"
echo "        |_|   |_|                    |__/      "
echo -e "${NC}"
echo -e "${GREEN}AI-Native Mobile App Generator${NC}"
echo

# Help function
show_help() {
  echo -e "${BLUE}Usage:${NC} ./dev.sh [command] [options]"
  echo
  echo -e "${BLUE}Commands:${NC}"
  echo "  init [prompt]       Initialize a new app from prompt"
  echo "  edit [app_name]     Open UI editor for an app"
  echo "  preview [app_name]  Preview an app in device frames"
  echo "  deploy [app_name]   Deploy an app"
  echo "  list                List all apps"
  echo "  serve               Start development server"
  echo "  remember [key] [data] Save project context to memory"
  echo "  recall [key]        Retrieve project context from memory"
  echo "  trace [agent]       View agent execution traces"
  echo "  help                Show this help message"
  echo
  echo -e "${BLUE}Examples:${NC}"
  echo "  ./dev.sh init \"Build a habit tracker app\""
  echo "  ./dev.sh edit habit-tracker"
  echo "  ./dev.sh preview habit-tracker --device=iphone"
  echo "  ./dev.sh deploy habit-tracker --target=pwa"
  echo
}

# Start MCP server
start_mcp_server() {
  echo -e "${BLUE}Starting MCP server...${NC}"
  # In a real implementation, this would start the MCP server
  # For now, we'll just simulate it
  echo "MCP server running at http://localhost:3333"
}

# Parse command line arguments
COMMAND=$1
shift

case $COMMAND in
  init)
    APP_PROMPT=$1
    if [ -z "$APP_PROMPT" ]; then
      echo -e "${RED}Error: App prompt is required${NC}"
      echo -e "Usage: ./dev.sh init \"Your app prompt here\""
      exit 1
    fi
    echo -e "${BLUE}Initializing new app from prompt:${NC} $APP_PROMPT"
    
    # In a real implementation, this would call the NLP parser agent
    # For now, we'll just simulate it
    APP_NAME=$(echo "$APP_PROMPT" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
    echo -e "${GREEN}Generated app structure:${NC} $APP_NAME"
    # Create a mock file to simulate app creation
    mkdir -p "./dist/${APP_NAME}"
    echo "{\"name\":\"$APP_NAME\",\"prompt\":\"$APP_PROMPT\"}" > "./dist/${APP_NAME}/app.json"
    echo -e "${GREEN}App initialized successfully!${NC}"
    echo "To edit your app, run: ./dev.sh edit $APP_NAME"
    ;;
    
  edit)
    APP_NAME=$1
    if [ -z "$APP_NAME" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      echo -e "Usage: ./dev.sh edit [app_name]"
      exit 1
    fi
    echo -e "${BLUE}Opening UI editor for app:${NC} $APP_NAME"
    
    # Check if app exists
    if [ ! -d "./dist/${APP_NAME}" ]; then
      echo -e "${RED}Error: App not found. Please initialize it first with:${NC}"
      echo "./dev.sh init \"Your app prompt here\""
      exit 1
    fi
    
    # In a real implementation, this would start the UI editor
    # For now, we'll just simulate it
    echo -e "${GREEN}UI editor available at:${NC} http://localhost:3000/edit/$APP_NAME"
    ;;
    
  preview)
    APP_NAME=$1
    if [ -z "$APP_NAME" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      echo -e "Usage: ./dev.sh preview [app_name] [--device=device_type]"
      exit 1
    fi
    
    # Parse options
    DEVICE="iphone"
    for arg in "$@"; do
      case $arg in
        --device=*)
          DEVICE="${arg#*=}"
          ;;
      esac
    done
    
    echo -e "${BLUE}Opening preview for app:${NC} $APP_NAME"
    echo -e "${BLUE}Device:${NC} $DEVICE"
    
    # Check if app exists
    if [ ! -d "./dist/${APP_NAME}" ]; then
      echo -e "${RED}Error: App not found. Please initialize it first with:${NC}"
      echo "./dev.sh init \"Your app prompt here\""
      exit 1
    fi
    
    # In a real implementation, this would start the preview engine
    # For now, we'll just simulate it
    echo -e "${GREEN}Preview available at:${NC} http://localhost:3001/preview/$APP_NAME?device=$DEVICE"
    ;;
    
  deploy)
    APP_NAME=$1
    if [ -z "$APP_NAME" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      echo -e "Usage: ./dev.sh deploy [app_name] [--target=target_platform]"
      exit 1
    fi
    
    # Parse options
    TARGET="pwa"
    for arg in "$@"; do
      case $arg in
        --target=*)
          TARGET="${arg#*=}"
          ;;
      esac
    done
    
    echo -e "${BLUE}Deploying app:${NC} $APP_NAME"
    echo -e "${BLUE}Target platform:${NC} $TARGET"
    
    # Check if app exists
    if [ ! -d "./dist/${APP_NAME}" ]; then
      echo -e "${RED}Error: App not found. Please initialize it first with:${NC}"
      echo "./dev.sh init \"Your app prompt here\""
      exit 1
    fi
    
    # In a real implementation, this would call the deployer agent
    # For now, we'll just simulate it
    echo -e "${YELLOW}Deploying...${NC}"
    sleep 2
    echo -e "${GREEN}App deployed successfully!${NC}"
    
    case $TARGET in
      pwa)
        echo -e "${GREEN}PWA available at:${NC} https://$APP_NAME.example.com"
        ;;
      expo)
        echo -e "${GREEN}Expo app available at:${NC} exp://exp.host/@appgenie/$APP_NAME"
        ;;
      native)
        echo -e "${GREEN}Native app builds:${NC}"
        echo -e "Android APK: ./dist/$APP_NAME/$APP_NAME.apk"
        echo -e "iOS IPA: ./dist/$APP_NAME/$APP_NAME.ipa"
        ;;
    esac
    ;;
    
  list)
    echo -e "${BLUE}Available apps:${NC}"
    
    # Check if dist directory exists
    if [ ! -d "./dist" ]; then
      echo -e "${YELLOW}No apps found. Initialize one with:${NC}"
      echo "./dev.sh init \"Your app prompt here\""
      exit 0
    fi
    
    # List directories in dist
    APP_COUNT=0
    for app in ./dist/*/; do
      if [ -f "${app}app.json" ]; then
        APP_NAME=$(basename "$app")
        APP_PROMPT=$(grep -o '"prompt":"[^"]*"' "${app}app.json" | cut -d'"' -f4)
        echo -e "${GREEN}${APP_NAME}${NC} - ${APP_PROMPT}"
        APP_COUNT=$((APP_COUNT + 1))
      fi
    done
    
    if [ $APP_COUNT -eq 0 ]; then
      echo -e "${YELLOW}No apps found. Initialize one with:${NC}"
      echo "./dev.sh init \"Your app prompt here\""
    fi
    ;;
    
  serve)
    echo -e "${BLUE}Starting development server...${NC}"
    start_mcp_server
    echo -e "${GREEN}Development server running.${NC}"
    echo -e "AppGenie available at: http://localhost:3000"
    
    # In a real implementation, this would start a development server
    # For now, we'll just simulate it by waiting for ctrl+c
    echo
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    trap 'echo -e "\n${RED}Server stopped${NC}"; exit 0' INT
    while true; do sleep 1; done
    ;;
    
  remember)
    KEY=$1
    shift
    DATA="$@"
    if [ -z "$KEY" ] || [ -z "$DATA" ]; then
      echo -e "${RED}Error: Both key and data are required${NC}"
      echo -e "Usage: ./dev.sh remember [key] [data]"
      exit 1
    fi
    echo -e "${BLUE}Saving context to memory...${NC}"
    echo -e "${BLUE}Key:${NC} $KEY"
    
    # Call the remember CLI script
    npx tsx cli/remember.ts "$KEY" "$DATA"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Context saved successfully!${NC}"
    else
      echo -e "${RED}Failed to save context${NC}"
      exit 1
    fi
    ;;
    
  recall)
    KEY=$1
    if [ -z "$KEY" ]; then
      echo -e "${RED}Error: Key is required${NC}"
      echo -e "Usage: ./dev.sh recall [key]"
      exit 1
    fi
    echo -e "${BLUE}Retrieving context from memory...${NC}"
    echo -e "${BLUE}Key:${NC} $KEY"
    
    # Call the recall functionality (assuming it's in cli/recall.ts)
    npx tsx cli/recall.ts "$KEY"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Context retrieved successfully!${NC}"
    else
      echo -e "${YELLOW}No context found for key: $KEY${NC}"
    fi
    ;;
    
  trace)
    AGENT=$1
    echo -e "${BLUE}Displaying agent execution logs...${NC}"
    
    # Check if specific agent is requested
    if [ -n "$AGENT" ]; then
      echo -e "${BLUE}Agent:${NC} $AGENT"
      LOG_FILE="./logs/agents/${AGENT}.log"
      
      if [ -f "$LOG_FILE" ]; then
        echo -e "${GREEN}Showing logs for agent: $AGENT${NC}"
        echo "----------------------------------------"
        tail -n 50 "$LOG_FILE"
      else
        echo -e "${YELLOW}No logs found for agent: $AGENT${NC}"
        echo -e "Available agents:"
        if [ -d "./logs/agents" ]; then
          ls -1 ./logs/agents/*.log 2>/dev/null | sed 's|./logs/agents/||g' | sed 's|.log||g' | sed 's/^/  /'
        else
          echo -e "  ${YELLOW}No agent logs available${NC}"
        fi
      fi
    else
      # Show all recent agent logs
      echo -e "${GREEN}Recent agent execution logs:${NC}"
      echo "----------------------------------------"
      
      if [ -d "./logs/agents" ]; then
        # Show last 10 lines from each agent log
        for log_file in ./logs/agents/*.log; do
          if [ -f "$log_file" ]; then
            AGENT_NAME=$(basename "$log_file" .log)
            echo -e "\n${BLUE}[$AGENT_NAME]${NC}"
            tail -n 10 "$log_file"
            echo "----------------------------------------"
          fi
        done
      else
        echo -e "${YELLOW}No agent logs available${NC}"
        echo -e "Agent logs will be created in: ./logs/agents/"
      fi
    fi
    ;;
    
  help|*)
    show_help
    ;;
esac