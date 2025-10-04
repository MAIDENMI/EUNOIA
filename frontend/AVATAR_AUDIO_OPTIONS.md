# Avatar Audio & Lip-Sync Options

## 🎭 The Trade-Off: Voice Quality vs Lip-Sync Accuracy

You now have **two options** for how your avatar speaks during WebSocket conversations:

---

## Option 1: TalkingHead TTS (Recommended ✅)

**How it works:**
- ElevenLabs Agent provides conversation intelligence (understanding, responses)
- TalkingHead generates the actual voice using Google TTS or ElevenLabs standard voices
- Avatar lip-syncs perfectly to its own generated audio

### Pros:
✅ **Perfect lip-sync** - Voice and animation are perfectly synchronized  
✅ **No audio issues** - Reliable playback every time  
✅ **Simple and stable** - No complex audio processing  
✅ **Works immediately** - No additional setup needed

### Cons:
❌ **Different voice** - Won't match your ElevenLabs Agent's custom voice personality  
❌ **Generic quality** - Uses standard TTS voices (Rachel, etc.)

### Best for:
- Prototyping and testing
- When lip-sync accuracy is most important
- When voice personality is less critical

---

## Option 2: Agent Voice (Experimental ✨)

**How it works:**
- ElevenLabs Agent generates both conversation AND audio
- Agent's custom voice (with your configured personality) is used
- Audio is streamed through WebSocket in chunks
- TalkingHead lip-syncs to external audio

### Pros:
✅ **Authentic voice** - Uses your ElevenLabs Agent's actual voice personality  
✅ **High quality** - Professional voice with emotion and nuance  
✅ **Consistent brand** - Matches your agent's identity

### Cons:
❌ **Audio sync challenges** - Chunked streaming can cause gaps or overlaps  
❌ **Format issues** - May have codec compatibility problems  
❌ **Complex processing** - Requires audio buffering and timing estimation  
❌ **Experimental** - Still being refined

### Best for:
- Production deployments where voice brand is critical
- When you've configured a specific agent personality
- When you're willing to troubleshoot audio issues

---

## 🎛️ How to Switch

In the `/call` page settings panel:

1. Open settings (☰ menu)
2. Find **"Avatar Voice"** section
3. Choose:
   - **TalkingHead TTS** - Perfect lip-sync, generic voice
   - **Agent Voice** - Your agent's voice, experimental

The setting is only available in WebSocket mode.

---

## 🔍 Current Status

### What Works Now:
- ✅ WebSocket connection to ElevenLabs Agent
- ✅ Real-time transcription (user speech → text)
- ✅ AI conversation intelligence (agent understands and responds)
- ✅ Text responses displayed in UI
- ✅ **TalkingHead TTS with perfect lip-sync** (Option 1)

### What's Experimental:
- ⚠️ ElevenLabs Agent audio playback (Option 2)
- ⚠️ Lip-syncing to external audio streams
- ⚠️ Audio chunk buffering and timing

---

## 💡 Recommendation

**Start with Option 1 (TalkingHead TTS)** to get everything working smoothly:

1. Perfect lip-sync works out of the box
2. Reliable, stable experience
3. No audio codec issues
4. You can always switch to Agent Voice later

**Switch to Option 2 (Agent Voice)** when:

1. You've configured a unique voice personality in ElevenLabs
2. Voice branding is critical for your use case
3. You're ready to handle potential audio sync issues
4. You have time to troubleshoot and refine

---

## 🚀 Quick Test

To see both options in action:

1. Start a conversation with **TalkingHead TTS** selected
2. Notice the smooth, perfect lip-sync
3. End the conversation
4. Switch to **Agent Voice**
5. Start a new conversation
6. Compare the voice quality (should be higher) vs lip-sync accuracy

---

## 🛠️ Technical Details

### TalkingHead TTS Flow:
```
User Speech → ElevenLabs Agent → Text Response → TalkingHead TTS → Audio + Lip-Sync
```

### Agent Voice Flow:
```
User Speech → ElevenLabs Agent → Text + Audio Response → Audio Playback + Lip-Sync Estimation
```

### Why Agent Audio is Challenging:

1. **Chunked Streaming**: Audio arrives in multiple chunks over WebSocket
2. **Timing Unknown**: We don't know when chunks end or how long they are
3. **Format Variation**: Audio codec may not be browser-compatible
4. **Sync Estimation**: We have to guess word timings for lip-sync

### Why TalkingHead TTS is Easy:

1. **Single Process**: TTS generation and animation happen together
2. **Known Timing**: TalkingHead knows exactly when each word plays
3. **Compatible Format**: Always generates browser-compatible audio
4. **Perfect Control**: Full control over the audio → animation pipeline

---

## 📊 Comparison Table

| Feature | TalkingHead TTS ✅ | Agent Voice ✨ |
|---------|-------------------|----------------|
| **Lip-Sync Accuracy** | Perfect | Good (estimated) |
| **Voice Quality** | Standard TTS | High-quality, custom |
| **Setup Complexity** | Simple | Complex |
| **Reliability** | Very High | Experimental |
| **Voice Personality** | Generic | Your agent's personality |
| **Audio Issues** | None | Possible codec errors |
| **Best For** | Development, Testing | Production, Branding |

---

## 🔮 Future Improvements

Potential enhancements for Agent Voice option:

1. **Better Audio Buffering**: Smooth chunk transitions
2. **Format Detection**: Auto-detect and handle any audio codec
3. **Word-Level Timing**: Get precise timing from ElevenLabs API
4. **Phoneme Matching**: More accurate lip-sync using phoneme data
5. **Fallback Logic**: Auto-switch to TalkingHead TTS if Agent audio fails

---

## ❓ FAQ

**Q: Which option should I use right now?**  
A: Use **TalkingHead TTS** for the best experience.

**Q: Will Agent Voice work without issues?**  
A: It's experimental and may have audio playback issues.

**Q: Can I change mid-conversation?**  
A: Yes, but end the current session first, switch, then start a new session.

**Q: Does the agent's intelligence change?**  
A: No! The ElevenLabs Agent's conversation intelligence is the same for both options. Only the voice generation changes.

**Q: Can I use a custom voice with TalkingHead TTS?**  
A: TalkingHead supports Google TTS and ElevenLabs standard voices. Configure these in the legacy settings.

---

**Current Default: TalkingHead TTS** - Recommended for best experience! 🎯
