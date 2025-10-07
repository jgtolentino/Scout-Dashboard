#!/bin/bash
# Setup script for the :verify CLI command

# Check if .zshrc exists in the home directory
if [ -f ~/.zshrc ]; then
  # Check if the alias already exists
  if grep -q "alias :verify=" ~/.zshrc; then
    echo "🔍 :verify alias already exists in .zshrc"
  else
    # Add the alias to .zshrc
    echo "# Pulser verify alias - Added $(date)" >> ~/.zshrc
    echo "alias :verify='/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/pulser-verify.sh'" >> ~/.zshrc
    echo "✅ Added :verify alias to .zshrc"
  fi
  
  # Source the updated .zshrc
  echo "🔄 Reloading .zshrc to activate the alias"
  source ~/.zshrc 2>/dev/null || echo "⚠️ Please run 'source ~/.zshrc' manually to activate the alias"
else
  echo "⚠️ .zshrc not found in home directory. Manual setup required."
  echo "Add this line to your shell configuration file:"
  echo "alias :verify='/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/scripts/pulser-verify.sh'"
fi

echo "📝 Usage: Type ':verify' in your terminal to run the verification script"