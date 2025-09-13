# Google Calendar API Setup for Voice Calendar Agent

This guide walks you through setting up Google Calendar API credentials for use with the Voice Calendar Agent.

## Prerequisites

- Google Cloud Platform account
- Access to Google Cloud Console
- Voice Calendar Agent installed

## Steps to Configure Google Calendar API

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" and create a new project for your Voice Calendar integration
3. Name it something recognizable like "InsightPulseAI-Calendar"

### 2. Enable Google Calendar API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "Internal" if this is for organization use only, or "External" if you plan to use it more broadly
3. Fill in the required fields:
   - App name: "InsightPulseAI Voice Calendar"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Save and continue

### 4. Create OAuth Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "Voice Calendar Agent"
5. Authorized redirect URIs: Add `http://localhost:8000/oauth2callback`
6. Click "Create"
7. Download the JSON file (will be used as credentials)

### 5. Set Up Credentials in Pulser

1. Create a directory: `mkdir -p ~/.credentials/google_calendar/`
2. Move the downloaded JSON file:
   ```bash
   mv ~/Downloads/client_secret_XXXXX.json ~/.credentials/google_calendar/client_secret.json
   ```
3. Update your `.env` file with the client ID and secret

### 6. Authorize the Agent

Execute the following command to complete OAuth authorization:

```bash
pulser authorize google_calendar
```

This will open a browser window for you to grant calendar access to the Voice Calendar Agent.

### 7. Verify Configuration

Test that your credentials are working correctly:

```bash
pulser task run voice_calendar --test-credentials
```

You should see a success message confirming the Google Calendar API connection is working.

## Troubleshooting

If you encounter errors:

1. Ensure your credentials JSON file is correctly placed in `~/.credentials/google_calendar/`
2. Check that your OAuth consent screen has the right scopes
3. Verify the redirect URI exactly matches what you configured
4. Make sure your Google account has access to Google Calendar

For more detailed help, check the [Google Calendar API documentation](https://developers.google.com/calendar/api/guides/overview).