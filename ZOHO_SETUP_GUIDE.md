# Setting Up Zoho Mail with OAuth for Pulser

This guide provides detailed instructions for setting up Zoho Mail API credentials for use with Pulser's email functions.

## 1. Creating a Zoho API Account

1. **Create a Zoho Developer Account**:
   - Go to [https://api-console.zoho.com/](https://api-console.zoho.com/)
   - Sign in with your Zoho Mail account (jgtolentino.rn@gmail.com)

2. **Create a Self-Client Application**:
   - Click "Add Client" in the top right
   - Select "Self Client" option
   - Fill in the details:
     - Client Name: "Pulser Mail Integration"
     - Homepage URL: "https://insightpulseai.com"
     - Authorized Redirect URIs: "https://insightpulseai.com/callback"
   - Click "Create"

## 2. Configuring Scopes and Getting Credentials

1. **Add Required Scopes**:
   - In your client details, go to the "Scopes" tab
   - Click "Add Scope"
   - Search for and add these scopes:
     - `ZohoMail.accounts.READ`
     - `ZohoMail.messages.ALL`
     - `ZohoMail.folders.READ`
     - `ZohoMail.settings.READ`
   - Click "Save"

2. **Get Client Credentials**:
   - Go to the "Client Secret" tab
   - Copy the Client ID and Client Secret values
   - Save them securely - you'll need these for the next steps

3. **Generate Authorization Code**:
   - Go to the "Generate Code" tab
   - Select all the scopes you added
   - Click "Generate Code"
   - Copy the generated code - note that this code is temporary and expires quickly

## 3. Obtaining a Refresh Token

The authorization code must be exchanged for a refresh token which will be used for ongoing API access.

1. **Create a Simple Script**:
   Create a file named `get_zoho_token.py` with the following content:

   ```python
   import requests

   # Your values from the Zoho Developer Console
   client_id = "YOUR_CLIENT_ID"  # Replace with your actual client ID
   client_secret = "YOUR_CLIENT_SECRET"  # Replace with your actual client secret
   code = "YOUR_AUTHORIZATION_CODE"  # Replace with the generated code
   redirect_uri = "https://insightpulseai.com/callback"

   # Construct the URL for token exchange
   url = "https://accounts.zoho.com/oauth/v2/token"
   params = {
       "code": code,
       "grant_type": "authorization_code",
       "client_id": client_id,
       "client_secret": client_secret,
       "redirect_uri": redirect_uri
   }

   # Make the request
   response = requests.post(url, params=params)
   result = response.json()

   print("API Response:", result)

   if "refresh_token" in result:
       print("\nRefresh Token:", result["refresh_token"])
       print("Access Token:", result["access_token"])
       
       # Write to credentials file
       import json
       import os
       from pathlib import Path
       
       creds = {
           "client_id": client_id,
           "client_secret": client_secret,
           "refresh_token": result["refresh_token"],
           "account_id": "jake.tolentino",
           "admin_email": "jgtolentino.rn@gmail.com"
       }
       
       creds_path = Path.home() / '.pulser' / 'zoho_creds.json'
       os.makedirs(os.path.dirname(creds_path), exist_ok=True)
       
       with open(creds_path, 'w') as f:
           json.dump(creds, f, indent=2)
           
       print(f"\nCredentials saved to {creds_path}")
   else:
       print("\nError:", result)
   ```

2. **Run the Script**:
   - Update the script with your actual client ID, client secret, and the generated code
   - Run the script: `python3 get_zoho_token.py`
   - This will exchange the code for a refresh token and create the credentials file

## 4. Testing the Integration

1. **Test Basic Email Functionality**:
   ```bash
   source ~/.pulser_mail_functions
   pulser_mail_internal your-email@example.com "Test Subject" "This is a test"
   ```

2. **Test with HTML Content**:
   ```bash
   source ~/.pulser_mail_functions
   pulser_mail_internal your-email@example.com "HTML Test" "<h1>Hello</h1><p>This is HTML content</p>"
   ```

3. **Test External Email**:
   ```bash
   pulser_mail_external your-email@example.com "External Test" "This is from the external email alias"
   ```

## 5. Troubleshooting

1. **Authentication Errors**:
   - If you see "Error: 'access_token'", your refresh token might be invalid or expired
   - Regenerate a new authorization code and refresh token

2. **Connection Errors**:
   - Check your internet connection
   - Ensure Zoho's API services are operational: [Zoho Status](https://status.zoho.com/)

3. **Permission Errors**:
   - Verify that you've added all required scopes to your Zoho application
   - Check if your Zoho account has 2FA enabled, which might require additional configuration

4. **Direct SMTP Alternative**:
   If you're having trouble with the OAuth authentication, you can use the direct SMTP method:
   ```bash
   ~/send_without_oauth.sh
   ```

## 6. Additional Resources

- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/overview.html)
- [OAuth Authorization Guide](https://www.zoho.com/mail/help/api/using-oauth-2.html)
- [Rate Limits and Quotas](https://www.zoho.com/mail/help/api/rate-limits.html)

For more detailed information on using the Pulser mail functions, see:
- `~/README_ZOHO_USAGE.md`
- `~/Documents/GitHub/InsightPulseAI_SKR/mail_configs/README_ZOHO_MAIL_SETUP.md`