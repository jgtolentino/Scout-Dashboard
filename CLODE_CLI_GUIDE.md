# Claude Code CLI Guide

The Claude Code CLI (`clode`) is now installed on your system with advanced paste handling features. This guide will help you get started.

## Basic Usage

```bash
# Start the CLI
clode

# Run the demo
clode-demo
```

## Key Features

### Paste Handling

The CLI intelligently detects when you paste content:

1. **Detection**: Automatically recognizes pasted content vs. typed input
2. **Content Recognition**: Identifies code blocks, SQL, and configuration data
3. **Security**: Masks passwords and sensitive information
4. **Options**: Provides contextual actions for different content types

### Slash Commands

Type these commands directly in the CLI:

- `/help` - Show available commands
- `/clear` - Clear the screen
- `/version` - Display CLI version
- `/tools` - List available tools
- `/exit` - Exit the CLI
- `/reset` - Reset the conversation
- `/thinking` - Toggle thinking mode
- `/trust` - Trust the current directory

### Keyboard Shortcuts

- `Ctrl+C` - Exit the CLI
- `Ctrl+D` - Submit multi-line input
- `Ctrl+L` - Clear the screen
- `Up/Down` - Navigate through command history

## Testing Paste Handling

Run the test script to try out the paste features:

```bash
./test_paste_cli.sh
```

This opens a terminal with sample paste content to test different scenarios:

1. **SQL Connection Strings**: The CLI masks passwords and sensitive data
2. **Code Blocks**: The CLI formats and highlights syntax
3. **Configuration**: The CLI identifies and secures API keys

## Customization

Edit the configuration file to customize behavior:

```bash
nano ~/.claude-pulser/config/config.json
```

Key settings:
- `showThinking`: Toggle thinking mode (true/false)
- `darkMode`: Toggle dark mode (true/false)
- `pasteDetection`: Configure paste sensitivity

## Multiple CLI Modes

The installation added several CLI variants:

```bash
# Normal mode
clode

# Development mode
clode-dev

# With thinking mode enabled
clode-thinking

# Minimal UI mode
clode-minimal
```

## Folder Trust System

The CLI includes a trust system for security:

- New folders require confirmation before running commands
- Trusted folders are remembered for future sessions
- Use `/trust` to add the current directory to trusted folders

## Troubleshooting

If you encounter issues:

1. Check dependencies: `cd ~/.claude-pulser && npm list`
2. Verify installation: `node ~/.claude-pulser/bin/verify_implementation.js`
3. Reinstall: `./install_complete_pulser_cli.sh`

For more information, see the full documentation at:
`~/.claude-pulser/docs/README_IMPROVED_CLI.md`