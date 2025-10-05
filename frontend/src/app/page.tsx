"use client"
import { useState } from "react";
import { AnimatedFeatureCard } from "@/components/ui/feature-card-1";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import BlurFade from "@/components/ui/blur-fade";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [hoveredColor, setHoveredColor] = useState<"purple" | "blue" | "orange" | null>(null);
  const { data: session, status } = useSession();

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <AnimatedGradientBackground 
        audioLevel={0} 
        isListening={false} 
        hoverColor={hoveredColor}
      />
      
      {/* Auth Button - Top Right */}
      <div className="absolute top-8 right-8 z-20">
        <BlurFade delay={0.1} inView>
          {status === 'loading' ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">
                Welcome, {session.user?.name?.split(' ')[0]}!
              </span>
              <Button 
                variant="outline" 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default">Sign In</Button>
            </Link>
          )}
        </BlurFade>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen p-8 pt-24">
        {/* Header Section with BlurFade */}
        <section id="header" className="mb-12 text-center">
          <BlurFade delay={0.25} inView>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              Hello World 👋
            </h2>
          </BlurFade>
          <BlurFade delay={0.25 * 2} inView>
            <span className="text-xl text-pretty tracking-tighter sm:text-3xl xl:text-4xl/none">
              Nice to meet you
            </span>
          </BlurFade>
        </section>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BlurFade delay={0} inView>
            <Link href="/call">
              <div
                onMouseEnter={() => setHoveredColor("purple")}
                onMouseLeave={() => setHoveredColor(null)}
                className="cursor-pointer"
              >
                <AnimatedFeatureCard
                  index="001"
                  tag="AI Therapist"
                  title="Meet Emma, your AI therapist providing personalized mental health support"
                  imageSrc="/emma.png"
                  color="purple"
                />
              </div>
            </Link>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <div
              onMouseEnter={() => setHoveredColor("blue")}
              onMouseLeave={() => setHoveredColor(null)}
            >
              <AnimatedFeatureCard
                index="Coming Soon"
                tag="Real World Therapist"
                title="Connect with licensed therapists for professional mental health support"
                imageSrc="/ryan.png"
                color="blue"
              />
            </div>
          </BlurFade>
          <BlurFade delay={0.4} inView>
            <div
              onMouseEnter={() => setHoveredColor("orange")}
              onMouseLeave={() => setHoveredColor(null)}
            >
              <AnimatedFeatureCard
                index="Coming Soon"
                tag="Wellness Companion"
                title="Meet Meow, your friendly companion for everyday emotional support"
                imageSrc="/meow.png"
                color="orange"
              />
            </div>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
