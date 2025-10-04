# 🎯 Practical Use Case - Modular Talking Head

## Working Example: Complete Integration

This guide shows exactly how to use all the extracted modules together in a real application.

---

## 📁 File Created

**`example-usage.html`** - A complete, working demonstration

---

## 🚀 How to Use

### 1. Open the Example
```bash
cd Backend/talkinghead
# Open in browser
open example-usage.html
# OR start a local server
python3 -m http.server 8000
# Then visit: http://localhost:8000/example-usage.html
```

### 2. What You'll See

A complete interface demonstrating:
- ✅ Avatar initialization
- ✅ ElevenLabs text-to-speech
- ✅ Gemini AI chat with streaming
- ✅ Whisper audio processing
- ✅ Configuration management

---

## 💡 Code Breakdown

### Step 1: Import Modules

```javascript
// Import TalkingHead library
import { TalkingHead } from "./modules/talkinghead.mjs";
import { site } from './siteconfig.js';

// Import your modular components
import { cfg, initConfig, saveConfig, jwtGet } from './js/utils.js';
import { API_PROXIES } from './js/config.js';
import { elevenSpeak, elevenClose } from './js/tts-elevenlabs.js';
import { geminiBuildMessage, geminiSendMessage } from './js/ai-gemini.js';
import { whisperLoadMP3, whisperPlay } from './js/audio-whisper.js';
```

### Step 2: Initialize Configuration

```javascript
// Load configuration from sessionStorage
initConfig();

// Access config values
const voiceType = cfg('voice-type');
const model = cfg('ai-model');

// Update config
cfg('voice-type', 'eleven');
saveConfig();
```

### Step 3: Create Avatar

```javascript
// Create TalkingHead instance
const head = new TalkingHead(container, {
  jwtGet: jwtGet,  // Use JWT function from utils
  ttsEndpoint: API_PROXIES.googleTTS,  // Use endpoint from config
  cameraView: 'upper',
  lipsyncModules: ["en"]
});

// Load avatar
await head.showAvatar({
  url: './avatars/brunette.glb',
  body: 'F',
  avatarMood: 'neutral'
});
```

### Step 4: Use ElevenLabs TTS

```javascript
// Speak text with ElevenLabs
const text = "Hello! This is ElevenLabs speaking.";
const outputNode = document.getElementById('output');

await elevenSpeak(
  head,           // TalkingHead instance
  text,           // Text to speak
  outputNode,     // DOM node for text display
  addTextToUI     // Callback function
);

// Stop speaking
head.stopSpeaking();
elevenClose();
```

### Step 5: Chat with Gemini

```javascript
// Build message array
const messages = [
  { role: 'user', content: 'Tell me a joke' }
];

// Create output container
const aiResponse = document.createElement('div');
aiResponse.dataset.output = '';
aiResponse.dataset.markdown = '';

// Send to Gemini with ElevenLabs TTS
await geminiSendMessage(
  head,           // TalkingHead instance
  site,           // Site configuration
  aiResponse,     // Output DOM node
  messages,       // Message array
  addTextToUI,    // Text display callback
  elevenSpeak     // Optional: TTS function
);
```

### Step 6: Process Audio with Whisper

```javascript
// Load and process MP3
const mp3File = document.getElementById('file-input').files[0];
await whisperLoadMP3(head, mp3File);

// Check if loaded
if (whisperIsLoaded()) {
  // Get detected language
  const lang = whisperGetLanguage();
  console.log(`Detected: ${lang}`);
  
  // Play with lip-sync
  await whisperPlay(head);
}
```

---

## 🎯 Real-World Use Cases

### Use Case 1: Voice-Activated Assistant

```javascript
import { elevenSpeak } from './js/tts-elevenlabs.js';
import { geminiBuildMessage, geminiSendMessage } from './js/ai-gemini.js';

// User speaks
const userInput = await speechRecognition.getTranscript();

// Send to Gemini
const messages = [{ role: 'user', content: userInput }];
await geminiSendMessage(head, site, output, messages, addText, elevenSpeak);

// Avatar speaks response with ElevenLabs
```

### Use Case 2: Educational Content Creator

```javascript
import { whisperLoadMP3, whisperPlay } from './js/audio-whisper.js';

// Upload audio lecture
await whisperLoadMP3(head, lectureFile);

// Get transcript for subtitles
const audioData = whisperGetAudio();
const words = audioData.words;

// Play with synchronized lip-sync
await whisperPlay(head);
```

### Use Case 3: Interactive Chatbot

