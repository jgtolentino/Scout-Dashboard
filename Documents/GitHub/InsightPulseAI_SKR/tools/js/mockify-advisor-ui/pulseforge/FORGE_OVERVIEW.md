# PulseForge – Full-Stack App Generator

PulseForge is a Pulser-integrated system that converts natural language prompts into fully functional applications using modular AI agents.

## 🔧 Features

- Prompt-based app generation
- React/Vue/Angular + FastAPI/Express/Laravel
- PostgreSQL/MySQL/MongoDB support
- CI/CD deployable via Docker + GitHub Actions
- Built-in QA and documentation support

## 🧠 Agent Roles

| Agent   | Role                                 |
|---------|--------------------------------------|
| Tide    | Prompt parsing + code generation     |
| Maya    | Schema builder                       |
| Claudia | Orchestration + memory management    |
| Caca    | Code validation and QA               |
| Basher  | CI/CD and deployment                 |
| Kalaw   | Logging + documentation              |
| Echo    | Prompt enhancement + UX improvement  |

## 🚀 Run via Pulser CLI

```bash
:forge --prompt "Build a task tracker with login and due dates" --stack react-fastapi-postgres --auth_required true
```

## 📂 Output

* `frontend/` - Frontend code (React/Vue/Angular)
* `backend/` - Backend API (FastAPI/Express/Laravel)
* `database/` - Database schemas and migrations
* `docker/` - Docker and docker-compose configuration
* `README.md` - Project documentation
* `.env.example` - Environment configuration

## System Prompt Accuracy Enhancements

PulseForge integrates the System Prompt Accuracy Booster across all its agents, providing:

1. **Persistence**: Ensures agents complete tasks fully without prematurely stopping.
2. **Tools Calling**: Encourages use of external tools rather than guessing when uncertain.
3. **Planning**: Requires agents to break down complex tasks before execution.

These principles are applied throughout the architecture:

- **Individual Agent Prompts**: Each agent has tailored system prompts with these principles.
- **System-wide Context**: Claudia maintains these principles across the workflow.
- **Tool Calling Framework**: Integrated into workflow step execution for better decision-making.

## 🔁 Extending PulseForge

### Adding Templates

Templates are stored in `pulseforge/templates/` as YAML files with the following structure:

```yaml
name: "CRM System"
description: "Customer relationship management with contacts, deals, and dashboard"
stack: "react-fastapi-postgres"
entities:
  - name: "Contact"
    fields:
      - name: "name"
        type: "string"
        required: true
      - name: "email"
        type: "string"
        required: true
        unique: true
  # More entities...
relationships:
  - source: "Contact"
    target: "Deal"
    type: "one_to_many"
    field: "deals"
features:
  - name: "authentication"
    required: true
  - name: "dashboard"
    required: true
```

### Adding New Database Types

To support a new database type, edit the following files:

1. `pulseforge/src/agents/maya/schema_generator.py`
2. Add a new generator class for your database type.

Example:
```python
class CassandraSchemaGenerator(BaseSchemaGenerator):
    """
    Generates Cassandra database schemas from entity specifications.
    """
    
    def generate_schema(self, entities, relationships):
        # Implementation here
        pass
```

### Supporting New Frameworks

To add a new frontend or backend framework:

1. `pulseforge/src/agents/tide/app_generator.py`
2. Create a new generator class for your framework.

Example:
```python
class SvelteGenerator(BaseFrontendGenerator):
    """
    Generates Svelte frontend code.
    """
    
    def generate_frontend(self, spec):
        # Implementation here
        pass
```

## GitHub Actions Integration

PulseForge supports automated CI/CD via GitHub Actions. Add the following to your workflow file:

```yaml
name: Deploy PulseForge App

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy PulseForge App
        uses: pulseforge/deploy-action@v1
        with:
          stack: react-fastapi-postgres
          auth_required: true
```

## Telemetry and Analytics

PulseForge collects anonymous usage metrics to improve the system, including:

- Generation counts and success rates
- Token usage by model
- Performance metrics
- Error types and frequencies

You can opt out by setting `enable_telemetry: false` in your configuration.

## Troubleshooting

Common issues and solutions:

- **Schema Generation Errors**: Check entity relationships for circular dependencies
- **Missing Dependencies**: Run `pulseforge check-dependencies` to verify environment
- **Deployment Failures**: Ensure Docker is installed and running
- **LLM API Errors**: Verify API keys and model availability

For more assistance, consult the logs at `logs/pulseforge.log` or run with debug logging:

```bash
:forge --prompt "..." --log-level debug
```