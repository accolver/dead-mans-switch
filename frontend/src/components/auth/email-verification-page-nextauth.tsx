"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'

export function EmailVerificationPageNextAuth() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [lastResendTime, setLastResendTime] = useState<number>(0)
  const [resendCooldown, setResendCooldown] = useState<number>(0)

  // Constants for better maintainability
  const RATE_LIMIT_SECONDS = 60
  const SUCCESS_REDIRECT_DELAY = 2000

  const email = searchParams.get('email') || session?.user?.email || ''
  const token = searchParams.get('token')
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('next') || '/dashboard'

  // Helper functions
  const getRemainingCooldownTime = () => {
    if (!lastResendTime) return 0
    const now = Date.now()
    const rateLimitMs = RATE_LIMIT_SECONDS * 1000
    const elapsed = now - lastResendTime
    return elapsed < rateLimitMs ? Math.ceil((rateLimitMs - elapsed) / 1000) : 0
  }

  const isResendDisabled = () => {
    return resendingEmail || !email || getRemainingCooldownTime() > 0
  }

  // Check verification status on mount and handle token verification
  useEffect(() => {
    if (token && email) {
      handleTokenVerification(token, email)
    } else if (status === 'authenticated' && session?.user?.id) {
      checkVerificationStatus()
    } else {
      setChecking(false)
    }
  }, [token, email, status, session?.user?.id])

  // Update countdown timer
  useEffect(() => {
    if (lastResendTime && getRemainingCooldownTime() > 0) {
      const interval = setInterval(() => {
        setResendCooldown(getRemainingCooldownTime())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [lastResendTime])

  const checkVerificationStatus = useCallback(async () => {
    setError(null)

    try {
      const response = await fetch('/api/auth/verification-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        if (result.isVerified) {
          // User is already verified, redirect them
          setAlreadyVerified(true)
          router.push(callbackUrl)
          return
        }
        // User is not verified, show verification page
        setChecking(false)
      } else {
        setError(result.error || 'Failed to check verification status')
        setChecking(false)
      }
    } catch (err) {
      console.error('Verification status check error:', err)
      setError('Network error. Please try again.')
      setChecking(false)
    }
  }, [router, callbackUrl])

  const handleTokenVerification = useCallback(async (verificationToken: string, emailAddress: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-email-nextauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
          email: emailAddress,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        toast({
          title: 'Email verified!',
          description: 'Your email address has been successfully verified.',
        })

        // Brief delay to show success message, then redirect
        setTimeout(() => {
          router.push(callbackUrl)
        }, SUCCESS_REDIRECT_DELAY)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }, [router, callbackUrl, toast])

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    if (resendingEmail) {
      return // Prevent rapid clicks
    }

    // Rate limiting with constant
    const now = Date.now()
    const rateLimitMs = RATE_LIMIT_SECONDS * 1000
    if (now - lastResendTime < rateLimitMs) {
      const remainingTime = Math.ceil((rateLimitMs - (now - lastResendTime)) / 1000)
      setError(`Please wait ${remainingTime} seconds before requesting another email`)
      return
    }

    setResendingEmail(true)
    setError(null)
    setLastResendTime(now)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Email sent',
          description: 'A new verification email has been sent to your email address.',
        })
      } else {
        setError(result.error || 'Failed to resend verification email')
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError('Network error. Please try again.')
    } finally {
      setResendingEmail(false)
    }
  }

  if (status === 'loading' || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
          <span>Checking verification status...</span>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in')
    return null
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card data-testid="verification-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2
                className="h-16 w-16 text-green-600 mx-auto"
                aria-label="Success checkmark"
                role="img"
              />
              <div>
                <h1 className="text-lg font-semibold text-green-600">Email Verified!</h1>
                <p className="text-sm text-muted-foreground">
                  Your email address has been successfully verified. Redirecting...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      data-testid="verification-container"
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16"
    >
      <Card className="w-full max-w-md" data-testid="verification-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">Verify your email address</h1>
          <CardDescription>
            We need to verify your email address before you can access the application.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Always present alert for accessibility, conditionally visible */}
          <Alert
            variant={error ? "destructive" : "default"}
            role="alert"
            id="error-message"
            aria-live="polite"
            className={error ? "" : "sr-only"}
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {error || "No errors"}
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Please check your email at{' '}
              <span className="font-medium">{email}</span>{' '}
              and click the verification link.
            </p>

            {loading && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
                <span>Verifying...</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder.
            </p>

            <Button
              onClick={handleResendVerification}
              disabled={isResendDisabled()}
              variant="outline"
              className="w-full"
              aria-describedby={error ? "error-message" : undefined}
              tabIndex={0}
            >
              {resendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" data-testid="loading-spinner" />
                  Sending...
                </>
              ) : getRemainingCooldownTime() > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Wait {getRemainingCooldownTime()}s
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
          </div>

          <div className="pt-4 border-t space-y-3">
            <Button
              onClick={() => router.push('/sign-in')}
              variant="ghost"
              className="w-full text-gray-600"
              tabIndex={0}
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}