# Pulser/Claude Email Automation with Zoho Mail

## Required Components for Full Email Automation

For Pulser or Claude to handle all email operations using Zoho Mail, the following components need to be configured:

### 1. Account and Authentication Setup

- **Zoho Mail Admin Account**: Full administrative access to manage domains, aliases, and API settings
- **App-Specific Passwords**: Generate separate passwords for each automation use case
  - One for internal email operations (`pulser@insightpulseai.com`)
  - One for external email operations (`pulser-ai@insightpulseai.com`)
- **2FA Exemption**: Configure the automation account to bypass 2FA for non-interactive operations
- **IP Allowlisting**: Add the IP addresses of your Pulser servers to Zoho's allowlist

### 2. API Configuration

- **Zoho Mail API**: Enable API access in Zoho Mail Admin Console
- **OAuth2 Credentials**: Set up a registered application in Zoho Developer Console
  - Client ID, Client Secret, and Refresh Token for continuous authentication
  - Proper scopes: `ZohoMail.accounts.READ`, `ZohoMail.messages.ALL`, etc.
- **API Rate Limits**: Request limits appropriate for your automation needs (higher than default)

### 3. Email Alias Configuration

- **DNS Records**: Ensure all required DNS records are properly configured
  - SPF: `v=spf1 include:zoho.com ~all`
  - DKIM: Set up keys for proper email signing
  - DMARC: Policy to prevent spoofing
- **Alias Setup**: Configure both email aliases in Zoho Mail Admin
  - Internal: `pulser@insightpulseai.com`
  - External: `pulser-ai@insightpulseai.com`
- **Signature Templates**: Upload HTML signature templates with logos

### 4. Environment Configuration

- **Environment Variables**: Securely store all credentials
  ```
  ZOHO_CLIENT_ID=...
  ZOHO_CLIENT_SECRET=...
  ZOHO_REFRESH_TOKEN=...
  ZOHO_INTERNAL_EMAIL=pulser@insightpulseai.com
  ZOHO_EXTERNAL_EMAIL=pulser-ai@insightpulseai.com
  ZOHO_INTERNAL_PASSWORD=... (app-specific password)
  ZOHO_EXTERNAL_PASSWORD=... (app-specific password)
  ```
- **Credentials Rotation**: System for periodic refresh/rotation of tokens and app passwords
- **Secure Storage**: Store API keys in a secrets manager (not hardcoded)

### 5. Command-Line Integration

- **CLI Commands**: Create the following command mappings in `.pulserrc`:
  ```
  alias pulser-mail-send='pulser exec:task email_send'
  alias pulser-mail-check='pulser exec:task email_check'
  alias pulser-mail-search='pulser exec:task email_search'
  alias pulser-mail-reply='pulser exec:task email_reply'
  ```

- **Shell Functions**: Add these to `.pulser_cli_profile`:
  ```bash
  # Send internal email
  function pulser_send_internal() {
    pulser exec:task email_send --from=pulser@insightpulseai.com "$@"
  }
  
  # Send external email
  function pulser_send_external() {
    pulser exec:task email_send --from=pulser-ai@insightpulseai.com "$@"
  }
  ```

### 6. Task Definitions

Create YAML task definitions for PulseOps:

```yaml
# email_send.yaml
name: email_send
description: "Send an email through Zoho Mail"
agent: claudia
params:
  - name: from
    required: true
    description: "Sender email address"
  - name: to
    required: true
    description: "Recipient email address"
  - name: subject
    required: true
    description: "Email subject"
  - name: body
    required: true
    description: "Email body content"
  - name: type
    required: false
    description: "Email type (internal or external)"
    default: "internal"
```

Similar task definitions for `email_check`, `email_search`, `email_reply`, etc.

### 7. Integration Scripts

- **API Client Library**: Create Zoho Mail API client in Python
- **Authentication Manager**: Handle OAuth flow and token refresh
- **Template Manager**: For email signatures and common message formats
- **Error Handler**: Manage API errors, rate limits, and retries

### 8. Permissions and Security

- **Permission Matrix**: Define which agents can send emails from which aliases
  ```yaml
  # In agent definitions
  permissions:
    email:
      internal: [read, write]  # Can read and send as internal
      external: [read]         # Can only read external
  ```
- **Content Validation**: Filter for sensitive information in outgoing emails
- **Logging and Auditing**: Comprehensive logging for security compliance

### 9. Testing and Monitoring

- **Test Accounts**: Set up test email addresses for development
- **Monitoring**: Alert system for delivery failures or authentication issues
- **Metrics**: Track usage, success rates, and response times

### 10. Documentation

- **User Guide**: Document all email commands and their parameters
- **Admin Guide**: Step-by-step setup instructions for Zoho Mail integration
- **Troubleshooting Guide**: Common issues and their resolutions

## Implementation Plan

1. **Initial Setup** (1-2 days)
   - Configure Zoho Mail admin settings
   - Set up DNS records
   - Generate API credentials

2. **Core API Integration** (2-3 days)
   - Implement authentication flow
   - Build basic send/receive functionality

3. **CLI Integration** (1-2 days)
   - Add command aliases
   - Create shell functions
   - Connect to Pulser orchestration

4. **Testing and Refinement** (2-3 days)
   - End-to-end testing
   - Error handling improvements
   - Performance optimization

## Maintenance Considerations

- **API Changes**: Monitor Zoho Mail API for updates and breaking changes
- **Security Updates**: Regular rotation of API credentials and passwords
- **Usage Monitoring**: Track API usage to stay within limits and plan upgrades

## Special Considerations for Claude

For Claude to directly interact with email:

1. **Context Inclusion**: Add email operations context to Claude's knowledge
2. **Command Parsing**: Train Claude to parse natural language email commands
3. **Safety Measures**: Implement confirmation steps for sensitive operations
4. **Templating**: Store common email templates Claude can access and customize