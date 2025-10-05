# 🔐 NextAuth.js Google OAuth Setup Guide

## ✅ What's Already Done

- ✅ NextAuth.js installed
- ✅ Google OAuth provider configured
- ✅ Login page created at `/login`
- ✅ Auth API route created
- ✅ Session provider wrapped around app

## 📝 What You Need To Do

### 1. Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Name it (e.g., "Veloria Login")
   
5. **Add Authorized Redirect URIs** ⚠️ CRITICAL STEP
   - In the OAuth client configuration, find "Authorized redirect URIs"
   - Click "Add URI"
   - Add this **EXACT** URL (copy and paste to avoid typos):
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Save"
   - For production, also add:
     ```
     https://yourdomain.com/api/auth/callback/google
     ```
   
   **Important Notes:**
   - Must be exactly `http://localhost:3000` (not `127.0.0.1`)
   - Must include `/api/auth/callback/google` (not just `/api/auth`)
   - No trailing slash
   - Case sensitive

6. **Copy Your Credentials**
   - You'll get a `Client ID` and `Client Secret`
   - Keep these safe!

### 2. Update Environment Variables

Create or update `.env.local` in the `frontend` directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Your existing config...
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
NEXT_PUBLIC_ELEVENLABS_API_KEY=
```

**Generate a NEXTAUTH_SECRET:**
```bash
# Run this in your terminal:
openssl rand -base64 32
```

### 3. Test It Out

1. Start your dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Visit: `http://localhost:3000/login`

3. Click "Continue with Google"

4. You should be redirected to Google login, then back to `/call`

## 🎯 Usage in Your App

### Check if User is Logged In

```tsx
'use client';

import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'authenticated') {
    return <div>Welcome, {session.user?.name}!</div>;
  }

  return <div>You are not signed in</div>;
}
```

### Protect a Page

```tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return <div>Protected content here!</div>;
}
```

### Sign Out

```tsx
import { signOut } from 'next-auth/react';

<button onClick={() => signOut({ callbackUrl: '/login' })}>
  Sign Out
</button>
```

## 🔒 Production Deployment

1. Update `NEXTAUTH_URL` to your production domain
2. Add production callback URL to Google Console
3. Make sure `NEXTAUTH_SECRET` is set in production environment
4. Never commit `.env.local` to git (it's already in .gitignore)

## 🆘 Troubleshooting

### "Error: Missing GOOGLE_CLIENT_ID"
- Make sure you've added the credentials to `.env.local`
- Restart your dev server after adding env variables

### "Redirect URI mismatch"
- Check that you've added the correct callback URL in Google Console
- The URL must exactly match: `http://localhost:3000/api/auth/callback/google`

### "Error: Invalid client secret"
- Double-check your `GOOGLE_CLIENT_SECRET` in `.env.local`
- Make sure there are no extra spaces

## 📚 Learn More

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://next-auth.js.org/providers/google)
