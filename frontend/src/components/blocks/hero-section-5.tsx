'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { ChevronRight } from 'lucide-react'

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-x-hidden">
                <section>
                    <div className="py-24 md:pb-32 lg:pb-36 lg:pt-72">
                        <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                                <Link href="/" className="inline-block mb-6 text-2xl font-semibold text-white drop-shadow-lg">
                                    Veloria
                                </Link>
                                <h1 className="max-w-2xl text-balance text-5xl md:text-6xl xl:text-7xl font-bold text-white drop-shadow-lg">Your Journey to Wellness Starts Here</h1>
                                <p className="mt-8 max-w-2xl text-balance text-lg text-white drop-shadow-md">We believe everyone deserves compassionate mental health support. Veloria combines cutting-edge AI with genuine empathy to provide 24/7 therapy that understands you, adapts to you, and grows with you.</p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 rounded-full pl-5 pr-3 text-base">
                                        <Link href="/login">
                                            <span className="text-nowrap">Start Your Journey</span>
                                            <ChevronRight className="ml-1" />
                                        </Link>
                                    </Button>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="h-12 rounded-full px-5 text-base hover:bg-zinc-950/5 dark:hover:bg-white/5">
                                        <Link href="#features">
                                            <span className="text-nowrap">Learn More</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-4 overflow-hidden rounded-3xl border border-black/10 lg:inset-8 lg:rounded-[3rem] dark:border-white/5">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-40 invert dark:opacity-30 dark:invert-0"
                                src="/bg/hero-bg.mp4"></video>
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-700/40 via-yellow-600/40 to-yellow-500/30 mix-blend-multiply"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                    </div>
                </section>
                <section className="bg-background pb-2 -mt-12">
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
                                        <Image
                                            width={100}
                                            height={32}
                                            className="mx-auto h-8 w-auto object-contain"
                                            src="https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg"
                                            alt="Infosys Logo"
                                        />
                                    </div>

                                    <div className="flex items-center justify-center w-40">
                                        <Image
                                            width={100}
                                            height={32}
                                            className="mx-auto h-8 w-auto object-contain"
                                            src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg"
                                            alt="Google Cloud Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <Image
                                            width={100}
                                            height={32}
                                            className="mx-auto h-8 w-auto object-contain"
                                            src="/logos/elevenlabs-new.svg"
                                            alt="ElevenLabs Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <Image
                                            width={100}
                                            height={32}
                                            className="mx-auto h-8 w-auto object-contain"
                                            src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Cloudflare_Logo.svg"
                                            alt="Cloudflare Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <Image
                                            width={100}
                                            height={32}
                                            className="mx-auto h-8 w-auto object-contain"
                                            src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-black.svg"
                                            alt="Major League Hacking Logo"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center w-40">
                                        <Image
                                            width={100}
                                            height={48}
                                            className="mx-auto h-12 w-auto object-contain"
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
    return null
}
