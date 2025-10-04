"use client"
import { useState, useEffect, useRef, useMemo } from "react";
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
  MoreVertical,
  Subtitles,
  Menu,
  ChevronDown,
  ArrowUp,
  Square
} from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";

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
  const [googleKey, setGoogleKey] = useState<string>("");
  const [elevenKey, setElevenKey] = useState<string>("");
  const [voiceProvider, setVoiceProvider] = useState<"google" | "eleven">("google");
  const [chatInput, setChatInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const talkingHeadRef = useRef<HTMLIFrameElement>(null);
  const userId = useRef<string>(`user_${Date.now()}`);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const sampleText = "Hello, I'm speaking to the AI therapist right now. This text shows what I'm saying in real-time as the voice recognition processes my speech. The conversation is flowing naturally and the text continues to appear word by word. This creates a smooth and engaging experience during our therapy session.";

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

  // Load saved settings
  useEffect(() => {
    try {
      const g = sessionStorage.getItem("google-tts-apikey") || "";
      const e = sessionStorage.getItem("elevenlabs-apikey") || "";
      setGoogleKey(g);
      setElevenKey(e);
      const provider = (sessionStorage.getItem("voice-provider") as "google" | "eleven") || "google";
      setVoiceProvider(provider);
    } catch {}
  }, []);

  const postToIframe = (type: string, payload?: any) => {
    try {
      const target = talkingHeadRef.current?.contentWindow;
      if (!target) return;
      target.postMessage({ type, payload }, "http://localhost:8080");
    } catch {}
  };

  const applySettingsToIframe = () => {
    if (googleKey) postToIframe("saveApiKey", { provider: "google", key: googleKey });
    if (elevenKey) postToIframe("saveApiKey", { provider: "eleven", key: elevenKey });
    postToIframe("setVoice", { value: voiceProvider });
  };

  const handleIframeLoad = () => {
    applySettingsToIframe();
  };

  const handleSaveGoogle = () => {
    sessionStorage.setItem("google-tts-apikey", googleKey);
    postToIframe("saveApiKey", { provider: "google", key: googleKey });
  };

  const handleSaveEleven = () => {
    sessionStorage.setItem("elevenlabs-apikey", elevenKey);
    postToIframe("saveApiKey", { provider: "eleven", key: elevenKey });
  };

  const handleVoiceChange = (val: "google" | "eleven") => {
    setVoiceProvider(val);
    sessionStorage.setItem("voice-provider", val);
    postToIframe("setVoice", { value: val });
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim() || isSpeaking) return;
    
    setIsSpeaking(true);
    
    // Send message to iframe to make avatar speak
    postToIframe("speak", { text: chatInput });
    
    // Clear input
    setChatInput("");
    
    // Simulate speaking duration (you can adjust this or get feedback from iframe)
    setTimeout(() => {
      setIsSpeaking(false);
    }, 3000);
  };

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

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground audioLevel={audioLevel} isListening={isListening} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full p-8">
        <div className="w-full h-full flex flex-col px-6 py-2 gap-1">
          {/* Header with Session Title and Timer */}
          <div className="flex items-center justify-between my-4">
            {/* Session Title with Hamburger */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Toggle settings"
                className="inline-flex items-center justify-center w-10 h-10 rounded-md border hover:bg-muted/50 transition"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-medium text-foreground">AI Therapy Session</h2>
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

          {/* Settings Dropdown Panel */}
          <motion.div
            initial={false}
            animate={{
              height: isSettingsOpen ? "auto" : 0,
              opacity: isSettingsOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-muted/30 backdrop-blur-sm border rounded-lg p-4 mb-4 space-y-4">
              {/* Chat Input */}
              <div>
                <div className="text-sm font-medium mb-2">Tell Avatar What to Say</div>
                <PromptInput
                  value={chatInput}
                  onValueChange={setChatInput}
                  isLoading={isSpeaking}
                  onSubmit={handleChatSubmit}
                  className="w-full"
                >
                  <PromptInputTextarea placeholder="Type a message for the avatar..." />
                  <PromptInputActions className="justify-end pt-2">
                    <PromptInputAction
                      tooltip={isSpeaking ? "Speaking..." : "Send message"}
                    >
                      <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleChatSubmit}
                        disabled={isSpeaking || !chatInput.trim()}
                      >
                        {isSpeaking ? (
                          <Square className="size-5 fill-current" />
                        ) : (
                          <ArrowUp className="size-5" />
                        )}
                      </Button>
                    </PromptInputAction>
                  </PromptInputActions>
                </PromptInput>
              </div>

              {/* Voice Provider Selection */}
              <div>
                <div className="text-sm font-medium mb-2">Voice Provider</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`border rounded-md px-3 py-2 text-sm ${voiceProvider === 'google' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
                    onClick={() => handleVoiceChange('google')}
                  >
                    Google TTS
                  </button>
                  <button
                    className={`border rounded-md px-3 py-2 text-sm ${voiceProvider === 'eleven' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
                    onClick={() => handleVoiceChange('eleven')}
                  >
                    ElevenLabs
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Google API Key</div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                      placeholder="Your Google TTS API key..."
                      type="password"
                      value={googleKey}
                      onChange={(e) => setGoogleKey(e.target.value)}
                    />
                    <button 
                      className="border rounded-md px-3 py-2 text-sm bg-background hover:bg-muted/50" 
                      onClick={handleSaveGoogle}
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">ElevenLabs API Key</div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                      placeholder="Your ElevenLabs API key..."
                      type="password"
                      value={elevenKey}
                      onChange={(e) => setElevenKey(e.target.value)}
                    />
                    <button 
                      className="border rounded-md px-3 py-2 text-sm bg-background hover:bg-muted/50" 
                      onClick={handleSaveEleven}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Video Area - Takes up remaining space */}
          <div className="flex-1 flex items-start justify-center">
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
                    {isProcessing && (
                      <div className="bg-gray-500/20 backdrop-blur-sm p-3 rounded-lg border border-gray-400/50">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
                          </div>
                          <span className="text-white text-sm">EMURA is thinking...</span>
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
                    <div className="absolute bottom-6 left-6 max-w-xl">
                      <FadingTextStream 
                        text={isListening ? sampleText : ""}
                        speed={80}
                        className="text-white text-base"
                        lines={2}
                        showGradients={false}
                      />
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

          {/* Bottom Controls Container - Stretches horizontally */}
          <div className="flex items-center justify-center gap-8 w-full mt-6">
            {/* Google Meet Style Control Bar - Centered */}
            <div className="flex-shrink-0">
              <Dock
                className="w-auto h-auto"
                items={[
                  {
                    icon: isMicOn ? Mic : MicOff,
                    label: isMicOn ? "Mute" : "Unmute",
                    onClick: () => setIsMicOn(!isMicOn),
                    isActive: isMicOn
                  },
                  {
                    icon: isVideoOn ? Video : VideoOff,
                    label: isVideoOn ? "Turn off camera" : "Turn on camera",
                    onClick: () => setIsVideoOn(!isVideoOn),
                    isActive: isVideoOn
                  },
                  {
                    icon: isRecording ? MicOff : Mic,
                    label: isRecording ? "Stop Recording" : "Start Voice Chat",
                    onClick: startRecording,
                    isActive: isRecording || isProcessing || isSpeaking
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
                    icon: PhoneOff,
                    label: "End call",
                    onClick: () => window.location.href = '/'
                  },
                  {
                    icon: MoreVertical,
                    label: "More options",
                    onClick: () => console.log("More options")
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

