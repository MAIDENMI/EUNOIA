/**
 * Configuration and Constants Module
 * API endpoints, i18n data, and global configuration
 */

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Proxy endpoints (go through your backend)
export const API_PROXIES = {
  jwt: "/app/jwt/get",
  openaiChat: "/openai/v1/chat/completions",
  openaiModerations: "/openai/v1/moderations",
  openaiTranscriptions: "/openai/v1/audio/transcriptions",
  gemini: "/gemini/",
  googleTTS: "/gtts/",
  elevenTTS: [
    "wss://" + window.location.host + "/elevenlabs/",
    "/v1/text-to-speech/",
    "/stream-input?model_id=eleven_turbo_v2_5&output_format=pcm_22050"
  ],
  microsoftTTS: [
    "wss://" + window.location.host + "/mstts/",
    "/cognitiveservices/websocket/v1"
  ],
  grokChat: "/grok/v1/chat/completions",
  llamaChat: "/llama/v1/chat/completions",
  whisper: "/whisper/"
};

// Direct API endpoints
export const API_ENDPOINTS = {
  openaiChat: "https://api.openai.com/v1/chat/completions",
  openaiModerations: "https://api.openai.com/v1/moderations",
  openaiTranscriptions: "https://api.openai.com/v1/audio/transcriptions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/",
  googleTTS: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
  elevenTTS: [
    "wss://api.elevenlabs.io/v1/text-to-speech/",
    "/stream-input?model_id=eleven_turbo_v2_5&output_format=pcm_22050"
  ],
  microsoftTTS: "wss://northeurope.tts.speech.microsoft.com/cognitiveservices/websocket/v1",
  grokChat: "https://api.x.ai/v1/chat/completions"
};

// =============================================================================
// INTERNATIONALIZATION (i18n)
// =============================================================================

export const i18n = {
  'fi': {
    'Avatar': 'Hahmo', 'Camera': 'Kamera', 'Audio': 'Ääni', 'Manuscript': 'Käsikirjoitus',
    'Emotion': 'Tunne', 'Neutral': 'Perus', 'Happy': 'Ilo', 'Angry': 'Viha', 'Sad': 'Suru',
    'Fear': 'Pelko', 'Disgust': 'Inho', 'Love': 'Rakkaus', 'Sleep': 'Uni', 'Pose': 'Asento',
    'Action': 'Toiminta', 'Frame': 'Rajaus', 'Full': 'Kokovartalo', 'Upper': 'Yläosa',
    'Head': 'Pää', 'Director': 'Ohjaus', 'Pause': 'Pysäytyskuva', 'Panning': 'Panorointi',
    'Slow-motion': 'Hidastus', 'Ambience': 'Ambienssi', 'Silence': 'Hiljaisuus',
    'Session': 'Sessio', 'Theme': 'Teema', 'Location': 'Paikka', 'Voice': 'Istuva',
    'AI': 'Tekoäly', 'Emoji': 'Emojit', 'Title': 'Otsikko', 'System': 'Ohjeistus',
    'ai-system': 'Järjestelmäviesti.', 'ai-user1': 'Käyttäjän syöte #1',
    'ai-ai1': 'Tekoälyn vaste #1', 'ai-user2': 'Käyttäjän syöte #2',
    'ai-ai2': 'Tekoälyn vaste #2', 'Example1': 'Esim #1', 'Example2': 'Esim #2',
    'Dark': 'Tumma', 'Light': 'Vaalea', 'theme-wide': 'Laajakuva', 'theme-43': '4:3',
    'theme-landscape': 'Vaaka', 'theme-portrait': 'Pysty', 'Empty': 'Tyhjä',
    'Adjust': 'Säätö', 'Speech': 'Puhe', 'Silence': 'Hiljaisuus', 'Framing': 'Rajaus',
    'Mixer': 'Mikseri', 'Space': 'Tila', 'Dry': 'Suora', 'voice-test': 'Äänitesti',
    'Limits': 'Rajat', 'ai-stop': 'Stop', 'ai-stopword': 'Avainsana', 'ai-user': 'Käyttäjä',
    'ai-username': 'Nimi', 'input': 'Kirjoita viesti.', 'Name': 'Nimi', 'Language': 'Kieli',
    'en': 'English', 'fi': 'Finnish', 'words': 'sanaa', 'dialogs': 'sanomaa',
    'Manuscript': 'Käsikirjoitus', 'Exclude': 'Ohita', 'Italics': 'Kursiivi',
    'Code': 'Koodi', 'Light': 'Valo', 'LightAmbient': 'Ambientti',
    'LightDirect': 'Suunnattu', 'LightSpot': 'Spotti', 'theme-full': "Täysi",
    'lt': 'Liettua', 'test-sentence': "Kirjoita tähän testilause.", 'Mid': 'Keskiosa',
    'Gesture': 'Ele', 'PoseMovement': 'Liike', 'Visible': 'Näytä',
    'Helper': 'Apuri', 'Edit': 'Muokkaa', 'Script': 'Skripti', 'fr': "Ranska",
    'de': "Saksa"
  },

  'en': {
    'ai-system': 'System message.', 'ai-user1': 'User example #1',
    'ai-ai1': 'AI response #1', 'ai-user2': 'User example #2',
    'ai-ai2': 'AI response #2', 'Example1': 'Example-1', 'Example2': 'Example-2',
    'theme-wide': 'Widescreen', 'theme-43': '4:3', 'theme-landscape': 'Landscape',
    'theme-portrait': 'Portrait', 'voice-test': 'Speak', 'ai-stop': 'Stop',
    'ai-user': 'User', 'input': 'Message.', 'en': 'English', 'fi': 'Finnish',
    'ai-stopword': 'Word', 'ai-username': 'Name', 'LightAmbient': 'Ambient',
    'LightDirect': 'Direct', 'LightSpot': 'Spot', 'theme-full': "Fullscreen",
    'lt': 'Lithuanian', 'test-sentence': "Write your test sentence.",
    'PoseMovement': 'Movement', 'fr': "French", 'de': "German"
  }
};

