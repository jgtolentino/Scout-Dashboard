#!/bin/bash
#
# pulser_aliases.sh - Useful aliases for Pulser CLI interactions
#
# Source this file in your .bashrc, .zshrc, or other shell configuration:
# source /path/to/pulser_aliases.sh

# Ollama local inference
alias pulser-local="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"
alias pulserl="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"
alias pulser-free="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"
alias free="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"

# Interactive mode
alias pulser-chat="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py --stream"
alias pulserc="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py --stream"
alias pulser-shell="$(dirname "$0")/scripts/pulser_shell.sh"

# Use a specific model (mistral, llama2, etc)
alias pulser-mistral="PULSER_MODEL=mistral python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"
alias pulser-llama="PULSER_MODEL=llama2 python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"
alias pulser-codellama="PULSER_MODEL=codellama python3 $(dirname "$0")/scripts/pulser_infer_ollama.py"

# Ollama management
alias pulser-models="curl -s http://127.0.0.1:11434/api/tags | jq '.models[].name' 2>/dev/null || curl -s http://127.0.0.1:11434/api/tags"
alias pulser-reset="ollama run mistral"
alias pulser-pull="ollama pull mistral"
alias pulser-ensure="python3 $(dirname "$0")/scripts/pulser_infer_ollama.py --ensure-mistral"

# SKR operations with Pointer
alias pulser-search="$(dirname "$0")/scripts/pointer_launch.sh --search"
alias pulser-dedupe="$(dirname "$0")/scripts/skr_dedupe.py"
alias pulser-backup="$(dirname "$0")/scripts/pointer_launch.sh --backup"

# Pilot test operations
alias pulser-test="$(dirname "$0")/scripts/pilot_test.sh --run"
alias pulser-test-custom="$(dirname "$0")/scripts/pilot_test.sh --custom"

echo "Pulser CLI aliases loaded! Try 'pulserl' or 'pulser-local' to use local Ollama inference."