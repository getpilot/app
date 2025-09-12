"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { sanitizeText } from "@/lib/utils";
import {
  AUTOMATION_PROMPTS,
  formatAutomationPrompt,
} from "@/lib/constants/automations";

const geminiModel = google("gemini-2.5-flash");

export type GenerateAutomationResponseParams = {
  prompt: string;
  userMessage: string;
  context?: string;
};

export type GenerateAutomationResponseResult = {
  text: string;
};

export async function generateAutomationResponse(
  params: GenerateAutomationResponseParams
): Promise<GenerateAutomationResponseResult | null> {
  try {
    const { prompt, userMessage, context } = params;

    const systemPrompt = context
      ? `${AUTOMATION_PROMPTS.AI_RESPONSE.SYSTEM}\n\nContext from conversation:\n${context}`
      : AUTOMATION_PROMPTS.AI_RESPONSE.SYSTEM;

    const mainPrompt = formatAutomationPrompt(
      AUTOMATION_PROMPTS.AI_RESPONSE.MAIN,
      {
        prompt,
        userMessage,
      }
    );

    const aiResult = await generateText({
      model: geminiModel,
      system: systemPrompt,
      prompt: mainPrompt,
      temperature: 0.4,
      maxOutputTokens: 500,
    });

    const replyText = sanitizeText(aiResult.text);
    if (!replyText || replyText.trim().length === 0) {
      return null;
    }

    return { text: replyText };
  } catch (error) {
    console.error("Failed to generate automation response:", error);
    return null;
  }
}