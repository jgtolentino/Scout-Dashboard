# Claude Code Authentication Upgrade Notes

## Issue
When upgrading from Claude Code free tier to Claude Max subscription, the authentication process failed to update properly. Interactive authentication commands (`claude auth login`) were not working in the terminal.

## Solution Applied
The manual reset method was used by editing the `~/.claude.json` configuration file:

1. Created a backup of the original config file
2. Reset the configuration to a minimal state that forces re-authentication
3. Preserved critical settings like theme preferences
4. Restarted Claude Code to trigger new authentication

## Technical Details
The configuration file (`~/.claude.json`) was reset to:
```json
{
  "numStartups": 1,
  "theme": "light-daltonized",
  "hasCompletedOnboarding": true,
  "userID": "44de79ffed8b1845046470d4bc35e5bd4778b5418253d243bf94377607bb5805"
}
```

This minimal configuration:
- Preserves the user's theme preference
- Retains the user ID
- Removes all authentication tokens
- Forces Claude Code to request new authentication on next start

## Feedback for Claude Support

### Issue Description
When upgrading from free tier to Claude Max, the authentication process fails to update automatically. The `claude auth login` command fails with "Raw mode is not supported" errors when run from terminal.

### Suggested Improvements
1. Provide a non-interactive auth reset option: `claude auth reset --force`
2. Add better error handling for authentication issues
3. Create automatic detection of subscription changes
4. Include documentation for manual configuration reset
5. Allow authentication refresh without requiring full restart

### Customer Impact
The current process creates friction during upgrades, potentially causing users to:
- Experience downtime during critical work
- Need technical knowledge to troubleshoot
- Risk data loss if configuration files are corrupted

## Future Authentication Process Recommendation
For a smoother upgrade experience:
1. Detect subscription changes automatically
2. Provide clear upgrade success/failure notifications
3. Implement a graceful transition between subscription tiers
4. Add self-healing for common authentication issues