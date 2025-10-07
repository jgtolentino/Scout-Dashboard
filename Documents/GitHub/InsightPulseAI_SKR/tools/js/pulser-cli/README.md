# Claude Local Tool Adapter (Pulser Mount v2.0.1)

A minimal adapter pattern to mount Claude (via Pulser) to your local tools without the usual pain. This wraps Claude's orchestration logic into a shell-bridgeable CLI executor with memory sync, tool dispatch, and file proxy.

## Directory Layout

```
/pulser-cli/
│
├── pulser.config.yaml        # Tool-to-agent dispatch rules
├── mcp_bridge.py             # Claude <-> Local bridge
├── task_executor.sh          # Shell-level runner
├── .pulserrc                 # Memory + env settings
├── claude_session.log        # Context persistence
└── agents/
    ├── basher.yaml
    ├── dash.yaml
    └── claudia.yaml
```

## Usage

```bash
:claude run "create a docker compose file for FastAPI + Postgres"
:claude exec "bash task_executor.sh deploy.sh"
:claude mount "src/schema.yaml" --agent kalaw
:dash render dashboard from "medallion_data.csv"
```

## Installation

1. Ensure you have the required dependencies installed:
   - Python 3.6+
   - Node.js 14+

2. Set up environment:
   ```bash
   cd pulser-cli
   pip install -r requirements.txt
   ```

3. Activate Claude adapter:
   ```bash
   :clodrep mount-local-tools
   ```

## How It Works

Claude handles orchestration. Basher or Dash handles actual execution. All memory is logged and reused via `claude_session.log`.

This approach abstracts Claude's I/O bottleneck by providing a shell-level bridge that routes commands to the appropriate local tools while maintaining context.