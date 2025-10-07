"""
Lovable Clone Manager

This module provides functionality for cloning previously generated applications,
allowing users to create variations of existing apps with modifications.

The clone manager handles:
1. Storing metadata about generated apps
2. Retrieving and modifying previous generation requests
3. Managing the cloning process with version tracking
"""

import os
import json
import uuid
import logging
import shutil
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from datetime import datetime

from agents.tide.interface import GenerationRequest, GenerationResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CloneRequest:
    """Request for cloning a previously generated app with modifications."""
    
    def __init__(
        self,
        original_id: str,
        modifications: Dict[str, Any] = None,
        new_prompt: Optional[str] = None,
        new_stack: Optional[str] = None,
        add_features: List[str] = None,
        remove_features: List[str] = None,
        clone_id: Optional[str] = None,
        output_dir: Optional[str] = None,
        clone_name: Optional[str] = None
    ):
        """
        Initialize a clone request.
        
        Args:
            original_id: ID of the original generation to clone
            modifications: Dict of specific modifications to apply
            new_prompt: New prompt to use (or None to keep original)
            new_stack: New tech stack to use (or None to keep original)
            add_features: Features to add to the original
            remove_features: Features to remove from the original
            clone_id: Optional ID for the clone (auto-generated if not provided)
            output_dir: Optional output directory for the clone
            clone_name: Optional name for the clone
        """
        self.original_id = original_id
        self.modifications = modifications or {}
        self.new_prompt = new_prompt
        self.new_stack = new_stack
        self.add_features = add_features or []
        self.remove_features = remove_features or []
        self.clone_id = clone_id or str(uuid.uuid4())
        self.output_dir = output_dir
        self.clone_name = clone_name or f"clone_{self.original_id[:8]}"
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "original_id": self.original_id,
            "modifications": self.modifications,
            "new_prompt": self.new_prompt,
            "new_stack": self.new_stack,
            "add_features": self.add_features,
            "remove_features": self.remove_features,
            "clone_id": self.clone_id,
            "output_dir": self.output_dir,
            "clone_name": self.clone_name,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CloneRequest':
        """Create from dictionary representation."""
        return cls(
            original_id=data["original_id"],
            modifications=data.get("modifications", {}),
            new_prompt=data.get("new_prompt"),
            new_stack=data.get("new_stack"),
            add_features=data.get("add_features", []),
            remove_features=data.get("remove_features", []),
            clone_id=data.get("clone_id"),
            output_dir=data.get("output_dir"),
            clone_name=data.get("clone_name")
        )


