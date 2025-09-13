"""
Claudia MCP Bridge for PulseDev

This module provides a bridge between Claudia's orchestration system and
PulseDev's MCP prompt collection. It enables Claudia to control prompt selection,
track usage metrics, and integrate with the broader Pulser ecosystem.
"""

import os
import json
import yaml
import asyncio
import logging
import datetime
import pathlib
from typing import Dict, List, Optional, Any

# Import MCP components
from .mcp_direct_bridge import mcp_direct_bridge
from .ai_assistant import ai_assistant_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/claudia_mcp.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("claudia_mcp_bridge")

# Paths and configuration
BASE_DIR = pathlib.Path(__file__).parents[2]
KALAW_INDEX_PATH = BASE_DIR / "kalaw_mcp_prompts.yaml"
METRICS_DIR = pathlib.Path(os.environ.get("SKR_DIR", "/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR")) / "SKR" / "metrics" / "prompt_usage"

# Ensure metrics directory exists
METRICS_DIR.mkdir(parents=True, exist_ok=True)

class ClaudiaMCPBridge:
    """Bridge between Claudia orchestration and MCP system"""
    
    def __init__(self):
        """Initialize the Claudia MCP Bridge"""
        self.last_sync = None
        self.active_session_id = None
        self.metrics = {
            "total_requests": 0,
            "requests_by_prompt": {},
            "errors_by_prompt": {},
            "usage_by_context": {},
            "popular_task_types": {}
        }
        self.kalaw_index = self._load_kalaw_index()
        
        # Initialize logging session
        self.session_log_path = METRICS_DIR / f"mcp_prompt_session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        
    def _load_kalaw_index(self) -> Dict:
        """Load the Kalaw index for MCP prompts"""
        try:
            with open(KALAW_INDEX_PATH, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load Kalaw index: {e}")
            return {
                "metadata": {"name": "PulseDev MCP Prompts", "version": "unknown"},
                "components": [],
                "knowledge_index": {"concepts": []},
                "integrations": []
            }
    
    async def initialize(self):
        """Initialize the bridge and connect to MCP"""
        try:
            # Connect to MCP
            await mcp_direct_bridge.connect_to_mcp()
            
            # Load the default unified prompt
            await mcp_direct_bridge.load_prompt("combined/pulsedev_unified")
            
            # Record initialization
            self.last_sync = datetime.datetime.now()
            logger.info(f"Claudia MCP Bridge initialized at {self.last_sync}")
            
            # Start metrics background task
            asyncio.create_task(self._periodic_metrics_sync())
            
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Claudia MCP Bridge: {e}")
            return False
    
    async def get_prompt_recommendation(self, task_description: str, context: Dict = None) -> str:
        """
        Get prompt recommendation from task description
        
        Args:
            task_description: Description of the task
            context: Optional context information
            
        Returns:
            Recommended prompt name
        """
        # Call the AI Assistant's recommendation endpoint
        response = await ai_assistant_service.get_specialized_assistance(
            task_type="general",  # Use general mode for recommendation
            query=f"Recommend the best prompt for this task: {task_description}",
            context=context
        )
        
        # Extract prompt hint or use default
        prompt_hint = mcp_direct_bridge._extract_prompt_hint(task_description)
        
        if prompt_hint:
            # Try to find by alias
            return mcp_direct_bridge.find_prompt_by_alias(prompt_hint)
        else:
            # Fallback to unified prompt
            return "combined/pulsedev_unified"
    
    async def switch_prompt_for_task(self, task_description: str, session_id: str = None, context: Dict = None) -> Dict:
        """
        Switch to the appropriate prompt for a given task description
        
        Args:
            task_description: Description of the task
            session_id: Optional session identifier for tracking
            context: Optional context information
            
        Returns:
            Result with prompt information
        """
        # Update session tracking
        self.active_session_id = session_id or f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Get prompt recommendation
        recommended_prompt = await self.get_prompt_recommendation(task_description, context)
        
        # Switch to recommended prompt
        success = await mcp_direct_bridge.load_prompt(recommended_prompt)
        
        if not success:
            logger.warning(f"Failed to load recommended prompt: {recommended_prompt}, falling back to unified")
            recommended_prompt = "combined/pulsedev_unified"
            await mcp_direct_bridge.load_prompt(recommended_prompt)
        
        # Log the prompt switch
        self._log_prompt_usage({
            "timestamp": datetime.datetime.now().isoformat(),
            "session_id": self.active_session_id,
            "task_description": task_description,
            "prompt_used": recommended_prompt,
            "context_type": context.get("type") if context else "unknown",
            "success": success
        })
        
        # Return result
        return {
            "prompt": recommended_prompt,
            "success": success,
            "session_id": self.active_session_id,
            "timestamp": datetime.datetime.now().isoformat()
        }
    
    async def execute_task_with_prompt(self, task_description: str, prompt_name: str = None, session_id: str = None, context: Dict = None) -> Dict:
        """
        Execute a task with a specific prompt or auto-select based on task
        
        Args:
            task_description: Description of the task
            prompt_name: Optional specific prompt to use
            session_id: Optional session identifier for tracking
            context: Optional context information
            
        Returns:
            Task result
        """
        # Update session tracking
        self.active_session_id = session_id or f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Use specified prompt or get recommendation
        if prompt_name:
            success = await mcp_direct_bridge.load_prompt(prompt_name)
            if not success:
                logger.warning(f"Failed to load specified prompt: {prompt_name}, getting recommendation instead")
                prompt_name = await self.get_prompt_recommendation(task_description, context)
                await mcp_direct_bridge.load_prompt(prompt_name)
        else:
            # Auto-select prompt based on task
            prompt_name = await self.get_prompt_recommendation(task_description, context)
            await mcp_direct_bridge.load_prompt(prompt_name)
        
        # Execute task with selected prompt
        start_time = datetime.datetime.now()
        try:
            # Get AI assistance with the selected prompt
            result = await ai_assistant_service.get_code_assistance(
                query=task_description,
                context=context,
                prompt_name=prompt_name
            )
            
            success = result.get("type") == "success"
            execution_time = (datetime.datetime.now() - start_time).total_seconds()
            
            # Log the task execution
            self._log_prompt_usage({
                "timestamp": datetime.datetime.now().isoformat(),
                "session_id": self.active_session_id,
                "task_description": task_description,
                "prompt_used": prompt_name,
                "context_type": context.get("type") if context else "unknown",
                "execution_time": execution_time,
                "success": success
            })
            
            # Update metrics
            self.metrics["total_requests"] += 1
            if prompt_name not in self.metrics["requests_by_prompt"]:
                self.metrics["requests_by_prompt"][prompt_name] = 0
            self.metrics["requests_by_prompt"][prompt_name] += 1
            
            if not success and prompt_name not in self.metrics["errors_by_prompt"]:
                self.metrics["errors_by_prompt"][prompt_name] = 0
            if not success:
                self.metrics["errors_by_prompt"][prompt_name] += 1
            
            # Add Claudia metadata to result
            result["claudia_metadata"] = {
                "session_id": self.active_session_id,
                "prompt_used": prompt_name,
                "execution_time": execution_time,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            return result
        except Exception as e:
            logger.error(f"Error executing task with prompt {prompt_name}: {e}")
            
            # Log the error
            self._log_prompt_usage({
                "timestamp": datetime.datetime.now().isoformat(),
                "session_id": self.active_session_id,
                "task_description": task_description,
                "prompt_used": prompt_name,
                "context_type": context.get("type") if context else "unknown",
                "error": str(e),
                "success": False
            })
            
            # Update error metrics
            if prompt_name not in self.metrics["errors_by_prompt"]:
                self.metrics["errors_by_prompt"][prompt_name] = 0
            self.metrics["errors_by_prompt"][prompt_name] += 1
            
            return {
                "type": "error",
                "response": f"Error executing task: {str(e)}",
                "claudia_metadata": {
                    "session_id": self.active_session_id,
                    "prompt_used": prompt_name,
                    "timestamp": datetime.datetime.now().isoformat()
                }
            }
    
    def _log_prompt_usage(self, usage_data: Dict):
        """Log prompt usage to session log file"""
        try:
            with open(self.session_log_path, 'a') as f:
                f.write(json.dumps(usage_data) + '\n')
        except Exception as e:
            logger.error(f"Failed to log prompt usage: {e}")
    
    async def _periodic_metrics_sync(self):
        """Periodically sync metrics to storage"""
        while True:
            await asyncio.sleep(300)  # Every 5 minutes
            try:
                # Generate metrics filename with timestamp
                metrics_path = METRICS_DIR / f"mcp_metrics_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                
                # Save metrics snapshot
                with open(metrics_path, 'w') as f:
                    json.dump({
                        "timestamp": datetime.datetime.now().isoformat(),
                        "metrics": self.metrics,
                        "session_id": self.active_session_id
                    }, f, indent=2)
                
                logger.info(f"Metrics synced to {metrics_path}")
            except Exception as e:
                logger.error(f"Failed to sync metrics: {e}")
    
    async def get_metrics(self) -> Dict:
        """Get current metrics"""
        return {
            "timestamp": datetime.datetime.now().isoformat(),
            "metrics": self.metrics,
            "session_id": self.active_session_id,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None
        }
    
    def get_kalaw_concepts(self) -> List[Dict]:
        """Get concepts from Kalaw index"""
        try:
            return self.kalaw_index.get("knowledge_index", {}).get("concepts", [])
        except Exception as e:
            logger.error(f"Failed to get Kalaw concepts: {e}")
            return []
    
    def get_kalaw_components(self) -> List[Dict]:
        """Get components from Kalaw index"""
        try:
            return self.kalaw_index.get("components", [])
        except Exception as e:
            logger.error(f"Failed to get Kalaw components: {e}")
            return []

# Create singleton instance
claudia_mcp_bridge = ClaudiaMCPBridge()

# Async function to start the bridge
async def start_claudia_mcp_bridge():
    """Start the Claudia MCP Bridge"""
    await claudia_mcp_bridge.initialize()
    
    # Keep the bridge running
    while True:
        await asyncio.sleep(3600)  # Check every hour

# Entry point for running as a script
if __name__ == "__main__":
    asyncio.run(start_claudia_mcp_bridge())