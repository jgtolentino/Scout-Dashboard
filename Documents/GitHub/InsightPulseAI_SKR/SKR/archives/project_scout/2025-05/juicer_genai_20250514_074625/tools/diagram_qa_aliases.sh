#!/bin/bash
# diagram_qa_aliases.sh - Convenience aliases for diagram QA tools

# Source this file to add aliases to your shell session
# Example: source ./diagram_qa_aliases.sh

# Base directory setup
export JUICER_DIAGRAM_TOOLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JUICER_PROJECT_ROOT="$(cd "${JUICER_DIAGRAM_TOOLS_DIR}/.." && pwd)"

# Quick QA alias
alias quick-diagram-qa='bash "${JUICER_DIAGRAM_TOOLS_DIR}/run_quick_diagram_qa.sh"'

# Full QA alias
alias full-diagram-qa='bash "${JUICER_DIAGRAM_TOOLS_DIR}/run_complete_diagram_qa.sh"'

# Export diagram alias
alias export-diagram='bash "${JUICER_DIAGRAM_TOOLS_DIR}/export_diagram.sh"'

# Open diagram in browser for visual inspection
alias preview-diagram='bash "${JUICER_DIAGRAM_TOOLS_DIR}/preview_diagram.sh"'

# Common diagram paths shorthand
alias qa-scout='quick-diagram-qa project_scout_with_genai'
alias qa-retail='quick-diagram-qa retail_architecture'
alias qa-azure='quick-diagram-qa azure_medallion'

echo "✅ Diagram QA aliases loaded."
echo ""
echo "Available commands:"
echo "  quick-diagram-qa <diagram-name>  - Run quick QA checks"
echo "  full-diagram-qa <diagram-name>   - Run comprehensive QA"
echo "  export-diagram <diagram-name>    - Generate PNG/SVG exports"
echo "  preview-diagram <diagram-name>   - Open diagram in browser"
echo ""
echo "Shortcuts:"
echo "  qa-scout   - Quick QA on Project Scout diagram"
echo "  qa-retail  - Quick QA on Retail Architecture diagram"
echo "  qa-azure   - Quick QA on Azure Medallion diagram"