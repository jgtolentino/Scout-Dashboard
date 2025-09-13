# Zoho OAuth Setup Guide for InsightPulseAI

This guide walks you through setting up a correctly configured Zoho OAuth client for InsightPulseAI's mail integration.

## 1. Prepare for OAuth Client Registration

Run the preparation script to ensure your credential files are set up correctly:

```bash
~/setup_zoho_credential_correct.sh
```

This script will:
- Create or update the credentials file structure
- Add the correct redirect URI to your configuration
- Provide instructions for the OAuth client registration

## 2. Register Zoho OAuth Client

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Click on "Add Client" or "Create New Client"
3. **Use EXACTLY these values**:

   | Field | Value |
   |-------|-------|
   | Client Type | Server-based Applications |
   | Client Name | InsightPulseAI Mail Agent |
   | Homepage URL | https://insightpulseai.com |
   | Authorized Redirect URIs | https://insightpulseai.com/auth/zoho/callback |

4. For API Scopes, ensure the following are selected:
   - ZohoMail.messages.ALL
   - ZohoMail.accounts.READ
   - ZohoMail.folders.READ
   - ZohoMail.settings.READ

5. Click Create

## 3. Store Your Credentials

After creating the client, you'll receive:
- Client ID
- Client Secret

Run the setup script again to enter these values:
```bash
~/setup_zoho_credential_correct.sh
```

## 4. Complete OAuth Flow

Now that you have properly registered your client with the correct redirect URI, run:
```bash
~/run_zoho_setup.sh
```

This will:
- Start the OAuth flow
- Open a browser for authentication
- Store the refresh token in your credentials file

## 5. Test Your Configuration

To verify everything is working properly:
```bash
~/test_zoho_mail.sh --send-email --to your.email@example.com
```

## Troubleshooting

### Domain Verification
If you encounter errors related to unverified domains:
1. Go to [Zoho Mail Admin Console](https://mail.zoho.com/cpanel)
2. Go to Domain Management
3. Verify the domain "insightpulseai.com" by adding the required DNS records

### Redirect URI Errors
If you encounter redirect URI mismatch errors, verify that:
1. The URI is exactly `https://insightpulseai.com/auth/zoho/callback`
2. The domain has been verified in Zoho
3. The `redirect_uri` field in `~/.pulser/zoho_credentials.json` matches exactly

### Token Refresh Errors
If tokens don't refresh properly:
1. Check the client credentials are correct
2. Ensure the client has permission to use the requested scopes
3. Re-run the OAuth flow with `~/run_zoho_setup.sh`