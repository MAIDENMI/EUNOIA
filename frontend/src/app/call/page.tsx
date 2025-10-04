"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { Card } from "@/components/ui/card";
import { Dock } from "@/components/ui/dock-two";
import { FadingTextStream } from "@/components/ui/fading-text-stream";
import { motion, useMotionValue, animate } from "framer-motion";
import { 
  Grid2x2, 
  Maximize2, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Phone,
  MoreVertical,
  Subtitles,
  Menu,
  ChevronDown,
  ArrowUp,
  Square,
  MessageSquare
} from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { useElevenLabsAgent } from "@/hooks/useElevenLabsAgent";
import { config } from "@/lib/config";

export default function CallPage() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [viewMode, setViewMode] = useState<"pip" | "split">("pip"); // pip = picture-in-picture, split = 50/50
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCaptionsOn, setIsCaptionsOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<"google" | "eleven">("eleven");
  const [useWebSocket, setUseWebSocket] = useState<boolean>(true); // Toggle between WebSocket and legacy mode (default: true)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [chatInputValue, setChatInputValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const talkingHeadRef = useRef<HTMLIFrameElement>(null);
  const userId = useRef<string>(`user_${Date.now()}`);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Start audio level monitoring
  const startAudioLevelMonitoring = async () => {
    try {
      console.log('🎤 Starting audio level monitoring...');
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(micStream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume (0-255 range)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        // Normalize to 0-1 range with some scaling for better visual effect
        const normalizedLevel = Math.min(average / 100, 1.5);
        
        setAudioLevel(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      console.log('✅ Audio level monitoring started');
    } catch (error) {
      console.error('❌ Error starting audio level monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    console.log('🔇 Stopping audio level monitoring...');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // ElevenLabs WebSocket Agent Integration
  const {
    startConversation,
    stopConversation,
    isConnected: isAgentConnected,
    isAgentSpeaking,
    error: agentError,
    sendContextualUpdate,
    interruptAgent,
  } = useElevenLabsAgent({
    agentId: config.elevenlabs.agentId,
    useAgentAudio: false, // Always ignore agent audio - we use TalkingHead for TTS
    isMuted: !isMicOn, // Pass mute state to agent
    onUserTranscript: (userTranscript) => {
      console.log('👤 User said:', userTranscript);
      setTranscript(userTranscript);
      setMessages(prev => [...prev, { role: 'user', content: userTranscript }]);
    },
    onAgentResponse: (response) => {
      console.log('🤖 Agent text response received:', response);
      setAiResponse(response);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Send text to TalkingHead for TTS + lip-sync (using configured voice provider)
      if (talkingHeadRef.current && talkingHeadRef.current.contentWindow) {
        console.log('📤 Sending text to TalkingHead for TTS + animation');
        setIsSpeaking(true);
        
        // Send speak command with the agent's text response
        talkingHeadRef.current.contentWindow.postMessage({
          type: 'speak',
          payload: { text: response }
        }, 'http://localhost:8080');
        
        // Estimate speaking time
        const wordsPerMinute = 150;
        const words = response.split(' ').length;
        const estimatedDuration = (words / wordsPerMinute) * 60 * 1000;
        
        setTimeout(() => {
          setIsSpeaking(false);
        }, estimatedDuration);
      }
    },
    onAgentResponseCorrection: (original, corrected) => {
      console.log('✏️ Agent corrected response:', corrected);
      setAiResponse(corrected);
      // Update the last message
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = corrected;
        }
        return newMessages;
      });
    },
    onInterruption: (reason) => {
      console.log('⚠️ Conversation interrupted:', reason);
      setIsProcessing(false);
    },
    onConnectionStatusChange: (connected) => {
      console.log('🔌 Agent connection status:', connected);
      setIsListening(connected);
    },
  });
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Removed placeholder sampleText. Show only real transcript/response in UI.

  // Voice processing functions
  const startRecording = async () => {
    // Check for microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissionError('Microphone access is required for voice chat. Please allow microphone access and try again.');
      setShowPermissionHelp(true);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsListening(true);
      setTranscript("");
      setAiResponse("");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsRecording(false);
      setIsListening(false);
      processMessage(result);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsListening(false);
      setAiResponse("Sorry, I couldn't hear you clearly. Please try again.");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processMessage = async (message: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: messages.slice(-4),
          user_id: userId.current
        })
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.status}`);
      }

      const data = await response.json();
      setAiResponse(data.response);
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.response }
      ]);

      // Make TalkingHead speak
      if (talkingHeadRef.current) {
        makeTalkingHeadSpeak(data.response);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMsg = "I'm having trouble connecting. Please check that the backend services are running.";
      setAiResponse(errorMsg);
      
      if (talkingHeadRef.current) {
        makeTalkingHeadSpeak(errorMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const makeTalkingHeadSpeak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Send message to TalkingHead iframe
      if (talkingHeadRef.current && talkingHeadRef.current.contentWindow) {
        talkingHeadRef.current.contentWindow.postMessage({
          type: 'SPEAK',
          text: text,
          voice: 'Rachel'
        }, 'http://localhost:8080');
      }

      // Get voice from our service
      const voiceResponse = await fetch('http://localhost:8001/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice_id: '21m00Tcm4TlvDq8ikWAM' // Rachel
        })
      });

      if (voiceResponse.ok) {
        const voiceData = await voiceResponse.json();
        if (voiceData.audio_base64) {
          await playAudio(voiceData.audio_base64);
        }
      }

    } catch (error) {
      console.error('TalkingHead speak error:', error);
      setIsSpeaking(false);
    }
  };

  const playAudio = (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          reject(error);
        };
        
        audio.play().catch(reject);
      } catch (error) {
        setIsSpeaking(false);
        reject(error);
      }
    });
  };

  // Timer for call duration
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCallTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load saved settings from sessionStorage (for user preferences only)
  useEffect(() => {
    try {
      const provider = (sessionStorage.getItem("voice-provider") as "google" | "eleven") || "eleven";
      setVoiceProvider(provider);
      // Default to WebSocket mode (true) if not set
      const wsMode = sessionStorage.getItem("use-websocket");
      setUseWebSocket(wsMode === null ? true : wsMode === "true");
    } catch {}
  }, []);

  const postToIframe = (type: string, payload?: any) => {
    try {
      const target = talkingHeadRef.current?.contentWindow;
      if (!target) return;
      target.postMessage({ type, payload }, config.talkingHead.url);
    } catch {}
  };

  const applySettingsToIframe = () => {
    // Apply API keys from environment to iframe
    console.log('🔧 Applying settings to TalkingHead iframe', {
      hasGoogleKey: !!config.google.apiKey,
      hasElevenLabsKey: !!config.elevenlabs.apiKey,
      voiceProvider
    });
    
    if (config.google.apiKey) {
      console.log('📤 Sending Google API key to iframe');
      postToIframe("saveApiKey", { provider: "google", key: config.google.apiKey });
    } else {
      console.warn('⚠️ No Google API key found in config');
    }
    
    if (config.elevenlabs.apiKey) {
      console.log('📤 Sending ElevenLabs API key to iframe');
      postToIframe("saveApiKey", { provider: "eleven", key: config.elevenlabs.apiKey });
    } else {
      console.warn('⚠️ No ElevenLabs API key found in config. Add NEXT_PUBLIC_ELEVENLABS_API_KEY to .env.local');
    }
    
    postToIframe("setVoice", { value: voiceProvider });
  };

  const handleIframeLoad = () => {
    applySettingsToIframe();
  };

  const handleVoiceChange = (val: "google" | "eleven") => {
    setVoiceProvider(val);
    sessionStorage.setItem("voice-provider", val);
    postToIframe("setVoice", { value: val });
  };

  const handleWebSocketToggle = () => {
    const newValue = !useWebSocket;
    setUseWebSocket(newValue);
    sessionStorage.setItem("use-websocket", String(newValue));
  };

  // Handle starting/stopping the WebSocket conversation
  const handleToggleConversation = useCallback(async () => {
    console.log('🎙️ Toggle conversation clicked', { useWebSocket, isAgentConnected, agentId: config.elevenlabs.agentId });
    
    if (!useWebSocket) {
      // Fall back to legacy voice recording
      startRecording();
      return;
    }

    if (isAgentConnected) {
      console.log('🛑 Ending conversation immediately...');
      
      // Immediately stop any speaking/audio
      setIsSpeaking(false);
      interruptAgent(); // Stop agent audio playback
      
      // Stop TalkingHead from speaking
      if (talkingHeadRef.current && talkingHeadRef.current.contentWindow) {
        console.log('🔇 Stopping TalkingHead speech');
        talkingHeadRef.current.contentWindow.postMessage({
          type: 'stop',
        }, 'http://localhost:8080');
      }
      
      // Disconnect WebSocket immediately
      await stopConversation();
      stopAudioLevelMonitoring();
      
      // Clear UI
      setTranscript("");
      setAiResponse("");
      
      console.log('✅ Conversation ended');
    } else {
      if (!config.elevenlabs.agentId) {
        console.warn('❌ No Agent ID configured');
        alert('Please configure your ElevenLabs Agent ID in the .env.local file.\n\nAdd: NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id');
        return;
      }
      
      console.log('🚀 Starting conversation with Agent ID:', config.elevenlabs.agentId);
      console.log('🎯 Flow: Agent provides text → TalkingHead handles TTS + animation');
      console.log('🔊 Voice Provider:', voiceProvider === 'eleven' ? 'ElevenLabs TTS' : 'Google TTS');
      
      // Request microphone permission
      try {
        console.log('🎤 Requesting microphone permission...');
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
        micStream.getTracks().forEach(track => track.stop()); // Clean up test stream
        
        // Start audio level monitoring for gradient visualization
        await startAudioLevelMonitoring();
        
        console.log('🔌 Initiating WebSocket connection...');
        await startConversation();
        console.log('✅ Conversation started successfully');
      } catch (error) {
        console.error('❌ Error starting conversation:', error);
        setPermissionError('Microphone access is required for voice chat. Please allow microphone access and try again.');
        setShowPermissionHelp(true);
      }
    }
  }, [useWebSocket, isAgentConnected, sendContextualUpdate, stopConversation, startConversation, voiceProvider, interruptAgent]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid interfering with inputs/textareas
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      // Space: start/stop session
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleConversation();
      }
      // M: mute/unmute
      if (e.key.toLowerCase() === 'm') {
        setIsMicOn(prev => !prev);
      }
      // V: toggle video
      if (e.key.toLowerCase() === 'v') {
        setIsVideoOn(prev => !prev);
      }
      // C: toggle captions
      if (e.key.toLowerCase() === 'c') {
        setIsCaptionsOn(prev => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleConversation]);

  const handleDragEnd = () => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();
    
    // Video card dimensions
    const videoWidth = 192; // w-48 = 12rem = 192px
    const videoHeight = 144; // h-36 = 9rem = 144px
    const padding = 16; // 4 = 1rem = 16px
    
    // Calculate the full width and height of the container
    const maxLeft = -(containerRect.width - videoWidth - padding * 2);
    const maxTop = -(containerRect.height - videoHeight - padding * 2);
    
    let snapX = 0;
    let snapY = 0;
    
    // Determine horizontal snap (left or right)
    if (currentX < maxLeft / 2) {
      // Snap to left
      snapX = maxLeft;
    } else {
      // Snap to right (default position)
      snapX = 0;
    }
    
    // Determine vertical snap (top or bottom)
    if (currentY < maxTop / 2) {
      // Snap to top
      snapY = maxTop;
    } else {
      // Snap to bottom (default position)
      snapY = 0;
    }
    
    // Animate to snap position with spring
    animate(x, snapX, { type: "spring", stiffness: 300, damping: 30 });
    animate(y, snapY, { type: "spring", stiffness: 300, damping: 30 });
  };

  // Setup webcam once on mount
  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
      } catch (error) {
        console.error("Error accessing webcam:", error);
        const mediaError = error as DOMException;
        if (mediaError.name === 'NotAllowedError') {
          console.log("Camera/microphone permission denied. User can still use voice chat without video.");
        } else if (mediaError.name === 'NotFoundError') {
          console.log("No camera/microphone found. User can still use voice chat.");
        } else {
          console.log("Camera setup failed:", mediaError.message || 'Unknown error');
        }
      }
    }

    setupCamera();

    // Cleanup function to stop the video stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Apply stream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, viewMode]);

  // Control video track based on isVideoOn state
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOn;
      }
    }
  }, [isVideoOn, stream]);

  // Control audio track based on isMicOn state
  useEffect(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
      }
    }
  }, [isMicOn, stream]);

  // Cleanup audio monitoring on unmount or when connection changes
  useEffect(() => {
    if (!isAgentConnected) {
      stopAudioLevelMonitoring();
    }
  }, [isAgentConnected]);

  useEffect(() => {
    return () => {
      stopAudioLevelMonitoring();
    };
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isAgentSpeaking]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground audioLevel={audioLevel} isListening={isListening} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full p-8">
        <div className="w-full h-full flex flex-col px-6 py-2 gap-1">
          {/* Header with Session Title and Timer */}
          <div className="flex items-center justify-between my-4">
            {/* Session Title */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-foreground">AI Therapy Session</h2>
              
              {/* Connection Status Indicator */}
              {useWebSocket && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  isAgentConnected 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-gray-500/20 border-gray-500/50'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isAgentConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span className="text-xs font-medium">
                    {isAgentConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Timer Pill */}
            <motion.div
              className="flex px-4 py-2 border items-center justify-center rounded-full gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Recording indicator dot */}
              <motion.div
                className="w-2 h-2 bg-red-600 rounded-full"
                animate={{
                  opacity: [1, 0.3, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Timer */}
              <div className="text-sm text-muted-foreground font-mono">
                {formatTime(callTime)}
              </div>
            </motion.div>
          </div>

          {/* Main Content Area - Video and Settings Side by Side */}
          <div className="flex-1 flex gap-4 items-start justify-center overflow-hidden">
            {/* Video Area - Takes up remaining space */}
            <div className="flex-1 flex items-center justify-center h-full">
            {/* Picture-in-Picture Mode */}
            {viewMode === "pip" && (
              <div ref={containerRef} className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
                {/* AI Therapist Video - TalkingHead iframe */}
                <iframe
                  ref={talkingHeadRef}
                  onLoad={handleIframeLoad}
                  src="http://localhost:8080/index-modular.html"
                  className="w-full h-full border-0"
                  allow="camera; microphone; autoplay; fullscreen"
                />

                {/* Captions - Bottom Left */}
                {isCaptionsOn && (
                  <div className="absolute bottom-6 left-6 max-w-2xl space-y-2">
                    <div className="flex gap-2">
                      {/* WebSocket Connection Status */}
                      {useWebSocket && isAgentConnected && (
                        <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-400/50 inline-flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <p className="text-green-200 text-xs">Live Connection Active</p>
                        </div>
                      )}
                      
                      {/* Muted Indicator */}
                      {!isMicOn && (
                        <div className="bg-red-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-400/50 inline-flex items-center gap-2">
                          <MicOff className="w-3 h-3 text-red-400" />
                          <p className="text-red-200 text-xs">Muted</p>
                        </div>
                      )}
                    </div>
                    
                    {transcript && (
                      <div className="bg-blue-500/20 backdrop-blur-sm p-3 rounded-lg border border-blue-400/50">
                        <p className="text-blue-200 text-xs mb-1">You:</p>
                        <p className="text-white text-sm">{transcript}</p>
                      </div>
                    )}
                    {aiResponse && (
                      <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-400/50">
                        <p className="text-purple-200 text-xs mb-1">EMURA:</p>
                        <FadingTextStream 
                          text={aiResponse}
                          speed={50}
                          className="text-white text-sm"
                          lines={3}
                          showGradients={false}
                        />
                      </div>
                    )}
                    {(isProcessing || isAgentSpeaking) && (
                      <div className="bg-gray-500/20 backdrop-blur-sm p-3 rounded-lg border border-gray-400/50">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                          </div>
                          <span className="text-white text-sm">
                            {isAgentSpeaking ? "EMURA is speaking..." : "EMURA is thinking..."}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* User's Video - Draggable Floating Card */}
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0.05}
                  dragConstraints={containerRef}
                  style={{ x, y }}
                  onDragEnd={handleDragEnd}
                  className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700 overflow-hidden cursor-move"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </motion.div>
              </div>
            )}

            {/* Split View Mode (50/50) */}
            {viewMode === "split" && (
              <div className="w-full h-full flex gap-4">
                {/* AI Therapist Video - Left Side */}
                <div className="relative w-1/2 h-full bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <iframe
                    ref={talkingHeadRef}
                    onLoad={handleIframeLoad}
                    src="http://localhost:8080/index-modular.html"
                    className="w-full h-full border-0"
                    allow="camera; microphone; autoplay; fullscreen"
                  />
                  
                  {/* Captions - Bottom Left */}
                  {isCaptionsOn && (
                    <div className="absolute bottom-6 left-6 max-w-xl space-y-2">
                      {transcript && (
                        <div className="bg-blue-500/20 backdrop-blur-sm p-3 rounded-lg border border-blue-400/50">
                          <p className="text-blue-200 text-xs mb-1">You:</p>
                          <p className="text-white text-sm">{transcript}</p>
                        </div>
                      )}
                      {aiResponse && (
                        <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-400/50">
                          <p className="text-purple-200 text-xs mb-1">EMURA:</p>
                          <FadingTextStream 
                            text={aiResponse}
                            speed={50}
                            className="text-white text-sm"
                            lines={3}
                            showGradients={false}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* User's Video - Right Side */}
                <div className="w-1/2 h-full bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              </div>
            )}
            </div>

            {/* Chat Sidebar Panel - Slides in from right */}
          <motion.div
            initial={false}
            animate={{
                width: showHistory ? "450px" : 0,
              opacity: showHistory ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden h-full"
          >
              <div className="w-[450px] h-full bg-muted/30 backdrop-blur-sm border rounded-lg flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Conversation</h3>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                    isAgentConnected 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isAgentConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`} />
                    {isAgentConnected ? 'Connected' : 'Offline'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {messages.length === 0 
                    ? 'Start a conversation with EMURA' 
                    : `${messages.length} messages`}
                </p>
              </div>

              {/* Chat Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground text-sm">
                      <p className="mb-2">No messages yet</p>
                      <p className="text-xs">Click the phone icon to start</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500/20 border border-blue-400/50'
                          : 'bg-purple-500/20 border border-purple-400/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.role === 'user' ? 'text-blue-400' : 'text-purple-400'
                          }`}>
                            {message.role === 'user' ? 'You' : 'EMURA'}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                
                {/* Loading indicator */}
                {(isProcessing || isAgentSpeaking) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-xs text-purple-400">
                          {isAgentSpeaking ? "EMURA is speaking..." : "EMURA is thinking..."}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <PromptInput
                  value={chatInputValue}
                  onValueChange={setChatInputValue}
                  isLoading={isProcessing || isAgentSpeaking}
                  onSubmit={() => {
                    const message = chatInputValue.trim();
                    if (message) {
                      // Add user message to chat
                      setMessages(prev => [...prev, { role: 'user', content: message }]);
                      
                      // Send to agent if connected, otherwise use legacy mode
                      if (useWebSocket && isAgentConnected) {
                        sendContextualUpdate(message);
                      } else {
                        processMessage(message);
                      }
                      
                      // Clear input
                      setChatInputValue('');
                    }
                  }}
                >
                  <PromptInputTextarea 
                    placeholder="Type a message to EMURA..." 
                    className="min-h-[60px] resize-none"
                    disabled={!isAgentConnected && useWebSocket}
                  />
                  <PromptInputActions>
                    <PromptInputAction tooltip="Send Message">
                      <Button 
                        size="sm"
                        type="submit"
                        disabled={!isAgentConnected && useWebSocket || !chatInputValue.trim()}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    </PromptInputAction>
                    {isAgentConnected && isAgentSpeaking && (
                      <PromptInputAction tooltip="Stop Speaking">
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            interruptAgent();
                            setIsSpeaking(false);
                          }}
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      </PromptInputAction>
                    )}
                  </PromptInputActions>
                </PromptInput>
                

              </div>
            </div>
                    </motion.div>
          </div>

          {/* Bottom Controls Container - Stretches horizontally */}
          <div className="flex items-center justify-center gap-8 w-full mt-6">
            {/* Google Meet Style Control Bar - Centered */}
            <div className="flex-shrink-0">
              <Dock
                className="w-auto h-auto"
                items={[
                  // Start/End/Mute cluster
                  !isAgentConnected
                    ? {
                        icon: Phone,
                        label: "Start session",
                        onClick: handleToggleConversation,
                        isActive: false
                      }
                    : {
                        icon: isMicOn ? Mic : MicOff,
                        label: isMicOn ? "Mute" : "Unmute",
                        onClick: () => setIsMicOn(prev => !prev),
                        isActive: !isMicOn,
                      },
                  // End call (visible only when connected)
                  ...(isAgentConnected
                    ? [
                        {
                          icon: PhoneOff,
                          label: "End call",
                          onClick: handleToggleConversation,
                          isActive: true
                        }
                      ]
                    : []),
                  {
                    icon: isVideoOn ? Video : VideoOff,
                    label: isVideoOn ? "Turn off camera" : "Turn on camera",
                    onClick: () => setIsVideoOn(!isVideoOn),
                    isActive: isVideoOn
                  },
                  {
                    icon: Subtitles,
                    label: isCaptionsOn ? "Turn off captions" : "Turn on captions",
                    onClick: () => setIsCaptionsOn(!isCaptionsOn),
                    isActive: isCaptionsOn
                  },
                  {
                    icon: viewMode === "pip" ? Grid2x2 : Maximize2,
                    label: viewMode === "pip" ? "Split view" : "Picture-in-picture",
                    onClick: () => setViewMode(viewMode === "pip" ? "split" : "pip")
                  },
                  {
                    icon: MessageSquare,
                    label: showHistory ? "Close chat history" : "Show chat history",
                    onClick: () => setShowHistory(!showHistory),
                    isActive: showHistory
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Permission Help Overlay */}
      {showPermissionHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Microphone Permission Required
            </h3>
            <p className="text-gray-600 mb-4">
              {permissionError}
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p className="mb-2"><strong>To enable voice chat:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the microphone icon in your browser's address bar</li>
                <li>Select "Allow" for microphone access</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPermissionHelp(false);
                  setPermissionError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

