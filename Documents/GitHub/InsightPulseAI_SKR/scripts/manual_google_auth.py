#!/usr/bin/env python3
"""
manual_google_auth.py - Manual Google OAuth without local server

This script helps with Google OAuth authorization without needing a local 
server by providing instructions for manual authorization.
"""

import os
import sys
import json
import webbrowser
from pathlib import Path

try:
    from google.oauth2.credentials import Credentials
except ImportError:
    print("Error: Google API libraries not installed")
    print("Run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

# Define paths
HOME_DIR = Path.home()
SKR_DIR = HOME_DIR / "Documents/GitHub/InsightPulseAI_SKR"
CONFIG_DIR = SKR_DIR / "config"
OAUTH_DIR = CONFIG_DIR / "oauth"
CLIENT_SECRET_FILE = OAUTH_DIR / "google_oauth_client_secret.json"
TOKENS_DIR = SKR_DIR / ".tokens"
ENV_FILE = SKR_DIR / ".env.google"
TOKENS_FILE = TOKENS_DIR / "google_tokens.json"

# Default scopes
SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
]

def save_token_manually():
    """Save token from manually entered JSON"""
    # Create tokens directory if it doesn't exist
    TOKENS_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(str(TOKENS_DIR), 0o700)  # Secure permissions
    
    print("\nPlease enter the OAuth token JSON (all in one line):")
    token_json = input()
    
    try:
        token_data = json.loads(token_json)
        
        # Create a minimal token structure if needed
        if "access_token" in token_data and "refresh_token" in token_data:
            # Use the token data directly
            pass
        else:
            print("Invalid token format. Must contain access_token and refresh_token.")
            return False
        
        # Save the token
        with open(TOKENS_FILE, 'w') as f:
            json.dump(token_data, f, indent=2)
        
        print(f"\nToken saved to {TOKENS_FILE}")
        return True
        
    except json.JSONDecodeError:
        print("Error: Invalid JSON format")
        return False
    except Exception as e:
        print(f"Error saving token: {e}")
        return False

def create_dummy_token():
    """Create a dummy token file with placeholder values"""
    TOKENS_DIR.mkdir(parents=True, exist_ok=True)
    os.chmod(str(TOKENS_DIR), 0o700)  # Secure permissions
    
    # Sample token data structure (for documentation)
    token_data = {
        "token": "dummy_oauth_token",
        "refresh_token": "dummy_refresh_token", 
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "dummy_client_id.apps.googleusercontent.com",
        "client_secret": "dummy_client_secret",
        "scopes": SCOPES,
        "expiry": "2025-05-10T00:00:00Z"
    }
    
    # Create client_secret copy
    try:
        if CLIENT_SECRET_FILE.exists():
            with open(CLIENT_SECRET_FILE, 'r') as src:
                client_config = json.load(src)
                
            creds_file = TOKENS_DIR / "client_secret.json"
            with open(creds_file, 'w') as dest:
                json.dump(client_config, dest, indent=2)
                
            print(f"Copied client secret to {creds_file}")
            
            # Extract client ID and secret for the dummy token
            if "web" in client_config:
                token_data["client_id"] = client_config["web"]["client_id"]
                token_data["client_secret"] = client_config["web"]["client_secret"]
    except Exception as e:
        print(f"Warning: Could not copy client secret: {e}")
    
    # Save the dummy token
    with open(TOKENS_FILE, 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print(f"\nDummy token saved to {TOKENS_FILE}")
    print("You will need to replace this with a real token for actual API access.")

def main():
    print("=== Manual Google OAuth Setup ===")
    
    # Check if client secret file exists
    if not CLIENT_SECRET_FILE.exists():
        print(f"Error: Client secret file not found at {CLIENT_SECRET_FILE}")
        sys.exit(1)
    
    print("\nThis script will help you manually set up OAuth for Google APIs.")
    print("You would normally need to:")
    print("1. Go to Google Cloud Console")
    print("2. Create OAuth client ID credentials")
    print("3. Set up OAuth consent screen")
    print("4. Add authorized redirect URIs")
    print("5. Complete the OAuth flow")
    
    # Ask if user has an OAuth token
    print("\nDo you already have an OAuth token JSON? (y/n)")
    has_token = input().lower().startswith('y')
    
    if has_token:
        success = save_token_manually()
        if success:
            print("\nToken saved successfully!")
            print("You can now use the Google API with your applications.")
        else:
            print("\nFailed to save token.")
            print("You may want to create a dummy token file instead.")
            
            print("\nCreate dummy token file? (y/n)")
            create_dummy = input().lower().startswith('y')
            
            if create_dummy:
                create_dummy_token()
    else:
        print("\nYou don't have an OAuth token yet.")
        print("Creating a dummy token file with placeholders.")
        
        create_dummy_token()
        
        print("\nNext steps:")
        print("1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials")
        print("2. Make sure you have OAuth client ID credentials set up")
        print("3. Obtain a real OAuth token through the regular OAuth flow")
        print("4. Replace the dummy token file with the real token")

if __name__ == "__main__":
    main()