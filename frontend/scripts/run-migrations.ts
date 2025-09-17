import postgres from "postgres";
import fs from "fs";
import path from "path";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL ||
    "postgresql://postgres:dev_password_change_in_prod@localhost:5432/keyfate_dev";

  console.log("Running database migrations...");

  const sql = postgres(connectionString, { max: 1 });

  try {
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, "../src/lib/db/migrations/0001_auth_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migrations
runMigrations();