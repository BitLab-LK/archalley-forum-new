import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
// import { isSessionValid } from "./lib/session-invalidation"

// Simple session validation for Edge runtime (without database check)
async function isSessionValidForEdge(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token || !token.id) {
      return { isValid: false, reason: "No valid token", userId: null }
    }

    // For now, just validate that we have a valid JWT token
    // The API routes will do proper database validation
    return { isValid: true, reason: "Valid token", userId: token.id as string }
  } catch (error) {
    console.error('Error validating session:', error)
    return { isValid: false, reason: "Session validation error", userId: null }
  }
}

export async function middleware(request: NextRequest) {
  // Redirect /competition to /events/archalley-competition-2025
  if (request.nextUrl.pathname === '/competition' || request.nextUrl.pathname === '/competition/') {
    const targetUrl = new URL('/events/archalley-competition-2025', request.url)
    // Preserve query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value)
    })
    console.log('🔄 Redirecting /competition to /events/archalley-competition-2025')
    return NextResponse.redirect(targetUrl, 308) // 308 Permanent Redirect
  }

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
    '/api/analytics/share',
    '/api/users',
    '/api/ads',
    '/api/wordpress/',
    '/api/youtube/',
    '/api/contact',
    '/api/academic/submit',
    '/api/projects/submit',
    '/api/competitions/payment/notify'
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
    
    const sessionCheck = await isSessionValidForEdge(request)
    
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
        const sessionCheck = await isSessionValidForEdge(request)
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
  
  // Add comprehensive CSP headers to allow YouTube and Facebook embeds
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com https://www.payhere.lk https://sandbox.payhere.lk",
      "script-src-elem 'self' 'unsafe-inline' https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com https://www.payhere.lk https://sandbox.payhere.lk",
      "style-src 'self' 'unsafe-inline' https://cdn.lineicons.com",
      "img-src 'self' data: https: http:",
      "font-src 'self' data: https://cdn.lineicons.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://www.facebook.com https://facebook.com https://web.facebook.com https://connect.facebook.net https://www.payhere.lk https://sandbox.payhere.lk",
      "child-src 'self' https://www.youtube.com https://youtube.com https://www.facebook.com https://facebook.com https://sandbox.payhere.lk",
      "connect-src 'self' https://connect.facebook.net https://www.facebook.com https://sandbox.payhere.lk https:",
      "media-src 'self' https://www.youtube.com https://youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  )

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
