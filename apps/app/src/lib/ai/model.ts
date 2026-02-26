import { google } from "@ai-sdk/google";
export { generateText } from "ai";

export const geminiModel = google("gemini-flash-latest");

/**
 * Strip markdown code fences (```json … ```) and stray backticks from
 * raw LLM output so the result is plain text / JSON.
 */
export function stripFences(raw: string): string {
  return raw
    .replace(/```[a-zA-Z]*\s*/g, "")
    .replace(/```/g, "")
    .replace(/`/g, "")
    .trim();
}

/**
 * Robustly parse a JSON object from an LLM response.
 *
 * 1. Strips markdown fences.
 * 2. Attempts `JSON.parse`.
 * 3. Falls back to extracting the first `{…}` block via regex.
 * 4. Returns `null` if nothing works.
 */
export function parseJsonResponse<T = Record<string, unknown>>(
  raw: string,
): T | null {
  const cleaned = stripFences(raw);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fallback: extract first JSON object via regex
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
