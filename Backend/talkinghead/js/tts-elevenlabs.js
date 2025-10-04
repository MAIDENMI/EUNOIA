/**
 * ElevenLabs Text-to-Speech Module
 * WebSocket-based streaming TTS with word-level timing
 */

import { API_PROXIES, API_ENDPOINTS, elevenBOS } from './config.js';
import { cfg, jwtGet } from './utils.js';

// =============================================================================
// MODULE STATE
// =============================================================================

let elevenSocket = null;
let elevenInputMsgs = null;
let elevenOutputMsg = null;
let elevenOnProcessed = null;

// =============================================================================
// PUBLIC FUNCTIONS
// =============================================================================

/**
 * Speak text using ElevenLabs TTS with streaming
 * @param {object} head - TalkingHead instance
 * @param {string} s - Text to speak
 * @param {HTMLElement|null} node - Optional node for text display callback
 * @param {function} addText - Text display callback function
 */
export async function elevenSpeak(head, s, node = null, addText = null) {
  if (!elevenSocket) {
    // Temporary reservation of WebSocket connection
    elevenSocket = { readyState: 0 };

    // Temporary stack of message until the connection is established
    elevenInputMsgs = [
      elevenBOS,
      {
        "text": s,
        "try_trigger_generation": false,
        "flush": true
      }
    ];

    // Endpoint/proxy and authentication
    let url;
    const apikey = d3.select("#apikey-eleven").property("value");
    if (apikey) {
      url = API_ENDPOINTS.elevenTTS[0];
      url += cfg('voice-eleven-id');
      url += API_ENDPOINTS.elevenTTS[1];
      elevenInputMsgs[0]["xi_api_key"] = apikey;
    } else {
      url = API_PROXIES.elevenTTS[0];
      url += await jwtGet();
      url += API_PROXIES.elevenTTS[1];
      url += cfg('voice-eleven-id');
      url += API_PROXIES.elevenTTS[2];
    }

    // Make the connection
    elevenSocket = new WebSocket(url);

    // Connection opened
    elevenSocket.onopen = function (event) {
      elevenOutputMsg = null;
      while (elevenInputMsgs.length > 0) {
        elevenSocket.send(JSON.stringify(elevenInputMsgs.shift()));
      }
    }

    // New message received
    elevenSocket.onmessage = function (event) {
      const r = JSON.parse(event.data);

      // Speak audio
      if ((r.isFinal || r.normalizedAlignment) && elevenOutputMsg) {
        head.speakAudio(
          elevenOutputMsg,
          { lipsyncLang: cfg('voice-lipsync-lang') },
          node && addText ? addText.bind(null, node) : null
        );
        if (elevenOnProcessed) {
          elevenOnProcessed();
        }
        elevenOutputMsg = null;
      }

      if (!r.isFinal) {
        // New part
        if (r.alignment) {
          elevenOutputMsg = { audio: [], words: [], wtimes: [], wdurations: [] };

          // Parse chars to words
          let word = '';
          let time = 0;
          let duration = 0;
          for (let i = 0; i < r.alignment.chars.length; i++) {
            if (word.length === 0) time = r.alignment.charStartTimesMs[i];
            if (word.length && r.alignment.chars[i] === ' ') {
              elevenOutputMsg.words.push(word);
              elevenOutputMsg.wtimes.push(time);
              elevenOutputMsg.wdurations.push(duration);
              word = '';
              duration = 0;
            } else {
              duration += r.alignment.charDurationsMs[i];
              word += r.alignment.chars[i];
            }
          }
          if (word.length) {
            elevenOutputMsg.words.push(word);
            elevenOutputMsg.wtimes.push(time);
            elevenOutputMsg.wdurations.push(duration);
          }
        }

        // Add audio content to message
        if (r.audio && elevenOutputMsg) {
          elevenOutputMsg.audio.push(head.b64ToArrayBuffer(r.audio));
        }
      }
    };

    // Error
    elevenSocket.onerror = function (error) {
      if (elevenOnProcessed) elevenOnProcessed();
      console.error(`ElevenLabs WebSocket Error: ${error}`);
    };

    // Connection closed
    elevenSocket.onclose = function (event) {
      if (elevenOnProcessed) elevenOnProcessed();
      if (event.wasClean) {
        // console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        console.warn('ElevenLabs connection died');
      }
      elevenSocket = null;
    };
  } else {
    let msg = {
      "text": s
    };
    if (s.length) {
      msg["try_trigger_generation"] = false;
      msg["flush"] = true;
    }
    if (elevenSocket.readyState === 1) { // OPEN
      elevenSocket.send(JSON.stringify(msg))
    } else if (elevenSocket.readyState === 0) { // CONNECTING
      elevenInputMsgs.push(msg);
    }
  }
}

/**
 * Close ElevenLabs WebSocket connection
 */
export function elevenClose() {
  if (elevenSocket && elevenSocket.readyState !== 3) { // Not CLOSED
    elevenSocket.close();
  }
  elevenSocket = null;
  elevenInputMsgs = null;
  elevenOutputMsg = null;
}

/**
 * Set callback for when speech processing is complete
 * @param {function} callback - Callback function
 */
export function elevenSetOnProcessed(callback) {
  elevenOnProcessed = callback;
}

/**
 * Get current connection status
 * @returns {string} Connection status
 */
export function elevenStatus() {
  if (!elevenSocket) return 'disconnected';
  switch (elevenSocket.readyState) {
    case 0: return 'connecting';
    case 1: return 'open';
    case 2: return 'closing';
    case 3: return 'closed';
    default: return 'unknown';
  }
}

