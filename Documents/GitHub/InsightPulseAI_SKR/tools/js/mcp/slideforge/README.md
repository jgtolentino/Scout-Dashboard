# SlideForge

> AI-native deck builder powered by Claude Code CLI, orchestrated via MCP (Model Context Protocol).

SlideForge is a presentation creation tool that leverages AI to generate, refine, and publish slide decks based on natural language prompts. Built with the Claude Code CLI and MCP architecture, it provides an intuitive interface for creating professional presentations with minimal effort.

## 🚀 Features

- **AI-driven deck generation** from natural language prompts
- **Intelligent slide editing** with real-time feedback
- **AI review and suggestions** for content improvement
- **Multiple export formats** including web, PDF, and PowerPoint
- **MCP-based agent architecture** for extensibility

## 📋 Prerequisites

- Node.js 16+
- Claude Code CLI installed
- MCP server running

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/slideforge.git
   cd slideforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize SlideForge:
   ```bash
   ./slideforge-mcp.sh init
   ```

## 📖 Usage

SlideForge provides several commands via the MCP interface:

### Generate a Slide Deck

```bash
./slideforge-mcp.sh deckgen "Create a product launch deck for a GenAI SaaS tool"
```

This generates a JSON file with the slide structure in `slides/generated/`.

### Edit a Slide Deck

```bash
./slideforge-mcp.sh slidebuilder slides/generated/my_deck.json
```

Launches the SlideForge UI for editing the specified deck.

### Get AI Feedback

```bash
./slideforge-mcp.sh feedback slides/generated/my_deck.json
```

Generates feedback and suggestions for improving the deck.

### Publish a Slide Deck

```bash
./slideforge-mcp.sh publish slides/generated/my_deck.json web
```

Publishes the deck in the specified format (web, pdf, pptx, images).

## 🧩 Architecture

SlideForge uses the MCP (Model Context Protocol) to orchestrate a series of agents:

- **deckgen**: Claude-powered deck generation agent
- **slidebuilder**: UI rendering and interaction agent
- **feedback**: Claude-powered presentation review agent
- **publish**: Output generation and deployment agent

The MCP configuration resides in `.claude-cli/mcp.config.yaml`.

## 🌐 Web Interface

To launch the SlideForge web interface:

```bash
npm run dev
```

This starts a development server at http://localhost:3000 where you can create and edit slide decks.

## 🖥️ Development

### Project Structure

```
slideforge/
├── agents/                 # Agent YAML definitions
│   ├── deckgen.claude.yaml
│   ├── slidebuilder.ui.yaml
│   └── feedback.reviewer.yaml
├── slides/                 # Generated slide data
│   └── generated/
├── public/                 # Static assets
│   └── assets/
├── src/                    # React components
│   ├── components/
│   ├── App.jsx
│   └── App.css
├── .claude-cli/            # Claude CLI configuration
│   └── mcp.config.yaml
├── slideforge-mcp.sh       # CLI interface
└── package.json
```

### Building a Production Version

```bash
npm run build
```

## 📜 License

MIT

## 🙏 Acknowledgements

- Built with [Claude Code CLI](https://anthropic.com)
- React framework and Monaco editor
- MCP architecture for agent orchestration