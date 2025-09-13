# Quick Fix for Google OAuth Access

## Add Yourself as a Test User

To fix the "App has not completed verification" message, you need to add yourself as a test user:

1. Go directly to:
   [Add Test Users for scout-443714](https://console.cloud.google.com/apis/credentials/consent/edit/test-users?project=scout-443714)

2. Click "ADD USERS"

3. Enter your email: `jgtolentino.rn@gmail.com`

4. Click "SAVE"

## Try Again

Now try the OAuth flow again:

```bash
cd ~/Documents/GitHub/InsightPulseAI_SKR
python3 scripts/authorize_google_oauth.py
```

When you see the warning screen, you'll now see an option to continue. Click "Continue" to proceed with authorization.

## Why This Happens

This happens because your OAuth app is in "Testing" mode, which limits access to test users only. This is normal during development and doesn't require verification from Google.

## Alternative: Use Service Account

If OAuth is too troublesome, you can use a service account instead:

1. Go to: [Create Service Account](https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=scout-443714)

2. Name: "pulser-service"

3. Create & download a JSON key

4. Place the JSON key in: `~/.pulser_secrets/service_account.json`

5. Update `.env.google` to use service account instead of OAuth:
   ```
   GOOGLE_AUTH_TYPE=service
   GOOGLE_SERVICE_ACCOUNT_KEY=~/.pulser_secrets/service_account.json
   ```

Service accounts don't require the OAuth flow or user consent, but they can't access user data. They work well for accessing public APIs and resources explicitly shared with the service account email.