# Anthropic Prompt Caching Implementation Guide

## Overview

Prompt caching is a powerful feature that allows you to optimize API usage by caching and reusing common prompt prefixes. This reduces both latency and costs for applications that use similar prompts repeatedly.

## Key Benefits

- **Cost Reduction**: Cache hits cost only 10% of base input token price
- **Improved Latency**: Reduces processing time by reusing cached content
- **Optimized for Repetitive Tasks**: Perfect for applications with consistent system prompts or context

## Supported Models

- Claude Opus 4
- Claude Sonnet 4
- Claude Sonnet 3.7
- Claude Sonnet 3.5
- Claude Haiku 3.5
- Claude Haiku 3
- Claude Opus 3

## Implementation

### Basic API Structure

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "system": [
    {
      "type": "text",
      "text": "You are an AI assistant specialized in analyzing legal contracts...",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Document content here...",
          "cache_control": {"type": "ephemeral"}
        }
      ]
    }
  ]
}
```

### Python Implementation

```python
import anthropic

client = anthropic.Anthropic()

# System prompt to cache
system_prompt = """You are an AI assistant specialized in analyzing legal contracts.
Your role is to identify key terms, potential risks, and provide summaries."""

# Large document to cache
document_content = """[Your large document content here]"""

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": document_content,
                    "cache_control": {"type": "ephemeral"}
                },
                {
                    "type": "text",
                    "text": "Summarize the key points of this contract"
                }
            ]
        }
    ]
)

# Check cache performance
print(f"Cache creation tokens: {response.usage.cache_creation_input_tokens}")
print(f"Cache read tokens: {response.usage.cache_read_input_tokens}")
```

### TypeScript Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeDocument() {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: 'You are an AI assistant specialized in code review...',
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Large codebase context here...',
            cache_control: { type: 'ephemeral' }
          },
          {
            type: 'text',
            text: 'Review this specific function for security issues'
          }
        ]
      }
    ]
  });

  console.log(`Cache hit: ${response.usage.cache_read_input_tokens > 0}`);
  return response;
}
```

### cURL Example

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: prompt-caching-2024-07-31" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "system": [
      {
        "type": "text",
        "text": "You are an expert programmer...",
        "cache_control": {"type": "ephemeral"}
      }
    ],
    "messages": [
      {
        "role": "user",
        "content": "Write a function to sort an array"
      }
    ]
  }'
```

## Best Practices

### 1. Cache Stable Content
- System instructions
- Background knowledge
- Static reference materials
- Common tool definitions

### 2. Optimal Cache Placement
```python
# Good: Cached content at the beginning
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": large_context, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": specific_question}
        ]
    }
]

# Less optimal: Cached content in the middle
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": specific_question},
            {"type": "text", "text": large_context, "cache_control": {"type": "ephemeral"}}
        ]
    }
]
```

### 3. Multiple Cache Breakpoints
```python
# Use up to 4 cache breakpoints strategically
system = [
    {
        "type": "text",
        "text": "General instructions...",
        "cache_control": {"type": "ephemeral"}
    }
]

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Company knowledge base...",
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": "Specific document...",
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": "User question"
            }
        ]
    }
]
```

## Cost Optimization

### Pricing Structure
- **Cache Write**: 25% more than base input tokens
- **Cache Hit**: 90% less than base input tokens

### Example Cost Calculation
```python
# For Claude Sonnet 3.5
base_input_cost = $3.00 per million tokens
cache_write_cost = $3.75 per million tokens (base * 1.25)
cache_hit_cost = $0.30 per million tokens (base * 0.10)

# Scenario: 10,000 token prompt used 100 times
without_caching = 10,000 * 100 * ($3.00 / 1,000,000) = $3.00
with_caching = (10,000 * $3.75 / 1,000,000) + (10,000 * 99 * $0.30 / 1,000,000) = $0.375
savings = $3.00 - $0.375 = $2.625 (87.5% cost reduction)
```

### Break-even Analysis
```python
def calculate_breakeven(prompt_tokens, base_cost_per_million):
    cache_write_cost = base_cost_per_million * 1.25
    cache_hit_cost = base_cost_per_million * 0.10
    
    # Number of uses to break even
    breakeven = (cache_write_cost - base_cost_per_million) / (base_cost_per_million - cache_hit_cost)
    return breakeven

