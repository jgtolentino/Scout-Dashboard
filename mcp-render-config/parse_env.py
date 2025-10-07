#!/usr/bin/env python3
import os
import json
import sys

def parse_env_file(filepath=".env"):
    """Parse .env file and convert to JSON format"""
    env_dict = {}
    
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found", file=sys.stderr)
        return {}
    
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue
            # Parse key=value pairs
            if '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip('"').strip("'")
                env_dict[key.strip()] = value
    
    return env_dict

if __name__ == "__main__":
    # Allow custom env file path
    env_file = sys.argv[1] if len(sys.argv) > 1 else ".env"
    
    # Parse and output JSON
    env_vars = parse_env_file(env_file)
    print(json.dumps(env_vars, indent=2))