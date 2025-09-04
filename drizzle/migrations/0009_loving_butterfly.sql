CREATE TABLE "sidekick_action_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"thread_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"action" text NOT NULL,
	"text" text NOT NULL,
	"confidence" double precision NOT NULL,
	"result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"message_id" text
);
--> statement-breakpoint
CREATE TABLE "sidekick_setting" (
	"user_id" text PRIMARY KEY NOT NULL,
	"confidence_threshold" double precision DEFAULT 0.8 NOT NULL,
	"system_prompt" text DEFAULT 'You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries.' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sidekick_action_log" ADD CONSTRAINT "sidekick_action_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidekick_setting" ADD CONSTRAINT "sidekick_setting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;