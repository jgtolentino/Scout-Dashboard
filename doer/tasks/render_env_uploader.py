#!/usr/bin/env python3
"""
Render Environment Variable Uploader
Uploads environment variables to Render service via API
"""

import requests
import json
import os
import sys
from typing import Dict, Optional

# Render API endpoint
RENDER_API_BASE = "https://api.render.com/v1"

def get_credentials():
    """Get Render credentials from environment"""
    service_id = os.environ.get("RENDER_SERVICE_ID")
    api_key = os.environ.get("RENDER_API_KEY")
    
    if not service_id or not api_key:
        print("Error: Missing RENDER_SERVICE_ID or RENDER_API_KEY environment variables")
        print("Get your API key from: https://dashboard.render.com/account/api-keys")
        sys.exit(1)
    
    return service_id, api_key

def upload_env_vars(env_dict: Dict[str, str], service_id: str, api_key: str) -> bool:
    """Upload environment variables to Render service"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    success = True
    
    for key, value in env_dict.items():
        # Skip if key already exists (use PUT to update)
        url = f"{RENDER_API_BASE}/services/{service_id}/env-vars"
        
        resp = requests.post(
            url,
            headers=headers,
            json={"key": key, "value": value}
        )
        
        if resp.status_code == 201:
            print(f"✅ Added {key}")
        elif resp.status_code == 409:
            # Variable exists, try to update it
            print(f"⚠️  {key} already exists, updating...")
            # Get existing env var ID
            get_resp = requests.get(
                f"{RENDER_API_BASE}/services/{service_id}/env-vars",
                headers=headers
            )
            if get_resp.status_code == 200:
                existing_vars = get_resp.json()
                var_id = next((v["id"] for v in existing_vars if v["key"] == key), None)
                if var_id:
                    update_resp = requests.put(
                        f"{RENDER_API_BASE}/services/{service_id}/env-vars/{var_id}",
                        headers=headers,
                        json={"value": value}
                    )
                    if update_resp.status_code == 200:
                        print(f"✅ Updated {key}")
                    else:
                        print(f"❌ Failed to update {key}: {update_resp.status_code}")
                        success = False
        else:
            print(f"❌ Failed to add {key}: {resp.status_code} - {resp.text}")
            success = False
    
    return success

def load_env_json(filepath: str = "render_env.json") -> Optional[Dict[str, str]]:
    """Load environment variables from JSON file"""
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found")
        print("Run parse_env.py first to generate render_env.json")
        return None
    
    with open(filepath) as f:
        return json.load(f)

def run():
    """Main function for doer task"""
    # Get credentials
    service_id, api_key = get_credentials()
    
    # Load environment variables
    env_file = os.environ.get("RENDER_ENV_FILE", "render_env.json")
    env_dict = load_env_json(env_file)
    
    if not env_dict:
        sys.exit(1)
    
    print(f"Uploading {len(env_dict)} environment variables to service {service_id}...")
    
    # Upload variables
    success = upload_env_vars(env_dict, service_id, api_key)
    
    if success:
        print("\n✅ All environment variables uploaded successfully!")
        print("Trigger a manual deploy in Render dashboard to apply changes.")
    else:
        print("\n⚠️  Some environment variables failed to upload")
        sys.exit(1)

if __name__ == "__main__":
    run()