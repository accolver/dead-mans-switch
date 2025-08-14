"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StripeCheckoutButton } from "./StripeCheckoutButton"
import { BTCPayCheckoutButton } from "./BTCPayCheckoutButton"
import { CreditCard, Bitcoin } from "lucide-react"
import { useState } from "react"

interface PaymentMethodSelectorProps {
  amount: number
  interval: "month" | "year"
  lookupKey: string
}

export function PaymentMethodSelector({ amount, interval, lookupKey }: PaymentMethodSelectorProps) {
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "btcpay">("stripe")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={paymentMethod === "stripe" ? "default" : "outline"}
            onClick={() => setPaymentMethod("stripe")}
            className="w-full"
          >
            <CreditCard className="mr-2 h-4 w-4" /> Card (Stripe)
          </Button>
          <Button
            type="button"
            variant={paymentMethod === "btcpay" ? "default" : "outline"}
            onClick={() => setPaymentMethod("btcpay")}
            className="w-full"
          >
            <Bitcoin className="mr-2 h-4 w-4" /> Bitcoin (BTCPay)
          </Button>
        </div>

        <div className="pt-2">
          {paymentMethod === "stripe" ? (
            <StripeCheckoutButton lookupKey={lookupKey}>
              Subscribe with Card - ${amount}/{interval}
            </StripeCheckoutButton>
          ) : (
            <BTCPayCheckoutButton amount={amount} currency="USD" mode="subscription">
              Subscribe with Bitcoin - ${amount}/{interval}
            </BTCPayCheckoutButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

