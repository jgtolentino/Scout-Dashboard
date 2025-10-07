# SlideForge MCP

An AI-native presentation builder, fully powered by Claude Max (Opus) via MCP Server.

## Architecture

SlideForge MCP uses a modern architecture with the following components:

1. **MCP Server Core**: Orchestrates AI agents and manages the presentation generation workflow
2. **Claude Max (Opus) Integration**: Powers AI content generation, feedback, and improvements
3. **React SSR Components**: Server-side rendered slide components for fast loading
4. **FastAPI Backend**: Handles API requests and orchestrates the MCP workflow
5. **Persistent State Management**: Maintains presentation state between sessions

## Features

- **Natural Language Deck Generation**: Create professional slide decks from simple prompts
- **AI-Powered Feedback**: Get intelligent suggestions on tone, clarity, and impact
- **Server-Side Rendering**: Fast, SEO-friendly presentation rendering
- **Multiple Export Formats**: HTML, PDF, and PPTX export options
- **Theme Support**: Multiple built-in themes with customization options

## Workflow

1. User provides a topic prompt
2. Claude Max generates structured slide content in JSON format
3. Slidebuilder renders the JSON into interactive HTML slides
4. Claude Max provides feedback and improvement suggestions
5. User can edit, publish, and share the final presentation

## Components

### Agents

- **deckgen**: Transforms natural language prompts into structured slide JSON
- **slidebuilder**: Renders slide JSON into interactive HTML presentations
- **feedback**: Provides intelligent feedback on presentation effectiveness

### Core Files

- **mcp.config.yaml**: Main MCP server configuration
- **mcp.routes.yaml**: API route definitions and agent routing
- **SlideViewerSSR.jsx**: Server-side renderable React component for slides
- **slideforge.py**: FastAPI routes for the SlideForge functionality

## Getting Started

```bash
# Start the MCP server
cd slideforge_mcp
npm install
npm run mcp

# In another terminal, start the FastAPI backend
cd ../backend
pip install -r requirements.txt
python main.py

# Open the demo page
open http://localhost:8000/slides/demo.html
```

## API Usage

```javascript
// Example: Generate a new deck
const response = await fetch('/api/slideforge/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'AI in Healthcare: Trends for 2025',
    slides: 6,
    style: 'professional',
    audience: 'healthcare executives'
  })
});

const result = await response.json();
console.log(`Deck ID: ${result.id}`);
```

## MCP Integration

SlideForge demonstrates how to integrate Claude Max with MCP for complex document generation:

1. Structured prompt templates ensure consistent AI output format
2. Sequential agent execution creates a pipeline of operations
3. Feedback loops improve the quality of generated content
4. Server-side rendering ensures fast, SEO-friendly presentation delivery

## Development

To extend SlideForge, modify the agent YAML files in the `agents/` directory or add new React components in `src/components/`.