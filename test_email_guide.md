# Testing HUMAN X AGENT Email Auto-Reply

This guide provides two methods to test the Zoho Mail auto-reply system with the specified subject line "PITCH FOR INSIGHTPULSEAI".

## Method 1: Shell Script

The shell script creates a basic email using the command-line mail utility (if available):

```bash
/Users/tbwa/send_test_email.sh
```

If the mail command isn't available, it will display a preview of the email and instructions for using Apple Mail.

## Method 2: Python Script (Recommended)

The Python script creates a more professional HTML email and attempts to open it in Apple Mail:

```bash
/Users/tbwa/generate_test_email.py
```

This script will:
1. Generate an HTML email file on your Desktop
2. Try to open Mail.app with the email pre-populated
3. If that fails, open the HTML file in your browser for copy/paste

## What to Check

After sending the test email to business@insightpulseai.com:

1. Verify you receive an auto-reply email
2. Check that the auto-reply has:
   - The correct subject: "Your InsightPulseAI HUMAN X AGENT Application Received"
   - Branded header
   - Timeline for response
   - Kath's signature

## Manual Testing via Mail App

If the scripts don't work for you, you can manually create a test email:

1. Open your email client (Apple Mail, Gmail, etc.)
2. Create a new email with:
   - To: business@insightpulseai.com
   - Subject: PITCH FOR INSIGHTPULSEAI
   - Body: A simple message expressing interest in the position
3. Send the email and wait for the auto-reply

## Troubleshooting

If no auto-reply is received:
1. Check spam/junk folders
2. Verify that the subject line is exactly "PITCH FOR INSIGHTPULSEAI" (all caps)
3. Confirm with Ate Joy that the auto-reply system is active