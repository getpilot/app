import { automation, automationActionLog } from "@pilot/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";

export type AutomationRecord = typeof automation.$inferSelect;

export async function getActiveAutomations(
  dbClient: any,
  userId: string,
): Promise<AutomationRecord[]> {
  return dbClient
    .select()
    .from(automation)
    .where(
      and(
        eq(automation.userId, userId),
        eq(automation.isActive, true),
        or(isNull(automation.expiresAt), gt(automation.expiresAt, new Date())),
      ),
    );
}

export async function checkTriggerMatch(params: {
  dbClient: any;
  messageText: string;
  userId: string;
  scope?: "dm" | "comment";
}): Promise<AutomationRecord | null> {
  const { dbClient, messageText, userId, scope = "dm" } = params;
  const activeAutomations = await getActiveAutomations(dbClient, userId);
  const lowerMessage = messageText.toLowerCase();

  for (const automationRecord of activeAutomations) {
    const trigger = automationRecord.triggerWord?.toLowerCase?.() ?? "";
    if (!trigger) {
      continue;
    }

    const triggerScope = automationRecord.triggerScope || "dm";
    const scopeMatches =
      triggerScope === "both" ||
      triggerScope === scope ||
      (scope === "dm" && !triggerScope);

    if (scopeMatches && lowerMessage.includes(trigger)) {
      return automationRecord;
    }
  }

  return null;
}

export async function logAutomationUsage(
  dbClient: any,
  params: {
    userId: string;
    platform: "instagram";
    threadId: string;
    recipientId: string;
    automationId: string;
    triggerWord: string;
    action:
      | "dm_automation_triggered"
      | "comment_automation_triggered"
      | "dm_and_comment_automation_triggered";
    text?: string;
    messageId?: string;
  },
): Promise<void> {
  await dbClient.insert(automationActionLog).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    platform: params.platform,
    threadId: params.threadId,
    recipientId: params.recipientId,
    automationId: params.automationId,
    triggerWord: params.triggerWord,
    action: params.action,
    text: params.text ?? null,
    messageId: params.messageId,
    createdAt: new Date(),
  });
}
