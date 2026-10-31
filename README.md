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
   `drizzle/0000_init.sql` into the Supabase SQL editor.
3. Authentication → Providers → **Google**: enable it and add the Google OAuth
   client ID and secret.
4. Authentication → URL Configuration: add `http://localhost:3000/**`, your
   Vercel production URL and `https://*.vercel.app/**` as redirect URLs.

### Vercel
Import this GitHub repo at vercel.com/new (preset: Next.js), set every variable
from `.env.example` for Production and Preview, and set `main` as the
production branch.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
