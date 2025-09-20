import { NextRequest, NextResponse } from "next/server";
import { createChatSession } from "@/lib/chat-store";

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