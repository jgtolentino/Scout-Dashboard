"""
Claudia Context Manager

This module provides context management capabilities for the PulseForge system,
handling state tracking, memory, and information sharing between agents.
"""

import os
import json
import logging
import time
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
from datetime import datetime
import uuid

from core.system_prompts import CONTEXT_MANAGEMENT, ACCURACY_BOOSTER

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContextManager:
    """
    Context manager for tracking state and sharing information between agents.
    
    This class serves as the central memory system for PulseForge, enabling
    agents to share context and maintain state across the generation process.
    """
    
    def __init__(
        self,
        session_id: Optional[str] = None,
        memory_path: Optional[str] = None,
        system_prompt: str = CONTEXT_MANAGEMENT
    ):
        """
        Initialize the context manager.
        
        Args:
            session_id: Unique identifier for this session
            memory_path: Path to persist context
            system_prompt: System prompt to guide the context manager
        """
        self.session_id = session_id or str(uuid.uuid4())
        self.memory_path = memory_path or os.path.join(os.getcwd(), "memory")
        self.system_prompt = system_prompt
        
        # Ensure memory directory exists
        os.makedirs(self.memory_path, exist_ok=True)
        
        # Initialize context
        self.global_context = {
            "session_id": self.session_id,
            "creation_time": datetime.now().isoformat(),
            "agent_states": {},
            "shared_memory": {},
            "artifacts": {}
        }
        
        logger.info(f"Context manager initialized with session ID: {self.session_id}")
        
        # Initialize the memory file
        self._save_context()
    
    def _save_context(self) -> None:
        """Save the current context to disk."""
        context_path = os.path.join(self.memory_path, f"{self.session_id}.json")
        
        with open(context_path, "w") as f:
            # Filter out non-serializable items
            serializable_context = self._make_serializable(self.global_context)
            json.dump(serializable_context, f, indent=2)
    
    def _make_serializable(self, obj: Any) -> Any:
        """Make an object JSON serializable."""
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items() 
                   if not callable(v)}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        else:
            # Convert non-serializable objects to strings
            return str(obj)
    
    def load_context(self, session_id: str) -> bool:
        """
        Load context from a previous session.
        
        Args:
            session_id: Session ID to load
            
        Returns:
            True if successful, False otherwise
        """
        context_path = os.path.join(self.memory_path, f"{session_id}.json")
        
        if not os.path.exists(context_path):
            logger.warning(f"Context file not found: {context_path}")
            return False
        
        try:
            with open(context_path, "r") as f:
                self.global_context = json.load(f)
            
            self.session_id = session_id
            logger.info(f"Loaded context for session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error loading context: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a value from the shared memory.
        
        Args:
            key: Key to retrieve
            default: Default value if key doesn't exist
            
        Returns:
            Value for the key or default
        """
        return self.global_context["shared_memory"].get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """
        Set a value in the shared memory.
        
        Args:
            key: Key to set
            value: Value to store
        """
        self.global_context["shared_memory"][key] = value
        self._save_context()
    
    def update_agent_state(self, agent_name: str, state: Dict[str, Any]) -> None:
        """
        Update the state for a specific agent.
        
        Args:
            agent_name: Name of the agent
            state: State dictionary
        """
        if agent_name not in self.global_context["agent_states"]:
            self.global_context["agent_states"][agent_name] = {}
        
        self.global_context["agent_states"][agent_name].update(state)
        self._save_context()
    
    def get_agent_state(self, agent_name: str) -> Dict[str, Any]:
        """
        Get the state for a specific agent.
        
        Args:
            agent_name: Name of the agent
            
        Returns:
            Agent state dictionary
        """
        return self.global_context["agent_states"].get(agent_name, {})
    
    def register_artifact(self, name: str, artifact_type: str, location: str, metadata: Dict[str, Any] = None) -> None:
        """
        Register an artifact generated during the process.
        
        Args:
            name: Artifact name
            artifact_type: Type of artifact (e.g., 'schema', 'code')
            location: Path or identifier for the artifact
            metadata: Additional information about the artifact
        """
        self.global_context["artifacts"][name] = {
            "type": artifact_type,
            "location": location,
            "created_at": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self._save_context()
    
    def get_artifacts(self, artifact_type: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Get registered artifacts.
        
        Args:
            artifact_type: Filter by artifact type
            
        Returns:
            Dictionary of artifacts
        """
        if artifact_type:
            return {k: v for k, v in self.global_context["artifacts"].items() 
                   if v["type"] == artifact_type}
        else:
            return self.global_context["artifacts"]
    
    def generate_prompt_with_context(self, agent_name: str, base_prompt: str) -> str:
        """
        Generate a prompt with relevant context for an agent.
        
        Args:
            agent_name: Name of the agent
            base_prompt: Base prompt template
            
        Returns:
            Prompt enriched with context
        """
        # Start with the accuracy booster
        final_prompt = ACCURACY_BOOSTER + "\n\n" + base_prompt
        
        # Add agent-specific context
        agent_state = self.get_agent_state(agent_name)
        if agent_state:
            context_section = "\n\nCurrent context:\n"
            for key, value in agent_state.items():
                if isinstance(value, (str, int, float, bool)):
                    context_section += f"- {key}: {value}\n"
            
            final_prompt += context_section
        
        # Add global context elements that might be relevant
        if agent_name == "maya" and "entities" in self.global_context["shared_memory"]:
            final_prompt += f"\n\nEntities extracted:\n{self.global_context['shared_memory']['entities']}\n"
        
        if agent_name == "tide" and "schema" in self.global_context["shared_memory"]:
            final_prompt += f"\n\nSchema design:\n{self.global_context['shared_memory']['schema']}\n"
        
        return final_prompt
    
    def get_full_context(self) -> Dict[str, Any]:
        """
        Get the full context.
        
        Returns:
            Complete context dictionary
        """
        return self.global_context
    
    def clear(self) -> None:
        """Clear the current context."""
        self.global_context = {
            "session_id": self.session_id,
            "creation_time": datetime.now().isoformat(),
            "agent_states": {},
            "shared_memory": {},
            "artifacts": {}
        }
        self._save_context()


# Factory function to create a context manager
def create_context_manager(session_id: Optional[str] = None) -> ContextManager:
    """
    Create a new context manager.
    
    Args:
        session_id: Optional session ID
        
    Returns:
        Initialized context manager
    """
    return ContextManager(session_id=session_id)