# Jyotish — notes for Claude Code sessions

Mobile-first Vedic astrology web app. Full spec: `docs/spec.md`. Visual source of
truth: `design/*.html` (canvas mockups — reference only, never ship their
`<x-dc>` / `{{accent}}` / `support.js` markup). Spec wins on behaviour, design wins on looks.

## Golden rules
- All astrology numbers come from deterministic TypeScript in `lib/astro/`. Gemini
  only explains computed facts and returns Zod-validated JSON.
- Never invent table values (nakshatras, kootas, yoni, gana, friendships). Each
  table lives in `lib/astro/tables/` with a source comment; unclear → `TODO(verify)`.
- Never invent golden chart values. The owner supplies them from Drik Panchang
  (Lahiri). Until then golden tests are `it.todo`.
- Never send names, raw birth date/time or place to Gemini — derived facts only.
- No secrets in the repo. Only `.env.example` is committed.

## Stack
Next.js 16 (App Router, TS strict, `proxy.ts` instead of middleware), Tailwind v4
(tokens in `tailwind.config.ts`, loaded via `@config`), Supabase (Google sign-in
only), Drizzle (`lib/db/schema.ts`, migrations in `/drizzle`), `astronomy-engine`,
Luxon + `geo-tz`, `@google/genai`, Zod, Vitest + Playwright.

## Owner decisions (31 Oct 2026)
1. Work on the session branch; open a PR into `main` after each phase. `main` is
   the Vercel production branch.
2. Golden-chart tests: `it.todo` until the owner supplies values.
3. Births in India before 1956: ask the user to pick IST (default), Bombay Time
   +04:51, Calcutta Time +05:53:20, or a custom offset; save with
   `tz_confirmed = true`. No city table. Offsets are stored in **seconds**
   (`utc_offset_seconds`) because +05:53:20 is not a whole number of minutes.
4. Auth: Google sign-in only (no phone OTP).
5. Geocoding: OpenStreetMap Nominatim behind an interface (`lib/geo`), so Google
   Maps can be swapped in later.
6. Rate limits: stored in Postgres (`usage_events`), no Upstash.
7. Defaults accepted for the remaining open points:
   - "Good time" = Abhijit Muhurta computed in code; lucky colour/number from a
     fixed planet → colour/number table, not from Gemini.
   - Touch targets ≥ 44px even where the mockup shows 40px.
   - "Full day" Panchang and the avatar → simple pages in the same style
     (full-day Panchang; Profile with language, saved profiles, delete my data).
   - Panchang place name via Nominatim reverse geocoding.
   - Panchang shows elements at local sunrise, with end times.
   - Vimshottari year = 365.25 days.
   - Daily/weekly/monthly horoscope cached per Moon sign + Lagna (shared across
     users, `readings.subject_key = "sign:..."`); monthly = calendar month.
   - Kannada font: Noto Sans Kannada (Hind has no Kannada glyphs).
   - Hindi/Kannada UI strings: owner to supply or approve.
   - Gemini model IDs only via env vars (`GEMINI_MODEL_DEEP`, `GEMINI_MODEL_FAST`).
   - Drizzle connects with a role that bypasses RLS, so every query must filter by
     the signed-in user in code; RLS is the second safeguard.
   - App name stays "Jyotish".

## Layout
```
app/(app)/…        Home, kundali, match, dasha, forecast (bottom nav shell)
app/onboarding     Birth details
app/login, app/auth/callback, app/auth/signout   Google sign-in
components/        UI, nav, chart SVGs
lib/astro          Engine (+ /tables)      lib/time   tz resolution
lib/llm            gemini.ts, prompts, schemas
lib/db             Drizzle schema + client lib/supabase  SSR clients + proxy helper
drizzle/           SQL migrations          tests/golden  reference charts (owner)
```

## Commands
`npm run lint && npm run typecheck && npm test && npm run build` must pass before
every push. `npm run db:generate` after editing the schema; review the SQL.

## Build phases (spec section 12)
1. Foundation ✅  2. Birth input  3. Engine  4. Charts  5. Gemini  6. Forecast + polish
