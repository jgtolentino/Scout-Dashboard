# Claude Code & Pulser Integration

This integration creates a unified environment where both Claude Code CLI and Pulser Shell can operate with shared context, memory, and command capabilities.

## Features

- **Shared Working Directory**: Both environments use the same working directory
- **Shared Context Memory**: Conversations and history are shared between environments
- **Command Compatibility**: Use the same commands in both environments
- **File Reference Compatibility**: Reference files using a consistent syntax
- **Task Sharing**: Create and manage tasks that are visible in both environments

## Installation

### Automated Installation

For automated installation, run:

```bash
# Make sure you're in the right directory
cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools

# Run the installer
./install_claude_pulser_integration.sh
```

The installer will:
1. Create a backup of your existing `.zshrc`
2. Add the integration configuration to `.zshrc`
3. Set up the shared environment directory structure
4. Make all necessary scripts executable

### Manual Installation

If you prefer to install manually:

1. Copy the contents of `claude_pulser_zshrc.txt` to your `.zshrc`
2. Run `./link_claude_pulser.sh` to set up the shared environment
3. Make the scripts executable:
   ```bash
   chmod +x link_claude_pulser.sh pulser_claude_wrapper.sh claude_pulser_bridge.py
   ```

## Usage

After installation and sourcing your `.zshrc` (`source ~/.zshrc`), you can use:

- `claude` - Launch Claude Code CLI with shared context
- `pulser` - Launch Pulser Shell with shared context
- `cp_help` - Show integration help

### Command Compatibility

The integration supports the following command mappings:

| Claude Code | Pulser | Description |
|-------------|--------|-------------|
| `/help` | `:help` | Show help |
| `/think` | `:think` | Enable thinking mode |
| `/think-harder` | `:think-harder` | Enhanced thinking mode |
| `/memory` | `:context` | Show memory context |
| `/history` | `:history` | Show command history |
| `/task` | `:task` | Task management |
| `/multimodal` | `:multimodal` | Multimodal input mode |
| `/voice` | `:voice` | Voice assistant mode |

### File References

You can reference files using:
- `@file.txt` in Claude Code
- `:read file.txt` in Pulser

Both will be translated correctly when switching environments.

## Directory Structure

The integration creates a shared workspace at `$HOME/ClaudePulser` with:

```
$HOME/ClaudePulser/
├── .context_memory/      # Shared memory and context
│   └── session_context.txt
├── .config/              # Configuration files
│   └── shared_config.json
├── tasks/                # Shared task definitions
├── projects/             # Shared project files
└── README.md             # Usage instructions
```

## Implementation Details

The integration consists of:

1. **Integration Scripts**:
   - `link_claude_pulser.sh` - Creates the shared environment structure
   - `pulser_claude_wrapper.sh` - Wrapper for pulser_shell_enhanced.sh with Claude compatibility
   - `claude_pulser_bridge.py` - Bidirectional command and context translation

2. **Configuration**:
   - `claude_pulser_zshrc.txt` - Configuration for .zshrc
   - `.context_memory/session_context.txt` - Shared memory file

3. **Installer**:
   - `install_claude_pulser_integration.sh` - Automated installer

## Troubleshooting

If you encounter issues:

1. **Command not found**: Make sure your `.zshrc` is sourced after installation
2. **Memory not shared**: Check that both environments are using the same shared memory file
3. **Directory issues**: Ensure the shared directory exists and has proper permissions

For more complex issues, check the implementation in:
- `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/claude_pulser_bridge.py`
- `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/pulser_claude_wrapper.sh`