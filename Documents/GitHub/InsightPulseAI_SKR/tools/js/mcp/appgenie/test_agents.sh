#!/bin/bash

# Test script for validating AppGenie agents in isolation

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set working directory to script location
cd "$(dirname "$0")"

# Create necessary directories
mkdir -p ./data ./logs ./test_outputs

# Function to test nlp-parser agent
test_nlp_parser() {
  echo -e "${BLUE}Testing NLP Parser Agent...${NC}"
  echo -e "${YELLOW}Input:${NC} $1"
  
  # In a real implementation, this would call the MCP server API
  # For now, we'll simulate a response
  OUTPUT_FILE="./test_outputs/nlp_parser_output.json"
  
  # Create a sample output based on the input
  APP_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/^(build|create|make) (an? )?//i' | sed -E 's/\b(app|application)\b//i' | awk '{print $1}')
  
  echo '{
  "app_name": "'$APP_NAME'",
  "app_description": "'"$1"'",
  "app_type": "utility",
  "screens": [
    {
      "id": "onboarding",
      "name": "Welcome",
      "description": "Initial onboarding screen",
      "components": [
        {
          "type": "Image",
          "id": "logo",
          "props": {
            "source": "logo.png",
            "width": 200,
            "height": 200,
            "align": "center"
          }
        },
        {
          "type": "Text",
          "id": "welcome_text",
          "props": {
            "content": "Welcome to '$APP_NAME'",
            "fontSize": 24,
            "fontWeight": "bold",
            "textAlign": "center"
          }
        }
      ]
    },
    {
      "id": "home",
      "name": "Home",
      "description": "Main app screen",
      "components": []
    }
  ],
  "theme": {
    "primary_color": "#4CAF50",
    "secondary_color": "#8BC34A",
    "accent_color": "#FFC107",
    "font_family": "Roboto",
    "dark_mode": false
  },
  "data_model": []
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test template-manager agent
test_template_manager() {
  echo -e "${BLUE}Testing Template Manager Agent...${NC}"
  echo -e "${YELLOW}Input schema:${NC} $1"
  echo -e "${YELLOW}Template:${NC} $2"
  
  # In a real implementation, this would call the MCP server API
  # For now, we'll simulate a response
  OUTPUT_FILE="./test_outputs/template_manager_output.json"
  
  # Extract app name from schema file
  APP_NAME=$(grep -o '"app_name": "[^"]*"' "$1" | cut -d'"' -f4)
  
  echo '{
  "app_name": "'$APP_NAME'",
  "template_name": "'$2'",
  "output_path": "./src/screens/'$(echo $APP_NAME | tr '[:upper:]' '[:lower:]' | tr " " "_")'",
  "screens": [
    {
      "id": "onboarding",
      "name": "Welcome",
      "file_path": "./src/screens/'$(echo $APP_NAME | tr '[:upper:]' '[:lower:]' | tr " " "_")'/onboarding.jsx"
    },
    {
      "id": "home",
      "name": "Home",
      "file_path": "./src/screens/'$(echo $APP_NAME | tr '[:upper:]' '[:lower:]' | tr " " "_")'/home.jsx"
    }
  ]
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test ui-editor agent
test_ui_editor() {
  echo -e "${BLUE}Testing UI Editor Agent...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Screens dir:${NC} $2"
  
  # In a real implementation, this would call the MCP server API
  # For now, we'll simulate a response
  OUTPUT_FILE="./test_outputs/ui_editor_output.json"
  
  echo '{
  "app_name": "'$1'",
  "editor_url": "http://localhost:3000/edit/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'",
  "screens": [
    {
      "id": "onboarding",
      "name": "Welcome",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/onboarding"
    },
    {
      "id": "home",
      "name": "Home",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/home"
    }
  ],
  "save_path": "'$2'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test preview-engine agent
test_preview_engine() {
  echo -e "${BLUE}Testing Preview Engine Agent...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Device:${NC} $2"
  
  # In a real implementation, this would call the MCP server API
  # For now, we'll simulate a response
  OUTPUT_FILE="./test_outputs/preview_engine_output.json"
  
  echo '{
  "app_name": "'$1'",
  "preview_url": "http://localhost:3001/?app='$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'&device='$2'",
  "screens": [
    {
      "id": "onboarding",
      "name": "Welcome",
      "rendered_url": "http://localhost:3001/preview/onboarding"
    },
    {
      "id": "home",
      "name": "Home",
      "rendered_url": "http://localhost:3001/preview/home"
    }
  ],
  "qr_code_url": "http://localhost:3001/api/qrcode?url=http://localhost:3001/?app='$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'&device='$2'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test deployer agent
test_deployer() {
  echo -e "${BLUE}Testing Deployer Agent...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Target:${NC} $2"
  
  # In a real implementation, this would call the MCP server API
  # For now, we'll simulate a response
  OUTPUT_FILE="./test_outputs/deployer_output.json"
  
  DEPLOYED_URL=""
  QR_CODE=""
  APP_STORE_LINKS=""
  
  case $2 in
    pwa)
      DEPLOYED_URL="https://"$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "-")".example.com"
      QR_CODE="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${DEPLOYED_URL}"
      ;;
    expo)
      DEPLOYED_URL="exp://exp.host/@appgenie/"$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "-")
      QR_CODE="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${DEPLOYED_URL}"
      ;;
    native)
      DEPLOYED_URL="https://appgenie.example.com/apps/"$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "-")
      APP_STORE_LINKS='"app_store_links": {
      "ios": "https://apps.apple.com/app/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "-")'",
      "android": "https://play.google.com/store/apps/details?id=com.appgenie.'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'"
    },'
      ;;
  esac
  
  echo '{
  "app_name": "'$1'",
  "target": "'$2'",
  "status": "success",
  "deployed_url": "'$DEPLOYED_URL'",
  "build_logs": "Build completed successfully",
  '${QR_CODE:+'"qr_code": "'$QR_CODE'",'}
  '${APP_STORE_LINKS}
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to run a full integration test
run_integration_test() {
  echo -e "${BLUE}Running Integration Test...${NC}"
  echo -e "${YELLOW}Input prompt:${NC} $1"
  
  # 1. Run NLP Parser
  test_nlp_parser "$1"
  
  # Extract app name from NLP parser output
  APP_NAME=$(grep -o '"app_name": "[^"]*"' "./test_outputs/nlp_parser_output.json" | cut -d'"' -f4)
  
  # 2. Run Template Manager
  test_template_manager "./test_outputs/nlp_parser_output.json" "default"
  
  # 3. Run UI Editor
  SCREENS_DIR="./src/screens/$(echo $APP_NAME | tr '[:upper:]' '[:lower:]' | tr " " "_")"
  mkdir -p "$SCREENS_DIR"
  test_ui_editor "$APP_NAME" "$SCREENS_DIR"
  
  # 4. Run Preview Engine
  test_preview_engine "$APP_NAME" "iphone"
  
  # 5. Run Deployer
  test_deployer "$APP_NAME" "pwa"
  
  echo -e "${GREEN}Integration Test Completed Successfully!${NC}"
  echo -e "${GREEN}App:${NC} $APP_NAME"
  echo -e "${GREEN}Files generated in:${NC} ./test_outputs"
}

