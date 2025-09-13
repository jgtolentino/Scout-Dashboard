# DeepSeek Coder Local Setup for Pulser/Codex CLI

## Quick Start

Run the automated setup:
```bash
./scripts/setup_deepseek_local.sh
```

## Manual Setup

### 1. Install Ollama
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Pull DeepSeek Models
```bash
# Fast model (6.7B parameters, ~4GB)
ollama pull deepseek-coder:6.7b-instruct-q4_K_M

# Powerful model (33B parameters, ~20GB, requires 32GB+ RAM)
ollama pull deepseek-coder:33b-instruct-q4_K_M
```

### 3. Start Ollama Service
```bash
ollama serve
```

## Usage with Pulser/Codex

### Basic Commands
```bash
# Use DeepSeek 6.7B (fast)
pulser --model deepseek-6.7b "Generate a Python function to parse JSON"

# Use DeepSeek 33B (powerful)
pulser --model deepseek-33b "Refactor this entire module for better performance"

# Use aliases
ds "Write unit tests for this function"     # Uses 6.7B
dsl "Design a microservices architecture"   # Uses 33B
```

### Codex Mode
```bash
# Activate Codex with DeepSeek
pulser :codex --model deepseek-33b

# Or use the alias
codex-local "Implement authentication system"
```

## Configuration Files

### 1. Model Configuration
Location: `~/.pulser/deepseek_config.json`

### 2. Pulser Integration
Location: `pulser/configs/deepseek_local.yaml`

Key settings:
- Temperature: 0.2 (focused output)
- Context window: 16K tokens
- Local-only mode for privacy

## API Compatibility

### OpenAI-Compatible Wrapper
Start the wrapper for tools expecting OpenAI API:
```bash
python pulser/tools/deepseek_api_wrapper.py
```

This provides endpoints at:
- `http://localhost:8080/v1/chat/completions`
- `http://localhost:8080/v1/models`

## Performance Optimization

### GPU Acceleration
```bash
# Set GPU layers (adjust based on VRAM)
OLLAMA_NUM_GPU=30 ollama serve
```

### Memory Management
```bash
# Limit model memory usage
OLLAMA_MAX_LOADED_MODELS=1 ollama serve
```

### Batch Processing
```bash
# Process multiple files efficiently
find . -name "*.py" | xargs -I {} pulser --model deepseek-6.7b "Review: {}"
```

## Troubleshooting

### Issue: "Model not found"
```bash
# Check available models
ollama list

# Re-pull if needed
ollama pull deepseek-coder:6.7b-instruct-q4_K_M
```

### Issue: "Out of memory"
- Use the 6.7B model instead of 33B
- Reduce context length in requests
- Close other applications

### Issue: "Slow responses"
- Ensure Ollama is using GPU: `nvidia-smi` or `system_profiler SPDisplaysDataType`
- Use quantized models (Q4_K_M)
- Reduce max_tokens parameter

## Model Selection Guide

| Use Case | Recommended Model | Rationale |
|----------|------------------|-----------|
| Quick code fixes | deepseek-6.7b | Fast response, good accuracy |
| Complex refactoring | deepseek-33b | Better understanding of context |
| Real-time assistance | deepseek-6.7b | Low latency |
| Architecture design | deepseek-33b | Superior reasoning |
| Batch processing | deepseek-6.7b | Efficient resource usage |

## Privacy & Security

All processing happens locally:
- No data sent to external servers
- No API keys required
- Full control over model behavior
- Suitable for sensitive codebases

## Integration with Existing Workflow

### VS Code Integration
```json
// .vscode/settings.json
{
  "pulser.defaultModel": "deepseek-6.7b",
  "pulser.localMode": true
}
```

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
pulser --model deepseek-6.7b "Review staged changes for issues"
```

### CI/CD Pipeline
```yaml
# .github/workflows/code-review.yml
- name: Local Code Review
  run: |
    ollama serve &
    sleep 5
    pulser --model deepseek-6.7b "Review PR changes"
```

## Advanced Features

### Custom Prompts
Create `~/.pulser/prompts/deepseek.txt`:
```
You are DeepSeek Coder running locally. Focus on:
- Security best practices
- Performance optimization
- Clean code principles
```

### Model Fine-tuning
For specialized domains, consider fine-tuning:
```bash
# Export base model
ollama push deepseek-coder:6.7b-instruct-q4_K_M

# Fine-tune with your data
# (Requires additional setup)
```

## Benchmarks (M1 Max, 64GB RAM)

| Operation | DeepSeek 6.7B | DeepSeek 33B | Claude 3 (API) |
|-----------|---------------|--------------|----------------|
| First token | 0.8s | 2.1s | 1.2s |
| Tokens/sec | 42 | 18 | N/A |
| Context load | 1.2s | 3.5s | 0s |
| Privacy | ✅ Local | ✅ Local | ❌ Cloud |

## Next Steps

1. Test the setup: `pulser --model deepseek-6.7b "Hello, world!"`
2. Configure your preferred model as default
3. Explore advanced features in the Pulser documentation
4. Join the community for tips and support

For issues or questions, check the troubleshooting section or file an issue in the repository.