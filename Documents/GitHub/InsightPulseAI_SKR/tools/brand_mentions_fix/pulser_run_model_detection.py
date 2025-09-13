#!/usr/bin/env python3
"""
Pulser Model Detection Utility

This script helps detect when model loading/reloading is happening
and provides hooks to alter the user experience during these events.
"""

import re
import os
import sys
import warnings
import subprocess
from typing import Optional, List, Dict, Any, Tuple
import threading
import time
import signal

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

# Filter warnings at the Python level
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*LibreSSL.*")

class ModelDetector:
    """Utility to detect when models are loading and provide feedback"""
    
    def __init__(self, quiet_mode=False, silent_mode=False):
        self.quiet_mode = quiet_mode
        self.silent_mode = silent_mode  # Complete silence - no output at all
        self.current_model = None
        self.model_loading = False
        self.load_start_time = 0
        self.spinner_thread = None
        self.stop_spinner = False
        
    def _spinner_animation(self):
        """Display a spinner animation while model is loading"""
        spinner_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        i = 0
        while not self.stop_spinner:
            if self.model_loading:
                elapsed = time.time() - self.load_start_time
                # Get spinner character
                char = spinner_chars[i % len(spinner_chars)]
                # Clear line and print status
                sys.stdout.write(f"\r{COLORS['blue']}{char} Loading {self.current_model} model... ({elapsed:.1f}s){COLORS['reset']}   ")
                sys.stdout.flush()
                i += 1
                time.sleep(0.1)
            else:
                time.sleep(0.2)
                
    def start_monitoring(self):
        """Start the spinner thread for model loading animation"""
        if not self.quiet_mode and not self.silent_mode:
            self.stop_spinner = False
            self.spinner_thread = threading.Thread(target=self._spinner_animation)
            self.spinner_thread.daemon = True
            self.spinner_thread.start()
        
    def stop_monitoring(self):
        """Stop the spinner thread"""
        if self.spinner_thread and self.spinner_thread.is_alive():
            self.stop_spinner = True
            self.spinner_thread.join(timeout=1)
            # Clear the spinner line
            sys.stdout.write("\r" + " " * 80 + "\r")
            sys.stdout.flush()
            
    def detect_model_loading(self, text):
        """
        Detect if model loading is occurring based on output text
        Returns True if model loading was detected
        """
        if "Reloading model" in text or "pulling manifest" in text:
            model_name_match = re.search(r"Reloading model '(\w+)'", text)
            if model_name_match:
                self.current_model = model_name_match.group(1)
                self.model_loading = True
                self.load_start_time = time.time()
                return True
        
        # Look for completion indicators
        if self.model_loading and ("success" in text or "Successfully pulled" in text):
            self.model_loading = False
            duration = time.time() - self.load_start_time
            if not self.quiet_mode and not self.silent_mode:
                # Clear the spinner line
                sys.stdout.write("\r" + " " * 80 + "\r")
                sys.stdout.flush()
                print(f"{COLORS['green']}✓ {self.current_model} model loaded successfully ({duration:.1f}s){COLORS['reset']}")
            return True
            
        return False

    def run_command_with_detection(self, command):
        """
        Run a command and detect model loading in its output
        Returns the command output with model loading messages filtered
        """
        # Start the spinner thread
        self.start_monitoring()
        
        try:
            # Launch the process
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True,
                env=dict(os.environ, PYTHONWARNINGS="ignore")
            )
            
            # Buffer for real output (non-model-loading messages)
            real_output = []
            
            # Process stdout and stderr
            while True:
                stdout_line = process.stdout.readline()
                stderr_line = process.stderr.readline()
                
                if not stdout_line and not stderr_line and process.poll() is not None:
                    break
                    
                # Check stdout for model loading
                if stdout_line:
                    if not self.detect_model_loading(stdout_line):
                        # Only keep non-model-loading lines
                        # Also filter LibreSSL warnings
                        if not self._is_filtered_line(stdout_line):
                            real_output.append(stdout_line.strip())
                
                # Check stderr for model loading (some tools use stderr)
                if stderr_line:
                    if not self.detect_model_loading(stderr_line):
                        # Only keep non-model-loading lines
                        # Also filter LibreSSL warnings
                        if not self._is_filtered_line(stderr_line):
                            real_output.append(f"{COLORS['red']}Error: {stderr_line.strip()}{COLORS['reset']}")
            
            # Clean up spinner
            self.stop_monitoring()
            
            # Return the filtered output
            return "\n".join(real_output)
            
        except Exception as e:
            self.stop_monitoring()
            return f"{COLORS['red']}Error running command: {str(e)}{COLORS['reset']}"
    
    def _is_filtered_line(self, line):
        """Check if a line should be filtered out"""
        line = line.strip()
        
        # Filter model loading related lines
        if any(pattern in line for pattern in [
            "Reloading model",
            "pulling manifest",
            "pulling ",
            "verifying sha256",
            "writing manifest",
            "success",
            "Successfully pulled"
        ]):
            return True
            
        # Filter common warnings
        if any(pattern in line for pattern in [
            "LibreSSL",
            "DeprecationWarning",
            "FutureWarning",
            "SyntaxWarning"
        ]):
            return True
            
        return False
            
def main():
    """Test the model detection functionality"""
    detector = ModelDetector(quiet_mode=False)
    
    # Example of running a command that might load a model
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:])
    else:
        command = "ollama run mistral 'What is the capital of France?'"
        
    print(f"Running command: {command}")
    output = detector.run_command_with_detection(command)
    
    print("\nFiltered output:")
    print(output)

if __name__ == "__main__":
    # Suppress all warnings at the Python level
    warnings.filterwarnings("ignore")
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\nExiting...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    main()