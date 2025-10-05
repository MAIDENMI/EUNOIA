'use client';

import { SignInPage } from '@/components/ui/sign-in';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    try {
      // Use NextAuth's signIn with Google provider
      // This handles both sign in and sign up
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <SignInPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Welcome to Veloria
        </span>
      }
      description="Sign in to access your AI therapy sessions"
      heroImageSrc="/emma.png"
      testimonials={[
        {
          avatarSrc: "/emma.png",
          name: "Sarah M.",
          handle: "@sarahm",
          text: "This platform has been a game-changer for my mental health journey."
        },
        {
          avatarSrc: "/ryan.png",
          name: "John D.",
          handle: "@johnd",
          text: "The AI therapy sessions are incredibly insightful and helpful."
        }
      ]}
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}
