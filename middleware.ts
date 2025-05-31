import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "ADMIN"
        }

        // Protect API routes that require authentication
        if (req.nextUrl.pathname.startsWith("/api/posts") && req.method !== "GET") {
          return !!token
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
