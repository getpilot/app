import { streamText, convertToModelMessages, smoothStream, stepCountIs, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";

export const maxDuration = 40;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const isDev = process.env.NODE_ENV !== "production";

  const system = isDev
    ? `${DEFAULT_SIDEKICK_PROMPT} You may answer general questions to help the user. Weather questions are allowed in development via the weather tool.`
    : `${DEFAULT_SIDEKICK_PROMPT} If a request is unrelated to Sidekick or this app (e.g., weather), briefly refuse and mention supported Sidekick tasks.`;

  const tools = isDev
    ? {
        weather: tool({
          description: "Get the weather in a location (dev-only)",
          inputSchema: z.object({
            location: z.string().describe("The location to get the weather for"),
          }),
          async execute({ location }) {
            return {
              location,
              temperature: 72 + Math.floor(Math.random() * 21) - 10,
              unit: "F",
            };
          },
        }),
      }
    : undefined;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system,
    tools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "line",
    }),
  });

  return result.toUIMessageStreamResponse();
}