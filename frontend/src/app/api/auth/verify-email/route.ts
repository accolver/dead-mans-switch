import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

interface SupabaseUser {
  id: string
  email?: string
  email_verified?: boolean
}

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = verifyEmailSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and OTP are required',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email, otp } = validation.data
    const supabase = await createClient()

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })

    if (error) {
      console.error('[VerifyEmail] Verification error:', error)

      // Handle specific error types
      let statusCode = 400
      let errorMessage = error.message

      if (error.message?.includes('expired')) {
        statusCode = 400
        errorMessage = 'Verification code has expired'
      } else if (error.message?.includes('invalid')) {
        statusCode = 400
        errorMessage = 'Invalid verification code'
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: statusCode }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification failed - no user data'
        },
        { status: 400 }
      )
    }

    // Success response
    const user = data.user as SupabaseUser
    return NextResponse.json({
      success: true,
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified
      }
    })

  } catch (error) {
    console.error('[VerifyEmail] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during verification'
      },
      { status: 500 }
    )
  }
}