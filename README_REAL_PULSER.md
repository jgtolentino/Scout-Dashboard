# Real Pulser CLI with API Integration

This project provides a fully functional command-line interface (CLI) for interacting with various Large Language Model (LLM) providers, including Anthropic, OpenAI, and local models via Ollama.

## Key Files

- `/Users/tbwa/install_real_pulser.sh` - Main installation script
- `/Users/tbwa/setup_real_pulser_api.sh` - API keys setup script
- `/Users/tbwa/PULSER_CLI_GUIDE.md` - Comprehensive user guide
- `/Users/tbwa/pulser_api_keys_example.md` - Examples for API key configuration

## Quick Start

```bash
# Install the Pulser CLI
./install_real_pulser.sh

# Configure your API keys
./setup_real_pulser_api.sh

# Test the CLI (real API mode)
pulser "Hello, world!"

# Or test in demo mode (no API keys needed)
pulser --demo "Hello, world!"
```

## Features

- Real API integration with multiple providers
- Smart paste detection with intelligent handling
- Provider switching (Anthropic, OpenAI, local models)
- Interactive and single-shot modes
- Slash commands for enhanced control
- Thinking mode to see processing details
- Demo mode for testing without API keys
- Folder trust system for security

## Directory Structure

- `~/.pulser/bin/` - CLI executables
- `~/.pulser/config/` - Configuration files
- `~/.pulser/history/` - Command history
- `~/.pulser/temp/` - Temporary files
- `~/.anthropic/` - Anthropic API key
- `~/.openai/` - OpenAI API key

## Configuration Options

Configure the CLI through:

1. API keys files
2. Environment variables
3. Command-line arguments
4. Slash commands

See `PULSER_CLI_GUIDE.md` for complete details.

## Provider Support

### Anthropic (Claude)

- Default provider
- Supports Claude-3 family of models
- Example: `pulser --provider anthropic --model claude-3-opus-20240229`

### OpenAI (GPT)

- Supports GPT-4 and GPT-3.5 models
- Example: `pulser --provider openai --model gpt-4o`

### Local Models (via Ollama)

- Run AI locally on your machine
- Example: `pulser --provider deepseek`
- Requires Ollama to be installed

## Useful Aliases

```bash
# Use specific providers
pulser-anthropic "Your prompt"
pulser-openai "Your prompt"
pulser-local "Your prompt"

# Use specific modes
pulser-thinking
pulser-minimal
```

## Getting Help

```bash
# Show CLI help
pulser --help

# Show interactive help
pulser /help

# Read the full guide
cat PULSER_CLI_GUIDE.md
```