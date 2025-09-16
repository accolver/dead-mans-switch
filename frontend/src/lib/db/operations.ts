import { eq, and, desc, lt } from "drizzle-orm";
import { db } from "./connection";
import { secrets, type Secret, type SecretInsert, type SecretUpdate } from "./schema";

// Secrets operations - compatible with existing API
export async function getAllSecrets(userId: string): Promise<Secret[]> {
  const result = await db
    .select()
    .from(secrets)
    .where(eq(secrets.userId, userId))
    .orderBy(desc(secrets.createdAt));

  return result;
}

export async function getSecret(id: string, userId: string): Promise<Secret> {
  const result = await db
    .select()
    .from(secrets)
    .where(and(eq(secrets.id, id), eq(secrets.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new Error("Secret not found");
  }

  return result[0];
}

export async function createSecret(secret: SecretInsert): Promise<Secret> {
  const result = await db
    .insert(secrets)
    .values(secret)
    .returning();

  if (result.length === 0) {
    throw new Error("Failed to create secret");
  }

  return result[0];
}

export async function updateSecret(id: string, updates: SecretUpdate): Promise<Secret> {
  const result = await db
    .update(secrets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(secrets.id, id))
    .returning();

  if (result.length === 0) {
    throw new Error("Secret not found or update failed");
  }

  return result[0];
}

export async function deleteSecret(id: string): Promise<void> {
  const result = await db
    .delete(secrets)
    .where(eq(secrets.id, id))
    .returning({ id: secrets.id });

  if (result.length === 0) {
    throw new Error("Secret not found");
  }
}

export async function getOverdueSecrets(): Promise<Secret[]> {
  const now = new Date();
  const result = await db
    .select()
    .from(secrets)
    .where(and(
      eq(secrets.status, "active"),
      lt(secrets.nextCheckIn, now)
    ));

  return result;
}

export async function getSecretWithOwnership(id: string, userId: string): Promise<Secret> {
  // This is the same as getSecret - keeping for API compatibility
  return getSecret(id, userId);
}

// Database health check
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.select({ count: secrets.id }).from(secrets).limit(1);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}