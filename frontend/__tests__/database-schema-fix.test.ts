import { describe, it, expect, beforeAll } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '@/lib/db/drizzle';
import { secrets } from '@/lib/db/schema';

describe('Database Schema Fix - TDD Approach', () => {
  beforeAll(async () => {
    // Skip tests if DATABASE_URL is not available (CI/testing environment)
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not available, skipping database tests');
      return;
    }
  });

  it('should verify recipient_name column exists in database', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping test - no DATABASE_URL');
      return;
    }

    try {
      // Check if recipient_name column exists
      const result = await db.execute(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'secrets'
        AND column_name = 'recipient_name';
      `);

      console.log('recipient_name column query result:', result.rows);

      // Test should pass when column exists
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('column_name', 'recipient_name');
      expect(result.rows[0]).toHaveProperty('data_type', 'text');
      expect(result.rows[0]).toHaveProperty('is_nullable', 'NO'); // NOT NULL constraint
    } catch (error) {
      console.error('Error checking recipient_name column:', error);
      throw error;
    }
  });

  it('should verify secrets table has all required columns', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping test - no DATABASE_URL');
      return;
    }

    try {
      const result = await db.execute(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'secrets'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map(row => row.column_name);
      console.log('All secrets table columns:', columns);

      // Required columns based on schema.ts
      const requiredColumns = [
        'id',
        'user_id',
        'title',
        'recipient_name',
        'recipient_email',
        'recipient_phone',
        'contact_method',
        'check_in_days',
        'status',
        'server_share',
        'iv',
        'auth_tag',
        'sss_shares_total',
        'sss_threshold',
        'is_triggered',
        'last_check_in',
        'next_check_in',
        'triggered_at',
        'created_at',
        'updated_at'
      ];

      for (const column of requiredColumns) {
        expect(columns).toContain(column);
      }
    } catch (error) {
      console.error('Error checking secrets table columns:', error);
      throw error;
    }
  });

  it('should verify drizzle schema matches database structure', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping test - no DATABASE_URL');
      return;
    }

    try {
      // Test that we can perform a select using the Drizzle schema
      // This will fail if there's a schema mismatch
      const result = await db
        .select({
          id: secrets.id,
          recipientName: secrets.recipientName,
          title: secrets.title
        })
        .from(secrets)
        .limit(1);

      // If this doesn't throw an error, the schema matches
      expect(Array.isArray(result)).toBe(true);
      console.log('Schema verification successful - Drizzle can query secrets table');
    } catch (error) {
      console.error('Schema mismatch detected:', error);
      throw error;
    }
  });

  it('should test secret creation after schema fix', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('Skipping test - no DATABASE_URL');
      return;
    }

    try {
      const testSecret = {
        userId: 'test-user-id',
        title: 'Test Secret',
        recipientName: 'Test Recipient', // This should work after fix
        recipientEmail: 'test@example.com',
        contactMethod: 'email' as const,
        checkInDays: 30,
        status: 'active' as const,
        nextCheckIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sssSharesTotal: 3,
        sssThreshold: 2
      };

      // This should succeed without throwing an error
      const result = await db.insert(secrets).values(testSecret).returning();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0].recipientName).toBe('Test Recipient');

      // Clean up - delete the test record
      if (result[0]?.id) {
        await db.delete(secrets).where(db.sql`id = ${result[0].id}`);
        console.log('Test secret created and cleaned up successfully');
      }
    } catch (error) {
      console.error('Error testing secret creation:', error);
      throw error;
    }
  });
});