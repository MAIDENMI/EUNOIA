/**
 * Mind+Motion Real-time Service (Node.js)
 * Handles: ElevenLabs Voice, WebSockets, Real-time Sessions, Cloudflare Storage
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { createServer } = require('http');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Configuration
const PORT = process.env.PORT || 8001;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'Mind+Motion Real-time Service',
    status: 'running',
    endpoints: ['/voice/synthesize', '/voice/stream', '/health'],
    websocket: 'available'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    elevenlabs_configured: !!ELEVENLABS_API_KEY,
    python_service: PYTHON_SERVICE_URL
  });
});

/**
 * Voice Synthesis Endpoint
 * Converts text to speech using ElevenLabs
 */
app.post('/voice/synthesize', async (req, res) => {
  const { text, voice_id, model_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const voiceId = voice_id || ELEVENLABS_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      url,
      {
        text,
        model_id: model_id || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );

    // Convert to base64 for easy frontend handling
    const audioBase64 = Buffer.from(response.data).toString('base64');

    res.json({
      audio_base64: audioBase64,
      content_type: 'audio/mpeg'
    });

  } catch (error) {
    console.error('ElevenLabs API Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to synthesize voice',
      details: error.response?.data || error.message
    });
  }
});

/**
 * Voice Streaming Endpoint
 * Streams audio in real-time for longer texts
 */
app.post('/voice/stream', async (req, res) => {
  const { text, voice_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  try {
    const voiceId = voice_id || ELEVENLABS_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const response = await axios.post(
      url,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);

  } catch (error) {
    console.error('ElevenLabs Streaming Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to stream voice',
      details: error.message
    });
  }
});

/**
 * Proxy to Python AI Service
 * Allows frontend to get AI response + voice in one request
 */
app.post('/chat-with-voice', async (req, res) => {
  try {
    // 1. Get AI response from Python service
    const aiResponse = await axios.post(`${PYTHON_SERVICE_URL}/chat`, req.body);
    const { response: aiText, emotion_detected, suggested_movement } = aiResponse.data;

    // 2. Synthesize voice
    let audioBase64 = null;
    if (ELEVENLABS_API_KEY) {
      try {
        const voiceResponse = await axios.post(
          `http://localhost:${PORT}/voice/synthesize`,
          { text: aiText }
        );
        audioBase64 = voiceResponse.data.audio_base64;
      } catch (voiceError) {
        console.error('Voice synthesis failed:', voiceError.message);
      }
    }

    res.json({
      text: aiText,
      audio_base64: audioBase64,
      emotion_detected,
      suggested_movement
    });

  } catch (error) {
    console.error('Chat-with-voice error:', error.message);
    res.status(500).json({
      error: 'Failed to process chat with voice',
      details: error.message
    });
  }
});

/**
 * WebSocket for Real-time Sessions
 * Handles live therapy sessions, shared sessions, and real-time updates
 */
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a session room
  socket.on('join-session', ({ sessionId, userId, userName }) => {
    socket.join(sessionId);
    
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new Set());
    }
    activeSessions.get(sessionId).add({ socketId: socket.id, userId, userName });

    // Notify others in the session
    socket.to(sessionId).emit('user-joined', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });

    console.log(`User ${userName} joined session ${sessionId}`);
  });

  // Broadcast biometric data to session participants
  socket.on('biometric-update', ({ sessionId, biometricData }) => {
    socket.to(sessionId).emit('biometric-update', biometricData);
  });

  // Real-time pose data sharing
  socket.on('pose-update', ({ sessionId, poseData }) => {
    socket.to(sessionId).emit('pose-update', poseData);
  });

  // Chat messages in shared sessions
  socket.on('session-message', ({ sessionId, message, userId, userName }) => {
    io.to(sessionId).emit('session-message', {
      message,
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
  });

  // Support/cheer reactions
  socket.on('send-reaction', ({ sessionId, reaction, userId }) => {
    socket.to(sessionId).emit('reaction-received', {
      reaction,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Leave session
  socket.on('leave-session', ({ sessionId, userId }) => {
    socket.leave(sessionId);
    
    if (activeSessions.has(sessionId)) {
      const session = activeSessions.get(sessionId);
      session.forEach(user => {
        if (user.socketId === socket.id) {
          session.delete(user);
        }
      });
    }

    socket.to(sessionId).emit('user-left', { userId });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Clean up sessions
    activeSessions.forEach((users, sessionId) => {
      users.forEach(user => {
        if (user.socketId === socket.id) {
          users.delete(user);
          io.to(sessionId).emit('user-left', { userId: user.userId });
        }
      });
    });
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🎙️  Mind+Motion Real-time Service running on port ${PORT}`);
  console.log(`✅ ElevenLabs: ${ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`🔗 Python AI Service: ${PYTHON_SERVICE_URL}`);
  console.log(`🌐 WebSocket: Available`);
});
