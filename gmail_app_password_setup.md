# Setting Up Gmail App Password for Email Testing

To use the Pulser email testing script with Gmail, you'll need to set up an App Password. This is a special password that allows applications to access your Gmail account without requiring your main password.

## Step 1: Enable 2-Step Verification

Before you can create an App Password, you need to enable 2-Step Verification on your Google Account:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click on "Security" in the left navigation
3. Look for "2-Step Verification" under "Signing in to Google"
4. Click on "2-Step Verification" and follow the steps to turn it on

## Step 2: Create an App Password

Once 2-Step Verification is enabled:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click on "Security" in the left navigation
3. Under "Signing in to Google", click on "App passwords"
4. If prompted, enter your Google Account password
5. At the bottom, click "Select app" and choose "Mail"
6. Click "Select device" and choose "Other"
7. Enter "Pulser Email Testing" as the name
8. Click "Generate"
9. Google will display a 16-character app password
10. Copy this password - this is the only time you'll be able to see it

## Step 3: Use the App Password

You can now use this app password with the email testing script in either of two ways:

1. Set an environment variable:
   ```bash
   export GMAIL_APP_PASSWORD="your-16-character-app-password"
   python3 /Users/tbwa/send_test_emails.py --recipient your.email@example.com
   ```

2. Enter it manually when prompted by the script:
   ```bash
   python3 /Users/tbwa/send_test_emails.py --recipient your.email@example.com
   # Enter Gmail App Password: [paste your app password here]
   ```

## Security Note

- App passwords are 16 characters long with no spaces
- Each app password can only be used with the application it was created for
- App passwords don't expire, but you can revoke them at any time
- Never share your app passwords with anyone

## Troubleshooting

If you encounter any issues:

1. Make sure 2-Step Verification is enabled
2. Verify you're using the correct app password
3. Check if your Gmail account has any security restrictions
4. Ensure less secure app access is not blocked

For Pulser's production email setup, you will eventually use Zoho Mail with its own app-specific passwords, following a similar process.
