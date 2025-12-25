import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing jury routes
  if (pathname.startsWith('/jury')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not logged in - redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: We can't check JuryMember table from middleware (no Prisma access)
    // The API routes will handle jury authorization
    // This just ensures user is logged in
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/jury/:path*'],
};
