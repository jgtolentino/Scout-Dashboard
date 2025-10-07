# DeepSeek Local Setup - Quick Start

## ✅ Setup Complete!

DeepSeek Coder is now configured for local use with your Pulser/Codex CLI.

### Available Models
- **deepseek-coder:6.7b-instruct-q4_K_M** (4.1GB) - Fast, good for quick tasks
- **deepseek-coder:33b** (18GB) - Powerful, better for complex tasks

### Usage Examples

#### 1. Direct with Ollama
```bash
# Quick code generation
ollama run deepseek-coder:6.7b-instruct-q4_K_M "Write a Python function to parse JSON"

# Complex refactoring  
ollama run deepseek-coder:33b "Refactor this class to use dependency injection"
```

#### 2. Using the wrapper script
```bash
# Default (uses 6.7B model)
./scripts/deepseek "Generate unit tests for a calculator class"

# Use large model
./scripts/deepseek --large "Design a microservices architecture"
```

#### 3. With Pulser CLI (once integrated)
```bash
# Using aliases configured in .pulserrc
:ds "Fix the bug in this function"      # Uses 6.7B
:dsl "Optimize this algorithm"          # Uses 33B
:codex-local "Refactor entire module"   # Codex mode with DeepSeek
```

### API Endpoints
- Ollama API: `http://127.0.0.1:11434`
- Models endpoint: `http://127.0.0.1:11434/api/tags`
- Generate endpoint: `http://127.0.0.1:11434/api/generate`

### Configuration Files
- Pulser config: `~/.pulserrc` (updated with DeepSeek models)
- Model config: `pulser/configs/deepseek_local.yaml`
- API wrapper: `pulser/tools/deepseek_api_wrapper.py`

### Troubleshooting

#### If models are slow to respond:
```bash
# Check if model is loaded
curl http://127.0.0.1:11434/api/tags | jq

# Restart Ollama
pkill ollama
ollama serve &
```

#### To verify everything is working:
```bash
# Test generation
curl -X POST http://127.0.0.1:11434/api/generate \
  -d '{"model": "deepseek-coder:6.7b-instruct-q4_K_M", "prompt": "Hello", "stream": false}'
```

### Next Steps
1. Test with simple prompts to get familiar with response times
2. Use 6.7B for quick tasks, 33B for complex ones
3. Configure your IDE to use DeepSeek for code completion
4. Explore the API wrapper for advanced integrations

### Performance Tips
- First response will be slower as model loads into memory
- Keep Ollama running in background for faster subsequent queries
- Use GPU acceleration if available (CUDA on Linux/Windows)
- Adjust context window in config for longer conversations

Enjoy your local, private AI coding assistant! 🚀