"use client"

import { Button } from "@/components/ui/button"
import { googleOAuthFlow } from "@/lib/auth/oauth-service"
import { useState } from "react"

export function SocialButtons() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const result = await googleOAuthFlow({ redirectTo: "/dashboard" })

      if (!result.success) {
        console.error("Error signing in with Google:", result.error)
        // You can add toast notification here for user feedback
      }
    } catch (error) {
      console.error("Error during Google OAuth:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? "Signing in..." : "Continue with Google"}
      </Button>
    </div>
  )
}
