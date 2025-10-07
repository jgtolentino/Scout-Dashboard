# ClodRep Usage Examples

The following examples demonstrate how to use ClodRep (Claude Local Tool Adapter) for common tasks.

## Setup

First, activate the tool adapter:

```bash
./clodrep.sh mount-local-tools
source .clodrep_aliases
```

## Basic Usage

### Running Commands with Claude

```bash
# Generate code with Claude
:claude run "create a Node.js API endpoint for user authentication"

# Execute a local command with Claude's oversight
:claude exec "npm install express mongoose jsonwebtoken"

# Have Claude analyze a file
:claude analyze "src/models/user.js"
```

### Dashboard Generation

```bash
# Generate a dashboard from data
:dash render "sales_data.csv" --title "Sales Dashboard" --theme "corporate"

# Create an interactive visualization
:dash visualize "performance_metrics.json" --interactive --filters "region,date"
```

## Advanced Usage

### Tool Chaining

```bash
# Chain Claude with local tools
:claude "analyze this dataset and create a visualization" --input "customer_data.csv" --chain ":dash"

# Multi-step processes
:claude "extract key metrics from logs" --input "server_logs.txt" --output "metrics.json" --then ":dash render metrics.json"
```

### Agent-Specific Tasks

```bash
# Use Basher for system tasks
:basher "optimize these images for web" --input "images/*.png" --output "optimized/"

# Use Claude for content generation
:claude "write test cases for" --context "src/auth.js"
```

## Configuration

### Creating Custom Agents

Create a file in the `agents/` directory with a yaml structure:

```yaml
name: CustomAgent
description: My specialized agent
capabilities:
  - capability1
  - capability2
tools:
  - tool1
  - tool2
prompt_template: |
  You are CustomAgent.
  {{task}}
```

### Customizing Tool Routing

Edit `pulser.config.yaml` to add custom tool routes:

```yaml
tools:
  custom_tool: "./custom_tool_executor.sh"
agents:
  custom: "my_custom_agent"
```