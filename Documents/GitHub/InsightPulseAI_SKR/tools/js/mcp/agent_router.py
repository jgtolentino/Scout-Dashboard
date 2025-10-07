#!/usr/bin/env python3
# Agent Router for Pulser MCP Architecture
# Analyzes input tasks and routes them to appropriate agents and environments

import os
import yaml
import json
import re
import logging
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("agent_router.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("agent_router")

class AgentRouter:
    """
    Analyzes task inputs and routes them to appropriate agents and environments
    based on configured routing rules.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the router with routing rules from a YAML config file.
        
        Args:
            config_path (str, optional): Path to the YAML config file. 
                                       Defaults to 'agent_routing.yaml' in the same directory.
        """
        # Default to agent_routing.yaml in the same directory as this script
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'agent_routing.yaml')
            
        self.config_path = config_path
        self.routes = []
        self.default_route = None
        self.intent_patterns = {}
        self.fallback_cascades = {}
        self.agent_capabilities = {}
        self.sync_config = {}
        self.security_config = {}
        self.last_load_time = None
        
        # Load configuration
        self.load_config()
        
    def load_config(self) -> None:
        """Load routing configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
                
            # Store configuration components
            self.routes = config.get('routes', [])
            self.default_route = config.get('default_route', {})
            self.intent_patterns = config.get('intent_recognition', {})
            self.fallback_cascades = config.get('fallback_cascades', {})
            self.agent_capabilities = config.get('agent_capabilities', {})
            self.sync_config = config.get('sync_config', {})
            self.security_config = config.get('security', {})
            
            # Record load time
            self.last_load_time = datetime.datetime.now()
            
            logger.info(f"Loaded routing configuration from {self.config_path}")
            logger.info(f"Found {len(self.routes)} route definitions")
            
        except Exception as e:
            logger.error(f"Failed to load routing configuration: {str(e)}")
            # Initialize with empty defaults if loading fails
            self.routes = []
            self.default_route = {
                "agent": "Claude", 
                "target": "terminal", 
                "bridge": "terminal_mcp_bridge",
                "priority": "medium"
            }
    
    def reload_config_if_changed(self) -> bool:
        """
        Reload configuration if the file has changed since last load.
        
        Returns:
            bool: True if configuration was reloaded, False otherwise.
        """
        try:
            file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(self.config_path))
            if self.last_load_time is None or file_mtime > self.last_load_time:
                self.load_config()
                return True
        except Exception as e:
            logger.error(f"Error checking config file modification time: {str(e)}")
        return False
    
    def route_task(self, task: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Route a task to the appropriate agent and environment.
        
        Args:
            task (str): The task description or request to route.
            context (Dict[str, Any], optional): Additional context information. Defaults to None.
        
        Returns:
            Dict[str, Any]: Routing information including agent, target environment, and bridge.
        """
        # Reload config if changed
        self.reload_config_if_changed()
        
        # Initialize context if None
        if context is None:
            context = {}
        
        # Extract filename from context if present
        filename = context.get('filename', '')
        filetype = self._get_filetype(filename)
        
        # Analyze task to determine intent
        intent = self._analyze_intent(task, context)
        logger.info(f"Analyzed intent: {intent} for task: {task[:50]}...")
        
        # Find matching route
        route = self._find_matching_route(task, intent, filetype, context)
        
        # If no route found, use default
        if route is None:
            logger.info(f"No specific route found, using default route")
            route = self.default_route.copy()
            # Add intent to route info
            route['matched_intent'] = 'default'
        else:
            # Add intent to route info
            route['matched_intent'] = intent
        
        # Add routing metadata
        route['original_task'] = task
        route['routing_time'] = datetime.datetime.now().isoformat()
        route['context_info'] = context
        
        # Save routing decision to history
        self._save_routing_history(route)
        
        return route
    
    def _analyze_intent(self, task: str, context: Dict[str, Any]) -> str:
        """
        Analyze the task to determine the primary intent.
        
        Args:
            task (str): The task to analyze.
            context (Dict[str, Any]): Additional context information.
        
        Returns:
            str: The determined intent.
        """
        # Initialize score for each intent type
        intent_scores = {}
        
        # Convert task to lowercase for matching
        task_lower = task.lower()
        
        # Score each intent type based on keywords and phrases
        for intent_type, patterns in self.intent_patterns.items():
            score = 0
            
            # Check for keywords
            for keyword in patterns.get('keywords', []):
                if keyword.lower() in task_lower:
                    score += 1
            
            # Check for phrases
            for phrase in patterns.get('phrases', []):
                if phrase.lower() in task_lower:
                    score += 2  # Phrases are stronger signals than keywords
            
            # Store the score
            intent_scores[intent_type] = score
        
        # Check context for additional intent signals
        for route in self.routes:
            context_keywords = route.get('context', [])
            for keyword in context_keywords:
                if keyword.lower() in task_lower:
                    intent = route.get('intent')
                    if intent:
                        intent_scores[intent] = intent_scores.get(intent, 0) + 1
        
        # Get the intent with the highest score
        if intent_scores:
            highest_intent = max(intent_scores.items(), key=lambda x: x[1])
            if highest_intent[1] > 0:  # Ensure there's at least some match
                return highest_intent[0]
        
        # No strong match found, try to map to route intent directly
        for route in self.routes:
            intent = route.get('intent', '')
            intent_lower = intent.lower()
            if intent_lower and intent_lower in task_lower:
                return intent
        
        # Return a generic intent if no specific match
        return "general_task"
    
    def _find_matching_route(
        self, 
        task: str, 
        intent: str, 
        filetype: str, 
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Find the best matching route based on intent, task content, and context.
        
        Args:
            task (str): The task to route.
            intent (str): The determined intent.
            filetype (str): The file extension if applicable.
            context (Dict[str, Any]): Additional context information.
        
        Returns:
            Optional[Dict[str, Any]]: The matching route or None if no match found.
        """
        task_lower = task.lower()
        
        # Score each route for match quality
        route_scores = []
        
        for route in self.routes:
            score = 0
            route_intent = route.get('intent', '').lower()
            
            # Check intent match
            if intent.lower() == route_intent or intent in route_intent or route_intent in intent:
                score += 5
            
            # Check context keywords
            for keyword in route.get('context', []):
                if keyword.lower() in task_lower:
                    score += 2
            
            # Check for examples match
            for example in route.get('examples', []):
                example_lower = example.lower()
                # Use Levenshtein distance or other text similarity measure
                # For simplicity, checking for substring containment
                if example_lower in task_lower or task_lower in example_lower:
                    score += 3
            
            # Check filetype match
            if filetype and filetype in route.get('filetypes', []):
                score += 4
            
            # Add route and score to list
            route_scores.append((route, score))
        
        # Sort routes by score (descending)
        route_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return highest scoring route if score is above threshold
        if route_scores and route_scores[0][1] > 3:
            return route_scores[0][0].copy()
        
        return None
    
    def _get_filetype(self, filename: str) -> str:
        """
        Extract the file extension from a filename.
        
        Args:
            filename (str): The filename to process.
        
        Returns:
            str: The file extension (with dot) or empty string if no extension.
        """
        if not filename:
            return ""
        
        _, ext = os.path.splitext(filename)
        return ext.lower()
    
    def _save_routing_history(self, route: Dict[str, Any]) -> None:
        """
        Save routing decision to history for analysis and improvement.
        
        Args:
            route (Dict[str, Any]): The routing decision.
        """
        try:
            history_file = "routing_history.jsonl"
            with open(history_file, 'a') as f:
                f.write(json.dumps(route) + '\n')
        except Exception as e:
            logger.error(f"Failed to save routing history: {str(e)}")
    
    def get_fallback_chain(self, primary_agent: str) -> List[str]:
        """
        Get the fallback chain for a given primary agent.
        
        Args:
            primary_agent (str): The primary agent to get fallbacks for.
        
        Returns:
            List[str]: The list of fallback agents in order.
        """
        # Find the fallback cascade that contains this agent
        for cascade_name, cascade in self.fallback_cascades.items():
            sequence = cascade.get('sequence', [])
            if primary_agent in sequence:
                # Return the agents that come after the primary agent
                index = sequence.index(primary_agent)
                return sequence[index + 1:]
        
        # If no cascade found, use the default fallback from the agent's route
        for route in self.routes:
            if route.get('agent') == primary_agent:
                fallback = route.get('fallback')
                if fallback:
                    return [fallback]
        
        # Default fallback is Claudia
        return ["Claudia"]
    
    def get_agent_capabilities(self, agent: str) -> Dict[str, Any]:
        """
        Get the capabilities of a specific agent.
        
        Args:
            agent (str): The agent name.
        
        Returns:
            Dict[str, Any]: The agent's capabilities or empty dict if not found.
        """
        return self.agent_capabilities.get(agent, {})
    
    def get_environment_capabilities(self, env_type: str) -> Dict[str, Any]:
        """
        Get the capabilities and restrictions of a specific environment.
        
        Args:
            env_type (str): The environment type.
        
        Returns:
            Dict[str, Any]: The environment's capabilities and restrictions.
        """
        if not self.security_config:
            return {}
        
        sandbox = self.security_config.get('sandbox_restrictions', {})
        return sandbox.get(env_type, {})
    
    def is_operation_allowed(self, agent: str, operation: str, target: str) -> bool:
        """
        Check if a specific operation is allowed for an agent on a target.
        
        Args:
            agent (str): The agent name.
            operation (str): The operation type.
            target (str): The target environment.
        
        Returns:
            bool: True if allowed, False otherwise.
        """
        # Admin agents can do anything
        if agent in self.security_config.get('admin_agents', []):
            return True
        
        # Check environment-specific restrictions
        env_restrictions = self.get_environment_capabilities(target)
        
        # Database operations check
        if target == 'database' and operation in env_restrictions.get('operations', []):
            return True
        elif target == 'database' and operation not in env_restrictions.get('operations', []):
            return False
        
        # Terminal dangerous command check
        if target == 'terminal' and operation == 'execute_command':
            dangerous = env_restrictions.get('dangerous_commands')
            if dangerous == 'prompt_user':
                # Would require user confirmation in the actual implementation
                # Here we just return True and assume prompt will happen later
                return True
        
        # File system operations
        if operation.startswith('file_'):
            fs_access = env_restrictions.get('filesystem')
            if fs_access == 'disabled':
                return False
            if fs_access == 'project_only' or fs_access == 'workspace_only':
                # Would check if path is within project/workspace
                # Here we just return True and assume check will happen later
                return True
        
        # Default to allowed
        return True
    
    def sync_with_claudia(self) -> bool:
        """
        Sync routing information with Claudia's memory system.
        
        Returns:
            bool: True if sync successful, False otherwise.
        """
        if not self.sync_config.get('auto_sync', False):
            return False
        
        try:
            memory_location = self.sync_config.get('memory_location')
            if not memory_location:
                return False
            
            # Read current memory
            with open(memory_location, 'r') as f:
                memory = json.load(f)
            
            # Update routing information
            memory['mcp_routing'] = {
                'last_sync': datetime.datetime.now().isoformat(),
                'available_routes': len(self.routes),
                'default_route': self.default_route,
                'agents': list(self.agent_capabilities.keys())
            }
            
            # Write updated memory
            with open(memory_location, 'w') as f:
                json.dump(memory, f, indent=2)
            
            logger.info(f"Synchronized routing information with Claudia's memory")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync with Claudia's memory: {str(e)}")
            return False

def main():
    """CLI interface for testing agent routing."""
    import argparse
    parser = argparse.ArgumentParser(description='Test Agent Router')
    parser.add_argument('--task', help='Task to route', required=True)
    parser.add_argument('--config', help='Path to routing config YAML', default=None)
    parser.add_argument('--filename', help='Filename for context', default='')
    parser.add_argument('--verbose', help='Enable verbose output', action='store_true')
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Initialize router
    router = AgentRouter(args.config)
    
    # Create context
    context = {}
    if args.filename:
        context['filename'] = args.filename
    
    # Route task
    route = router.route_task(args.task, context)
    
    # Print result
    print(json.dumps(route, indent=2))

if __name__ == "__main__":
    main()