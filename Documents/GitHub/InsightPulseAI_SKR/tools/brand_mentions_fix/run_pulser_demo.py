#!/usr/bin/env python3
"""
Pulser CLI Demo Script

This script demonstrates the enhanced Pulser CLI experience
by simulating interactions and showing the differences between
the standard and enhanced versions.
"""

import os
import sys
import time
import signal
import random
import threading
from typing import List, Dict, Any

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
    "bold": "\033[1m",
    "dim": "\033[2m",
    "italic": "\033[3m",
    "underline": "\033[4m"
}

# For clean output formatting
def clear_screen():
    """Clear the terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def slow_print(text: str, delay: float = 0.03, end: str = "\n"):
    """Print text slowly, character by character"""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    sys.stdout.write(end)
    sys.stdout.flush()

def simulate_typing(text: str, min_delay: float = 0.05, max_delay: float = 0.15):
    """Simulate typing with random delays between characters"""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        # Longer delay for spaces and punctuation
        if char in " .,!?;:":
            time.sleep(random.uniform(min_delay * 2, max_delay * 2))
        else:
            time.sleep(random.uniform(min_delay, max_delay))
    sys.stdout.write("\n")
    sys.stdout.flush()

def print_header(title: str):
    """Print a section header"""
    width = 80
    print("\n" + "=" * width)
    print(f"{COLORS['bold']}{title.center(width)}{COLORS['reset']}")
    print("=" * width + "\n")

def print_side_by_side(left: str, right: str, left_title: str = "Before", right_title: str = "After", width: int = 40):
    """Print two text blocks side by side with titles"""
    left_lines = left.split("\n")
    right_lines = right.split("\n")
    
    # Ensure both have the same number of lines
    max_lines = max(len(left_lines), len(right_lines))
    left_lines += [""] * (max_lines - len(left_lines))
    right_lines += [""] * (max_lines - len(right_lines))
    
    # Print titles
    print(f"{COLORS['bold']}{left_title.ljust(width)}{right_title.ljust(width)}{COLORS['reset']}")
    print(f"{'-' * width}{'-' * width}")
    
    # Print content
    for i in range(max_lines):
        print(f"{left_lines[i].ljust(width)}{right_lines[i].ljust(width)}")
    
    print("\n")

class SpinnerThread(threading.Thread):
    """Thread for displaying a spinner animation"""
    def __init__(self, message: str = "Loading"):
        super().__init__()
        self.message = message
        self.stop_event = threading.Event()
        self.daemon = True
    
    def run(self):
        spinner_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        i = 0
        while not self.stop_event.is_set():
            sys.stdout.write(f"\r{COLORS['blue']}{spinner_chars[i % len(spinner_chars)]} {self.message}{COLORS['reset']}   ")
            sys.stdout.flush()
            i += 1
            time.sleep(0.1)
    
    def stop(self):
        self.stop_event.set()
        self.join()
        # Clear the spinner line
        sys.stdout.write("\r" + " " * (len(self.message) + 10) + "\r")
        sys.stdout.flush()

# Demo UX scenarios
class PulserDemo:
    """Pulser CLI Demo"""
    
    def __init__(self):
        self.demo_speed = 1.0  # Speed multiplier (lower is faster)
    
    def simulate_cursor(self, prompt: str):
        """Simulate a blinking cursor at a prompt"""
        cursor_frames = [f"{prompt}█ ", f"{prompt}  "]
        for _ in range(4):  # Blink 4 times
            for frame in cursor_frames:
                sys.stdout.write(f"\r{frame}")
                sys.stdout.flush()
                time.sleep(0.3 * self.demo_speed)
    
    def demo_model_loading_before(self):
        """Demonstrate model loading experience before enhancement"""
        print(f"{COLORS['yellow']}pulser>{COLORS['reset']} what is a data lake?")
        time.sleep(1 * self.demo_speed)
        
        print(f"{COLORS['dim']}/Users/tbwa/pulser/pulser_infer_ollama.py:241: DeprecationWarning: ...LibreSSL...{COLORS['reset']}")
        print(f"{COLORS['dim']}warnings.warn({COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['dim']}Reloading model 'mistral'...{COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['dim']}pulling manifest {COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        progress_bar = f"{COLORS['dim']}pulling ff82381e2bea... 100% ▕████████████████▏ 4.1 GB{COLORS['reset']}"
        for i in range(1, 11):
            filled = "█" * (i * 2)
            empty = " " * (20 - i * 2)
            progress = f"{COLORS['dim']}pulling ff82381e2bea... {i*10}% ▕{filled}{empty}▏ {i*0.4:.1f} GB{COLORS['reset']}"
            sys.stdout.write(f"\r{progress}")
            sys.stdout.flush()
            time.sleep(0.2 * self.demo_speed)
        print()
        
        print(f"{COLORS['dim']}pulling 43070e2d4e53... 100% ▕████████████████▏  11 KB{COLORS['reset']}")
        print(f"{COLORS['dim']}pulling 491dfa501e59... 100% ▕████████████████▏  801 B{COLORS['reset']}")
        print(f"{COLORS['dim']}pulling ed11eda7790d... 100% ▕████████████████▏   30 B{COLORS['reset']}")
        print(f"{COLORS['dim']}pulling 42347cd80dc8... 100% ▕████████████████▏  485 B{COLORS['reset']}")
        print(f"{COLORS['dim']}verifying sha256 digest {COLORS['reset']}")
        print(f"{COLORS['dim']}writing manifest {COLORS['reset']}")
        print(f"{COLORS['dim']}success {COLORS['reset']}")
        print(f"{COLORS['dim']}Successfully pulled 'mistral'{COLORS['reset']}")
        print()
        
        time.sleep(0.5 * self.demo_speed)
        response = "A data lake is a centralized repository designed to store, process, and secure large amounts of structured, semi-structured, and unstructured data. It can store data in its native format and process any variety of data, supporting various analytics workloads and machine learning models."
        print(f"{COLORS['blue']}I'm here to help! {response}{COLORS['reset']}")
    
    def demo_model_loading_after(self):
        """Demonstrate model loading experience after enhancement"""
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} what is a data lake?")
        time.sleep(0.5 * self.demo_speed)
        
        # Start spinner
        spinner = SpinnerThread("Loading mistral model...")
        spinner.start()
        time.sleep(3 * self.demo_speed)
        spinner.stop()
        
        print(f"{COLORS['green']}✓ mistral model loaded successfully (3.2s){COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        response = "A data lake is a centralized repository designed to store, process, and secure large amounts of structured, semi-structured, and unstructured data. It can store data in its native format and process any variety of data, supporting various analytics workloads and machine learning models."
        print(f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']} {response}")

    def demo_command_confusion_before(self):
        """Demonstrate command confusion before enhancement"""
        print(f"{COLORS['yellow']}pulser>{COLORS['reset']} az storage blob upload --account-name projectscoutdata \\")
        time.sleep(0.5 * self.demo_speed)
        print(f"{COLORS['yellow']}pulser>{COLORS['reset']} --container-name workflows --file ./data/session.json")
        time.sleep(1 * self.demo_speed)
        
        # Show model responding to what it thinks is a prompt
        print(f"{COLORS['blue']}I'll help you with uploading a blob to Azure Storage. To upload a blob, you need to have the Azure CLI installed and be authenticated. The command you're trying to use looks correct, but let me explain the parameters:{COLORS['reset']}")
        print()
        print(f"{COLORS['blue']}- --account-name: Specifies the storage account name{COLORS['reset']}")
        print(f"{COLORS['blue']}- --container-name: Specifies the container to upload to{COLORS['reset']}")
        print(f"{COLORS['blue']}- --file: Specifies the local file path to upload{COLORS['reset']}")
        print()
        print(f"{COLORS['blue']}Is there anything specific about this upload you'd like me to explain?{COLORS['reset']}")
    
    def demo_command_confusion_after(self):
        """Demonstrate command confusion prevention after enhancement"""
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} az storage blob upload --account-name projectscoutdata \\")
        time.sleep(0.5 * self.demo_speed)
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} --container-name workflows --file ./data/session.json")
        time.sleep(0.5 * self.demo_speed)
        
        # Warning message
        print(f"{COLORS['yellow']}⚠️ Your input looks like a command but was sent to mistral.{COLORS['reset']}")
        print(f"{COLORS['yellow']}Use ! prefix or :shell mode for system commands.{COLORS['reset']}")
        time.sleep(1 * self.demo_speed)
        
        # User corrects with proper prefix
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} !az storage blob upload --account-name projectscoutdata --container-name workflows --file ./data/session.json")
        time.sleep(1 * self.demo_speed)
        
        # Command executes properly
        print(f"Upload of ./data/session.json to container 'workflows' on account 'projectscoutdata' succeeded.")
    
    def demo_mode_switching(self):
        """Demonstrate mode switching"""
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :shell")
        time.sleep(0.5 * self.demo_speed)
        print(f"Switched from {COLORS['blue']}🔵 prompt{COLORS['reset']} to {COLORS['green']}🔩 shell{COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['green']}🔩 shell{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} ls -la")
        time.sleep(0.5 * self.demo_speed)
        print("total 104")
        print("drwxr-xr-x  14 tbwa  staff   448 Apr 28 14:52 .")
        print("drwxr-xr-x   9 tbwa  staff   288 Apr 28 14:49 ..")
        print("-rw-r--r--   1 tbwa  staff  2543 Apr 28 14:52 INSTRUCTIONS.md")
        print("-rw-r--r--   1 tbwa  staff  1245 Apr 28 14:51 README.md")
        print("-rw-r--r--   1 tbwa  staff  1814 Apr 28 14:51 README_PULSER.md")
        print("-rw-r--r--   1 tbwa  staff  1689 Apr 28 14:52 README_UPDATE.md")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['green']}🔩 shell{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :ops")
        time.sleep(0.5 * self.demo_speed)
        print(f"Switched from {COLORS['green']}🔩 shell{COLORS['reset']} to {COLORS['magenta']}🧠 ops{COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['magenta']}🧠 ops{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :task scout.extract --input session03.json")
        time.sleep(1 * self.demo_speed)
        print(f"{COLORS['cyan']}👁️ Echo:{COLORS['reset']} Extracted mentions from session03.json")
        print(f"{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Synced to SKR database")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['magenta']}🧠 ops{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :prompt")
        time.sleep(0.5 * self.demo_speed)
        print(f"Switched from {COLORS['magenta']}🧠 ops{COLORS['reset']} to {COLORS['blue']}🔵 prompt{COLORS['reset']}")
    
    def demo_warning_suppression(self):
        """Demonstrate warning suppression"""
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :quiet")
        time.sleep(0.5 * self.demo_speed)
        print(f"{COLORS['green']}Quiet mode enabled. Warnings and verbose output suppressed.{COLORS['reset']}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} ?mistral explain machine learning")
        time.sleep(1 * self.demo_speed)
        
        # Notice no loading output or warnings
        response = "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data, learn from it, and make predictions or decisions."
        print(f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']} {response}")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :verbose")
        time.sleep(0.5 * self.demo_speed)
        print(f"{COLORS['green']}Verbose mode enabled. All warnings and output shown.{COLORS['reset']}")
    
    def demo_help_screen(self):
        """Demonstrate the help screen"""
        print(f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} :help")
        time.sleep(0.5 * self.demo_speed)
        
        print(f"{COLORS['bold']}Pulser Shell Command Reference{COLORS['reset']}\n")
        
        print(f"{COLORS['bold']}Mode Switching:{COLORS['reset']}")
        print(f"  :prompt       {COLORS['blue']}Switch to prompt mode (default){COLORS['reset']}")
        print(f"  :shell        {COLORS['green']}Switch to shell command mode{COLORS['reset']}")
        print(f"  :ops          {COLORS['magenta']}Switch to PulseOps mode{COLORS['reset']}\n")
        
        print(f"{COLORS['bold']}Command Prefixes (work in any mode):{COLORS['reset']}")
        print(f"  !command      {COLORS['green']}Execute shell command{COLORS['reset']}")
        print(f"  ?text         {COLORS['blue']}Direct prompt to current model{COLORS['reset']}")
        print(f"  ?model text   {COLORS['blue']}Direct prompt to specific model{COLORS['reset']}")
        print(f"  :task a.b args {COLORS['magenta']}Run PulseOps task{COLORS['reset']}\n")
        
        print(f"{COLORS['bold']}Output Control:{COLORS['reset']}")
        print(f"  :quiet        Suppress warnings and verbose output")
        print(f"  :verbose      Show all warnings and verbose output\n")
        
        print(f"{COLORS['bold']}Other Commands:{COLORS['reset']}")
        print(f"  :model name   Set default model for prompts")
        print(f"  :help         Show this help information\n")
        
        print(f"{COLORS['bold']}Available Models:{COLORS['reset']} claudia, echo, mistral, gpt4\n")
    
    def interactive_demo(self):
        """Run an interactive demo letting user try things"""
        print_header("Interactive Pulser CLI Experience")
        print("Type commands to interact with the enhanced Pulser shell.")
        print("Some examples to try:")
        print("  - :help      (show help)")
        print("  - :shell     (switch to shell mode)")
        print("  - !ls        (run shell command)")
        print("  - ?mistral hello  (prompt mistral)")
        print("  - :quiet     (hide warnings)")
        print("  - exit       (quit demo)")
        print()
        
        mode = "prompt"
        quiet = False
        model = "mistral"
        
        while True:
            if mode == "prompt":
                prompt = f"{COLORS['yellow']}pulser[{COLORS['blue']}🔵 prompt{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} "
            elif mode == "shell":
                prompt = f"{COLORS['yellow']}pulser[{COLORS['green']}🔩 shell{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} "
            elif mode == "ops":
                prompt = f"{COLORS['yellow']}pulser[{COLORS['magenta']}🧠 ops{COLORS['reset']}{COLORS['yellow']}]>{COLORS['reset']} "
            
            try:
                cmd = input(prompt)
                
                if cmd in ["exit", "quit", ":exit", ":quit"]:
                    print("Exiting interactive demo")
                    break
                    
                elif cmd == ":help":
                    self.demo_help_screen()
                    
                elif cmd == ":shell":
                    print(f"Switched from {['blue', 'green', 'magenta'][['prompt', 'shell', 'ops'].index(mode)]}{mode}{COLORS['reset']} to {COLORS['green']}🔩 shell{COLORS['reset']}")
                    mode = "shell"
                    
                elif cmd == ":prompt":
                    print(f"Switched from {['blue', 'green', 'magenta'][['prompt', 'shell', 'ops'].index(mode)]}{mode}{COLORS['reset']} to {COLORS['blue']}🔵 prompt{COLORS['reset']}")
                    mode = "prompt"
                    
                elif cmd == ":ops":
                    print(f"Switched from {['blue', 'green', 'magenta'][['prompt', 'shell', 'ops'].index(mode)]}{mode}{COLORS['reset']} to {COLORS['magenta']}🧠 ops{COLORS['reset']}")
                    mode = "ops"
                    
                elif cmd == ":quiet":
                    quiet = True
                    print(f"{COLORS['green']}Quiet mode enabled. Warnings and verbose output suppressed.{COLORS['reset']}")
                    
                elif cmd == ":verbose":
                    quiet = False
                    print(f"{COLORS['green']}Verbose mode enabled. All warnings and output shown.{COLORS['reset']}")
                
                elif cmd.startswith(":model "):
                    new_model = cmd.split(" ")[1].strip()
                    if new_model in ["claudia", "echo", "mistral", "gpt4"]:
                        old_model = model
                        model = new_model
                        print(f"Set prompt model from {old_model} to {model}")
                    else:
                        print(f"{COLORS['red']}Invalid model: {new_model}{COLORS['reset']}")
                        print(f"Available models: claudia, echo, mistral, gpt4")
                
                elif cmd.startswith("?"):
                    # Direct model prompt
                    parts = cmd[1:].split(" ", 1)
                    if len(parts) > 1 and parts[0] in ["claudia", "echo", "mistral", "gpt4"]:
                        use_model = parts[0]
                        prompt_text = parts[1]
                    else:
                        use_model = model
                        prompt_text = cmd[1:]
                    
                    if not quiet:
                        spinner = SpinnerThread(f"Loading {use_model} model...")
                        spinner.start()
                        time.sleep(1.5)
                        spinner.stop()
                        print(f"{COLORS['green']}✓ {use_model} model loaded successfully (1.5s){COLORS['reset']}")
                    
                    if use_model == "claudia":
                        prefix = f"{COLORS['cyan']}📤 Claudia:{COLORS['reset']}"
                    elif use_model == "echo":
                        prefix = f"{COLORS['green']}👁️ Echo:{COLORS['reset']}"
                    elif use_model == "mistral":
                        prefix = f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']}"
                    elif use_model == "gpt4":
                        prefix = f"{COLORS['magenta']}🧠 GPT-4:{COLORS['reset']}"
                    
                    print(f"{prefix} This is a simulated response to your prompt: \"{prompt_text}\"")
                
                elif cmd.startswith("!") or mode == "shell":
                    # Shell command
                    shell_cmd = cmd[1:] if cmd.startswith("!") else cmd
                    print(f"Would execute shell command: {shell_cmd}")
                    print("(This is a demo - no actual commands are executed)")
                
                elif cmd.startswith(":task ") or mode == "ops":
                    # Ops command
                    if cmd.startswith(":task "):
                        parts = cmd[6:].split(" ", 1)
                        task = parts[0]
                        args = parts[1] if len(parts) > 1 else ""
                    else:
                        task = "claudia.process"
                        args = cmd
                    
                    print(f"{COLORS['magenta']}Running task {task} with args: {args}{COLORS['reset']}")
                    print(f"{COLORS['cyan']}👁️ Echo:{COLORS['reset']} Task simulated")
                    print(f"{COLORS['magenta']}📤 Claudia:{COLORS['reset']} Processing complete")
                
                elif mode == "prompt":
                    # Handle as model prompt
                    if "--account-name" in cmd or "az " in cmd:
                        print(f"{COLORS['yellow']}⚠️ Your input looks like a command but was sent to {model}.{COLORS['reset']}")
                        print(f"{COLORS['yellow']}Use ! prefix or :shell mode for system commands.{COLORS['reset']}")
                    else:
                        if not quiet:
                            spinner = SpinnerThread(f"Loading {model} model...")
                            spinner.start()
                            time.sleep(1.5)
                            spinner.stop()
                            print(f"{COLORS['green']}✓ {model} model loaded successfully (1.5s){COLORS['reset']}")
                        
                        if model == "claudia":
                            prefix = f"{COLORS['cyan']}📤 Claudia:{COLORS['reset']}"
                        elif model == "echo":
                            prefix = f"{COLORS['green']}👁️ Echo:{COLORS['reset']}"
                        elif model == "mistral":
                            prefix = f"{COLORS['blue']}🔵 Mistral:{COLORS['reset']}"
                        elif model == "gpt4":
                            prefix = f"{COLORS['magenta']}🧠 GPT-4:{COLORS['reset']}"
                        
                        print(f"{prefix} This is a simulated response to your prompt: \"{cmd}\"")
                
                else:
                    print(f"{COLORS['red']}Unknown command: {cmd}{COLORS['reset']}")
                    print("Type :help for available commands")
                
            except KeyboardInterrupt:
                print("\nUse 'exit' to quit")
            except EOFError:
                print("\nExiting interactive demo")
                break
    
    def run_all_demos(self):
        """Run all demo scenarios"""
        clear_screen()
        print_header("Pulser CLI Enhanced Experience Demo")
        print(f"{COLORS['bold']}This demo showcases the enhanced UX for Pulser CLI.{COLORS['reset']}")
        print("Press Ctrl+C at any time to skip to the next demo.")
        print()
        
        try:
            print_header("1. Model Loading Experience")
            print(f"{COLORS['bold']}Before:{COLORS['reset']} Noisy output with warnings and progress bars")
            print(f"{COLORS['bold']}After:{COLORS['reset']} Clean output with spinner and completion notification")
            print()
            time.sleep(1 * self.demo_speed)
            
            print(f"{COLORS['bold']}BEFORE:{COLORS['reset']}")
            self.demo_model_loading_before()
            print("\n")
            time.sleep(1 * self.demo_speed)
            
            print(f"{COLORS['bold']}AFTER:{COLORS['reset']}")
            self.demo_model_loading_after()
            time.sleep(2 * self.demo_speed)
            
            print_header("2. Command Confusion Prevention")
            print(f"{COLORS['bold']}Before:{COLORS['reset']} Shell commands treated as prompts")
            print(f"{COLORS['bold']}After:{COLORS['reset']} Warning and suggestions for proper syntax")
            print()
            time.sleep(1 * self.demo_speed)
            
            print(f"{COLORS['bold']}BEFORE:{COLORS['reset']}")
            self.demo_command_confusion_before()
            print("\n")
            time.sleep(1 * self.demo_speed)
            
            print(f"{COLORS['bold']}AFTER:{COLORS['reset']}")
            self.demo_command_confusion_after()
            time.sleep(2 * self.demo_speed)
            
            print_header("3. Mode Switching")
            print("Easily switch between prompt, shell, and ops modes")
            print()
            time.sleep(1 * self.demo_speed)
            
            self.demo_mode_switching()
            time.sleep(2 * self.demo_speed)
            
            print_header("4. Warning Suppression")
            print("Quiet mode suppresses model loading noise and warnings")
            print()
            time.sleep(1 * self.demo_speed)
            
            self.demo_warning_suppression()
            time.sleep(2 * self.demo_speed)
            
            print_header("5. Help Screen")
            print("Comprehensive help with color-coded commands")
            print()
            time.sleep(1 * self.demo_speed)
            
            self.demo_help_screen()
            time.sleep(2 * self.demo_speed)
            
            # Interactive demo
            self.interactive_demo()
            
        except KeyboardInterrupt:
            pass
        finally:
            print_header("Demo Complete")
            print("To install the enhancements:")
            print("1. Run ./install_pulser_enhancements.sh")
            print("2. Start using with 'pulser-enhanced'")
            print()
            print("For more details, see README_PULSER.md")

def main():
    """Main entry point"""
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nExiting demo...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    demo = PulserDemo()
    demo.run_all_demos()

if __name__ == "__main__":
    main()