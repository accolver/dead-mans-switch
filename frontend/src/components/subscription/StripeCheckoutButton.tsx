"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

interface StripeCheckoutButtonProps {
  lookupKey: string
  children: React.ReactNode
  disabled?: boolean
}

export function StripeCheckoutButton({
  lookupKey,
  children,
  disabled,
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setUserLoading(false)
    }
    getUser()
  }, [supabase.auth])

  const handleCheckout = async () => {
    // If user is not authenticated, redirect to signup with return URL
    if (!user) {
      const returnUrl = `${window.location.origin}/api/create-checkout-session?lookup_key=${lookupKey}&redirect_after_auth=true`
      const signupUrl = `/auth/signup?next=${encodeURIComponent(returnUrl)}`
      window.location.href = signupUrl
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lookup_key: lookupKey }),
      })

      if (response.redirected) {
        window.location.href = response.url
      } else if (response.status === 401) {
        // User session expired, redirect to login
        const returnUrl = `${window.location.origin}/api/create-checkout-session?lookup_key=${lookupKey}&redirect_after_auth=true`
        const loginUrl = `/auth/login?next=${encodeURIComponent(returnUrl)}`
        window.location.href = loginUrl
      } else {
        const errorData = await response.json()
        console.error("Checkout failed:", errorData.error || "Unknown error")
        // You could show a toast notification here
      }
    } catch (error) {
      console.error("Error:", error)
      // You could show a toast notification here
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <Button disabled className="w-full">
        Loading...
      </Button>
    )
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? "Loading..." : children}
    </Button>
  )
}