// =============================================================================
// MARKDOWN CONFIGURATION
// =============================================================================

export const markedOptions = { gfm: true, breaks: true };

// =============================================================================
// ELEVENLABS CONFIGURATION
// =============================================================================

export const elevenBOS = {
  "text": " ",
  "voice_settings": { "stability": 0.8, "similarity_boost": true },
  "generation_config": {
    "chunk_length_schedule": [500,500,500,500]
  }
};

// =============================================================================
// SVG ICONS
// =============================================================================

export const SVG_ICONS = {
  select: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10.5858 13.4142L7.75735 10.5858L6.34314 12L10.5858 16.2427L17.6568 9.1716L16.2426 7.75739L10.5858 13.4142Z" fill="currentColor" /></svg>',
  speak: '<svg viewBox="-2 -2 28 28" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 18.939C14.2091 18.939 16 17.1482 16 14.939C16 12.7299 14.2091 10.939 12 10.939C9.79086 10.939 8 12.7299 8 14.939C8 17.1482 9.79086 18.939 12 18.939ZM12 16.939C13.1046 16.939 14 16.0436 14 14.939C14 13.8345 13.1046 12.939 12 12.939C10.8954 12.939 10 13.8345 10 14.939C10 16.0436 10.8954 16.939 12 16.939Z" fill="currentColor" /><path d="M12 9.04401C13.1046 9.04401 14 8.14858 14 7.04401C14 5.93944 13.1046 5.04401 12 5.04401C10.8954 5.04401 10 5.93944 10 7.04401C10 8.14858 10.8954 9.04401 12 9.04401Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M7 1C5.34315 1 4 2.34315 4 4V20C4 21.6569 5.34315 23 7 23H17C18.6569 23 20 21.6569 20 20V4C20 2.34315 18.6569 1 17 1H7ZM17 3H7C6.44772 3 6 3.44772 6 4V20C6 20.5523 6.44772 21 7 21H17C17.5523 21 18 20.5523 18 20V4C18 3.44772 17.5523 3 17 3Z" fill="currentColor" /></svg>',
  stop: '<svg viewBox="-2 -2 28 28" xmlns="http://www.w3.org/2000/svg"><path d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z" fill="currentColor" /></svg>',
  repost: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.1459 11.0499L12.9716 9.05752L15.3462 8.84977C14.4471 7.98322 13.2242 7.4503 11.8769 7.4503C9.11547 7.4503 6.87689 9.68888 6.87689 12.4503C6.87689 15.2117 9.11547 17.4503 11.8769 17.4503C13.6977 17.4503 15.2911 16.4771 16.1654 15.0224L18.1682 15.5231C17.0301 17.8487 14.6405 19.4503 11.8769 19.4503C8.0109 19.4503 4.87689 16.3163 4.87689 12.4503C4.87689 8.58431 8.0109 5.4503 11.8769 5.4503C13.8233 5.4503 15.5842 6.24474 16.853 7.52706L16.6078 4.72412L18.6002 4.5498L19.1231 10.527L13.1459 11.0499Z" fill="currentColor" /></svg>'
};

// =============================================================================
// RECORDING CONFIGURATION
// =============================================================================

export const RECORDING_MEDIA_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/webm'
];

// Beep sound data URL (base64 encoded WAV)
export const RECORDING_BEEP = "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=";

