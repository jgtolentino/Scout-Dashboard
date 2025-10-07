"""
Memory management utilities for Pulser CLI.
"""

import os
import json
import time
from datetime import datetime

def log_context(message, file_path="claude_session.log"):
    """
    Logs a message to the specified context file.
    
    Args:
        message: The message to log
        file_path: Path to the log file
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(file_path, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
    
    return True
    
def read_context(file_path="claude_session.log", max_lines=100):
    """
    Reads recent context from the log file.
    
    Args:
        file_path: Path to the log file
        max_lines: Maximum number of lines to read
        
    Returns:
        List of recent context lines
    """
    if not os.path.exists(file_path):
        return []
        
    with open(file_path, "r") as f:
        lines = f.readlines()
    
    # Return last N lines
    return lines[-max_lines:]