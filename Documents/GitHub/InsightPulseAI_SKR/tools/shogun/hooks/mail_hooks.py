#!/usr/bin/env python3
"""
Mail Configuration Hooks for Shogun
Updates mail configuration after successful authentication
"""

import os
import logging
import json
from datetime import datetime

def update_mail_config(flow_config, auth_result, **kwargs):
    """
    Update mail configuration after successful authentication
    
    Args:
        flow_config: Dictionary with flow configuration
        auth_result: Result of authentication flow
        
    Returns:
        Dictionary with success/failure status and details
    """
    if not auth_result.get('success'):
        logging.error(f"Authentication failed, not updating mail configuration")
        return {
            "success": False,
            "error": "Authentication failed",
            "details": {}
        }
    
    # Configuration paths
    mail_functions_path = os.path.expanduser("~/.pulser_mail_functions")
    
    try:
        # Log the update
        logging.info(f"Updating mail configuration at {mail_functions_path}")
        
        # Check if we need to create the mail functions file
        create_new = not os.path.exists(mail_functions_path)
        
        # Default content for new file
        if create_new:
            content = """# Pulser Mail Functions

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
        cc_arg="--cc \\"$2\\""
        shift 2
        ;;
      --bcc)
        bcc_arg="--bcc \\"$2\\""
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
  eval "python3 \\"$MAIL_CLIENT_PATH\\" send \\
    --from \\"$PULSER_INTERNAL_EMAIL\\" \\
    --to \\"$to_address\\" \\
    --subject \\"$subject\\" \\
    --body \\"$body\\" \\
    --signature \\"$INTERNAL_SIGNATURE\\" \\
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
        cc_arg="--cc \\"$2\\""
        shift 2
        ;;
      --bcc)
        bcc_arg="--bcc \\"$2\\""
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
  eval "python3 \\"$MAIL_CLIENT_PATH\\" send \\
    --from \\"$PULSER_EXTERNAL_EMAIL\\" \\
    --to \\"$to_address\\" \\
    --subject \\"$subject\\" \\
    --body \\"$body\\" \\
    --signature \\"$EXTERNAL_SIGNATURE\\" \\
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
    echo "Example: pulser_mail_vacation 2025-06-01 2025-06-15 \\"Out of Office\\" \\"I am currently away\\""
    return 1
  fi
  
  # Use the Python client to set vacation auto-reply
  python3 "$MAIL_CLIENT_PATH" settings \\
    --vacation enable \\
    --from "$from_date" \\
    --to "$to_date" \\
    --subject "$subject" \\
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

# Function to renew the access token
pulser_mail_renew() {
  python3 "$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/mail/token_manager.py" refresh-token
}

# Mail command namespace
mail:internal() {
  pulser_mail_internal "$@"
}

mail:external() {
  pulser_mail_external "$@"
}

mail:vacation() {
  pulser_mail_vacation "$@"
}

mail:renew() {
  pulser_mail_renew
}

mail:setup() {
  echo "Launching Shogun OAuth flow for Zoho Mail..."
  python3 "$HOME/Documents/GitHub/InsightPulseAI_SKR/tools/shogun/handlers/headless_oauth.py"
}

# Last updated by Shogun: {timestamp}
"""
            # Add timestamp
            content = content.replace("{timestamp}", datetime.now().isoformat())
            
            with open(mail_functions_path, 'w') as f:
                f.write(content)
            
            # Make the file executable
            os.chmod(mail_functions_path, 0o755)
            
            logging.info(f"Created new mail functions file at {mail_functions_path}")
        else:
            # Just update the timestamp in the existing file
            with open(mail_functions_path, 'r') as f:
                content = f.read()
            
            # Update the timestamp
            if "# Last updated by Shogun:" in content:
                content = content.replace(
                    "# Last updated by Shogun: ", 
                    f"# Last updated by Shogun: {datetime.now().isoformat()}"
                )
            else:
                content += f"\n# Last updated by Shogun: {datetime.now().isoformat()}\n"
            
            with open(mail_functions_path, 'w') as f:
                f.write(content)
            
            logging.info(f"Updated timestamp in mail functions file")
        
        # Update shell config if not already there
        zshrc_path = os.path.expanduser("~/.zshrc")
        if os.path.exists(zshrc_path):
            with open(zshrc_path, 'r') as f:
                zshrc_content = f.read()
            
            if ".pulser_mail_functions" not in zshrc_content:
                with open(zshrc_path, 'a') as f:
                    f.write("\n# Pulser Mail Functions\n")
                    f.write("if [ -f $HOME/.pulser_mail_functions ]; then\n")
                    f.write("  source $HOME/.pulser_mail_functions\n")
                    f.write("fi\n")
                
                logging.info(f"Added mail functions to shell configuration")
        
        return {
            "success": True,
            "details": {
                "mail_functions_path": mail_functions_path,
                "created_new": create_new
            }
        }
    except Exception as e:
        logging.error(f"Error updating mail configuration: {e}")
        return {
            "success": False,
            "error": f"Error updating mail configuration: {str(e)}",
            "details": {}
        }