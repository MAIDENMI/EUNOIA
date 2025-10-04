/**
 * Application configuration loaded from environment variables
 */

export const config = {
  // ElevenLabs
  elevenlabs: {
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
  },
  
  // Google TTS (for legacy mode)
  google: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY || '',
  },
  
  // Backend services
  backend: {
    chatUrl: process.env.NEXT_PUBLIC_BACKEND_CHAT_URL || 'http://localhost:8000',
    voiceUrl: process.env.NEXT_PUBLIC_BACKEND_VOICE_URL || 'http://localhost:8001',
  },
  
  // TalkingHead
  talkingHead: {
    url: process.env.NEXT_PUBLIC_TALKINGHEAD_URL || 'http://localhost:8080',
  },
} as const;

// Debug logging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuration loaded:', {
    hasElevenLabsApiKey: !!config.elevenlabs.apiKey,
    elevenLabsApiKeyPrefix: config.elevenlabs.apiKey ? config.elevenlabs.apiKey.substring(0, 8) + '...' : 'NOT SET',
    hasElevenLabsAgentId: !!config.elevenlabs.agentId,
    elevenLabsAgentId: config.elevenlabs.agentId || 'NOT SET',
    hasGoogleApiKey: !!config.google.apiKey,
    talkingHeadUrl: config.talkingHead.url,
  });
}

/**
 * Check if ElevenLabs WebSocket is configured
 */
export const isElevenLabsConfigured = () => {
  return !!config.elevenlabs.agentId;
};

/**
 * Check if legacy mode is fully configured
 */
export const isLegacyModeConfigured = () => {
  return !!(config.google.apiKey || config.elevenlabs.apiKey);
};
