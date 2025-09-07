import { NextRequest, NextResponse } from "next/server";
import { listChatSessions, createChatSession } from "@/lib/chat-store";

export async function GET() {
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

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();
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