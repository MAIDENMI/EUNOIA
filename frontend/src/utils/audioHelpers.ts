/**
 * Convert base64 audio to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Estimate word timings based on text and total duration
 * This is a simple estimation - words are distributed evenly
 */
export function estimateWordTimings(text: string, totalDuration: number) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgDuration = totalDuration / words.length;
  
  const wtimes: number[] = [];
  const wdurations: number[] = [];
  
  words.forEach((_, index) => {
    wtimes.push(index * avgDuration);
    wdurations.push(avgDuration);
  });
  
  return { words, wtimes, wdurations };
}

/**
 * Get audio duration from ArrayBuffer using Web Audio API
 */
export async function getAudioDuration(arrayBuffer: ArrayBuffer): Promise<number> {
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextConstructor();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    // Fallback: estimate based on size and typical bitrate
    // Assuming 128kbps MP3
    return arrayBuffer.byteLength / (128000 / 8);
  }
}

/**
 * Send audio to TalkingHead iframe for playback with lip-sync
 */
export async function sendAudioToTalkingHead(
  iframe: HTMLIFrameElement,
  base64Audio: string,
  text: string,
  targetOrigin: string = 'http://localhost:8080'
) {
  try {
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const duration = await getAudioDuration(arrayBuffer);
    const { words, wtimes, wdurations } = estimateWordTimings(text, duration * 1000); // Convert to ms
    
    console.log('📤 Sending audio to TalkingHead:', {
      audioSize: arrayBuffer.byteLength,
      duration,
      words: words.length,
    });
    
    // Send to TalkingHead iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'SPEAK_AUDIO',
        audio: arrayBuffer,
        words,
        wtimes,
        wdurations,
      }, targetOrigin);
    }
  } catch (error) {
    console.error('Error sending audio to TalkingHead:', error);
    throw error;
  }
}
