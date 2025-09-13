# Voice Calendar Agent Deployment Package

This package contains everything you need to deploy and configure the Voice Calendar Agent for Pulser.

## Package Contents

- `install.sh`: Automated installation script
- `pulserrc_patch.yaml`: Configuration patch for Pulser runtime
- `.env.template`: Environment variables template
- `voice_calendar_test_input.json`: Sample test input
- `google_calendar_setup.md`: Google Calendar API setup guide
- `elevenlabs_setup.md`: ElevenLabs TTS setup guide

## Quick Installation

1. Run the installation script:

```bash
bash install.sh
```

2. Follow the on-screen instructions to complete configuration

## Manual Installation

If you prefer to install components manually:

### 1. Environment Setup

Copy the environment template and fill in your API keys:

```bash
cp .env.template ~/.env
nano ~/.env  # Edit with your actual API keys
```

### 2. Pulser Configuration

Add the Voice Calendar configuration to your `.pulserrc`:

```bash
cat pulserrc_patch.yaml >> ~/.pulserrc
```

### 3. Set up API Credentials

Follow the guides in:
- `google_calendar_setup.md`
- `elevenlabs_setup.md`

### 4. Add Shell Alias

Add this to your `.zshrc` or equivalent:

```bash
alias :voice_calendar="pulser task run voice_calendar --voice"
```

## Testing

Test the agent with the provided sample input:

```bash
pulser simulate agents/voice_calendar.agent.yaml --input voice_calendar_test_input.json
```

## Agent Usage

Once installed, you can use the Voice Calendar Agent with:

```bash
:voice_calendar "Schedule a meeting with the team tomorrow at 10 AM"
```

## Troubleshooting

If you encounter issues:

1. Check API keys in your `.env` file
2. Verify OAuth credentials are set up correctly
3. Make sure the agent YAML is in the correct location
4. Check logs in `~/.pulser/logs/`

For detailed troubleshooting, see the API-specific setup guides in this package.