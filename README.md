# Jyotish

Simple, mobile-first Vedic astrology: Kundali, Kundali Milan, Panchang, dasha,
transits and a 5-year forecast. Built with Next.js, Supabase and Gemini.

- Spec: [`docs/spec.md`](docs/spec.md)
- Design mockups: [`design/`](design/)
- Notes for AI coding sessions: [`CLAUDE.md`](CLAUDE.md)

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The app builds and renders without keys; sign-in and data features need the
Supabase variables.

## One-time setup

### Supabase
1. Create a project. Copy the URL and anon key into `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the service role key into
   `SUPABASE_SERVICE_ROLE_KEY`, and the **transaction pooler** connection string
   into `DATABASE_URL`.
2. Apply the schema: `npm run db:migrate` (with `DATABASE_URL` set), or paste
   each file in `drizzle/` (in order) into the Supabase SQL editor.
3. Authentication → Providers → **Google**: enable it and add the Google OAuth
   client ID and secret.
4. Authentication → URL Configuration: add `http://localhost:3000/**`, your
   Vercel production URL and `https://*.vercel.app/**` as redirect URLs.

### Vercel
Import this GitHub repo at vercel.com/new (preset: Next.js), set every variable
from `.env.example` for Production and Preview, and set `main` as the
production branch.

### Place data (GeoNames)
Type-ahead uses `data/places.json`, built from GeoNames `cities500` (CC BY 4.0):
every populated place in India plus world cities with population ≥ 100,000.

```bash
npm run data:places                 # downloads from download.geonames.org
npm run data:places -- --dir ./dl   # or use cities500.zip + admin1CodesASCII.txt you downloaded
```

Commit the generated `data/places.json`. Without it, type-ahead is off and only
the "Search" button (Nominatim) works.

### Nominatim
Set `NOMINATIM_USER_AGENT` to something that identifies the app and a contact,
e.g. `Jyotish/1.0 (you@example.com)`. The app sends at most 1 request per second
in total (shared through Postgres) and caches results for 30 days.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

API/database integration tests run when `TEST_DATABASE_URL` points at a
throwaway Postgres (the database is wiped). CI provides one.

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/jyotish_test npm test
```
