#!/usr/bin/env python3
"""
MCP Bridge for Claude Desktop → Clodrep → Pulser Integration

This script monitors the dispatch queue for incoming requests from Claude Desktop
and routes them to the appropriate CLI tool (clodrep or pulser). Results are
stored in the results directory for Claude Desktop to retrieve.
"""

import json
import time
import subprocess
import os
import sys
import yaml
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mcp/bridge/mcp_bridge.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("mcp_bridge")

# Paths
MCP_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QUEUE = MCP_DIR / "dispatch_queue.json"
RESULTS_DIR = MCP_DIR / "results"
ROUTES_CONFIG = MCP_DIR / "config" / "mcp_routes.yaml"

def load_routes():
    """Load the routing configuration from YAML file."""
    try:
        with open(ROUTES_CONFIG, 'r') as f:
            config = yaml.safe_load(f)
        return config.get('routes', {})
    except Exception as e:
        logger.error(f"Failed to load routes: {e}")
        return {}

def resolve_command(task_type, params, routes):
    """Resolve the command template with actual parameters."""
    if task_type not in routes:
        raise ValueError(f"Unknown task type: {task_type}")
    
    route = routes[task_type]
    command_template = route['command']
    
    # Replace template variables with actual values
    command = command_template
    for k, v in params.items():
        placeholder = "{{" + k + "}}"
        command = command.replace(placeholder, str(v))
    
    return command, route['agent']

def process_queue():
    """Main loop to process the dispatch queue."""
    logger.info("MCP Bridge started. Monitoring dispatch queue...")
    
    # Ensure results directory exists
    RESULTS_DIR.mkdir(exist_ok=True)
    
    # Load routes
    routes = load_routes()
    
    while True:
        try:
            if QUEUE.exists():
                # Load task
                with QUEUE.open('r') as f:
                    task = json.load(f)
                
                task_id = task.get("id")
                task_type = task.get("type")
                params = task.get("params", {})
                
                if not task_id:
                    logger.error("Task missing ID. Skipping.")
                    QUEUE.unlink()
                    continue
                
                # Create a status file to indicate processing has started
                status_path = RESULTS_DIR / f"{task_id}_status.json"
                with status_path.open('w') as f:
                    json.dump({
                        "status": "processing",
                        "start_time": datetime.now().isoformat(),
                        "task_id": task_id,
                        "task_type": task_type
                    }, f)
                
                try:
                    # Resolve the command
                    command, agent = resolve_command(task_type, params, routes)
                    result_path = RESULTS_DIR / f"{task_id}.json"
                    
                    logger.info(f"[MCP] Running: {command} (Agent: {agent})")
                    
                    # Execute command
                    start_time = time.time()
                    output = subprocess.getoutput(command)
                    execution_time = time.time() - start_time
                    
                    # Save results
                    with result_path.open('w') as f:
                        json.dump({
                            "output": output,
                            "agent": agent,
                            "execution_time": execution_time,
                            "completed_at": datetime.now().isoformat(),
                            "task_id": task_id,
                            "task_type": task_type
                        }, f)
                    
                    # Update status
                    with status_path.open('w') as f:
                        json.dump({
                            "status": "completed",
                            "start_time": datetime.now().isoformat(),
                            "completion_time": datetime.now().isoformat(),
                            "execution_time": execution_time,
                            "task_id": task_id,
                            "task_type": task_type
                        }, f)
                    
                    logger.info(f"[MCP] Task {task_id} completed in {execution_time:.2f}s")
                    
                except Exception as e:
                    logger.error(f"Error processing task {task_id}: {e}")
                    # Save error
                    error_path = RESULTS_DIR / f"{task_id}_error.json"
                    with error_path.open('w') as f:
                        json.dump({
                            "error": str(e),
                            "task_id": task_id,
                            "task_type": task_type,
                            "time": datetime.now().isoformat()
                        }, f)
                    
                    # Update status
                    with status_path.open('w') as f:
                        json.dump({
                            "status": "failed",
                            "error": str(e),
                            "time": datetime.now().isoformat(),
                            "task_id": task_id,
                            "task_type": task_type
                        }, f)
                
                # Remove the task from the queue
                QUEUE.unlink()
                logger.info(f"[MCP] Task {task_id} removed from queue")
            
            # Sleep to avoid high CPU usage
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Unexpected error in queue processing: {e}")
            time.sleep(5)  # Longer sleep on error

if __name__ == "__main__":
    try:
        process_queue()
    except KeyboardInterrupt:
        logger.info("MCP Bridge stopped by user")
    except Exception as e:
        logger.error(f"MCP Bridge crashed: {e}")
        sys.exit(1)