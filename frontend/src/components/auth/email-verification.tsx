"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, Loader2, Mail, Clock } from 'lucide-react'
import {
  verifyEmailWithOTP,
  checkEmailVerificationStatus,
  resendVerificationEmail,
  type EmailVerificationResult,
  type EmailVerificationStatus
} from '@/lib/email-verification'

interface OTPVerificationFormProps {
  email: string
  onSuccess: (result: EmailVerificationResult) => void
  onError: (error: string) => void
}

export function OTPVerificationForm({ email, onSuccess, onError }: OTPVerificationFormProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      onError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    try {
      const result = await verifyEmailWithOTP(email, otp)

      if (result.success) {
        onSuccess(result)
      } else {
        onError(result.error || 'Verification failed')
      }
    } catch {
      onError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setOtp(numericValue)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">Enter verification code</Label>
        <Input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          value={otp}
          onChange={(e) => handleOtpChange(e.target.value)}
          disabled={loading}
          maxLength={6}
          className="text-center text-lg font-mono tracking-widest"
        />
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </Button>
    </form>
  )
}

interface EmailVerificationStatusProps {
  showIcon?: boolean
}

export function EmailVerificationStatus({ showIcon = true }: EmailVerificationStatusProps) {
  const [status, setStatus] = useState<EmailVerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkEmailVerificationStatus()
        setStatus(result)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center space-x-2" data-testid="loading-spinner">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking verification status...</span>
      </div>
    )
  }

  if (!status) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      {showIcon && (
        status.isVerified ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" data-testid="verified-icon" />
        ) : (
          <XCircle className="h-4 w-4 text-orange-600" data-testid="unverified-icon" />
        )
      )}
      <span className={status.isVerified ? 'text-green-600' : 'text-orange-600'}>
        {status.isVerified ? 'Email verified' : 'Email not verified'}
      </span>
    </div>
  )
}

interface ResendVerificationButtonProps {
  email: string
  onSuccess?: () => void
  onError?: (error: string) => void
  cooldownSeconds?: number
}

export function ResendVerificationButton({
  email,
  onSuccess,
  onError,
  cooldownSeconds = 60
}: ResendVerificationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResend = async () => {
    setLoading(true)
    try {
      const result = await resendVerificationEmail(email)

      if (result.success) {
        setCooldown(cooldownSeconds)
        toast({
          title: 'Email sent',
          description: 'Verification email has been sent. Please check your inbox.',
        })
        onSuccess?.()
      } else {
        const errorMessage = result.error || 'Failed to resend email'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
        onError?.(errorMessage)
      }
    } catch {
      const errorMessage = 'An unexpected error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={loading || cooldown > 0}
      className="text-sm"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Sending...
        </>
      ) : cooldown > 0 ? (
        <>
          <Clock className="mr-2 h-3 w-3" />
          Resend in {cooldown}s
        </>
      ) : (
        <>
          <Mail className="mr-2 h-3 w-3" />
          Resend verification email
        </>
      )}
    </Button>
  )
}

interface EmailVerificationPromptProps {
  email: string
  onVerificationComplete: () => void
  onCancel?: () => void
}

export function EmailVerificationPrompt({
  email,
  onVerificationComplete,
  onCancel
}: EmailVerificationPromptProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleSuccess = useCallback(() => {
    setSuccess(true)
    setError(null)
    toast({
      title: 'Email verified!',
      description: 'Your email address has been successfully verified.',
    })

    // Brief delay to show success message before completing
    setTimeout(() => {
      onVerificationComplete()
    }, 1500)
  }, [onVerificationComplete, toast])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setSuccess(false)
  }, [])

  const handleResendSuccess = useCallback(() => {
    setError(null) // Clear any previous errors
  }, [])

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-600">Email Verified!</h3>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <span>Verify your email address</span>
        </CardTitle>
        <CardDescription>
          We've sent a verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <OTPVerificationForm
          email={email}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder.
          </p>

          <ResendVerificationButton
            email={email}
            onSuccess={handleResendSuccess}
            onError={handleError}
          />
        </div>

        {onCancel && (
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full text-sm"
            >
              Back to sign in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}