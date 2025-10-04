'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Hook to manage audio playback queue to prevent overlapping audio
 */
export const useAudioQueue = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<string[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioFromBase64 = useCallback(async (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔊 Decoding audio chunk, length:', base64Audio.length);
        
        // Convert base64 to audio blob
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('🔊 Creating audio blob, size:', bytes.length, 'bytes');
        
        // Detect audio format from the first few bytes (magic numbers)
        let mimeType = 'audio/mpeg'; // default
        if (bytes.length > 4) {
          // Check for common audio format signatures
          if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            // RIFF header (WAV)
            mimeType = 'audio/wav';
            console.log('🔊 Detected WAV format');
          } else if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
            // MP3 frame sync
            mimeType = 'audio/mpeg';
            console.log('🔊 Detected MP3 format');
          } else if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
            // Ogg header
            mimeType = 'audio/ogg';
            console.log('🔊 Detected OGG format');
          } else if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
            // WebM/Matroska header
            mimeType = 'audio/webm';
            console.log('🔊 Detected WebM format');
          } else {
            console.log('🔊 Unknown format, first bytes:', 
              Array.from(bytes.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
            );
            // Try mulaw (common for telephony/realtime audio)
            mimeType = 'audio/basic';
          }
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        audio.onloadedmetadata = () => {
          console.log('🔊 Audio metadata loaded, duration:', audio.duration, 'format:', mimeType);
        };
        
        audio.onended = () => {
          console.log('✅ Audio playback finished');
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };
        
        audio.onerror = () => {
          const error = audio.error;
          console.error('❌ Audio playback error:', {
            code: error?.code,
            message: error?.message,
            detectedMimeType: mimeType,
            MEDIA_ERR_ABORTED: error?.code === 1,
            MEDIA_ERR_NETWORK: error?.code === 2,
            MEDIA_ERR_DECODE: error?.code === 3,
            MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
          });
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error(`Audio error code: ${error?.code}, message: ${error?.message}`));
        };
        
        console.log('🔊 Starting playback with MIME type:', mimeType);
        audio.play().catch((err) => {
          console.error('❌ Play() failed:', err.name, err.message);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(err);
        });
      } catch (error) {
        console.error('❌ Error in playAudioFromBase64:', error);
        reject(error);
      }
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isPlaying || queueRef.current.length === 0) {
      return;
    }

    console.log('🎵 Processing audio queue, items:', queueRef.current.length);
    setIsPlaying(true);

    while (queueRef.current.length > 0) {
      const audioData = queueRef.current.shift();
      if (audioData) {
        try {
          await playAudioFromBase64(audioData);
        } catch (error) {
          console.error('❌ Error playing audio chunk:', error instanceof Error ? error.message : error);
          // Continue to next chunk even if one fails
        }
      }
    }

    console.log('✅ Audio queue processing complete');
    setIsPlaying(false);
  }, [isPlaying, playAudioFromBase64]);

  const enqueueAudio = useCallback((base64Audio: string) => {
    console.log('➕ Enqueueing audio chunk, queue size:', queueRef.current.length + 1);
    queueRef.current.push(base64Audio);
    processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
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
