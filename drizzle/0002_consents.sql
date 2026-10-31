CREATE TABLE "consents" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "consents_owner_select" ON "consents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("consents"."user_id" = (select auth.uid()));