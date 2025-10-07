# Prompt Library Integration

This guide explains how to integrate PulseDev MCP prompts with the Pulser Prompt Library system.

## Overview

The Pulser Prompt Library provides a structured way to store, manage, and use prompt templates across different tools. By integrating PulseDev MCP prompts with this library, you can:

1. Use distilled, legally-safe prompt templates
2. Access prompts from the Pulser CLI
3. Maintain consistent prompt structures across projects
4. Track prompt usage and effectiveness

## Setup

### 1. Fork the Prompt Library Repository (if using external sources)

When integrating prompt templates from external repositories, always fork first:

```bash
# 1. First, fork the repository on GitHub
# Navigate to the repository URL and click "Fork"

# 2. Clone your fork
git clone https://github.com/yourusername/prompt-library-repo.git
cd prompt-library-repo

# 3. Set up upstream tracking (optional)
git remote add upstream https://github.com/original-owner/prompt-library-repo.git
git fetch upstream
```

### 2. Prepare Prompt Library Directory

```bash
# Create prompt library directory if it doesn't exist
mkdir -p $PULSER_DIR/prompt_library
```

### 3. Import Distilled Prompts

Copy the distilled prompt templates to your Pulser workspace:

```bash
# Copy distilled prompts to your Pulser workspace
cp pulser_prompt_library_distilled.yaml $PULSER_DIR/prompt_library/
```

### 4. Register with Pulser CLI

Update your `.pulserrc` file to include the prompt library path:

```
[paths]
prompt_library = $PULSER_DIR/prompt_library

[prompt_sources]
mcp_prompts = $PULSER_DIR/tools/js/mcp/pulsedev/mcp_prompts
```

## Using Distilled Prompts

### From the Pulser CLI

```bash
# List available prompt templates
pulser prompt_library list

# View a specific prompt template
pulser prompt_library view claude3.sonnet

# Use a prompt template with MCP
pulser mcp_prompts switch --template claude3.sonnet
```

### From the PulseDev API

```bash
# Use a prompt template with a task
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Create a login form with React",
    "prompt_template": "claude3.sonnet",
    "context": {"type": "code_generation"}
  }'
```

## Available Distilled Templates

The `pulser_prompt_library_distilled.yaml` file includes sanitized templates for:

- `claude3.haiku` - Optimized for speed and efficiency
- `claude3.opus` - Optimized for complex reasoning and depth
- `claude3.sonnet` - Balanced performance and capabilities

Each template includes:
- Safe behavior rules
- Formatting preferences
- Tone alignment
- Task-specific optimizations

## Creating Your Own Templates

You can create your own templates in the prompt library:

1. Create a YAML file in the prompt library directory:

```yaml
# $PULSER_DIR/prompt_library/my_custom_template.yaml
name: my_custom_template
model: claude-3-sonnet-20240229
version: 1.0.0
description: Custom template for specific tasks
system_prompt: |
  You are an AI assistant specialized in {domain}.
  
  # Guidelines
  - Provide concise, accurate responses
  - Format code with proper syntax highlighting
  - Explain complex concepts with examples
  
  # Task Context
  {context}
```

2. Register it with the MCP system:

```bash
# Copy to MCP prompts directory
cp $PULSER_DIR/prompt_library/my_custom_template.yaml $PULSER_DIR/tools/js/mcp/pulsedev/mcp_prompts/custom/

# Register with Kalaw
./register_with_kalaw.sh
```

## Integration with Claudia

The Claudia orchestration system can automatically select appropriate prompt templates:

```bash
# Execute a task with automatic template selection
curl -X POST http://localhost:8000/api/claudia/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Create a comprehensive data analysis plan",
    "auto_template": true,
    "context": {"type": "data_science", "complexity": "high"}
  }'
```

Claudia will analyze the task and select from available templates (e.g., choosing `claude3.opus` for complex data science tasks).

## Best Practices

1. **Always Fork First**: When using external prompt repositories, always fork before cloning
2. **Use Distilled Templates**: Prefer legally-safe, distilled prompt templates
3. **Add Metadata**: Include version, purpose, and usage guidelines in your templates
4. **Track Effectiveness**: Monitor which templates perform best for different tasks
5. **Update Regularly**: Keep your prompt library in sync with the latest developments

## Security Considerations

- Never include API keys or sensitive information in prompt templates
- Review all external prompt templates before using them
- Use the `access_level` field to control who can use sensitive templates
- Monitor prompt usage metrics for unusual patterns

## Additional Resources

- [Pulser Prompt Library Documentation](path/to/docs)
- [Prompt Engineering Guide](path/to/guide)
- [Template Variables Reference](path/to/reference)