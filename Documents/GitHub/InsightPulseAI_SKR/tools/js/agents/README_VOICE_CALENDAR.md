# Voice Calendar Agent

A Pulser 2.0 agent for voice-driven calendar management, leveraging InsightPulseAI's orchestration capabilities.

## Overview

The Voice Calendar Agent provides end-to-end voice control of calendar operations, connecting:
- **Echo** for speech-to-text processing
- **Claude** for natural language understanding and intent parsing
- **Caca** for quality validation of parsed intents
- **Google Calendar API** for event operations
- **ElevenLabs** for natural-sounding voice responses

## Agent Flow

```
Voice Input → Echo (STT) → Claude (Intent Parsing) → Caca (Validation) 
→ Google Calendar API (Action) → ElevenLabs (TTS) → Voice Response
```

## Supported Operations

| Intent | Description | Example Phrase |
|--------|-------------|----------------|
| create | Add new calendar events | "Schedule a call with Jake tomorrow at 2 PM" |
| update | Modify existing events | "Move my dentist appointment to Friday at 3 PM" |
| delete | Remove calendar events | "Cancel my lunch meeting on Thursday" |
| list | Show upcoming events | "What meetings do I have this week?" |

## Integration with Pulser

The agent is fully integrated with Pulser's ecosystem:
- **Claudia** manages orchestration and session management
- **Echo** handles voice transcription with high accuracy
- **Caca** ensures quality control and error detection
- Event metadata is stored in **Kalaw** for reference

## Testing and Deployment

Run a test with the following command:

```bash
:task voice_calendar --voice "Schedule a call with Jake tomorrow at 2 PM"
```

## Configuration

Default configuration is set in `voice_calendar.agent.yaml`. For custom setups, consider:

1. Modifying ElevenLabs voice model (currently uses default)
2. Adjusting Claude's prompt for specialized calendar needs
3. Adding post-action callbacks for notifications
4. Setting up custom error handling workflows

## Security Considerations

- OAuth flows handle Google Calendar authentication
- Voice commands are processed locally before API transmission
- No persistent storage of calendar data outside of Google's services
- All voice samples are discarded after processing