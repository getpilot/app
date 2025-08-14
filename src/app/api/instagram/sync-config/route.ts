import { NextResponse } from "next/server";
import {
  getInstagramSyncConfig,
  updateInstagramSyncInterval,
} from "@/actions/instagram";

export async function GET() {
  try {
    const cfg = await getInstagramSyncConfig();
    if (!cfg || !cfg.connected) {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json(
      { connected: false, error: "failed to load config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid JSON" },
      { status: 400 }
    );
  }

  // safely extract intervalHours without using any
  const intervalHoursValue =
    typeof body === "object" && body !== null && "intervalHours" in body
      ? (body as { intervalHours?: unknown }).intervalHours
      : undefined;
  const hours =
    typeof intervalHoursValue === "number" ||
    typeof intervalHoursValue === "string"
      ? Number(intervalHoursValue)
      : NaN;
      
  if (!Number.isFinite(hours) || !Number.isInteger(hours) || hours <= 0) {
    return NextResponse.json(
      { success: false, error: "intervalHours must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const result = await updateInstagramSyncInterval(hours);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "failed to update sync interval" },
      { status: 500 }
    );
  }
}