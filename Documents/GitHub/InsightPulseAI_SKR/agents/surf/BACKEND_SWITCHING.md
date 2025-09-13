# Surf Agent Backend Switching

The Surf agent now supports dynamic backend selection between Claude and DeepSeekr1 LLMs. This document explains how to configure and use this feature.

## Backend Options

The Surf agent can use one of two backends:

1. **claude** - Uses Claude Code with context management
   - Better at complex reasoning
   - Larger context window
   - Requires internet connection
   
2. **deepseekr1** - Uses local inference via the DeepSeekr1 model
   - Works offline
   - Lower latency
   - More consistent API
   - Better handling of edge cases

## Ways to Set the Backend

You can choose a backend in three ways, in order of precedence:

### 1. Command Line Flag (Highest Priority)

```bash
:surf --goal "Implement auth module" --backend claude
:surf --goal "Fix bug in login flow" --backend deepseekr1
```

### 2. Environment Variable (Medium Priority)

```bash
# In terminal session before running command
export SURF_BACKEND=claude
:surf --goal "Add validation to registration form"

# Or inline with command
SURF_BACKEND=deepseekr1 :surf --goal "Create Redis cache adapter"
```

### 3. Configuration File (Lowest Priority)

Edit the `agents/surf/surf.yaml` configuration file:

```yaml
settings:
  backend_provider: claude  # Options: claude | deepseekr1
```

## Backend Selection Logic

The backend is selected using the following precedence order:

1. Command line `--backend` parameter
2. `SURF_BACKEND` environment variable
3. Value from the `surf.yaml` configuration file
4. Default to "claude" if nothing is specified

## Fallback Behavior

If the Claude backend is selected but fails to initialize (e.g., due to network issues or missing API key), the agent will automatically fall back to using the DeepSeekr1 backend.

## Usage Examples

```bash
# Use Claude backend
:surf --goal "Create new REST endpoint" --backend claude

# Use DeepSeekr1 backend with file filtering
:surf --goal "Fix validation issues" --backend deepseekr1 --files "src/forms/*.js" 

# Use DeepSeekr1 backend with environment file
:surf --goal "Update database schema" --backend deepseekr1 --env .env.test
```

## Best Practices

- Use Claude for complex tasks requiring deep reasoning
- Use DeepSeekr1 for routine tasks or when offline
- Set a project-specific default in the YAML file
- Override as needed with the command-line flag

Created by Claude on May 10, 2025