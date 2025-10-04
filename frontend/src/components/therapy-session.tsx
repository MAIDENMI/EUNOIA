"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { VoiceInput } from "@/components/ui/voice-input";
import { FadingTextStream } from "@/components/ui/fading-text-stream";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TherapySession = () => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const sampleText = "Hello, I'm speaking to the app right now. This text is simulating what I'm saying in real-time as the voice recognition processes my speech. Pretty cool, right? I can keep talking and the text will continue to appear, word by word, creating a smooth and natural experience. The virtual container will automatically scroll as more content appears, showing only three lines at a time. This makes it easier to focus on the most recent text without feeling overwhelmed by too much information on the screen at once.";

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground audioLevel={audioLevel} isListening={isListening} />
      
      {/* Options Dropdown - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Open options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push('/history')}>
              History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 gap-8">
        <VoiceInput 
          onStart={() => {
            console.log("Voice recording started");
            setIsListening(true);
          }}
          onStop={() => {
            console.log("Voice recording stopped");
            setIsListening(false);
          }}
          onAudioLevel={(level) => {
            setAudioLevel(level);
          }}
        />
        
        {/* Keep the stream container mounted at all times to prevent mic jumping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isListening ? 1 : 0.6, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full"
        >
          <FadingTextStream 
            text={isListening ? sampleText : ""}
            speed={80}
            className="text-gray-700 text-lg text-left"
          />
        </motion.div>
      </div>
    </div>
  );
};

export { TherapySession };

