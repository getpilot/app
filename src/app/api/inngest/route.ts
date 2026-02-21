import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  syncInstagramContacts,
  scheduleContactsSync,
  refreshInstagramTokens,
} from "@/lib/inngest/functions";
import { retryFailedInstagramSend } from "@/lib/inngest/retry-failed-send";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncInstagramContacts,
    scheduleContactsSync,
    refreshInstagramTokens,
    retryFailedInstagramSend,
  ],
});