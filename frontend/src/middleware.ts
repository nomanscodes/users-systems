import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the auth_status cookie is present
  const authCookie = request.cookies.get('auth_status');
  const isAuthenticated = authCookie?.value === 'true';

  const { pathname } = request.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/auth/v1/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Optional: Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth') && isAuthenticated) {
    if (pathname === '/auth/v1/logout') {
      // Allow access to logout route
      return NextResponse.next();
    }
    // If they are logged in, don't let them see login/register pages
    const dashboardUrl = new URL('/dashboard/default', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
