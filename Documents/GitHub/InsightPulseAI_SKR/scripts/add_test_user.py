#!/usr/bin/env python3
"""
add_test_user.py - Add yourself as a test user to your Google OAuth app

This script creates instructions for adding yourself as a test user
to your unverified Google OAuth app.
"""

import os
import sys
import json
from pathlib import Path

# Define paths
HOME_DIR = Path.home()
SKR_DIR = HOME_DIR / "Documents/GitHub/InsightPulseAI_SKR"
CONFIG_DIR = SKR_DIR / "config"
OAUTH_DIR = CONFIG_DIR / "oauth"
CLIENT_SECRET_FILE = OAUTH_DIR / "google_oauth_client_secret.json"

def extract_project_info():
    """Extract project information from client secret"""
    if not CLIENT_SECRET_FILE.exists():
        print(f"Error: Client secret file not found at {CLIENT_SECRET_FILE}")
        sys.exit(1)
    
    try:
        with open(CLIENT_SECRET_FILE, 'r') as f:
            client_config = json.load(f)
        
        if "web" in client_config:
            project_id = client_config["web"].get("project_id", "unknown")
            client_id = client_config["web"].get("client_id", "unknown")
            return project_id, client_id
        else:
            print("Error: Invalid client secret format")
            return "unknown", "unknown"
    except Exception as e:
        print(f"Error reading client secret: {e}")
        return "unknown", "unknown"

def main():
    print("=== Adding Test User to Google OAuth App ===")
    
    # Extract project info
    project_id, client_id = extract_project_info()
    
    print(f"\nProject ID: {project_id}")
    print(f"Client ID: {client_id}")
    
    # Create instructions
    instructions = f"""
# Adding Yourself as a Test User to Your Google OAuth App

You're seeing the "App has not completed verification" message because your 
Google OAuth app is unverified. Since you're the developer, you can add yourself 
as a test user to access it during development.

## Instructions:

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials/consent?project={project_id}

2. On the OAuth consent screen page, scroll down to "Test users" section

3. Click "ADD USERS"

4. Add your email address (jgtolentino.rn@gmail.com) as a test user

5. Click "SAVE" to update the OAuth consent screen

6. Try the OAuth flow again - you'll now see a "Continue" button when the warning appears

## Project Details:
- Project ID: {project_id}
- Client ID: {client_id}

## The Warning Message Will Still Appear

You'll still see the "unverified app" warning screen, but now there will be 
an option to continue. Click "Continue" to proceed with the OAuth flow.

## Next Steps After Adding Yourself:

1. Try authorizing again:
   ```bash
   cd ~/Documents/GitHub/InsightPulseAI_SKR
   python3 scripts/authorize_google_oauth.py
   ```

2. When you see the warning, click "Continue" to proceed

3. Test the integration after authorization completes:
   ```bash
   python3 scripts/test_google_api.py
   ```

NOTE: This is expected for development. For production use with other users,
you would need to complete Google's verification process.
"""
    
    # Save instructions
    instructions_file = SKR_DIR / "ADD_TEST_USER_INSTRUCTIONS.md"
    with open(instructions_file, 'w') as f:
        f.write(instructions)
    
    print(f"\nInstructions saved to: {instructions_file}")
    print("\nFollow these instructions to add yourself as a test user")
    print("to your Google OAuth app.")
    
    # Print key steps
    print("\nKey steps:")
    print("1. Go to https://console.cloud.google.com/apis/credentials/consent")
    print("2. Add your email (jgtolentino.rn@gmail.com) as a test user")
    print("3. Try the OAuth flow again and click 'Continue' on the warning")

if __name__ == "__main__":
    main()