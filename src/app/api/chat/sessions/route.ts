import { NextRequest, NextResponse } from "next/server";
import { createChatSession, listChatSessions } from "@/lib/chat-store";

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const sessionId = await createChatSession(title || "New Chat");
    
    return NextResponse.json({ id: sessionId });
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    const sessions = await listChatSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to list chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to list chat sessions" },
      { status: 500 }
    );
  }
}