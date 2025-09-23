import { authConfig } from "@/lib/auth-config";
import { secretsService } from "@/lib/db/drizzle";
import { mapDrizzleSecretToSupabaseShape } from "@/lib/db/secret-mapper";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Use NextAuth for authentication
    const session = (await getServerSession(authConfig as NextAuthOptions)) as
      | Session
      | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = await secretsService.getById(id, session.user.id);

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    const newStatus = secret.status === "active" ? "paused" : "active";

    // Update the secret status
    const updatedSecret = await secretsService.update(id, {
      status: newStatus as "active" | "paused",
    });

    if (!updatedSecret) {
      return NextResponse.json({ error: "Failed to update secret" }, {
        status: 500,
      });
    }

    const mapped = mapDrizzleSecretToSupabaseShape(updatedSecret);
    return NextResponse.json({
      success: true,
      secret: mapped,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error in POST /api/secrets/[id]/toggle-pause:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
