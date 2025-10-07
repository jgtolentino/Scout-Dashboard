# Zoho Mail Setup for Pulser Email Aliases

## Overview

This document provides instructions for setting up and activating Pulser email aliases in Zoho Mail. The configuration allows Pulser and Claude to send and receive emails using dedicated aliases, ensuring proper separation between internal and external communications.

## Email Aliases

Pulser utilizes the following email aliases:

1. **Internal Communications**: `pulser@insightpulseai.com`
   - Used for: System logs, internal notifications, and team communications
   - Signature: "Pulser (Internal), InsightPulseAI System Automation"

2. **External Communications**: `pulser-ai@insightpulseai.com`
   - Used for: Customer support, external notifications, and client communications
   - Signature: "Pulser AI Support, InsightPulseAI"

## Setup Instructions

### 1. First-Time Configuration

Run the activation script to set up all required components:

```bash
# Make the script executable if needed
chmod +x ~/activate_zoho_mail_aliases.sh

# Run the activation script
~/activate_zoho_mail_aliases.sh
```

The script will:
- Create necessary directories and files
- Update the YAML configuration to activate pending aliases
- Generate the API client script for programmatic mail access
- Create shell functions for easy mail sending
- Set up email signatures with proper branding

### 2. Update Shell Configuration

Add the Pulser mail functions to your shell by adding this line to your `~/.zshrc` or `~/.bashrc` file:

```bash
source ~/.pulser_mail_functions
```

Reload your shell configuration:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### 3. Set Up API Credentials

Before using the API client, you'll need to set up your Zoho Mail API credentials:

```bash
python3 ~/Documents/GitHub/InsightPulseAI_SKR/tools/setup_zoho_credentials.py
```

You'll need to provide:
- Client ID
- Client Secret
- Refresh Token
- Account ID

These can be obtained from the Zoho Developer Console after creating an API client.

## Usage

### Sending Internal Emails

```bash
pulser_mail_internal recipient@example.com "Subject Line" "Email body content"
```

### Sending External Emails

```bash
pulser_mail_external recipient@example.com "Subject Line" "Email body content"
```

### Listing Available Aliases

```bash
pulser_mail_aliases
```

### Adding HTML Signatures

```bash
body=$(pulser_mail_add_signature "Your email content here" internal)
pulser_mail_internal recipient@example.com "Subject Line" "$body"
```

## DNS Configuration Requirements

Ensure the following DNS records are properly configured for your domain:

### SPF Record
```
v=spf1 include:zoho.com ~all
```

### DKIM Record
Set up according to the instructions in Zoho Mail Admin Console.

### DMARC Record (Recommended)
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@insightpulseai.com
```

## Verification

To verify that your email configuration is working correctly:

1. Run the verification script:
   ```bash
   ~/Documents/GitHub/InsightPulseAI_SKR/mail_configs/setup_pulser_aliases.sh
   ```

2. Send test emails to both aliases:
   ```bash
   pulser_mail_internal your-email@example.com "Test Internal Alias" "This is a test from Pulser internal alias."
   pulser_mail_external your-email@example.com "Test External Alias" "This is a test from Pulser external alias."
   ```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check that your app-specific password is correct
   - Verify that 2FA exceptions are properly configured

2. **Email Delivery Issues**
   - Verify SPF, DKIM, and DMARC records are properly set up
   - Check spam folders for test emails

3. **API Connection Issues**
   - Ensure your OAuth2 credentials are valid and have not expired
   - Verify that the API is enabled in your Zoho Mail account

### Support Resources

For further assistance, refer to:
- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/overview.html)
- The internal support documentation at `~/Documents/GitHub/InsightPulseAI_SKR/mail_configs/`