# Jyotish Astrology App — Technical Specification for Claude Code

Oct 31, 2026 · @Pavan

## 1. Overview

Build **Jyotish**, a mobile-first Vedic (Indian) astrology web app, as a Next.js project deployed on Vercel, using Google Gemini for plain-language readings. All astronomical maths is done in code; Gemini only explains results in simple words.

**How to use this doc (for Claude Code):** read this whole spec first, then open the attached HTML design files. The design is the visual source of truth for layout, colours, fonts and copy tone. This doc is the source of truth for logic, data and deployment. Where they conflict on behaviour, follow this doc; on looks, follow the design.

**Target users:** Indian adults, English first, with Hindi and Kannada planned. Readings must be simple, use one real-life example per point, and avoid fear-based language.

**In scope (v1):**

1. Birth details capture with geocoding and historical time zone resolution
2. Daily, weekly and monthly horoscope
3. Kundali (D1, D9, Moon chart) with a chart image, North and South Indian styles
4. Kundali Milan (Ashtakoota 36-guna matching) with Manglik check
5. Panchang for the user's current location
6. Vimshottari Dasha and current transits (Gochar), Sade Sati status
7. 5-year forecast, year by year, for career, finance, family, health and marriage

**Out of scope (v1):** payments, live astrologer chat, push notifications, native mobile apps. Buttons for these in the design (for example "Ask an astrologer") render as disabled placeholders.

## 2. Tech stack

