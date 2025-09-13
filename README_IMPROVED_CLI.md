# Improved Claude Code CLI

A Claude Code-style CLI for the Pulser system with advanced paste handling and improved user experience.

## Features

### Advanced Paste Detection & Handling

- **Smart Paste Detection**: Automatically detects when content is pasted vs. manually typed
- **Content Type Recognition**: Identifies SQL, code blocks, and configuration data
- **Syntax Highlighting**: Formats pasted content based on recognized type
- **Security Features**: Masks passwords and sensitive data in configuration files
- **Multi-line Processing Options**: Execute as single command, run line-by-line, or save as file

### Claude-Style UI/UX

- **Consistent Styling**: Matches Claude Code CLI appearance and behavior
- **Rich Command Output**: Colored and formatted responses
- **Slash Commands**: Support for `/help`, `/clear`, `/version`, etc.
- **Keyboard Shortcuts**: Quick actions like Ctrl+D for multi-line submission

### Enhanced Shell Experience

- **Command History**: Persistent history with navigation
- **Folder Trust System**: Security feature to confirm trusted directories
- **Tool Integration**: Seamless access to Bash, Glob, Grep, LS, etc.
- **Progress Indicators**: Visual feedback for long-running operations

## Installation

```bash
# Make the install script executable
chmod +x install_improved_cli.sh

# Run the installer
./install_improved_cli.sh
```

## Usage

### Starting the CLI

```bash
# Start the improved CLI
clode
```

### Slash Commands

- `/help` - Display help information
- `/clear` - Clear the terminal screen
- `/version` - Show the CLI version
- `/tools` - List available tools
- `/exit` - Exit the CLI
- `/reset` - Reset the current conversation
- `/thinking` - Toggle thinking mode
- `/trust` - Trust current directory

### Keyboard Shortcuts

- `Ctrl+C` - Exit the application
- `Ctrl+D` - Submit multi-line input
- `Ctrl+L` - Clear the screen
- `Up/Down` - Navigate through command history

### Pasting Content

When pasting multi-line content, the CLI will:

1. Detect the paste operation
2. Identify the content type (SQL, code, configuration)
3. Display formatted content in a review box
4. Offer processing options:
   - Execute as a single command
   - Execute each line separately
   - Save as a file
   - Cancel

### Working with Sensitive Data

When pasting configuration data with sensitive information:

- Passwords and API keys are automatically masked
- Connection strings are properly formatted
- Security warnings are displayed when appropriate

## Code Architecture

The improved CLI consists of three main components:

1. **PulserInputHandler**: Manages input processing, paste detection, and content formatting
2. **CLI Application**: Handles commands, slash commands, and overall user interface
3. **Installation Script**: Sets up the necessary environment and configuration

## Development

To modify or extend the improved CLI:

```bash
# Install dependencies
cd ~/.claude-pulser && npm install

# Make changes to the source files in ~/.claude-pulser/bin/
# Test your changes
clode

# To update the installation
cp ~/.claude-pulser/bin/* ~/your-dev-directory/
```

## Troubleshooting

If you encounter issues:

- Check the configuration file at `~/.claude-pulser/config/config.json`
- Verify that dependencies are installed correctly
- Ensure correct permissions for executable files

## License

MIT