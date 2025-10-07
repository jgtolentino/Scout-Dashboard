# Pulser Shell Enhancement

This enhancement improves the command-line experience for Pulser CLI, adding clear differentiation between:

- Shell commands
- LLM model prompts
- PulseOps operations

## Key Features

### Mode-based Operation

The shell now has three distinct modes:

- **Prompt Mode** (`pulser[🔵 prompt]>`) - Default mode for interacting with AI models
- **Shell Mode** (`pulser[🔩 shell]>`) - For executing system commands directly
- **Ops Mode** (`pulser[🧠 ops]>`) - For PulseOps agent operations

### Command Prefixes

In any mode, you can use prefixes to execute different types of commands:

- `!command` - Execute a shell command
- `?text` - Send prompt to the current model
- `?model text` - Send prompt to a specific model
- `:task agent.method args` - Run a PulseOps task

### Output Control

New quiet mode suppresses warnings and verbose output:

- `:quiet` - Enable quiet mode (suppresses LibreSSL, OpenSSL warnings)
- `:verbose` - Enable verbose mode (shows all output)

### Mode Switching Commands

- `:prompt` - Switch to prompt mode
- `:shell` - Switch to shell mode
- `:ops` - Switch to ops mode
- `:model name` - Set the default prompt model
- `:help` - Show help information

## Usage Examples

```
# Execute shell commands (works in any mode)
pulser[🔵 prompt]> !az storage blob upload --account-name projectscoutdata

# Send prompt to default model (Mistral)
pulser[🔵 prompt]> what's the difference between blob and file storage?

# Send prompt to specific model
pulser[🔵 prompt]> ?claudia analyze this transcript for sentiment

# Switch to shell mode for multiple commands
pulser[🔵 prompt]> :shell
pulser[🔩 shell]> ls -la
pulser[🔩 shell]> cd /path/to/files

# Run PulseOps tasks
pulser[🔵 prompt]> :task scout.extract --input session03.json

# Suppress warnings
pulser[🔵 prompt]> :quiet
```

## Installation

1. Copy the `pulser_shell_enhancement.py` script to your Pulser installation directory
2. Make it executable: `chmod +x pulser_shell_enhancement.py`
3. Run it directly: `./pulser_shell_enhancement.py`

Or run the installer script:

```bash
./install_pulser_enhancements.sh
```

## Benefits

- **Clearer UX** - Visual indicators show current mode
- **Reduced Errors** - Prevents accidental prompt/command confusion
- **Faster Workflows** - Quick switching between shell and AI operations
- **Better Error Handling** - Identifies common mistakes (e.g., attempting to send a command to an AI model)
- **Warning Suppression** - No more LibreSSL spam when using Ollama and other tools

## Warning Suppression Details

This enhancement specifically targets common warnings that clutter output:

- All LibreSSL and OpenSSL deprecation warnings
- Python DeprecationWarnings
- FutureWarnings
- SyntaxWarnings
- Model loading output (when in quiet mode)

Use the `:quiet` command to enable warning suppression, and `:verbose` to see all output again.