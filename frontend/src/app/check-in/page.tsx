"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { NEXT_PUBLIC_SUPABASE_URL } from "@/lib/env"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function CheckInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get("token")

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Invalid Check-In Link
          </h1>
          <p className="text-gray-600">
            This check-in link is missing required information.
          </p>
        </div>
      </div>
    )
  }

  const handleCheckIn = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-in?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        toast({
          title: "Check-in successful! ✅",
          description: "Your secret timer has been reset.",
        })
      } else {
        throw new Error("Check-in failed")
      }
    } catch (error) {
      console.error("Check-in error:", error)
      toast({
        title: "Check-in failed ❌",
        description:
          "There was an error processing your check-in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Secret Check-In</h1>

        <p className="text-gray-600">
          Click the button below to check in and reset your secret's timer.
        </p>

        <Button
          onClick={handleCheckIn}
          disabled={isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading ? "Checking in..." : "Check In Now"}
        </Button>

        <p className="text-sm text-gray-500">
          This will update your last check-in time and prevent your secret from
          being triggered.
        </p>
      </div>
    </div>
  )
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckInContent />
    </Suspense>
  )
}
