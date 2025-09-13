# Claude-inspired Behavior Pattern for Pulser CLI

Instead of iteratively building features, this document captures the complete behavior pattern that Pulser should adopt from Claude, providing a clear blueprint for implementation.

## Core Behavioral Model

### 1. Input Classification System

```python
def classify_input(user_input):
    """
    Classifies user input into specific action types
    """
    if is_system_command(user_input):
        return "system", parse_command(user_input)
    
    if is_implementation_instruction(user_input):
        return "instruction", log_instruction(user_input)
    
    if is_env_var_assignment(user_input):
        return "variable", set_environment(user_input)
    
    if is_shell_command(user_input):
        return "shell", execute_command(user_input)
    
    # Default to LLM prompt
    return "prompt", forward_to_model(user_input)
```

### 2. Task/Implementation Instruction Detection

Pulser should automatically recognize Claude-style implementation instructions:

- Pattern matching for headers like `✅ For Pulser —` 
- Pattern matching for markdown headers like `## 🧠 For Pulser`
- Recognition of structured task formats with `### 🔍 Objective` sections
- Context-awareness to link related instructions together

### 3. Command Prefix System

- `!command` - Execute shell command
- `:keyword` - Execute internal Pulser command
- `?query` - Direct prompt to model (bypassing pattern matching)
- `VAR=value` - Environment variable assignment

### 4. Contextual Awareness

Maintain user session context:
- Command history tracking with type classification
- Environment variable persistence
- Task/instruction tracking with timestamps
- Awareness of workspace/project state
- Results of previous operations

## Complete Implementation Pattern

### 1. Input Processing Pipeline

```
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Raw Input     │────▶│ Pre-processing  │────▶│ Classification  │
│ Capture       │     │ & Normalization │     │ Engine          │
└───────────────┘     └─────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Response      │◀────│ Post-processing │◀────│ Action Router   │
│ Generation    │     │ & Formatting    │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

### 2. Unified Context Management

```python
class PulserContext:
    """Central context manager for Pulser sessions"""
    
    def __init__(self):
        self.session_id = generate_session_id()
        self.command_history = []
        self.environment = {}
        self.tasks = {}
        self.models = load_available_models()
        self.current_model = get_default_model()
        
    def log_command(self, command_type, command, args, result):
        """Log all commands with their type, arguments and results"""
        entry = {
            "timestamp": timestamp(),
            "type": command_type,
            "command": command,
            "args": args,
            "result": summarize_result(result)
        }
        self.command_history.append(entry)
        persist_to_storage(entry)
        
    def retrieve_relevant_context(self, query):
        """Get context relevant to the current query"""
        # Analyze query intent
        # Match against command history
        # Find related tasks/variables
        return relevant_context
```

### 3. Visual Communication System

Pulser should use a consistent visual language:

- Command Type Indicators:
  - 🔵 Blue for LLM interactions
  - 🔩 Green for system/shell operations
  - 📥 Cyan for implementation tasks
  - 🧠 Magenta for agent operations

- Status Indicators:
  - ✅ Success confirmation
  - ⚠️ Warning messages
  - ❌ Error messages
  - 🔄 Processing indicators

### 4. Instruction Processing Model

When receiving an implementation instruction:

1. Parse the instruction into structured components
2. Extract key objectives and requirements
3. Log the instruction with metadata
4. Provide clear acknowledgment of receipt
5. Make instruction available for execution
6. Enable reference and retrieval of past instructions

### 5. Shell Command Pattern

- For shell commands, provide clear execution boundaries
- Show command status during execution
- Filter unnecessary warnings and noise
- Use visual indicators for command completion
- Log command inputs and outputs for context

## Integration Guidelines

### 1. Model Independence

- Modular design that works with multiple LLMs
- Standardized input/output format for all models
- Model-specific adapters for specialized features
- Fallback mechanisms for model-specific features

### 2. Environment Awareness

- Workspace detection and tracking
- Project context integration
- Environment variable management
- Path resolution and normalization

### 3. Persistent Context

- Cross-session state persistence
- Task and environment continuity
- Intelligent history recall
- Workspace-aware context boundaries

## Implementation Priorities

1. Core classification engine (command vs. prompt vs. instruction)
2. Visual feedback system for command types
3. Implementation instruction detection and logging
4. Persistent context management 
5. Multi-model support architecture

By implementing this comprehensive pattern, Pulser can achieve Claude-like behavior in one coordinated effort rather than iterative enhancements.

## Runtime Behavior Examples

### Example 1: Implementation Instruction

**Input:**
```
✅ For Pulser — Add automatic model detection 

### 🔍 Objective
Create a module that automatically detects and configures available models

### Steps
1. Scan system for installed models
2. Test API connections
3. Configure default parameters
```

**Pulser Response:**
```
📥 Recognized implementation instruction. Logged as task_1682954713
Task "Add automatic model detection" saved.
Use :accept_task to view and implement this task.
```

### Example 2: Command Disambiguation

**Input:**
```
az storage blob upload --container workflow
```

**Pulser Response:**
```
⚠️ Your input appears to be a shell command but was entered without a prefix.
Did you want to:

1. Execute as shell command (!az storage blob upload...)
2. Send as query to current model (mistral)

Enter 1 or 2:
```

### Example 3: Context-Aware Mode

**Input:**
```
:context
```

**Pulser Response:**
```
🧠 Pulser Session Context:

Session ID: session_1682954713
Duration: 35 minutes
Commands executed: 17
  • Shell commands: 7
  • Model prompts: 8 
  • Implementation tasks: 2

Environment variables:
  • API_KEY=sk_test_123456
  • MODEL_PATH=/path/to/models

Recent tasks:
  • Add automatic model detection (5 minutes ago)
  • Implement warning suppression (25 minutes ago)
```