
# Adding Yourself as a Test User to Your Google OAuth App

You're seeing the "App has not completed verification" message because your 
Google OAuth app is unverified. Since you're the developer, you can add yourself 
as a test user to access it during development.

## Instructions:

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials/consent?project=scout-443714

2. On the OAuth consent screen page, scroll down to "Test users" section

3. Click "ADD USERS"

4. Add your email address (jgtolentino.rn@gmail.com) as a test user

5. Click "SAVE" to update the OAuth consent screen

6. Try the OAuth flow again - you'll now see a "Continue" button when the warning appears

## Project Details:
- Project ID: scout-443714
- Client ID: 666362895770-4302qrr33d3oobmdo1c62hb1f9vosuev.apps.googleusercontent.com

## The Warning Message Will Still Appear

You'll still see the "unverified app" warning screen, but now there will be 
an option to continue. Click "Continue" to proceed with the OAuth flow.

## Next Steps After Adding Yourself:

1. Try authorizing again:
   ```bash
   cd ~/Documents/GitHub/InsightPulseAI_SKR
   python3 scripts/authorize_google_oauth.py
   ```

2. When you see the warning, click "Continue" to proceed

3. Test the integration after authorization completes:
   ```bash
   python3 scripts/test_google_api.py
   ```

NOTE: This is expected for development. For production use with other users,
you would need to complete Google's verification process.
