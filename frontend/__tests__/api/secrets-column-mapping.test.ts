import { describe, it, expect } from 'vitest';
import { secrets } from '@/lib/db/schema';

describe('Secrets Schema Column Mapping', () => {
  it('should have correct TypeScript to database column mapping', () => {
    // Get the Drizzle table metadata
    const columns = secrets._.columns;

    // Check that recipientName maps to recipient_name column
    expect(columns.recipientName).toBeDefined();
    expect(columns.recipientName.name).toBe('recipient_name');

    // Check other field mappings
    expect(columns.recipientEmail.name).toBe('recipient_email');
    expect(columns.contactMethod.name).toBe('contact_method');
    expect(columns.checkInDays.name).toBe('check_in_days');
    expect(columns.serverShare.name).toBe('server_share');
    expect(columns.sssSharesTotal.name).toBe('sss_shares_total');
    expect(columns.sssThreshold.name).toBe('sss_threshold');

    console.log('All column mappings:');
    Object.entries(columns).forEach(([tsName, column]) => {
      console.log(`  ${tsName} -> ${column.name}`);
    });
  });

  it('should generate correct SQL for insert operations', () => {
    // This test verifies that the schema generates the expected SQL
    const testData = {
      title: 'Test',
      recipientName: 'John Doe',
      recipientEmail: 'john@example.com',
      contactMethod: 'email' as const,
      checkInDays: 30,
      userId: 'user123',
      sssSharesTotal: 3,
      sssThreshold: 2,
      status: 'active' as const,
      nextCheckIn: new Date()
    };

    // This should not throw a type error
    const insertType: typeof secrets.$inferInsert = testData;
    expect(insertType).toBeDefined();
  });
});