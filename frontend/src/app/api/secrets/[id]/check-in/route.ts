import { authConfig } from "@/lib/auth-config";
import { ensureUserExists } from "@/lib/auth/user-verification";
import { db, secretsService } from "@/lib/db/drizzle";
import { checkinHistory } from "@/lib/db/schema";
import { mapDrizzleSecretToSupabaseShape } from "@/lib/db/secret-mapper";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Use NextAuth for authentication
    const session = await getServerSession(authConfig as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database before creating check-in history
    try {
      const userVerification = await ensureUserExists(session);
      console.log("[Check-in API] User verification result:", {
        exists: userVerification.exists,
        created: userVerification.created,
        userId: session.user.id,
      });
    } catch (userError) {
      console.error("[Check-in API] User verification failed:", userError);
      return NextResponse.json(
        { error: "Failed to verify user account" },
        { status: 500 },
      );
    }

    const secret = await secretsService.getById(id, session.user.id);

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    // Calculate next check-in
    const now = new Date();
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + secret.checkInDays);

    // Update the secret with new check-in times
    const updatedSecret = await secretsService.update(id, {
      lastCheckIn: now,
      nextCheckIn: nextCheckIn,
    });

    if (!updatedSecret) {
      return NextResponse.json({ error: "Failed to update secret" }, {
        status: 500,
      });
    }

    // Record check-in history
    await db.insert(checkinHistory).values({
      secretId: id,
      userId: session.user.id,
      checkedInAt: now,
      nextCheckIn: nextCheckIn,
    });

    const mapped = mapDrizzleSecretToSupabaseShape(updatedSecret);
    return NextResponse.json({
      success: true,
      secret: mapped,
      next_check_in: mapped.next_check_in,
    });
  } catch (error) {
    console.error("Error in POST /api/secrets/[id]/check-in:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
