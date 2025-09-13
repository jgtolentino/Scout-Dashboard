#!/usr/bin/env python3
import os
import yaml
from pathlib import Path
import json
from datetime import datetime

# Define the agent registry entry for Claude
claude_agent_registry = {
    "agents": [
        {
            "id": "claude",
            "name": "Claude",
            "version": "3.5",
            "vendor": "Anthropic",
            "description": "High-performance AI assistant with capabilities matching Claude Code CLI",
            "capabilities": [
                "code_completion",
                "code_explanation",
                "text_generation",
                "problem_solving",
                "information_retrieval",
                "tool_use"
            ],
            "interfaces": [
                "cli",
                "api"
            ],
            "routing": {
                "priority": 1,
                "complexity_threshold": 0.7,
                "fallback_agent": "deepseekr1"
            },
            "resource_requirements": {
                "token_limit": 200000,
                "api_key_required": True,
                "requires_internet": True
            },
            "metadata": {
                "registration_date": datetime.now().isoformat(),
                "last_validated": datetime.now().isoformat(),
                "behavioral_parity_score": 0.95,
                "owner": "pulser_integration_team"
            }
        },
        {
            "id": "deepseekr1",
            "name": "DeepSeekr1",
            "version": "1.0",
            "vendor": "Local",
            "description": "Local AI model for standard tasks",
            "capabilities": [
                "text_generation",
                "basic_code_completion",
                "information_summarization"
            ],
            "interfaces": [
                "cli",
                "local_api"
            ],
            "routing": {
                "priority": 2,
                "fallback_agent": None
            },
            "resource_requirements": {
                "token_limit": 32000,
                "api_key_required": False,
                "requires_internet": False
            },
            "metadata": {
                "registration_date": datetime.now().isoformat(),
                "last_validated": datetime.now().isoformat(),
                "owner": "pulser_core_team"
            }
        }
    ],
    "agent_selection_rules": [
        {
            "rule_id": "complexity_routing",
            "description": "Route based on task complexity",
            "condition": "task.complexity > agent.routing.complexity_threshold",
            "route_to": "claude",
            "fallback": "deepseekr1"
        },
        {
            "rule_id": "code_tasks",
            "description": "Route code-related tasks to Claude",
            "condition": "task.type == 'code'",
            "route_to": "claude",
            "fallback": "deepseekr1"
        },
        {
            "rule_id": "local_only",
            "description": "Force local execution when internet unavailable",
            "condition": "environment.internet_available == false",
            "route_to": "deepseekr1",
            "fallback": None
        }
    ]
}

def main():
    # Create output directory if it doesn't exist
    config_dir = os.path.expanduser("~/.pulser/config")
    os.makedirs(config_dir, exist_ok=True)
    
    # Save to YAML file
    yaml_path = Path(f"{config_dir}/pulser_agent_registry.yaml")
    with open(yaml_path, "w") as file:
        yaml.dump(claude_agent_registry, file, sort_keys=False)
    
    # Save to JSON file for systems that prefer JSON
    json_path = Path(f"{config_dir}/pulser_agent_registry.json")
    with open(json_path, "w") as file:
        json.dump(claude_agent_registry, file, indent=2)
    
    print(f"Claude agent registry saved to:")
    print(f"  YAML: {yaml_path}")
    print(f"  JSON: {json_path}")

if __name__ == "__main__":
    main()