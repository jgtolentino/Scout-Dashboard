#!/bin/bash

# 21st Magic Dashboard Shell Script
# 
# A convenient wrapper script for the 21st Magic Dashboard Generator.
# This script provides an easy way to generate, convert, and deploy
# enhanced dashboards with 21st Magic 3D and animation capabilities.
#
# Usage:
#   ./21st_magic_dashboard.sh <command> [options]
#
# Commands:
#   generate   Generate a 21st Magic dashboard from requirements
#   convert    Convert an existing dashboard to 21st Magic format
#   deploy     Deploy a 21st Magic dashboard to Azure Static Web App
#   help       Show help message
#
# See the JavaScript file for detailed options

# Ensure the script is executable
chmod +x ./scripts/21st_magic_dashboard.js

# Pass all arguments to the Node.js script
node ./scripts/21st_magic_dashboard.js "$@"