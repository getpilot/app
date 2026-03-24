import { NextRequest, NextResponse } from "next/server";
import { loadChatSession, deleteChatSession } from "@/lib/chat-store";
import { deleteMemoryDocument, getWorkspaceChatCustomId } from "@pilot/core/memory/supermemory";
import { getUser } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await loadChatSession(id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to load chat session:", error);
    return NextResponse.json(
      { error: "Failed to load chat session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteChatSession(id);
    await deleteMemoryDocument(getWorkspaceChatCustomId(user.id, id)).catch(
      (error) => {
        console.error("Failed to delete workspace memory:", error);
      },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}
