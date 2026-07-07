import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('b3_session')?.value;

  // 1. Admin paths protection
  if (pathname.startsWith('/admin')) {
    if (!session || session !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // 2. Doctor paths protection
  if (pathname.startsWith('/doctor')) {
    if (!session || session !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // 3. General protected paths protection
  const protectedPrefixes = [
    '/dashboard',
    '/settings',
    '/checkout',
    '/clinic-booking',
    '/consultation',
    '/health-assessment',
    '/rate-us',
    '/learn/',
    '/read/',
    '/community/chat',
    '/community/researches',
    '/monograph'
  ];

  const isProtected = protectedPrefixes.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix)
  );

  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // 4. Redirect logged-in users away from /auth to their dashboards
  if (pathname.startsWith('/auth')) {
    if (session) {
      if (session === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/users', request.url));
      }
      if (session === 'DOCTOR') {
        return NextResponse.redirect(new URL('/doctor', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
