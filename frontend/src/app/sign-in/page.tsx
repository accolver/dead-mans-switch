"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SocialButtons } from "@/components/ui/social-buttons"

export default function SignInPage() {

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Welcome back! Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SocialButtons />

          <div className="text-center text-sm text-muted-foreground">
            <p>Sign in securely with your Google account</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
