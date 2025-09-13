# Pulser CLI API Keys Example

Here's how to properly configure your API keys for the Pulser CLI.

## Example 1: API Keys JSON File

Edit `~/.pulser/config/api_keys.json`:

```json
{
  "anthropic": "sk-ant-api03-JxDbwqQ2_c_kRvXnxhO3MoIKOw_WNWlUTEoQI_example",
  "openai": "sk-K59ZjnF8O2WvcAJ2uW8bT3BlbkjJP2cR5kK_example"
}
```

## Example 2: Environment Variables

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Pulser API Keys
export ANTHROPIC_API_KEY="sk-ant-api03-JxDbwqQ2_c_kRvXnxhO3MoIKOw_WNWlUTEoQI_example"
export OPENAI_API_KEY="sk-K59ZjnF8O2WvcAJ2uW8bT3BlbkjJP2cR5kK_example"
```

## Example 3: Dedicated API Key Files

Create files containing just your API keys:

```bash
# For Anthropic
mkdir -p ~/.anthropic
echo "sk-ant-api03-JxDbwqQ2_c_kRvXnxhO3MoIKOw_WNWlUTEoQI_example" > ~/.anthropic/api_key

# For OpenAI
mkdir -p ~/.openai
echo "sk-K59ZjnF8O2WvcAJ2uW8bT3BlbkjJP2cR5kK_example" > ~/.openai/api_key
```

## Getting API Keys

### Anthropic API Keys

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Name your key (e.g., "Pulser CLI")
6. Copy the key - it will only be shown once!

### OpenAI API Keys

1. Go to [https://platform.openai.com/](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Name your key (e.g., "Pulser CLI")
6. Copy the key - it will only be shown once!

## Testing Your Configuration

After configuring your API key(s), test that it's working:

```bash
# Test Anthropic
pulser --provider anthropic "Hello, world!"

# Test OpenAI
pulser --provider openai "Hello, world!"
```

If everything is configured correctly, you should get a response from the LLM provider.

## Security Best Practices

1. **Never share your API keys**: They grant access to paid services
2. **Never commit API keys to Git**: Use .gitignore for config files
3. **Set appropriate permissions**: Make sure your key files are only readable by you
   ```bash
   chmod 600 ~/.anthropic/api_key ~/.openai/api_key ~/.pulser/config/api_keys.json
   ```
4. **Rotate keys periodically**: Especially if you suspect they may be compromised
5. **Use environment variables in scripts**: Avoid hardcoding keys in scripts

Remember that API usage may incur charges to your account, so monitor your usage on the provider's dashboard.