CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'other');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'hi', 'kn');--> statement-breakpoint
CREATE TABLE "charts" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"engine_version" text NOT NULL,
	"ayanamsa" text NOT NULL,
	"data" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "charts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_a" uuid NOT NULL,
	"profile_b" uuid NOT NULL,
	"scores" jsonb NOT NULL,
	"doshas" jsonb NOT NULL,
	"total" numeric(3, 1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_total_range" CHECK ("matches"."total" between 0 and 36),
	CONSTRAINT "matches_distinct_profiles" CHECK ("matches"."profile_a" <> "matches"."profile_b")
);
--> statement-breakpoint
ALTER TABLE "matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"gender" "gender",
	"birth_local" text NOT NULL,
	"birth_utc" timestamp with time zone NOT NULL,
	"time_known" boolean DEFAULT true NOT NULL,
	"place_name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"tz_iana" text NOT NULL,
	"utc_offset_seconds" integer NOT NULL,
	"tz_confirmed" boolean DEFAULT false NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_full_name_len" CHECK (char_length("profiles"."full_name") between 2 and 80),
	CONSTRAINT "profiles_lat_range" CHECK ("profiles"."lat" between -90 and 90),
	CONSTRAINT "profiles_lng_range" CHECK ("profiles"."lng" between -180 and 180),
	CONSTRAINT "profiles_offset_range" CHECK ("profiles"."utc_offset_seconds" between -50400 and 50400)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"match_id" uuid,
	"subject_key" text NOT NULL,
	"feature" text NOT NULL,
	"period_key" text NOT NULL,
	"language" "language" NOT NULL,
	"facts_hash" text NOT NULL,
	"prompt_version" text NOT NULL,
	"model" text NOT NULL,
	"content" jsonb NOT NULL,
	"tokens_in" integer,
	"tokens_out" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "readings_cache_key" UNIQUE("subject_key","feature","period_key","facts_hash","prompt_version","language"),
	CONSTRAINT "readings_single_owner" CHECK (not ("readings"."profile_id" is not null and "readings"."match_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "readings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"route" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "charts" ADD CONSTRAINT "charts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_a_profiles_id_fk" FOREIGN KEY ("profile_a") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_b_profiles_id_fk" FOREIGN KEY ("profile_b") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_user_id_idx" ON "matches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_one_primary_per_user" ON "profiles" USING btree ("user_id") WHERE "profiles"."is_primary";--> statement-breakpoint
CREATE INDEX "usage_events_user_route_time_idx" ON "usage_events" USING btree ("user_id","route","created_at");--> statement-breakpoint
CREATE POLICY "charts_owner_select" ON "charts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from profiles p where p.id = "charts"."profile_id" and p.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "matches_owner_select" ON "matches" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("matches"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_owner_all" ON "profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ("profiles"."user_id" = (select auth.uid())) WITH CHECK ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "readings_owner_select" ON "readings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (("readings"."profile_id" is null and "readings"."match_id" is null)
        or exists (select 1 from profiles p where p.id = "readings"."profile_id" and p.user_id = (select auth.uid()))
        or exists (select 1 from matches m where m.id = "readings"."match_id" and m.user_id = (select auth.uid())));