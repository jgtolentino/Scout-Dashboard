# MCP Prompts Collection

This directory contains adapted system prompts and configuration patterns from various AI tools, converted to MCP-compatible formats for use with PulseDev. These prompts enable Claude to emulate the behavior of specialized AI coding tools without requiring their frontends.

## Structure

The collection is organized by source platform:

```
mcp_prompts/
├── cursor/
│   └── chat_prompt.mcp.yaml           # General code assistance in Cursor style
├── replit/
│   └── command_runner.mcp.yaml        # Terminal operation assistant in Replit style
├── windsurf/
│   └── tools.mcp.yaml                 # API and tool orchestration in Windsurf style
├── rork/
│   └── component_logic.mcp.yaml       # Component-based app design in Rork style
├── gamma/
│   └── presentation_creator.mcp.yaml  # Slide deck creation in Gamma style
├── vscode/
│   └── code_assistant.mcp.yaml        # Integrated code assistance in VSCode style
├── devin/
│   └── autonomous_developer.mcp.yaml  # Autonomous development in Devin style
├── same/
│   └── collaboration_agent.mcp.yaml   # Team collaboration in Same.dev style
├── lovable/
│   └── ux_designer.mcp.yaml           # UX and product design in Lovable style
├── manus/
│   └── agent_programmer.mcp.yaml      # Agent behavior programming in Manus style
└── combined/
    └── pulsedev_unified.mcp.yaml      # Unified prompt with all capabilities
```

## Usage in PulseDev

These MCP-compatible prompts can be loaded directly by the PulseDev MCP bridge:

```python
# In mcp_direct_bridge.py
def load_mcp_prompt(prompt_name):
    """Load an MCP prompt by name"""
    prompt_path = f"../mcp_prompts/{prompt_name}.mcp.yaml"
    with open(prompt_path, 'r') as f:
        return yaml.safe_load(f)

# Example usage
replit_prompt = load_mcp_prompt("replit/command_runner")
```

## Prompt Capabilities

Each prompt specializes in different aspects of development:

| Prompt | Key Capabilities |
|--------|------------------|
| cursor/chat_prompt | Code writing, debugging, refactoring, and explanation |
| replit/command_runner | Terminal commands, package management, environment setup |
| windsurf/tools | API integration, workflow automation, external service connections |
| rork/component_logic | UI component architecture, state management, application design |
| gamma/presentation_creator | Slide decks, visual design, content organization, presentation delivery |
| vscode/code_assistant | Context-aware coding assistance, documentation, best practices |
| devin/autonomous_developer | Autonomous planning, implementation, testing, and iteration |
| same/collaboration_agent | Technical writing, team coordination, developer outreach |
| lovable/ux_designer | User experience, interface design, accessibility, information architecture |
| manus/agent_programmer | Agent design, system prompts, behavior programming, multi-agent systems |
| combined/pulsedev_unified | Complete development lifecycle with all specialized capabilities |

## Benefits

1. **Specialized Behavior:** Each prompt contains instructions that tune Claude to behave like specialized AI tools
2. **Consistent Interface:** All prompts follow the MCP format for seamless integration
3. **No API Keys:** Works with the existing MCP server without requiring separate API keys
4. **Multi-Domain Support:** Combine prompts for tasks that span multiple domains (e.g., code + presentation)
5. **Contextual Switching:** Switch between specialized modes depending on the current task

## Customization

Feel free to customize these prompts to better suit your specific needs. The YAML format makes it easy to modify:

```yaml
# Example customization
system_prompt: |
  You are an expert coding assistant in PulseDev. 
  Focus on generating clear, efficient code that follows best practices.
  
  # Your customizations here
  When generating React components:
  - Use functional components with hooks
  - Add appropriate PropTypes
  - Consider performance optimizations
  
  # Original behaviors below
  ...
```

## Choosing the Right Prompt

- **For general coding tasks:** Use `cursor/chat_prompt.mcp.yaml` or `vscode/code_assistant.mcp.yaml`
- **For terminal operations:** Use `replit/command_runner.mcp.yaml`
- **For UI/UX design:** Use `lovable/ux_designer.mcp.yaml` or `rork/component_logic.mcp.yaml`
- **For presentations:** Use `gamma/presentation_creator.mcp.yaml`
- **For complex projects:** Use `devin/autonomous_developer.mcp.yaml`
- **For team coordination:** Use `same/collaboration_agent.mcp.yaml`
- **For AI agent development:** Use `manus/agent_programmer.mcp.yaml`
- **For comprehensive assistance:** Use `combined/pulsedev_unified.mcp.yaml`