import { generateId } from "ai";
import { UIMessage } from "ai";
import { convex, api } from "@/lib/convex-client";
import { getUser } from "@/lib/auth-utils";
import { Id } from "../../convex/_generated/dataModel";

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
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const id = generateId();

  await convex.mutation(api.chat.createChatSession, {
    userId: user._id as Id<"user">,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return id;
}

export async function loadChatSession(id: string): Promise<UIMessage[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const chatSessionData = await convex.query(api.chat.getChatSession, {
    id: id as Id<"chatSession">,
  });

  if (!chatSessionData || chatSessionData.userId !== user._id) {
    throw new Error("Chat session not found");
  }

  const messages = await convex.query(api.chat.getChatMessagesSorted, {
    sessionId: id as Id<"chatSession">,
  });

  return messages.map((msg) => {
    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new Error(
        `Invalid message role: ${msg.role}. Expected 'user' or 'assistant'.`
      );
    }

    return {
      id: msg._id,
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
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const chatSessionData = await convex.query(api.chat.getChatSession, {
    id: sessionId as Id<"chatSession">,
  });

  if (!chatSessionData || chatSessionData.userId !== user._id) {
    throw new Error("Chat session not found");
  }

  const existingMessages = await convex.query(api.chat.getChatMessages, {
    sessionId: sessionId as Id<"chatSession">,
  });

  for (const msg of existingMessages) {
    await convex.mutation(api.chat.deleteChatMessage, {
      id: msg._id,
    });
  }

  if (messages.length > 0) {
    for (const msg of messages) {
      const messageId = msg.id || generateId();
      console.log(
        `Saving message - Role: ${msg.role}, ID: ${messageId}, Original ID: ${msg.id}`
      );

      await convex.mutation(api.chat.createChatMessage, {
        sessionId: sessionId as Id<"chatSession">,
        role: msg.role as "user" | "assistant",
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as { text: string }).text)
          .join(""),
        createdAt: Date.now(),
      });
    }

    if (chatSessionData.title === "New Chat") {
      const firstUserMessage = messages.find((msg) => msg.role === "user");
      if (firstUserMessage) {
        const title = firstUserMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as { text: string }).text)
          .join("")
          .slice(0, 50);

        await convex.mutation(api.chat.updateChatSession, {
          id: sessionId as Id<"chatSession">,
          title: title + (title.length >= 50 ? "..." : ""),
          updatedAt: Date.now(),
        });
      }
    } else {
      await convex.mutation(api.chat.updateChatSession, {
        id: sessionId as Id<"chatSession">,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const sessions = await convex.query(api.chat.getChatSessions, {
    userId: user._id as Id<"user">,
  });

  return sessions.map((session) => ({
    id: session._id,
    userId: session.userId,
    title: session.title,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  }));
}

export async function deleteChatSession(id: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const chatSessionData = await convex.query(api.chat.getChatSession, {
    id: id as Id<"chatSession">,
  });

  if (!chatSessionData || chatSessionData.userId !== user._id) {
    throw new Error("Chat session not found");
  }

  const messages = await convex.query(api.chat.getChatMessages, {
    sessionId: id as Id<"chatSession">,
  });

  for (const msg of messages) {
    await convex.mutation(api.chat.deleteChatMessage, {
      id: msg._id,
    });
  }

  await convex.mutation(api.chat.deleteChatSession, {
    id: id as Id<"chatSession">,
  });
}