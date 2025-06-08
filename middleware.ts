import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Log request details for debugging
    console.log("Middleware request:", {
      path: req.nextUrl.pathname,
      method: req.method,
      hasToken: !!req.nextauth.token,
      tokenRole: req.nextauth.token?.role,
    })

    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Log authorization check
        console.log("Authorization check:", {
          path: req.nextUrl.pathname,
          method: req.method,
          hasToken: !!token,
          tokenRole: token?.role,
        })

        // Protect admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "ADMIN"
        }

        // Protect API routes that require authentication
        if (req.nextUrl.pathname.startsWith("/api/posts") && req.method !== "GET") {
          const isAuthorized = !!token
          console.log("Posts API authorization:", { isAuthorized, path: req.nextUrl.pathname })
          return isAuthorized
        }

        if (req.nextUrl.pathname.startsWith("/api/comments")) {
          return !!token
        }

        if (req.nextUrl.pathname.startsWith("/api/users") && req.method !== "GET") {
          return !!token
        }

        return true
      },
    },
  },
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/posts/:path*",
    "/api/comments/:path*",
    "/api/users/:path*",
    "/api/upload/:path*",
    "/api/notifications/:path*",
  ],
}
