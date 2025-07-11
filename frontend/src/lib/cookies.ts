import {
  type RequestCookies,
  type ResponseCookies,
} from "next/dist/server/web/spec-extension/cookies";

interface ClearSupabaseCookiesParams {
  requestCookies: RequestCookies;
  responseCookies: ResponseCookies;
  domain: string;
}

export function clearSupabaseCookies({
  requestCookies,
  responseCookies,
  domain,
}: ClearSupabaseCookiesParams) {
  // Get all cookies
  const cookies = requestCookies.getAll();

  // Clear Supabase cookies
  cookies.forEach((cookie) => {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.startsWith("supabase-") ||
      cookie.name === "__stripe_mid" ||
      cookie.name === "__stripe_sid"
    ) {
      responseCookies.delete(cookie.name);
      responseCookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
        domain,
      });
    }
  });
}
