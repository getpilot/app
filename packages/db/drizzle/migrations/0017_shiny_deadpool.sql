ALTER TABLE "automation_log" RENAME TO "automation_action_log";--> statement-breakpoint
ALTER TABLE "automation_action_log" DROP CONSTRAINT "automation_log_automation_id_automation_id_fk";
--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "platform" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "thread_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "recipient_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "action" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "text" text;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD CONSTRAINT "automation_action_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_action_log" ADD CONSTRAINT "automation_action_log_automation_id_automation_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_action_log" DROP COLUMN "response_sent";--> statement-breakpoint
ALTER TABLE "automation_action_log" DROP COLUMN "delivery_status";