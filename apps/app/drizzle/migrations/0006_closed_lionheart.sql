ALTER TABLE "contact" DROP CONSTRAINT "contact_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_tag" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;