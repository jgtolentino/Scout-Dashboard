# Job Application Auto-Responder

This system automatically responds to job applications for the Human x Agent Growth Team at InsightPulseAI. It monitors the business@insightpulseai.com inbox for applications and sends a confirmation email.

## Components

1. **Application Confirmation Template**: `/Users/tbwa/application_confirmation_response.md`
   - Professional response confirming receipt of application
   - Outlines next steps in the hiring process
   - Can be modified without changing the script

2. **Auto-Responder Script**: `/Users/tbwa/application_autoresponder.sh`
   - Monitors for new applications via the Zoho Mail API
   - Sends confirmation emails using the template
   - Logs all activity for tracking

3. **Log Files**:
   - `~/application_responses.log` - Records all confirmation emails sent
   - `~/new_applications.log` - Tracks new applications received

## Usage

### Manual Execution

Run the script manually to process any pending applications:

```bash
/Users/tbwa/application_autoresponder.sh
```

### Automated Execution

Set up a cron job to run the script at regular intervals (e.g., every 30 minutes):

```bash
# Add to crontab with: crontab -e
*/30 * * * * /Users/tbwa/application_autoresponder.sh
```

### Monitoring

Check the logs to monitor application activity:

```bash
# View recent confirmations sent
tail -10 ~/application_responses.log

# View new applications received
tail -10 ~/new_applications.log
```

## Customization

To modify the confirmation email, simply edit the content in:
`/Users/tbwa/application_confirmation_response.md`

The script will automatically use the updated content for all future responses.

## Dependencies

This script relies on:
- `~/.pulser_mail_functions` - Contains the Zoho Mail API integration
- Valid Zoho Mail API credentials in `/Users/tbwa/.pulser/zoho_credentials.json`
- `jq` for JSON parsing (pre-installed)

## Troubleshooting

If the auto-responder is not working:

1. Check API status: `source ~/.pulser_mail_functions && pulser_mail_status`
2. Verify script permissions: `ls -la /Users/tbwa/application_autoresponder.sh`
3. Check for errors in `~/application_autoresponder.log`