# Display help message
show_help() {
  echo -e "${BLUE}AppGenie Agent Test Script${NC}"
  echo
  echo -e "${BLUE}Usage:${NC} ./test_agents.sh [command] [options]"
  echo
  echo -e "${BLUE}Commands:${NC}"
  echo "  nlp-parser [prompt]    Test the NLP Parser agent"
  echo "  template [schema] [template]   Test the Template Manager agent"
  echo "  ui-editor [app] [dir]  Test the UI Editor agent"
  echo "  preview [app] [device] Test the Preview Engine agent"
  echo "  deployer [app] [target]   Test the Deployer agent"
  echo "  integration [prompt]   Run a full integration test"
  echo "  help                   Show this help message"
  echo
  echo -e "${BLUE}Examples:${NC}"
  echo "  ./test_agents.sh nlp-parser \"Build a habit tracker app\""
  echo "  ./test_agents.sh integration \"Build a recipe sharing app\""
}

# Parse command line arguments
COMMAND=$1
shift

case $COMMAND in
  nlp-parser)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: Prompt is required${NC}"
      exit 1
    fi
    test_nlp_parser "$1"
    ;;
  template)
    if [ -z "$1" ] || [ -z "$2" ]; then
      echo -e "${RED}Error: Schema file and template name are required${NC}"
      exit 1
    fi
    test_template_manager "$1" "$2"
    ;;
  ui-editor)
    if [ -z "$1" ] || [ -z "$2" ]; then
      echo -e "${RED}Error: App name and screens directory are required${NC}"
      exit 1
    fi
    test_ui_editor "$1" "$2"
    ;;
  preview)
    if [ -z "$1" ] || [ -z "$2" ]; then
      echo -e "${RED}Error: App name and device are required${NC}"
      exit 1
    fi
    test_preview_engine "$1" "$2"
    ;;
  deployer)
    if [ -z "$1" ] || [ -z "$2" ]; then
      echo -e "${RED}Error: App name and target are required${NC}"
      exit 1
    fi
    test_deployer "$1" "$2"
    ;;
  integration)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: Prompt is required${NC}"
      exit 1
    fi
    run_integration_test "$1"
    ;;
  help|*)
    show_help
    ;;
esac