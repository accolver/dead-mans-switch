import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/error',
  '/sign-in'
] as const;

// Auth-related routes (API and pages)
const AUTH_ROUTES = [
  '/api/auth',
  '/auth',
  '/sign-in'
] as const;

/**
 * Check if a route is public (doesn't require authentication)
 * @param pathname - The pathname to check
 * @returns true if the route is public
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    return true;
  }

  // Allow all NextAuth API routes
  if (pathname.startsWith('/api/auth/')) {
    return true;
  }

  return false;
}

/**
 * Check if a route is an auth-related route
 * @param pathname - The pathname to check
 * @returns true if the route is auth-related
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Creates a redirect response to the login page
 * @param req - The incoming request
 * @param error - Optional error message
 * @returns NextResponse redirect to login
 */
function createLoginRedirect(req: NextRequest, error?: string): NextResponse {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.searchParams.set("callbackUrl", req.nextUrl.href);

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return NextResponse.redirect(redirectUrl);
}

/**
 * Creates a redirect response to the dashboard
 * @param req - The incoming request
 * @returns NextResponse redirect to dashboard
 */
function createDashboardRedirect(req: NextRequest): NextResponse {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/dashboard";
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  try {
    // Get the NextAuth JWT token with comprehensive error handling
    let token;
    try {
      token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
      });
    } catch (tokenError) {
      console.error("[Middleware] Token validation error:", tokenError);
      // If we can't validate the token, treat as unauthenticated
      token = null;
    }

    // Check if this is a public route
    const isPublic = isPublicRoute(pathname);

    // If user is authenticated and on an auth route (not API), redirect to dashboard
    if (token && isAuthRoute(pathname) && !pathname.startsWith('/api/auth/')) {
      console.log("[Middleware] Authenticated user on auth route, redirecting to dashboard");
      return createDashboardRedirect(req);
    }

    // Allow access to public routes
    if (isPublic) {
      return NextResponse.next();
    }

    // Handle protected routes - require authentication
    if (!token) {
      console.log("[Middleware] No session found, redirecting to login");
      return createLoginRedirect(req, "Please sign in to continue");
    }

    // User is authenticated and accessing a protected route
    console.log(`[Middleware] Authenticated access to ${pathname}`);
    return NextResponse.next();

  } catch (error) {
    console.error("[Middleware] Unexpected error:", error);

    // On unexpected error, handle gracefully based on route type
    if (isPublicRoute(pathname)) {
      // Allow access to public routes even on error
      console.log("[Middleware] Error on public route, allowing access");
      return NextResponse.next();
    } else {
      // Redirect to login for protected routes on error
      console.log("[Middleware] Error on protected route, redirecting to login");
      return createLoginRedirect(req, "Authentication error occurred");
    }
  }
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
