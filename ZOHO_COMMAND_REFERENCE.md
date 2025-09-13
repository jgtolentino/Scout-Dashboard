# InsightPulseAI Zoho Integration
## Command Reference Guide

This document provides a reference for all available commands related to the Zoho Mail and Cliq integration for InsightPulseAI.

## 📧 Mail Commands

### Shell Functions

| Command | Description | Usage |
|---------|-------------|-------|
| `pulser_mail_status` | Check mail configuration and API status | `pulser_mail_status` |
| `pulser_mail_refresh` | Refresh the OAuth token | `pulser_mail_refresh` |
| `pulser_mail_internal` | Send internal email (requires full API) | `pulser_mail_internal "recipient@example.com" "Subject" "Body text"` |
| `pulser_mail_external` | Send external email (requires full API) | `pulser_mail_external "recipient@example.com" "Subject" "Body text"` |
| `pulser_mail_send` | Generic email sending | `pulser_mail_send "recipient@example.com" "Subject" "Body" "markdown"` |
| `pulser_mail_test` | Test mail API connection | `pulser_mail_test` |
| `pulser_mail_aliases` | Show available email aliases | `pulser_mail_aliases` |

### Email Alias Management

| Command | Description | Usage |
|---------|-------------|-------|
| `/Users/tbwa/add_email_alias.sh` | Add single email alias | `/Users/tbwa/add_email_alias.sh "name@insightpulseai.com" "Display Name" "internal\|external" "Description"` |
| `/Users/tbwa/setup_agent_emails.sh` | Set up all agent email aliases | `/Users/tbwa/setup_agent_emails.sh` |

### Job Application Auto-Responder

| Command | Description | Usage |
|---------|-------------|-------|
| `/Users/tbwa/application_autoresponder.sh` | Run auto-responder manually | `/Users/tbwa/application_autoresponder.sh` |
| `/Users/tbwa/manual_send_confirmation.sh` | Send manual confirmation | `/Users/tbwa/manual_send_confirmation.sh applicant@example.com` |
| `/Users/tbwa/test_application_simple.sh` | Test auto-responder | `/Users/tbwa/test_application_simple.sh` |

### API Monitoring

| Command | Description | Usage |
|---------|-------------|-------|
| `/Users/tbwa/test_zoho_unlock.sh` | Test if API is fully unlocked | `/Users/tbwa/test_zoho_unlock.sh` |
| `/Users/tbwa/run_zoho_monitor_background.sh` | Start background monitor | `/Users/tbwa/run_zoho_monitor_background.sh` |

### Service Event Tracking

| Command | Description | Usage |
|---------|-------------|-------|
| `python3 /Users/tbwa/zoho_service_events.py status` | Log current API status | `python3 /Users/tbwa/zoho_service_events.py status` |
| `python3 /Users/tbwa/zoho_service_events.py list` | List service events | `python3 /Users/tbwa/zoho_service_events.py list [--limit 10] [--type event_type]` |

### Cliq Integration

| Command | Description | Usage |
|---------|-------------|-------|
| `python3 /Users/tbwa/zoho_mail_cliq_handler.py status` | Check API access status | `python3 /Users/tbwa/zoho_mail_cliq_handler.py status` |
| `python3 /Users/tbwa/zoho_mail_cliq_handler.py send` | Send test email | `python3 /Users/tbwa/zoho_mail_cliq_handler.py send --to "email" --subject "subject" --body "body"` |
| `python3 /Users/tbwa/zoho_mail_cliq_handler.py alert` | Create system alert | `python3 /Users/tbwa/zoho_mail_cliq_handler.py alert --title "title" --severity "level" --description "desc"` |

## 🔍 File Reference

### Configuration Files

| File | Description | Usage |
|------|-------------|-------|
| `~/.pulser/zoho_credentials.json` | OAuth credentials | Authentication tokens |
| `~/.pulser/pulser_mail_config.json` | Mail configuration | Main configuration |
| `~/.pulser_mail_functions` | Shell functions | Sourced by terminal |
| `/Users/tbwa/application_confirmation_response.md` | Job confirmation template | Email template |
| `/Users/tbwa/mock_application_email.json` | Mock application data | For testing |

### Log Files

| File | Description |
|------|-------------|
| `~/application_responses.log` | Sent confirmations log |
| `~/new_applications.log` | New applications log |
| `~/application_debug.log` | Auto-responder debug log |
| `~/zoho_api_unlock_monitor.log` | API unlock monitoring log |

## 🔐 Security Features

### DKIM Configuration

Two DKIM keys have been configured for enhanced email deliverability:

1. **Primary DKIM**
   - Selector: zoho1
   - Hostname: zoho1-insightpulseai.com
   - Status: Verified

2. **Secondary DKIM**
   - Selector: zoho
   - Hostname: zoho._domainkey.insightpulseai.com
   - Status: Verified

### Authentication Security

- Token Type: Zoho-oauthtoken (not Bearer)
- Auto-refresh enabled for tokens
- Secure token storage

## 🔧 Troubleshooting

### Auto-Responder Issues

If the auto-responder isn't working:

1. Check if cron job is running:
   ```bash
   crontab -l | grep application
   ```

2. Check the application debug log:
   ```bash
   tail -20 ~/application_debug.log
   ```

3. Verify the mail functions:
   ```bash
   source ~/.pulser_mail_functions && pulser_mail_status
   ```

4. Use the manual confirmation tool while waiting for API:
   ```bash
   /Users/tbwa/manual_send_confirmation.sh applicant@example.com
   ```

### API Unlock Issues

If the API doesn't fully unlock after waiting:

1. Check if plan is active in Zoho Admin Console
2. Try refreshing token:
   ```bash
   pulser_mail_refresh
   ```
3. Check the latest status in the logs:
   ```bash
   tail -20 ~/zoho_api_unlock_monitor.log
   ```

## 📅 Scheduled Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Auto-Responder Check | Every 5 minutes | Checks for new applications |
| Token Refresh | Every 1 hour | Auto-refreshes OAuth token |
| API Status Check | Every 30 seconds (during monitor) | Checks API unlock status |