import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

/**
 * Data model from spec section 8.
 *
 * Access model:
 * - The app server talks to Postgres through Drizzle (DATABASE_URL). That role
 *   bypasses RLS, so every query in lib/db must filter by the signed-in user.
 * - RLS below is the second line of defence for anything that uses the
 *   Supabase client with a user's JWT.
 */

export const genderEnum = pgEnum("gender", ["female", "male", "other"]);
export const languageEnum = pgEnum("language", ["en", "hi", "kn"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    gender: genderEnum("gender"),
    /** Local wall-clock birth time as entered, ISO "YYYY-MM-DDTHH:mm". */
    birthLocal: text("birth_local").notNull(),
    birthUtc: timestamp("birth_utc", { withTimezone: true }).notNull(),
    timeKnown: boolean("time_known").notNull().default(true),
    placeName: text("place_name").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    tzIana: text("tz_iana").notNull(),
    /**
     * Seconds, not minutes: Calcutta Time is UTC+05:53:20, which is not a
     * whole number of minutes (spec section 4 / owner decision on pre-1956 births).
     */
    utcOffsetSeconds: integer("utc_offset_seconds").notNull(),
    tzConfirmed: boolean("tz_confirmed").notNull().default(false),
    language: languageEnum("language").notNull().default("en"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("profiles_user_id_idx").on(t.userId),
    uniqueIndex("profiles_one_primary_per_user").on(t.userId).where(sql`${t.isPrimary}`),
    check("profiles_full_name_len", sql`char_length(${t.fullName}) between 2 and 80`),
    check("profiles_lat_range", sql`${t.lat} between -90 and 90`),
    check("profiles_lng_range", sql`${t.lng} between -180 and 180`),
    check("profiles_offset_range", sql`${t.utcOffsetSeconds} between -50400 and 50400`),
    pgPolicy("profiles_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const charts = pgTable(
  "charts",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    engineVersion: text("engine_version").notNull(),
    ayanamsa: text("ayanamsa").notNull(),
    /** positions, houses, nakshatras, D9, dasha tree */
    data: jsonb("data").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("charts_owner_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (select 1 from profiles p where p.id = ${t.profileId} and p.user_id = ${authUid})`,
    }),
  ],
).enableRLS();

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    profileA: uuid("profile_a")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    profileB: uuid("profile_b")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    scores: jsonb("scores").notNull(),
    doshas: jsonb("doshas").notNull(),
    /** Some koota tables award half points, so this is numeric(3,1), 0–36. */
    total: numeric("total", { precision: 3, scale: 1 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("matches_user_id_idx").on(t.userId),
    check("matches_total_range", sql`${t.total} between 0 and 36`),
    check("matches_distinct_profiles", sql`${t.profileA} <> ${t.profileB}`),
    pgPolicy("matches_owner_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }),
    /**
     * Cache subject: "profile:<uuid>", "match:<uuid>", or a shared key such as
     * "sign:moon=9;lagna=5" for horoscopes that depend only on Moon sign + Lagna.
     */
    subjectKey: text("subject_key").notNull(),
    feature: text("feature").notNull(),
    periodKey: text("period_key").notNull(),
    language: languageEnum("language").notNull(),
    factsHash: text("facts_hash").notNull(),
    promptVersion: text("prompt_version").notNull(),
    model: text("model").notNull(),
    content: jsonb("content").notNull(),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("readings_cache_key").on(
      t.subjectKey,
      t.feature,
      t.periodKey,
      t.factsHash,
      t.promptVersion,
      t.language,
    ),
    check("readings_single_owner", sql`not (${t.profileId} is not null and ${t.matchId} is not null)`),
    pgPolicy("readings_owner_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`(${t.profileId} is null and ${t.matchId} is null)
        or exists (select 1 from profiles p where p.id = ${t.profileId} and p.user_id = ${authUid})
        or exists (select 1 from matches m where m.id = ${t.matchId} and m.user_id = ${authUid})`,
    }),
  ],
).enableRLS();

export const usageEvents = pgTable(
  "usage_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    route: text("route").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_events_user_route_time_idx").on(t.userId, t.route, t.createdAt)],
  // RLS on with no policies: only the server (Drizzle) can read or write.
).enableRLS();

/**
 * App-wide request slots for external APIs with strict rate limits
 * (Nominatim: 1 request/second). Server-only; RLS on with no policies.
 */
export const externalThrottle = pgTable("external_throttle", {
  name: text("name").primaryKey(),
  nextSlot: timestamp("next_slot", { withTimezone: true }).notNull(),
}).enableRLS();

/** Cached geocoder responses (Nominatim's policy requires caching). Server-only. */
export const geocodeCache = pgTable(
  "geocode_cache",
  {
    key: text("key").primaryKey(),
    results: jsonb("results").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("geocode_cache_created_at_idx").on(t.createdAt)],
).enableRLS();

/**
 * Privacy consent (India DPDP Act 2023, spec section 9): one row per user,
 * recorded at onboarding. Deleted with the user.
 */
export const consents = pgTable(
  "consents",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pgPolicy("consents_owner_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
  ],
).enableRLS();
