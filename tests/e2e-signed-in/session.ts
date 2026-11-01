import type { BrowserContext } from "@playwright/test";

export const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
export const MOCK_SUPABASE_URL = "http://localhost:54329";

const b64url = (s: string) => Buffer.from(s).toString("base64url");

/** Sets the cookie @supabase/ssr reads (sb-<host>-auth-token) for a fake signed-in session. */
export async function signIn(context: BrowserContext, baseURL: string) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = [
    b64url(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    b64url(JSON.stringify({ sub: TEST_USER_ID, aud: "authenticated", role: "authenticated", iat: now, exp: now + 3600 })),
    "test-signature",
  ].join(".");
  const session = {
    access_token: accessToken,
    refresh_token: "test-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: { id: TEST_USER_ID, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} },
  };
  await context.addCookies([
    { name: "sb-localhost-auth-token", value: `base64-${b64url(JSON.stringify(session))}`, url: baseURL },
  ]);
}
