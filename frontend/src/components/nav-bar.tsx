"use client"

import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User } from "@supabase/supabase-js"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavBarProps {
  user?: User | null
}

export function NavBar({ user }: NavBarProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/auth/login")
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-xl font-bold transition-all duration-200 hover:underline"
        >
          KeyFate
        </Link>
        <div className="flex items-center gap-4">
          {!user && (
            <Button variant="ghost" asChild>
              <Link
                href="/pricing"
                className="transition-all duration-200 hover:underline"
              >
                Pricing
              </Link>
            </Button>
          )}
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link
                  href="/auth/login"
                  className="transition-all duration-200 hover:underline"
                >
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href="/auth/signup"
                  className="transition-all duration-200 hover:underline"
                >
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
