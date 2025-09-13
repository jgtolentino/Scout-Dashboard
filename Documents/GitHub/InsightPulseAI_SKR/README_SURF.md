# Surf - Autonomous Code Agent

## Overview

Surf is a powerful autonomous code agent integrated with the Pulser CLI. It can handle complex engineering tasks like refactoring, bug fixing, and implementing new features with minimal supervision.

## Key Features

- **Autonomous Planning**: Breaks down tasks into actionable steps
- **Code Analysis**: Understands codebase structure and patterns
- **Context-Aware Transformations**: Makes changes with awareness of project context
- **Verification**: Tests changes to ensure functionality is preserved
- **Documentation**: Generates reports of changes made

## Usage

```bash
:surf --goal "Your task in natural language" [options]
```

### Required Arguments

- `--goal`: Natural language description of the task to perform

### Optional Arguments

- `--files`: Comma-separated list or glob pattern of files to operate on
- `--env`: Environment file to use (default: `.env.local`)
- `--note`: Additional context or instructions for the agent
- `--backend`: LLM backend to use (`claude` or `deepseekr1`, default: `deepseekr1`)

## Examples

### Refactoring

```bash
:surf --goal "Extract common form validation logic into a custom hook" --files "src/components/*.tsx"
```

### Bug Fixing

```bash
:surf --goal "Fix race condition in authentication flow" --files "src/auth/*.js" --note "Focus on the login sequence and token refresh logic"
```

### Feature Implementation

```bash
:surf --goal "Add dark mode support to the application" --files "src/styles/*,src/components/Theme*.tsx"
```

## Output

Surf generates two types of output:

1. **Execution Log**: Real-time updates in the terminal
2. **Markdown Report**: Detailed report of changes made, saved to `logs/surf_{task_id}_report.md`

## Integration

Surf is fully integrated with the Pulser CLI and can be used alongside other tools:

```bash
# Run Surf after verification
:verify && :surf --goal "Implement new feature X"

# Use with specific model
:surf --goal "Fix bug Y" --backend claude
```

## Advanced Usage

For complex tasks, provide detailed context in the `--note` parameter:

```bash
:surf --goal "Optimize database queries" --files "src/db/*.js" --note "Focus on reducing N+1 queries. Current bottleneck is in the user profile page where we're making too many separate queries for related data. Consider using eager loading or batch loading where appropriate."
```

---

*Surf agent is part of the InsightPulseAI / Pulser 2.0 system.*