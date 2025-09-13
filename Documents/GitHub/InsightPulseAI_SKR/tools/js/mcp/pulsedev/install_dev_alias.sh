#!/bin/bash
# Install the 'dev' command globally

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEV_SCRIPT="$SCRIPT_DIR/dev.sh"

# Determine which shell configuration file to modify
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    echo "Adding alias to .zshrc..."
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    echo "Adding alias to .bashrc..."
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
    echo "Adding alias to .bash_profile..."
else
    echo "Could not find a shell configuration file (.zshrc, .bashrc, or .bash_profile)."
    echo "Please add the following line to your shell configuration file manually:"
    echo "alias dev='$DEV_SCRIPT'"
    exit 1
fi

# Check if the alias already exists
if grep -q "alias dev=" "$SHELL_CONFIG"; then
    echo "The 'dev' alias already exists in $SHELL_CONFIG."
    echo "Updating it to point to the current location..."
    # Update the existing alias
    sed -i.bak "/alias dev=/c\\alias dev='$DEV_SCRIPT'" "$SHELL_CONFIG"
else
    # Add the alias to the shell configuration file
    echo "" >> "$SHELL_CONFIG"
    echo "# PulseDev launcher alias" >> "$SHELL_CONFIG"
    echo "alias dev='$DEV_SCRIPT'" >> "$SHELL_CONFIG"
fi

echo "✅ The 'dev' alias has been installed successfully!"
echo ""
echo "To use it, either restart your terminal or run:"
echo "source $SHELL_CONFIG"
echo ""
echo "Then simply type 'dev' anywhere to launch PulseDev."