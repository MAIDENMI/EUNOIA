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
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playAudioBuffer = useCallback(async (arrayBuffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = getAudioContext();
        
        console.log('🔊 Decoding audio buffer, size:', arrayBuffer.byteLength);

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
          (error) => {
            console.error('❌ Audio decode error:', error);
            reject(new Error(`Failed to decode audio: ${error.message || error}`));
          }
        );
      } catch (error) {
        console.error('❌ Error in playAudioBuffer:', error);
        reject(error);
      }
    });
  }, [getAudioContext]);

  const playAudioFromBase64 = useCallback(async (base64Audio: string): Promise<void> => {
    try {
      console.log('🔊 Converting base64 to ArrayBuffer, length:', base64Audio.length);
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('🔊 First bytes:', 
        Array.from(bytes.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
      );
      
      await playAudioBuffer(bytes.buffer);
    } catch (error) {
      console.error('❌ Error in playAudioFromBase64:', error);
      throw error;
    }
  }, [playAudioBuffer]);

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
          await playAudioBuffer(audioBuffer);
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
      } catch (e) {
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
      } catch (e) {
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
