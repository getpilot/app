import { generateId } from "ai";
import { UIMessage } from "ai";
import { db } from "@/lib/db";
import { chatSession, chatMessage } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export async function createChatSession(
  title: string = "New Chat"
): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const id = generateId();

  await db.insert(chatSession).values({
    id,
    userId: session.user.id,
    title,
  });

  return id;
}

export async function loadChatSession(id: string): Promise<UIMessage[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // verify session belongs to user
  const chatSessionData = await db
    .select()
    .from(chatSession)
    .where(eq(chatSession.id, id))
    .limit(1);

  if (
    chatSessionData.length === 0 ||
    chatSessionData[0].userId !== session.user.id
  ) {
    throw new Error("Chat session not found");
  }

  // load messages
  const messages = await db
    .select()
    .from(chatMessage)
    .where(eq(chatMessage.sessionId, id))
    .orderBy(chatMessage.createdAt);

  // convert to UIMessage format with role validation
  return messages.map((msg) => {
    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new Error(
        `Invalid message role: ${msg.role}. Expected 'user' or 'assistant'.`
      );
    }

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts: [
        {
          type: "text" as const,
          text: msg.content,
        },
      ],
    };
  });
}

export async function saveChatSession({
  sessionId,
  messages,
}: {
  sessionId: string;
  messages: UIMessage[];
}): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // verify session belongs to user
  const chatSessionData = await db
    .select()
    .from(chatSession)
    .where(eq(chatSession.id, sessionId))
    .limit(1);

  if (
    chatSessionData.length === 0 ||
    chatSessionData[0].userId !== session.user.id
  ) {
    throw new Error("Chat session not found");
  }

  // use transaction to ensure atomicity of delete and insert operations
  await db.transaction(async (tx) => {
    // delete existing messages
    await tx.delete(chatMessage).where(eq(chatMessage.sessionId, sessionId));

    // insert new messages
    if (messages.length > 0) {
      const messageData = messages.map((msg) => {
        const messageId = msg.id || generateId();
        console.log(
          `Saving message - Role: ${msg.role}, ID: ${messageId}, Original ID: ${msg.id}`
        );
        return {
          id: messageId,
          sessionId,
          role: msg.role as "user" | "assistant",
          content: msg.parts
            .filter((part) => part.type === "text")
            .map((part) => (part as { text: string }).text)
            .join(""),
        };
      });

      await tx.insert(chatMessage).values(messageData);

      // update session title from first user message if it's still "New Chat"
      if (chatSessionData[0].title === "New Chat") {
        const firstUserMessage = messages.find((msg) => msg.role === "user");
        if (firstUserMessage) {
          const title = firstUserMessage.parts
            .filter((part) => part.type === "text")
            .map((part) => (part as { text: string }).text)
            .join("")
            .slice(0, 50);

          await tx
            .update(chatSession)
            .set({
              title: title + (title.length >= 50 ? "..." : ""),
              updatedAt: new Date(),
            })
            .where(eq(chatSession.id, sessionId));
        }
      } else {
        // just update the timestamp
        await tx
          .update(chatSession)
          .set({ updatedAt: new Date() })
          .where(eq(chatSession.id, sessionId));
      }
    }
  });
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  return await db
    .select()
    .from(chatSession)
    .where(eq(chatSession.userId, session.user.id))
    .orderBy(desc(chatSession.updatedAt));
}

export async function deleteChatSession(id: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // verify session belongs to user
  const chatSessionData = await db
    .select()
    .from(chatSession)
    .where(eq(chatSession.id, id))
    .limit(1);

  if (
    chatSessionData.length === 0 ||
    chatSessionData[0].userId !== session.user.id
  ) {
    throw new Error("Chat session not found");
  }

  // delete messages first (cascade should handle this, but being explicit)
  await db.delete(chatMessage).where(eq(chatMessage.sessionId, id));

  // delete session
  await db.delete(chatSession).where(eq(chatSession.id, id));
}