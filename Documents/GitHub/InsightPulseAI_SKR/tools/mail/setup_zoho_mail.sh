#!/bin/bash
# Setup script for Zoho Mail integration with Pulser

# Color definitions
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              PULSER ZOHO MAIL INTEGRATION SETUP               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Directory paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TOOLS_DIR")"
CONFIG_DIR="$HOME/.pulser"
CREDS_FILE="$CONFIG_DIR/zoho_credentials.json"
FUNCTIONS_FILE="$HOME/.pulser_mail_functions"
LOG_DIR="$CONFIG_DIR/logs"

# Create required directories
echo -e "${YELLOW}Creating required directories...${NC}"
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$SCRIPT_DIR"

# Check for required Python packages
echo -e "${YELLOW}Checking for required Python packages...${NC}"
if ! python3 -c "import requests" &>/dev/null; then
  echo -e "${YELLOW}Installing requests package...${NC}"
  pip3 install requests
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install requests package. Please install it manually:${NC}"
    echo "pip3 install requests"
    exit 1
  fi
fi

# Create signature templates if they don't exist
INTERNAL_SIG="$SCRIPT_DIR/internal_signature.html"
EXTERNAL_SIG="$SCRIPT_DIR/external_signature.html"

if [ ! -f "$INTERNAL_SIG" ]; then
  echo -e "${YELLOW}Creating internal email signature template...${NC}"
  cat > "$INTERNAL_SIG" << EOF
<div style="font-family: Arial, sans-serif; color: #333333; margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 10px;">
  <p style="margin: 0; font-weight: bold;">Pulser</p>
  <p style="margin: 5px 0; font-size: 12px;">InsightPulseAI | Internal Communication</p>
  <p style="margin: 5px 0; font-size: 12px;">Email: pulser@insightpulseai.com</p>
  <p style="margin: 5px 0; font-size: 10px; color: #666666;">This message is intended for internal use only</p>
</div>
EOF
  echo -e "${GREEN}Created internal signature template${NC}"
fi

if [ ! -f "$EXTERNAL_SIG" ]; then
  echo -e "${YELLOW}Creating external email signature template...${NC}"
  cat > "$EXTERNAL_SIG" << EOF
<div style="font-family: Arial, sans-serif; color: #333333; margin-top: 20px; border-top: 1px solid #dddddd; padding-top: 10px;">
  <p style="margin: 0; font-weight: bold;">Pulser AI Assistant</p>
  <p style="margin: 5px 0; font-size: 12px;">InsightPulseAI</p>
  <p style="margin: 5px 0; font-size: 12px;">Email: pulser-ai@insightpulseai.com</p>
  <p style="margin: 5px 0; font-size: 12px;">Web: <a href="https://insightpulseai.com" style="color: #0066cc;">insightpulseai.com</a></p>
  <p style="margin: 8px 0 0 0; font-size: 10px; color: #666666;">This email was sent by an AI assistant and reviewed by the InsightPulseAI team</p>
</div>
EOF
  echo -e "${GREEN}Created external signature template${NC}"
fi

# Create credentials template if it doesn't exist
if [ ! -f "$CREDS_FILE" ]; then
  echo -e "${YELLOW}Creating credentials template...${NC}"
  cat > "$CREDS_FILE" << EOF
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "access_token": "",
  "token_type": "Zoho-oauthtoken",
  "last_updated": ""
}
EOF
  echo -e "${GREEN}Created credentials template at:${NC} $CREDS_FILE"
  echo -e "${YELLOW}Please update this file with your actual Zoho API credentials${NC}"
fi

# Create shell functions for email sending
echo -e "${YELLOW}Creating shell functions for email sending...${NC}"
cat > "$FUNCTIONS_FILE" << 'EOF'
# Pulser Mail Functions

# Configuration
MAIL_CLIENT_PATH="$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/mail/zoho_mail_client.py"
PULSER_INTERNAL_EMAIL="pulser@insightpulseai.com"
PULSER_EXTERNAL_EMAIL="pulser-ai@insightpulseai.com"
INTERNAL_SIGNATURE="$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/mail/internal_signature.html"
EXTERNAL_SIGNATURE="$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/mail/external_signature.html"

# Check for Python and the mail client
if ! command -v python3 &>/dev/null; then
  echo "Error: Python 3 is required for mail functions"
  return 1
fi

if [ ! -f "$MAIL_CLIENT_PATH" ]; then
  echo "Error: Mail client not found at $MAIL_CLIENT_PATH"
  return 1
fi

# Function to send internal emails
pulser_mail_internal() {
  local to_address="$1"
  local subject="$2"
  local body="$3"
  shift 3
  
  local cc_arg=""
  local bcc_arg=""
  
  # Parse additional arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cc)
        cc_arg="--cc \"$2\""
        shift 2
        ;;
      --bcc)
        bcc_arg="--bcc \"$2\""
        shift 2
        ;;
      *)
        echo "Unknown option: $1"
        echo "Usage: pulser_mail_internal TO SUBJECT BODY [--cc CC_EMAIL] [--bcc BCC_EMAIL]"
        return 1
        ;;
    esac
  done
  
  # Check for required arguments
  if [ -z "$to_address" ] || [ -z "$subject" ]; then
    echo "Usage: pulser_mail_internal TO SUBJECT BODY [--cc CC_EMAIL] [--bcc BCC_EMAIL]"
    return 1
  fi
  
  # Use the Python client to send the email
  eval "python3 \"$MAIL_CLIENT_PATH\" send \\
    --from \"$PULSER_INTERNAL_EMAIL\" \\
    --to \"$to_address\" \\
    --subject \"$subject\" \\
    --body \"$body\" \\
    --signature \"$INTERNAL_SIGNATURE\" \\
    --html \\
    $cc_arg $bcc_arg"
}

