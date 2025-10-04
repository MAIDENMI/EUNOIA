# Mind+Motion Backend Services

Hybrid microservices architecture with Python FastAPI (AI/ML) and Node.js (Real-time).

## Architecture Overview

```
┌─────────────────┐
│  Next.js Frontend│
│   (Port 3000)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ Python  │ │ Node.js  │
│ FastAPI │ │ Express  │
│:8000    │ │:8001     │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
  Gemini    ElevenLabs
   API        API
```

## Services

### 🐍 Python FastAPI Service (Port 8000)
**Handles:** AI/ML tasks
- Gemini AI conversation (CBT-inspired)
- Emotion detection (text + voice)
- MediaPipe pose estimation
- Biometric data processing
- Adaptive recommendations

### 🟢 Node.js Express Service (Port 8001)
**Handles:** Real-time features
- ElevenLabs voice synthesis
- WebSocket connections
- Live session management
- Social/shared sessions
- Cloudflare storage integration

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API key ([Get it here](https://ai.google.dev/))
- ElevenLabs API key ([Get it here](https://elevenlabs.io/))

### 1. Python Service Setup

```bash
cd Backend/python-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the service
python main.py
```

The Python service will be available at `http://localhost:8000`

### 2. Node.js Service Setup

```bash
cd Backend/node-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ELEVENLABS_API_KEY

# Run the service
npm run dev
```

The Node.js service will be available at `http://localhost:8001`

---

## 🔑 API Keys Setup

### Gemini API Key
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create a new API key
3. Add to `Backend/python-service/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

### ElevenLabs API Key
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from dashboard
3. Add to `Backend/node-service/.env`:
   ```
   ELEVENLABS_API_KEY=your_key_here
   ```

---

## 📡 API Endpoints

### Python Service (`http://localhost:8000`)

#### `POST /chat`
Conversational AI with CBT therapy
```json
{
  "message": "I'm feeling anxious about work",
  "context": [],
  "user_id": "user123"
}
```

Response:
```json
{
  "response": "I hear you. Anxiety about work is very common...",
  "emotion_detected": "anxious",
  "suggested_movement": "micro_movement"
}
```

#### `POST /analyze-emotion`
Detect emotion from text or voice
```json
{
  "text": "I'm so stressed out",
  "audio_base64": "base64_audio_data"
}
```

#### `POST /process-biometrics`
Adaptive recommendations based on biometrics
```json
{
  "heart_rate": 105,
  "hrv": 45,
  "user_id": "user123"
}
```

#### `POST /pose-estimation`
Analyze yoga pose (MediaPipe integration coming)
```
Upload image file
```

---

### Node.js Service (`http://localhost:8001`)

#### `POST /voice/synthesize`
Convert text to speech
```json
{
  "text": "Take a deep breath and relax your shoulders",
  "voice_id": "EXAVITQu4vr4xnSDxMaL"
}
```

Response:
```json
{
  "audio_base64": "base64_encoded_audio",
  "content_type": "audio/mpeg"
}
```

#### `POST /chat-with-voice`
Get AI response + voice in one request
```json
{
  "message": "I need help relaxing",
  "context": []
}
```

Response:
```json
{
  "text": "Let's try some breathing exercises...",
  "audio_base64": "base64_audio",
  "emotion_detected": "stressed",
  "suggested_movement": "breathing"
}
```

---

## 🔌 WebSocket Events

Connect to `ws://localhost:8001`

### Client → Server
- `join-session` - Join a therapy session
- `biometric-update` - Share biometric data
- `pose-update` - Share pose data (AR yoga)
- `session-message` - Chat in shared session
- `send-reaction` - Send support reactions
- `leave-session` - Leave session

### Server → Client
- `user-joined` - Someone joined session
- `user-left` - Someone left session
- `biometric-update` - Biometric data from others
- `pose-update` - Pose data from others
- `session-message` - Chat messages
- `reaction-received` - Support reactions

---

## 🧪 Testing the Services

### Test Python Service
```bash
curl http://localhost:8000/health
```

### Test Node.js Service
```bash
curl http://localhost:8001/health
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need help with anxiety"}'
```

### Test Voice Synthesis
```bash
curl -X POST http://localhost:8001/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Take a deep breath"}' \
  > output.json
```

---

## 📁 Project Structure

```
Backend/
├── python-service/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   └── .env                 # Your API keys (gitignored)
│
├── node-service/
│   ├── server.js            # Express + Socket.IO
│   ├── package.json         # Node dependencies
│   ├── .env.example         # Environment template
│   └── .env                 # Your API keys (gitignored)
│
└── README.md                # This file
```

---

## 🔒 Security Notes

- ⚠️ **NEVER commit `.env` files to git**
- Both services have `.env` in `.gitignore`
- Use `.env.example` as templates
- Keep API keys secure and rotate them regularly

---

## 🐛 Troubleshooting

### Python Service won't start
- Check Python version: `python --version` (need 3.9+)
- Activate virtual environment
- Verify Gemini API key is set

### Node.js Service won't start
- Check Node version: `node --version` (need 18+)
- Run `npm install` again
- Verify ElevenLabs API key is set

### CORS errors
- Check `ALLOWED_ORIGINS` in both `.env` files
- Ensure frontend URL matches (default: `http://localhost:3000`)

### API key errors
- Double-check keys are copied correctly (no spaces)
- Test keys directly with provider's documentation
- Ensure API keys have proper permissions

---

## 🚧 Coming Soon

- [ ] MediaPipe pose estimation integration
- [ ] Cloudflare R2 storage for session recordings
- [ ] Advanced emotion detection with ML models
- [ ] Music adaptation system
- [ ] Gamification endpoints
- [ ] Doctor helpline integration

---

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/)
- [MediaPipe](https://developers.google.com/mediapipe)
