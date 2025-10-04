# Environment Variables Setup Guide

## 📝 Quick Setup

### 1. Create `.env.local` file

In your `frontend/` directory, create a file named `.env.local`:

```bash
cd frontend
touch .env.local
```

### 2. Add Your Keys

Open `.env.local` and add:

```bash
# ElevenLabs Configuration (Required for WebSocket mode)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: ElevenLabs API Key (for legacy mode)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here

# Optional: Google TTS API Key (for legacy mode)
NEXT_PUBLIC_GOOGLE_TTS_API_KEY=your_google_api_key_here

# Backend Services (usually these defaults work fine)
NEXT_PUBLIC_BACKEND_CHAT_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_VOICE_URL=http://localhost:8001
NEXT_PUBLIC_TALKINGHEAD_URL=http://localhost:8080
```

### 3. Get Your ElevenLabs Agent ID

1. Go to [ElevenLabs Conversational AI Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Select your agent or create a new one
3. Copy the **Agent ID** from the URL or settings
4. Paste it into `.env.local`

Example:
```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=abc123xyz789
```

### 4. Restart Your Dev Server

After adding keys, restart Next.js:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🎯 What Each Key Does

### Required:

**`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`**
- **Required for**: WebSocket mode (live conversation)
- **Where to get it**: ElevenLabs Dashboard → Conversational AI → Your Agent
- **What it does**: Identifies which AI agent to connect to

### Optional:

**`NEXT_PUBLIC_ELEVENLABS_API_KEY`**
- **Required for**: Legacy mode with ElevenLabs TTS
- **Where to get it**: ElevenLabs Dashboard → Profile → API Keys
- **What it does**: Authenticates API calls for text-to-speech

**`NEXT_PUBLIC_GOOGLE_TTS_API_KEY`**
- **Required for**: Legacy mode with Google TTS
- **Where to get it**: Google Cloud Console → APIs & Services → Credentials
- **What it does**: Authenticates Google Text-to-Speech API calls

---

## ✅ Verify Configuration

After setup, open your `/call` page and click the hamburger menu (☰). You should see:

```
🔧 Configuration Status
✅ Agent ID configured
⚪ ElevenLabs API Key (optional)
⚪ Google TTS (optional, for legacy mode)
```

If you see ❌ next to "Agent ID configured", double-check your `.env.local` file.

---

## 🔒 Security

- ✅ `.env.local` is in `.gitignore` (your keys won't be committed)
- ✅ Keys are loaded at build time and embedded in the client bundle
- ⚠️ `NEXT_PUBLIC_` variables are **publicly accessible** in the browser
- ⚠️ For production, use signed URLs or server-side auth

### For Production:

Instead of exposing the Agent ID publicly, implement signed URL generation:

1. Create an API route in Next.js
2. Call ElevenLabs API server-side with your API key
3. Return a signed URL to the client
4. Use signed URL instead of Agent ID

See the [Advanced Configuration](#advanced-configuration) section below.

---

## 🚀 What Changed

### Before (Manual Entry):
- Had to enter API keys in the UI settings
- Keys stored in `sessionStorage`
- Had to re-enter after clearing browser data
- Multiple input fields cluttering the UI

### After (Environment Variables):
- Keys loaded from `.env.local`
- Configured once, works forever
- Clean, simplified UI
- Configuration status displayed automatically

---

## 🎨 Simplified Settings Panel

The hamburger menu now shows:

### 1. Configuration Status
- Visual check marks showing what's configured
- Helpful hints for missing keys

### 2. Manual Avatar Control
- Make the avatar speak custom text (for testing)

### 3. Connection Mode
- WebSocket (Live) vs Legacy Mode

### 4. Avatar Voice
- TalkingHead TTS (perfect lip-sync) 
- Agent Voice (experimental)

### 5. Session Control
- Big green/red button to start/stop conversations
- Clear status indicators

---

## 📖 Example `.env.local`

Here's a complete example:

```bash
# Your ElevenLabs Agent (required)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=ZjA5M2QxNWItYjQ4Zi00

# Optional: Only needed for legacy mode
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_abc123xyz789
NEXT_PUBLIC_GOOGLE_TTS_API_KEY=AIzaSyABC123XYZ789

# Backend URLs (these usually don't change)
NEXT_PUBLIC_BACKEND_CHAT_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_VOICE_URL=http://localhost:8001
NEXT_PUBLIC_TALKINGHEAD_URL=http://localhost:8080
```

---

## 🛠️ Troubleshooting

### Issue: "Agent ID missing" even after adding to `.env.local`

**Solution:** Restart your dev server (Ctrl+C, then `npm run dev`)

### Issue: Can't find `.env.local`

**Solution:** Make sure you're in the `frontend/` directory, not the root

### Issue: Keys not loading

**Solution:** 
1. Check file name is exactly `.env.local` (not `.env` or `env.local`)
2. Check variables start with `NEXT_PUBLIC_`
3. Restart dev server

### Issue: "Please configure your ElevenLabs Agent ID"

**Solution:** 
1. Verify the Agent ID in your ElevenLabs dashboard
2. Copy the exact ID (no spaces)
3. Add to `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_id`
4. Restart server

---

## 🔮 Advanced Configuration

### Using Signed URLs (Production)

Create `app/api/elevenlabs/signed-url/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const agentId = process.env.ELEVENLABS_AGENT_ID; // Note: No NEXT_PUBLIC_
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
    {
      headers: {
        'xi-api-key': apiKey,
      },
    }
  );
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

Then use it in your hook:

```typescript
// Fetch signed URL from your API
const response = await fetch('/api/elevenlabs/signed-url');
const { signed_url } = await response.json();

// Use signed URL instead of agent ID
useElevenLabsAgent({
  signedUrl: signed_url,
  // ...
});
```

---

## 📚 Additional Resources

- [ElevenLabs Agents Platform](https://elevenlabs.io/docs/agents-platform)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)

---

**Need help?** Check the browser console for detailed error messages.
