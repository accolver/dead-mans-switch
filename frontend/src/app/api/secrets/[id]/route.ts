import { Database } from "@/lib/database.types";
import { decryptMessage } from "@/lib/encryption";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const decrypt = searchParams.get("decrypt") === "true";

  if (!id) {
    return NextResponse.json({ error: "Missing secret ID" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    // @ts-expect-error
    cookies: () => cookieStore,
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingSecret, error: fetchError } = await supabase
    .from("secrets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingSecret) {
    return NextResponse.json({ error: "Secret not found" }, { status: 404 });
  }

  if (
    decrypt && (existingSecret as any).server_share &&
    (existingSecret as any).iv &&
    (existingSecret as any).auth_tag
  ) {
    // Decrypt the server share for the owner
    try {
      const decryptedServerShare = await decryptMessage(
        (existingSecret as any).server_share,
        Buffer.from((existingSecret as any).iv, "base64"),
        Buffer.from((existingSecret as any).auth_tag, "base64"),
      );
      return NextResponse.json({
        secret: {
          ...(existingSecret as any),
          decrypted_server_share: decryptedServerShare,
        },
      });
    } catch (error) {
      console.error("Failed to decrypt server share:", error);
      return NextResponse.json(
        { error: "Failed to decrypt server share" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ secret: existingSecret });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing secret ID" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      // @ts-expect-error
      cookies: () => cookieStore,
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      title,
      recipient_name,
      recipient_email,
      recipient_phone,
      contact_method,
      check_in_days,
    } = body;

    // Verify the secret exists and belongs to user
    const { data: existingSecret, error: fetchError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingSecret) {
      return NextResponse.json(
        { error: "Secret not found" },
        { status: 404 },
      );
    }

    // Calculate next check-in time
    const nextCheckIn = new Date();
    nextCheckIn.setDate(nextCheckIn.getDate() + parseInt(check_in_days));

    // Update only metadata (no secret content editing allowed with Shamir's)
    const { error: updateError } = await supabase
      .from("secrets")
      .update({
        title,
        recipient_name,
        recipient_email: contact_method !== "phone" ? recipient_email : null,
        recipient_phone: contact_method !== "email" ? recipient_phone : null,
        contact_method,
        check_in_days: parseInt(check_in_days),
        next_check_in: nextCheckIn.toISOString(),
      } as any)
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UpdateSecret] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to update secret",
      },
      { status: 500 },
    );
  }
}
