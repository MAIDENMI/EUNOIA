/**
 * Whisper Audio Processing Module
 * MP3 transcription with word-level timing for lip-sync
 */

import { API_PROXIES, API_ENDPOINTS } from './config.js';
import { cfg, jwtGet } from './utils.js';

// =============================================================================
// MODULE STATE
// =============================================================================

let whisperAudio = null;
let whisperLipsyncLang = 'en';

// =============================================================================
// PUBLIC FUNCTIONS
// =============================================================================

/**
 * Load and process MP3 file with Whisper transcription
 * @param {object} head - TalkingHead instance
 * @param {File} file - MP3 file to process
 * @returns {Promise<void>}
 */
export async function whisperLoadMP3(head, file) {
  if (cfg("whisper-type") === "openai") {
    try {
      d3.select("#playmp3").classed("disabled", true);

      const form = new FormData();
      form.append("file", file);
      form.append("model", "whisper-1");
      form.append("response_format", "verbose_json");
      form.append("prompt", "[The following is a full verbatim transcription without additional details, comments or emojis:]");
      form.append("timestamp_granularities[]", "word");
      form.append("timestamp_granularities[]", "segment");

      // Endpoint/proxy and authentication
      let url;
      let headers = {};
      const apikey = d3.select("#apikey-openai").property("value");
      if (apikey) {
        url = API_ENDPOINTS.openaiTranscriptions;
        headers["Authorization"] = "Bearer " + apikey;
      } else {
        url = API_PROXIES.openaiTranscriptions;
        headers["Authorization"] = "Bearer " + await jwtGet()
      }

      const response = await fetch(url, {
        method: "POST",
        body: form,
        headers: headers
      });

      if (response.ok) {
        const json = await response.json();
        d3.select("#jsonmp3").property("value", JSON.stringify(json));

        // Fetch audio
        if (json.words && json.words.length) {
          var reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = async readerEvent => {
            let arraybuffer = readerEvent.target.result;
            let audiobuffer = await head.audioCtx.decodeAudioData(arraybuffer);

            // Set lip-sync language
            whisperLipsyncLang = json.language.substring(0, 2);

            // Add words to the audio object
            whisperAudio = {
              audio: audiobuffer,
              words: [],
              wtimes: [],
              wdurations: [],
              markers: [],
              mtimes: []
            };
            
            json.words.forEach(x => {
              // Word
              whisperAudio.words.push(x.word);

              // Starting time
              let t = 1000 * x.start;
              if (t > 150) t -= 150;
              whisperAudio.wtimes.push(t);

              // Duration
              let d = 1000 * (x.end - x.start);
              if (d > 20) d -= 20;
              whisperAudio.wdurations.push(d);
            });

            // Add timed callback markers to the audio object
            const startSegment = async () => {
              // Look at the camera
              head.lookAtCamera(500);
              head.speakWithHands();
            };
            
            json.segments.forEach(x => {
              if (x.start > 2 && x.text.length > 10) {
                whisperAudio.markers.push(startSegment);
                whisperAudio.mtimes.push(1000 * x.start - 1000);
              }
            });

            d3.select("#playmp3").classed("disabled", false);
          }
        }

      } else {
        d3.select("#jsonmp3").property("value", 'Error: ' + response.status + ' ' + response.statusText);
        console.log(response);
      }

    } catch (error) {
      console.log(error);
    }
  } else if (cfg("whisper-type") === "local") {
    try {
      d3.select("#playmp3").classed("disabled", true);

      const form = new FormData();
      form.append("file", file);
      form.append("temperature", "0.0");
      form.append("temperature_inc", "0.2");
      form.append("response_format", "verbose_json");
      
      const response = await fetch(API_PROXIES.whisper + 'inference', {
        method: "POST",
        body: form,
        headers: {
          "Authorization": "Bearer " + await jwtGet()
        }
      });

      if (response.ok) {
        const json = await response.json();
        d3.select("#jsonmp3").property("value", JSON.stringify(json));

        // Fetch audio
        if (json.segments && json.segments.length) {
          var reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = async readerEvent => {
            let arraybuffer = readerEvent.target.result;
            let audiobuffer = await head.audioCtx.decodeAudioData(arraybuffer);

            // Set lip-sync language
            whisperLipsyncLang = json.language.substring(0, 2);

            // Add words to the audio object
            whisperAudio = {
              audio: audiobuffer,
              words: [],
              wtimes: [],
              wdurations: [],
              markers: [],
              mtimes: []
            };

            // Add timed callback markers to the audio object
            const startSegment = async () => {
              // Look at the camera
              head.lookAtCamera(500);
              head.speakWithHands();
            };

            json.segments.forEach((x, i) => {
              if (x.words && x.words.length) {

                // Look at camera
                if (x.start > 2 && x.text.length > 10) {
                  whisperAudio.markers.push(startSegment);
                  whisperAudio.mtimes.push(1000 * x.start - 1000);
                }

                // Word-level timestamps
                x.words.forEach(y => {

                  // Word
                  whisperAudio.words.push(y.word);

                  // Starting time
                  let t = 1000 * y.start;
                  if (t > 150) t -= 150;
                  whisperAudio.wtimes.push(t);

                  // Duration
                  let d = 1000 * (y.end - y.start);
                  if (d <= 50) d = 50;
                  if (d > 20) d -= 20;
                  whisperAudio.wdurations.push(d);

                });
              }
            });

            d3.select("#playmp3").classed("disabled", false);
          }
        }

      } else {
        d3.select("#jsonmp3").property("value", 'Error: ' + response.status + ' ' + response.statusText);
        console.log(response);
      }

    } catch (error) {
      console.log(error);
    }
  }
}

/**
 * Play the loaded Whisper audio with lip-sync
 * @param {object} head - TalkingHead instance
 */
export async function whisperPlay(head) {
  if (whisperAudio) {
    await head.speakAudio(whisperAudio, { lipsyncLang: whisperLipsyncLang });
  } else {
    console.warn("No Whisper audio loaded to play");
  }
}

/**
 * Get the currently loaded audio data
 * @returns {object|null} Audio data object or null
 */
export function whisperGetAudio() {
  return whisperAudio;
}

/**
 * Get the detected language
 * @returns {string} Language code
 */
export function whisperGetLanguage() {
  return whisperLipsyncLang;
}

/**
 * Clear loaded audio
 */
export function whisperClear() {
  whisperAudio = null;
  whisperLipsyncLang = 'en';
}

/**
 * Check if audio is loaded
 * @returns {boolean} True if audio is loaded
 */
export function whisperIsLoaded() {
  return whisperAudio !== null;
}





