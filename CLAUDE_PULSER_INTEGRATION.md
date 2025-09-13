# Claude Code CLI Integration for Pulser

This integration enhances the Pulser shell experience to match the Claude Code CLI interface, providing a consistent user experience across both tools.

## Key Features

- **Claude-aligned Interface**: Matches the look and feel of Claude Code CLI
- **Slash Commands**: Support for `/help`, `/clear`, `/version`, and other slash commands
- **Folder Trust System**: Security feature to confirm trusted directories
- **Rich UI**: Colored output and formatted responses
- **Aliases**: Convenient shortcuts and typo corrections

## Installation

Run the installation script to set up Claude Pulser integration:

```bash
./install_claude_pulser.sh
```

This will:
1. Create necessary directories
2. Install scripts in `~/.claude-pulser/`
3. Add aliases to your shell configuration
4. Create a desktop shortcut (on macOS)

## Usage

### Basic Commands

```bash
# Start Claude Code CLI
clode

# Show help
clode /help

# Show version
clode /version

# List available tools
clode /tools

# Clear the screen
clode /clear

# Exit
clode /exit

# Reset the conversation
clode /reset
```

### Advanced Usage

```bash
# Start with thinking mode enabled
clode-thinking

# Start in development mode
clode-dev

# Start with debugging
clode-debug

# Start with minimal UI
clode-minimal
```

## Configuration

Configuration is stored in `~/.claude-pulser/config/config.json` and includes options for:

- Theme
- UI preferences
- Model settings
- Editor preferences
- History size

## Customization

You can modify the aliases in `~/.claude-pulser/config/aliases.sh` to add your own shortcuts.

## Comparison with Original Pulser

This integration enhances the original Pulser shell with:

1. **Improved Prompt**: Cleaner, more Claude-like prompt
2. **Better Command Processing**: Support for slash commands
3. **Multi-line Input**: Press Ctrl+D to submit multi-line requests
4. **Enhanced Theme**: Colors and formatting that match Claude Code CLI
5. **Better Error Handling**: More informative error messages
6. **Simplified Installation**: Easy setup script

## Next Steps

Future enhancements could include:

- Full integration with DeepSeekR1 model
- Support for Claude Code-style thinking toggle
- Enhanced auto-completion
- Better history navigation
- Plugins system

For support, please file issues in the InsightPulseAI_SKR repository.