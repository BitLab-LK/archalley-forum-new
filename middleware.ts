import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(_req) {
    // Add security headers
    const response = NextResponse.next()
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Add CSP header in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
      )
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "ADMIN"
        }

        // For API routes, require authentication except for GET requests to public endpoints
        if (req.nextUrl.pathname.startsWith("/api/")) {
          // Allow GET requests to posts (public)
          if (req.nextUrl.pathname.startsWith("/api/posts") && req.method === "GET") {
            return true
          }
          
          // Allow GET requests to categories (public)
          if (req.nextUrl.pathname.startsWith("/api/categories") && req.method === "GET") {
            return true
          }
          
          // Allow GET requests to users (public - for members page)
          if (req.nextUrl.pathname.startsWith("/api/users") && req.method === "GET") {
            return true
          }
          
          // Allow GET requests to comments (needed for modal functionality)
          if (req.nextUrl.pathname.startsWith("/api/comments") && req.method === "GET") {
            return true
          }
          
          // Allow debug endpoint
          if (req.nextUrl.pathname.startsWith("/api/debug")) {
            return true
          }
          
          // Allow health check
          if (req.nextUrl.pathname.startsWith("/api/health")) {
            return true
          }
          
          // Allow auth endpoints
          if (req.nextUrl.pathname.startsWith("/api/auth")) {
            return true
          }
          
          // Allow registration upload endpoint (for profile photos during registration)
          if (req.nextUrl.pathname.startsWith("/api/upload/registration")) {
            return true
          }
          
          // Require authentication for all other API routes
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
}
