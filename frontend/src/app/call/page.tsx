"use client"
import { useState, useEffect, useRef } from "react";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, animate } from "framer-motion";
import { Grid2x2, Maximize2 } from "lucide-react";

export default function CallPage() {
  const [isListening] = useState(false);
  const [audioLevel] = useState(0);
  const [viewMode, setViewMode] = useState<"pip" | "split">("pip"); // pip = picture-in-picture, split = 50/50
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

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
          audio: false 
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

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground audioLevel={audioLevel} isListening={isListening} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full p-8">
        <Card className="w-full h-full rounded-2xl shadow-lg bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center px-8 py-8 gap-4">
          {/* View Mode Toggle Button */}
          <div className="w-full flex justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "pip" ? "split" : "pip")}
              className="bg-background/80 backdrop-blur-sm"
            >
              {viewMode === "pip" ? <Grid2x2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Picture-in-Picture Mode */}
          {viewMode === "pip" && (
            <div ref={containerRef} className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
              {/* AI Therapist Video Placeholder */}
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500 text-lg">AI Therapist Video</span>
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
              <div className="w-1/2 h-full bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                <span className="text-gray-500 text-lg">AI Therapist Video</span>
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
        </Card>
      </div>
    </div>
  );
}

