import { NextResponse } from "next/server";
import { getInstagramIntegration } from "@/actions/instagram";

export async function GET() {
  try {
    const integration = await getInstagramIntegration();
    
    if (!integration.connected) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      username: integration.username,
      id: integration.id,
    });
  } catch (error) {
    console.error("Instagram connection check failed:", error);
    return NextResponse.json({ connected: false, error: String(error) });
  }
} 