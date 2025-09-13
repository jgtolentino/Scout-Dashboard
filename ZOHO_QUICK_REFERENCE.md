# InsightPulseAI Zoho Integration
## Quick Reference Guide

This document provides quick reference information for the most common tasks and troubleshooting procedures for the InsightPulseAI Zoho integration.

## 🚀 Quick Start Commands

### Check Status
```bash
# Check mail status
source ~/.pulser_mail_functions && pulser_mail_status

# Check API unlock status
/Users/tbwa/test_zoho_unlock.sh

# View service events 
python3 /Users/tbwa/zoho_service_events.py list
```

### Token Management
```bash
# Refresh OAuth token
source ~/.pulser_mail_functions && pulser_mail_refresh

# Update token type (if needed)
python3 /Users/tbwa/update_zoho_token_type.py
```

### Monitoring
```bash
# Start background monitor
/Users/tbwa/run_zoho_monitor_background.sh

# View monitoring log
tail -20 ~/zoho_api_unlock_monitor.log

# Check for unlock notification
ls -l ~/ZOHO_API_*.txt
```

## 🛠️ Common Troubleshooting

### API Access Issues

**Problem**: API endpoints return 404 or `URL_RULE_NOT_CONFIGURED`  
**Solution**:
1. Check API status: `pulser_mail_status`
2. Refresh token: `pulser_mail_refresh`
3. Verify plan is active in Zoho Admin Console
4. Wait for API permissions to propagate (up to 24 hours)
5. Restart monitor: `/Users/tbwa/run_zoho_monitor_background.sh`

### Authentication Issues

**Problem**: OAuth token errors or expired tokens  
**Solution**:
1. Refresh token: `pulser_mail_refresh`
2. Force token type: `python3 /Users/tbwa/update_zoho_token_type.py`
3. Check credentials file: `cat ~/.pulser/zoho_credentials.json | grep token_type`

### Email Sending Issues

**Problem**: Unable to send emails  
**Solution**:
1. Verify API unlock status: `/Users/tbwa/test_zoho_unlock.sh`
2. Test with API handler: `python3 /Users/tbwa/zoho_mail_cliq_handler.py send --to test@example.com --subject "Test" --body "Test email"`
3. Check logs for errors: `tail ~/.pulser/logs/mail_cliq_integration.log`

## 🔄 Maintenance Tasks

### Monthly
- Verify email aliases: `pulser_mail_aliases`
- Check DNS records: `dig insightpulseai.com MX` and `dig insightpulseai.com TXT`
- Log plan status: `python3 /Users/tbwa/zoho_service_events.py plan --name "Zoho Workplace Standard Plan"`

### After Zoho Updates
- Test API endpoints: `/Users/tbwa/test_zoho_unlock.sh`
- Update configuration if needed: `python3 /Users/tbwa/zoho_service_events.py status`
- Refresh token: `pulser_mail_refresh`

## 📝 Important File Locations

### Configuration
- OAuth Credentials: `~/.pulser/zoho_credentials.json`
- Mail Configuration: `~/.pulser/pulser_mail_config.json`
- Shell Functions: `~/.pulser_mail_functions`
- Cliq Provisioning: `/Users/tbwa/zoho_cliq_provisioning.yaml`

### Logs
- API Monitor Log: `~/zoho_api_unlock_monitor.log`
- Service Events: `~/.pulser/logs/zoho_service_events.json`
- Mail-Cliq Integration: `~/.pulser/logs/mail_cliq_integration.log`

## 🔒 Security Reference

### OAuth Token Management
- Tokens automatically refresh every hour
- No passwords stored in system
- Secure token storage in `~/.pulser/zoho_credentials.json`

### Email Authentication
- DKIM signing active for all outgoing emails
- SPF record includes Zoho Mail
- Domain verification record in place

## 📞 Support Resources

### Documentation
- Main report: `/Users/tbwa/ZOHO_INTEGRATION_REPORT.md`
- Admin guide: `/Users/tbwa/ZOHO_CLIQ_ADMIN_GUIDE.md`
- Command reference: `/Users/tbwa/ZOHO_COMMAND_REFERENCE.md`

### External Resources
- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/overview.html)
- [Zoho Cliq API Documentation](https://www.zoho.com/cliq/help/api/overview.html)
- Zoho Support: [support.zoho.com](https://support.zoho.com)

---

*For comprehensive information, refer to the main integration report and documentation files.*