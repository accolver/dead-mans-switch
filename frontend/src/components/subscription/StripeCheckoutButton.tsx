"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
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
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      await supabase.auth.getUser()
      // User state is not used in current implementation but kept for future use
    }
    getUser()
  }, [supabase.auth])

  const handleCheckout = async () => {
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
        await response.json()
        console.error("Checkout failed")
        // You could show a toast notification here
      }
    } catch (error) {
      console.error("Error:", error)
      // You could show a toast notification here
    } finally {
      setLoading(false)
    }
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
