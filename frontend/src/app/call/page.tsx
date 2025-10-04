"use client"
import { useState, useEffect, useRef, useMemo } from "react";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
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
  const isListening = useMemo(() => true, []); // Set to true for demo
  const audioLevel = useMemo(() => 0, []);
  const [viewMode, setViewMode] = useState<"pip" | "split">("pip"); // pip = picture-in-picture, split = 50/50
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [googleKey, setGoogleKey] = useState<string>("");
  const [elevenKey, setElevenKey] = useState<string>("");
  const [voiceProvider, setVoiceProvider] = useState<"google" | "eleven">("google");
  const [chatInput, setChatInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const sampleText = "Hello, I'm speaking to the AI therapist right now. This text shows what I'm saying in real-time as the voice recognition processes my speech. The conversation is flowing naturally and the text continues to appear word by word. This creates a smooth and engaging experience during our therapy session.";

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
      const target = iframeRef.current?.contentWindow;
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
                  ref={iframeRef}
                  onLoad={handleIframeLoad}
                  src="http://localhost:8080/index-modular.html"
                  className="w-full h-full border-0"
                  allow="camera; microphone; autoplay; fullscreen"
                />
                
                {/* Captions - Bottom Left */}
                {isCaptionsOn && (
                  <div className="absolute bottom-24 left-6 max-w-2xl">
                    <FadingTextStream 
                      text={isListening ? sampleText : ""}
                      speed={80}
                      className="text-white text-base"
                      lines={2}
                      showGradients={false}
                    />
                  </div>
                )}
                
                {/* Chat Input - Bottom Left */}
                <div className="absolute bottom-6 left-6 w-full max-w-2xl">
                  <PromptInput
                    value={chatInput}
                    onValueChange={setChatInput}
                    isLoading={isSpeaking}
                    onSubmit={handleChatSubmit}
                    className="w-full"
                  >
                    <PromptInputTextarea placeholder="Tell the avatar what to say..." />
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
                    ref={iframeRef}
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
    </div>
  );
}

