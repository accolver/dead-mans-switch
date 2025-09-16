"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { EmailVerificationPrompt } from "@/components/auth/email-verification"
import { checkEmailVerificationStatus } from "@/lib/email-verification"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [alreadyVerified, setAlreadyVerified] = useState(false)

  const email = searchParams.get("email")
  const nextUrl = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkEmailVerificationStatus()
        if (status.isVerified) {
          setAlreadyVerified(true)
          toast({
            title: "Already verified",
            description: "Your email is already verified. Redirecting...",
          })
          setTimeout(() => {
            router.push(nextUrl)
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to check verification status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [nextUrl, router, toast])

  const handleVerificationComplete = () => {
    router.push(nextUrl)
  }

  const handleCancel = () => {
    router.push("/auth/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking verification status...</span>
        </div>
      </div>
    )
  }

  if (alreadyVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">Email Already Verified</h2>
          <p className="text-muted-foreground">
            Your email address is already verified. Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <AuthForm
        title="Email Required"
        description="Please provide an email address to verify"
        leftLink={{ href: "/auth/login", text: "Back to sign in" }}
        rightLink={{
          text: "Need an account?",
          linkText: "Sign up",
          href: "/auth/signup"
        }}
        hideSocialButtons
      >
        <p className="text-muted-foreground text-center">
          Email address is required for verification. Please{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            sign in
          </a>{" "}
          or{" "}
          <a href="/auth/signup" className="text-primary hover:underline">
            sign up
          </a>{" "}
          to continue.
        </p>
      </AuthForm>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <EmailVerificationPrompt
        email={email}
        onVerificationComplete={handleVerificationComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
