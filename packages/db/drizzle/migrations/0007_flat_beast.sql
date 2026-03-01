ALTER TABLE "instagram_integration" ADD COLUMN "sync_interval_hours" integer DEFAULT 24;--> statement-breakpoint
ALTER TABLE "instagram_integration" ADD COLUMN "last_synced_at" timestamp;