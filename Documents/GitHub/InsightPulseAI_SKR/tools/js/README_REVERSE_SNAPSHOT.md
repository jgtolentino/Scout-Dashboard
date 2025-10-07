# Reverse Snapshot Tool

The Reverse Snapshot tool simulates Pulser's `:reverse` command, which analyzes products and generates PRD-style documentation of their features, architecture, and strategic positioning.

## Features

- **Product Analysis**: Analyzes a target product to extract key features and strategic positioning
- **Agent Routing**: Intelligently routes different aspects of the analysis to specialized AI agents
- **Markdown Formatting**: Generates well-formatted markdown with tables, bullet points, and YAML blocks
- **Multiple Output Formats**: Supports markdown, JSON, and YAML output

## Usage

### Running the Demo

The easiest way to run the demo is using the provided shell script:

```bash
./run_reverse_snapshot.sh
```

### Command-Line Options

```bash
./run_reverse_snapshot.sh [options]

Options:
  -h, --help       Show this help message
  -f, --format     Output format (markdown, json, yaml)
  -s, --save-only  Generate the output but don't print to console
  -v, --view       Open the output file in default viewer after generating
  -d, --debug      Enable debug mode with verbose logging
```

### Example Usage

```bash
# Generate markdown output (default) and view it
./run_reverse_snapshot.sh --view

# Generate JSON output in save-only mode
./run_reverse_snapshot.sh --format=json --save-only

# Run in debug mode with YAML output
./run_reverse_snapshot.sh --format=yaml --debug
```

## Using the API

You can also use the ReverseSnapshot class directly in your JavaScript code:

```javascript
const ReverseSnapshot = require('./reverse_snapshot_integrated');

// Create a new instance
const reverseSnapshot = new ReverseSnapshot({
  outputFormat: 'markdown',
  includeAgents: ['maya', 'claudia', 'kalaw', 'echo', 'deckgen']
});

// Set the target product
reverseSnapshot.setTarget('YourProduct', {
  owner: 'YourCompany',
  context: 'Product launch context'
});

// Analyze the product
reverseSnapshot.analyze();

// Generate the output
const output = reverseSnapshot.generateOutput();

console.log(output);
```

## Files

- `reverse_snapshot.js`: Basic implementation of ReverseSnapshot
- `reverse_snapshot_integrated.js`: Enhanced version with agent routing
- `agent_router.js`: Agent routing simulation
- `utils/markdown_formatter.js`: Utilities for formatting markdown
- `demo_reverse_snapshot.js`: Simple demo of basic functionality
- `demo_integrated_reverse.js`: Demo of integrated functionality
- `run_reverse_snapshot.sh`: Shell script to run the demo easily

## Output

The output is saved to the `output/` directory as `reverse_snapshot_result.md` (or `.json`/`.yaml` if you've selected a different format).

## Example Output

The sample output looks like this:

```markdown
**Pulser Reverse Snapshot**
`:reverse --target "Codex Relaunch by OpenAI"`
*(Agents involved: maya, claudia, kalaw, echo, deckgen)*

---

### **Product PRD: Codex Relaunch by OpenAI (Post-Windsurf Acquisition)**

**Product Name:** Codex Relaunch by OpenAI
**Owner:** OpenAI
**Launch Context:** Relaunched after acquiring Windsurf (Codeium) for $3B

---

### **1. Product Objective**

To become the industry-standard autonomous software engineering agent by combining OpenAI's LLMs with acquired technology, offering end-to-end capability in a cloud-isolated environment.

---

### **2. Strategic Improvements over Previous Codex**

| Area | Original Codex | Codex Relaunch |
| ---- | -------------- | -------------- |
| Core Function | Code completion | Autonomous agent for software development |
| UX | VSCode plug-in (basic autocomplete) | Cloud IDE with full agent execution sandbox |
| Backend | GPT-3.5–like Codex model | o3 model with parallel task orchestration |
| Task Handling | Single task (code assist) | Multi-tasking (feature write, test, PR, debug) |
| Acquisition Lift | N/A | Inherited Windsurf's Cascade + Supercomplete |

...
```

## Agent Routing

The tool simulates Pulser's agent routing capabilities, allowing tasks to be delegated to specialized AI agents:

- **Maya**: Process Architect (PRD creation, workflow design)
- **Claudia**: Strategic Orchestrator (business strategy, market analysis)
- **Kalaw**: Research Indexer (data storage, knowledge management)
- **Echo**: Multimodal Analyzer (UI/UX testing, visual analysis)
- **Deckgen**: Visualizer (presentation creation, visual design)

Each agent has different expertise and domains, and the router assigns tasks based on which agent is best suited for the specific aspect of the analysis.