"""
Agent and tool routing utilities for Pulser CLI.
"""

import os
import yaml
import json

def load_config(config_path="pulser.config.yaml"):
    """
    Load the Pulser configuration file.
    
    Args:
        config_path: Path to the config file
        
    Returns:
        Dict containing the configuration
    """
    if not os.path.exists(config_path):
        return {
            "tools": {
                "bash": "./task_executor.sh"
            },
            "agents": {
                "default": "claude"
            }
        }
    
    with open(config_path, "r") as f:
        return yaml.safe_load(f)
        
def route_tool(tool_name):
    """
    Route a tool name to the appropriate agent.
    
    Args:
        tool_name: Name of the tool to route
        
    Returns:
        Name of the agent that should handle this tool
    """
    config = load_config()
    
    if tool_name in config.get("tools", {}):
        # Direct tool mapping
        return config["agents"].get("default", "claude")
    
    # Special routing logic
    if tool_name in ["bash", "shell", "command"]:
        return config["agents"].get("privileged", "basher")
    
    if tool_name in ["dashboard", "visualize", "chart"]:
        return config["agents"].get("dashboard", "dash")
    
    # Default to Claude
    return config["agents"].get("default", "claude")

def execute_command(tool_name, command, log_file="claude_session.log"):
    """
    Execute a command with the appropriate tool and log the result.
    
    Args:
        tool_name: Name of the tool to use
        command: Command to execute
        log_file: Path to the log file
        
    Returns:
        Result of the command execution
    """
    from .memory import log_context
    
    config = load_config()
    agent = route_tool(tool_name)
    
    # Log the command
    log_context(f"[{agent}] Executing {tool_name}: {command}", log_file)
    
    # Get the tool executable
    tool_path = config["tools"].get(tool_name, "./task_executor.sh")
    
    # Build the command
    full_command = f"{tool_path} {command}"
    
    # Execute the command
    import subprocess
    result = subprocess.run(full_command, shell=True, capture_output=True, text=True)
    
    # Log the result
    log_context(f"[{agent}] Result: {result.returncode}", log_file)
    if result.stdout:
        log_context(f"[{agent}] Output: {result.stdout[:200]}...", log_file)
    if result.stderr:
        log_context(f"[{agent}] Error: {result.stderr[:200]}...", log_file)
    
    return {
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr
    }