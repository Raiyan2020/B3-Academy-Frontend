import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ⚠ THIS IS NOT AN AUTHORIZATION BOUNDARY. It is navigation UX only.
//
// `b3_session` is written client-side by `auth-storage.service.ts` with
// `document.cookie` (so: not httpOnly, not Secure, unsigned) and its value IS the
// role string. Anyone can run `document.cookie = 'b3_session=ADMIN'` and satisfy the
// checks below. Treat every value read here as attacker-controlled.
//
// Why it is not fixed with a signed token here: the Laravel API exposes no role for
// API consumers at all — `UserResource` returns id/name/email/phone/image/flags and
// nothing else, and `auth-api.service.ts::mapBackendUser` consequently hardcodes
// `role: UserRole.STUDENT` for every backend login. There is no server-issued role to
// verify, so signing this cookie would only add a signature over a value the
// frontend invented. Real admin functionality lives in the backend's own Blade
// dashboard behind a different guard, not behind this route group.
//
// Actual protection therefore rests entirely on the Laravel API authorizing each
// request against the bearer token. The consequence of the gap below is that the
// admin/doctor *UI shell* is reachable by anyone, along with whatever data the API is
// willing to return to a normal user token.
//
// Proper fix (docs/modernization/02-plan.md, Batch 9 — needs a backend change):
// have the API expose an authenticated user's role and issue an httpOnly, Secure,
// signed session cookie; verify that here. That same change also moves the bearer
// token out of localStorage and unblocks SSR/RSC data fetching.
// See docs/modernization/audit-hardening.md (HARD-001).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('b3_session')?.value;

  // 3. General protected paths protection
  const protectedPrefixes = [
    '/dashboard',
    '/settings',
    '/checkout',
    '/clinic-booking',
    '/health-assessment',
    '/rate-us',
    '/learn/',
    '/read/',
    // Trailing slashes matter here: these are matched with startsWith, so a bare
    // '/consultation' also swallows '/consultations' — the PUBLIC doctors catalogue
    // in the (site) group that the public footer links to, next to '/clinic' and
    // '/trips'. That sent logged-out visitors clicking "الاستشارات" to the login
    // page while its two siblings worked. '/consultation/' keeps the private
    // '/consultation/[id]' and its chat protected; '/consultations/' keeps the
    // booking flow protected without capturing the catalogue itself.
    '/consultation/',
    '/consultations/',
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
