# Clodrep Local CLI

**Claude-Parity Local AI Assistant with MCP Bridge Integration**

A comprehensive local AI CLI that provides Claude Code CLI compatibility with full offline operation, secure sandboxing, and hybrid cloud integration through MCP bridge.

## 🚀 Features

### Core Capabilities
- **🤖 Hybrid AI Execution**: Local LLMs + Cloud fallback
- **🔧 Complete Tool Framework**: All Claude CLI tools (Read, Write, Edit, Bash, etc.)
- **🔒 Advanced Security**: Sandboxed execution, permission system, audit logging
- **🌉 MCP Bridge**: Integrate with Claude.ai web/desktop apps
- **🧠 Intelligent Memory**: Persistent context and learning
- **📊 Workflow Orchestration**: Multi-step task planning and execution

### MCP Tool Framework
- **File Operations**: Read, Write, Edit, Glob, Grep
- **Execution**: Secure Bash runner with Docker sandbox
- **Web Integration**: WebFetch, WebSearch (with permission controls)
- **Notebooks**: Jupyter notebook support
- **Task Delegation**: Sub-agent spawning for complex workflows

### Security Features
- **Docker Sandboxing**: Isolated command execution
- **Permission System**: Granular file/network access controls
- **Audit Logging**: Comprehensive security event tracking
- **User Confirmation**: Interactive approval for sensitive operations
- **Path Validation**: Prevent directory traversal attacks

## 📦 Installation

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/your-org/clodrep-local.git
cd clodrep-local

# Run setup script
chmod +x setup.sh
./setup.sh
```

### Manual Installation

```bash
# Install dependencies
npm install

# Build project
npm run build

# Install Ollama (for local LLM)
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull deepseek-coder:13b-instruct
ollama pull llava:7b

# Start CLI
./bin/run
```

### Docker Deployment

```bash
# Start full stack with Ollama and ChromaDB
docker-compose up -d

# Or just the CLI
docker build -t clodrep-local .
docker run -it --rm -p 3000:3000 clodrep-local
```

## 🎯 Usage

### Basic CLI

```bash
# Start interactive session
clodrep

# With specific mode
clodrep --mode hybrid
clodrep --mode local
clodrep --mode cloud-first

# With MCP bridge
clodrep --bridge --port 3000

# Offline mode
clodrep --offline
```

### Interactive Commands

```bash
# In the CLI
▶ /help          # Show help
▶ /status        # System status
▶ /tools         # List available tools
▶ /bridge status # Bridge status
▶ /quit          # Exit

# Direct tool calls
▶ :Read file_path=./package.json
▶ :Write file_path=./test.txt content="Hello World"
▶ :Bash command="ls -la"

# AI interaction
▶ Analyze the code in src/index.ts
▶ Create a function to calculate fibonacci numbers
▶ Fix the bug in the authentication system
```

### MCP Bridge Integration

```bash
# Start bridge server
clodrep bridge start --port 3000

# Register with Claude.ai
clodrep bridge register --target web

# Register with Claude Desktop
clodrep bridge register --target desktop

# Check status
clodrep bridge status
```

## 🔧 Configuration

Configuration is stored in `~/.clodrep-local/config.yaml`:

```yaml
execution:
  mode: hybrid  # local | cloud-first | hybrid
  offline: false
  maxConcurrentTasks: 5

model:
  local:
    provider: ollama
    name: deepseek-coder:13b-instruct
    temperature: 0.2
  cloud:
    provider: claude
    model: claude-3-5-sonnet-20241022

bridge:
  enabled: true
  port: 3000
  security:
    enableMutualTLS: true
    allowedOrigins: ["https://claude.ai"]

security:
  confirmBeforeWrite: true
  auditLogging: true
  sandboxMode: docker
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:uat

# Run with UI
npm run test:ui

# Run UAT suite
npm run test:uat
```

### UAT Test Coverage

- **Core Functionality**: REPL, LLM integration, tool execution
- **MCP Bridge**: Server startup, tool registration, Claude integration
- **Security**: Sandbox isolation, permission validation, audit logging
- **Performance**: Response times, memory usage, concurrent operations
- **Cross-Platform**: macOS, Linux, Windows WSL2

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│ Claude Web/     │◄──►│ MCP Bridge      │
│ Desktop Apps    │    │ Server          │
└─────────────────┘    └─────────┬───────┘
                               │
┌─────────────────────────────┬─┴───────┐
│ Local Orchestrator          │         │
│ ┌─────────────────────────┐ │         │
│ │ Security Gateway        │ │         │
│ └─────────────────────────┘ │         │
│ ┌─────────────────────────┐ │         │
│ │ Tool Framework          │ │         │
│ │ • File Operations       │ │         │
│ │ • Secure Bash Runner    │ │         │
│ │ • Web Client            │ │         │
│ │ • Agent Delegation      │ │         │
│ └─────────────────────────┘ │         │
│ ┌─────────────────────────┐ │         │
│ │ Memory System           │ │         │
│ └─────────────────────────┘ │         │
└─────────────────────────────┴─────────┘
┌─────────────────┐    ┌─────────────────┐
│ Local LLM       │    │ Cloud LLM       │
│ (Ollama)        │    │ (Claude API)    │
└─────────────────┘    └─────────────────┘
```

## 🔒 Security Model

- **Sandboxed Execution**: All commands run in Docker containers
- **Permission Matrix**: Granular file system and network access controls
- **Audit Logging**: All operations logged with retention policies
- **User Confirmation**: Interactive approval for destructive operations
- **Data Minimization**: Only necessary data sent to cloud services
- **Mutual TLS**: Secure bridge communication with certificate pinning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📚 Documentation

- [API Documentation](./docs/api/)
- [Configuration Guide](./docs/guides/configuration.md)
- [Security Guide](./docs/guides/security.md)
- [MCP Bridge Guide](./docs/guides/mcp-bridge.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI and inspiration
- [Ollama](https://ollama.com) for local LLM runtime
- [oclif](https://oclif.io) for CLI framework
- [Docker](https://docker.com) for sandboxing infrastructure

---

**Made with ❤️ by the Clodrep Team**