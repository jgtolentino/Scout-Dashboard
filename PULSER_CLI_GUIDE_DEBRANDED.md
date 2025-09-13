# Pulser CLI Guide

The Pulser CLI is a powerful command-line interface with advanced features including paste handling, provider switching, and interactive commands. This guide will help you get started.

## Installation

```bash
# Make the installation script executable
chmod +x install_pulser_debranded.sh

# Run the installer
./install_pulser_debranded.sh
```

## Basic Usage

```bash
# Start the CLI
pulser

# Run with a specific command and exit
pulser "What is the capital of France?"

# Run with a specific provider and model
pulser --provider openai --model gpt-4o "Write a haiku about coding"

# Run the paste handling demo
pulser-demo
```

## Key Features

### Command-Line Options

```
-v, --version           Show version
-h, --help              Show this help
--provider <provider>   Set provider: anthropic, openai, deepseek
--model <model>         Set model to use
--thinking              Enable thinking mode
--debug                 Enable debug mode
--minimal               Use minimal UI
-p, --prompt <text>     Run with single prompt and exit
```

### Slash Commands

Type these commands directly in the CLI:

- `/help` - Show available commands
- `/clear` - Clear the screen
- `/version` - Display CLI version
- `/reset` - Reset the conversation
- `/thinking` - Toggle thinking mode
- `/tools` - List available tools
- `/trust` - Trust the current directory
- `/anthropic` - Switch to Anthropic API
- `/openai` - Switch to OpenAI API
- `/local` - Switch to local LLM

### Keyboard Shortcuts

- `Ctrl+C` - Exit the CLI
- `Ctrl+D` - Submit multi-line input
- `Up/Down` - Navigate through command history

### Paste Handling

The CLI intelligently detects when you paste content:

1. **Detection**: Automatically recognizes pasted content vs. typed input
2. **Content Recognition**: Identifies code blocks, SQL, and configuration data
3. **Security**: Masks passwords and sensitive information
4. **Options**: Provides contextual actions for different content types

### Provider Switching

Switch between different LLM providers:

```bash
# Via slash commands
/anthropic  # Switch to Anthropic
/openai     # Switch to OpenAI models
/local      # Switch to local LLM (via Ollama)

# Via command-line arguments
pulser --provider anthropic
pulser --provider openai
pulser --provider deepseek
```

### Multiple CLI Modes

```bash
# Normal mode
pulser

# Development mode
pulser-dev

# With thinking mode enabled
pulser-thinking

# Minimal UI mode
pulser-minimal

# Provider-specific shortcuts
pulser-anthropic
pulser-openai
pulser-local
```

## Environment Variables

- `PULSER_SHOW_THINKING` - Set to 1 to enable thinking mode
- `PULSER_DEBUG` - Set to 1 to enable debug output
- `PULSER_MINIMAL_UI` - Set to 1 for minimal UI
- `PULSER_DEV_MODE` - Set to 1 for development mode
- `PULSER_NO_COLOR` - Set to 1 to disable colored output

## Folder Trust System

The CLI includes a trust system for security:

- New folders require confirmation before running commands
- Trusted folders are remembered for future sessions
- Use `/trust` to add the current directory to trusted folders

## Configuration

Edit the configuration file to customize behavior:

```bash
nano ~/.pulser/config/config.json
```

Key settings:
- `defaultProvider`: Default LLM provider
- `defaultModel`: Default model to use
- `showThinking`: Toggle thinking mode
- `pasteDetection`: Configure paste sensitivity

## Troubleshooting

If you encounter issues:

1. Check dependencies: `cd ~/.pulser && npm list`
2. Verify installation: `ls -la ~/.pulser/bin`
3. Reinstall: `./install_pulser_debranded.sh`