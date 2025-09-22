"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { OTPInput } from './otp-input'
import { ResendVerificationButton } from './email-verification'
import { verifyEmailWithOTP, checkEmailVerificationStatus } from '@/lib/email-verification'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function EmailVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)

  const email = searchParams.get('email') || session?.user?.email || ''
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('next') || '/dashboard'

  // Check verification status on load
  useEffect(() => {
    if (status !== 'authenticated') return

    const checkStatus = async () => {
      try {
        const verificationStatus = await checkEmailVerificationStatus()
        if (verificationStatus.isVerified) {
          setAlreadyVerified(true)
          toast({
            title: 'Already verified',
            description: 'Your email is already verified. Redirecting...',
          })
          setTimeout(() => router.push(callbackUrl), 2000)
        }
      } catch (err) {
        console.error('Failed to check verification status:', err)
      } finally {
        setChecking(false)
      }
    }

    checkStatus()
  }, [status, callbackUrl, router, toast])

  const handleOTPComplete = async (otpValue: string) => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await verifyEmailWithOTP(email, otpValue)

      if (result.success) {
        setSuccess(true)
        toast({
          title: 'Email verified!',
          description: 'Your email address has been successfully verified.',
        })

        // Brief delay to show success message
        setTimeout(() => {
          router.push(callbackUrl)
        }, 1500)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (otpValue: string) => {
    setOtp(otpValue)
    if (error) setError(null) // Clear error when user starts typing
  }

  const handleResendSuccess = () => {
    setError(null)
    toast({
      title: 'Email sent',
      description: 'A new verification code has been sent to your email.',
    })
  }

  const handleResendError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleRetry = () => {
    setError(null)
    setOtp('')
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

  if (alreadyVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card data-testid="verification-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-600">Email Already Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Your email address is already verified. Redirecting...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card data-testid="verification-card">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-600">Email Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to your destination...
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
          <CardTitle className="text-2xl font-bold">Verify your email address</CardTitle>
          <CardDescription>
            We need to verify your email address before you can access the application.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes('Network error') && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2 p-0 h-auto text-destructive hover:text-destructive/80"
                  >
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium">{email}</span>
            </p>

            <div className="space-y-4">
              <OTPInput
                onComplete={handleOTPComplete}
                onChange={handleOTPChange}
                disabled={loading}
              />

              {loading && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
                  <span>Verifying...</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder.
            </p>

            <ResendVerificationButton
              email={email}
              onSuccess={handleResendSuccess}
              onError={handleResendError}
              cooldownSeconds={60}
            />
          </div>

          <div className="pt-4 border-t space-y-3">
            <Button
              onClick={() => router.push(callbackUrl)}
              className="w-full"
              variant="default"
            >
              Continue
            </Button>

            <Button
              onClick={() => router.push('/sign-in')}
              variant="ghost"
              className="w-full text-gray-600"
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}