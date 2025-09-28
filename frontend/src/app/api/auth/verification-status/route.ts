import { authConfig } from "@/lib/auth-config";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  try {
    // Get NextAuth session
    const session = (await getServerSession(authConfig as any)) as
      | Session
      | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const db = await getDatabase();
    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const user = userResult[0];
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    // Calculate additional metadata
    const now = new Date();
    const accountAge = user.createdAt
      ? Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      )
      : 0;

    // Return verification status
    return NextResponse.json({
      success: true,
      isVerified: !!user.emailVerified,
      verificationDate: user.emailVerified,
      accountAge,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("[VerificationStatus] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while checking verification status",
      },
      { status: 500 },
    );
  }
}
