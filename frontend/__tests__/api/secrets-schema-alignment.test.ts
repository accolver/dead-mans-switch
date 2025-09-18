import { describe, it, expect, afterEach } from 'vitest';
import { secretsService } from '@/lib/db/drizzle';
import { db } from '@/lib/db/drizzle';
import { secrets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Secrets Schema Alignment', () => {
  let testSecretId: string;

  afterEach(async () => {
    // Clean up test data
    if (testSecretId) {
      try {
        await db.delete(secrets).where(eq(secrets.id, testSecretId));
      } catch (error) {
        console.log('Cleanup error (expected for failed tests):', error);
      }
    }
  });

  it('should verify schema field mapping matches database columns', async () => {
    // Test that we can create a record with the expected field names
    const testData = {
      title: 'Schema Test',
      recipientName: 'Jane Doe',
      recipientEmail: 'jane@example.com',
      contactMethod: 'email' as const,
      checkInDays: 30,
      serverShare: 'test-share',
      iv: 'test-iv',
      authTag: 'test-tag',
      userId: 'test-user',
      sssSharesTotal: 3,
      sssThreshold: 2,
      status: 'active' as const,
      nextCheckIn: new Date()
    };

    // This should not throw a database column error
    const result = await secretsService.create(testData);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.recipientName).toBe('Jane Doe');

    // Store for cleanup
    testSecretId = result.id;
  });

  it('should handle field mapping from API format to database format', async () => {
    // Test the transformation that the API should perform
    const apiData = {
      recipient_name: 'Bob Smith', // API format (snake_case)
      recipient_email: 'bob@example.com',
      contact_method: 'email' as const,
      check_in_days: 30
    };

    // Transform to database format (camelCase)
    const dbData = {
      title: 'Field Mapping Test',
      recipientName: apiData.recipient_name, // Transform snake_case to camelCase
      recipientEmail: apiData.recipient_email,
      contactMethod: apiData.contact_method,
      checkInDays: apiData.check_in_days,
      serverShare: 'encrypted-server-share',
      iv: 'test-iv',
      authTag: 'test-tag',
      userId: 'test-user',
      sssSharesTotal: 3,
      sssThreshold: 2,
      status: 'active' as const,
      nextCheckIn: new Date()
    };

    const result = await secretsService.create(dbData);

    expect(result).toBeDefined();
    expect(result.recipientName).toBe('Bob Smith');

    testSecretId = result.id;
  });
});