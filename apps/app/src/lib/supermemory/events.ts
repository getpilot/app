import { inngest } from "@/lib/inngest/client";

export async function enqueueBusinessKnowledgeSync(
  userId: string,
  source = "unknown source",
) {
  await inngest
    .send({
      name: "memory/knowledge.sync",
      data: { userId },
    })
    .catch((error) => {
      console.error(
        `Failed to enqueue business knowledge sync after ${source}:`,
        error,
      );
    });
}

export async function enqueueActiveThreadBackfill(
  userId: string,
  source = "unknown source",
) {
  await inngest
    .send({
      name: "memory/contact.backfill",
      data: { userId },
    })
    .catch((error) => {
      console.error(
        `Failed to enqueue contact memory backfill after ${source}:`,
        error,
      );
    });
}
