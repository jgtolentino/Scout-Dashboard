#!/bin/bash
# pulser_shell_functions.sh
# Shell functions for Pulser CLI with Claude integration
# Updated: May 10, 2025 - Removed clodrep references, added Claude prompt executor aliases

# Pulser Claude prompt test alias
prompt-test() {
  pulser prompt test "$@"
}

# Prompt sync alias
prompt-sync() {
  pulser prompt sync "$@"
}

# Legacy clodrep to Claude migration function
clodrep() {
  echo "⚠️  Warning: clodrep is deprecated. Using Claude prompt executor instead."
  pulser prompt test "$@"
}

# Register aliases in .zshrc
setup_pulser_aliases() {
  if [[ -f "${HOME}/.zshrc" ]]; then
    # Check if aliases are already set up
    if ! grep -q ":prompt-test" "${HOME}/.zshrc"; then
      echo "" >> "${HOME}/.zshrc"
      echo "# Pulser prompt aliases" >> "${HOME}/.zshrc"
      echo "alias :prompt-test='pulser prompt test'" >> "${HOME}/.zshrc"
      echo "alias :prompt-sync='pulser prompt sync'" >> "${HOME}/.zshrc"
      echo "alias :prompt-list='pulser prompt list'" >> "${HOME}/.zshrc"
      echo "alias :prompt-version='pulser prompt version'" >> "${HOME}/.zshrc"
      echo "# Legacy alias with warning" >> "${HOME}/.zshrc"
      echo "alias clodrep='echo \"⚠️  Warning: clodrep is deprecated. Using Claude prompt executor instead.\" && pulser prompt test'" >> "${HOME}/.zshrc"
      echo "Pulser prompt aliases added to .zshrc"
    else
      echo "Pulser prompt aliases already set up"
    fi
  else
    echo "No .zshrc found"
  fi
}

# Main function to configure all shell bindings
configure_shell_bindings() {
  setup_pulser_aliases
  
  echo "Shell bindings have been configured."
  echo "Please run 'source ~/.zshrc' or start a new terminal session to apply changes."
}

# Export functions
export -f prompt-test
export -f prompt-sync
export -f clodrep
export -f setup_pulser_aliases
export -f configure_shell_bindings

# Auto-run configuration if this script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  configure_shell_bindings
fi