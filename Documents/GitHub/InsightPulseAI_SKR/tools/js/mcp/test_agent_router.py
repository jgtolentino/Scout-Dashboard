#!/usr/bin/env python3
# Test the agent router with sample tasks

import json
from agent_router import AgentRouter

def main():
    # Initialize router
    router = AgentRouter()
    
    # Sample tasks to test routing
    tasks = [
        "Create a 3D model of a conference room with a table and chairs",
        "Fix the bug in the device health monitoring code where it's not capturing CustomerID",
        "Find all devices with firmware versions below 2.0 and missing customer IDs",
        "Generate unit tests for the device health dashboard",
        "Help me design a workflow for automating the deployment process"
    ]
    
    # Test each task
    for task in tasks:
        print(f"\n---\nTask: {task}")
        result = router.route_task(task)
        
        print(f"Routed to: {result.get('agent')} in {result.get('target')} environment")
        print(f"Using bridge: {result.get('bridge')}")
        print(f"Intent matched: {result.get('matched_intent')}")
        print(f"Priority: {result.get('priority', 'default')}")
        
        # Get fallback chain for this agent
        fallbacks = router.get_fallback_chain(result.get('agent', ''))
        if fallbacks:
            print(f"Fallback chain: {' → '.join(fallbacks)}")
        
        # Check agent capabilities
        capabilities = router.get_agent_capabilities(result.get('agent', ''))
        if capabilities:
            print(f"Agent specializations: {', '.join(capabilities.get('specializations', []))}")

if __name__ == "__main__":
    main()