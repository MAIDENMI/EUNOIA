'use client';

import { SignInPage } from '@/components/ui/sign-in';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // For now, email/password is not configured
    // You can add CredentialsProvider later if needed
    console.log('Email/password sign in not yet configured:', { email });
  };

  const handleGoogleSignIn = async () => {
    try {
      // Use NextAuth's signIn with Google provider
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleResetPassword = () => {
    console.log('Reset password clicked');
    // TODO: Implement password reset flow
  };

  const handleCreateAccount = () => {
    console.log('Create account clicked');
    router.push('/signup');
  };

  return (
    <SignInPage
      title={
        <span className="font-light text-foreground tracking-tighter">
          Welcome to EUNOIA
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
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
}
