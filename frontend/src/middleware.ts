import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // This function runs after authentication check passes
    // You can add additional logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true if user is authenticated
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect these routes - users must be signed in
export const config = {
  matcher: [
    '/call/:path*',
    '/session/:path*',
    '/history/:path*',
    // Add any other protected routes here
    // Note: These patterns use Next.js middleware matchers
    // '/api/protected/:path*', // Example: protect API routes
  ]
}
