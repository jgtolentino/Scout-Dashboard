"""
Prompt Enhancer Agent (Echo)

This module provides prompt enhancement capabilities for the PulseForge system,
improving input prompts for better understanding and generation.
"""

import os
import json
import logging
import re
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

from core.system_prompts import PROMPT_ENHANCEMENT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PromptEnhancer:
    """
    Prompt enhancement agent for improving user inputs.
    
    This agent analyzes natural language prompts and enhances them
    to be more specific, actionable, and comprehensive.
    """
    
    def __init__(
        self,
        system_prompt: str = PROMPT_ENHANCEMENT
    ):
        """
        Initialize the prompt enhancer.
        
        Args:
            system_prompt: System prompt to guide the enhancer
        """
        self.system_prompt = system_prompt
        
    def enhance_prompt(
        self,
        prompt: str,
        target_stack: Optional[str] = None,
        mode: str = "standard"
    ) -> str:
        """
        Enhance a natural language prompt.
        
        Args:
            prompt: Original prompt
            target_stack: Target technology stack
            mode: Enhancement mode (minimal, standard, thorough)
            
        Returns:
            Enhanced prompt
        """
        logger.info(f"Enhancing prompt in {mode} mode")
        
        # In a real implementation, this would use LLM to enhance the prompt
        # For this demo, we apply some simple enhancements
        
        # Add persistence principle
        enhanced_prompt = f"{prompt}\n\n"
        
        # Extract entities if not specified
        if not re.search(r'entit(y|ies)', prompt.lower()):
            # Simple entity extraction heuristic
            potential_entities = self._extract_potential_entities(prompt)
            if potential_entities:
                enhanced_prompt += "Entities to include:\n"
                for entity in potential_entities:
                    enhanced_prompt += f"- {entity} with appropriate fields\n"
        
        # Add features if not specified
        if not re.search(r'feature', prompt.lower()):
            enhanced_prompt += "\nFeatures to include:\n"
            enhanced_prompt += "- User authentication and authorization\n"
            enhanced_prompt += "- Input validation and error handling\n"
            enhanced_prompt += "- Responsive UI design\n"
        
        # Add stack-specific guidance
        if target_stack:
            enhanced_prompt += f"\nImplement using {target_stack} stack with best practices.\n"
        
        # Add planning principle
        enhanced_prompt += "\nApply a systematic development approach:\n"
        enhanced_prompt += "1. First, design database schema with proper relationships\n"
        enhanced_prompt += "2. Then, implement backend API with proper validation\n"
        enhanced_prompt += "3. Finally, create frontend components with a clean UI\n"
        
        # Add tools principle
        enhanced_prompt += "\nEnsure code is production-ready with proper error handling, logging, and security measures."
        
        return enhanced_prompt
    
    def _extract_potential_entities(self, prompt: str) -> List[str]:
        """
        Extract potential entities from prompt.
        
        Args:
            prompt: Input prompt
            
        Returns:
            List of potential entities
        """
        # Simple rules-based extraction (in real implementation, use NLP)
        entities = []
        
        # Look for nouns that likely represent entities
        common_entities = {
            "user": ["user", "users", "account", "accounts"],
            "product": ["product", "products", "item", "items"],
            "order": ["order", "orders", "purchase", "purchases"],
            "customer": ["customer", "customers", "client", "clients"],
            "category": ["category", "categories"],
            "comment": ["comment", "comments", "review", "reviews"],
            "post": ["post", "posts", "article", "articles", "blog"],
            "task": ["task", "tasks", "todo", "todos"],
            "project": ["project", "projects"],
            "event": ["event", "events"],
            "message": ["message", "messages", "chat"]
        }
        
        # Check for entity mentions
        for entity, synonyms in common_entities.items():
            for synonym in synonyms:
                if re.search(r'\b' + synonym + r'\b', prompt.lower()):
                    entities.append(entity.capitalize())
                    break
        
        return list(set(entities))  # Remove duplicates