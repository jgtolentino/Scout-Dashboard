# Prompt Lab Web Explorer

A web-based interface for exploring, analyzing, and improving system prompts in the Pulser CLI environment. This application allows users to browse the system prompts collection, analyze prompt effectiveness, create variations, and improve prompts.

## Features

- **Browse System Prompts**: Search and filter through the entire collection of system prompts
- **Analyze Prompts**: Get detailed analysis of prompt quality, clarity, and effectiveness
- **Improve Prompts**: Get AI-powered suggestions for improving prompt quality
- **Create Variations**: Generate and test different variations of prompts
- **Visualize Scores**: See prompt metrics in intuitive radar and bar charts

## Getting Started

### Prerequisites

- Node.js 14+
- React 17+
- Pulser CLI environment

### Installation

1. Navigate to the tools/js directory:
   ```
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/js
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser to:
   ```
   http://localhost:3000/prompt-lab
   ```

## Project Structure

```
prompt-lab/
├── api/
│   └── promptApi.js        # API client for prompt endpoints
├── components/
│   ├── EditorPanel.jsx     # Prompt editing interface
│   ├── PromptViewer.jsx    # Prompt viewing component
│   ├── ScoreChart.jsx      # Visualization for prompt metrics
│   └── TagList.jsx         # Tag management component
├── App.jsx                 # Main application component
├── index.js                # Application entry point
├── index.html              # HTML template
├── styles.css              # Application styles
└── README.md               # Documentation
```

## API Integration

The Prompt Lab connects to the following Pulser CLI API endpoints:

- `/api/system_prompts/search` - Search for prompts matching criteria
- `/api/system_prompts/view` - View a specific prompt
- `/api/system_prompts/info` - Get information about the prompt collection
- `/api/prompt_engineer/analyze` - Analyze a prompt
- `/api/prompt_engineer/improve` - Improve a prompt based on goals
- `/api/prompt_engineer/variations` - Generate variations of a prompt

## Development

### Building for Production

To build for production:

```
npm run build
```

The output will be in the `dist` directory, which can be deployed to any static hosting service.

### Adding New Features

When adding new features, follow these guidelines:

1. Create new components in the `components/` directory
2. Add API endpoints in `api/promptApi.js`
3. Update the main `App.jsx` to incorporate the new features
4. Add styles to `styles.css`

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- Built with React
- Powered by the Pulser CLI system prompts collection
- Uses Claude's prompt engineering capabilities