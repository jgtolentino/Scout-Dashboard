#!/bin/bash
# add_validate_azure_command.sh - Add the validation command to Pulser CLI
# Part of InsightPulseAI/Pulser toolset

# Find the path to the user's .pulserrc file
PULSERRC_PATH="$HOME/.pulserrc"
ZSHRC_PATH="$HOME/.zshrc"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/validate_pulser_azure_deployment.sh"

echo "Adding :validate-azure-deployment command to Pulser CLI"
echo ""

# Check if the script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Validation script not found at $SCRIPT_PATH"
    exit 1
fi

# Check if .pulserrc exists
if [ -f "$PULSERRC_PATH" ]; then
    echo "Found .pulserrc at $PULSERRC_PATH"
    
    # Check if the command already exists
    if grep -q ":validate-azure-deployment" "$PULSERRC_PATH"; then
        echo "Command already exists in .pulserrc"
    else
        # Add the command to .pulserrc
        echo "" >> "$PULSERRC_PATH"
        echo "# Azure resource validation command" >> "$PULSERRC_PATH"
        echo "alias :validate-azure-deployment='$SCRIPT_PATH'" >> "$PULSERRC_PATH"
        echo "Added command to .pulserrc"
    fi
else
    echo ".pulserrc not found, will try .zshrc"
    
    # Check if .zshrc exists
    if [ -f "$ZSHRC_PATH" ]; then
        echo "Found .zshrc at $ZSHRC_PATH"
        
        # Check if the command already exists
        if grep -q ":validate-azure-deployment" "$ZSHRC_PATH"; then
            echo "Command already exists in .zshrc"
        else
            # Add the command to .zshrc
            echo "" >> "$ZSHRC_PATH"
            echo "# Pulser Azure resource validation command" >> "$ZSHRC_PATH"
            echo "alias :validate-azure-deployment='$SCRIPT_PATH'" >> "$ZSHRC_PATH"
            echo "Added command to .zshrc"
        fi
    else
        echo "Neither .pulserrc nor .zshrc found."
        echo "Please add the following line to your shell configuration file:"
        echo ""
        echo "alias :validate-azure-deployment='$SCRIPT_PATH'"
    fi
fi

echo ""
echo "To use the command, either:"
echo "1. Restart your shell, or"
echo "2. Run: source $PULSERRC_PATH (or source $ZSHRC_PATH)"
echo ""
echo "Then you can use the command: :validate-azure-deployment"