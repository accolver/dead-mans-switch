import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { assertValidOAuthConfig } from "./auth/oauth-config-validator";

// Validate OAuth configuration at startup (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  try {
    assertValidOAuthConfig();
  } catch (error) {
    console.error('[Auth Config] OAuth configuration error:', error);
    // In development, provide helpful guidance
    if (process.env.NODE_ENV === 'development') {
      console.info('[Auth Config] To fix this, ensure your .env.local file contains:\n' +
        'GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com\n' +
        'GOOGLE_CLIENT_SECRET=your-google-client-secret\n' +
        'NEXTAUTH_SECRET=your-secure-secret-here\n' +
        'NEXTAUTH_URL=http://localhost:3000');
    }
  }
}

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Check email verification for OAuth providers
      if (account?.provider === "google") {
        // Google provides email_verified in the profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (profile as any)?.email_verified === true;
      }

      return false; // Deny access by default
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};