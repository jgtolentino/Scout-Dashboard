# Pulser Local LLM Model Guide

## Model License Matrix

| Model | License | Commercial Use | Restrictions | Notes |
|-------|---------|----------------|--------------|-------|
| **DeepSeek-Coder** | Custom License | ✅ Allowed* | Cannot use to compete with DeepSeek | *Review license before commercial deployment |
| **CodeLlama** | Llama 2 License | ✅ Allowed | <700M MAU limit | Meta's custom license, not fully open |
| **Mistral** | Apache 2.0 | ✅ Allowed | None | Fully open source |
| **Qwen** | Tongyi Qianwen | ✅ Allowed | None | Apache-like permissive license |
| **TinyLlama** | Apache 2.0 | ✅ Allowed | None | Fully open source |

## Recommended Models by Hardware

### 🖥️ Low-End (8GB RAM)
- **tinyllama:1.1b** - Fast, Apache 2.0, good for completions
- **qwen:0.5b** - Extremely fast, basic code understanding

### 💻 Mid-Range (16GB RAM) 
- **deepseek-coder:6.7b-instruct-q4_K_M** ⭐ - Best code performance
- **mistral:7b-instruct-q4_0** - Great general purpose, fully open
- **codellama:7b-code** - Good alternative, Meta license

### 🚀 High-End (32GB+ RAM)
- **deepseek-coder:33b-instruct-q4_K_M** - State-of-the-art code
- **codellama:13b-instruct** - Excellent for complex tasks
- **mixtral:8x7b** - MoE architecture, requires 48GB+

## Installation Commands

```bash
# Recommended starter model (16GB RAM)
ollama pull deepseek-coder:6.7b-instruct-q4_K_M

# Fallback for low memory (8GB RAM)
ollama pull mistral:7b-instruct-q4_0

# High performance (32GB+ RAM)
ollama pull deepseek-coder:33b-instruct-q4_K_M
```

## Model Selection Script

Use the included tool to switch models based on your hardware:

```bash
./pulser-select-model.sh
```

## Performance Benchmarks

| Model | First Token (cold) | Avg Token (warm) | Tokens/sec | Quality Score |
|-------|-------------------|------------------|------------|---------------|
| tinyllama:1.1b | 2s | 50ms | 20-30 | 6/10 |
| deepseek-coder:6.7b | 5s | 100ms | 10-15 | 9/10 |
| mistral:7b | 4s | 80ms | 12-18 | 8/10 |
| deepseek-coder:33b | 15s | 200ms | 5-8 | 10/10 |

## License Compliance

### ⚠️ Important for Commercial Use

1. **DeepSeek Models**: Read the full license at https://github.com/deepseek-ai/DeepSeek-Coder/blob/main/LICENSE-MODEL
   - Cannot use output to create competing LLM services
   - Must include attribution in products

2. **CodeLlama Models**: Review Meta's Llama 2 license
   - Cannot use if your product has >700M monthly active users
   - Must accept license agreement before use

3. **Safe for All Commercial Use**: 
   - Mistral (Apache 2.0)
   - TinyLlama (Apache 2.0)
   - Qwen (permissive)

### License Agreement Prompt

When using models with restrictive licenses, Pulser will prompt:

```
⚠️  DeepSeek-Coder License Notice:
This model has restrictions on commercial use.
Please review: [license URL]

Do you accept the license terms? (y/N)
```

## Model Update Policy

1. Models are updated by their creators periodically
2. Run `ollama pull --check` weekly to check for updates
3. Test updates in development before production use
4. Keep previous model versions for rollback

## Security Considerations

- All models run 100% locally - no data leaves your machine
- Models are downloaded over HTTPS from Ollama's CDN
- Verify model checksums if security is critical
- Consider air-gapped installation for sensitive environments

## Switching Models at Runtime

```bash
# Per-session override
export PULSER_DEFAULT_MODEL="mistral:latest"

# Per-project override (in project root)
echo 'ai.local_llm.default_model: mistral:7b' >> .pulserrc

# Global default
./pulser-select-model.sh
```