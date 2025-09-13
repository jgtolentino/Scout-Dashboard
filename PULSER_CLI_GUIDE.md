# Pulser CLI Guide

The Pulser CLI is a powerful command-line interface with advanced features including paste handling, API integration, provider switching, and interactive commands. This guide will help you get started.

## Installation

```bash
# Make the installation script executable
chmod +x install_real_pulser.sh

# Run the installer
./install_real_pulser.sh
```

## Configuration

### API Keys

To use Pulser CLI with real LLM providers, you need to configure your API keys. There are several ways to do this:

#### Option 1: Edit the API Keys JSON File

Edit the file at `~/.pulser/config/api_keys.json` with your API keys:

```json
{
  "anthropic": "YOUR_ANTHROPIC_API_KEY_HERE",
  "openai": "YOUR_OPENAI_API_KEY_HERE"
}
```

#### Option 2: Set Environment Variables

Add these lines to your shell configuration file:

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
export OPENAI_API_KEY="your_openai_api_key_here"
```

#### Option 3: Create Dedicated API Key Files

Create files containing just your API keys:

```bash
# For Anthropic
mkdir -p ~/.anthropic
echo "your_anthropic_api_key_here" > ~/.anthropic/api_key

# For OpenAI
mkdir -p ~/.openai
echo "your_openai_api_key_here" > ~/.openai/api_key
```

## Basic Usage

```bash
# Start the CLI in interactive mode
pulser

# Run with a specific command and exit
pulser "What is the capital of France?"

# Run with a specific provider and model
pulser --provider openai --model gpt-4o "Write a haiku about coding"

# Enable thinking mode
pulser --thinking

# Run in demo mode (no API keys needed)
pulser --demo
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
--demo                  Run in demo mode (no API keys needed)
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
- `/demo` - Toggle demo mode (no API keys needed)
- `/exit` or `/quit` - Exit the CLI

### Keyboard Shortcuts

- `Ctrl+C` - Exit the CLI
- `Ctrl+D` - Submit multi-line input
- `Up/Down` - Navigate through command history

### Paste Handling

The CLI intelligently detects when you paste content:

1. **Detection**: Automatically recognizes pasted content vs. typed input
2. **Content Recognition**: Identifies code blocks, SQL, and configuration data
3. **Security**: Masks passwords and sensitive information
4. **Options**: When pasting content, you can:
   - Execute as a single command
   - Execute each line as a separate command
   - Store as a file
   - Cancel

### Provider Switching

Switch between different LLM providers:

```bash
# Via slash commands
/anthropic  # Switch to Anthropic Claude
/openai     # Switch to OpenAI models
/local      # Switch to local LLM (via Ollama)

# Via command-line arguments
pulser --provider anthropic
pulser --provider openai
pulser --provider deepseek
```

## API Integration

The Pulser CLI connects to real API endpoints:

### Anthropic API

- Default provider
- Supports various Claude models
- Requires Anthropic API key

### OpenAI API

- Supports GPT-4, GPT-3.5, and other models
- Requires OpenAI API key

### Local LLM (via Ollama)

- Run AI models locally on your machine
- Requires [Ollama](https://ollama.ai) to be installed and running

### Demo Mode

- Test the CLI without requiring API keys
- Simulates responses for different query types
- Perfect for trying out features before getting API keys
- Enable with `--demo` flag or `/demo` command

```bash
# Run the CLI in demo mode
pulser --demo

# Try different types of queries
pulser --demo "Hello there"
pulser --demo "Show me a code example"
pulser --demo "Help me with SQL"
pulser --demo "Show me a configuration example"
```

## Environment Variables

- `PULSER_SHOW_THINKING=1` - Enable thinking mode
- `PULSER_DEBUG=1` - Enable debug output
- `PULSER_MINIMAL_UI=1` - Use minimal UI
- `PULSER_DEMO_MODE=1` - Enable demo mode
- `PULSER_DEFAULT_PROVIDER` - Set default provider
- `PULSER_DEFAULT_MODEL` - Set default model
- `ANTHROPIC_API_KEY` - Set Anthropic API key
- `OPENAI_API_KEY` - Set OpenAI API key

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

### API Key Problems

If you see authentication errors:
1. Verify your API keys are correctly configured
2. Check if your API keys have expired
3. Make sure you haven't exceeded usage limits

### Local Model Issues

For local model problems:
1. Ensure Ollama is installed and running
2. Verify the model is downloaded: `ollama pull llama2`
3. Check Ollama logs for errors

### Installation Issues

If the CLI isn't working:
1. Check dependencies: `cd ~/.pulser && npm list`
2. Verify installation: `ls -la ~/.pulser/bin`
3. Reinstall: `./install_real_pulser.sh`
4. Make sure your shell config was updated