import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  syncInstagramContacts,
  scheduleContactsSync,
  refreshInstagramTokens,
  syncBusinessKnowledge,
  backfillActiveContactMemory,
} from "@/lib/inngest/functions";
import { retryFailedInstagramSend } from "@/lib/inngest/retry-failed-send";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncInstagramContacts,
    scheduleContactsSync,
    refreshInstagramTokens,
    syncBusinessKnowledge,
    backfillActiveContactMemory,
    retryFailedInstagramSend,
  ],
});
