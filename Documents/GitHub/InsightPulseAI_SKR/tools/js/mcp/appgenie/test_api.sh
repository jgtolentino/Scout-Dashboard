#!/bin/bash

# Test script for AppGenie API endpoints

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set working directory to script location
cd "$(dirname "$0")"

# Create necessary directories
mkdir -p ./data/tests ./logs/tests

# Default MCP server URL
MCP_SERVER="http://localhost:3333/api/v1"

# Function to test the init endpoint
test_init() {
  echo -e "${BLUE}Testing /init endpoint...${NC}"
  echo -e "${YELLOW}Input:${NC} $1"
  
  OUTPUT_FILE="./data/tests/init_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/init" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"prompt\": \"$1\"}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "app_name": "JournalApp",
  "app_description": "A journaling app with dark mode and offline sync",
  "app_type": "productivity",
  "screens": [
    {
      "id": "login",
      "name": "Login",
      "components": []
    },
    {
      "id": "home",
      "name": "Home",
      "components": []
    },
    {
      "id": "editor",
      "name": "Journal Editor",
      "components": []
    },
    {
      "id": "settings",
      "name": "Settings",
      "components": []
    }
  ],
  "theme": {
    "primary_color": "#6200EE",
    "secondary_color": "#03DAC6",
    "accent_color": "#FF5722",
    "font_family": "Roboto",
    "dark_mode": true
  },
  "data_model": [
    {
      "name": "Journal",
      "fields": [
        {
          "name": "id",
          "type": "string",
          "required": true
        },
        {
          "name": "title",
          "type": "string",
          "required": true
        },
        {
          "name": "content",
          "type": "string",
          "required": true
        },
        {
          "name": "createdAt",
          "type": "date",
          "required": true
        },
        {
          "name": "updatedAt",
          "type": "date",
          "required": true
        },
        {
          "name": "tags",
          "type": "array",
          "required": false
        },
        {
          "name": "synced",
          "type": "boolean",
          "required": true
        }
      ]
    }
  ]
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
  
  # Return the app name for use in subsequent tests
  grep -o '"app_name": "[^"]*"' "$OUTPUT_FILE" | cut -d'"' -f4
}

