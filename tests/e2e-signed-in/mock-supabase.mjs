// Stand-in for Supabase Auth in the signed-in E2E run. getClaims() falls back to
// GET /auth/v1/user for HS256 tokens, so that is the only endpoint needed.
import http from "node:http";

// Must match TEST_USER_ID in session.ts.
const TEST_USER_ID = "11111111-1111-4111-8111-111111111111";
const port = Number(process.env.MOCK_SUPABASE_PORT ?? 54329);

http
  .createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url?.startsWith("/auth/v1/user")) {
      res.end(
        JSON.stringify({
          id: TEST_USER_ID,
          aud: "authenticated",
          role: "authenticated",
          email: "e2e@example.com",
          app_metadata: { provider: "google" },
          user_metadata: {},
          created_at: "2026-01-01T00:00:00Z",
        }),
      );
      return;
    }
    if (req.url?.includes("jwks")) {
      res.end(JSON.stringify({ keys: [] }));
      return;
    }
    res.statusCode = 404;
    res.end("{}");
  })
  .listen(port, () => console.log(`mock supabase on ${port}`));
