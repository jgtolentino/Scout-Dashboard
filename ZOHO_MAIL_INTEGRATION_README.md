# Zoho Mail Integration for InsightPulseAI

This document provides an overview of the Zoho Mail integration for InsightPulseAI and how to use it.

## 📊 Current Status

The Zoho Mail integration is **partially operational** with the following capabilities:

- ✅ OAuth Authentication: **Successful**
- ✅ Account Discovery: **Successful**
- ✅ Folder Listing: **Successful**
- ⚠️ Profile Access: **Limited**
- ⚠️ Email Aliases: **Limited**
- ⚠️ Message Creation: **Limited**

## 🔧 Setup Complete

The following setup has been completed:

1. OAuth client registration with Zoho
2. Token authorization and refresh flow
3. Credential management system
4. Shell function integration
5. Status monitoring and testing tools

## 📧 Available Commands

The following shell commands are available for interacting with the mail system:

```bash
pulser_mail_status    # Show mail configuration status
pulser_mail_refresh   # Refresh OAuth token
pulser_mail_internal  # Send internal email (limited)
pulser_mail_external  # Send external email (limited)
pulser_mail_test      # Test mail API connection
pulser_mail_aliases   # Show available email aliases
```

To use these commands, ensure your shell has loaded the mail functions:

```bash
source ~/.pulser_mail_functions
```

## 📋 Configuration

Your configuration is stored in the following locations:

- OAuth Credentials: `~/.pulser/zoho_credentials.json`
- Mail Configuration: `~/.pulser/pulser_mail_config.json`
- Shell Functions: `~/.pulser_mail_functions`

## 🔒 Security

The credential system uses OAuth 2.0 for secure authentication. No passwords are stored in the system. The refresh token is securely stored in the credentials file.

## 🚀 Next Steps for Full Functionality

To achieve full mail API functionality, please complete these steps:

1. Verify API access is fully enabled in [Zoho Mail Admin Console](https://mailadmin.zoho.com)
2. Ensure insightpulseai.com domain has a Business/Enterprise plan
3. Contact Zoho support about the 'URL_RULE_NOT_CONFIGURED' errors

## 🛠️ Troubleshooting

If you encounter issues:

1. Refresh your token: `pulser_mail_refresh`
2. Test the API connection: `pulser_mail_test`
3. Check your credential status: `pulser_mail_status`

## 📌 Technical Notes

- Token Type: `Zoho-oauthtoken` (correct format for API access)
- Redirect URI: `https://insightpulseai.com/auth/zoho/callback`
- API Base URL: `https://mail.zoho.com/api`
- Account ID: Retrieved automatically from API

## 📞 Support

For additional assistance with this integration, please refer to the Zoho Mail API documentation or contact Zoho support regarding the API limitations.