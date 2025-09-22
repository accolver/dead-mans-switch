import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth-config"
import { ReactNode } from "react"
import { NavBar } from "@/components/nav-bar"
import type { Session } from "next-auth"

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  try {
    // Use NextAuth server session instead of Supabase
    const session = (await getServerSession(authConfig as any)) as Session | null

    if (!session?.user) {
      redirect("/sign-in")
    }

    return (
      <>
        <NavBar />
        <main>{children}</main>
      </>
    )
  } catch (error) {
    console.error("[AuthenticatedLayout] Session error:", error)
    redirect("/sign-in")
  }
}