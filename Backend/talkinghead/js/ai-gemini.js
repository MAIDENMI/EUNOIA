/**
 * Google Gemini AI Integration Module
 * Streaming chat completions with function calling support
 */

import { API_PROXIES, API_ENDPOINTS } from './config.js';
import { cfg, jwtGet, nWords } from './utils.js';

// =============================================================================
// MODULE STATE
// =============================================================================

let aiController = null;

// =============================================================================
// PUBLIC FUNCTIONS
// =============================================================================

/**
 * Build message array for Gemini API from UI
 * @returns {Array} Array of message objects with role and content
 */
export function geminiBuildMessage() {
  const msgs = [];

  const systems = [
    { sel: "[data-ai-gemini-system]", role: "system" },
    { sel: "[data-ai-gemini-user1]", role: "user" },
    { sel: "[data-ai-gemini-ai1]", role: "model" },
    { sel: "[data-ai-gemini-user2]", role: "user" },
    { sel: "[data-ai-gemini-ai2]", role: "model" }
  ];
  const session = d3.select(".session.selected");
  const input = d3.select("#input");
  const messages = session.selectAll(".message:not(.grayed)");

  const limitDialog = cfg('ai-gemini-dialog');
  const limitInput = cfg('ai-gemini-input');
  let dialogs = 0;
  let words = 0;

  // System messages
  systems.forEach(x => {
    const n = d3.select(x.sel).node();
    if (n.value && n.value.length) {
      if (n.dataset.words) {
        words += parseInt(n.dataset.words);
      } else {
        let wc = nWords(n.value);
        n.dataset.words = wc;
        words += wc;
      }
      msgs.push({ n: n, role: x.role, content: n.value });
    }
  });

  // Messages in reverse order
  const revmsgs = [];
  revmsgs.push({ n: input.node(), role: "user", content: input.property("value") });
  words += nWords(input.property("value"));
  messages.nodes().reverse().forEach((n) => {
    if (dialogs < limitDialog && words < limitInput) {
      let role;
      let val;
      if (n.dataset.input && n.dataset.input.length) {
        role = "user";
        val = n.dataset.input;
      } else if (n.dataset.output && n.dataset.output.length) {
        role = "model";
        val = n.dataset.output;
      }
      if (role && val) {
        revmsgs.push({ n: n, role: role, content: val });
        if (n.dataset.words) {
          words += parseInt(n.dataset.words);
        } else {
          let wc = nWords(val);
          n.dataset.words = wc;
          words += wc;
        }
        dialogs++;
      }
    }
  });

  // Build message
  msgs.push(...revmsgs.reverse());

  return msgs;
}

/**
 * Send messages to Gemini API and handle streamed response
 * @param {object} head - TalkingHead instance
 * @param {object} site - Site configuration
 * @param {HTMLElement} node - DOM node for output
 * @param {Array} msgs - Message array from geminiBuildMessage()
 * @param {function} addText - Callback to add text to UI
 * @param {function} elevenSpeak - ElevenLabs TTS function (optional)
 * @param {function} motion - Motion control function
 */
