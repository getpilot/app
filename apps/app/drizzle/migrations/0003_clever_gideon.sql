CREATE TABLE "instagram_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"instagram_user_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "instagram_integration" ADD CONSTRAINT "instagram_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;