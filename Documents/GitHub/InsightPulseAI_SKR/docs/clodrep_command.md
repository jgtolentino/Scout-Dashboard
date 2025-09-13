# #clodrep Command Documentation

## Overview

The `#clodrep` command provides a shell interface for integrating external APIs into Pulser with Mistral as the default LLM. This command enables seamless access to external AI APIs and services directly from the Pulser CLI.

## Usage

```bash
#clodrep <endpoint> <action> [parameters...]
```

### Parameters

- `endpoint`: The external API endpoint to connect to (e.g., "mistral", "anthropic", "openai")
- `action`: The action to perform (e.g., "generate", "embed", "classify")
- `parameters`: Additional parameters specific to the endpoint and action

## Examples

```bash
# Generate text using Mistral API
#clodrep mistral generate "Create a summary of the quarterly results"

# Embed text using Mistral API
#clodrep mistral embed "This is sample text for embedding"

# Classify content using Mistral API
#clodrep mistral classify "This product is amazing" --categories="positive,negative,neutral"
```

## Supported Endpoints

- `mistral`: Default endpoint, uses Mistral API for LLM operations
- `anthropic`: Uses Anthropic API as a fallback
- `openai`: Uses OpenAI API as a fallback
- `custom`: Allows specifying a custom API endpoint

## Supported Actions

- `generate`: Generate text based on a prompt
- `embed`: Create embeddings from text
- `classify`: Classify text into categories
- `extract`: Extract structured data from text
- `translate`: Translate text between languages

## Installation

The `#clodrep` command is automatically installed as part of the Pulser shell functions. It requires the Pulser CLI to be properly configured.

## Configuration

The command uses the Pulser API integration framework defined in the `pulser_api_integration.yaml` task. Configuration can be modified in this task file.

## Logs

All commands are logged to:
```
~/Documents/GitHub/InsightPulseAI_SKR/claude_logs/pulser_session.log
```

With the prefix `[CLODREP]` for easy filtering.

## Related

- `:task` command: Use this to monitor and manage the API integration task
- `:verify-docket`: Verify the Pulser docket including API integrations