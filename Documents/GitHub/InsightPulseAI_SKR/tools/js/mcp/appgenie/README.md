# AppGenie 🧞‍♂️

**AI-Native Mobile App Generator** - Transform natural language into production-ready applications.

[![Production Grade](https://img.shields.io/badge/status-production--grade-green)](https://github.com/appgenie/appgenie)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

AppGenie is a production-grade AI agent that converts natural language descriptions into fully functional applications with:

- ✅ **Full-stack code generation** (React/Vite frontend, FastAPI backend)
- ✅ **Multi-platform deployment** (Vercel, Azure, PWA, native)
- ✅ **Agent orchestration** (NLP → Templates → UI → Preview → Deploy)
- ✅ **Memory & context awareness** (Vector store integration)
- ✅ **Production observability** (Devstral tracing)

## Quick Start

```bash
# Install dependencies
npm install

# Initialize a new app
./dev.sh init "Build a feedback collection app with login, dashboard, and export to CSV"

# Edit the generated app
./dev.sh edit feedback-app

# Preview in device frames
./dev.sh preview feedback-app --device=iphone

# Deploy to production
./dev.sh deploy feedback-app --target=vercel
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────┐
│ NLP Parser  │────▶│   Template   │────▶│ UI Editor  │────▶│  Preview    │────▶│ Deployer │
│   Agent     │     │   Manager    │     │   Agent    │     │   Engine    │     │  Agent   │
└─────────────┘     └──────────────┘     └────────────┘     └─────────────┘     └──────────┘
      │                                           │                    │                 │
      └───────────────────────────────────────────┴────────────────────┴─────────────────┘
                                          Memory Store (RAG)
```

## Features

### 🎯 Natural Language to App
```bash
:appgenie "Create a habit tracker with streaks, reminders, and social sharing"
```

### 🎨 Multiple UI Modes
- **Mobile App Builder** - Drag-and-drop mobile app creation
- **Web App IDE** - Full-featured web development environment
- **Deck Builder** - Presentation and portfolio creation

### 🚀 Deployment Options
- **PWA** - Progressive Web Apps with offline support
- **Vercel** - Instant global deployment
- **Azure** - Enterprise cloud hosting
- **Expo** - React Native mobile apps
- **Native** - iOS/Android app stores

### 🧠 Memory & Context
```bash
# Save project context
./dev.sh remember project "e-commerce app for handmade crafts"

# Recall and update
./dev.sh recall project
./dev.sh update project "add inventory management"
```

### 📊 Production Monitoring
```bash
# View agent execution traces
./dev.sh trace nlp-parser
./dev.sh trace all
```

## Agent Pipeline

1. **NLP Parser** (`agents/nlp-parser.yaml`)
   - Converts natural language to structured app schema
   - Extracts screens, components, navigation, data models

2. **Template Manager** (`agents/template-manager.yaml`)
   - Applies design systems (Material, iOS, Fluent, Minimal)
   - Generates React/React Native components
   - Creates backend scaffolding

3. **UI Editor** (`agents/ui-editor.yaml`)
   - Provides visual editing interface
   - Real-time component manipulation
   - Property editing and preview

4. **Preview Engine** (`agents/preview-engine.yaml`)
   - Device frame rendering
   - Multi-platform preview
   - Live hot-reload

5. **Deployer** (`agents/deployer.yaml`)
   - Platform-specific build optimization
   - Deployment automation
   - Post-deployment verification

## Development

```bash
# Run tests
npm test

# Grade all agents
node scripts/grade_agents.mjs

# Start development server
./dev.sh serve

# View logs
tail -f logs/agents/*.log
```

## Configuration

### Environment Variables
```bash
# .env
OPENAI_API_KEY=sk-...
VERCEL_TOKEN=...
AZURE_SUBSCRIPTION_ID=...
DEVSTRAL_API_KEY=...
```

### Agent Configuration
Each agent is configured via YAML in the `agents/` directory with:
- Input/output schemas
- Runtime settings
- Post-processing hooks
- Tracing configuration

## MCP Integration

AppGenie is fully MCP-compatible and can be integrated into larger agent orchestration systems:

```yaml
# mcp.routes.yaml
routes:
  /appgenie/init:
    agent: nlp-parser
    chain: [template-manager, ui-editor, preview-engine]
    
  /appgenie/deploy:
    agent: deployer
    requires: [app_name, target]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📧 Email: support@appgenie.ai
- 💬 Discord: [discord.gg/appgenie](https://discord.gg/appgenie)
- 📚 Docs: [docs.appgenie.ai](https://docs.appgenie.ai)

---

Built with ❤️ by the AppGenie Team