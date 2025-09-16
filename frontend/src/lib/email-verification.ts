import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SupabaseUser extends User {
  email_verified?: boolean
}

export interface EmailVerificationResult {
  success: boolean
  user?: User
  error?: string
  alreadyVerified?: boolean
  requiresVerification?: boolean
}

export interface EmailVerificationStatus {
  isVerified: boolean
  user?: User | null
  error?: string | null
}

/**
 * Verify email address using OTP code
 */
export async function verifyEmailWithOTP(email: string, otp: string): Promise<EmailVerificationResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    if (data.user) {
      return {
        success: true,
        user: data.user
      }
    }

    return {
      success: false,
      error: 'Verification failed'
    }
  } catch {
    return {
      success: false,
      error: 'An unexpected error occurred during verification'
    }
  }
}

/**
 * Send OTP verification code to email
 */
export async function sendVerificationOTP(email: string): Promise<EmailVerificationResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch {
    return {
      success: false,
      error: 'Failed to send verification email'
    }
  }
}

/**
 * Check current user's email verification status
 */
export async function checkEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return {
        isVerified: false,
        error: error.message
      }
    }

    if (!data.user) {
      return {
        isVerified: false,
        user: null
      }
    }

    const user = data.user as SupabaseUser
    return {
      isVerified: user.email_verified || false,
      user: user,
      error: null
    }
  } catch {
    return {
      isVerified: false,
      error: 'Failed to check verification status'
    }
  }
}

/**
 * Handle OAuth user email verification
 * Google and other trusted providers should be automatically verified
 */
export async function handleOAuthEmailVerification(user: User): Promise<EmailVerificationResult> {
  try {
    const supabase = createClient()
    const supabaseUser = user as SupabaseUser
    const provider = user.app_metadata?.provider

    // If user is already verified, skip
    if (supabaseUser.email_verified) {
      return {
        success: true,
        user,
        alreadyVerified: true
      }
    }

    // For trusted OAuth providers (Google, etc.), automatically verify
    if (provider === 'google' || provider === 'github' || provider === 'apple') {
      const { data, error } = await supabase.auth.updateUser({
        data: { email_verified: true }
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        user: data.user
      }
    }

    // For email/password users, verification is required
    if (provider === 'email') {
      return {
        success: true,
        requiresVerification: true,
        user
      }
    }

    // For other providers, default to requiring verification
    return {
      success: true,
      requiresVerification: true,
      user
    }
  } catch {
    return {
      success: false,
      error: 'Failed to handle OAuth verification'
    }
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch {
    return {
      success: false,
      error: 'Failed to resend verification email'
    }
  }
}

/**
 * Check if a user requires email verification based on their provider
 */
export function requiresEmailVerification(user: User): boolean {
  const supabaseUser = user as SupabaseUser
  if (supabaseUser.email_verified) {
    return false
  }

  const provider = user.app_metadata?.provider

  // Trusted OAuth providers don't require manual verification
  if (provider === 'google' || provider === 'github' || provider === 'apple') {
    return false
  }

  // Email/password and other providers require verification
  return true
}

/**
 * Get verification requirements for a user
 */
export function getVerificationRequirements(user: User) {
  const supabaseUser = user as SupabaseUser
  const provider = user.app_metadata?.provider
  const isVerified = supabaseUser.email_verified
  const needsVerification = requiresEmailVerification(user)

  return {
    provider,
    isVerified,
    needsVerification,
    canAutoVerify: provider === 'google' || provider === 'github' || provider === 'apple'
  }
}