import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { syncInstagramContacts, scheduleContactsSync } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncInstagramContacts, scheduleContactsSync],
});