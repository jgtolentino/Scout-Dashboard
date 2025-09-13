# Pulser

Pulser is a powerful AI agent application built on Electron. It provides intelligent assistance for a wide range of tasks including analytics, research, and content creation.

## Features

- **AI-Powered Assistant**: Complete complex tasks across research, analysis, and content creation
- **Multi-model Support**: Connect to various LLM providers (Anthropic Claude, OpenAI, etc.)
- **Advanced Analytics**: Generate insights from various data sources
- **Modern UI**: Built with React, Tailwind CSS, and Radix UI components
- **Cross-platform**: Works on macOS (Apple Silicon & Intel) and Windows (coming soon)
- **Extensible Architecture**: Easily add new capabilities and integrations

## System Requirements

- macOS 10.15+ or Windows 10+
- 4GB RAM minimum, 8GB recommended
- 1GB free disk space

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Setup

1. Clone the repository:
```bash
git clone https://github.com/pulser-ai/pulser-app.git
cd pulser-app
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

### Building

To build the application for production:

```bash
npm run build
```

## Architecture

Pulser is built on Electron with a React frontend. Key components:

- **Main Process**: Handles system-level operations and window management
- **Renderer Process**: Provides the user interface using React and Tailwind
- **Preload Script**: Bridges the main and renderer processes securely
- **AI Integration**: Connects to multiple AI providers (Anthropic, OpenAI)

## License

Copyright © 2025 Pulser Team. All rights reserved.

## Acknowledgements

Inspired by Pointer (https://trypointer.com), this project aims to create an open, extensible AI agent platform.