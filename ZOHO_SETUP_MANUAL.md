# Manual Zoho Setup Process

Since the automatic script is encountering issues, follow these manual steps:

## 1. Create your OAuth client in Zoho Developer Console

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Click "Add Client" or "Create New Client"
3. Use EXACTLY these values:
   - Client Type: Server-based Applications
   - Client Name: InsightPulseAI Mail Agent
   - Homepage URL: https://insightpulseai.com
   - Authorized Redirect URIs: https://insightpulseai.com/auth/zoho/callback
4. Click Create
5. Copy the Client ID and Client Secret (already set in your credentials)

## 2. Get an Authorization Code

1. Visit this URL in your browser (replace CLIENT_ID with your actual client ID):

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoMail.messages.ALL ZohoMail.accounts.READ ZohoMail.folders.READ ZohoMail.settings.READ&client_id=1000.O4L3H6AHY5LRCXW7G62K0AZCKR60MZ&response_type=code&access_type=offline&redirect_uri=https://insightpulseai.com/auth/zoho/callback
```

2. Log in to your Zoho account
3. Authorize the application
4. You'll be redirected to a URL like:
   `https://insightpulseai.com/auth/zoho/callback?code=YOUR_CODE_HERE`
5. Copy the code parameter from the URL

## 3. Exchange the Code for Tokens

Run the simplified script with the authorization code:

```bash
python3 ~/zoho_setup_simplified.py YOUR_CODE_HERE
```

This will:
- Exchange the authorization code for access and refresh tokens
- Save them in your credentials file

## 4. Test Your Configuration

After getting the tokens, test your configuration:

```bash
~/test_zoho_mail.sh --send-email --to your.email@example.com
```

## Troubleshooting

- If you get SSL/TLS errors: Update Python and OpenSSL
- If the URL doesn't redirect properly: Configure DNS for insightpulseai.com
- If tokens don't refresh: Ensure your client has proper scopes