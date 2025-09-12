CREATE TABLE "automation_post" (
	"id" text PRIMARY KEY NOT NULL,
	"automation_id" text NOT NULL,
	"post_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "automation" ADD COLUMN "trigger_scope" text DEFAULT 'dm';--> statement-breakpoint
ALTER TABLE "automation" ADD COLUMN "comment_reply_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "automation_post" ADD CONSTRAINT "automation_post_automation_id_automation_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automation"("id") ON DELETE cascade ON UPDATE no action;