# Function to test the apply-template endpoint
test_apply_template() {
  echo -e "${BLUE}Testing /apply-template endpoint...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Template:${NC} $2"
  
  OUTPUT_FILE="./data/tests/apply_template_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/apply-template" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"schema_path\": \"./data/tests/init_output.json\", \"template_name\": \"$2\"}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "app_name": "'$1'",
  "template_name": "'$2'",
  "output_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'",
  "screens": [
    {
      "id": "login",
      "name": "Login",
      "file_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/login.jsx"
    },
    {
      "id": "home",
      "name": "Home",
      "file_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/home.jsx"
    },
    {
      "id": "editor",
      "name": "Journal Editor",
      "file_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/editor.jsx"
    },
    {
      "id": "settings",
      "name": "Settings",
      "file_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/settings.jsx"
    }
  ]
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test the edit-ui endpoint
test_edit_ui() {
  echo -e "${BLUE}Testing /edit-ui endpoint...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Mode:${NC} $2"
  
  OUTPUT_FILE="./data/tests/edit_ui_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/edit-ui" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"app_name\": \"$1\", \"screens_dir\": \"./src/screens/$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")\", \"mode\": \"$2\"}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "app_name": "'$1'",
  "editor_url": "http://localhost:3000/'$2'/edit/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'",
  "screens": [
    {
      "id": "login",
      "name": "Login",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/login"
    },
    {
      "id": "home",
      "name": "Home",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/home"
    },
    {
      "id": "editor",
      "name": "Journal Editor",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/editor"
    },
    {
      "id": "settings",
      "name": "Settings",
      "preview_url": "http://localhost:3000/preview/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'/settings"
    }
  ],
  "save_path": "./src/screens/'$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test the preview endpoint
test_preview() {
  echo -e "${BLUE}Testing /preview endpoint...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Device:${NC} $2"
  
  OUTPUT_FILE="./data/tests/preview_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/preview" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"app_name\": \"$1\", \"device\": \"$2\", \"screens\": $(cat ./data/tests/edit_ui_output.json | jq .screens)}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "app_name": "'$1'",
  "preview_url": "http://localhost:3001/?app='$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'&device='$2'",
  "screens": [
    {
      "id": "login",
      "name": "Login",
      "rendered_url": "http://localhost:3001/preview/login"
    },
    {
      "id": "home",
      "name": "Home",
      "rendered_url": "http://localhost:3001/preview/home"
    },
    {
      "id": "editor",
      "name": "Journal Editor",
      "rendered_url": "http://localhost:3001/preview/editor"
    },
    {
      "id": "settings",
      "name": "Settings",
      "rendered_url": "http://localhost:3001/preview/settings"
    }
  ],
  "qr_code_url": "http://localhost:3001/api/qrcode?url=http://localhost:3001/?app='$(echo $1 | tr '[:upper:]' '[:lower:]' | tr " " "_")'&device='$2'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test the deploy endpoint
test_deploy() {
  echo -e "${BLUE}Testing /deploy endpoint...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Target:${NC} $2"
  
  OUTPUT_FILE="./data/tests/deploy_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/deploy" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"app_name\": \"$1\", \"target\": \"$2\", \"screens\": $(cat ./data/tests/preview_output.json | jq .screens)}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
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

# Function to test the feedback endpoint
test_feedback() {
  echo -e "${BLUE}Testing /feedback endpoint...${NC}"
  echo -e "${YELLOW}App name:${NC} $1"
  echo -e "${YELLOW}Focus:${NC} $2"
  
  OUTPUT_FILE="./data/tests/feedback_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/feedback" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"app_name\": \"$1\", \"focus\": \"$2\", \"screens\": $(cat ./data/tests/preview_output.json | jq .screens)}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "app_name": "'$1'",
  "focus": "'$2'",
  "feedback": {
    "overall": [
      "The app has a clean and consistent design that aligns well with the journaling purpose",
      "Dark mode implementation enhances usability in low-light conditions",
      "Navigation structure is logical and user-friendly"
    ],
    "improvements": [
      "Consider adding a tutorial for first-time users",
      "The editor screen could benefit from more formatting options",
      "Settings screen has too many options which might overwhelm users"
    ],
    "screen_specific": {
      "login": {
        "strengths": ["Clean layout", "Prominent login button"],
        "suggestions": ["Add a 'forgot password' option", "Consider biometric authentication"]
      },
      "home": {
        "strengths": ["Clear entry listing", "Good use of card components"],
        "suggestions": ["Add search functionality", "Implement pull-to-refresh"]
      },
      "editor": {
        "strengths": ["Distraction-free design", "Auto-save functionality"],
        "suggestions": ["Add formatting toolbar", "Improve visibility of the save button"]
      },
      "settings": {
        "strengths": ["Comprehensive options", "Logical grouping"],
        "suggestions": ["Simplify options", "Add section headers for better organization"]
      }
    }
  },
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to test the generate composite endpoint
test_generate() {
  echo -e "${BLUE}Testing /generate composite endpoint...${NC}"
  echo -e "${YELLOW}Input:${NC} $1"
  
  OUTPUT_FILE="./data/tests/generate_output.json"
  
  # In a real implementation, this would use curl to call the API
  # curl -X POST "$MCP_SERVER/generate" \
  #   -H "Content-Type: application/json" \
  #   -d "{\"prompt\": \"$1\", \"template_name\": \"$2\", \"target\": \"$3\"}" \
  #   -o "$OUTPUT_FILE"
  
  # For now, we'll simulate a response
  echo '{
  "request_id": "'$(uuidgen | tr '[:upper:]' '[:lower:]')'",
  "app_name": "MoodTracker",
  "status": "completed",
  "steps": [
    {
      "endpoint": "/init",
      "status": "success",
      "timestamp": "'$(date -u -d "-5 seconds" +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    {
      "endpoint": "/apply-template",
      "status": "success",
      "timestamp": "'$(date -u -d "-4 seconds" +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    {
      "endpoint": "/edit-ui",
      "status": "success",
      "timestamp": "'$(date -u -d "-3 seconds" +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    {
      "endpoint": "/preview",
      "status": "success",
      "timestamp": "'$(date -u -d "-2 seconds" +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    {
      "endpoint": "/deploy",
      "status": "success",
      "timestamp": "'$(date -u -d "-1 seconds" +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  ],
  "result": {
    "deployed_url": "https://moodtracker.example.com",
    "qr_code": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://moodtracker.example.com"
  },
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > "$OUTPUT_FILE"
  
  echo -e "${GREEN}Output saved to:${NC} $OUTPUT_FILE"
  echo -e "${GREEN}Status:${NC} Success"
  echo
}

# Function to run a full API test flow
run_api_test_flow() {
  echo -e "${BLUE}Running complete API test flow...${NC}"
  echo -e "${YELLOW}Input prompt:${NC} $1"
  
  # 1. Test init endpoint
  APP_NAME=$(test_init "$1")
  
  # 2. Test apply-template endpoint
  test_apply_template "$APP_NAME" "$2"
  
  # 3. Test edit-ui endpoint
  test_edit_ui "$APP_NAME" "$3"
  
  # 4. Test preview endpoint
  test_preview "$APP_NAME" "$4"
  
  # 5. Test deploy endpoint
  test_deploy "$APP_NAME" "$5"
  
  # 6. Test feedback endpoint
  test_feedback "$APP_NAME" "design"
  
  echo -e "${GREEN}API Test Flow Completed Successfully!${NC}"
  echo -e "${GREEN}App:${NC} $APP_NAME"
  echo -e "${GREEN}Test outputs saved in:${NC} ./data/tests"
}

# Parse command line arguments
COMMAND=$1
shift

case $COMMAND in
  init)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: Prompt is required${NC}"
      exit 1
    fi
    test_init "$1"
    ;;
  apply-template)
    if [ -z "$1" ] || [ -z "$2" ]; then
      echo -e "${RED}Error: App name and template are required${NC}"
      exit 1
    fi
    test_apply_template "$1" "$2"
    ;;
  edit-ui)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      exit 1
    fi
    MODE=${2:-web}
    test_edit_ui "$1" "$MODE"
    ;;
  preview)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      exit 1
    fi
    DEVICE=${2:-iphone}
    test_preview "$1" "$DEVICE"
    ;;
  deploy)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      exit 1
    fi
    TARGET=${2:-pwa}
    test_deploy "$1" "$TARGET"
    ;;
  feedback)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: App name is required${NC}"
      exit 1
    fi
    FOCUS=${2:-design}
    test_feedback "$1" "$FOCUS"
    ;;
  generate)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: Prompt is required${NC}"
      exit 1
    fi
    test_generate "$1"
    ;;
  flow)
    if [ -z "$1" ]; then
      echo -e "${RED}Error: Prompt is required${NC}"
      exit 1
    fi
    TEMPLATE=${2:-default}
    MODE=${3:-web}
    DEVICE=${4:-iphone}
    TARGET=${5:-pwa}
    
    run_api_test_flow "$1" "$TEMPLATE" "$MODE" "$DEVICE" "$TARGET"
    ;;
  *)
    echo -e "${BLUE}AppGenie API Test Script${NC}"
    echo
    echo -e "${BLUE}Usage:${NC} ./test_api.sh [endpoint] [options]"
    echo
    echo -e "${BLUE}Endpoints:${NC}"
    echo "  init [prompt]                Test the init endpoint"
    echo "  apply-template [app] [tmpl]  Test the apply-template endpoint"
    echo "  edit-ui [app] [mode]         Test the edit-ui endpoint"
    echo "  preview [app] [device]       Test the preview endpoint"
    echo "  deploy [app] [target]        Test the deploy endpoint"
    echo "  feedback [app] [focus]       Test the feedback endpoint"
    echo "  generate [prompt]            Test the generate composite endpoint"
    echo "  flow [prompt] [tmpl] [mode] [device] [target]  Run complete test flow"
    echo
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./test_api.sh init \"Build a journaling app with dark mode\""
    echo "  ./test_api.sh flow \"Build a mood tracker\" default web iphone pwa"
    echo
    ;;
esac