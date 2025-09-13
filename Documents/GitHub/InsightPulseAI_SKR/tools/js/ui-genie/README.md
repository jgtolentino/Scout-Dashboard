# Magic Patterns (UI-Genie)

An AI-powered UI generator that creates beautiful UI components from text descriptions.

## 🚀 Quick Start

The easiest way to start both servers with proper configurations:

```bash
./direct-deploy.sh
```

Then open http://localhost:3030 in your browser.

## 🛠️ Manual Setup

### Prerequisites

- Node.js (v16+)
- Python 3.9+
- npm or yarn
- OpenAI API key or Claude API key (optional for mock mode)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8080
```

## 🔧 Configuration

Backend configuration is stored in `.env`:

```
# API Keys for AI Models
OPENAI_API_KEY=your_openai_key_here
# CLAUDE_API_KEY=your_claude_key_here

# Development Settings
MOCK_MODE=true  # Set to false to use real AI models
```

## 📚 Features

- 🧠 AI-Generated UI: Transform text prompts into fully functional UI components
- 🎨 Live Preview: See your generated UI in real-time
- 💾 Save & Restore: Save your favorite designs for later use
- 📋 Code Export: Copy the generated code for use in your projects

## 📦 Deployment

The `deploy` directory contains scripts to deploy the application to Azure:

- Static Web App for the frontend
- App Service for the backend API

See `deploy/README.md` for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.