class LovableCloneManager:
    """
    Manager for the Lovable cloning functionality.
    
    This class provides the ability to clone previously generated applications
    with modifications, allowing for rapid iteration on app designs.
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the clone manager.
        
        Args:
            storage_dir: Directory to store generation metadata
        """
        self.storage_dir = Path(storage_dir or "lovable_storage")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        self.metadata_file = self.storage_dir / "generations.json"
        self.generations = self._load_generations()
        
        self.clones_file = self.storage_dir / "clones.json"
        self.clones = self._load_clones()
        
        logger.info(f"LovableCloneManager initialized with {len(self.generations)} stored generations")
    
    def _load_generations(self) -> Dict[str, Dict[str, Any]]:
        """
        Load stored generation metadata.
        
        Returns:
            Dictionary mapping generation IDs to their metadata
        """
        if not self.metadata_file.exists():
            return {}
        
        try:
            with open(self.metadata_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading generations: {e}")
            return {}
    
    def _save_generations(self) -> None:
        """Save generation metadata to disk."""
        try:
            with open(self.metadata_file, "w") as f:
                json.dump(self.generations, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving generations: {e}")
    
    def _load_clones(self) -> Dict[str, Dict[str, Any]]:
        """
        Load stored clone metadata.
        
        Returns:
            Dictionary mapping clone IDs to their metadata
        """
        if not self.clones_file.exists():
            return {}
        
        try:
            with open(self.clones_file, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading clones: {e}")
            return {}
    
    def _save_clones(self) -> None:
        """Save clone metadata to disk."""
        try:
            with open(self.clones_file, "w") as f:
                json.dump(self.clones, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving clones: {e}")
    
    def store_generation(self, request: GenerationRequest, response: GenerationResponse) -> None:
        """
        Store metadata about a successful generation.
        
        Args:
            request: Original generation request
            response: Generation response
        """
        if response.status != "success":
            logger.warning(f"Not storing unsuccessful generation: {response.request_id}")
            return
        
        generation_id = response.request_id
        
        # Store generation metadata
        self.generations[generation_id] = {
            "request": request.to_dict() if hasattr(request, "to_dict") else request,
            "response": {
                "codebase_path": response.codebase_path,
                "target_stack": response.target_stack,
                "completion_time": response.completion_time,
                "status": response.status,
                "metadata": response.metadata
            },
            "timestamp": datetime.now().isoformat()
        }
        
        self._save_generations()
        logger.info(f"Stored generation metadata for ID: {generation_id}")
    
    def get_generation(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata about a stored generation.
        
        Args:
            generation_id: ID of the generation to retrieve
            
        Returns:
            Generation metadata or None if not found
        """
        return self.generations.get(generation_id)
    
    def list_generations(self) -> List[Dict[str, Any]]:
        """
        List all stored generations.
        
        Returns:
            List of generation metadata
        """
        return [
            {
                "id": gen_id,
                "stack": data["response"].get("target_stack", "unknown"),
                "timestamp": data.get("timestamp", "unknown"),
                "path": data["response"].get("codebase_path", "unknown"),
                "prompt": data["request"].get("prompt", "")[:100] + "..."  # Truncate long prompts
            }
            for gen_id, data in self.generations.items()
        ]
    
    def create_clone_request(
        self,
        original_id: str,
        new_prompt: Optional[str] = None,
        new_stack: Optional[str] = None,
        add_features: List[str] = None,
        remove_features: List[str] = None,
        modifications: Dict[str, Any] = None,
        output_dir: Optional[str] = None,
        clone_name: Optional[str] = None
    ) -> Optional[CloneRequest]:
        """
        Create a request to clone a previous generation.
        
        Args:
            original_id: ID of the original generation to clone
            new_prompt: New prompt to use (or None to keep original)
            new_stack: New tech stack to use (or None to keep original)
            add_features: Features to add to the original
            remove_features: Features to remove from the original
            modifications: Dict of specific modifications to apply
            output_dir: Optional output directory for the clone
            clone_name: Optional name for the clone
            
        Returns:
            CloneRequest object or None if original generation not found
        """
        # Check if original generation exists
        if original_id not in self.generations:
            logger.error(f"Original generation not found: {original_id}")
            return None
        
        # Create clone request
        clone_request = CloneRequest(
            original_id=original_id,
            modifications=modifications,
            new_prompt=new_prompt,
            new_stack=new_stack,
            add_features=add_features,
            remove_features=remove_features,
            output_dir=output_dir,
            clone_name=clone_name
        )
        
        # Store clone request
        self.clones[clone_request.clone_id] = clone_request.to_dict()
        self._save_clones()
        
        return clone_request
    
    def apply_clone_request(self, clone_request: CloneRequest) -> GenerationRequest:
        """
        Apply a clone request to create a modified generation request.
        
        Args:
            clone_request: Clone request to apply
            
        Returns:
            Modified generation request
            
        Raises:
            ValueError: If original generation not found
        """
        # Get original generation
        original_gen = self.get_generation(clone_request.original_id)
        if not original_gen:
            raise ValueError(f"Original generation not found: {clone_request.original_id}")
        
        # Get original request
        original_request = original_gen["request"]
        if isinstance(original_request, dict):
            # Create a copy of the original request
            new_request_dict = original_request.copy()
            
            # Apply modifications
            
            # 1. Update prompt if specified
            if clone_request.new_prompt:
                new_request_dict["prompt"] = clone_request.new_prompt
            
            # 2. Update stack if specified
            if clone_request.new_stack:
                new_request_dict["target_stack"] = clone_request.new_stack
            
            # 3. Update features
            features = set(new_request_dict.get("features", []))
            features.update(clone_request.add_features)
            features = features - set(clone_request.remove_features)
            new_request_dict["features"] = list(features)
            
            # 4. Apply specific modifications
            for key, value in (clone_request.modifications or {}).items():
                if key in new_request_dict:
                    new_request_dict[key] = value
            
            # 5. Set new request ID and update output directory
            new_request_dict["request_id"] = clone_request.clone_id
            if clone_request.output_dir:
                new_request_dict["output_dir"] = clone_request.output_dir
            else:
                # Create a subdirectory for the clone
                original_path = Path(original_request.get("output_dir", "output"))
                new_request_dict["output_dir"] = str(original_path.parent / f"lovable_clone_{clone_request.clone_id}")
            
            # 6. Add metadata about cloning
            new_request_dict["metadata"] = {
                **(new_request_dict.get("metadata", {}) or {}),
                "cloned_from": clone_request.original_id,
                "clone_name": clone_request.clone_name,
                "clone_timestamp": clone_request.timestamp
            }
            
            # Create a new GenerationRequest object
            from agents.tide.interface import GenerationRequest
            return GenerationRequest(**new_request_dict)
        else:
            # Handle if the original request is already a GenerationRequest object
            from copy import deepcopy
            new_request = deepcopy(original_request)
            
            # Apply modifications
            if clone_request.new_prompt:
                new_request.prompt = clone_request.new_prompt
            
            if clone_request.new_stack:
                new_request.target_stack = clone_request.new_stack
            
            features = set(new_request.features or [])
            features.update(clone_request.add_features)
            features = features - set(clone_request.remove_features)
            new_request.features = list(features)
            
            # Apply specific modifications
            for key, value in (clone_request.modifications or {}).items():
                if hasattr(new_request, key):
                    setattr(new_request, key, value)
            
            # Update request ID and output directory
            new_request.request_id = clone_request.clone_id
            if clone_request.output_dir:
                new_request.output_dir = clone_request.output_dir
            else:
                original_path = Path(new_request.output_dir or "output")
                new_request.output_dir = str(original_path.parent / f"lovable_clone_{clone_request.clone_id}")
            
            # Add metadata about cloning
            new_request.metadata = {
                **(new_request.metadata or {}),
                "cloned_from": clone_request.original_id,
                "clone_name": clone_request.clone_name,
                "clone_timestamp": clone_request.timestamp
            }
            
            return new_request
    
    def copy_assets(self, clone_request: CloneRequest, new_codebase_path: str) -> None:
        """
        Copy assets from original generation to clone.
        
        Args:
            clone_request: Clone request
            new_codebase_path: Path to the new codebase
        """
        # Get original generation
        original_gen = self.get_generation(clone_request.original_id)
        if not original_gen:
            logger.error(f"Original generation not found: {clone_request.original_id}")
            return
        
        # Get original codebase path
        original_path = original_gen["response"].get("codebase_path")
        if not original_path or not os.path.exists(original_path):
            logger.error(f"Original codebase not found: {original_path}")
            return
        
        # Create directories
        asset_dirs = ["assets", "images", "public", "static"]
        original_dir = Path(original_path)
        new_dir = Path(new_codebase_path)
        
        for asset_dir in asset_dirs:
            original_asset_dir = original_dir / asset_dir
            if original_asset_dir.exists() and original_asset_dir.is_dir():
                new_asset_dir = new_dir / asset_dir
                new_asset_dir.mkdir(parents=True, exist_ok=True)
                
                # Copy files
                for file in original_asset_dir.glob("**/*"):
                    if file.is_file():
                        relative_path = file.relative_to(original_asset_dir)
                        target_path = new_asset_dir / relative_path
                        target_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(file, target_path)
        
        logger.info(f"Copied assets from {original_path} to {new_codebase_path}")
    
    def record_clone(self, clone_request: CloneRequest, response: GenerationResponse) -> None:
        """
        Record successful clone.
        
        Args:
            clone_request: Clone request
            response: Generation response
        """
        if response.status != "success":
            logger.warning(f"Not recording unsuccessful clone: {clone_request.clone_id}")
            return
        
        # Update clone record
        clone_data = self.clones.get(clone_request.clone_id, {})
        if not clone_data:
            clone_data = clone_request.to_dict()
        
        clone_data["response"] = {
            "codebase_path": response.codebase_path,
            "target_stack": response.target_stack,
            "completion_time": response.completion_time,
            "status": response.status,
            "metadata": response.metadata
        }
        clone_data["completion_timestamp"] = datetime.now().isoformat()
        
        self.clones[clone_request.clone_id] = clone_data
        self._save_clones()
        
        # Also store as a regular generation
        self.store_generation(clone_request, response)
        
        logger.info(f"Recorded successful clone: {clone_request.clone_id}")
    
    def get_clone(self, clone_id: str) -> Optional[Dict[str, Any]]:
        """
        Get clone metadata.
        
        Args:
            clone_id: ID of the clone
            
        Returns:
            Clone metadata or None if not found
        """
        return self.clones.get(clone_id)
    
    def list_clones(self) -> List[Dict[str, Any]]:
        """
        List all clones.
        
        Returns:
            List of clone metadata
        """
        return [
            {
                "id": clone_id,
                "original_id": data.get("original_id", "unknown"),
                "name": data.get("clone_name", f"Clone {clone_id}"),
                "stack": data.get("new_stack") or self.generations.get(data.get("original_id", ""), {}).get("response", {}).get("target_stack", "unknown"),
                "timestamp": data.get("timestamp", "unknown"),
                "completion_timestamp": data.get("completion_timestamp", None),
                "status": "completed" if "response" in data else "pending"
            }
            for clone_id, data in self.clones.items()
        ]

# Global instance for easy access
_clone_manager = None

def get_clone_manager(storage_dir: Optional[str] = None) -> LovableCloneManager:
    """
    Get the global clone manager instance.
    
    Args:
        storage_dir: Optional storage directory
        
    Returns:
        Clone manager instance
    """
    global _clone_manager
    
    if _clone_manager is None:
        _clone_manager = LovableCloneManager(storage_dir)
    
    return _clone_manager