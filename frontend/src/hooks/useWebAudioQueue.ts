'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Hook to manage audio playback queue using Web Audio API
 * This supports more audio formats than the HTML Audio element
 */
export const useWebAudioQueue = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<ArrayBuffer[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playAudioBuffer = useCallback(async (arrayBuffer: ArrayBuffer, isPCM: boolean = false): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = getAudioContext();
        
        console.log('🔊 Processing audio buffer, size:', arrayBuffer.byteLength, 'isPCM:', isPCM);

        if (isPCM) {
          // Handle raw PCM audio (common for ElevenLabs WebSocket)
          // ElevenLabs typically sends 16-bit PCM at 16000 Hz, mono
          const sampleRate = 16000; // ElevenLabs default
          const numberOfChannels = 1; // Mono
          
          // Convert Int16 PCM to Float32 for Web Audio API
          const int16Array = new Int16Array(arrayBuffer);
          const float32Array = new Float32Array(int16Array.length);
          
          for (let i = 0; i < int16Array.length; i++) {
            // Convert from Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
            float32Array[i] = int16Array[i] / 32768.0;
          }
          
          const audioBuffer = audioContext.createBuffer(
            numberOfChannels,
            float32Array.length,
            sampleRate
          );
          
          audioBuffer.getChannelData(0).set(float32Array);
          
          console.log('✅ PCM audio buffer created:', {
            duration: audioBuffer.duration,
            channels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            samples: float32Array.length,
          });

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          
          currentSourceRef.current = source;

          source.onended = () => {
            console.log('✅ Audio playback finished');
            currentSourceRef.current = null;
            resolve();
          };

          console.log('🔊 Starting PCM audio playback...');
          source.start(0);
        } else {
          // Handle encoded audio formats (MP3, WAV, OGG, etc.)
          audioContext.decodeAudioData(
            arrayBuffer,
            (audioBuffer) => {
              console.log('✅ Audio decoded successfully:', {
                duration: audioBuffer.duration,
                channels: audioBuffer.numberOfChannels,
                sampleRate: audioBuffer.sampleRate,
              });

              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              
              currentSourceRef.current = source;

              source.onended = () => {
                console.log('✅ Audio playback finished');
                currentSourceRef.current = null;
                resolve();
              };

              console.log('🔊 Starting Web Audio playback...');
              source.start(0);
            },
            (error: DOMException) => {
              console.error('❌ Audio decode error:', error);
              reject(new Error(`Failed to decode audio: ${error.message || error}`));
            }
          );
        }
      } catch (error) {
        console.error('❌ Error in playAudioBuffer:', error);
        reject(error);
      }
    });
  }, [getAudioContext]);

  const processQueue = useCallback(async () => {
    if (isPlaying || queueRef.current.length === 0) {
      return;
    }

    console.log('🎵 Processing Web Audio queue, items:', queueRef.current.length);
    setIsPlaying(true);

    while (queueRef.current.length > 0) {
      const audioBuffer = queueRef.current.shift();
      if (audioBuffer) {
        try {
          // ElevenLabs WebSocket sends PCM audio
          await playAudioBuffer(audioBuffer, true);
        } catch (error) {
          console.error('❌ Error playing audio chunk:', error instanceof Error ? error.message : error);
          // Continue to next chunk even if one fails
        }
      }
    }

    console.log('✅ Web Audio queue processing complete');
    setIsPlaying(false);
  }, [isPlaying, playAudioBuffer]);

  const enqueueAudio = useCallback((base64Audio: string) => {
    console.log('➕ Enqueueing Web Audio chunk, queue size:', queueRef.current.length + 1);
    
    try {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      queueRef.current.push(bytes.buffer);
      processQueue();
    } catch (error) {
      console.error('❌ Error enqueueing audio:', error);
    }
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    console.log('🗑️ Clearing Web Audio queue');
    queueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
  }, []);

  return {
    enqueueAudio,
    clearQueue,
    stopCurrentAudio,
    isPlaying,
    queueLength: queueRef.current.length,
  };
};
