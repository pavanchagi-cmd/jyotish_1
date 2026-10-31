CREATE TABLE "external_throttle" (
	"name" text PRIMARY KEY NOT NULL,
	"next_slot" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_throttle" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "geocode_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"results" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "geocode_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "geocode_cache_created_at_idx" ON "geocode_cache" USING btree ("created_at");