CREATE TABLE "contact" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text,
	"last_message_at" timestamp,
	"stage" text DEFAULT 'new',
	"sentiment" text DEFAULT 'neutral',
	"lead_score" integer,
	"next_action" text,
	"lead_value" integer,
	"trigger_matched" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_tag" (
	"contact_id" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tag" ADD CONSTRAINT "contact_tag_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;