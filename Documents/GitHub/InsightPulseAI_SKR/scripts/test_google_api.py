#!/usr/bin/env python3
"""
test_google_api.py - Test Google API after OAuth setup

This script tests the Google API configuration by listing files
from Google Drive after OAuth authorization is complete.
"""

import os
import sys
import json
from pathlib import Path

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
except ImportError:
    print("Error: Google API libraries not installed")
    print("Run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
    sys.exit(1)

# Define paths
HOME_DIR = Path.home()
SKR_DIR = HOME_DIR / "Documents/GitHub/InsightPulseAI_SKR"
TOKENS_DIR = SKR_DIR / ".tokens"
TOKENS_FILE = TOKENS_DIR / "google_tokens.json"

# Default scopes
SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
]

def test_drive_api():
    """Test Google Drive API using stored credentials"""
    if not TOKENS_FILE.exists():
        print(f"Error: No tokens file found at {TOKENS_FILE}")
        print("Please run authorize_google_oauth.py first to complete OAuth setup")
        print("If you've already authorized, make sure the tokens file exists")
        return False
    
    try:
        # Load credentials
        with open(TOKENS_FILE, 'r') as f:
            creds_data = json.load(f)
        
        credentials = Credentials.from_authorized_user_info(creds_data, SCOPES)
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            
            # Save refreshed credentials
            with open(TOKENS_FILE, 'w') as f:
                f.write(credentials.to_json())
        
        # Build Drive service
        service = build('drive', 'v3', credentials=credentials)
        
        # List files
        results = service.files().list(
            pageSize=10,
            fields="nextPageToken, files(id, name, mimeType)"
        ).execute()
        
        items = results.get('files', [])
        
        if not items:
            print('No files found in Google Drive.')
        else:
            print('Files in Google Drive:')
            for item in items:
                print(f"{item['name']} ({item['mimeType']})")
        
        return True
        
    except Exception as e:
        print(f"Error testing Drive API: {e}")
        return False

def test_gmail_api():
    """Test Gmail API using stored credentials"""
    if not TOKENS_FILE.exists():
        print(f"Error: No tokens file found at {TOKENS_FILE}")
        return False
    
    try:
        # Load credentials
        with open(TOKENS_FILE, 'r') as f:
            creds_data = json.load(f)
        
        credentials = Credentials.from_authorized_user_info(creds_data, SCOPES)
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            
            # Save refreshed credentials
            with open(TOKENS_FILE, 'w') as f:
                f.write(credentials.to_json())
        
        # Build Gmail service
        service = build('gmail', 'v1', credentials=credentials)
        
        # List labels
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        
        if not labels:
            print('No labels found in Gmail.')
        else:
            print('Gmail labels:')
            for label in labels:
                print(f"{label['name']} ({label['id']})")
        
        return True
        
    except Exception as e:
        print(f"Error testing Gmail API: {e}")
        return False

def test_calendar_api():
    """Test Calendar API using stored credentials"""
    if not TOKENS_FILE.exists():
        print(f"Error: No tokens file found at {TOKENS_FILE}")
        return False
    
    try:
        # Load credentials
        with open(TOKENS_FILE, 'r') as f:
            creds_data = json.load(f)
        
        credentials = Credentials.from_authorized_user_info(creds_data, SCOPES)
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            
            # Save refreshed credentials
            with open(TOKENS_FILE, 'w') as f:
                f.write(credentials.to_json())
        
        # Build Calendar service
        service = build('calendar', 'v3', credentials=credentials)
        
        # List calendars
        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        if not calendars:
            print('No calendars found.')
        else:
            print('Calendars:')
            for calendar in calendars:
                print(f"{calendar['summary']} ({calendar['id']})")
        
        return True
        
    except Exception as e:
        print(f"Error testing Calendar API: {e}")
        return False

def main():
    print("=== Google API Test ===")
    
    print("\nTesting Google Drive API...")
    drive_success = test_drive_api()
    
    print("\nTesting Gmail API...")
    gmail_success = test_gmail_api()
    
    print("\nTesting Calendar API...")
    calendar_success = test_calendar_api()
    
    print("\n=== Test Results ===")
    print(f"Drive API: {'Success' if drive_success else 'Failed'}")
    print(f"Gmail API: {'Success' if gmail_success else 'Failed'}")
    print(f"Calendar API: {'Success' if calendar_success else 'Failed'}")
    
    if drive_success or gmail_success or calendar_success:
        print("\nGoogle OAuth setup is working correctly!")
    else:
        print("\nGoogle OAuth setup is not working correctly.")
        print("Please run authorize_google_oauth.py to complete the setup.")

if __name__ == "__main__":
    main()