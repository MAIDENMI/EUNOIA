'use client'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronRight } from 'lucide-react'
import { useScroll, motion } from 'motion/react'

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-x-hidden">
                <section>
                    <div className="py-24 md:pb-32 lg:pb-36 lg:pt-72">
                        <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                                <h1 className="mt-8 max-w-2xl text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl">Build 10x Faster with NS</h1>
                                <p className="mt-8 max-w-2xl text-balance text-lg">Highly customizable components for building modern websites and applications you mean it.</p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-full pl-5 pr-3 text-base">
                                        <Link href="#link">
                                            <span className="text-nowrap">Start Building</span>
                                            <ChevronRight className="ml-1" />
                                        </Link>
                                    </Button>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="h-12 rounded-full px-5 text-base hover:bg-zinc-950/5 dark:hover:bg-white/5">
                                        <Link href="#link">
                                            <span className="text-nowrap">Request a demo</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="aspect-[2/3] absolute inset-1 overflow-hidden rounded-3xl border border-black/10 sm:aspect-video lg:rounded-[3rem] dark:border-white/5">
                            <video
                                autoPlay
                                loop
                                className="size-full object-cover opacity-50 invert dark:opacity-35 dark:invert-0 dark:lg:opacity-75"
                                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"></video>
                        </div>
                    </div>
                </section>
                <section className="bg-background pb-2">
                    <div className="group relative m-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center md:flex-row">
                            <div className="md:max-w-44 md:border-r md:pr-6">
                                <p className="text-end text-sm">Powering the best teams</p>
                            </div>
                            <div className="relative py-6 md:w-[calc(100%-11rem)]">
                                <InfiniteSlider
                                    durationOnHover={20}
                                    duration={40}
                                    gap={64}>
                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-8 w-auto object-contain dark:invert"
                                            src="https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg"
                                            alt="Infosys Logo"
                                        />
                                    </div>

                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-8 w-auto object-contain dark:invert"
                                            src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg"
                                            alt="Google Cloud Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-8 w-auto object-contain dark:invert"
                                            src="/logos/elevenlabs-new.svg"
                                            alt="ElevenLabs Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-8 w-auto object-contain dark:invert"
                                            src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Cloudflare_Logo.svg"
                                            alt="Cloudflare Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-8 w-auto object-contain dark:invert"
                                            src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-black.svg"
                                            alt="Major League Hacking Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <img
                                            className="mx-auto h-12 w-auto object-contain dark:invert"
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
            </main>
        </>
    )
}

function HeroHeader() {
    const { scrollY } = useScroll()
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <motion.header
            style={{
                backdropFilter: scrollY.get() > 0 ? 'blur(8px)' : 'none',
            }}
            className="fixed inset-x-0 top-0 z-50 border-b border-black/10 dark:border-white/5">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-semibold">
                        EUNOIA
                    </Link>
                </div>

                <div className="hidden items-center gap-8 md:flex">
                    <Link href="#features" className="text-sm hover:underline">
                        Features
                    </Link>
                    <Link href="#pricing" className="text-sm hover:underline">
                        Pricing
                    </Link>
                    <Link href="#about" className="text-sm hover:underline">
                        About
                    </Link>
                    <Button asChild size="sm">
                        <Link href="/login">Sign In</Link>
                    </Button>
                </div>

                <button
                    className="md:hidden"
                    onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </nav>

            {isOpen && (
                <div className="border-t border-black/10 bg-background/95 backdrop-blur-sm dark:border-white/5 md:hidden">
                    <div className="flex flex-col gap-4 p-6">
                        <Link href="#features" className="text-sm">
                            Features
                        </Link>
                        <Link href="#pricing" className="text-sm">
                            Pricing
                        </Link>
                        <Link href="#about" className="text-sm">
                            About
                        </Link>
                        <Button asChild size="sm" className="w-full">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            )}
        </motion.header>
    )
}
