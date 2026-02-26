ALTER TABLE "user" ADD COLUMN "use_case" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "other_use_case" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "leads_per_month" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_platforms" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "other_platform" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "other_business_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pilot_goal" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_tracking" text[];--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "other_tracking" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_complete" boolean DEFAULT false;