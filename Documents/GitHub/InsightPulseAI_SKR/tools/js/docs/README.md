# Pulser CLI

A terminal interface for AI agents with Claude-style UX. This CLI provides an interactive shell for communicating with AI models, designed to match the terminal experience of Claude Code.

## Features

- Claude-style terminal interface with identical styling
- Interactive REPL with command history
- Thinking spinner with elapsed time display
- Context persistence across sessions
- Trusted directory management (like Claude Code)
- System command execution
- Multiple operation modes:
  - API mode (connects to DeepSeekr1 API)
  - Local mode (for future local model support)
  - Demo mode (for testing without AI calls)

## Installation

### Install from npm

```bash
npm install -g @pulser-ai/cli
```

### Manual Installation (Development)

1. Clone the repository
2. Navigate to the directory
3. Run the install script:

```bash
cd /path/to/pulser-cli
chmod +x install.sh
./install.sh
```

## Usage

Basic usage:

```bash
pulser
```

With options:

```bash
# API mode (default)
pulser --api

# Local model mode
pulser --local

# Demo mode
pulser --demo

# Debug mode
pulser --debug
```

## Special Commands

- `/help` - Show help message
- `/quit`, `/exit` - Exit the Pulser CLI
- `/trust <directory>` - Add a directory to trusted directories
- `/clear` - Clear the screen
- `/system <command>` - Execute a system command

## Configuration

Configuration is stored in `~/.pulser_config.json`:

```json
{
  "api": {
    "endpoint": "http://localhost:8000/v1/chat/completions",
    "timeout": 60000
  },
  "model": {
    "name": "deepseekr1-8k",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint
```

## License

MIT