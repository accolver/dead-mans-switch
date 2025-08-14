"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { Bitcoin } from "lucide-react"
import { useEffect, useState } from "react"

interface BTCPayCheckoutButtonProps {
  amount: number
  currency?: string
  mode?: "payment" | "subscription"
  children: React.ReactNode
  disabled?: boolean
}

export function BTCPayCheckoutButton({
  amount,
  currency = "USD",
  mode = "payment",
  children,
  disabled,
}: BTCPayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setCheckingAuth(false)
    }
    getUser()
  }, [supabase.auth])

  const handleCheckout = async () => {
    setLoading(true)

    try {
      if (!user) {
        const params = new URLSearchParams({
          amount: String(amount),
          currency,
          mode,
          redirect_after_auth: "true",
        })
        const returnUrl = `${window.location.origin}/api/create-btcpay-checkout?${params.toString()}`
        const loginUrl = `/auth/login?next=${encodeURIComponent(returnUrl)}`
        window.location.href = loginUrl
        return
      }

      const response = await fetch("/api/create-btcpay-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, mode }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else if (response.status === 401) {
        const params = new URLSearchParams({
          amount: String(amount),
          currency,
          mode,
          redirect_after_auth: "true",
        })
        const returnUrl = `${window.location.origin}/api/create-btcpay-checkout?${params.toString()}`
        const loginUrl = `/auth/login?next=${encodeURIComponent(returnUrl)}`
        window.location.href = loginUrl
      } else {
        const res = await response.json()
        console.error("BTCPay checkout failed", res)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
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
      variant="default"
    >
      <Bitcoin className="w-4 h-4 mr-2" />
      {loading ? "Loading..." : children}
    </Button>
  )
}

