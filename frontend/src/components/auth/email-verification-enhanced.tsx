"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Mail, ArrowLeft } from 'lucide-react'
import { VerificationStatus } from './verification-status'
import { ResendButton } from './resend-button'
import { OTPInput } from './otp-input'

interface EmailVerificationEnhancedProps {
  showOTPInput?: boolean
  className?: string
}

export function EmailVerificationEnhanced({
  showOTPInput = false,
  className
}: EmailVerificationEnhancedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'error'>('unverified')
  const [error, setError] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)

  const email = searchParams.get('email') || session?.user?.email || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    // Check if user is already verified
    if (session?.user?.emailVerified) {
      setVerificationStatus('verified')
      setTimeout(() => {
        router.push(callbackUrl)
      }, 2000)
    }
  }, [session, callbackUrl, router])

  const handleOTPComplete = async (otp: string) => {
    if (!email || otp.length !== 6) {
      return
    }

    setIsVerifyingOTP(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-email-nextauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setVerificationStatus('verified')
        setTimeout(() => {
          router.push(callbackUrl)
        }, 2000)
      } else {
        setError(result.error || 'Invalid verification code')
        setVerificationStatus('error')
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('Network error. Please try again.')
      setVerificationStatus('error')
    } finally {
      setIsVerifyingOTP(false)
    }
  }

  const handleResendEmail = async () => {
    setError(null)
    setVerificationStatus('pending')
    // ResendButton handles the actual API call and feedback
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in')
    return null
  }

  if (verificationStatus === 'verified') {
    return (
      <div className={`flex min-h-screen items-center justify-center ${className}`}>
        <Card className="w-full max-w-md" data-testid="verification-success-card">
          <CardContent className="pt-6">
            <VerificationStatus
              email={email}
              isVerified={true}
            />
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16 ${className}`}>
      <Card className="w-full max-w-md" data-testid="verification-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify your email address</CardTitle>
          <CardDescription>
            We need to verify your email address before you can access the application.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Verification Status */}
          <VerificationStatus
            email={email}
            isPending={verificationStatus === 'pending'}
            error={error}
          />

          {/* OTP Input Section (if enabled) */}
          {showOTPInput && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium">Enter verification code</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <OTPInput
                  onComplete={handleOTPComplete}
                  onChange={setOtpCode}
                  disabled={isVerifyingOTP}
                  data-testid="verification-otp-input"
                />

                {isVerifyingOTP && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs text-muted-foreground mt-1">Verifying code...</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <ResendButton
              email={email}
              onResend={handleResendEmail}
              disabled={verificationStatus === 'pending'}
            />

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Didn't receive the email? Check your spam folder or try a different email address.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t">
            <Button
              onClick={() => router.push('/sign-in')}
              variant="ghost"
              className="w-full text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}