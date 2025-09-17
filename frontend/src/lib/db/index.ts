import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:dev_password_change_in_prod@localhost:5432/keyfate_dev";

// For migrations and single queries
const migrationClient = postgres(connectionString, { max: 1 });

// For application use
const queryClient = postgres(connectionString);

// Create the drizzle database instance
export const db = drizzle(queryClient, {
  schema: {
    ...authSchema,
  },
});

// Export for migrations
export const migrationDb = drizzle(migrationClient, {
  schema: {
    ...authSchema,
  },
});

// Export schema for use in other files
export * from "./schema/auth";