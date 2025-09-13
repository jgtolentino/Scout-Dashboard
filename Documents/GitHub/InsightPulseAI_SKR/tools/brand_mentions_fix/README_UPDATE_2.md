# Pulser CLI Enhancements Update 2

New enhancements have been added to the Pulser CLI experience:

## 1. Environment Variable Detection

The shell now automatically detects environment variable assignments and treats them as shell commands, not model prompts. This solves the common issue where users were trying to set variables only to have them interpreted as prompts.

**Supported formats:**
- `VAR=value`
- `VAR='value with spaces'`
- `export VAR=value`

**Example:**
```
pulser[🔵 prompt]> API_KEY='my-secret-key'
```
This is now correctly executed as a shell command rather than sent to the model as a prompt.

## 2. Color Testing Utility

A new `:colors` command has been added to:
- Test terminal color support
- Display available color codes
- Provide examples for using colors in your shell

**Example output:**
```
🎨 Terminal Color Test

✅ GREEN
✅ BLUE
✅ RED
✅ YELLOW
✅ MAGENTA
✅ CYAN
✅ WHITE
✅ BOLD
✅ RESET

Use with: !echo -e "${GREEN}Text here${RESET}"
Add to your shell: !export GREEN='\033[32m' RESET='\033[0m'
```

## Usage

Both enhancements are automatically available in the latest version of the enhanced Pulser CLI. No additional configuration is required.

To use environment variable assignment:
```
pulser[🔵 prompt]> API_URL='https://api.example.com'
pulser[🔵 prompt]> export DEBUG=true
```

To test terminal color support:
```
pulser[🔵 prompt]> :colors
```

## Implementation Notes

1. **Variable Detection**: Uses a regex pattern `^(export\s+)?[A-Z_][A-Z0-9_]*='?.*'?$` to detect variable assignments.

2. **Color Testing**: The `:colors` command tests terminal support for common ANSI color codes and provides usage examples.

These enhancements further improve the Pulser CLI workflow by reducing friction when switching between shell operations and model interactions.