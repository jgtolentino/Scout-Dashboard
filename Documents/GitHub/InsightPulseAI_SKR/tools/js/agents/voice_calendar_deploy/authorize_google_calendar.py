#!/usr/bin/env python3
"""
Google Calendar Authorization Script for Voice Calendar Agent
This script walks you through the OAuth2 flow to authorize the Voice Calendar Agent
to access your Google Calendar.
"""

import os
import sys
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the scopes
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

def get_credentials_path():
    """Get the path to the credentials file."""
    # First, try the .credentials directory in the home folder
    home_creds_path = os.path.expanduser('~/.credentials/google_calendar/credentials.json')
    if os.path.exists(home_creds_path):
        return home_creds_path
    
    # Next, try the project directory
    project_creds_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))), '.credentials/google_calendar/credentials.json')
    if os.path.exists(project_creds_path):
        return project_creds_path
    
    # Check the current directory and its parent
    current_dir_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json')
    if os.path.exists(current_dir_path):
        return current_dir_path
    
    return None

def get_token_path():
    """Get the path where the token should be saved."""
    # Create the token directory if it doesn't exist
    token_dir = os.path.expanduser('~/.credentials/google_calendar')
    os.makedirs(token_dir, exist_ok=True)
    return os.path.join(token_dir, 'token.pickle')

def main():
    """Run the authorization flow."""
    print("=" * 60)
    print("Google Calendar Authorization for Voice Calendar Agent")
    print("=" * 60)
    print()
    
    # Get the credentials path
    credentials_path = get_credentials_path()
    if not credentials_path:
        print("❌ Error: Could not find credentials.json file.")
        print("Please download your OAuth credentials from Google Cloud Console")
        print("and save it to ~/.credentials/google_calendar/credentials.json")
        return 1
    
    print(f"✅ Found credentials file at: {credentials_path}")
    
    # Get the token path
    token_path = get_token_path()
    print(f"Token will be saved to: {token_path}")
    
    creds = None
    # Check if token already exists
    if os.path.exists(token_path):
        print("Found existing token, checking if it's valid...")
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    
    # If there are no valid credentials, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Token expired, refreshing...")
            creds.refresh(Request())
        else:
            print("\nStarting authorization flow. A browser window will open.")
            print("Please log in and grant access to your Google Calendar.\n")
            
            # Create the flow
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            # Use localhost instead of hostname to avoid DNS resolution issues
            # Try a different port to avoid "Address already in use" error
            creds = flow.run_local_server(port=8080, bind_addr='127.0.0.1')
        
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)
        
        print("\n✅ Authorization successful!")
    else:
        print("✅ Token is valid and ready to use.")
    
    print("\n" + "=" * 60)
    print("Setup Complete! The Voice Calendar Agent now has access to your Google Calendar.")
    print("=" * 60)
    print("\nYou can now use commands like:")
    print("  :voice_calendar \"Schedule a meeting with Jake tomorrow at 10 AM\"")
    
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nAuthorization cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error during authorization: {e}")
        sys.exit(1)