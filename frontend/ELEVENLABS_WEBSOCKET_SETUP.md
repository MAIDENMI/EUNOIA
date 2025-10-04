# ElevenLabs WebSocket Integration Guide

## Overview

The `/call` page now supports **real-time conversational AI** using ElevenLabs Agent WebSocket API. This provides a seamless, live interaction experience with your AI avatar.

## Features

✅ **Real-time voice conversation** - Stream audio directly to/from ElevenLabs agents
✅ **Live transcription** - See user speech transcribed in real-time  
✅ **Audio playback queue** - Smooth audio playback without overlapping
✅ **Connection status indicators** - Visual feedback for WebSocket connection
✅ **Automatic interruption handling** - Agent stops speaking when interrupted
✅ **Avatar lip sync** - TalkingHead avatar syncs with agent responses
✅ **Dual mode support** - Switch between WebSocket and legacy mode

## Setup Instructions

### 1. Get Your ElevenLabs Agent ID

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Create a new Conversational AI Agent or select an existing one
3. Copy the **Agent ID** from the agent settings
4. For public agents, no additional authentication is needed
5. For private agents, you'll need to implement signed URL generation (see Advanced Setup)

### 2. Configure the Application

1. Start your application and navigate to `/call`
2. Click the **hamburger menu** (☰) in the top-left to open settings
3. Under **Connection Mode**, select **"WebSocket (Live)"**
4. Enter your **ElevenLabs Agent ID** in the input field
5. Click **Save** to persist the configuration

### 3. Start Conversing

1. Click the **microphone icon** in the control dock at the bottom
2. Wait for the **"Live Connection Active"** indicator to appear
3. Start speaking! The agent will respond in real-time
4. The avatar will automatically lip-sync with the agent's responses

## How It Works

### Architecture

```
User Microphone 
    ↓ (Audio Stream)
voice-stream package 
    ↓ (Base64 encoded chunks)
WebSocket Connection 
    ↓
ElevenLabs Agent API
    ↓ (Transcription + AI Response + Audio)
WebSocket Connection
    ↓
Audio Queue Manager
    ↓ (Playback)
Browser Audio + TalkingHead Avatar
```

### Key Components

#### 1. **useElevenLabsAgent Hook** (`src/hooks/useElevenLabsAgent.ts`)
- Manages WebSocket connection to ElevenLabs
- Handles audio streaming from microphone
- Processes incoming events (transcripts, responses, audio)
- Provides conversation control methods

#### 2. **useAudioQueue Hook** (`src/hooks/useAudioQueue.ts`)
- Manages audio playback queue
- Prevents overlapping audio chunks
- Handles audio interruptions gracefully

#### 3. **WebSocket Event Types** (`src/types/elevenlabs-websocket.ts`)
- TypeScript definitions for all WebSocket events
- Ensures type safety throughout the application

## Features Breakdown

### Connection Management

```typescript
const {
  startConversation,    // Start WebSocket connection
  stopConversation,     // Close WebSocket connection
  isConnected,          // Connection status
  isAgentSpeaking,      // Audio playback status
  error,                // Error messages
} = useElevenLabsAgent({ agentId });
```

### Event Callbacks

The hook provides callbacks for various events:

- **onUserTranscript** - Fired when user speech is transcribed
- **onAgentResponse** - Fired when agent generates a text response
- **onAgentResponseCorrection** - Fired when agent corrects its response
- **onInterruption** - Fired when conversation is interrupted
- **onConnectionStatusChange** - Fired when connection status changes

### Audio Handling

Audio chunks from ElevenLabs are automatically:
1. Queued for sequential playback
2. Converted from Base64 to audio blobs
3. Played through browser audio API
4. Synchronized with TalkingHead avatar for lip sync

### Visual Indicators

The UI provides real-time feedback:

- 🟢 **Green indicator** - WebSocket connection active
- 🔵 **Blue caption** - User transcript
- 🟣 **Purple caption** - Agent response
- ⚪ **Bouncing dots** - Agent is thinking/speaking

## Advanced Configuration

### Using Signed URLs (Private Agents)

For private agents, you need to generate a signed URL server-side:

```typescript
// Server-side (API route)
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
  {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
  }
);

const { signed_url } = await response.json();
// Return signed_url to client
```

Then use it in the hook:

```typescript
const { startConversation } = useElevenLabsAgent({
  signedUrl: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...&token=...',
});
```

### Contextual Updates

Send non-interrupting context to the agent:

```typescript
const { sendContextualUpdate } = useElevenLabsAgent({ agentId });

// Send context without interrupting conversation
sendContextualUpdate("User clicked on pricing page");
```

### Manual Interruption

Interrupt the agent programmatically:

```typescript
const { interruptAgent } = useElevenLabsAgent({ agentId });

// Stop agent speaking immediately
interruptAgent();
```

## Troubleshooting

### Issue: "Please enter your ElevenLabs Agent ID"
**Solution:** Make sure you've entered and saved your Agent ID in the settings panel.

### Issue: "Microphone access is required"
**Solution:** Grant microphone permissions in your browser settings and refresh the page.

### Issue: WebSocket connection fails
**Solutions:**
- Verify your Agent ID is correct
- Check browser console for detailed error messages
- Ensure you're using a modern browser (Chrome, Edge, Safari)
- For private agents, implement signed URL generation

### Issue: Audio is choppy or overlapping
**Solution:** The audio queue should prevent this. If it persists, check your network connection and browser audio settings.

### Issue: Avatar doesn't lip sync
**Solution:** Ensure the TalkingHead iframe is loaded and the `talkingHeadRef` is properly initialized.

## Legacy Mode

If you need to use the original backend-based approach:

1. Open settings
2. Select **"Legacy Mode"** under Connection Mode
3. Configure your Google/ElevenLabs API keys
4. Use the voice chat as before

## API Reference

### ElevenLabs Agent WebSocket API

**Endpoint:** `wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}`

**Client → Server Events:**
- `user_audio_chunk` - Audio data from microphone (Base64)
- `contextual_update` - Non-interrupting context information
- `pong` - Response to ping (keep-alive)

**Server → Client Events:**
- `ping` - Keep-alive request
- `user_transcript` - User speech transcription
- `agent_response` - Agent text response
- `agent_response_correction` - Corrected response
- `audio` - Agent audio response (Base64)
- `interruption` - Conversation interrupted

## Resources

- [ElevenLabs Agent WebSocket Documentation](https://elevenlabs.io/docs/agents-platform/libraries/web-sockets)
- [ElevenLabs Conversational AI Dashboard](https://elevenlabs.io/app/conversational-ai)
- [voice-stream NPM Package](https://www.npmjs.com/package/voice-stream)

## Next Steps

1. **Custom Agent Configuration** - Configure your agent's personality, voice, and behavior in the ElevenLabs dashboard
2. **Add Tools** - Integrate tools and knowledge bases with your agent
3. **Analytics** - Track conversation metrics and improve agent performance
4. **Production Deployment** - Implement signed URLs for secure production use

---

**Need help?** Check the browser console for detailed logs and error messages.
