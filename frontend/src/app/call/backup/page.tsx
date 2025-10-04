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
  Subtitles
} from "lucide-react";

export default function CallPageBackup() {
  const isListening = useMemo(() => true, []); // Set to true for demo
  const audioLevel = useMemo(() => 0, []);
  const [viewMode, setViewMode] = useState<"pip" | "split">("pip"); // pip = picture-in-picture, split = 50/50
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
            {/* Session Title */}
            <h2 className="text-lg font-medium text-foreground">AI Therapy Session</h2>
            
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

          {/* Video Area - Takes up remaining space */}
          <div className="flex-1 flex items-start justify-center">
            {/* Picture-in-Picture Mode */}
            {viewMode === "pip" && (
              <div ref={containerRef} className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
                {/* AI Therapist Video - TalkingHead iframe */}
                <iframe
                  src="http://localhost:8080"
                  className="w-full h-full border-0"
                  allow="camera; microphone; autoplay; fullscreen"
                />
                
                {/* Captions - Bottom Left */}
                {isCaptionsOn && (
                  <div className="absolute bottom-6 left-6 max-w-2xl">
                    <FadingTextStream 
                      text={isListening ? sampleText : ""}
                      speed={80}
                      className="text-white text-base"
                      lines={2}
                      showGradients={false}
                    />
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
                    src="http://localhost:8080"
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


