#!/usr/bin/env python3
"""
Pulser CLI - Claude-inspired Pattern Implementation

This script implements a comprehensive shell for Pulser based on
Claude's behavior pattern, providing intelligent input classification,
contextual awareness, and improved user experience.
"""

import re
import os
import sys
import time
import json
import uuid
import shlex
import signal
import hashlib
import logging
import argparse
import subprocess
import importlib.util
from typing import Dict, List, Any, Optional, Tuple, Union, Callable

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("pulser")

# ANSI color codes for terminal output
COLORS = {
    "blue": "\033[34m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "red": "\033[31m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
    "black": "\033[30m",
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "italic": "\033[3m",
    "underline": "\033[4m",
    "blink": "\033[5m",
    "bg_blue": "\033[44m",
    "bg_green": "\033[42m",
    "bg_yellow": "\033[43m",
    "bg_red": "\033[41m",
    "bg_magenta": "\033[45m",
    "bg_cyan": "\033[46m",
    "bg_white": "\033[47m",
    "bg_black": "\033[40m"
}

# Mode indicators
INDICATORS = {
    "prompt": f"{COLORS['blue']}🔵 prompt{COLORS['reset']}",
    "shell": f"{COLORS['green']}🔩 shell{COLORS['reset']}",
    "ops": f"{COLORS['magenta']}🧠 ops{COLORS['reset']}",
    "debug": f"{COLORS['red']}🔍 debug{COLORS['reset']}"
}

# Default configuration
DEFAULT_CONFIG = {
    "models": ["claudia", "echo", "mistral", "gpt4"],
    "default_model": "mistral",
    "data_dir": os.path.expanduser("~/.pulser"),
    "history_file": "history.json",
    "context_file": "context.json",
    "tasks_file": "tasks.json",
    "conversation_file": "conversation_state.json",
    "session_file": "current_session.json",
    "max_history": 1000,
    "debug": False,
    "quiet": False,
    "verbose": False,
    "auto_save": True
}

# Implementation instruction patterns
INSTRUCTION_PATTERNS = [
    r"^✅\s*For\s+Pulser\s*[—–-]",
    r"^##\s*🧠\s*For\s+Pulser",
    r"^##\s*✅\s*Fix:",
    r"^---\n##\s*✅"
]

# Command type colors
CMD_COLORS = {
    "shell": COLORS["green"],
    "model": COLORS["blue"],
    "ops": COLORS["magenta"],
    "internal": COLORS["cyan"],
    "task": COLORS["yellow"],
    "unknown": COLORS["red"]
}

class PulserContext:
    """Manages persistent context for the Pulser CLI"""
    
    def __init__(self, config: Dict[str, Any], session_id: Optional[str] = None):
        self.config = config
        # Allow continuing an existing session or create a new one
        self.session_id = session_id or str(uuid.uuid4())
        self.session_start = time.time()
        
        # Ensure data directory exists
        os.makedirs(self.config["data_dir"], exist_ok=True)
        
        # Initialize state
        self.history: List[Dict[str, Any]] = []
        self.tasks: Dict[str, Any] = {}
        self.environment: Dict[str, str] = {}
        self.system_vars: Dict[str, Any] = {}
        self.conversation_state: Dict[str, Any] = {}
        
        # Load existing data
        self._load_history()
        self._load_tasks()
        self._load_context()
        self._load_conversation_state()
        
    def _load_history(self) -> None:
        """Load command history"""
        history_path = os.path.join(self.config["data_dir"], self.config["history_file"])
        try:
            if os.path.exists(history_path):
                with open(history_path, "r") as f:
                    self.history = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load history: {str(e)}")
            self.history = []
    
    def _load_tasks(self) -> None:
        """Load saved tasks"""
        tasks_path = os.path.join(self.config["data_dir"], self.config["tasks_file"])
        try:
            if os.path.exists(tasks_path):
                with open(tasks_path, "r") as f:
                    self.tasks = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load tasks: {str(e)}")
            self.tasks = {}
            
    def _load_context(self) -> None:
        """Load saved context"""
        context_path = os.path.join(self.config["data_dir"], self.config["context_file"])
        try:
            if os.path.exists(context_path):
                with open(context_path, "r") as f:
                    data = json.load(f)
                    self.environment = data.get("environment", {})
                    self.system_vars = data.get("system_vars", {})
        except Exception as e:
            logger.warning(f"Failed to load context: {str(e)}")
            self.environment = {}
            self.system_vars = {}
    
    def add_command(self, cmd_type: str, command: str, args: Optional[str] = None, result: Optional[str] = None) -> None:
        """Add a command to history"""
        entry = {
            "timestamp": time.time(),
            "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "session_id": self.session_id,
            "type": cmd_type,
            "command": command,
            "args": args,
            "result_summary": result[:100] + "..." if result and len(result) > 100 else result
        }
        
        self.history.append(entry)
        
        # Trim history if needed
        if len(self.history) > self.config["max_history"]:
            self.history = self.history[-self.config["max_history"]:]
            
        # Save if auto-save is enabled
        if self.config["auto_save"]:
            self._save_history()
    
    def add_task(self, text: str) -> str:
        """Add a task and return its ID"""
        # Generate a task ID
        task_id = f"task_{int(time.time())}"
        
        # Extract title from first line if possible
        lines = text.strip().split("\n")
        title = lines[0]
        for pattern in INSTRUCTION_PATTERNS:
            title = re.sub(pattern, "", title).strip()
        
        # Store the task
        self.tasks[task_id] = {
            "id": task_id,
            "title": title,
            "text": text,
            "created_at": time.time(),
            "formatted_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "session_id": self.session_id,
            "completed": False
        }
        
        # Save tasks
        if self.config["auto_save"]:
            self._save_tasks()
            
        return task_id
    
    def get_task(self, task_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a task by ID or the latest task"""
        if task_id and task_id in self.tasks:
            return self.tasks[task_id]
            
        # Return latest task if no ID provided
        if not self.tasks:
            return None
            
        latest_id = max(self.tasks.items(), key=lambda x: x[1]["created_at"])[0]
        return self.tasks[latest_id]
    
    def update_environment(self, var_name: str, value: str) -> None:
        """Update environment variable"""
        self.environment[var_name] = value
        
        # Save context
        if self.config["auto_save"]:
            self._save_context()
    
    def get_history(self, limit: int = 10, cmd_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get command history, optionally filtered by type"""
        filtered = self.history
        
        if cmd_type:
            filtered = [cmd for cmd in filtered if cmd["type"] == cmd_type]
            
        return filtered[-limit:] if limit > 0 else filtered
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about the current session"""
        # Count commands by type in current session
        session_cmds = [cmd for cmd in self.history if cmd["session_id"] == self.session_id]
        cmd_types = {}
        for cmd in session_cmds:
            cmd_type = cmd["type"]
            cmd_types[cmd_type] = cmd_types.get(cmd_type, 0) + 1
        
        # Count tasks created in current session
        session_tasks = [task for task_id, task in self.tasks.items() 
                         if task["session_id"] == self.session_id]
        
        return {
            "session_id": self.session_id,
            "start_time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(self.session_start)),
            "duration_minutes": int((time.time() - self.session_start) / 60),
            "command_count": len(session_cmds),
            "command_types": cmd_types,
            "task_count": len(session_tasks),
            "env_var_count": len(self.environment)
        }
    
    def _save_history(self) -> None:
        """Save command history"""
        history_path = os.path.join(self.config["data_dir"], self.config["history_file"])
        try:
            with open(history_path, "w") as f:
                json.dump(self.history, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save history: {str(e)}")
    
    def _save_tasks(self) -> None:
        """Save tasks"""
        tasks_path = os.path.join(self.config["data_dir"], self.config["tasks_file"])
        try:
            with open(tasks_path, "w") as f:
                json.dump(self.tasks, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save tasks: {str(e)}")
    
    def _save_context(self) -> None:
        """Save context"""
        context_path = os.path.join(self.config["data_dir"], self.config["context_file"])
        try:
            with open(context_path, "w") as f:
                json.dump({
                    "environment": self.environment,
                    "system_vars": self.system_vars
                }, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save context: {str(e)}")
    
    def _load_conversation_state(self) -> None:
        """Load conversation state"""
        conversation_path = os.path.join(self.config["data_dir"], self.config["conversation_file"])
        try:
            if os.path.exists(conversation_path):
                with open(conversation_path, "r") as f:
                    data = json.load(f)
                    # Load conversation state for the current session if it exists
                    self.conversation_state = data.get(self.session_id, {})
        except Exception as e:
            logger.warning(f"Failed to load conversation state: {str(e)}")
            self.conversation_state = {}
    
    def _save_conversation_state(self) -> None:
        """Save conversation state"""
        conversation_path = os.path.join(self.config["data_dir"], self.config["conversation_file"])
        try:
            # Load existing data first
            all_conversations = {}
            if os.path.exists(conversation_path):
                with open(conversation_path, "r") as f:
                    all_conversations = json.load(f)
            
            # Update with current session data
            all_conversations[self.session_id] = self.conversation_state
            
            # Save back to file
            with open(conversation_path, "w") as f:
                json.dump(all_conversations, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save conversation state: {str(e)}")
    
    def _save_current_session(self) -> None:
        """Save current session ID to allow continuation"""
        session_path = os.path.join(self.config["data_dir"], self.config["session_file"])
        try:
            with open(session_path, "w") as f:
                json.dump({
                    "session_id": self.session_id,
                    "last_active": time.time(),
                    "start_time": self.session_start
                }, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save current session: {str(e)}")
    
    def update_conversation_state(self, key: str, value: Any) -> None:
        """Update conversation state with key-value pair"""
        self.conversation_state[key] = value
        if self.config["auto_save"]:
            self._save_conversation_state()
    
    def get_conversation_state(self, key: str, default: Any = None) -> Any:
        """Get value from conversation state"""
        return self.conversation_state.get(key, default)
    
    def save_all(self) -> None:
        """Save all data"""
        self._save_history()
        self._save_tasks()
        self._save_context()
        self._save_conversation_state()
        self._save_current_session()

class PatternMatcher:
    """Handles pattern matching for input classification"""
    
    @staticmethod
    def is_shell_command(text: str) -> bool:
        """Check if input is a shell command"""
        return text.startswith("!")
    
    @staticmethod
    def is_internal_command(text: str) -> bool:
        """Check if input is an internal command"""
        return text.startswith(":")
    
    @staticmethod
    def is_model_prompt(text: str) -> bool:
        """Check if input is a direct model prompt"""
        return text.startswith("?")
    
    @staticmethod
    def is_env_var_assignment(text: str) -> bool:
        """Check if input is an environment variable assignment"""
        return bool(re.match(r'^(export\s+)?[A-Z_][A-Z0-9_]*=', text))
    
    @staticmethod
    def is_implementation_instruction(text: str) -> bool:
        """Check if input is an implementation instruction"""
        for pattern in INSTRUCTION_PATTERNS:
            if re.search(pattern, text):
                return True
        return False
    
    @staticmethod
    def parse_internal_command(text: str) -> Tuple[str, Optional[str]]:
        """Parse an internal command"""
        parts = text[1:].split(maxsplit=1)
        command = parts[0] if parts else ""
        args = parts[1] if len(parts) > 1 else None
        return command, args
    
    @staticmethod
    def parse_model_prompt(text: str, models: List[str]) -> Tuple[str, str]:
        """Parse a model prompt, extracting model name if present"""
        text = text[1:]  # Remove ? prefix
        parts = text.split(maxsplit=1)
        
        if len(parts) > 1 and parts[0] in models:
            return parts[0], parts[1]
        
        return "default", text
    
    @staticmethod
    def parse_env_var(text: str) -> Tuple[str, str]:
        """Parse an environment variable assignment"""
        # Handle export prefix
        if text.startswith("export "):
            text = text[7:]
            
        # Split on first =
        name, value = text.split("=", 1)
        
        # Handle quoted values
        if value.startswith(("'", '"')) and value.endswith(("'", '"')):
            value = value[1:-1]
            
        return name, value

class PulserCommandProcessor:
    """Processes and executes Pulser commands"""
    
    def __init__(self, context: PulserContext, config: Dict[str, Any]):
        self.context = context
        self.config = config
        self.current_model = config["default_model"]
        self.current_mode = "prompt"  # Default mode
        self.debug_mode = config["debug"]
        self.quiet_mode = config["quiet"]
    
    def get_prompt(self) -> str:
        """Generate the prompt based on current mode"""
        mode_indicator = INDICATORS[self.current_mode]
        
        if self.debug_mode:
            return f"pulser[{mode_indicator}|{INDICATORS['debug']}]> "
        
        return f"pulser[{mode_indicator}]> "
    
    def classify_input(self, user_input: str) -> Tuple[str, str, Optional[str]]:
        """
        Classify user input into a command type and extract command/args
        
        Returns:
            tuple: (command_type, command, args)
                command_type: 'shell', 'model', 'ops', 'internal', or 'task'
                command: The actual command or operation
                args: Additional arguments (if any)
        """
        user_input = user_input.strip()
        
        # Handle empty input
        if not user_input:
            return "internal", "empty", None
        
        # Check for direct command prefixes first
        if PatternMatcher.is_shell_command(user_input):
            # Shell command with ! prefix
            return "shell", user_input[1:], None
            
        if PatternMatcher.is_internal_command(user_input):
            # Internal command with : prefix
            command, args = PatternMatcher.parse_internal_command(user_input)
            
            # Handle task commands
            if command == "task" and args:
                # Parse task format: :task agent.method args
                task_match = re.match(r"(\w+)(?:\.(\w+))?\s*(.*)", args)
                if task_match:
                    agent, method, task_args = task_match.groups()
                    method = method or "run"
                    return "ops", f"{agent}.{method}", task_args
            
            return "internal", command, args
            
        if PatternMatcher.is_model_prompt(user_input):
            # Direct model prompt with ? prefix
            model, prompt = PatternMatcher.parse_model_prompt(user_input, self.config["models"])
            model = model if model != "default" else self.current_model
            return "model", model, prompt
        
        # Check for implementation instructions
        if PatternMatcher.is_implementation_instruction(user_input):
            return "task", "log", user_input
        
        # Check for environment variable assignments
        if PatternMatcher.is_env_var_assignment(user_input):
            return "shell", user_input, None
            
        # Use mode-based classification for plain text
        if self.current_mode == "shell":
            return "shell", user_input, None
        elif self.current_mode == "ops":
            return "ops", "process", user_input
        
        # Default to model prompt in prompt mode
        return "model", self.current_model, user_input
    
    def execute_shell_command(self, command: str) -> str:
        """Execute a shell command"""
        try:
            # Check for environment variable assignment
            if PatternMatcher.is_env_var_assignment(command):
                var_name, value = PatternMatcher.parse_env_var(command)
                self.context.update_environment(var_name, value)
                return f"Set {var_name}={value}"
            
            # Prepare environment with context variables
            env = os.environ.copy()
            env.update(self.context.environment)
            env["PYTHONWARNINGS"] = "ignore"
            
            # Run the command
            stderr_dest = subprocess.DEVNULL if self.quiet_mode else subprocess.PIPE
            result = subprocess.run(
                command,
                shell=True,
                check=False,
                stdout=subprocess.PIPE,
                stderr=stderr_dest,
                text=True,
                env=env
            )
            
            # Format the output
            output = ""
            if result.stdout:
                output += result.stdout
                
            if not self.quiet_mode and result.stderr:
                # Filter common warnings
                filtered_stderr = self._filter_warnings(result.stderr)
                if filtered_stderr:
                    if output:
                        output += "\n\n"
                    output += f"{COLORS['red']}Error:{COLORS['reset']}\n{filtered_stderr}"
            
            # Add return code if non-zero
            if result.returncode != 0:
                output += f"\n\n{COLORS['yellow']}Command exited with code: {result.returncode}{COLORS['reset']}"
            
            # Log command to context
            self.context.add_command("shell", command, None, output)
            
            return output
        except Exception as e:
            error_msg = f"{COLORS['red']}Error: {str(e)}{COLORS['reset']}"
            self.context.add_command("shell", command, None, f"Error: {str(e)}")
            return error_msg
    
    def _filter_warnings(self, stderr_text: str) -> str:
        """Filter common warnings from stderr output"""
        lines = stderr_text.split("\n")
        filtered_lines = []
        
        for line in lines:
            # Skip common warning patterns
            if any(pattern in line for pattern in [
                "LibreSSL", "deprecation", 
                "DeprecationWarning", "FutureWarning",
                "SyntaxWarning"
            ]):
                continue
            filtered_lines.append(line)
            
        return "\n".join(filtered_lines)
    
    def handle_model_prompt(self, model: str, prompt: str) -> str:
        """Handle a prompt to a model"""
        # Check for command-like prompts
        if any(pattern in prompt for pattern in ["--account-name", "az ", "git ", "docker "]):
            return f"{COLORS['yellow']}⚠️ Your input looks like a command but was sent to {model}.\nUse ! prefix or :shell mode for system commands.{COLORS['reset']}"
        
        # Simulate model responses for demonstration
        # In a real implementation, this would call the actual model
        result = ""
        if model == "claudia":
            result = f"{COLORS['cyan']}📤 Claudia:{COLORS['reset']} I'll help process that for you. Let me analyze the required steps..."
        elif model == "echo":
            result = f"{COLORS['green']}👁️ Echo:{COLORS['reset']} Processing request: {prompt}"
        elif model == "mistral":
            if not self.quiet_mode:
                print(f"{COLORS['blue']}Loading Mistral model...{COLORS['reset']}")
            result = f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']} I'm here to help! {prompt.capitalize()}"
        elif model == "gpt4":
            result = f"{COLORS['magenta']}🧠 GPT-4:{COLORS['reset']} I'd be happy to assist with that request."
        else:
            result = f"{COLORS['red']}Unknown model: {model}{COLORS['reset']}"
        
        # Log to context
        self.context.add_command("model", model, prompt, result)
        
        return result
    
    def handle_ops_command(self, operation: str, args: str) -> str:
        """Handle operations commands"""
        agent, method = operation.split(".") if "." in operation else (operation, "run")
        
        # Simulate ops responses for demonstration
        result = ""
        if agent == "scout" and method == "extract":
            result = f"{COLORS['cyan']}👁️ Echo:{COLORS['reset']} Extracted mentions from {args}\n{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Synced to SKR database"
        elif agent == "claudia":
            result = f"{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Processing: {args}"
        else:
            result = f"{COLORS['yellow']}Running {agent}.{method} with: {args}{COLORS['reset']}"
        
        # Log to context
        self.context.add_command("ops", operation, args, result)
        
        return result
    
    def handle_implementation_task(self, task_text: str) -> str:
        """Handle an implementation task"""
        # Log the task
        task_id = self.context.add_task(task_text)
        
        # Extract title
        lines = task_text.strip().split("\n")
        title = lines[0]
        for pattern in INSTRUCTION_PATTERNS:
            title = re.sub(pattern, "", title).strip()
        
        # Log command
        self.context.add_command("task", "log", task_text, f"Logged task: {title}")
        
        return f"{COLORS['cyan']}📥 Recognized implementation instruction. Logged as {task_id}{COLORS['reset']}\nTask \"{title}\" saved.\nUse :accept_task to view and implement this task."
    
    def handle_internal_command(self, command: str, args: Optional[str] = None) -> str:
        """Handle internal commands"""
        if command == "help":
            return self._get_help()
            
        elif command == "exit" or command == "quit":
            # Handle in main loop
            return "exit"
            
        elif command == "mode":
            if args and args in ["prompt", "shell", "ops"]:
                old_mode = self.current_mode
                self.current_mode = args
                return f"Switched from {INDICATORS[old_mode]} to {INDICATORS[self.current_mode]}"
            return f"{COLORS['red']}Invalid mode. Use prompt, shell, or ops.{COLORS['reset']}"
            
        elif command in ["prompt", "shell", "ops"]:
            old_mode = self.current_mode
            self.current_mode = command
            return f"Switched from {INDICATORS[old_mode]} to {INDICATORS[self.current_mode]}"
            
        elif command == "model":
            if args and args in self.config["models"]:
                old_model = self.current_model
                self.current_model = args
                return f"Set model from {old_model} to {self.current_model}"
            return f"{COLORS['red']}Invalid model. Available models: {', '.join(self.config['models'])}{COLORS['reset']}"
            
        elif command == "debug":
            self.debug_mode = not self.debug_mode
            if self.debug_mode:
                return f"{COLORS['green']}Debug mode enabled.{COLORS['reset']}"
            return f"{COLORS['green']}Debug mode disabled.{COLORS['reset']}"
            
        elif command == "quiet":
            self.quiet_mode = True
            return f"{COLORS['green']}Quiet mode enabled. Warnings and verbose output suppressed.{COLORS['reset']}"
            
        elif command == "verbose":
            self.quiet_mode = False
            return f"{COLORS['green']}Verbose mode enabled. All warnings and output shown.{COLORS['reset']}"
            
        elif command == "colors":
            return self._test_colors()
            
        elif command == "context":
            return self._show_context()
            
        elif command == "history":
            return self._show_history(args)
            
        elif command == "tasks":
            return self._show_tasks()
            
        elif command == "accept_task":
            return self._accept_task(args)
            
        elif command == "input":
            return self._show_input_box()
            
        elif command == "empty":
            return ""
            
        else:
            return f"{COLORS['red']}Unknown command: {command}{COLORS['reset']}\nType :help for available commands."
    
    def _get_help(self) -> str:
        """Return help information"""
        help_text = f"{COLORS['bold']}Pulser Command Reference{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Mode Switching:{COLORS['reset']}\n"
        help_text += f"  :prompt       {COLORS['blue']}Switch to prompt mode (default){COLORS['reset']}\n"
        help_text += f"  :shell        {COLORS['green']}Switch to shell command mode{COLORS['reset']}\n"
        help_text += f"  :ops          {COLORS['magenta']}Switch to ops mode{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Command Prefixes (work in any mode):{COLORS['reset']}\n"
        help_text += f"  !command      {COLORS['green']}Execute shell command{COLORS['reset']}\n"
        help_text += f"  ?text         {COLORS['blue']}Direct prompt to current model{COLORS['reset']}\n"
        help_text += f"  ?model text   {COLORS['blue']}Direct prompt to specific model{COLORS['reset']}\n"
        help_text += f"  :task a.b args {COLORS['magenta']}Run PulseOps task{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Output Control:{COLORS['reset']}\n"
        help_text += f"  :quiet        Suppress warnings and verbose output\n"
        help_text += f"  :verbose      Show all warnings and verbose output\n"
        help_text += f"  :colors       Test terminal color support\n"
        help_text += f"  :debug        Toggle debug mode\n\n"
        
        help_text += f"{COLORS['bold']}Context & History:{COLORS['reset']}\n"
        help_text += f"  :context      Show session context information\n"
        help_text += f"  :history      Show command history\n"
        help_text += f"  :tasks        Show saved tasks\n\n"
        
        help_text += f"{COLORS['bold']}Input & Tasks:{COLORS['reset']}\n"
        help_text += f"  :input        Open multi-line input box\n"
        help_text += f"  :accept_task  View and apply the latest task\n\n"
        
        help_text += f"{COLORS['bold']}Other Commands:{COLORS['reset']}\n"
        help_text += f"  :model name   Set default model for prompts\n"
        help_text += f"  :help         Show this help information\n"
        help_text += f"  :exit, :quit  Exit Pulser\n\n"
        
        help_text += f"{COLORS['bold']}Variable Assignment:{COLORS['reset']}\n"
        help_text += f"  VAR=value     Set environment variables\n"
        help_text += f"  export VAR=value  Set variables with export\n\n"
        
        help_text += f"{COLORS['bold']}Implementation Instructions:{COLORS['reset']}\n"
        help_text += f"  ✅ For Pulser —  Log structured implementation tasks\n"
        help_text += f"  ## 🧠 For Pulser  Log tasks with markdown formatting\n\n"
        
        help_text += f"{COLORS['bold']}Available Models:{COLORS['reset']} {', '.join(self.config['models'])}\n"
        
        return help_text
    
    def _test_colors(self) -> str:
        """Test and display terminal colors"""
        result = f"{COLORS['bold']}🎨 Terminal Color Test{COLORS['reset']}\n\n"
        
        # Test basic colors
        for name, code in COLORS.items():
            if name.startswith("bg_"):
                continue
            result += f"✅ {code}{name}{COLORS['reset']}\n"
        
        result += "\n"
        result += f"Use with: !echo -e \"\\033[32mText here\\033[0m\"\n"
        result += f"Or: !export GREEN='\\033[32m' RESET='\\033[0m'\n"
        
        return result
    
    def _show_context(self) -> str:
        """Show context information"""
        stats = self.context.get_session_stats()
        
        result = f"{COLORS['bold']}🧠 Pulser Context:{COLORS['reset']}\n\n"
        result += f"Session ID: {stats['session_id']}\n"
        result += f"Started: {stats['start_time']}\n"
        result += f"Duration: {stats['duration_minutes']} minutes\n"
        result += f"Commands: {stats['command_count']}\n"
        
        # Show command types
        result += "\nCommand types:\n"
        for cmd_type, count in stats['command_types'].items():
            if cmd_type == "shell":
                result += f"  {COLORS['green']}Shell commands:{COLORS['reset']} {count}\n"
            elif cmd_type == "model":
                result += f"  {COLORS['blue']}Model prompts:{COLORS['reset']} {count}\n"
            elif cmd_type == "ops":
                result += f"  {COLORS['magenta']}Ops operations:{COLORS['reset']} {count}\n"
            elif cmd_type == "task":
                result += f"  {COLORS['cyan']}Implementation tasks:{COLORS['reset']} {count}\n"
            else:
                result += f"  {cmd_type.capitalize()}: {count}\n"
        
        # Show environment variables
        if self.context.environment:
            result += f"\n{COLORS['bold']}Environment Variables:{COLORS['reset']}\n"
            for name, value in self.context.environment.items():
                result += f"  {name}={value}\n"
        
        return result
    
    def _show_history(self, args: Optional[str] = None) -> str:
        """Show command history"""
        try:
            # Parse arguments
            limit = 10
            cmd_type = None
            
            if args:
                parts = args.split()
                for part in parts:
                    if part.isdigit():
                        limit = int(part)
                    elif part in ["shell", "model", "ops", "task", "internal"]:
                        cmd_type = part
            
            # Get history
            history = self.context.get_history(limit=limit, cmd_type=cmd_type)
            
            if not history:
                return "No command history available"
            
            result = f"{COLORS['bold']}Recent Commands:{COLORS['reset']}\n\n"
            
            for i, cmd in enumerate(history, 1):
                cmd_type = cmd["type"]
                command = cmd["command"]
                timestamp = cmd["formatted_time"]
                args = cmd.get("args", "")
                
                # Format based on command type
                if cmd_type == "shell":
                    result += f"{i}. {timestamp} {COLORS['green']}[Shell]{COLORS['reset']} {command}\n"
                elif cmd_type == "model":
                    model_name = command
                    result += f"{i}. {timestamp} {COLORS['blue']}[{model_name}]{COLORS['reset']} {args}\n"
                elif cmd_type == "ops":
                    result += f"{i}. {timestamp} {COLORS['magenta']}[Ops]{COLORS['reset']} {command} {args or ''}\n"
                elif cmd_type == "task":
                    result += f"{i}. {timestamp} {COLORS['cyan']}[Task]{COLORS['reset']} {command}\n"
                else:
                    result += f"{i}. {timestamp} [{cmd_type}] {command}\n"
            
            return result
            
        except Exception as e:
            return f"{COLORS['red']}Error retrieving history: {str(e)}{COLORS['reset']}"
    
    def _show_tasks(self) -> str:
        """Show saved tasks"""
        if not self.context.tasks:
            return "No tasks available"
        
        result = f"{COLORS['bold']}Saved Tasks:{COLORS['reset']}\n\n"
        
        # Sort tasks by creation time (newest first)
        sorted_tasks = sorted(
            self.context.tasks.values(),
            key=lambda x: x["created_at"],
            reverse=True
        )
        
        for i, task in enumerate(sorted_tasks, 1):
            task_id = task["id"]
            title = task["title"]
            timestamp = task["formatted_time"]
            completed = task["completed"]
            
            status = f"{COLORS['green']}✓{COLORS['reset']}" if completed else f"{COLORS['yellow']}◯{COLORS['reset']}"
            result += f"{i}. {status} [{task_id}] {timestamp} - {title}\n"
        
        result += f"\nUse :accept_task <task_id> to view a specific task"
        
        return result
    
    def _accept_task(self, task_id: Optional[str] = None) -> str:
        """Accept and view a task"""
        task = self.context.get_task(task_id)
        
        if not task:
            return f"{COLORS['yellow']}No tasks available.{COLORS['reset']}"
        
        return f"\n{COLORS['cyan']}📋 Task: {task['title']}{COLORS['reset']}\n\n{task['text']}\n\n{COLORS['green']}✅ Task loaded and ready for implementation.{COLORS['reset']}"
    
    def _show_input_box(self) -> str:
        """Show a multi-line input box"""
        print(f"\n{COLORS['bold']}📝 Multi-line Input Mode{COLORS['reset']} (Enter '---' on a line by itself to finish)\n")
        
        lines = []
        while True:
            try:
                line = input("> ")
                if line.strip() == "---":
                    break
                lines.append(line)
            except KeyboardInterrupt:
                print("\nInput cancelled")
                return ""
        
        text = "\n".join(lines)
        
        if not text.strip():
            return "Input cancelled"
        
        # Check if this is an implementation instruction
        if PatternMatcher.is_implementation_instruction(text):
            return self.handle_implementation_task(text)
        
        # Otherwise, send to the model
        return self.handle_model_prompt(self.current_model, text)
        
    def process_input(self, user_input: str) -> str:
        """Process user input and execute appropriate action"""
        # Classify input
        cmd_type, cmd, args = self.classify_input(user_input)
        
        # Show classification in debug mode
        if self.debug_mode:
            print(f"\n{COLORS['bold']}Input Classification:{COLORS['reset']}")
            print(f"Type: {CMD_COLORS[cmd_type]}{cmd_type}{COLORS['reset']}")
            print(f"Command: {cmd}")
            print(f"Args: {args or 'None'}\n")
            
            prompt = input(f"{COLORS['yellow']}Proceed with execution? (y/n):{COLORS['reset']} ")
            if prompt.lower() != 'y':
                return "Command execution cancelled"
        
        # Execute based on command type
        if cmd_type == "shell":
            if not self.debug_mode:
                print(f"{COLORS['green']}🔩 Executing shell command...{COLORS['reset']}")
            return self.execute_shell_command(cmd)
        elif cmd_type == "model":
            if not self.debug_mode:
                print(f"{COLORS['blue']}🔵 Sending to {cmd} model...{COLORS['reset']}")
            return self.handle_model_prompt(cmd, args)
        elif cmd_type == "ops":
            if not self.debug_mode:
                print(f"{COLORS['magenta']}🧠 Performing ops operation...{COLORS['reset']}")
            return self.handle_ops_command(cmd, args)
        elif cmd_type == "task":
            return self.handle_implementation_task(args)
        elif cmd_type == "internal":
            return self.handle_internal_command(cmd, args)
        else:
            return f"{COLORS['red']}Unhandled command type: {cmd_type}{COLORS['reset']}"

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Pulser CLI - Claude-inspired Pattern Implementation")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--quiet", action="store_true", help="Enable quiet mode (suppress warnings)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose mode")
    parser.add_argument("--config", type=str, help="Path to config file")
    return parser.parse_args()

def load_config(args):
    """Load configuration from file or defaults"""
    config = DEFAULT_CONFIG.copy()
    
    # Override from config file if specified
    if args.config and os.path.exists(args.config):
        try:
            with open(args.config, "r") as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            logger.warning(f"Failed to load config file: {str(e)}")
    
    # Override from command line arguments
    if args.debug:
        config["debug"] = True
    if args.quiet:
        config["quiet"] = True
    if args.verbose:
        config["verbose"] = True
    
    return config

def main():
    """Main entry point"""
    # Parse arguments
    args = parse_args()
    
    # Load configuration
    config = load_config(args)
    
    # Setup logging
    if config["verbose"]:
        logger.setLevel(logging.DEBUG)
    
    # Suppress warnings
    warnings.filterwarnings("ignore")
    os.environ["PYTHONWARNINGS"] = "ignore"
    
    # Initialize context
    context = PulserContext(config)
    
    # Initialize command processor
    processor = PulserCommandProcessor(context, config)
    
    # Display welcome message
    print(f"{COLORS['bold']}Pulser CLI{COLORS['reset']} - Claude-inspired Pattern Implementation")
    print("Type :help for available commands or :debug to see input classification")
    
    # Show input classification guide
    print(f"\n{COLORS['yellow']}Input Classification Guide:{COLORS['reset']}")
    print(f"{COLORS['blue']}• LLM Prompts{COLORS['reset']} - Regular text prompts")
    print(f"{COLORS['green']}• Shell Commands{COLORS['reset']} - Commands prefixed with '!' or VAR=value")
    print(f"{COLORS['cyan']}• Implementation Tasks{COLORS['reset']} - Prefixed with '✅ For Pulser'")
    print(f"{COLORS['magenta']}• Operations Tasks{COLORS['reset']} - ':task' operations\n")
    
    # Main loop
    try:
        while True:
            # Get user input
            user_input = input(processor.get_prompt())
            
            # Exit check
            if user_input.lower() in ["exit", "quit"]:
                break
            
            # Process input
            result = processor.process_input(user_input)
            
            # Handle exit command
            if result == "exit":
                break
            
            # Display result
            if result:
                print(result)
                
    except KeyboardInterrupt:
        print("\nExiting Pulser...")
    except EOFError:
        print("\nExiting Pulser...")
    finally:
        # Save context before exiting
        context.save_all()
        print("Session data saved. Goodbye!")

if __name__ == "__main__":
    main()