import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import type { User } from '@supabase/supabase-js'

interface SupabaseUser extends User {
  email_verified?: boolean
}

// Routes that don't require email verification
const NON_VERIFICATION_REQUIRED_ROUTES = [
  /^\/auth\/login$/,
  /^\/auth\/signup$/,
  /^\/auth\/reset-password$/,
  /^\/auth\/verify-email$/,
  /^\/auth\/verify$/,
  /^\/auth\/callback$/,
  /^\/auth\/signout$/,
  /^\/$/,
  /^\/api\/auth\/.*$/
]

/**
 * Check if a route requires email verification
 */
function requiresEmailVerification(pathname: string): boolean {
  return !NON_VERIFICATION_REQUIRED_ROUTES.some(regex => regex.test(pathname))
}

/**
 * Check if user needs email verification based on provider and status
 */
function userNeedsVerification(user: User): boolean {
  // If already verified, no verification needed
  const supabaseUser = user as SupabaseUser
  if (supabaseUser.email_verified) {
    return false
  }

  const provider = user.app_metadata?.provider

  // Trusted OAuth providers are considered verified
  if (provider === 'google' || provider === 'github' || provider === 'apple') {
    return false
  }

  // Email/password and other providers need verification
  return true
}

/**
 * Email verification middleware
 * Redirects unverified users to verification page for protected routes
 */
export async function checkEmailVerificationMiddleware(request: NextRequest) {
  try {
    const { user, supabaseResponse } = await updateSession(request)
    const pathname = request.nextUrl.pathname

    // If route doesn't require verification, allow through
    if (!requiresEmailVerification(pathname)) {
      return supabaseResponse
    }

    // If no user, let the auth middleware handle it
    if (!user) {
      return supabaseResponse
    }

    // If user needs verification for this protected route
    if (userNeedsVerification(user)) {
      console.log(`[EmailVerification] Redirecting unverified user from ${pathname}`)

      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/verify-email'
      redirectUrl.searchParams.set('email', user.email || '')
      redirectUrl.searchParams.set('next', pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // User is verified or doesn't need verification, allow through
    return supabaseResponse
  } catch (error) {
    console.error('[EmailVerification] Middleware error:', error)
    // On error, allow through to avoid breaking the app
    return NextResponse.next()
  }
}

/**
 * Combined middleware function that handles both auth and email verification
 */
export async function authAndEmailVerificationMiddleware(request: NextRequest) {
  // First run the email verification check
  return checkEmailVerificationMiddleware(request)
}