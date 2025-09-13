# Claude Prompt Executor

> **Replaces**: Deprecated `clodrep` prompt executor
> 
> **Version**: 2.5.0
>
> **Maintained by**: InsightPulseAI Team

## Overview

The Claude Prompt Executor is a component of Pulser 2.0 that provides prompt testing, engineering, and versioning capabilities directly through Claude, eliminating the need for the deprecated `clodrep` middleware. This executor integrates seamlessly with the Pulser CLI and prompt library infrastructure.

## Features

- **Direct Claude Integration**: Prompts are processed directly by Claude without intermediaries
- **Prompt Testing**: Test prompts with different inputs and contexts
- **Prompt Versioning**: Track and manage multiple versions of prompts
- **Library Indexing**: Automatically scan and maintain the prompt library index
- **Documentation Generation**: Create and update prompt library documentation

## CLI Usage

### Testing Prompts

```bash
# Test a prompt from the library
pulser prompt test --name brand_analysis --input "TBWA, Nike, Adidas"

# Test a prompt from a file
pulser prompt test --file ./prompts/competitive_analysis.txt

# Test with specific context and tags
pulser prompt test --name social_media_post --context "Product launch" --tags "marketing,launch"

# Test a specific version
pulser prompt test --name customer_journey --version v2
```

### Managing the Prompt Library

```bash
# Sync the prompt library index
pulser prompt sync

# List all available prompts
pulser prompt list

# List prompts with a specific tag
pulser prompt list --tag marketing

# Show versions of a prompt
pulser prompt version --name brand_analysis
```

## Prompt Library Structure

The prompt library follows this structure:

```
SKR/prompt_library/
├── brand_analysis/
│   ├── prompt.txt           # Current version
│   ├── metadata.json        # Prompt metadata
│   └── versions/            # Version history
│       ├── v1.txt
│       └── v2.txt
├── customer_journey/
│   ├── prompt.txt
│   └── metadata.yaml
└── ...
```

## Shell Aliases

For convenience, these aliases are available:

```bash
:prompt-test       # Alias for pulser prompt test
:prompt-sync       # Alias for pulser prompt sync
```

## Metadata Format

Prompt metadata can be defined in JSON or YAML:

```yaml
# metadata.yaml example
description: "Analyzes brand positioning and competitive landscape"
tags:
  - marketing
  - brands
  - competitive
author: Jake Tolentino
created: "2025-05-10"
```

## Prompt Tags

The Claude Prompt Executor understands these special tags within prompts:

- `specific_request` - Directs Claude to a specific outcome
- `step_by_step` - Indicates sequential processing is required
- `chaining_prompt` - For prompts that connect to other prompts
- `critiquing_prompt` - Prompts that evaluate or critique content
- `system_message` - Context-setting system instructions
- `few_shot` - Examples for few-shot learning
- `multimodal_analysis` - For prompts that analyze images or other media

## Logging

Prompt testing activity is logged to:
- `~/.pulser/logs/claude_prompt_tests.log`
- `~/.pulser/logs/prompt_sync_activity.log`

## Migrating from clodrep

If you have existing clodrep-based prompts:

1. Remove any clodrep-specific tags or commands
2. Use standard Claude formats for all prompts
3. Update any shell scripts that call clodrep to use the new syntax
4. Run `pulser prompt sync` to reindex your prompt library

## Troubleshooting

- **Cache Issues**: Use `--nocache` to bypass the cache
- **Missing Prompts**: Check prompt library path and run `pulser prompt sync`
- **Model Errors**: Specify a different model with `--model claude-3-5-sonnet`