# For most cases, caching pays off after 2-3 uses
```

## Monitoring Cache Performance

```python
def analyze_cache_performance(response):
    usage = response.usage
    
    cache_creation = usage.cache_creation_input_tokens or 0
    cache_read = usage.cache_read_input_tokens or 0
    total_input = usage.input_tokens
    
    cache_hit_rate = cache_read / total_input if total_input > 0 else 0
    
    print(f"Cache Hit Rate: {cache_hit_rate:.2%}")
    print(f"Tokens from cache: {cache_read}")
    print(f"New cache tokens: {cache_creation}")
    
    return {
        'hit_rate': cache_hit_rate,
        'cached_tokens': cache_read,
        'new_cache_tokens': cache_creation
    }
```

## Common Use Cases

### 1. Conversational AI with Persistent Context
```python
class ConversationManager:
    def __init__(self, system_prompt, context_documents):
        self.system_prompt = system_prompt
        self.context_documents = context_documents
        
    def create_message(self, user_input):
        return client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": self.system_prompt,
                    "cache_control": {"type": "ephemeral"}
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": self.context_documents,
                            "cache_control": {"type": "ephemeral"}
                        },
                        {
                            "type": "text",
                            "text": user_input
                        }
                    ]
                }
            ]
        )
```

### 2. Document Analysis Pipeline
```python
def analyze_document_batch(document, queries):
    """Analyze a document with multiple queries, leveraging caching"""
    results = []
    
    for query in queries:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": document,
                            "cache_control": {"type": "ephemeral"}
                        },
                        {
                            "type": "text",
                            "text": query
                        }
                    ]
                }
            ]
        )
        results.append(response)
    
    return results
```

### 3. Code Review Assistant
```python
def review_codebase(codebase_context, file_changes):
    """Review code changes with cached codebase context"""
    return client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": "You are an expert code reviewer. Focus on security, performance, and best practices.",
                "cache_control": {"type": "ephemeral"}
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Codebase context:\n{codebase_context}",
                        "cache_control": {"type": "ephemeral"}
                    },
                    {
                        "type": "text",
                        "text": f"Review these changes:\n{file_changes}"
                    }
                ]
            }
        ]
    )
```

## Limitations and Considerations

1. **Minimum Cache Size**: Varies by model (1024-2048 tokens)
2. **Cache Lifetime**: Default 5 minutes (1-hour beta available)
3. **Cache Invalidation**: Changes to images or tool use will break cache
4. **Not Cacheable**: Thinking blocks cannot be directly cached

## Troubleshooting

### Cache Not Working?
1. Check minimum token requirements for your model
2. Ensure cache_control is properly formatted
3. Verify content hasn't changed (even whitespace changes break cache)
4. Check if using beta features (requires beta header)

### Monitoring Cache Effectiveness
```python
def log_cache_metrics(responses):
    total_cache_hits = sum(r.usage.cache_read_input_tokens or 0 for r in responses)
    total_input = sum(r.usage.input_tokens for r in responses)
    
    effectiveness = total_cache_hits / total_input if total_input > 0 else 0
    print(f"Overall cache effectiveness: {effectiveness:.2%}")
```

## Beta Features

### Extended Cache TTL (1 hour)
```python
# Enable with beta header
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    extra_headers={
        "anthropic-beta": "prompt-caching-2024-07-31"
    },
    # ... rest of the request
)
```

## Conclusion

Prompt caching is a powerful optimization technique that can significantly reduce costs and improve performance for applications with repetitive prompt patterns. By following these best practices and implementation guidelines, you can maximize the benefits of caching in your Anthropic API usage.