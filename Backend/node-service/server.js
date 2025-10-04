/**
 * Mind+Motion Real-time Service (Node.js/Express)
 * Handles: ElevenLabs voice synthesis, WebSocket connections, Live sessions
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ElevenLabsClient } = require('elevenlabs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// ElevenLabs Client
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
let elevenLabsClient = null;

if (ELEVENLABS_API_KEY) {
  elevenLabsClient = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY
  });
  console.log('✅ ElevenLabs client initialized');
} else {
  console.warn('⚠️  Warning: ELEVENLABS_API_KEY not found in environment variables');
}

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'Mind+Motion Real-time Service',
    status: 'running',
    endpoints: ['/voice/synthesize', '/chat-with-voice', '/health'],
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    elevenlabs_configured: !!ELEVENLABS_API_KEY,
    port: PORT
  });
});

/**
 * POST /voice/synthesize
 * Convert text to speech using ElevenLabs
 */
app.post('/voice/synthesize', async (req, res) => {
  try {
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body; // Default: Rachel

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!elevenLabsClient) {
      return res.status(500).json({ error: 'ElevenLabs API not configured' });
    }

    console.log(`🎤 Synthesizing speech: "${text.substring(0, 50)}..."`);

    // Generate audio using ElevenLabs
    const audioStream = await elevenLabsClient.textToSpeech.convert(voice_id, {
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audio_base64 = audioBuffer.toString('base64');

    console.log(`✅ Audio generated: ${audioBuffer.length} bytes`);

    res.json({
      audio_base64,
      content_type: 'audio/mpeg',
      voice_id
    });

  } catch (error) {
    console.error('❌ Error synthesizing voice:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize voice',
      details: error.message 
    });
  }
});

/**
 * POST /chat-with-voice
 * Get AI response from Python service + voice synthesis
 */
app.post('/chat-with-voice', async (req, res) => {
  try {
    const { message, context = [], voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Get AI response from Python service
    console.log(`💬 Forwarding to Python AI service: "${message}"`);
    const aiResponse = await axios.post('http://localhost:8000/chat', {
      message,
      context,
      user_id: req.body.user_id
    });

    const { response: text, emotion_detected, suggested_movement } = aiResponse.data;

    // 2. Generate voice
    console.log(`🎤 Generating voice for response...`);
    if (!elevenLabsClient) {
      return res.json({
        text,
        audio_base64: null,
        emotion_detected,
        suggested_movement,
        error: 'Voice synthesis unavailable - ElevenLabs API not configured'
      });
    }

    const audioStream = await elevenLabsClient.textToSpeech.convert(voice_id, {
      text: text,
      model_id: 'eleven_monolingual_v1'
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audio_base64 = audioBuffer.toString('base64');

    console.log(`✅ Complete: text + voice`);

    res.json({
      text,
      audio_base64,
      emotion_detected,
      suggested_movement
    });

  } catch (error) {
    console.error('❌ Error in chat-with-voice:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🌿 Mind+Motion Real-time Service');
  console.log('================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
  console.log(`${ELEVENLABS_API_KEY ? '✅' : '⚠️ '} ElevenLabs API: ${ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /voice/synthesize');
  console.log('  POST /chat-with-voice');
  console.log('  GET  /health');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
