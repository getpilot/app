import { streamText, convertToModelMessages, smoothStream } from "ai";
import { google } from "@ai-sdk/google";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";

export const maxDuration = 40;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system: DEFAULT_SIDEKICK_PROMPT,
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "line",
    }),
  });

  return result.toUIMessageStreamResponse();
}