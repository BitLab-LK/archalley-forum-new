import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log('🔍 Middleware processing:', {
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  })

  // Add security headers to all responses
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

  console.log('✅ Middleware allowing request:', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
}
