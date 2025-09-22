import type { Secret } from "@/types";

function toIsoString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  try {
    return new Date(value as any).toISOString();
  } catch {
    return null;
  }
}

export function mapDrizzleSecretToSupabaseShape(row: any): Secret {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    recipient_name: row.recipientName,
    recipient_email: row.recipientEmail ?? null,
    recipient_phone: row.recipientPhone ?? null,
    contact_method: row.contactMethod,
    check_in_days: row.checkInDays,
    status: row.status,
    server_share: row.serverShare ?? null,
    iv: row.iv ?? null,
    auth_tag: row.authTag ?? null,
    sss_shares_total: row.sssSharesTotal,
    sss_threshold: row.sssThreshold,
    is_triggered: row.isTriggered ?? false,
    last_check_in: toIsoString(row.lastCheckIn),
    next_check_in: toIsoString(row.nextCheckIn),
    triggered_at: toIsoString(row.triggeredAt),
    created_at: toIsoString(row.createdAt)!,
    updated_at: toIsoString(row.updatedAt)!,
  };
}
