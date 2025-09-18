"use client"

import { AuthForm } from "@/components/auth-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get("next")

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: nextUrl ? `${window.location.origin}${nextUrl}` : "/dashboard",
      })

      if (result?.error) {
        setError("Failed to send sign-up email. Please try again.")
      } else {
        setEmailSent(true)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <AuthForm
        title="Check your email"
        description={`We've sent a sign-in link to ${email}`}
        leftLink={{ href: "/sign-in", text: "Back to sign in" }}
        rightLink={{
          text: "Wrong email?",
          linkText: "Try again",
          href: "#",
        }}
        hideSocialButtons
      >
        <div className="text-center text-sm text-muted-foreground">
          <p>Click the link in your email to create your account and sign in.</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEmailSent(false)}
        >
          Try another email
        </Button>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Create your account"
      description={
        <>
          Or{" "}
          <Link
            href={
              nextUrl
                ? `/sign-in?next=${encodeURIComponent(nextUrl)}`
                : "/sign-in"
            }
            className="text-primary hover:text-primary/90 transition hover:underline"
          >
            sign in
          </Link>{" "}
          if you already have an account
        </>
      }
      leftLink={{ href: "/sign-in", text: "Back to sign in" }}
      rightLink={{
        text: "Have an account?",
        linkText: "Sign in",
        href: nextUrl
          ? `/sign-in?next=${encodeURIComponent(nextUrl)}`
          : "/sign-in",
      }}
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignUp} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Create account"}
        </Button>
      </form>
    </AuthForm>
  )
}
