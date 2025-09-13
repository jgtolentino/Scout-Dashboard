# Zoho Mail CLI Integration for Pulser

This guide explains how to set up and use the Zoho Mail integration with Pulser. The integration allows you to send and receive emails using the Zoho Mail API from the command line.

## Setup Instructions

### 1. Prerequisites

- Python 3.6+
- `requests` module (`pip install requests`)
- Zoho Mail account with API access

### 2. Configure Zoho API Credentials

First, you need to obtain API credentials from Zoho:

1. Visit the [Zoho API Console](https://api-console.zoho.com/)
2. Click on "Server-based Applications" → CREATE NOW
3. Fill in the following application details:
   - Client Name: `Pulser Mail Client`
   - Homepage URL: `https://insightpulseai.com`
   - Authorized Redirect URIs: `http://localhost:8000/callback`
4. Create your client
5. In the "Client Secret" tab, note your Client ID and Client Secret
6. In the "Self Client" section, select the required scopes:
   - ZohoMail.accounts.READ
   - ZohoMail.folders.READ
   - ZohoMail.messages.READ
   - ZohoMail.messages.CREATE
   - ZohoMail.messages.UPDATE
   - ZohoMail.settings.READ
7. Generate your refresh token using the `get_zoho_token.py` script:

```bash
python3 ~/get_zoho_token.py
```

### 3. Test Your Configuration

Use the test script to verify your credentials are working correctly:

```bash
~/test_zoho_mail.sh --send-email --to your.email@example.com
```

If you don't have credentials set up yet, the script will create a template for you.

## Usage

### Sending Internal Emails

Use the `pulser_mail_internal` function to send emails with the internal alias:

```bash
pulser_mail_internal "recipient@example.com" "Subject Line" "Email body content"
```

### Sending External Emails

Use the `pulser_mail_external` function to send emails with the external alias:

```bash
pulser_mail_external "recipient@example.com" "Subject Line" "Email body content"
```

### Additional Options

Both email functions support additional options:

```bash
pulser_mail_internal "recipient@example.com" "Subject" "Body" --cc "cc@example.com" --bcc "bcc@example.com"
```

### HTML Email Support

The email clients support HTML content. Simply include HTML markup in your email body:

```bash
pulser_mail_internal "recipient@example.com" "HTML Test" "<h1>Hello</h1><p>This is an <b>HTML</b> email.</p>"
```

## Troubleshooting

### Authentication Issues

If you encounter authentication issues:

1. Check that your credentials file has the correct format
2. Verify your refresh token is valid (should not be expired)
3. Ensure you've granted all the required API scopes
4. Try refreshing your access token manually:

```bash
python3 ~/test_zoho_credentials.py --credentials ~/.pulser/zoho_credentials.json
```

### Mail Sending Failures

If emails fail to send:

1. Check your internet connection
2. Verify the recipient email address is valid
3. Ensure your Zoho Mail account is active and not suspended
4. Check the error message for specific API errors

## Maintenance

The OAuth tokens need periodic refreshing. The script handles this automatically, but if you need to manually refresh:

```bash
python3 ~/test_zoho_credentials.py --credentials ~/.pulser/zoho_credentials.json
```

Your refresh token is long-lived, but you may need to regenerate it if:
- You change the API scopes
- The refresh token is revoked
- You change your Zoho password

To generate a new refresh token, run:

```bash
python3 ~/get_zoho_token.py
```

## Integration with Existing Functionality

This CLI integration complements the existing browser automation methods described in the previous version of this documentation. While the browser automation approach (using Playwright) can be useful for UI interactions, this API-based approach is more reliable for programmatic email sending.

### Vacation Reply Automation

The API can also be used to set up vacation auto-replies. To implement this functionality:

```bash
python3 ~/zoho_mail_client.py settings --enable-vacation-reply --from "2025-06-01" --to "2025-06-15" --subject "Out of Office" --message "I am currently out of office and will respond when I return."
```

## Support

For additional support or to report issues, please contact the Pulser support team.