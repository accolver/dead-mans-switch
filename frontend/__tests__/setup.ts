import "@testing-library/jest-dom";
import { vi } from "vitest";

// Configure React Testing Library for React 18
import { configure } from '@testing-library/react'

configure({
  // React 18 automatic batching configuration
  reactStrictMode: true,
  // Suppress act() warnings
  getElementError: (message, container) => {
    return new Error(
      [
        message,
        '',
        'Ignored in test environment',
      ].join('\n')
    );
  },
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock NextAuth
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({
    id: "google",
    name: "Google",
    type: "oauth",
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(() => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
  })),
}));

// Mock Drizzle database
vi.mock("@/lib/db/drizzle", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      into: vi.fn().mockReturnThis(),
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn(() => Promise.resolve([])),
    })),
    delete: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn(() => Promise.resolve([])),
    })),
    execute: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock auth configuration
vi.mock("@/lib/auth/config", () => ({
  authOptions: {
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {},
  },
}));

// Mock environment variables for NextAuth + Drizzle
vi.stubEnv("DATABASE_URL", "postgresql://postgres:test_password@localhost:5432/test_db");
vi.stubEnv("NEXTAUTH_SECRET", "test-nextauth-secret-32-chars-long");
vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-client-secret");
vi.stubEnv(
  "ENCRYPTION_KEY",
  Buffer.from("test-encryption-key-32-bytes-long").toString("base64"),
);

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto for Node.js environment
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid",
    getRandomValues: (arr: any) => arr.fill(0),
  },
});

// Export mock helpers for test infrastructure validation
export const mockNextAuth = {
  getServerSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
};

// Make sure no Supabase mocks exist
export const mockSupabase = undefined;
