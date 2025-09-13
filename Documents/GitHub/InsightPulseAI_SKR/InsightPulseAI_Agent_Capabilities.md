# InsightPulseAI Agents & Orchestration Snapshot

This document provides a comprehensive snapshot of the agent capabilities, workflows, and orchestration mechanisms within the InsightPulseAI and Pulser systems.

## 1. Core Agents

### 1.1 Creative & Strategy Agents

| Agent | Role | Key Capabilities | Integration Points |
|-------|------|-----------------|-------------------|
| **Claudia** | Creative Systems Director | • SKR Auto-Sync<br>• Content Routing<br>• Git Integration<br>• System Validation | Central orchestration hub |
| **Kalaw** | Knowledge Synthesizer | • Agent Indexing<br>• Workflow Processing<br>• Document Registration<br>• Notion Integration | Works with Claudia for knowledge routing |
| **Kath** | Copywriter | • Rewrite Logic<br>• Tone Matching<br>• Caption Generation | First agent in creative chain |
| **Tess** | Visual Storyteller | • Visual Prompting<br>• Storyboarding<br>• Trend Mapping<br>• Figma Integration | Second agent in creative chain |
| **Lea** | Audio Composer | • Soundtrack Design<br>• Emotion Mapping<br>• Voiceover Logic | Final agent in creative chain |
| **Iggy** | Sales Strategist | • Objection Handling<br>• Offer Crafting<br>• Funnel Messaging | Powers sales workflows |

### 1.2 Technical Implementation Agents

| Agent | Role | Key Capabilities | Integration Points |
|-------|------|-----------------|-------------------|
| **Pulser CLI** | Local LLM Interface | • Ollama Integration<br>• Shell Commands<br>• Session Memory<br>• Task Management | Command-line interface for local models |
| **LeadOps** | Multi-phase Workflow | • Lead Generation<br>• Lead Qualification<br>• Engagement Planning<br>• Performance Analytics | Integrates with Pulser shells |
| **Trinity** | SKR Memory System | • Context Management<br>• Session Indexing<br>• Deduplication<br>• Similarity Search | Core memory system for all agents |

## 2. Workflows & Systems

### 2.1 Creative Workflows

| Workflow | Description | Agents Involved | Inputs & Outputs |
|----------|-------------|----------------|-----------------|
| **Visual Agent Chain** | End-to-end creative production | Kath → Tess → Lea | IN: Creative briefs<br>OUT: Multimedia concepts |
| **Figma Storyboard** | Visual storyboard creation | Primary: Tess | IN: Scene descriptions<br>OUT: Figma layouts |
| **Sales Pitch Orchestration** | Sales content generation | Primary: Iggy | IN: Client analysis<br>OUT: Pitch materials |

### 2.2 Technical Workflows

| Workflow | Description | Key Components | Function |
|----------|-------------|----------------|----------|
| **SKR Auto-Sync** | Knowledge synchronization | claudia_autosync_downloads.sh | Monitors downloads folder and routes content |
| **Pulser Shell** | Interactive LLM CLI | pulser_shell_enhanced.sh | Provides shell interface to local LLMs |
| **Pulser Task System** | Task management | :task command | Creates task tracking with session tagging |
| **LeadOps Job** | Multi-phase lead operations | leadops_job.yaml | Defines phases for lead generation process |

## 3. Orchestration Mechanisms

### 3.1 Core Systems

| System | Purpose | Implementation | Key Features |
|--------|---------|----------------|-------------|
| **Claudia Router** | Central routing | claudia_router.yaml | Trigger-based routing to appropriate agents |
| **SKR** | Knowledge management | Directory structure | Metadata-based routing and processing |
| **LLM Router** | Agent instantiation | claudia_llm_router.sh | Dynamic agent creation with system prompts |
| **Pulser MVP** | Local LLM interface | pulser_validate.sh | Project validation and heartbeat checks |

### 3.2 Integration Points

| Integration | Purpose | Components | Implementation |
|-------------|---------|------------|----------------|
| **GitHub Sync** | Version control | Git hooks | Automatic commits for SKR changes |
| **Ollama Models** | Local inference | Mistral, CodeLlama, TinyLlama | Model fallback and switching |
| **Session Indexing** | Memory persistence | session_indexer.py | Searchable repository of session history |
| **File Routing** | Content organization | File naming conventions | Pattern-based routing of YAML/markdown files |

## 4. Implementation Details

### 4.1 Directory Structure

```
InsightPulseAI_SKR/
├── 00_APRAOCHED/          # Strategy documents
├── 01_AGENTS/             # Agent definitions
│   ├── claudia.yaml       # Claudia agent definition
│   ├── iggy.yaml          # Iggy agent definition
│   ├── kath.yaml          # Kath agent definition
│   ├── lea.yaml           # Lea agent definition
│   └── tess.yaml          # Tess agent definition
├── 02_WORKFLOWS/          # Workflow definitions
├── SKR/                   # Synthetic Knowledge Repository
│   ├── inbox/             # New content landing area
│   ├── sessions/          # Session records
│   └── tasks/             # Task definitions
├── cli/                   # Command line interfaces
│   └── free               # Global CLI wrapper
├── config/                # Configuration files
├── scripts/               # Operational scripts
│   ├── claudia_autosync_downloads.sh  # Core orchestration script
│   ├── kalaw_llm_router.sh            # Knowledge routing
│   ├── leadops_job.yaml               # LeadOps workflow definition
│   ├── pulser_infer_ollama.py         # Ollama integration
│   ├── pulser_shell_enhanced.sh       # Interactive shell
│   ├── pulser_validate.sh             # MVP validation
│   └── session_indexer.py             # Memory management
└── claudia_router.yaml   # Main router configuration
```

### 4.2 Key Features

- **Automatic file routing** based on naming patterns and metadata
- **Session memory persistence** across command-line interactions
- **Task ID generation** for tracking multi-step processes
- **Multi-phase workflow definitions** with dependencies
- **GitHub integration** for version control
- **Local LLM inference** via Ollama
- **Command-line interface** with special commands
- **Two-way agent communication** via SKR

### 4.3 Usage Examples

```bash
# Start the Pulser CLI
free

# Begin a new LeadOps task
pulser> :task leadops-client-xyz

# Resume previous session
pulser> :resume

# Search past sessions
pulser> :search marketing

# Switch to different model
pulser> :switch codellama

# Save session to SKR
pulser> :skr
```

## 5. Future Development

### 5.1 Planned Enhancements

- **Distributed agent execution** across multiple machines
- **Expanded model support** for additional GGUF models
- **Real-time collaboration** between multiple agents
- **Enhanced visualization** of agent interaction graphs
- **Automated testing** of agent workflows
- **Improved memory management** with semantic chunking
- **Expanded CLI capabilities** with additional commands

### 5.2 Integration Roadmap

- **Notion API integration** for knowledge base management
- **Vector database integration** for improved semantic search
- **Unity3D integration** for visual agent simulations
- **Apple Shortcuts integration** for mobile workflows
- **Cloudflare workers** for distributed agent execution