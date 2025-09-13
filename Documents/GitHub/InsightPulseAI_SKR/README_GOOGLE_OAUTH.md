# Google OAuth Setup for InsightPulseAI

This guide explains how to set up and use Google OAuth authentication with InsightPulseAI.

## Setup Overview

The Google OAuth integration allows InsightPulseAI to access:

- Google Drive files
- Google Sheets data
- Google Calendar events
- Gmail messages

All access is authenticated through OAuth, ensuring secure and permission-based access.

## Setup Steps

### 1. Configure Google OAuth

The configuration script has already been run, which:
- Created the necessary directory structure
- Set up environment variables
- Created an authentication script

### 2. Complete OAuth Authorization

Run the authorization script to complete the OAuth flow:

```bash
cd ~/Documents/GitHub/InsightPulseAI_SKR
python3 scripts/authorize_google_oauth.py
```

This will:
1. Open your browser to Google's authentication page
2. Ask you to sign in (if not already signed in)
3. Show a consent screen listing permissions being requested
4. Redirect back to a local server to save your credentials

### 3. Test the Integration

After completing authorization, test the integration with:

```bash
python3 scripts/test_google_api.py
```

This will test connections to:
- Google Drive
- Gmail
- Google Calendar

## Directory Structure

```
InsightPulseAI_SKR/
├── config/
│   └── oauth/
│       └── google_oauth_client_secret.json  # Client secret JSON file
├── .tokens/
│   ├── client_secret.json                  # Copy of client secret for libraries
│   └── google_tokens.json                  # OAuth tokens (created after auth)
├── .env.google                             # Environment variables
└── scripts/
    ├── configure_google_oauth.py           # Configuration script
    ├── authorize_google_oauth.py           # Authorization script
    └── test_google_api.py                  # Test script
```

## Using Google APIs in Your Code

### Example: Accessing Google Drive

```python
from pathlib import Path
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Load tokens
tokens_file = Path.home() / "Documents/GitHub/InsightPulseAI_SKR/.tokens/google_tokens.json"
with open(tokens_file, 'r') as f:
    creds_data = json.load(f)

# Create credentials
creds = Credentials.from_authorized_user_info(creds_data, ['https://www.googleapis.com/auth/drive.readonly'])

# Build Drive service
drive_service = build('drive', 'v3', credentials=creds)

# List files
results = drive_service.files().list(pageSize=10).execute()
files = results.get('files', [])

for file in files:
    print(f"{file['name']} ({file['id']})")
```

### Example: Reading a Google Sheet

```python
from pathlib import Path
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Load tokens
tokens_file = Path.home() / "Documents/GitHub/InsightPulseAI_SKR/.tokens/google_tokens.json"
with open(tokens_file, 'r') as f:
    creds_data = json.load(f)

# Create credentials
creds = Credentials.from_authorized_user_info(creds_data, ['https://www.googleapis.com/auth/spreadsheets.readonly'])

# Build Sheets service
sheets_service = build('sheets', 'v4', credentials=creds)

# Read from a specific spreadsheet and range
SPREADSHEET_ID = 'your-spreadsheet-id'
RANGE_NAME = 'Sheet1!A1:E10'
result = sheets_service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
rows = result.get('values', [])

for row in rows:
    print(row)
```

## Security Notes

- OAuth tokens are stored in a secure directory with restricted permissions
- The tokens provide delegated access to your Google account
- Revoke access at any time through [Google Account Security](https://myaccount.google.com/permissions)
- Never commit token files to version control

## Troubleshooting

### Token Refresh Issues

If your tokens expire, they will be automatically refreshed when using the API. If you encounter persistent token issues:

```bash
rm ~/Documents/GitHub/InsightPulseAI_SKR/.tokens/google_tokens.json
python3 scripts/authorize_google_oauth.py
```

### API Access Issues

If you see "API not enabled" errors:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Make sure you've enabled the required APIs:
   - Google Drive API
   - Google Sheets API
   - Google Calendar API
   - Gmail API

### Permission Issues

If you see permission errors:
1. Check if the scopes requested during authorization match the APIs you're trying to access
2. Try re-authorizing with the full script to request all necessary permissions

## Updating Client Secret

If you need to update your client secret:

1. Download new client secret JSON from Google Cloud Console
2. Replace `/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/config/oauth/google_oauth_client_secret.json`
3. Re-run the configuration and authorization scripts:
   ```bash
   python3 scripts/configure_google_oauth.py
   python3 scripts/authorize_google_oauth.py
   ```