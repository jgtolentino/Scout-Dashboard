# InsightPulseAI Zoho Integration

## Overview

This repository contains the complete Zoho Mail and Cliq integration for InsightPulseAI, providing email communication, team collaboration, and workflow automation capabilities.

## Current Status

- **Mail API**: Partially operational - Zoho Workplace Standard Plan subscription processing
- **OAuth Authentication**: Successfully configured
- **DNS Records**: Properly configured (MX, SPF, DKIM, Verification)
- **Email Aliases**: Configured and ready for use
- **Cliq Setup**: Templates prepared for implementation

## Quick Start

### Check Status
```bash
# Load mail functions
source ~/.pulser_mail_functions

# Check configuration status
pulser_mail_status

# Show available email aliases
pulser_mail_aliases
```

### Monitor API Unlock
```bash
# Test if API is fully unlocked
/Users/tbwa/test_zoho_unlock.sh

# Check unlock progress log
tail -20 ~/zoho_api_unlock_monitor.log
```

## Documentation

### Core Files
- [Integration Report](/Users/tbwa/ZOHO_INTEGRATION_REPORT.md) - Comprehensive status report
- [Command Reference](/Users/tbwa/ZOHO_COMMAND_REFERENCE.md) - All available commands
- [Quick Reference](/Users/tbwa/ZOHO_QUICK_REFERENCE.md) - Common tasks and troubleshooting
- [Cliq Admin Guide](/Users/tbwa/ZOHO_CLIQ_ADMIN_GUIDE.md) - Step-by-step admin console setup

### Additional Resources
- [Setup Checklist](/Users/tbwa/ZOHO_SETUP_CHECKLIST.md) - Task tracking
- [Interim Status](/Users/tbwa/ZOHO_INTEGRATION_INTERIM.md) - Interim functionality guide
- [DNS Configuration](/Users/tbwa/zoho_dns_records.md) - DNS record details

## Configuration

### Mail Configuration
The system is configured with:
- OAuth authentication
- Secure token management
- Two email aliases: pulser@insightpulseai.com and pulser-ai@insightpulseai.com
- DKIM signing for email authenticity
- Automatic token refresh

### Cliq Configuration
Cliq integration templates include:
- Department structure
- Role-based access control
- 6 channels for different purposes
- 3 bots for automation
- Mail notification integration

## Scripts & Tools

### Core Functionality
- `~/.pulser_mail_functions` - Shell functions for mail operations
- `/Users/tbwa/monitor_zoho_api_unlock.py` - API monitor
- `/Users/tbwa/test_zoho_unlock.sh` - API unlock tester
- `/Users/tbwa/zoho_service_events.py` - Service event tracker

### Installation
- `/Users/tbwa/zoho_integration_installer.sh` - One-page installer

## Next Steps

1. **Wait for API Activation**
   - Monitor will notify when fully available (usually 5-15 minutes, up to 24 hours)

2. **Test Full Functionality**
   - Run comprehensive tests once unlocked
   - Verify email sending capabilities

3. **Implement Cliq Configuration**
   - Follow admin guide for console setup
   - Create departments, roles, users, channels, and bots

4. **Configure Email Notifications**
   - Connect email system to Cliq channels
   - Set up bot commands for email operations

## Troubleshooting

For troubleshooting guidance, refer to the [Quick Reference Guide](/Users/tbwa/ZOHO_QUICK_REFERENCE.md).

## Security

- OAuth tokens stored securely
- No plaintext passwords
- Automatic token refresh
- DKIM signing for email authenticity
- Role-based access control

## About

This integration was developed for InsightPulseAI to enable seamless communication and collaboration using Zoho's enterprise-grade email and team chat platforms.

---

*Documentation and implementation completed May 10, 2025*