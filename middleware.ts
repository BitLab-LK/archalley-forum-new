import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  console.log('🔍 Middleware processing:', {
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  })

  // Check super-admin route protection (SUPER_ADMIN only)
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      const userRole = token?.role as string;
      if (!token || userRole !== 'SUPER_ADMIN') {
        console.log('🚫 Super Admin access denied:', { 
          hasToken: !!token, 
          role: token?.role 
        })
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      console.log('✅ Super Admin access granted:', token.email)
    } catch (error) {
      console.error('❌ Token verification failed:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Check admin route protection (ADMIN and SUPER_ADMIN)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      const userRole = token?.role as string;
      if (!token || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
        console.log('🚫 Admin access denied:', { 
          hasToken: !!token, 
          role: token?.role 
        })
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      console.log('✅ Admin access granted:', token.email)
    } catch (error) {
      console.error('❌ Token verification failed:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

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
    "/super-admin/:path*",
    "/api/:path*",
  ],
}
