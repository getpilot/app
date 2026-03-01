import { google } from "@ai-sdk/google";
export { generateText } from "ai";

export const geminiModel = google("gemini-flash-latest");

export function stripFences(raw: string): string {
  return raw
    .replace(/```[a-zA-Z]*\s*/g, "")
    .replace(/```/g, "")
    .replace(/`/g, "")
    .trim();
}

export function parseJsonResponse<T = Record<string, unknown>>(
  raw: string,
): T | null {
  const cleaned = stripFences(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
