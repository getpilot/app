CREATE ROLE "admin_role";--> statement-breakpoint
CREATE ROLE "user_role";--> statement-breakpoint
ALTER TABLE "automation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "automation_action_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "automation_post" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_message" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_tag" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "instagram_integration" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sidekick_action_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sidekick_setting" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_faq" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_offer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_offer_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_tone_profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "user_automations_policy" ON "automation" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_automation_action_logs_policy" ON "automation_action_log" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_automation_posts_policy" ON "automation_post" AS PERMISSIVE FOR ALL TO "authenticated" USING (automation_id IN (
      SELECT id FROM automation WHERE user_id = auth.uid()
    )) WITH CHECK (automation_id IN (
      SELECT id FROM automation WHERE user_id = auth.uid()
    ));--> statement-breakpoint
CREATE POLICY "user_chat_messages_policy" ON "chat_message" AS PERMISSIVE FOR ALL TO "authenticated" USING (session_id IN (
      SELECT id FROM chat_session WHERE user_id = auth.uid()
    )) WITH CHECK (session_id IN (
      SELECT id FROM chat_session WHERE user_id = auth.uid()
    ));--> statement-breakpoint
CREATE POLICY "user_chat_sessions_policy" ON "chat_session" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_contacts_policy" ON "contact" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "service_contacts_policy" ON "contact" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "user_contact_tags_policy" ON "contact_tag" AS PERMISSIVE FOR ALL TO "authenticated" USING (contact_id IN (
      SELECT id FROM contact WHERE user_id = auth.uid()
    )) WITH CHECK (contact_id IN (
      SELECT id FROM contact WHERE user_id = auth.uid()
    ));--> statement-breakpoint
CREATE POLICY "user_instagram_integration_policy" ON "instagram_integration" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_sidekick_action_logs_policy" ON "sidekick_action_log" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_sidekick_settings_policy" ON "sidekick_setting" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_faq_policy" ON "user_faq" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_offers_policy" ON "user_offer" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_offer_links_policy" ON "user_offer_link" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "user_tone_profile_policy" ON "user_tone_profile" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());