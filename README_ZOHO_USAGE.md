# Pulser Zoho Mail Integration - Usage Guide

## Overview

This guide provides instructions for using the Pulser Zoho Mail integration. The system allows Pulser and Claude to send and receive emails using dedicated Zoho Mail aliases.

## Available Email Aliases

- **Internal Communications**: `pulser@insightpulseai.com`
  - Used for: System logs, internal notifications, and team communications
  - Has formal "Pulser (Internal)" signature

- **External Communications**: `pulser-ai@insightpulseai.com`
  - Used for: Customer support, external notifications, and client communications
  - Has branded "Pulser AI Support" signature

## Setup Requirements

Before using the mail integration, you need:

1. **Zoho API Credentials**:
   - Client ID
   - Client Secret
   - Refresh Token

2. **Configuration File**:
   - Copy the sample: `cp ~/.pulser/zoho_creds.json.sample ~/.pulser/zoho_creds.json`
   - Edit the file to include your actual credentials: `nano ~/.pulser/zoho_creds.json`

3. **Shell Functions**:
   - Already loaded if you see the functions with: `pulser_mail_help`
   - If not loaded, run: `source ~/.pulser_mail_functions`

## Usage Examples

### Sending Emails

**Internal Email**:
```bash
pulser_mail_internal recipient@example.com "Subject Line" "Email content here"
```

**External Email**:
```bash
pulser_mail_external recipient@example.com "Subject Line" "Email content here"
```

**With CC and BCC**:
```bash
pulser_mail_internal recipient@example.com "Subject Line" "Email content" --cc="cc@example.com" --bcc="bcc@example.com"
```

**HTML Content**:
```bash
pulser_mail_internal recipient@example.com "Subject Line" "<h1>HTML Content</h1><p>This is formatted HTML.</p>"
```

### Account Information

**List Aliases**:
```bash
pulser_mail_aliases
```

**List Folders**:
```bash
pulser_mail_folders
```

### Email Formatting

**Add Signature**:
```bash
email_body=$(pulser_mail_add_signature "Your email content here" internal)
pulser_mail_internal recipient@example.com "Subject Line" "$email_body"
```

## Test Script

A test script is provided to verify the email integration is working:

```bash
~/send_test_email.sh
```

This script will:
1. Prompt for your email address
2. Ask whether to send from internal or external alias
3. Send a formatted test email
4. Report success or failure

## Troubleshooting

If you encounter issues:

1. **Check Credentials**:
   - Verify your Zoho API credentials in `~/.pulser/zoho_creds.json`
   - Make sure you have the correct permissions in Zoho

2. **Missing Functions**:
   - If functions are not found, run: `source ~/.pulser_mail_functions`

3. **API Errors**:
   - Check logs at `~/.pulser/logs/zoho_mail.log`
   - Look for error messages with API response details

4. **DNS Configuration**:
   - Ensure proper SPF, DKIM, and DMARC records are set
   - Test with: `dig TXT insightpulseai.com`

## Getting Help

For more detailed instructions, refer to:
- `~/Documents/GitHub/InsightPulseAI_SKR/mail_configs/README_ZOHO_MAIL_SETUP.md`

For command help:
```bash
pulser_mail_help
```