export async function geminiSendMessage(head, site, node, msgs, addText, elevenSpeak = null, motion = null) {
  // Create a new AbortController instance
  aiController = new AbortController();
  const signal = aiController.signal;

  // Elements
  node.dataset.output = '';

  // Chat completion
  try {
    // Message body
    const body = {
      contents: [],
      safetySettings: [
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: {
        temperature: cfg('ai-gemini-temperature'),
        maxOutputTokens: cfg('ai-gemini-output'),
        topP: cfg('ai-gemini-topp'),
        topK: cfg('ai-gemini-topk'),
        candidateCount: 1
      }
    };

    // Add messages
    // Make sure multiturn messages alternate between user and model
    let nextRole = 'user';
    msgs.forEach(x => {
      if (x.role === "system") {
        body["systemInstruction"] = { "parts": [{ "text": x.content }] };
      } else {
        if (x.role !== nextRole) {
          body.contents.push({ role: nextRole, "parts": { "text": "..." } })
        }
        body.contents.push({ role: x.role, "parts": { "text": x.content } });
        nextRole = x.role === 'user' ? 'model' : 'user';
      }
    });

    // Stop
    const stop = cfg('ai-gemini-stop');
    if (stop && stop.length) {
      body.generationConfig.stopSequences = [stop];
    }

    // Function calling
    const isMotionSelected = d3.select("#motion").classed("selected");
    if (isMotionSelected && motion && site) {
      body.tools = [{
        functionDeclarations: [{
          "name": "move_body",
          "description": "Set the action, still pose, gesture and/or mood of your avatar's body in virtual world",
          "parameters": {
            "type": "object",
            "properties": {
              "action": {
                "type": "STRING",
                format: "enum",
                nullable: true,
                "enum": Object.keys(site.animations)
              },
              "stillpose": {
                "type": "STRING",
                format: "enum",
                nullable: true,
                "enum": Object.keys(site.poses)
              },
              "gesture": {
                "type": "STRING",
                format: "enum",
                nullable: true,
                "enum": Object.keys(site.gestures)
              },
              "mood": {
                "type": "STRING",
                format: "enum",
                nullable: true,
                "enum": Object.keys(head.animMoods)
              }
            },
            "required": []
          }
        }]
      }];
    }

    // Function loop
    let fn;
    do {
      fn = null;

      // Endpoint/proxy and authentication
      let url;
      let headers = { "Content-Type": "application/json; charset=utf-8" };
      const apikey = d3.select("#apikey-gemini").property("value");
      if (apikey) {
        url = API_ENDPOINTS.gemini + cfg("ai-model") + ':streamGenerateContent?alt=sse';
        headers["x-goog-api-key"] = apikey;
      } else {
        url = API_PROXIES.gemini + cfg("ai-model") + ':streamGenerateContent?alt=sse';
        headers["Authorization"] = "Bearer " + await jwtGet()
      }

      // Fetch the response from the Gemini API
      const res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        signal
      });

      if (res.ok) {
        // Read the response as a stream of data
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let tts = "";

        while (true) {
          const { done, value } = await reader.read();

          // Extract text data
          if (value) {
            decoder.decode(value).split('\n').forEach(data => {
              if (data.startsWith("data: ")) {
                let finish;
                try {
                  const obj = JSON.parse(data.substring(6).trim());
                  const canditate = obj?.candidates?.[0];
                  finish = canditate?.finishReason || 'STOP';
                  fn = canditate?.content?.parts?.[0]?.functionCall;
                  if (!fn) {
                    node.dataset.markdown += canditate?.content?.parts?.[0]?.text || '';
                    node.dataset.output += canditate?.content?.parts?.[0]?.text || '';
                    tts += canditate?.content?.parts?.[0]?.text || '';
                  }

                } catch (error) {
                  console.log("Error JSON parsing data: " + data);
                }
                if (finish !== 'STOP') {
                  throw new Error("Stopped for " + finish + ".");
                }
              }
            });
          }

          // Speak and break when done
          if (done) {
            if (tts) {
              if (cfg('voice-type') === 'eleven' && elevenSpeak) {
                await elevenSpeak(head, tts + " ", node, addText);
              } else {
                await head.speakText(tts, {
                  lipsyncLang: cfg('voice-lipsync-lang'),
                  ttsVoice: cfg('voice-google-id'),
                  ttsRate: cfg('voice-google-rate'),
                  ttsPitch: cfg('voice-google-pitch')
                }, addText.bind(null, node));
              }
            }
            break;
          } else {
            let ndx = 0;
            ['.', '!', '?', '\n'].forEach(x => {
              let tmp = tts.lastIndexOf(x);
              if (tmp > ndx) ndx = tmp + 1;
            });
            if (ndx > 10) {
              if (cfg('voice-type') === 'eleven' && elevenSpeak) {
                await elevenSpeak(head, tts.substring(0, ndx) + " ", node, addText);
              } else {
                await head.speakText(tts.substring(0, ndx), {
                  lipsyncLang: cfg('voice-lipsync-lang'),
                  ttsVoice: cfg('voice-google-id'),
                  ttsRate: cfg('voice-google-rate'),
                  ttsPitch: cfg('voice-google-pitch')
                }, addText.bind(null, node));
              }
              tts = tts.substring(ndx).trimStart();
            }
          }
        }

      } else {
        console.error(await res.text());
        const json = await res.json();
        throw new Error(json.error ? json.error.message : '' + res.status);
      }

      // Call function
      if (fn && motion) {
        // Add function call to body
        body.contents.push({
          role: "model",
          parts: [
            {
              functionCall: {
                name: "move_body",
                args: {
                  "action": fn.args?.["action"],
                  "stillpose": fn.args?.["stillpose"],
                  "gesture": fn.args?.["gesture"],
                  "mood": fn.args?.["mood"]
                }
              }
            }
          ]
        });

        // Call function
        try {
          motion(head, site, fn.args?.["action"], fn.args?.["stillpose"], fn.args?.["gesture"], fn.args?.["mood"]);
        } catch (motionError) {
          console.error(motionError);
        }

        // Add response
        body.contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: "move_body",
                response: {
                  "status": "ok"
                }
              }
            }
          ]
        });

        // Instruct not to make another call
        body.toolConfig = { functionCallingConfig: { mode: "NONE" } };
      }

    } while (fn); // Repeat, if this iteration was a function call

  } catch (error) {
    if (signal.aborted) error = "aborted";
    console.error(error);
    addText(node, ' [' + error + ']');
  } finally {
    aiController = null; // Reset the AbortController instance
    
    // Close TTS connections
    if (elevenSpeak) {
      await elevenSpeak(head, "", null);
    }

    // When this marker has been reached, stop blinking
    head.speakMarker(() => {
      d3.selectAll('.blink').classed("blink", false);
    });
  }
}

/**
 * Stop current AI generation
 */
export function geminiStop() {
  if (aiController) {
    aiController.abort();
    aiController = null;
  }
}

/**
 * Check if Gemini is currently processing
 * @returns {boolean} True if processing
 */
export function geminiIsProcessing() {
  return aiController !== null;
}

