"use client"
import { useState, useEffect } from "react";
import { AnimatedFeatureCard } from "@/components/ui/feature-card-1";
import AnimatedGradientBackground from "@/components/ui/animated-gradient-background";
import BlurFade from "@/components/ui/blur-fade";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [hoveredColor, setHoveredColor] = useState<"purple" | "blue" | "orange" | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
        <AnimatedGradientBackground audioLevel={0} isListening={false} hoverColor={null} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-y-auto">
      {/* Gradient Background */}
      <div className="fixed inset-0 -z-0">
        <AnimatedGradientBackground 
          audioLevel={0} 
          isListening={false} 
          hoverColor={hoveredColor}
        />
      </div>
      
      {/* Auth Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <BlurFade delay={0.1} inView>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-red-500 hover:text-red-600 transition-colors cursor-pointer"
            aria-label="Sign Out"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </BlurFade>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        {/* Header Section with BlurFade */}
        <section id="header" className="mb-8 text-center max-w-4xl">
          <BlurFade delay={0.25} inView>
            <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl lg:text-5xl xl:text-6xl/none">
              Hello, {session?.user?.name?.split(' ')[0]} 👋
            </h2>
          </BlurFade>
          <BlurFade delay={0.25 * 2} inView>
            <span className="text-lg text-pretty tracking-tighter sm:text-2xl lg:text-3xl xl:text-4xl/none">
              Choose your path to wellness
            </span>
          </BlurFade>
        </section>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-7xl mb-16">
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
                  title="Meet Sarah, your AI therapist providing personalized mental health support"
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

        {/* Logos Section */}
        <BlurFade delay={0.6} inView>
          <section className="w-full max-w-7xl mt-16 mb-4">
            <div className="relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-8">
              <div className="flex flex-col items-center md:flex-row gap-6">
                <div className="md:max-w-44 md:border-r md:border-border/50 md:pr-6 shrink-0">
                  <p className="text-center md:text-end text-sm text-muted-foreground">Trusted by leading organizations</p>
                </div>
                <div className="relative flex-1 w-full overflow-hidden">
                  <InfiniteSlider
                    durationOnHover={20}
                    duration={40}
                    gap={64}>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg"
                        alt="Infosys Logo"
                      />
                    </div>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg"
                        alt="Google Cloud Logo"
                      />
                    </div>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="/logos/elevenlabs-new.svg"
                        alt="ElevenLabs Logo"
                      />
                    </div>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Cloudflare_Logo.svg"
                        alt="Cloudflare Logo"
                      />
                    </div>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-black.svg"
                        alt="Major League Hacking Logo"
                      />
                    </div>
                    <div className="flex items-center justify-center w-40">
                      <img
                        className="mx-auto h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Harvard_University_coat_of_arms.svg"
                        alt="Harvard University Logo"
                      />
                    </div>
                  </InfiniteSlider>
                  <ProgressiveBlur
                    className="absolute inset-y-0"
                    direction="left"
                    blurIntensity={4}
                  />
                  <ProgressiveBlur
                    className="absolute inset-y-0"
                    direction="right"
                    blurIntensity={4}
                  />
                </div>
              </div>
            </div>
          </section>
        </BlurFade>
      </div>
    </div>
  );
}
