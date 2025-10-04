'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceStream } from 'voice-stream';
import type { ElevenLabsWebSocketEvent } from '@/types/elevenlabs-websocket';
import { useWebAudioQueue } from './useWebAudioQueue';

const sendMessage = (websocket: WebSocket, request: object) => {
  if (websocket.readyState !== WebSocket.OPEN) {
    return;
  }
  websocket.send(JSON.stringify(request));
};

interface UseElevenLabsAgentOptions {
  agentId?: string;
  signedUrl?: string;
  useAgentAudio?: boolean; // If false, only transcripts are used (for external TTS like TalkingHead)
  isMuted?: boolean; // If true, don't send audio chunks to agent
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
  onAgentResponseCorrection?: (original: string, corrected: string) => void;
  onInterruption?: (reason: string) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
  onAudioReceived?: (base64Audio: string) => void; // Optional callback for raw audio
}

export const useElevenLabsAgent = (options: UseElevenLabsAgentOptions = {}) => {
  const {
    agentId,
    signedUrl,
    useAgentAudio = false, // Default to false - use external TTS
    isMuted = false,
    onUserTranscript,
    onAgentResponse,
    onAgentResponseCorrection,
    onInterruption,
    onConnectionStatusChange,
    onAudioReceived,
  } = options;

  const websocketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueAudio, clearQueue, stopCurrentAudio, isPlaying } = useWebAudioQueue();
  
  // Use ref to always get current value in WebSocket handler
  const useAgentAudioRef = useRef(useAgentAudio);
  useAgentAudioRef.current = useAgentAudio;

  const { startStreaming, stopStreaming } = useVoiceStream({
    onAudioChunked: (audioData) => {
      if (!websocketRef.current) {
        console.warn('⚠️ WebSocket not connected, cannot send audio chunk');
        return;
      }
      
      // Don't send audio if user is muted
      if (isMuted) {
        console.log('🔇 Microphone muted - not sending audio chunk');
        return;
      }
      
      console.log('🎤 Sending audio chunk to agent, size:', audioData.length, 'bytes');
      sendMessage(websocketRef.current, {
        user_audio_chunk: audioData,
      });
    },
  });

  const startConversation = useCallback(async () => {
    if (isConnected) {
      console.warn('⚠️ Already connected to agent');
      return;
    }

    setError(null);
    console.log('🔧 Starting ElevenLabs conversation...', { agentId, signedUrl });

    try {
      // Construct WebSocket URL
      let wsUrl: string;
      
      if (signedUrl) {
        // Use signed URL for private agents
        wsUrl = signedUrl;
        console.log('🔐 Using signed URL for private agent');
      } else if (agentId) {
        // Use agent ID for public agents
        wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
        console.log('🌐 Using public agent ID:', agentId);
      } else {
        throw new Error('Either agentId or signedUrl must be provided');
      }

      console.log('🔌 Connecting to WebSocket:', wsUrl.substring(0, 60) + '...');
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('✅ WebSocket connected to ElevenLabs agent');
        setIsConnected(true);
        onConnectionStatusChange?.(true);
        console.log('🎤 Starting audio streaming...');
        startStreaming();
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Failed to connect to ElevenLabs agent. Check your Agent ID and network connection.');
      };

      websocket.onmessage = (event) => {
        try {
          const data: ElevenLabsWebSocketEvent = JSON.parse(event.data);

          // Handle ping events to keep connection alive
          if (data.type === "ping") {
            setTimeout(() => {
              sendMessage(websocket, {
                type: "pong",
                event_id: data.ping_event.event_id,
              });
            }, data.ping_event.ping_ms || 0);
          }

          // Handle user transcript
          if (data.type === "user_transcript") {
            const { user_transcription_event } = data;
            console.log("User transcript:", user_transcription_event.user_transcript);
            onUserTranscript?.(user_transcription_event.user_transcript);
          }

          // Handle agent response
          if (data.type === "agent_response") {
            const { agent_response_event } = data;
            console.log("Agent response:", agent_response_event.agent_response);
            onAgentResponse?.(agent_response_event.agent_response);
          }

          // Handle agent response correction
          if (data.type === "agent_response_correction") {
            const { agent_response_correction_event } = data;
            console.log("Agent response correction:", agent_response_correction_event.corrected_agent_response);
            onAgentResponseCorrection?.(
              agent_response_correction_event.original_agent_response,
              agent_response_correction_event.corrected_agent_response
            );
          }

          // Handle interruption
          if (data.type === "interruption") {
            const { interruption_event } = data;
            console.log("Interruption:", interruption_event.reason);
            onInterruption?.(interruption_event.reason);
            // Clear audio queue on interruption
            clearQueue();
          }

          // Handle audio response
          if (data.type === "audio") {
            const { audio_event } = data;
            const currentUseAgentAudio = useAgentAudioRef.current;
            
            console.log('🎵 Received audio chunk:', {
              eventId: audio_event.event_id,
              audioLength: audio_event.audio_base_64?.length || 0,
              hasAudioData: !!audio_event.audio_base_64,
              useAgentAudio: currentUseAgentAudio,
            });
            
            if (audio_event.audio_base_64) {
              // If using agent audio, enqueue for playback
              if (currentUseAgentAudio) {
                console.log('🔊 Using ElevenLabs agent audio - playing through Web Audio');
                enqueueAudio(audio_event.audio_base_64);
              } else {
                console.log('🔇 Ignoring ElevenLabs audio (using external TTS)');
              }
              
              // Call optional callback with raw audio data
              onAudioReceived?.(audio_event.audio_base_64);
            } else {
              console.warn('⚠️ Received audio event with no data');
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = async (event) => {
        console.log('🔌 WebSocket connection closed', { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        });
        websocketRef.current = null;
        setIsConnected(false);
        onConnectionStatusChange?.(false);
        stopStreaming();
        clearQueue();
      };

      websocketRef.current = websocket;
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsConnected(false);
      onConnectionStatusChange?.(false);
    }
  }, [
    isConnected,
    agentId,
    signedUrl,
    useAgentAudio,
    startStreaming,
    stopStreaming,
    onUserTranscript,
    onAgentResponse,
    onAgentResponseCorrection,
    onInterruption,
    onConnectionStatusChange,
    onAudioReceived,
    enqueueAudio,
    clearQueue,
  ]);

  const stopConversation = useCallback(async () => {
    if (!websocketRef.current) return;
    
    console.log('🛑 Ending ElevenLabs conversation session...');
    
    // Send end of conversation message to properly terminate the session
    try {
      sendMessage(websocketRef.current, {
        type: "end_of_conversation",
      });
      console.log('✅ Sent end_of_conversation message');
      
      // Wait a brief moment for the message to be sent
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error sending end_of_conversation:', error);
    }
    
    // Now close the WebSocket connection
    websocketRef.current.close();
    clearQueue();
    console.log('🔌 WebSocket closed');
  }, [clearQueue]);

  const sendContextualUpdate = useCallback((text: string) => {
    if (!websocketRef.current || !isConnected) {
      console.warn('Cannot send contextual update: not connected');
      return;
    }
    sendMessage(websocketRef.current, {
      type: "contextual_update",
      text,
    });
  }, [isConnected]);

  const interruptAgent = useCallback(() => {
    stopCurrentAudio();
    clearQueue();
  }, [stopCurrentAudio, clearQueue]);

  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  return {
    startConversation,
    stopConversation,
    sendContextualUpdate,
    interruptAgent,
    isConnected,
    isAgentSpeaking: isPlaying,
    error,
  };
};
