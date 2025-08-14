import { NextResponse } from "next/server";
import {
  getInstagramSyncConfig,
  updateInstagramSyncInterval,
} from "@/actions/instagram";

export async function GET() {
  const cfg = await getInstagramSyncConfig();
  
  if (!cfg.connected) return NextResponse.json({ connected: false });
  return NextResponse.json(cfg);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hours = Number(body?.intervalHours);

    const result = await updateInstagramSyncInterval(hours);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid request" },
      { status: 400 }
    );
  }
}