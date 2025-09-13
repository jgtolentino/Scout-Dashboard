# PulserBuilder

<div align="center">
  <img src="public/logo.svg" alt="PulserBuilder Logo" width="200">
  <h3>AI-Powered UI Generation Platform</h3>
  <p>Build beautiful interfaces with natural language</p>
</div>

---

## 🚀 Overview

PulserBuilder is a robust platform that transforms natural language prompts into fully functional user interfaces. Powered by a suite of specialized AI agents, it streamlines the process of designing, building, and deploying modern web applications.

### ✨ Key Features

- **Natural Language UI Generation**: Describe your UI in plain English and watch it come to life
- **Interactive Visual Editor**: Fine-tune generated components with an intuitive drag-and-drop interface
- **Agent-Based Architecture**: Specialized AI agents for different aspects of the development process
- **Code Export**: Generate clean, production-ready React, Vue, or Angular code
- **Design System Integration**: Built-in support for popular frameworks like Tailwind CSS, Material UI, and more
- **Version Control**: Track changes and collaborate with team members
- **Instant Deployment**: One-click deployment to Vercel, Netlify, or Firebase

## 🧠 Agent Architecture

PulserBuilder leverages a team of specialized AI agents to handle different aspects of the UI generation process:

- **Maya** - UI/UX designer creating beautiful, functional interfaces
- **DeckGen** - Presentation and documentation specialist
- **Claudia** - Orchestration agent for coordinating complex workflows
- **Basher** - DevOps specialist handling system configuration and deployment

## 🛠️ Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Firebase account (for backend services)
- Claude API key (for agent communication)

### Installation

```bash
# Clone the repository
git clone https://github.com/insightpulseai/pulserbuilder.git
cd pulserbuilder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id

# Claude API Configuration
CLAUDE_API_KEY=your_claude_api_key

# Agent Configuration
AGENT_API_URL=your_agent_api_url
AGENT_API_KEY=your_agent_api_key
```

## 📚 Usage

### Generating a UI from a Prompt

1. Log in to your PulserBuilder account
2. Click "Create New Project" from the dashboard
3. Enter a descriptive prompt (e.g., "A fitness tracker with habit streaks")
4. Click "Generate UI" and wait for the magic to happen
5. Use the visual editor to customize the generated components
6. Export the code or deploy directly to your hosting provider

### Command Line Interface

PulserBuilder includes a powerful CLI for advanced workflows:

```bash
# Generate UI from prompt
npx pulserbuilder generate "Fitness tracker with habit streaks"

# Generate and deploy to Vercel
npx pulserbuilder deploy --prompt "Fitness tracker with habit streaks" --platform vercel

# Generate UI from a saved prompt file
npx pulserbuilder generate --file ./prompts/fitness-tracker.md
```

## 🏗️ Project Structure

```
/pulserbuilder/
├── agents/                 # Agent configurations
│   ├── maya.yaml           # UI/UX designer agent
│   ├── deckgen.yaml        # Presentation generator agent
│   ├── claudia.yaml        # Orchestration agent
│   └── basher.yaml         # DevOps agent
├── src/
│   ├── components/         # React components
│   ├── pages/              # Page components
│   └── hooks/              # Custom React hooks
├── backend/                # Firebase functions
│   └── functions/          # Cloud functions
├── public/                 # Static assets
│   └── preview.html        # Preview template
├── .pulserrc               # Configuration file
└── deploy.sh               # Deployment script
```

## 🔌 API Reference

PulserBuilder provides a comprehensive API for integration with other tools:

### REST API

```
POST /api/generate-ui
POST /api/generate-component
POST /api/improve-ui
POST /api/generate-code
POST /api/analyze-design
POST /api/deploy
```

### JavaScript SDK

```javascript
import { PulserBuilder } from '@pulserbuilder/sdk';

const pb = new PulserBuilder({
  apiKey: 'your_api_key'
});

// Generate UI from prompt
const ui = await pb.generateUI("Fitness tracker with habit streaks");

// Export to React code
const code = await pb.generateCode(ui.components, {
  framework: 'react',
  cssFramework: 'tailwind'
});
```

## 🧩 Component Library

PulserBuilder includes a comprehensive library of UI components:

- **Layout**: Container, Grid, Flex, Box
- **Navigation**: NavigationBar, BottomNavigation, Sidebar, Menu
- **Display**: Card, Table, List, Avatar, Badge
- **Input**: Button, TextField, Select, Checkbox, Radio, Switch
- **Feedback**: Alert, Progress, Skeleton, Toast, Modal
- **Data**: Chart, DataGrid, Timeline, KPI
- **Media**: Image, Video, Icon, Carousel

Each component is fully customizable with properties, styles, and event handlers.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 🚢 Deployment

PulserBuilder supports multiple deployment targets:

### Vercel

```bash
./deploy.sh production vercel
```

### Firebase

```bash
./deploy.sh production firebase
```

### Netlify

```bash
./deploy.sh production netlify
```

## 🛣️ Roadmap

- [ ] Multi-language support
- [ ] Collaborative editing
- [ ] Custom component creation
- [ ] Theme designer
- [ ] Animation builder
- [ ] A/B testing integration
- [ ] Performance analytics

## 👥 Contributing

We welcome contributions to PulserBuilder! Please see our [Contributing Guide](CONTRIBUTING.md) for more information.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

PulserBuilder is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- [Claude](https://www.anthropic.com/claude) for AI capabilities
- [React](https://reactjs.org/) for UI framework
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vercel](https://vercel.com/) for deployment

---

<div align="center">
  Built with ❤️ by the InsightPulseAI Team
</div>