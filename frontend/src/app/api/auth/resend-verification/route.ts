import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = resendVerificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const supabase = await createClient()

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    })

    if (error) {
      console.error('[ResendVerification] Error:', error)

      // Handle rate limiting specifically
      if (error.message?.includes('rate') || error.message?.includes('limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please wait before requesting another email.'
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to resend verification email'
        },
        { status: 400 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('[ResendVerification] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while sending verification email'
      },
      { status: 500 }
    )
  }
}