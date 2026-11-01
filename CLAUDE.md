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
   `tz_confirmed = true`. No city table. `tz_confirmed` is also true when the user
   edits the offset manually; otherwise false (auto-detected). Offsets are stored in **seconds**
   (`utc_offset_seconds`) because +05:53:20 is not a whole number of minutes.
4. Auth: Google sign-in only (no phone OTP).
5. Geocoding behind the `Geocoder` interface (`lib/geo/types.ts`) so Google Places
   can replace it: type-ahead from bundled GeoNames cities500 (`data/places.json`,
   CC BY 4.0; all of India + world cities with population ≥ 100,000, built by
   `npm run data:places`, run automatically as `prebuild` on Vercel/CI; not committed) via `/api/places/suggest`; a "Search" button falls back
   to Nominatim (`/api/places/search`, 1 req/s app-wide via `external_throttle`,
   identifying User-Agent, 30-day `geocode_cache`). Never call Nominatim per keystroke.
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

## Engine notes (phase 3)
- Lahiri: mean value 23°15′00.658″ − 16.77″ at JD 2435553.5, IAU 2006 precession;
  true ayanamsa adds nutation. Planets: astronomy-engine apparent longitude of
  date − true ayanamsa. Rahu: Meeus mean node − mean ayanamsa. `ENGINE_VERSION`
  in `lib/astro/config.ts` — bump it when any convention changes (stored charts
  recompute on read).
- Koota tables marked `TODO(verify)` (Vashya, Yoni non-enemy cells, Gana
  cross-cells, Manglik house set) await owner verification; see the `it.todo`s in
  `lib/astro/matching.test.ts`.

## Gemini notes (phase 5)
- `lib/llm/gemini.ts` is the only Gemini entry point (server-only). Structured
  output from Zod schemas (`lib/llm/schemas.ts`), Zod validation + banned-phrase
  check, one retry, then `LlmError` → friendly 503.
- Facts builders (`lib/llm/facts.ts`) are the only data sent to Gemini; a test
  asserts no birth date/time/place/coordinates leak.
- `lib/db/readings.ts` caches by (subject, feature, period, facts hash, prompt
  version, language); horoscopes are shared per Moon sign + Lagna. Bump the
  prompt version in `lib/llm/prompts` when a template changes.
- 30 Gemini calls/hour/user (cache hits are free). Lucky colour/number
  (`lib/astro/tables/lucky.ts`, TODO(verify)) and good time (Abhijit) are computed.
- Live smoke tests: `RUN_LLM_TESTS=1 GEMINI_API_KEY=… npm test -- tests/llm`.

## Phase 6 notes
- 5-year forecast: `lib/astro/forecastFacts.ts` (dasha periods + slow-planet spells
  per year, life-area houses career 10, finance 2/11, family 4, health 6/1,
  marriage 7), one Gemini request per year, cache key `<year>@<current year>` so
  it regenerates on 1 January; health text always ends with the disclaimer (code).
- Privacy: consent required on every profile create (`consents` table, version in
  `lib/db/account.ts`); `/profile` has language, saved profiles, delete my data
  (`DELETE /api/me` deletes all rows, then the auth user if
  `SUPABASE_SERVICE_ROLE_KEY` is set). `/privacy` is public; TODO(owner) legal review.
- Setup diagnostics (public, no values): `/api/health` (settings, DB, migrations,
  places) and `/api/env-check` (each required variable at build vs run time,
  VERCEL_ENV, branch, commit, deployment URL). Deployment URLs are immutable
  snapshots: env changes need a redeploy and the NEW URL.
- Languages: readings follow the profile language; Noto Sans Kannada is loaded.
  UI strings are English until the owner supplies Hindi/Kannada strings.
- E2E: `npm run build && npm run test:e2e` (Playwright, 390px + 1280px, axe zero
  serious violations); CI job `e2e`. Signed-in navigation:
  `npm run build:e2e-signed-in && npm run test:e2e-signed-in` (mock Supabase Auth +
  `TEST_DATABASE_URL`); CI job `e2e-signed-in`.

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
every push. Set `TEST_DATABASE_URL` (throwaway Postgres) to also run
`tests/integration` locally; CI always runs them. `npm run db:generate` after editing the schema; review the SQL.

## Build phases (spec section 12)
1. Foundation ✅  2. Birth input ✅  3. Engine ✅  4. Charts ✅  5. Gemini ✅  6. Forecast + polish ✅
