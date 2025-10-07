# Claude API Key Management for Pulser CLI

This guide explains how to set up and manage your Claude API key for Pulser CLI.

## Why You Need a Claude API Key

When using Pulser CLI in the following modes, a Claude API key is required:

- `api` mode - Always uses Claude API
- `adaptive` mode - Uses Claude API for complex tasks

In `local` mode, no API key is needed as DeepSeekr1 is used locally.

## Setting Up Your API Key

### Method 1: Using the Pulser CLI

1. Launch the Pulser CLI
2. Use the `/apikey` command:
   ```
   /apikey set YOUR_API_KEY
   ```
3. Your key will be saved and automatically validated

### Method 2: Using the Setup Script

We've provided a helper script to set up your API key:

```bash
./fix_claude_api_key.sh
```

The script will guide you through setting up or updating your API key.

### Method 3: Setting Environment Variable

You can also set the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

This is useful for temporary usage without saving the key to disk.

## Verifying Your API Key

To check if your API key is working:

```
/apikey validate
```

This will make a test request to the Claude API to verify your key is valid.

## Removing Your API Key

If you want to remove your saved API key:

```
/apikey clear
```

## API Key Location

Your API key is stored at:

```
~/.pulser/claude_api_key.txt
```

The file contains just the API key and nothing else.

## Switching Modes

If you don't have a Claude API key, you can still use Pulser CLI in `local` mode:

```
/mode local
```

This will use the DeepSeekr1 local model exclusively.

## Troubleshooting

If you experience API key issues:

1. Verify you have a valid key with `/apikey validate`
2. Check that your key starts with `sk-ant-`
3. Try running the `./fix_claude_api_key.sh` script
4. Switch to local mode with `/mode local` if you can't obtain a valid API key

## Security

Your API key is stored as plain text in the configuration file. To ensure security:

- Never share your API key with others
- Never commit the key to version control systems
- Set appropriate file permissions on the config directory

## Getting a Claude API Key

To obtain a Claude API key:

1. Sign up for an Anthropic account at [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the key (you'll only see it once)
5. Set it in Pulser CLI as described above