```javascript
import { geminiBuildMessage, geminiSendMessage } from './js/ai-gemini.js';
import { cfg, saveConfig } from './js/utils.js';

// Configure personality
cfg('ai-gemini-system', 'You are a helpful, friendly assistant');
saveConfig();

// Handle user messages
async function handleMessage(userText) {
  const messages = geminiBuildMessage();
  await geminiSendMessage(head, site, output, messages, addText);
}
```

### Use Case 4: Video Dubbing System

```javascript
import { whisperLoadMP3 } from './js/audio-whisper.js';
import { elevenSpeak } from './js/tts-elevenlabs.js';

// Process original audio
await whisperLoadMP3(head, originalAudio);
const transcript = whisperGetAudio().words.join(' ');

// Translate and speak in new language
const translated = await translateText(transcript, 'es');
await elevenSpeak(head, translated, output, addText);
```

---

## 🔧 Complete Working Example

Here's a full, copy-paste ready example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Modular Talking Head Demo</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>

<div id="avatar"></div>
<input type="text" id="message" placeholder="Type message...">
<button id="send">Send</button>
<div id="output"></div>

<script src="https://d3js.org/d3.v6.min.js"></script>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js/+esm"
  }
}
</script>

<script type="module">
import { TalkingHead } from "./modules/talkinghead.mjs";
import { cfg, initConfig, jwtGet } from './js/utils.js';
import { API_PROXIES } from './js/config.js';
import { elevenSpeak } from './js/tts-elevenlabs.js';
import { geminiSendMessage } from './js/ai-gemini.js';

// Initialize
initConfig();
let head = null;

// Create avatar
const container = document.getElementById('avatar');
head = new TalkingHead(container, {
  jwtGet: jwtGet,
  ttsEndpoint: API_PROXIES.googleTTS
});

await head.showAvatar({ url: './avatars/brunette.glb' });

// Handle messages
document.getElementById('send').onclick = async () => {
  const input = document.getElementById('message').value;
  const output = document.getElementById('output');
  
  const messages = [{ role: 'user', content: input }];
  
  await geminiSendMessage(
    head,
    {},
    output,
    messages,
    (node, text) => node.textContent += text,
    elevenSpeak
  );
};
</script>

</body>
</html>
```

---

## 🎨 Customization Examples

### Change Voice Settings

```javascript
import { cfg, saveConfig } from './js/utils.js';

// Switch to ElevenLabs
cfg('voice-type', 'eleven');
cfg('voice-eleven-id', 'EXAVITQu4vr4xnSDxMaL');

// Adjust Google TTS
cfg('voice-google-rate', 1.2);
cfg('voice-google-pitch', 0);

saveConfig();
```

### Configure AI Behavior

```javascript
import { cfg } from './js/utils.js';

// Set Gemini parameters
cfg('ai-model', 'gemini-1.5-pro');
cfg('ai-gemini-temperature', 0.7);
cfg('ai-gemini-output', 2048);

// Add system instruction
cfg('ai-gemini-system', 'You are a knowledgeable tutor');
```

### Handle Errors Gracefully

```javascript
try {
  await elevenSpeak(head, text, node, addText);
} catch (error) {
  console.error('TTS Error:', error);
  // Fallback to Google TTS
  await head.speakText(text);
}
```

---

## 📊 Module Integration Chart

```
User Action
    ↓
┌───────────────────────────────────┐
│  Your Application (example-usage.html) │
└───────────────────────────────────┘
    ↓
    ├→ utils.js (cfg, jwtGet)
    ├→ config.js (API_PROXIES)
    ├→ tts-elevenlabs.js (elevenSpeak)
    ├→ ai-gemini.js (geminiSendMessage)
    └→ audio-whisper.js (whisperLoadMP3)
         ↓
    TalkingHead Library
         ↓
    Avatar speaks/animates
```

---

## 🎓 Next Steps

1. **Open** `example-usage.html` in your browser
2. **Click** "Initialize Avatar"
3. **Try** each feature:
   - Type text and click "Speak with ElevenLabs"
   - Enter a message and click "Send to Gemini"
   - Upload an MP3 and click "Process Audio"
4. **Inspect** the browser console for detailed logs
5. **Modify** the code to fit your needs

---

## 💡 Pro Tips

1. **Start Simple**: Begin with one module at a time
2. **Use Console**: Check browser console for detailed logs
3. **Handle Errors**: Always wrap async calls in try/catch
4. **Test Incrementally**: Test each feature independently
5. **Read Comments**: The example code is heavily commented

---

## 📚 Related Documentation

- **Complete Guide**: `MODULES_COMPLETE.md`
- **Module Details**: `MODULARIZATION_GUIDE.md`
- **Quick Reference**: `README_MODULES.md`

---

**Happy Coding!** 🚀

*The example is production-ready and demonstrates best practices for using the modular system.*





