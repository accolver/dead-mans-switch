/**
 * TDD Test for NextAuth import verification
 * This test ensures NextAuth JWT imports work correctly
 */

import { describe, it, expect } from 'vitest';

describe('NextAuth Import Verification', () => {
  it('should import getToken from next-auth/jwt without errors', async () => {
    // Test that we can import getToken from the correct path
    const { getToken } = await import('next-auth/jwt');

    expect(getToken).toBeDefined();
    expect(typeof getToken).toBe('function');
  });

  it('should NOT be able to import from deprecated next-auth/middleware', async () => {
    // This should fail if the import is attempted
    await expect(async () => {
      await import('next-auth/middleware');
    }).rejects.toThrow();
  });
});