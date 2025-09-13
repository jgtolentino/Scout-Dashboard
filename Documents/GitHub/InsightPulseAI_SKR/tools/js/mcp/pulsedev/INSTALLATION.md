# PulseDev Installation Guide

This guide walks you through installing and setting up PulseDev with full agent-layer integration via Claudia and SKR knowledge tagging via Kalaw.

## Prerequisites

- Python 3.9+
- Node.js 16+
- Docker
- Git
- Access to the InsightPulseAI_SKR repository
- Claude API key (for MCP)

## Step 1: Fork and Clone the Repository

First, fork the repository on GitHub:
1. Navigate to the repository URL: https://github.com/yourorg/InsightPulseAI_SKR
2. Click the "Fork" button in the top-right corner
3. Select your GitHub account as the destination

Then, clone your fork:

```bash
git clone https://github.com/yourusername/InsightPulseAI_SKR.git
cd InsightPulseAI_SKR/tools/js/mcp/pulsedev
```

Optionally, set up tracking with the upstream repository:

```bash
git remote add upstream https://github.com/yourorg/InsightPulseAI_SKR.git
git fetch upstream
```

## Step 2: Environment Setup

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file to add your Claude API key and other configuration:

```
CLAUDE_API_KEY=sk-ant-api-key
MCP_SERVER_URL=http://localhost:4000
PULSER_DIR=/Users/yourusername/Documents/GitHub/InsightPulseAI_SKR
SKR_DIR=/Users/yourusername/Documents/GitHub/InsightPulseAI_SKR
```

## Step 3: Backend Setup

Set up the Python backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Step 4: Frontend Setup

Set up the React frontend:

```bash
cd frontend
npm install
cd ..
```

## Step 5: Agent Integration Setup

### Register with Kalaw

Register the MCP prompts collection with Kalaw's knowledge system:

```bash
./register_with_kalaw.sh
```

This script will:
- Copy the Kalaw index to the SKR directory
- Initialize metrics tracking
- Create necessary symlinks for Claudia access
- Register aliases with Claudia

### Integrate with Pulser CLI

Add MCP prompts to the Pulser CLI system:

```bash
./pulser_integration.sh
```

This script will:
- Create the MCP prompts command for Pulser CLI
- Register the command with the command registry
- Add aliases to the `.pulserrc` file
- Update the CLAUDE.md documentation

## Step 6: Docker Setup (Optional)

Build the Docker containers:

```bash
cd docker
docker-compose build
cd ..
```

## Step 7: Starting the System

### Standard Startup

Launch PulseDev with Claudia and Kalaw integration:

```bash
./launch_claudia_integrated.sh
```

This script will:
1. Register with Kalaw knowledge system
2. Start the backend server with Claudia integration
3. Start the frontend development server
4. Initialize the MCP bridge

### Docker Startup (Optional)

If using Docker:

```bash
cd docker
docker-compose up -d
cd ..
```

## Step 8: Verify Installation

1. Check backend status:
   ```bash
   curl http://localhost:8000/api/status
   ```

2. Check Claudia integration:
   ```bash
   curl http://localhost:8000/api/claudia/status
   ```

3. Check frontend:
   Open http://localhost:5173 in your browser

4. Test Pulser CLI integration:
   ```bash
   pulser mcp_prompts list
   ```

## Accessing the System

- Web Interface: http://localhost:5173
- API: http://localhost:8000/api
- MCP Status: http://localhost:8000/api/claudia/status

## Shell Integration

Add prompt aliases to your shell by adding this line to your `~/.zshrc`:

```bash
source /path/to/pulsedev/prompt_aliases.sh
```

Reload your shell:

```bash
source ~/.zshrc
```

Now you can use aliases like `pcode`, `pslides`, and `pux` to quickly switch prompt behaviors.

## Troubleshooting

### Backend Issues

Check the logs:
```bash
cat logs/backend.log
```

Common issues:
- Missing Python dependencies
- Invalid Claude API key
- Failed connection to MCP server

### Claudia Integration Issues

Check the Claudia bridge logs:
```bash
cat logs/claudia_mcp.log
```

Common issues:
- Missing or invalid Kalaw index file
- Failed registration with SKR
- Incorrect paths in configuration

### Pulser CLI Integration Issues

Check the command registry:
```bash
cat /path/to/pulser/tools/js/router/command_registry.js
```

Common issues:
- Command not registered correctly
- Missing dependencies in the command file
- Incorrect API endpoint URLs

### MCP Bridge Issues

If the MCP bridge fails to start:
```bash
python -m backend.services.claudia_mcp_bridge --debug
```

## Maintenance

### Updating MCP Prompts

When adding or updating prompts:

1. Add/update the prompt files in `mcp_prompts/`
2. Update the Kalaw index in `kalaw_mcp_prompts.yaml`
3. Re-register with Kalaw:
   ```bash
   ./register_with_kalaw.sh
   ```

### Backup and Restore

Backup important files:
```bash
mkdir -p backups
cp kalaw_mcp_prompts.yaml backups/kalaw_mcp_prompts_$(date +%Y%m%d_%H%M%S).yaml
cp -r mcp_prompts backups/mcp_prompts_$(date +%Y%m%d_%H%M%S)
```

Restore from backup:
```bash
cp backups/kalaw_mcp_prompts_20250514_120000.yaml kalaw_mcp_prompts.yaml
cp -r backups/mcp_prompts_20250514_120000/* mcp_prompts/
```