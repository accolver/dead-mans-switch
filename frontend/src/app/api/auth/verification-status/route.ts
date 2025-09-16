import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface SupabaseUser {
  id: string
  email?: string
  email_verified?: boolean
  app_metadata?: {
    provider?: string
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[VerificationStatus] Auth error:', error)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get user information'
        },
        { status: 500 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated'
        },
        { status: 401 }
      )
    }

    // Return verification status
    const user = data.user as SupabaseUser
    return NextResponse.json({
      success: true,
      isVerified: user.email_verified || false,
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        provider: user.app_metadata?.provider
      }
    })

  } catch (error) {
    console.error('[VerificationStatus] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while checking verification status'
      },
      { status: 500 }
    )
  }
}