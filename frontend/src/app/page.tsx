"use client"
import { AnimatedFeatureCard } from "@/components/ui/feature-card-1";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground audioLevel={0} isListening={false} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatedFeatureCard
            index="001"
            tag="AI Therapist"
            title="Meet Emma, your AI therapist providing personalized mental health support"
            imageSrc="/emma.png"
            color="purple"
          />
          <AnimatedFeatureCard
            index="002"
            tag="Human Therapist"
            title="Connect with Ryan, our licensed therapist for professional guidance"
            imageSrc="/ryan.png"
            color="blue"
          />
          <AnimatedFeatureCard
            index="003"
            tag="Wellness Companion"
            title="Meet Meow, your friendly companion for everyday emotional support"
            imageSrc="/meow.png"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}
