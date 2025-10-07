#!/usr/bin/env python3
"""
Pulser Context Manager

Provides contextual awareness for Pulser Shell, storing session history,
environment variables, and previous command results.
"""

import os
import json
import time
from typing import Dict, List, Any, Optional, Union

class PulserContext:
    """Manages persistent context for Pulser Shell sessions"""
    
    def __init__(self, context_file: Optional[str] = None):
        """Initialize context manager"""
        self.context_file = context_file or os.path.expanduser("~/.pulser_context.json")
        self.context = self._load_context()
        self.session_id = str(int(time.time()))
        
        # Initialize session if not present
        if "sessions" not in self.context:
            self.context["sessions"] = {}
            
        # Initialize current session
        self.context["sessions"][self.session_id] = {
            "start_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "commands": [],
            "environment": {},
            "task_ids": []
        }
        
        # Save initialized context
        self._save_context()
    
    def _load_context(self) -> Dict[str, Any]:
        """Load context from file or initialize empty context"""
        try:
            if os.path.exists(self.context_file):
                with open(self.context_file, "r") as f:
                    return json.load(f)
            return {
                "session_counter": 0,
                "sessions": {},
                "tasks": {},
                "system_vars": {},
                "command_aliases": {}
            }
        except Exception:
            # Fall back to empty context if file is corrupted
            return {
                "session_counter": 0,
                "sessions": {},
                "tasks": {},
                "system_vars": {},
                "command_aliases": {}
            }
    
    def _save_context(self) -> None:
        """Save context to file"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.context_file), exist_ok=True)
            
            with open(self.context_file, "w") as f:
                json.dump(self.context, f, indent=2)
        except Exception:
            # Silently fail if we can't save context
            pass
    
    def add_command(self, command_type: str, command: str, args: Optional[str] = None, result: Optional[str] = None) -> None:
        """Add a command to the current session history"""
        command_entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "type": command_type,
            "command": command,
            "args": args,
            "result_summary": result[:100] + "..." if result and len(result) > 100 else result
        }
        
        # Add to current session
        self.context["sessions"][self.session_id]["commands"].append(command_entry)
        self._save_context()
    
    def add_task(self, task_text: str) -> str:
        """Add a task to the context and return its ID"""
        task_id = f"task_{int(time.time())}"
        
        self.context["tasks"][task_id] = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "text": task_text,
            "completed": False,
            "session_id": self.session_id
        }
        
        # Add task ID to current session
        self.context["sessions"][self.session_id]["task_ids"].append(task_id)
        self._save_context()
        
        return task_id
    
    def update_environment(self, var_name: str, value: str) -> None:
        """Update environment variables in context"""
        self.context["sessions"][self.session_id]["environment"][var_name] = value
        self._save_context()
    
    def get_task(self, task_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a task by ID, or the most recent task if no ID provided"""
        if task_id is not None:
            return self.context["tasks"].get(task_id)
            
        # Get most recent task from current session
        task_ids = self.context["sessions"][self.session_id]["task_ids"]
        if not task_ids:
            return None
            
        most_recent_task_id = task_ids[-1]
        return self.context["tasks"].get(most_recent_task_id)
    
    def get_command_history(self, limit: int = 10, command_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent command history, optionally filtered by type"""
        commands = self.context["sessions"][self.session_id]["commands"]
        
        # Filter by type if specified
        if command_type:
            commands = [cmd for cmd in commands if cmd["type"] == command_type]
            
        # Return most recent commands up to limit
        return commands[-limit:] if limit > 0 else commands
    
    def get_environment(self) -> Dict[str, str]:
        """Get environment variables from current session"""
        return self.context["sessions"][self.session_id]["environment"]
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get statistics about the current session"""
        session = self.context["sessions"][self.session_id]
        
        # Count commands by type
        command_types = {}
        for cmd in session["commands"]:
            cmd_type = cmd["type"]
            command_types[cmd_type] = command_types.get(cmd_type, 0) + 1
            
        return {
            "start_time": session["start_time"],
            "duration_minutes": int((time.time() - int(self.session_id)) / 60),
            "command_count": len(session["commands"]),
            "command_types": command_types,
            "task_count": len(session["task_ids"]),
            "env_var_count": len(session["environment"])
        }
    
    def add_system_var(self, name: str, value: Any) -> None:
        """Add or update a system variable"""
        self.context["system_vars"][name] = value
        self._save_context()
    
    def get_system_var(self, name: str, default: Any = None) -> Any:
        """Get a system variable, or default if not found"""
        return self.context["system_vars"].get(name, default)
        
    def close(self) -> None:
        """Close the context manager and save final state"""
        # Update session end time
        self.context["sessions"][self.session_id]["end_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
        self._save_context()