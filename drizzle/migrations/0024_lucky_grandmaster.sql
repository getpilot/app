ALTER TABLE "contact" ADD COLUMN "requires_human_response" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "human_response_set_at" timestamp;