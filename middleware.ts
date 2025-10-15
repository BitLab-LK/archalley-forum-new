import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { isSessionValid } from "./lib/session-invalidation"

export async function middleware(request: NextRequest) {
  // Skip middleware entirely for auth routes to prevent redirect loops
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    console.log('🔄 Skipping middleware for auth route:', request.nextUrl.pathname)
    return NextResponse.next()
  }

  console.log('🔍 Middleware processing:', {
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  })

  // List of public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth/',
    '/api/public/',
    '/api/categories',
    '/api/trending-posts',
    '/api/contributors/top',
    '/api/health',
    '/api/search',
    '/api/analytics/share'
  ]

  // Check if the API route is public
  const isPublicApiRoute = (pathname: string, method: string) => {
    if (!pathname.startsWith('/api/')) return false
    
    // Check explicit public routes
    const isExplicitlyPublic = publicApiRoutes.some(route => {
      if (route.endsWith('/')) {
        return pathname.startsWith(route)
      }
      return pathname === route || pathname.startsWith(route + '/')
    })
    
    if (isExplicitlyPublic) return true
    
    // GET requests to posts should be public (reading posts)
    if (method === 'GET' && pathname.startsWith('/api/posts')) {
      return true
    }
    
    // GET requests to comments should be public (reading comments) 
    if (method === 'GET' && pathname.startsWith('/api/comments')) {
      return true
    }
    
    return false
  }

  // Check if this is a public API route first
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isPublic = isPublicApiRoute(request.nextUrl.pathname, request.method)
    console.log('🔍 API Route Check:', {
      path: request.nextUrl.pathname,
      method: request.method,
      isPublic
    })
    
    if (isPublic) {
      console.log('✅ Public API route, skipping session check:', request.nextUrl.pathname)
      return NextResponse.next()
    }
  }

  // Check session validity for authenticated routes only (but be more lenient for admin routes)
  if (request.nextUrl.pathname.startsWith('/profile') ||
      (request.nextUrl.pathname.startsWith('/api/') && !isPublicApiRoute(request.nextUrl.pathname, request.method))) {
    
    const sessionCheck = await isSessionValid(request)
    
    if (!sessionCheck.isValid) {
      console.log('🚫 Session invalid:', {
        reason: sessionCheck.reason,
        userId: sessionCheck.userId,
        path: request.nextUrl.pathname
      })
      
      // For API routes, return unauthorized
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Session expired', 
            reason: sessionCheck.reason,
            requiresReauth: true 
          }), 
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // For regular routes, redirect to sign-in
      const signInUrl = new URL('/auth/register?tab=login', request.url)
      signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      signInUrl.searchParams.set('message', 'Your session has expired. Please sign in again.')
      return NextResponse.redirect(signInUrl)
    }
  }

  // Check admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      const userRole = token?.role as string;
      if (!token || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'MODERATOR')) {
        console.log('🚫 Admin access denied:', { 
          hasToken: !!token, 
          role: token?.role 
        })
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      // Additional session validation for admin routes (but don't block if it fails)
      try {
        const sessionCheck = await isSessionValid(request)
        if (!sessionCheck.isValid) {
          console.log('⚠️ Admin session invalid but allowing access with valid token:', {
            reason: sessionCheck.reason,
            userId: sessionCheck.userId,
            email: token.email
          })
          // Log this for audit but don't block access - the token is still valid
        } else {
          console.log('✅ Admin session and token both valid:', token.email)
        }
      } catch (sessionError) {
        console.warn('⚠️ Session validation failed for admin, but token is valid:', sessionError)
        // Continue with valid token even if session check fails
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
    // Admin routes - always protected
    "/admin/:path*",
    // Profile routes - always protected  
    "/profile/:path*",
    // API routes - will be filtered by isPublicApiRoute logic
    "/api/:path*",
    // Exclude static files and auth routes from processing
    "/((?!_next/static|_next/image|favicon.ico|auth/register|auth/login|auth/logout).*)",
  ],
}
