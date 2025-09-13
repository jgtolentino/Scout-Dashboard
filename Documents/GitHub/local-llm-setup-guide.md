# Local LLM Extension Setup for VS Code/Cursor

This guide provides two solutions for setting up a privacy-focused, offline AI assistant in VS Code or Cursor that mirrors Cline.bot's functionality.

## 🛠️ Solution 1: LM Studio + Continue Extension (Recommended)

### Prerequisites
- macOS, Windows, or Linux
- 8GB+ RAM (16GB recommended)
- VS Code or Cursor installed

### Step 1: Install LM Studio
1. Download [LM Studio](https://lmstudio.ai/)
2. Launch LM Studio and search for a coding model:
   - Recommended: `deepseek-r1:7b` (balanced performance)
   - Alternative: `CodeLlama-14b` (better quality, more RAM)
3. Download your chosen model
4. Enable the local server:
   - Click the server icon in the left panel
   - Toggle **Server ON**
   - Verify it's running at `http://localhost:1234`

### Step 2: Install Continue Extension
1. In VS Code/Cursor:
   - Press `Cmd+P` (macOS) or `Ctrl+P` (Windows/Linux)
   - Type: `ext install Continue.continue`
   - Install the extension

2. Configure Continue for privacy:
   - Create/edit `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "LM Studio",
      "provider": "lmstudio",
      "model": "AUTODETECT",
      "apiBase": "http://localhost:1234/v1"
    }
  ],
  "telemetry": {
    "enabled": false
  },
  "contextLength": 4096,
  "tabAutocompleteModel": {
    "title": "LM Studio",
    "provider": "lmstudio",
    "model": "AUTODETECT"
  },
  "customCommands": [
    {
      "name": "test",
      "prompt": "Write unit tests for the selected code"
    },
    {
      "name": "explain",
      "prompt": "Explain the selected code in detail"
    }
  ]
}
```

### Step 3: Usage
- **Generate code**: Press `Cmd+I` (macOS) or `Ctrl+I` (Windows/Linux)
- **Ask questions**: Click the Continue icon in the sidebar
- **Inline edits**: Select code → Right-click → "Continue: Edit"
- All interactions run completely offline

---

## ⚙️ Solution 2: Ollama + llama.cpp (Advanced)

### Prerequisites
- Command line familiarity
- Homebrew (macOS) or equivalent package manager

### Step 1: Install Ollama
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Pull a Model
```bash
# Lightweight option (7B parameters)
ollama pull deepseek-r1:7b

# Smaller option for limited RAM
ollama pull phi3:3b

# List downloaded models
ollama list
```

### Step 3: Install llama.cpp (Optional - for custom control)
```bash
# macOS
brew install llama.cpp

# Build from source (all platforms)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Run server with GPU acceleration
./server -m models/deepseek-r1-7b.gguf --n-gpu-layers 10 --port 11434
```

### Step 4: Install llama-vscode Extension
1. In VS Code/Cursor: Install `llama.vscode`
2. Configure in settings.json:

```json
{
  "llama.server.endpoint": "http://localhost:11434",
  "llama.completion.temperature": 0.7,
  "llama.completion.maxTokens": 2048,
  "llama.telemetry.enabled": false
}
```

---

## 🔧 Performance Optimization

### Model Selection by Hardware
| RAM | Recommended Model | Parameters |
|-----|------------------|------------|
| 8GB | `phi3:3b` | 3B |
| 16GB | `deepseek-r1:7b` | 7B |
| 32GB+ | `CodeLlama-14b` | 14B |

### GPU Acceleration
```bash
# Check GPU availability
llama-server --help | grep gpu

# Enable GPU layers (adjust based on VRAM)
llama-server --model path/to/model.gguf --n-gpu-layers 20
```

### Context Window Optimization
```json
{
  "contextLength": 2048,  // Reduce for faster responses
  "maxTokens": 512       // Limit output length
}
```

---

## ⚠️ Troubleshooting

### Model Not Detected
1. Verify server is running:
   - LM Studio: `curl http://localhost:1234/v1/models`
   - Ollama: `curl http://localhost:11434/api/tags`

2. Check firewall/antivirus blocking local connections

### Slow Responses
1. Reduce model size:
   ```bash
   ollama pull gemma:2b  # Ultra-light option
   ```

2. Enable CPU optimization:
   ```bash
   export LLAMA_THREADS=8  # Set to your CPU core count
   ```

3. Limit context in Continue:
   ```json
   {
     "contextLength": 1024,
     "maxTokens": 256
   }
   ```

### Extension Not Working in Cursor
- Cursor uses the same extension API as VS Code
- Ensure you're using the latest Cursor version
- Try restarting Cursor after installation

---

## 🔒 Privacy Verification

### Confirm Offline Operation
1. Disconnect from internet
2. Test code generation - should work normally
3. Check network activity:
   ```bash
   # macOS/Linux
   lsof -i :1234  # Should only show local connections
   ```

### Disable All Telemetry
```json
// VS Code settings.json
{
  "telemetry.telemetryLevel": "off",
  "continue.telemetry.enabled": false,
  "llama.telemetry.enabled": false
}
```

---

## 💎 Recommended Setup

For most users:
1. **Use LM Studio + Continue** (Solution 1)
2. **Start with `deepseek-r1:7b`** model
3. **Upgrade to larger models** if performance allows

This setup provides:
- ✅ Complete privacy (no data leaves your machine)
- ✅ Easy installation and configuration
- ✅ Good performance on modern hardware
- ✅ Full compatibility with both VS Code and Cursor

---

## 📊 VS Code vs Cursor Comparison

| Feature | VS Code | Cursor |
|---------|---------|--------|
| Local LLM Support | Via extensions | Via extensions + built-in AI |
| Setup Complexity | Moderate | Identical to VS Code |
| Privacy Options | Full control | Full control for local models |
| Performance | Depends on extension | Same as VS Code for local |

Both editors work identically for local LLM setups. Cursor's advantage is having built-in AI features as a fallback option.