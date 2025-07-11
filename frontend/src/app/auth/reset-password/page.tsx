"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setMessage("Check your email for the password reset link")
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setMessage(null)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Reset your password
        </h2>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Enter your email to receive a password reset link
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleReset}>
        {message && (
          <Alert className="border-primary/50 text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>
        </div>
        <div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </div>
      </form>
    </>
  )
}
