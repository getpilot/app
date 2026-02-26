import { NextResponse } from "next/server";
import { disconnectInstagram } from "@/actions/instagram";

export async function GET() {
  try {
    console.log("Disconnecting Instagram...");
    const result = await disconnectInstagram();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to disconnect Instagram");
    }
    
    console.log("Instagram disconnected successfully");
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_disconnected`);
  } catch (error) {
    console.error("Instagram disconnect error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=disconnect_failed`
    );
  }
}