Use Next.js (App Router, TypeScript) on Vercel, Supabase for auth and database, a pure-JS ephemeris for calculations, and the Gemini API through Google's Gen AI SDK.

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15+ (App Router), TypeScript strict | Server Actions and Route Handlers for the API |
| Styling | Tailwind CSS | Port colours, fonts and spacing from the attached design (see section 7) |
| Fonts | Philosopher (headings), Hind (body) via `next/font/google` | Hind covers Devanagari for Hindi |
| Auth + DB | Supabase (Postgres + Auth, phone OTP and Google sign-in) | Row Level Security on every table |
| ORM | Drizzle ORM | Migrations in `/drizzle` |
| Ephemeris | `astronomy-engine` (MIT, pure JS) | Runs on Vercel serverless with no native binaries |
| Date/time | Luxon + IANA tz database | Historical offsets (section 4) |
| Time zone from coordinates | `geo-tz` | Returns an IANA zone such as `Asia/Kolkata` |
| Geocoding | Google Maps Places Autocomplete + Geocoding API | Server-side key only |
| LLM | Gemini API via `@google/genai` | Key from [Google AI Studio](https://aistudio.google.com/apikey) |
| Chart image | Server-rendered SVG (React component), PNG/PDF export via `@vercel/og` / `@react-pdf/renderer` |  |
| Validation | Zod | Shared between client, server and Gemini output |
| Tests | Vitest + Playwright | Section 10 |
| Hosting | Vercel, connected to GitHub | Section 11 |

**Gemini model choice (as of 22 Oct 2026):** Google's [deprecations page](https://ai.google.dev/gemini-api/docs/deprecations) says new projects should use `gemini-3.8-flash` or `gemini-3.5-flash-lite`; 2.5 models are limited to existing users. Use `gemini-3.8-flash` for Kundali, matching and the 5-year forecast, and `gemini-3.5-flash-lite` for daily, weekly and monthly horoscopes. Keep both in env vars so they can be changed without code edits.

**Ephemeris licence note:** Swiss Ephemeris is more precise but is AGPL or paid-commercial. Do not add it unless the owner approves the licence. `astronomy-engine` is accurate to about one arc-minute, which is enough for signs, houses, nakshatras and dashas.

## 3. Architecture

The app splits into a deterministic astrology engine that computes every number and a Gemini layer that only turns those numbers into plain-language text.

&#91;embedded content: System architecture · request flow\]

A request flows top to bottom: the API checks the user, resolves birth time to UTC, runs the engine, sends only derived facts to Gemini, then stores the validated JSON in Supabase so repeat views cost nothing.

## 4. Birth input, geocoding and historical time zones

Every calculation starts from one exact UTC instant plus latitude and longitude; getting the time zone wrong shifts the Lagna, so this step must be exact.

**Fields (screen 1 of the design):**

| Field | Type | Rules |
| --- | --- | --- |
| Full name | text, 2–80 chars | Required |
| Gender | female / male / other | Required for Kundali Milan only |
| Date of birth | date | 1900-01-01 to today |
| Time of birth | HH:mm, 24h stored | Required; "I don't know my exact time" sets `timeKnown=false` |
| Place of birth | Places Autocomplete | Store place name, lat, lng, IANA zone |
| Reading language | en / hi / kn | Default en |

**Resolution steps (server-side):**

1. Geocode the place to lat/lng with the Google Geocoding API.
2. Find the IANA zone with `geo-tz` (for example `Asia/Kolkata`).
3. Build the local date-time with Luxon in that zone and convert to UTC. Luxon applies historical rules from the tz database, including India's +06:30 wartime offset (1942–45).
4. Apply an overrides table for known gaps in the tz database for India before 1955 (Bombay Time UTC+04:51, Calcutta Time UTC+05:53:20). Keep it in `lib/time/overrides.ts` with sources in comments, and ask the user to confirm when a birth falls before 1955.
5. Show the resolved lat, lng, zone and UTC offset back to the user before saving, exactly as in the design's "Auto-detected for accuracy" card. Let them edit the offset manually.

**Unknown birth time:** compute the chart at 12:00 local, hide Lagna, houses, D9 and the house-based parts of predictions, and show a banner: "Your birth time is missing, so readings use your Moon sign only." Moon sign, nakshatra and dasha stay available but carry an accuracy warning (the Moon moves about 13° a day).

**Example to use in tests:** 14 Aug 1995, 06:42, Jaipur (26.9124 N, 75.7873 E), `Asia/Kolkata`, UTC+05:30 → 14 Aug 1995 01:12 UTC.

## 5. Astrology calculation engine

All astrology numbers come from deterministic TypeScript in `lib/astro/`, never from Gemini. Each module is a pure function with unit tests.

**Conventions:** sidereal zodiac with Lahiri (Chitrapaksha) ayanamsa; whole-sign houses from the Lagna sign; mean lunar node for Rahu (Ketu = Rahu + 180°); planets Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu. Make ayanamsa and node type config values so they can change later.

| Module | Input | Output | Method |
| --- | --- | --- | --- |
| `positions.ts` | UTC instant | Tropical then sidereal longitude, speed, retrograde flag per planet | `astronomy-engine` geocentric ecliptic longitudes minus ayanamsa |
| `ayanamsa.ts` | UTC instant | Lahiri value in degrees | Standard Lahiri formula; test against published values |
| `ascendant.ts` | UTC, lat, lng | Lagna longitude | Local sidereal time + obliquity → ascendant formula, then sidereal |
| `houses.ts` | Lagna sign, planet longitudes | Sign per house, planets per house | Whole sign |
| `nakshatra.ts` | Longitude | Nakshatra (27 × 13°20′), pada (4 × 3°20′), lord | Table lookup |
| `divisional.ts` | Longitudes | D9 Navamsa chart (D1 and Moon chart too) | Standard Navamsa rule |
| `dasha.ts` | Moon longitude, birth UTC | Vimshottari Mahadasha + Antardasha tree, 120-year cycle | Balance from Moon's progress through its nakshatra |
| `transits.ts` | Today's UTC, natal Moon sign | Current sign of Saturn, Jupiter, Rahu, Ketu; house from Moon; Sade Sati status | Positions at "now" |
| `panchang.ts` | Date, user's current lat/lng/zone | Tithi, Nakshatra, Yoga, Karana, Vara, sunrise, sunset, Rahu Kaal | Sun–Moon elongation; `astronomy-engine` rise/set |
| `matching.ts` | Two Moon longitudes + both charts | Ashtakoota scores (Varna 1, Vashya 2, Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8; total 36), Bhakoot and Nadi dosha flags, Manglik check | Standard koota tables in `lib/astro/tables/` |
| `forecastFacts.ts` | Chart, dasha tree, transits for each year | Per-year facts list (section 6) | Combines the above for years N to N+4 |

**Rule:** every table (nakshatra lords, koota scores, Yoni pairs, Gana groups, planetary friendships) lives in typed constant files with a source comment. Do not invent table values; if a source is unclear, add a `TODO(verify)` and a failing test.

**Accuracy targets:** planet longitudes within 0.05° of a reference tool such as Jagannatha Hora or Drik Panchang; Lagna sign correct for the 20 golden test charts in section 10.

## 6. Gemini integration

Gemini turns computed facts into simple, example-led text and returns strict JSON; it never calculates positions and never sees anything it can contradict.

**Setup:** `npm i @google/genai`. One server-only wrapper, `lib/llm/gemini.ts`, reads `GEMINI_API_KEY`, `GEMINI_MODEL_DEEP` and `GEMINI_MODEL_FAST`. Never import it in client components. Use [structured output](https://ai.google.dev/gemini-api/docs/structured-output) (`responseMimeType: "application/json"` with a JSON schema derived from the Zod schema) and validate every response with Zod; on failure retry once, then show a friendly error.

**Pattern for every feature:**

1. Engine builds a `facts` object (for example `{ year: 2027, mahadasha: "Moon", antardasha: [{lord:"Rahu", to:"2027-07"}, {lord:"Jupiter", from:"2027-07"}], transitsFromMoon: {Saturn:5, Jupiter:9}, lagna:"Leo" }`).
2. Prompt = fixed system instruction + feature template + `facts` as JSON + output language.
3. Gemini returns JSON matching the feature schema.
4. Result is cached in Postgres keyed by `(profileId, feature, period, factsHash, promptVersion, language)`.

**System instruction (shared):**

```text
You are a kind, practical Vedic astrologer writing for everyday Indian readers.
Use ONLY the facts in the JSON provided. Never invent planet positions, dates or scores.
Write in simple words a 15-year-old understands. Sentences under 20 words.
For every point, give one concrete real-life example (job, money, family, wedding, health habit).
Be encouraging and balanced. Never predict death, accidents, serious illness, divorce or financial ruin.
Never give medical, legal or investment advice; suggest a professional instead.
No fear-based remedies, no requests for payment, no gemstone selling.
Reply in {language}. Return JSON only, matching the schema.
```

**Output schemas (Zod, in `lib/llm/schemas.ts`):**

| Feature | Model | Schema (main fields) | Cache period |
| --- | --- | --- | --- |
| Daily / weekly / monthly horoscope | FAST | `title`, `body`, `example`, `luckyColour`, `luckyNumber`, `goodTime` | Day / ISO week / month, per Moon sign + Lagna |
| Kundali explanation | DEEP | `lagna`, `moon`, `highlights[]` each `{title, meaning, example}` | Until birth data changes |
| Kundali Milan summary | DEEP | `verdict`, `summary`, `kootaNotes[]`, `doshaNotes[]` with `{name, meaning, example, tip}` | Per pair |
| Dasha & transits | DEEP | `currentPeriod {summary, example}`, `transits[] {planet, houseFromMoon, meaning}` | Per antardasha change / month |
| 5-year forecast | DEEP | `years[]` (5) each `{year, headline, why, areas: {career, finance, family, health, marriage}}`, each area `{rating 1-5, label, summary, example, tip}` | Per year, regenerated on 1 Jan |

**5-year forecast rules:** send one request per year so each stays focused. Each year's `facts` must include its dasha periods, major transits relative to Moon and Lagna, and which houses they touch for each life area (career 10th, finance 2nd and 11th, family 4th, health 6th and Lagna, marriage 7th). The `why` field must name the planets and periods behind the reading in plain words. Health text always ends with: "Astrology is not medical advice. See a doctor for any symptoms."

**Cost and safety:** enable Gemini [safety settings](https://ai.google.dev/gemini-api/docs/safety-settings) at defaults; rate-limit LLM routes per user (for example 30 calls an hour) with Upstash Redis; log token usage per call; never send name, exact birth time or place to Gemini, only derived facts.

## 7. Screens mapped to the attached design

Rebuild the six attached HTML screens as React components; treat them as visual reference, not code to copy. The mockup files use a canvas format (`<x-dc>`, `{{accent}}` holes, `support.js`) that must not ship.

**Design tokens (put in `tailwind.config.ts`):**

| Token | Value | Use |
| --- | --- | --- |
| `bg` | #14112B | Page background |
| `surface` | #221E42 | Cards, inputs |
| `border` | #3A3466 | Card and input borders |
| `nav` | #1B1838 | Bottom navigation |
| `text` | #F4F1FF | Main text |
| `muted` | #B8B3D6 | Labels, secondary text |
| `accent` | #F5A524 | Primary buttons, active tab, highlights |
| `accent-ink` | #1A1405 | Text on accent |
| `warm-surface` / `warm-border` / `warm-text` | #2A2410 / #5C4A1A / #FFD58A | Notes, "why it matters", current dasha |
| `chart-paper` / `chart-ink` | #F6EEDC / #5B3A12 | Kundali chart card |
| Radius | 12px inputs, 14–18px cards |  |
| Fonts | Philosopher 700 headings, Hind 400/600 body |  |

**Screens and routes:**

| Design file | Route | Data source | Notes |
| --- | --- | --- | --- |
| `Main.dc.html` (Birth details) | `/onboarding` | Section 4 | Show resolved lat/lng/zone card before save; language chips |
| `Home.dc.html` | `/` | Horoscope API + `panchang.ts` | Today / This week / This month tabs; Panchang uses device location (ask permission, fall back to birth place) |
| `Kundali.dc.html` | `/kundali` | Engine + Kundali explanation | D1 / D9 / Moon tabs; North / South chart toggle; Download PDF; WhatsApp share via `https://wa.me/?text=` with a share link |
| `Match.dc.html` | `/match` | `matching.ts` + summary | Add partner via the same birth form; score ring out of 36; 8 koota bars; dosha card; Manglik row |
| `Dasha.dc.html` | `/dasha` | `dasha.ts`, `transits.ts` | Current period card with progress bar; timeline; Gochar list; Sade Sati status |
| `Forecast.dc.html` | `/forecast` | 5-year forecast | Year chips for 5 calendar years starting with the current year; 5 area cards; "other years at a glance" |

**Chart image:** build `components/chart/NorthIndianChart.tsx` and `SouthIndianChart.tsx` as SVG from the engine output. North style: house 1 at top centre, houses run anticlockwise, sign numbers in each house. South style: fixed sign grid with Lagna marked. The same SVG feeds the PDF.

**UX rules:** mobile-first at 390px, works up to desktop with a centred 480px column; touch targets at least 44px; real `<button>`, `<a>`, `<label>` elements; text contrast at least 4.5:1; no emoji icons (use `lucide-react`); loading skeletons while Gemini responds; every screen showing predictions has a small footer: "For guidance and entertainment. Not a substitute for professional advice."

## 8. Data model and API routes

Five tables hold everything; birth data is the only personal data and is protected by Row Level Security.

| Table | Key columns |
| --- | --- |
| `profiles` | `id`, `user_id` (auth), `full_name`, `gender`, `birth_local` (text), `birth_utc` (timestamptz), `time_known` (bool), `place_name`, `lat`, `lng`, `tz_iana`, `utc_offset_minutes`, `tz_confirmed` (bool), `language`, `is_primary` (bool), `created_at` |
| `charts` | `profile_id`, `engine_version`, `ayanamsa`, `data` (jsonb: positions, houses, nakshatras, D9, dasha tree), `computed_at` |
| `matches` | `id`, `user_id`, `profile_a`, `profile_b`, `scores` (jsonb), `doshas` (jsonb), `total` |
| `readings` | `id`, `profile_id` or `match_id`, `feature`, `period_key`, `language`, `facts_hash`, `prompt_version`, `model`, `content` (jsonb), `tokens_in`, `tokens_out`, `created_at`; unique on the cache key |
| `usage_events` | `user_id`, `route`, `created_at` (for rate limits and analytics) |

A user can save several profiles (self, partner, family). Recompute `charts` when birth data or `engine_version` changes.

**API routes (Route Handlers under `app/api/`):**

| Method + path | Does |
| --- | --- |
| `POST /api/places/resolve` | Place text or place ID → lat, lng, IANA zone, offset at the birth date |
| `POST /api/profiles` / `PATCH /api/profiles/:id` | Create or edit a profile; triggers chart compute |
| `GET /api/chart/:profileId` | Computed chart JSON |
| \`GET /api/chart/:profileId/svg?style=north | south&div=D1 |
| `GET /api/chart/:profileId/pdf` | Kundali PDF |
| \`GET /api/horoscope?profileId&period=day | week |
| `GET /api/panchang?lat&lng&date` | Panchang (no LLM) |
| `GET /api/dasha/:profileId` | Dasha tree, transits, Sade Sati + Gemini summary |
| `POST /api/match` | Two profile IDs → scores, doshas, Gemini summary |
| `GET /api/forecast/:profileId?year=` | One year of the 5-year forecast |

All routes check the Supabase session and that the profile belongs to the user; all inputs are validated with Zod.

## 9. Project structure, environment variables and security

Keep astrology maths, LLM code and UI in separate folders so each can be tested on its own.

```text
/app
  /(app)/page.tsx            Home
  /(app)/kundali/page.tsx
  /(app)/match/page.tsx
  /(app)/dasha/page.tsx
  /(app)/forecast/page.tsx
  /onboarding/page.tsx
  /api/...                   Route handlers (section 8)
/components                  UI, chart SVGs, bottom nav
/lib/astro                   Engine (section 5) + /tables
/lib/time                    Time zone resolution + overrides
/lib/llm                     gemini.ts, prompts/, schemas.ts
/lib/db                      Drizzle schema + queries
/drizzle                     Migrations
/tests/golden                Reference charts (JSON)
/design                      The attached HTML mockups, for reference only
.env.example
CLAUDE.md                    Short summary of this spec for future sessions
```

**Environment variables** (add to `.env.local` for development and to Vercel → Project → Settings → Environment Variables for Preview and Production; commit only `.env.example` with empty values):

| Variable | Where used | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL_DEEP` | Server | Default `gemini-3.8-flash` |
| `GEMINI_MODEL_FAST` | Server | Default `gemini-3.5-flash-lite` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |  |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never exposed to the browser |
| `DATABASE_URL` | Server | Supabase pooled connection string for Drizzle |
| `GOOGLE_MAPS_API_KEY` | Server | Restrict to Geocoding + Places APIs |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Server | Rate limiting |

**Security and privacy:**

- Birth date, time and place are personal data under India's DPDP Act 2023: collect consent on onboarding, provide "Delete my data" in Profile, and do not share with third parties.
- Never send names or raw birth details to Gemini; send derived facts only.
- Secrets only in env vars; add `.env*` (except `.env.example`) to `.gitignore` before the first commit.
- RLS: a user reads and writes only their own `profiles`, `charts`, `matches`, `readings`.
- Add security headers in `next.config.ts` and validate every input with Zod.

## 10. Testing and accuracy validation

The engine is only trusted once it matches a reference tool on a fixed set of golden charts; CI must run these on every push.

- **Golden charts:** 20 birth records in `/tests/golden/*.json`, each with expected Lagna sign, every planet's sidereal sign and degree, Moon nakshatra and pada, and the Mahadasha/Antardasha at a given date, taken from Jagannatha Hora or Drik Panchang with Lahiri ayanamsa. Include births before 1955 (Mumbai, Kolkata), during 1942–45, near midnight, near a sign change of the Lagna, and outside India (London, Dubai, New York with DST). The owner supplies or approves the expected values; Claude Code must not make them up.
- **Unit tests (Vitest):** every `lib/astro` and `lib/time` function; koota tables (total always 0–36); dasha periods sum to 120 years.
- **LLM tests:** mock Gemini in unit tests; one live smoke test per feature behind `RUN_LLM_TESTS=1`; assert Zod validity, target language, no banned phrases (death, accident, divorce, "guaranteed").
- **E2E (Playwright):** onboarding → home → each tab at 390px and 1280px widths.
- **Accessibility:** `@axe-core/playwright` with zero serious violations.
- **CI:** GitHub Actions running `lint`, `typecheck`, `test`, `build` on every push and pull request.

## 11. GitHub push and Vercel deployment

All code goes into the GitHub repository already open in this Claude Code session; that repository is then imported into a new Vercel project, and every later push to `main` redeploys automatically.

**Instructions for Claude Code — Git:**

1. Work inside the current repository. Run `git remote -v` and confirm `origin` points to GitHub; if it does not, stop and ask the owner for the repo URL. Do not create a new repository.
2. Before the first commit, add `.gitignore` covering `node_modules`, `.next`, `.vercel`, `.env*` (but keep `.env.example`).
3. Commit in small, working steps that match the phases in section 12, with clear messages (for example `feat(astro): add vimshottari dasha with tests`).
4. Run `npm run lint && npm run typecheck && npm test && npm run build` before each push. Do not push a failing build.
5. Push to `main` with `git push origin main` (use a feature branch and open a pull request instead if the owner asks or `main` is protected).
6. Never commit API keys or `.env.local`. If a secret is committed by mistake, stop, tell the owner, and ask them to rotate the key.

**Instructions for the owner — Vercel (one time):**

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick this GitHub repo (allow Vercel's GitHub app access if asked).
2. Framework preset: **Next.js**. Root directory: `/`. Build command `npm run build`, output default.
3. Add every variable from section 9 under **Environment Variables** for Production and Preview.
4. Click **Deploy**. After this, every push to `main` deploys to production, and every pull request gets a Preview URL.
5. In Supabase → Authentication → URL Configuration, add the Vercel production URL and `https://*.vercel.app` as redirect URLs.
6. In Google Cloud Console, restrict the Maps key to the Vercel domain.

**Optional (Claude Code with the Vercel CLI):** if the owner has run `vercel login`, Claude Code may run `npx vercel link` to create and link the new project, `npx vercel env add <NAME> production` for each variable (the owner types the values), then `npx vercel --prod`. Otherwise leave Vercel setup to the owner.

**Done when:** the production URL loads the onboarding screen, a test profile saves, and the Kundali for the section 4 example matches the golden reference values.

## 12. Build phases and acceptance checklist

Build in six phases, pushing to GitHub at the end of each so Vercel shows a working preview every step.

1. **Foundation:** Next.js + TypeScript + Tailwind tokens + fonts, Supabase auth, Drizzle schema and migrations, bottom navigation, `.env.example`, CI, `CLAUDE.md`. First Vercel deploy.
2. **Birth input:** onboarding screen, Places autocomplete, `/api/places/resolve`, time zone overrides, profile save, unknown-time handling.
3. **Engine:** positions, ayanamsa, Lagna, houses, nakshatras, D9, dasha, transits, panchang, matching; golden tests passing.
4. **Charts:** North and South SVG charts, Kundali screen, PDF export, WhatsApp share.
5. **Gemini:** wrapper, prompts, schemas, caching, rate limits; horoscope, Kundali explanation, matching summary, dasha summary.
6. **5-year forecast + polish:** forecast screen, Hindi and Kannada, loading states, accessibility pass, privacy consent and delete-my-data.

**Acceptance checklist:**

- [ ] All six screens match the attached design at 390px width
- [ ] Golden chart tests pass (Lagna sign, planet signs, nakshatra, dasha)
- [ ] Birth before 1955 and during 1942–45 resolve to the correct UTC offset
- [ ] Unknown birth time hides house-based content and shows the banner
- [ ] Kundali Milan total equals the sum of the 8 kootas and stays within 0–36
- [ ] 5-year forecast shows 5 years, 5 areas each, every area with an example
- [ ] Every Gemini response validates against its Zod schema and is cached
- [ ] No API keys in the repo; all secrets set in Vercel
- [ ] Lint, typecheck, tests and build pass in CI
- [ ] Production URL on Vercel works end to end

**Open questions for the owner:**

- [ ] App name: keep "Jyotish" or choose another?
- [ ] Sign-in: phone OTP, Google, or both?
- [ ] Who provides the golden reference charts?
- [ ] Free vs paid features for later versions?
