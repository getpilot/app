import { inngest } from "@/lib/inngest/client";

export async function enqueueBusinessKnowledgeSync(userId: string) {
  return inngest.send({
    name: "memory/knowledge.sync",
    data: { userId },
  });
}

export async function enqueueActiveThreadBackfill(userId: string) {
  return inngest.send({
    name: "memory/contact.backfill",
    data: { userId },
  });
}
