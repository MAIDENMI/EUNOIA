import { motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

interface AnimatedGradientBackgroundProps {
   /** 
    * Initial size of the radial gradient, defining the starting width. 
    * @default 180
    */
   startingGap?: number;

   /**
    * Enables or disables the breathing animation effect.
    * @default true
    */
   Breathing?: boolean;

   /**
    * Array of colors to use in the radial gradient.
    * Each color corresponds to a stop percentage in `gradientStops`.
    * @default ["#FFFFFF", "#2979FF", "#FF80AB", "#FF6D00", "#FFD600", "#00E676", "#3D5AFE", "transparent"]
    */
   gradientColors?: string[];

   /**
    * Array of percentage stops corresponding to each color in `gradientColors`.
    * The values should range between 0 and 100.
    * @default [35, 50, 60, 70, 80, 90, 95, 100]
    */
   gradientStops?: number[];

   /**
    * Speed of the breathing animation. 
    * Lower values result in slower animation.
    * @default 0.05
    */
   animationSpeed?: number;

   /**
    * Maximum range for the breathing animation in percentage points.
    * Determines how much the gradient "breathes" by expanding and contracting.
    * @default 15
    */
   breathingRange?: number;

   /**
    * Additional inline styles for the gradient container.
    * @default {}
    */
   containerStyle?: React.CSSProperties;

   /**
    * Additional class names for the gradient container.
    * @default ""
    */
   containerClassName?: string;


   /**
    * Additional top offset for the gradient container form the top to have a more flexible control over the gradient.
    * @default 0
    */
   topOffset?: number;

   /**
    * Audio level (0-2 range) to make the gradient react to voice input.
    * When provided, the gradient will expand/contract based on audio intensity.
    * @default 0
    */
   audioLevel?: number;

   /**
    * Sensitivity multiplier for audio reactivity.
    * Higher values make the gradient more responsive to audio changes.
    * @default 30
    */
   audioSensitivity?: number;

   /**
    * Whether the microphone is currently listening.
    * When false, the gradient will display blue/violet colors.
    * @default false
    */
   isListening?: boolean;
}

/**
 * AnimatedGradientBackground
 *
 * This component renders a customizable animated radial gradient background with a subtle breathing effect.
 * It uses `framer-motion` for an entrance animation and raw CSS gradients for the dynamic background.
 *
 *
 * @param {AnimatedGradientBackgroundProps} props - Props for configuring the gradient animation.
 * @returns JSX.Element
 */
const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
   startingGap = 180,
   Breathing = true,
   gradientColors = [
      "#FFFFFF",
      "#2979FF",
      "#FF80AB",
      "#FF6D00",
      "#FFD600",
      "#00E676",
      "#3D5AFE",
      "transparent"
   ],
   gradientStops = [35, 50, 60, 70, 80, 90, 95, 100],
   animationSpeed = 0.05,
   breathingRange = 15,
   containerStyle = {},
   topOffset = 0,
   containerClassName = "",
   audioLevel = 0,
   audioSensitivity = 30,
   isListening = false,
}) => {



   // Validation: Ensure gradientStops and gradientColors lengths match
   if (gradientColors.length !== gradientStops.length) {
      throw new Error(
         `GradientColors and GradientStops must have the same length.
     Received gradientColors length: ${gradientColors.length},
     gradientStops length: ${gradientStops.length}`
      );
   }

   const containerRef = useRef<HTMLDivElement | null>(null);
   const smoothedAudioLevelRef = useRef<number>(0);

   useEffect(() => {
      let animationFrame: number;
      let width = startingGap;
      let directionWidth = 1;

      const animateGradient = () => {
         if (width >= startingGap + breathingRange) directionWidth = -1;
         if (width <= startingGap - breathingRange) directionWidth = 1;

         if (!Breathing) directionWidth = 0;
         width += directionWidth * animationSpeed;

         // Smooth audio level transitions using linear interpolation (lerp)
         const smoothingFactor = 0.2; // Lower = smoother but slower response
         smoothedAudioLevelRef.current += (audioLevel - smoothedAudioLevelRef.current) * smoothingFactor;

         // Add audio reactivity to the gradient size
         const audioBoost = smoothedAudioLevelRef.current * audioSensitivity;
         const finalWidth = width + audioBoost;

         // Dynamically adjust colors based on listening state and audio level
         let dynamicColors: string[];
         
         if (!isListening) {
            // Mic is off: Always show calm blue tones
            dynamicColors = [
               "#FFFFFF",
               "#5E35B1", // Deep purple
               "#3D5AFE", // Blue
               "#2979FF", // Light blue
               "#00BCD4", // Cyan
               "#4FC3F7", // Sky blue
               "#7C4DFF", // Violet
               "transparent" // Soft edge
            ];
         } else {
            // Mic is on: Dynamic colors based on audio level
            // Quiet (0-0.5) = Blue/Violet dominant
            // Medium (0.5-1) = Mix of colors
            // Loud (1+) = Red/Orange dominant
            const smoothedLevel = smoothedAudioLevelRef.current;
            const intensity = Math.min(smoothedLevel, 2); // Cap at 2
            
            if (intensity < 0.5) {
               // Quiet: Blue and violet tones
               dynamicColors = [
                  "#FFFFFF",
                  "#5E35B1", // Deep purple
                  "#3D5AFE", // Blue
                  "#2979FF", // Light blue
                  "#00BCD4", // Cyan
                  "#4FC3F7", // Sky blue
                  "#7C4DFF", // Violet
                  "transparent" // Soft edge
               ];
            } else if (intensity < 1.2) {
               // Medium: Mix of colors
               dynamicColors = [
                  "#FFFFFF",
                  "#9C27B0", // Purple
                  "#FF6B9D", // Pink
                  "#FF9100", // Orange
                  "#FFC107", // Amber
                  "#00E5FF", // Cyan
                  "#536DFE", // Indigo
                  "transparent" // Soft edge
               ];
            } else {
               // Loud: Red and warm tones
               dynamicColors = [
                  "#FFFFFF",
                  "#FF1744", // Red
                  "#FF6D00", // Deep orange
                  "#FF3D00", // Red-orange
                  "#FF5722", // Orange red
                  "#FF9100", // Orange
                  "#FF4081", // Pink
                  "transparent" // Soft edge
               ];
            }
         }

         const gradientStopsString = gradientStops
            .map((stop, index) => `${dynamicColors[index]} ${stop}%`)
            .join(", ");

         const gradient = `radial-gradient(${finalWidth}% ${finalWidth+topOffset}% at 50% 20%, ${gradientStopsString})`;

         if (containerRef.current) {
            containerRef.current.style.background = gradient;
         }

         animationFrame = requestAnimationFrame(animateGradient);
      };

      animationFrame = requestAnimationFrame(animateGradient);

      return () => cancelAnimationFrame(animationFrame); // Cleanup animation
   }, [startingGap, Breathing, gradientColors, gradientStops, animationSpeed, breathingRange, topOffset, audioLevel, audioSensitivity, isListening]);

   return (
      <motion.div
         key="animated-gradient-background"
         initial={{
            opacity: 0,
            scale: 1.5,
         }}
         animate={{
            opacity: 1,
            scale: 1,
            transition: {
               duration: 2,
               ease: [0.25, 0.1, 0.25, 1], // Cubic bezier easing
             },
         }}
         className={`absolute inset-0 overflow-hidden ${containerClassName}`}
      >
         <div
            ref={containerRef}
            style={containerStyle}
            className="absolute inset-0 transition-transform"
         />
      </motion.div>
   );
};

export default AnimatedGradientBackground;

