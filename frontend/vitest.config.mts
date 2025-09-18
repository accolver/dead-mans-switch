import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  envDir: "./",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    testTimeout: 10000,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPPORT_EMAIL: "support@aviat.io",
      NEXT_PUBLIC_SITE_URL: "https://keyfate.com",
      NEXT_PUBLIC_COMPANY: "KeyFate",
      NEXT_PUBLIC_PARENT_COMPANY: "Aviat, LLC",
      // Google OAuth test configuration
      GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      NEXTAUTH_SECRET: "test-nextauth-secret",
      NEXTAUTH_URL: "http://localhost:3000",
      // Database configuration for tests
      DATABASE_URL: "postgresql://postgres:test_password@localhost:5432/test_db",
      ENCRYPTION_KEY: "test_encryption_key_32_bytes_long_for_testing",
    },
    include: [
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    // Suppress React act() warnings and API error logs in tests
    onConsoleLog(log, type) {
      if (
        log.includes(
          "Warning: An update to TestComponent inside a test was not wrapped in act",
        )
      ) {
        return false;
      }
      // Suppress expected API error logs during testing
      if (
        type === "stderr" &&
        (log.includes("[POST /api/secrets") ||
          log.includes("[CreateSecret") ||
          log.includes("Error:") ||
          log.includes("SyntaxError:"))
      ) {
        return false;
      }
    },
  },
});
