# Quick Start Guide - ElevenLabs WebSocket

## 🚀 How to Start a Conversation

### Step 1: Open Settings
1. Go to `/call` page
2. Click the **hamburger menu (☰)** in the top left corner

### Step 2: Configure Agent ID
1. In the settings panel, you'll see **"ElevenLabs Agent ID"** with a red asterisk (*)
2. Enter your Agent ID (get it from https://elevenlabs.io/app/conversational-ai)
3. Click **"Save"** button

### Step 3: Start the Session
You'll see a new section at the bottom of the settings:

```
┌─────────────────────────────────────┐
│  ⚫ Disconnected                     │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  🎤 Start Conversation Session │ │  ← Click this button!
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Click the green **"Start Conversation Session"** button

### Step 4: Look for Connection Indicators

Once connected, you'll see:

#### In the header (next to "AI Therapy Session"):
```
🟢 Live
```

#### In the settings panel:
```
🟢 Connected to Agent
```

#### In the video area (top center):
When NOT connected, you'll see a message:
```
Click "Start Conversation Session" in settings to begin
```

When connected, this message disappears!

#### In the captions area (bottom left):
```
🟢 Live Connection Active
```

### Step 5: Start Talking!
Once you see "Connected to Agent":
- Just start speaking naturally
- The agent will respond in real-time
- Transcripts will appear in the caption area

## 🔍 Debugging

### Check Browser Console
Open browser console (F12 or Cmd+Option+I) and look for:

**When clicking "Start Conversation Session":**
```
🎙️ Toggle conversation clicked
🚀 Starting conversation with Agent ID: [your-agent-id]
🎤 Requesting microphone permission...
✅ Microphone permission granted
🔌 Initiating WebSocket connection...
🔧 Starting ElevenLabs conversation...
🌐 Using public agent ID: [your-agent-id]
🔌 Connecting to WebSocket: wss://api.elevenlabs.io/...
✅ WebSocket connected to ElevenLabs agent
🎤 Starting audio streaming...
✅ Conversation started successfully
```

### Common Issues:

#### ❌ "Please enter your ElevenLabs Agent ID"
**Fix:** Enter and save your Agent ID in the settings

#### ❌ Microphone permission denied
**Fix:** 
1. Click the 🔒 icon in browser address bar
2. Allow microphone access
3. Refresh the page

#### ❌ WebSocket fails to connect
**Check:**
- Is your Agent ID correct? (no extra spaces)
- Do you have internet connection?
- Is the agent active in your ElevenLabs dashboard?

#### ⚠️ Nothing happens when clicking button
**Check console for errors:**
- Look for red error messages
- Share them for debugging

## 📊 Visual Indicators Summary

| Location | When Disconnected | When Connected |
|----------|------------------|----------------|
| Header | 🔴 Offline | 🟢 Live |
| Settings Status | ⚫ Disconnected | 🟢 Connected to Agent |
| Settings Button | Green "Start Conversation Session" | Red "End Session" |
| Video Overlay | "Click Start..." message | (hidden) |
| Caption Area | (none) | 🟢 Live Connection Active |

## 🎯 Expected Flow

1. Open page → Settings closed, "Offline" indicator
2. Open settings → See "WebSocket (Live)" mode selected
3. Enter Agent ID → Click Save
4. Click "Start Conversation Session" → Button turns red, shows "End Session"
5. See indicators → All show "Connected" / "Live"
6. Start speaking → See transcripts appear
7. Agent responds → Hear audio, see response text

## 💡 Pro Tips

- Keep settings panel open when first testing to see all indicators
- Watch browser console for detailed logs
- The avatar will lip-sync with agent responses automatically
- You can interrupt the agent by speaking while it's talking
- Click "End Session" to stop the conversation cleanly