# Function to send external emails
pulser_mail_external() {
  local to_address="$1"
  local subject="$2"
  local body="$3"
  shift 3
  
  local cc_arg=""
  local bcc_arg=""
  
  # Parse additional arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cc)
        cc_arg="--cc \"$2\""
        shift 2
        ;;
      --bcc)
        bcc_arg="--bcc \"$2\""
        shift 2
        ;;
      *)
        echo "Unknown option: $1"
        echo "Usage: pulser_mail_external TO SUBJECT BODY [--cc CC_EMAIL] [--bcc BCC_EMAIL]"
        return 1
        ;;
    esac
  done
  
  # Check for required arguments
  if [ -z "$to_address" ] || [ -z "$subject" ]; then
    echo "Usage: pulser_mail_external TO SUBJECT BODY [--cc CC_EMAIL] [--bcc BCC_EMAIL]"
    return 1
  fi
  
  # Use the Python client to send the email
  eval "python3 \"$MAIL_CLIENT_PATH\" send \\
    --from \"$PULSER_EXTERNAL_EMAIL\" \\
    --to \"$to_address\" \\
    --subject \"$subject\" \\
    --body \"$body\" \\
    --signature \"$EXTERNAL_SIGNATURE\" \\
    --html \\
    $cc_arg $bcc_arg"
}

# Function to set vacation auto-reply
pulser_mail_vacation() {
  local from_date="$1"
  local to_date="$2"
  local subject="$3"
  local message="$4"
  
  # Check for required arguments
  if [ -z "$from_date" ] || [ -z "$to_date" ] || [ -z "$subject" ] || [ -z "$message" ]; then
    echo "Usage: pulser_mail_vacation FROM_DATE TO_DATE SUBJECT MESSAGE"
    echo "Example: pulser_mail_vacation 2025-06-01 2025-06-15 \"Out of Office\" \"I am currently away\""
    return 1
  fi
  
  # Use the Python client to set vacation auto-reply
  python3 "$MAIL_CLIENT_PATH" settings \
    --vacation enable \
    --from "$from_date" \
    --to "$to_date" \
    --subject "$subject" \
    --message "$message"
}

# Function to disable vacation auto-reply
pulser_mail_vacation_disable() {
  python3 "$MAIL_CLIENT_PATH" settings --vacation disable
}

# Function to list available mail aliases
pulser_mail_aliases() {
  echo "Available mail aliases:"
  echo "- Internal: $PULSER_INTERNAL_EMAIL"
  echo "- External: $PULSER_EXTERNAL_EMAIL"
}

# Function to test mail setup
pulser_mail_test() {
  bash ~/test_zoho_mail.sh "$@"
}
EOF

echo -e "${GREEN}Created mail functions at:${NC} $FUNCTIONS_FILE"

# Source the mail functions in shell config if not already present
ZSHRC="$HOME/.zshrc"
if [ -f "$ZSHRC" ]; then
  if ! grep -q "source.*\.pulser_mail_functions" "$ZSHRC"; then
    echo -e "${YELLOW}Adding mail functions to .zshrc...${NC}"
    echo "" >> "$ZSHRC"
    echo "# Pulser Mail Functions" >> "$ZSHRC"
    echo "if [ -f \$HOME/.pulser_mail_functions ]; then" >> "$ZSHRC"
    echo "  source \$HOME/.pulser_mail_functions" >> "$ZSHRC"
    echo "fi" >> "$ZSHRC"
    echo -e "${GREEN}Added mail functions to .zshrc${NC}"
  else
    echo -e "${GREEN}Mail functions already in .zshrc${NC}"
  fi
fi

# Make test scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x "$HOME/test_zoho_credentials.py" 2>/dev/null
chmod +x "$HOME/test_zoho_mail.sh" 2>/dev/null
chmod +x "$HOME/get_zoho_token.py" 2>/dev/null

# Completion message
echo -e "\n${GREEN}✅ Zoho Mail integration setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Source your shell configuration to load the new functions:"
echo "   source ~/.zshrc"
echo ""
echo "2. Obtain your Zoho OAuth credentials using:"
echo "   python3 ~/get_zoho_token.py"
echo ""
echo "3. Update the credentials file with your OAuth tokens:"
echo "   nano ~/.pulser/zoho_credentials.json"
echo ""
echo "4. Test the integration with:"
echo "   ~/test_zoho_mail.sh --send-email --to your.email@example.com"
echo ""
echo "5. Read the documentation for more details:"
echo "   cat ~/README_zoho_mail_cli.md"
echo ""