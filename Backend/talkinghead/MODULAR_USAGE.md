# 🎉 Modular TalkingHead - Usage Guide

## What's New?

The monolithic 6,358-line `index.html` has been refactored into:
- ✅ **6 focused JavaScript modules** (~1,675 lines total)
- ✅ **Clean, minimal HTML** (`index-modular.html`)
- ✅ **Easy to understand and maintain**

## 🚀 Quick Start

### 1. Start a Local Server

The modular version requires a web server due to ES6 module imports. Choose one:

**Option A: Python**
```bash
cd Backend/talkinghead
python3 -m http.server 8000
```

**Option B: Node.js (http-server)**
```bash
cd Backend/talkinghead
npx http-server -p 8000 -c-1
```

**Option C: PHP**
```bash
cd Backend/talkinghead
php -S localhost:8000
```

### 2. Open in Browser

Navigate to: `http://localhost:8000/index-modular.html`

## 📁 File Structure

```
Backend/talkinghead/
├── index-modular.html          ← NEW! Clean modular version
├── index.html                  ← Original (6,358 lines)
│
├── js/                         ← NEW! Modular JavaScript
│   ├── config.js              ← Configuration & constants
│   ├── utils.js               ← Core utilities (JWT, i18n, config)
│   ├── tts-elevenlabs.js      ← ElevenLabs TTS
│   ├── ai-gemini.js           ← Google Gemini AI
│   └── audio-whisper.js       ← Whisper audio processing
│
├── siteconfig.js              ← Site configuration
├── modules/                   ← TalkingHead library
├── avatars/                   ← 3D avatar models
└── ...
```

## 🎮 Features

### Basic Controls

1. **Simple Speech**
   - Type text in "Say:" field
   - Click "Speak" or press Enter
   - Avatar will speak with lip-sync

2. **AI Chat**
   - Type message in "AI Chat:" field
   - Click "Send" or press Enter
   - AI responds with voice and animation

3. **Voice Selection**
   - Google TTS (default)
   - ElevenLabs (requires API key or JWT proxy)

4. **Mood Control**
   - Change avatar's mood in real-time
   - Options: neutral, happy, angry, sad, fear, disgust, love, sleep

5. **Interactive**
   - Double-click anywhere to make avatar look at that spot

## 🔧 How the Modules Work

### `js/config.js`
Exports all configuration constants:
```javascript
import { API_PROXIES, API_ENDPOINTS, i18n } from './js/config.js';
```

### `js/utils.js`
Core utilities and configuration management:
```javascript
import { cfg, jwtGet, initConfig, saveConfig } from './js/utils.js';

// Get config value
const voiceType = cfg('voice-type');

// Set config value
cfg('voice-type', 'eleven');

// Get JWT token
const token = await jwtGet();
```

### `js/tts-elevenlabs.js`
ElevenLabs text-to-speech:
```javascript
import { elevenSpeak, elevenClose } from './js/tts-elevenlabs.js';

// Speak with ElevenLabs
await elevenSpeak(head, "Hello world!", null, addTextCallback);

// Close connection
elevenClose();
```

### `js/ai-gemini.js`
Google Gemini AI integration:
```javascript
import { geminiSendMessage, geminiStop } from './js/ai-gemini.js';

// Send message to AI
const messages = [{ role: 'user', content: 'Hello!' }];
await geminiSendMessage(head, site, outputNode, messages, addText);

// Stop generation
geminiStop();
```

### `js/audio-whisper.js`
Whisper audio transcription:
```javascript
import { whisperLoadMP3, whisperPlay } from './js/audio-whisper.js';

// Load and process MP3
await whisperLoadMP3(head, mp3File);

// Play with lip-sync
await whisperPlay(head);
```

## 🎨 Customization

### Change Theme
Edit CSS variables in `<head>`:
```css
:root {
  --colorBody: #88ccff;
  --colorBackground: #202020;
  --colorBorderActive: #88ccff;
  /* ... */
}
```

Or change `<body>` class:
```html
<body class="theme-light">  <!-- or theme-dark -->
```

### Add More Features

1. Import the modules you need
2. Use their exported functions
3. All functions are documented in `MODULES_COMPLETE.md`

## 🔐 API Keys

The modular version supports two modes:

### Mode 1: Direct API Keys
Add API keys directly in browser (not stored for security):
- Not implemented in UI yet, but easy to add

### Mode 2: JWT Proxy (Default)
Uses backend proxy with JWT authentication:
- No API keys needed in frontend
- More secure
- Requires backend server with JWT endpoint

## 🐛 Debugging

Open browser console to see:
- Avatar initialization status
- Speech events
- API calls
- Errors

Access TalkingHead instance:
```javascript
window.head // Global TalkingHead instance
```

## 📊 Comparison

| Feature | Original | Modular |
|---------|----------|---------|
| Lines of code | 6,358 | 1,675 + ~600 HTML |
| Files | 1 | 6 modules + 1 HTML |
| Maintainability | ⚠️ Hard | ✅ Easy |
| Testing | ⚠️ Difficult | ✅ Simple |
| Loading | All at once | Can lazy load |
| Debugging | ⚠️ Complex | ✅ Clear |

## 🎯 Next Steps

Want to enhance the modular version? Ideas:

1. **Add API Key UI**
   - Input fields for API keys
   - Store in sessionStorage

2. **More Controls**
   - Pose selector
   - Gesture buttons
   - Camera controls

3. **Session Management**
   - Multiple sessions
   - Save/load configurations

4. **Advanced Features**
   - File upload for Whisper
   - Video background
   - Screen capture

5. **Build Process**
   - Bundle with Vite/Webpack
   - Minification
   - TypeScript

## 📚 Documentation

- `MODULES_COMPLETE.md` - Complete module documentation
- `MODULARIZATION_GUIDE.md` - Technical specifications
- `REFACTORING_STRATEGY.md` - Implementation strategy

## 💡 Tips

1. **Development**: Use browser dev tools to inspect module loading
2. **Performance**: Check Network tab for module load times
3. **Errors**: Console shows clear error messages with module names
4. **Extending**: Copy a module as template for new features

## 🎉 Enjoy!

You now have a clean, modular, maintainable codebase that's easy to understand and extend!

**Questions?** Check the documentation files or examine the module source code - it's well commented!

