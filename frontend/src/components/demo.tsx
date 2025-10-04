"use client"
import { useState } from "react";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import { VoiceInput } from "@/components/ui/voice-input";
import { FadingTextStream } from "@/components/ui/fading-text-stream";
import { AnimatePresence, motion } from "framer-motion";

const DemoVariant1 = () => {
  const [isListening, setIsListening] = useState(false);
  
  const sampleText = "Hello, I'm speaking to the app right now. This text is simulating what I'm saying in real-time as the voice recognition processes my speech. Pretty cool, right?";

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center gap-8">
        <VoiceInput 
          onStart={() => {
            console.log("Voice recording started");
            setIsListening(true);
          }}
          onStop={() => {
            console.log("Voice recording stopped");
            setIsListening(false);
          }}
        />
        
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg w-full"
            >
              <FadingTextStream 
                text={sampleText}
                speed={80}
                className="text-gray-700 text-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export { DemoVariant1 };

