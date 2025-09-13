#!/bin/bash
# OpsCore Installer for Project Scout
# This script installs the OpsCore CLI and Retail Advisor components

# Create config directory
mkdir -p ~/.opscore/hooks/

# Copy configuration files
cp config/opscore-config.yaml ~/.opscore/
cp config/retail-advisor-hook.yaml ~/.opscore/hooks/

# Set up CLI
npm install -g opscore-cli

# Configure environment
echo 'export PATH=$PATH:~/.opscore/bin' >> ~/.bashrc
echo 'export OPSCORE_HOME=~/.opscore' >> ~/.bashrc

# Set up aliases
cat > ~/.opscore_aliases << EOF
alias opscore='opscore-cli'
alias :retail-advisor='opscore retail-advisor'
EOF

echo 'source ~/.opscore_aliases' >> ~/.bashrc

# Complete installation
echo "OpsCore installation complete!"
echo "Restart your terminal or run 'source ~/.bashrc' to start using OpsCore"
