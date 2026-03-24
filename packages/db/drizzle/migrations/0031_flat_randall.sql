DROP POLICY "user_sidekick_settings_policy" ON "sidekick_setting" CASCADE;--> statement-breakpoint
DROP TABLE "sidekick_setting" CASCADE;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "memory_seeded_at" timestamp;