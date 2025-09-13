# ElevenLabs Setup for Voice Calendar Agent

This guide explains how to set up ElevenLabs Text-to-Speech (TTS) for the Voice Calendar Agent.

## Prerequisites

- ElevenLabs account ([sign up here](https://elevenlabs.io/))
- Voice Calendar Agent installed

## Setup Instructions

### 1. Create an ElevenLabs Account

If you don't already have an account, sign up at [ElevenLabs](https://elevenlabs.io/).

### 2. Get Your API Key

1. Log in to your ElevenLabs account
2. Go to your Profile settings
3. Navigate to the API section
4. Click "Create new API key" if you don't already have one
5. Copy your API key

### 3. Choose a Voice

1. Go to the "Voice Library" section in ElevenLabs
2. Browse the available voices and find one you like for your calendar assistant
3. Note the Voice ID (or name if you're using a preset voice like "Rachel")

### 4. Configure the Voice Calendar Agent

Add your ElevenLabs API key to your environment:

1. Open the `.env` file in your Voice Calendar Agent directory
2. Update the ElevenLabs settings:
   ```
   ELEVEN_API_KEY=your_elevenlabs_api_key_here
   ```

3. Optionally, update the voice in your `.pulserrc` file:
   ```yaml
   integrations:
     elevenlabs:
       voice: Rachel  # Or another voice name/ID you prefer
       model: eleven_multilingual_v2
   ```

### 5. Test Your ElevenLabs Integration

Run the following command to test that your ElevenLabs integration is working:

```bash
pulser test elevenlabs --text "This is a test of the Voice Calendar Agent's text to speech system."
```

You should hear the test message played back using your selected voice.

## Voice Options

Here are some recommended voices for your calendar assistant:

| Voice     | Style                 | Best For                        |
|-----------|----------------------|----------------------------------|
| Rachel    | Professional, clear  | Business settings               |
| Adam      | Authoritative        | Executive assistants            |
| Bella     | Friendly, warm       | Personal calendar assistant     |
| Antoni    | Formal, precise      | Technical environments          |
| Dorothy   | Calm, supportive     | Educational settings            |

You can change the voice at any time by updating the voice parameter in your configuration.

## Advanced Configuration

For more customization, you can adjust these parameters in your `.pulserrc`:

```yaml
integrations:
  elevenlabs:
    voice: Rachel
    model: eleven_multilingual_v2
    stability: 0.5  # 0-1, higher values for more consistent output
    clarity: 0.75   # 0-1, higher values for clearer enunciation
    style: 0.3      # 0-1, how much speaking style to apply
```

## Troubleshooting

If you encounter issues:

1. Verify your API key is correct and has not expired
2. Check that you have enough characters remaining in your ElevenLabs account
3. Ensure the voice you selected is available in your account
4. If audio is not playing, check your system sound settings

For more detailed information, refer to the [ElevenLabs API documentation](https://docs.elevenlabs.io/api-reference).