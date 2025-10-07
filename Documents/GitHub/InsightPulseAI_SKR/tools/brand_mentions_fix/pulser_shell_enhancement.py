#!/usr/bin/env python3
"""
Pulser Shell Enhancement

This script adds improved command/prompt handling to the Pulser CLI shell,
with clear differentiation between shell commands, LLM prompts, and Pulser tasks.
"""

import re
import os
import sys
import time
import subprocess
import warnings
import textwrap
import importlib.util
from typing import Optional, List, Dict, Any, Union, Tuple

# Try to load the context manager
try:
    # Check if context manager exists in the same directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    context_manager_path = os.path.join(script_dir, "pulser_context_manager.py")
    
    if os.path.exists(context_manager_path):
        # Import the module
        spec = importlib.util.spec_from_file_location("pulser_context_manager", context_manager_path)
        context_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(context_module)
        PulserContext = context_module.PulserContext
        HAS_CONTEXT_MANAGER = True
    else:
        HAS_CONTEXT_MANAGER = False
except Exception:
    HAS_CONTEXT_MANAGER = False

# Filter warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
# Filter LibreSSL warnings
warnings.filterwarnings("ignore", message=".*LibreSSL.*")

# ANSI color codes for better UX
COLORS = {
    "blue": "\033[34m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "red": "\033[31m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
    "reset": "\033[0m",
    "bold": "\033[1m"
}

# Shell mode indicators
MODES = {
    "prompt": f"{COLORS['blue']}🔵 prompt{COLORS['reset']}",
    "shell": f"{COLORS['green']}🔩 shell{COLORS['reset']}",
    "ops": f"{COLORS['magenta']}🧠 ops{COLORS['reset']}"
}

class PulserShell:
    def __init__(self):
        self.current_mode = "prompt"  # Default mode
        self.command_history = []
        self.models = ["claudia", "echo", "mistral", "gpt4"]  # Available models
        self.current_model = "mistral"  # Default model for prompts
        self.quiet_mode = False  # Normal output verbosity by default
        self.silent_mode = True  # Suppress model echo and reload announcements
        self.debug_mode = False  # Debug mode for showing command classification
        
        # Path for storing internal tasks
        self.internal_tasks_log = os.path.expanduser("~/.pulser_internal_tasks.log")
        # Ensure the log file exists
        self._ensure_internal_log_exists()
        
        # Initialize context manager if available
        self.context = None
        if HAS_CONTEXT_MANAGER:
            try:
                self.context = PulserContext()
                print(f"{COLORS['green']}✓ Context manager loaded. Session history will be saved.{COLORS['reset']}")
            except Exception as e:
                print(f"{COLORS['yellow']}⚠️ Context manager failed to initialize: {e}{COLORS['reset']}", file=sys.stderr)
    
    def get_prompt(self) -> str:
        """Generate the shell prompt based on current mode"""
        mode_indicator = MODES[self.current_mode]
        if self.debug_mode:
            return f"pulser[{mode_indicator}|{COLORS['red']}🔍 debug{COLORS['reset']}]> "
        return f"pulser[{mode_indicator}]> "
    
    def _ensure_internal_log_exists(self):
        """Ensure the internal tasks log file exists"""
        if not os.path.exists(self.internal_tasks_log):
            try:
                with open(self.internal_tasks_log, "w") as f:
                    pass  # Create empty file
            except Exception as e:
                # Not critical, just log to stderr
                print(f"{COLORS['red']}Warning: Could not create tasks log: {str(e)}{COLORS['reset']}", file=sys.stderr)
    
    def _log_internal_task(self, task_text: str) -> None:
        """Log an internal task instruction to the log file"""
        try:
            with open(self.internal_tasks_log, "a") as f:
                f.write(f"--- Task logged at {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
                f.write(task_text + "\n\n")
            
            # Also log to context manager if available
            if self.context:
                self.context.add_task(task_text)
                
        except Exception as e:
            print(f"{COLORS['red']}Warning: Could not log task: {str(e)}{COLORS['reset']}", file=sys.stderr)
    
    def _get_latest_task(self) -> str:
        """Retrieve the latest task from the log file"""
        try:
            if not os.path.exists(self.internal_tasks_log):
                return "No tasks available"
                
            with open(self.internal_tasks_log, "r") as f:
                content = f.read()
                
            tasks = content.split("--- Task logged at ")
            if len(tasks) <= 1:
                return "No tasks available"
                
            latest_task = tasks[-1]
            # Skip the timestamp line
            task_content = latest_task.split("\n", 1)[1].strip()
            return task_content
        except Exception as e:
            return f"Error retrieving task: {str(e)}"
    
    def parse_input(self, user_input: str) -> Tuple[str, str, Optional[str]]:
        """Parse user input to determine action type and content
        
        Returns:
            tuple: (command_type, command, args)
                command_type: 'shell', 'model', 'ops', or 'internal'
                command: The actual command to execute
                args: Additional arguments (if any)
        """
        user_input = user_input.strip()
        
        # Handle empty input
        if not user_input:
            return "internal", "empty", None
            
        # Special case: Detect Pulser implementation instructions
        if (user_input.startswith("✅ For Pulser") or 
            user_input.startswith("## 🧠 For Pulser") or
            user_input.startswith("## ✅ Fix:") or
            user_input.startswith("---\n## ✅")):
            return "internal", "log_task", user_input
            
        # Handle mode switching
        if user_input.startswith(":"):
            # Task operations mode (for PulseOps integration)
            task_match = re.match(r":task\s+(\w+)(?:\.(\w+))?\s*(.*)", user_input)
            if task_match:
                agent, method, args = task_match.groups()
                return "ops", f"{agent}.{method}", args
            
            # Handle verify-deploy command
            verify_match = re.match(r":verify-deploy(?:\s+(.+))?", user_input)
            if verify_match:
                domain = verify_match.group(1)
                return "internal", "verify-deploy", domain
            
            # Handle other commands with : prefix
            if user_input == ":shell":
                return "internal", "mode_switch", "shell"
            elif user_input == ":prompt":
                return "internal", "mode_switch", "prompt"
            elif user_input == ":ops":
                return "internal", "mode_switch", "ops"
            elif user_input.startswith(":model "):
                model = user_input.split(" ")[1].strip()
                return "internal", "set_model", model
            elif user_input == ":help":
                return "internal", "help", None
            elif user_input == ":quiet":
                return "internal", "toggle_quiet", None
            elif user_input == ":verbose":
                return "internal", "toggle_verbose", None
            elif user_input == ":silent-mode":
                return "internal", "silent-mode", None
            elif user_input == ":echo-mode":
                return "internal", "echo-mode", None
            elif user_input == ":colors":
                return "internal", "test_colors", None
            elif user_input == ":accept_task":
                return "internal", "accept_task", None
            elif user_input == ":input":
                return "internal", "show_input_box", None
            elif user_input == ":debug":
                return "internal", "toggle_debug", None
            elif user_input == ":context":
                return "internal", "show_context", None
            elif user_input == ":history":
                return "internal", "show_history", None
            else:
                # Unknown command
                return "internal", "unknown", user_input
                
        # Handle direct shell commands
        if user_input.startswith("!") or self.current_mode == "shell":
            # Remove ! prefix if in prompt mode
            command = user_input[1:] if user_input.startswith("!") else user_input
            return "shell", command, None
            
        # Handle environment variable assignment (detect and treat as shell command)
        # Pattern matches: NAME=value, NAME='value', export NAME=value, etc.
        var_assignment = re.match(r'^(export\s+)?[A-Z_][A-Z0-9_]*=.*$', user_input)
        if var_assignment:
            return "shell", user_input, None
            
        # Handle model direct prompting with ? prefix
        if user_input.startswith("?"):
            # Check if specifying model: ?mistral how are you
            model_match = re.match(r"\?(\w+)\s+(.*)", user_input)
            if model_match and model_match.group(1) in self.models:
                model, prompt = model_match.groups()
                return "model", model, prompt
            # Otherwise use default model
            return "model", self.current_model, user_input[1:]
            
        # In prompt mode, treat as a prompt to current model
        if self.current_mode == "prompt":
            return "model", self.current_model, user_input
            
        # In ops mode, treat as an ops command
        if self.current_mode == "ops":
            return "ops", "claudia.process", user_input
            
        # Default fallback
        return "internal", "unknown", user_input

    def execute_shell_command(self, command: str) -> str:
        """Execute a shell command and return the output"""
        try:
            # Check if we should redirect stderr to dev null (in quiet mode)
            stderr_dest = subprocess.DEVNULL if self.quiet_mode else subprocess.PIPE
            
            # Check for environment variable assignment
            var_assignment = re.match(r'^(export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$', command)
            if var_assignment and self.context:
                # Extract variable name and value
                _, var_name, var_value = var_assignment.groups()
                # Remove quotes if present
                if var_value.startswith(("'", '"')) and var_value.endswith(("'", '"')):
                    var_value = var_value[1:-1]
                # Save to context
                self.context.update_environment(var_name, var_value)
            
            # Execute command in shell and capture output
            result = subprocess.run(
                command, 
                shell=True, 
                check=False,  # Don't raise exception on non-zero return
                stdout=subprocess.PIPE,
                stderr=stderr_dest,
                text=True,
                env=dict(os.environ, PYTHONWARNINGS="ignore::DeprecationWarning")
            )
            
            # Format the output
            output = ""
            if result.stdout:
                output += result.stdout
            if not self.quiet_mode and result.stderr:
                # Filter out common warning messages when in quiet mode
                filtered_stderr = self._filter_common_warnings(result.stderr)
                if filtered_stderr:
                    if output:
                        output += "\n\n"
                    output += f"{COLORS['red']}Error:{COLORS['reset']}\n{filtered_stderr}"
                
            # Add return code if non-zero
            if result.returncode != 0:
                output += f"\n\n{COLORS['yellow']}Command exited with code: {result.returncode}{COLORS['reset']}"
            
            # Log to context manager if available
            if self.context:
                self.context.add_command("shell", command, None, output)
                
            return output
        except Exception as e:
            error_msg = f"{COLORS['red']}Failed to execute command: {str(e)}{COLORS['reset']}"
            
            # Log error to context manager if available
            if self.context:
                self.context.add_command("shell", command, None, f"Error: {str(e)}")
                
            return error_msg

    def _filter_common_warnings(self, stderr_text: str) -> str:
        """Filter out common warning messages we want to suppress"""
        lines = stderr_text.split("\n")
        filtered_lines = []
        
        for line in lines:
            # Skip LibreSSL/OpenSSL deprecation warnings
            if "LibreSSL" in line and "deprecation" in line:
                continue
            # Skip other common warnings you want to filter
            if "DeprecationWarning" in line:
                continue
            if "FutureWarning" in line:
                continue
            if "SyntaxWarning" in line:
                continue
            # Let other lines through
            filtered_lines.append(line)
            
        return "\n".join(filtered_lines)

    def handle_model_prompt(self, model: str, prompt: str) -> str:
        """Send prompt to the specified model and return the response"""
        # In a real implementation, this would connect to the actual model APIs
        # For this demo, we'll simulate responses
        
        if "--account-name" in prompt or "az " in prompt:
            return f"{COLORS['yellow']}⚠️ Your input looks like a command but was sent to {model}.\nUse ! prefix or :shell mode for system commands.{COLORS['reset']}"
        
        # Import model detector only when needed (lazy import)
        try:
            # First check if our detector module exists
            script_dir = os.path.dirname(os.path.abspath(__file__))
            detector_path = os.path.join(script_dir, "pulser_run_model_detection.py")
            
            if os.path.exists(detector_path):
                # Use the model detector for real model calls
                from pulser_run_model_detection import ModelDetector
                detector = ModelDetector(quiet_mode=self.quiet_mode, silent_mode=self.silent_mode)
                
                # Construct a command that would call the model (this is just a simulation)
                if model == "mistral":
                    # Check if we have a global context with loaded model flag
                    try:
                        from pulser_shell_bootstrap import global_context
                        if not global_context.get("mistral_loaded"):
                            cmd = f"ollama run mistral '{prompt}'"
                            # Only print loading message if not in silent mode
                            if not self.silent_mode and not self.quiet_mode:
                                print(f"{COLORS['blue']}Loading Mistral model...{COLORS['reset']}")
                            global_context["mistral_loaded"] = True
                        else:
                            # Model already loaded, don't show loading message
                            cmd = f"ollama run mistral --silent '{prompt}'"
                    except ImportError:
                        # Bootstrap not available, proceed with regular command
                        cmd = f"ollama run mistral '{prompt}'"
                    
                    # In silent mode, don't echo the prompt
                    if not self.silent_mode:
                        print(f"{COLORS['blue']}⟩ Asking mistral...{COLORS['reset']}")
                        
                    result = detector.run_command_with_detection(cmd)
                    
                    # Log to context manager if available
                    if self.context:
                        self.context.add_command("model", model, prompt, result)
                        
                    return result
                    
            # For other models or if detector not available, use simulated responses
        except ImportError:
            # Fall back to simulated responses if the detector module isn't available
            pass
            
        # Set environment variables to suppress warnings
        env = dict(os.environ, PYTHONWARNINGS="ignore::DeprecationWarning")
        
        # In a real implementation, this would call the actual model
        # Here, we'll just simulate model responses
        result = ""
        if model == "claudia":
            result = f"{COLORS['cyan']}📤 Claudia:{COLORS['reset']} I'll help process that for you. Let me analyze the required steps..."
        elif model == "echo":
            result = f"{COLORS['green']}👁️ Echo:{COLORS['reset']} Processing request: {prompt}"
        elif model == "mistral":
            # Only print loading and prompt if not in silent mode
            if not self.quiet_mode and not self.silent_mode:
                print(f"{COLORS['blue']}Loading Mistral model...{COLORS['reset']}")
            result = f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']} I'm here to help! {prompt.capitalize()}"
        elif model == "gpt4":
            result = f"{COLORS['magenta']}🧠 GPT-4:{COLORS['reset']} I'd be happy to assist with that request."
        else:
            result = f"{COLORS['red']}Unknown model: {model}{COLORS['reset']}"
            
        # Log to context manager if available
        if self.context:
            self.context.add_command("model", model, prompt, result)
            
        return result

    def handle_ops_command(self, operation: str, args: str) -> str:
        """Handle PulseOps operations"""
        agent, method = operation.split(".") if "." in operation else (operation, "run")
        
        result = ""
        if agent == "scout" and method == "extract":
            result = f"{COLORS['cyan']}👁️ Echo:{COLORS['reset']} Extracted mentions from {args}\n{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Synced to SKR database"
        elif agent == "claudia":
            result = f"{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Processing: {args}"
        else:
            result = f"{COLORS['yellow']}Running {agent}.{method} with: {args}{COLORS['reset']}"
            
        # Log to context manager if available
        if self.context:
            self.context.add_command("ops", operation, args, result)
            
        return result

    def test_terminal_colors(self) -> str:
        """Test terminal color support and display available colors"""
        result = f"{COLORS['bold']}🎨 Terminal Color Test{COLORS['reset']}\n\n"
        
        # Test basic colors
        colors_to_test = {
            "GREEN": COLORS['green'],
            "BLUE": COLORS['blue'],
            "RED": COLORS['red'],
            "YELLOW": COLORS['yellow'],
            "MAGENTA": COLORS['magenta'],
            "CYAN": COLORS['cyan'],
            "WHITE": COLORS['white'],
            "BOLD": COLORS['bold'],
            "RESET": COLORS['reset']
        }
        
        for name, code in colors_to_test.items():
            # Use the color code to display its name
            result += f"✅ {code}{name}{COLORS['reset']}\n"
        
        result += "\nUse with: !echo -e \"${GREEN}Text here${RESET}\"\n"
        result += "Add to your shell: !export GREEN='\\033[32m' RESET='\\033[0m'\n"
        
        return result

    def show_input_box(self) -> str:
        """Display a multi-line input box for long prompts"""
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
                
        result = "\n".join(lines)
        if not result.strip():
            return "Input cancelled"
            
        # Detect if this is a task instruction
        if any(result.strip().startswith(prefix) for prefix in [
            "✅ For Pulser", 
            "## 🧠 For Pulser", 
            "## ✅ Fix:",
            "---\n## ✅"
        ]):
            self._log_internal_task(result)
            return f"{COLORS['cyan']}📥 Recognized implementation instruction. Logged internally.{COLORS['reset']}"
            
        # Otherwise, send to model
        return self.handle_model_prompt(self.current_model, result)

    def show_context(self) -> str:
        """Display context information if available"""
        if not self.context:
            return f"{COLORS['yellow']}Context manager not available. Run with context manager to use this feature.{COLORS['reset']}"
            
        try:
            stats = self.context.get_session_stats()
            
            result = f"{COLORS['bold']}🧠 Pulser Context:{COLORS['reset']}\n\n"
            result += f"Session started: {stats['start_time']}\n"
            result += f"Duration: {stats['duration_minutes']} minutes\n"
            result += f"Commands executed: {stats['command_count']}\n"
            
            # Show command types
            result += "\nCommand types:\n"
            for cmd_type, count in stats['command_types'].items():
                if cmd_type == "shell":
                    result += f"  {COLORS['green']}Shell commands:{COLORS['reset']} {count}\n"
                elif cmd_type == "model":
                    result += f"  {COLORS['blue']}Model prompts:{COLORS['reset']} {count}\n"
                elif cmd_type == "ops":
                    result += f"  {COLORS['magenta']}Ops operations:{COLORS['reset']} {count}\n"
                else:
                    result += f"  {cmd_type.capitalize()}: {count}\n"
            
            # Show environment variables
            env_vars = self.context.get_environment()
            if env_vars:
                result += f"\n{COLORS['bold']}Environment Variables:{COLORS['reset']}\n"
                for name, value in env_vars.items():
                    result += f"  {name}={value}\n"
            
            return result
        except Exception as e:
            return f"{COLORS['red']}Error retrieving context: {str(e)}{COLORS['reset']}"

    def show_history(self) -> str:
        """Display command history"""
        if not self.context:
            # Use in-memory history if context manager not available
            if not self.command_history:
                return "No command history available"
                
            result = f"{COLORS['bold']}Recent Commands:{COLORS['reset']}\n\n"
            for i, cmd in enumerate(self.command_history[-10:], 1):
                result += f"{i}. {cmd}\n"
                
            return result
        
        # Use context manager history if available
        try:
            history = self.context.get_command_history(limit=10)
            if not history:
                return "No command history available"
                
            result = f"{COLORS['bold']}Recent Commands:{COLORS['reset']}\n\n"
            for i, cmd in enumerate(history, 1):
                cmd_type = cmd["type"]
                command = cmd["command"]
                args = cmd.get("args", "")
                
                if cmd_type == "shell":
                    result += f"{i}. {COLORS['green']}[Shell]{COLORS['reset']} {command}\n"
                elif cmd_type == "model":
                    result += f"{i}. {COLORS['blue']}[{command}]{COLORS['reset']} {args}\n"
                elif cmd_type == "ops":
                    result += f"{i}. {COLORS['magenta']}[Ops]{COLORS['reset']} {command}\n"
                else:
                    result += f"{i}. [{cmd_type}] {command}\n"
                
            return result
        except Exception as e:
            return f"{COLORS['red']}Error retrieving history: {str(e)}{COLORS['reset']}"
        
    def handle_internal_command(self, command: str, args: Optional[str]) -> str:
        """Handle internal shell commands"""
        if command == "verify-deploy":
            # Import the verification module
            try:
                from pulser_vercel_verify import verify_vercel
                
                # Parse domain from args if provided
                domain = args.strip() if args else "pulser-ai.app"
                
                print(f"{COLORS['cyan']}Verifying deployment at {domain}...{COLORS['reset']}")
                
                # Run verification
                results = verify_vercel(domain)
                
                # Display results
                output = f"\n{COLORS['bold']}Deployment Verification Results:{COLORS['reset']}\n"
                for k, v in results.items():
                    output += f"[{k}] {v}\n"
                    
                return output
            except ImportError:
                return f"{COLORS['red']}Verification module not found. Please install pulser_vercel_verify.py{COLORS['reset']}"
            except Exception as e:
                return f"{COLORS['red']}Verification failed: {str(e)}{COLORS['reset']}"
                
        elif command == "mode_switch":
            if args in MODES.keys():
                old_mode = self.current_mode
                self.current_mode = args
                return f"Switched from {MODES[old_mode]} to {MODES[self.current_mode]}"
            else:
                return f"{COLORS['red']}Invalid mode: {args}{COLORS['reset']}"
                
        elif command == "set_model":
            if args in self.models:
                old_model = self.current_model
                self.current_model = args
                return f"Set prompt model from {old_model} to {self.current_model}"
            else:
                available = ", ".join(self.models)
                return f"{COLORS['red']}Invalid model: {args}\nAvailable models: {available}{COLORS['reset']}"
        
        elif command == "toggle_quiet":
            self.quiet_mode = True
            return f"{COLORS['green']}Quiet mode enabled. Warnings and verbose output suppressed.{COLORS['reset']}"
            
        elif command == "toggle_verbose":
            self.quiet_mode = False
            return f"{COLORS['green']}Verbose mode enabled. All warnings and output shown.{COLORS['reset']}"
            
        elif command == "silent-mode":
            self.silent_mode = not self.silent_mode
            if self.silent_mode:
                return f"{COLORS['green']}Silent mode enabled. Model interactions hidden.{COLORS['reset']}"
            else:
                return f"{COLORS['green']}Silent mode disabled. Model interactions will be shown.{COLORS['reset']}"
                
        elif command == "echo-mode":
            self.silent_mode = False
            return f"{COLORS['green']}Echo mode enabled. Model prompts and interactions will be shown.{COLORS['reset']}"
        
        elif command == "toggle_debug":
            self.debug_mode = not self.debug_mode
            if self.debug_mode:
                return f"{COLORS['green']}Debug mode enabled. Command classification will be shown.{COLORS['reset']}"
            else:
                return f"{COLORS['green']}Debug mode disabled.{COLORS['reset']}"
        
        elif command == "test_colors":
            return self.test_terminal_colors()
            
        elif command == "log_task":
            # Log a task instruction
            self._log_internal_task(args)
            return f"{COLORS['cyan']}📥 Recognized implementation instruction. Logged internally.{COLORS['reset']}"
            
        elif command == "accept_task":
            # Show and prepare to execute the latest task
            task = self._get_latest_task()
            if task == "No tasks available":
                return f"{COLORS['yellow']}No tasks available to accept.{COLORS['reset']}"
                
            return f"\n{COLORS['cyan']}📋 Latest Task:{COLORS['reset']}\n\n{task}\n\n{COLORS['green']}✅ Task loaded and ready for implementation.{COLORS['reset']}"
            
        elif command == "show_input_box":
            return self.show_input_box()
            
        elif command == "show_context":
            return self.show_context()
            
        elif command == "show_history":
            return self.show_history()
                
        elif command == "help":
            return self.get_help()
            
        elif command == "empty":
            return ""  # Just return a new prompt
            
        elif command == "unknown":
            return f"{COLORS['red']}Unknown command: {args}{COLORS['reset']}\nType :help for available commands"
            
        return f"{COLORS['red']}Unhandled internal command: {command}{COLORS['reset']}"

    def get_help(self) -> str:
        """Return help information"""
        help_text = f"{COLORS['bold']}Pulser Shell Command Reference{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Mode Switching:{COLORS['reset']}\n"
        help_text += f"  :prompt       {COLORS['blue']}Switch to prompt mode (default){COLORS['reset']}\n"
        help_text += f"  :shell        {COLORS['green']}Switch to shell command mode{COLORS['reset']}\n"
        help_text += f"  :ops          {COLORS['magenta']}Switch to PulseOps mode{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Command Prefixes (work in any mode):{COLORS['reset']}\n"
        help_text += f"  !command      {COLORS['green']}Execute shell command{COLORS['reset']}\n"
        help_text += f"  ?text         {COLORS['blue']}Direct prompt to current model{COLORS['reset']}\n"
        help_text += f"  ?model text   {COLORS['blue']}Direct prompt to specific model{COLORS['reset']}\n"
        help_text += f"  :task a.b args {COLORS['magenta']}Run PulseOps task{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Deployment Commands:{COLORS['reset']}\n"
        help_text += f"  :verify-deploy       {COLORS['cyan']}Verify Pulser deployment health{COLORS['reset']}\n"
        help_text += f"  :verify-deploy domain {COLORS['cyan']}Verify specific domain deployment{COLORS['reset']}\n\n"
        
        help_text += f"{COLORS['bold']}Output Control:{COLORS['reset']}\n"
        help_text += f"  :quiet        Suppress warnings and verbose output\n"
        help_text += f"  :verbose      Show all warnings and verbose output\n"
        help_text += f"  :silent-mode  Toggle silent mode (hide model interactions)\n"
        help_text += f"  :echo-mode    Toggle echo mode (show model prompts)\n"
        help_text += f"  :colors       Test terminal color support\n"
        help_text += f"  :debug        Toggle debug mode (shows command classification)\n\n"
        
        help_text += f"{COLORS['bold']}Input Options:{COLORS['reset']}\n"
        help_text += f"  :input        Open multi-line input box for longer prompts\n"
        help_text += f"  :accept_task  View and apply the most recent Pulser task\n\n"
        
        help_text += f"{COLORS['bold']}Context & History:{COLORS['reset']}\n"
        help_text += f"  :context      Show session context information\n"
        help_text += f"  :history      Show command history\n\n"
        
        help_text += f"{COLORS['bold']}Other Commands:{COLORS['reset']}\n"
        help_text += f"  :model name   Set default model for prompts\n"
        help_text += f"  :help         Show this help information\n\n"
        
        help_text += f"{COLORS['bold']}Variable Assignment:{COLORS['reset']}\n"
        help_text += f"  VAR=value     Environment variables automatically run as shell commands\n"
        help_text += f"  export VAR=value  Set variables for the session\n\n"
        
        help_text += f"{COLORS['bold']}Internal Instructions:{COLORS['reset']}\n"
        help_text += f"  ✅ For Pulser —  Log structured implementation tasks\n"
        help_text += f"  ## 🧠 For Pulser  Log tasks with markdown formatting\n\n"
        
        help_text += f"{COLORS['bold']}Available Models:{COLORS['reset']} {', '.join(self.models)}\n"
        
        return help_text

    def run(self):
        """Run the interactive shell"""
        print(f"{COLORS['bold']}Pulser Enhanced Shell{COLORS['reset']}")
        print("Type :help for available commands or :debug to see input classification")
        
        # Show initial command classification hint
        print(f"\n{COLORS['yellow']}Input Classification Guide:{COLORS['reset']}")
        print(f"{COLORS['blue']}• LLM Prompts{COLORS['reset']} - Regular text prompts")
        print(f"{COLORS['green']}• Shell Commands{COLORS['reset']} - Commands prefixed with '!' or VAR=value")
        print(f"{COLORS['cyan']}• Implementation Tasks{COLORS['reset']} - Prefixed with '✅ For Pulser'")
        print(f"{COLORS['magenta']}• Operations Tasks{COLORS['reset']} - ':task' operations\n")
        
        while True:
            try:
                # Display prompt and get input
                user_input = input(self.get_prompt())
                
                # Exit command
                if user_input.lower() in ["exit", "quit", ":exit", ":quit"]:
                    print("Exiting Pulser shell")
                    # Close context manager if available
                    if self.context:
                        self.context.close()
                    break
                
                # Parse the input
                cmd_type, cmd, args = self.parse_input(user_input)
                
                # In debug mode, show classification before execution
                if self.debug_mode:
                    print(f"\n{COLORS['bold']}Input Classification:{COLORS['reset']}")
                    print(f"Type: {cmd_type}")
                    print(f"Command: {cmd}")
                    print(f"Args: {args if args else 'None'}\n")
                    
                    proceed = input(f"{COLORS['yellow']}Proceed with execution? (y/n):{COLORS['reset']} ")
                    if proceed.lower() != 'y':
                        print("Command execution cancelled")
                        continue
                
                # Process based on command type
                if cmd_type == "shell":
                    if not self.debug_mode:
                        print(f"{COLORS['green']}🔩 Executing shell command...{COLORS['reset']}")
                    result = self.execute_shell_command(cmd)
                elif cmd_type == "model":
                    if not self.debug_mode:
                        print(f"{COLORS['blue']}🔵 Sending to {cmd} model...{COLORS['reset']}")
                    result = self.handle_model_prompt(cmd, args)
                elif cmd_type == "ops":
                    if not self.debug_mode:
                        print(f"{COLORS['magenta']}🧠 Performing ops operation...{COLORS['reset']}")
                    result = self.handle_ops_command(cmd, args)
                elif cmd_type == "internal":
                    result = self.handle_internal_command(cmd, args)
                else:
                    result = f"{COLORS['red']}Unhandled command type: {cmd_type}{COLORS['reset']}"
                
                # Display the result
                if result:
                    print(result)
                    
                # Add to history
                self.command_history.append(user_input)
                
            except KeyboardInterrupt:
                print("\nUse 'exit' to quit")
            except EOFError:
                print("\nExiting Pulser shell")
                if self.context:
                    self.context.close()
                break
            except Exception as e:
                print(f"{COLORS['red']}Error: {str(e)}{COLORS['reset']}")

def main():
    """Main entry point"""
    # Suppress all warnings at the Python level
    warnings.filterwarnings("ignore")
    
    # Set environment variables to suppress warnings
    os.environ["PYTHONWARNINGS"] = "ignore"
    
    shell = PulserShell()
    shell.run()

if __name__ == "__main__":
    main()