# Pulser VS Code Extension Guide

## ✅ Installation Complete!

The Pulser VS Code extension has been successfully installed. 

## 🚀 How to Use

1. **Restart VS Code** (important!)
2. Look for the **Pulser icon** in the Activity Bar (left sidebar)
3. Click it to open the chat panel
4. Start coding with AI assistance!

## 📝 Available Commands

Right-click on selected code to access:
- **Explain Selected Code** - Get detailed explanations
- **Fix Code Issues** - Get suggestions for improvements
- **Generate Tests** - Create unit tests automatically

## ⚙️ Configuration

### Current Setup
- **API Endpoint**: `http://localhost:11434` (Ollama)
- **Default Model**: `codellama:7b-code`
- **Available Models**:
  - `deepseek-coder:6.7b-instruct-q4_K_M` (Recommended)
  - `deepseek-coder:33b` (More powerful, slower)
  - `codellama:7b-code` (Default)

### To Use DeepSeek

1. Open VS Code Settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Search for "pulser"
3. Change **Pulser: Model** to `deepseek-coder:6.7b-instruct-q4_K_M`

Or add to your VS Code settings.json:
```json
{
  "pulser.model": "deepseek-coder:6.7b-instruct-q4_K_M",
  "pulser.apiEndpoints": [
    "http://127.0.0.1:11434/api/generate",
    "http://localhost:11434/api/generate"
  ]
}
```

## 🔧 Troubleshooting

### Extension Not Showing Up?
1. Make sure VS Code is fully restarted
2. Check View → Extensions and search for "Pulser"
3. Ensure it's enabled

### Chat Not Working?
1. Verify Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. If not, start it:
   ```bash
   ollama serve
   ```

### Model Not Found?
Pull the model first:
```bash
ollama pull deepseek-coder:6.7b-instruct-q4_K_M
```

### Connection Issues?
The extension tries multiple endpoints:
- `http://127.0.0.1:11434`
- `http://localhost:11434`

If both fail, check your firewall settings.

## 🎨 Features

- **Chat Interface**: Interactive AI chat in the sidebar
- **Code Context**: Automatically includes selected code
- **Multiple Models**: Switch between different AI models
- **Offline**: Everything runs locally, no internet required
- **Privacy**: Your code never leaves your machine

## 🔍 Extension Location

- **Installed at**: `~/.vscode/extensions/undefined_publisher.pulser-0.0.1`
- **Source code**: `/Users/tbwa/Documents/GitHub/cline-wrapper`
- **VSIX file**: `/Users/tbwa/Documents/GitHub/cline-wrapper/pulser-0.0.1.vsix`

## 📚 Next Steps

1. Try selecting some code and right-clicking → "Explain Selected Code"
2. Open the Pulser chat panel and ask coding questions
3. Experiment with different models for various tasks
4. Configure keyboard shortcuts for quick access

Enjoy your AI-powered coding experience! 🚀