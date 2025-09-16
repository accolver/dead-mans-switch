import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from '@supabase/supabase-js';

interface SupabaseUser extends User {
  email_verified?: boolean;
}

const NON_AUTH_ROUTE_REGEXES = [
  /^\/auth\/login$/,
  /^\/auth\/signup$/,
  /^\/auth\/reset-password$/,
  /^\/auth\/verify-email$/,
  /^\/auth\/verify$/,
  /^\/auth\/callback$/,
  /^\/$/,
];

/**
 * Check if user needs email verification
 */
function userNeedsEmailVerification(user: User): boolean {
  // If already verified, no verification needed
  const supabaseUser = user as SupabaseUser;
  if (supabaseUser.email_verified) {
    return false;
  }

  const provider = user.app_metadata?.provider;

  // Trusted OAuth providers are considered verified
  if (provider === 'google' || provider === 'github' || provider === 'apple') {
    return false;
  }

  // Email/password and other providers need verification
  return true;
}

export async function middleware(req: NextRequest) {
  try {
    // Update session and get user
    const { user, supabaseResponse } = await updateSession(req);

    // Protected routes - check auth first
    if (
      !user &&
      !NON_AUTH_ROUTE_REGEXES.some((regex) => regex.test(req.nextUrl.pathname))
    ) {
      console.log("[Middleware] No session found");
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("error", "Please sign in to continue");
      return NextResponse.redirect(redirectUrl);
    }

    // Auth routes - redirect to dashboard if already logged in and verified
    // Exclude callback route from this redirect to allow OAuth flow to complete
    if (
      req.nextUrl.pathname.startsWith("/auth") &&
      !req.nextUrl.pathname.startsWith("/auth/signout") &&
      !req.nextUrl.pathname.startsWith("/auth/callback") &&
      !req.nextUrl.pathname.startsWith("/auth/verify-email") &&
      !req.nextUrl.pathname.startsWith("/auth/verify") &&
      user
    ) {
      // Only redirect if user doesn't need verification
      if (!userNeedsEmailVerification(user)) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Email verification check for protected routes
    if (user && !NON_AUTH_ROUTE_REGEXES.some((regex) => regex.test(req.nextUrl.pathname))) {
      if (userNeedsEmailVerification(user)) {
        console.log("[Middleware] User needs email verification");
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/auth/verify-email";
        redirectUrl.searchParams.set("email", user.email || "");
        redirectUrl.searchParams.set("next", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[Middleware] Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/secrets/:path*", "/auth/:path*"],
};
