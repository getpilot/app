import { generateText, geminiModel } from "../ai/model";
import { sanitizeText } from "../utils";
import { AUTOMATION_AI_MAIN, AUTOMATION_AI_SYSTEM } from "./constants";

export type GenerateAutomationResponseParams = {
  prompt: string;
  userMessage: string;
  context?: string;
};

export type GenerateAutomationResponseResult = {
  text: string;
};

function formatAutomationPrompt(
  promptTemplate: string,
  variables: Record<string, string>,
): string {
  let formattedPrompt = promptTemplate;

  for (const [key, value] of Object.entries(variables)) {
    formattedPrompt = formattedPrompt.split(`{${key}}`).join(String(value));
  }

  return formattedPrompt;
}

export async function generateAutomationResponse(
  params: GenerateAutomationResponseParams,
): Promise<GenerateAutomationResponseResult | null> {
  try {
    const { prompt, userMessage, context } = params;

    const systemPrompt = context
      ? `${AUTOMATION_AI_SYSTEM}\n\nContext from conversation:\n${context}`
      : AUTOMATION_AI_SYSTEM;

    const mainPrompt = formatAutomationPrompt(AUTOMATION_AI_MAIN, {
      prompt,
      userMessage,
    });

    const aiResult = await generateText({
      model: geminiModel,
      system: systemPrompt,
      prompt: mainPrompt,
      temperature: 0.4,
      maxOutputTokens: 500,
    });

    const replyText = sanitizeText(aiResult.text || "");
    if (!replyText) {
      return null;
    }

    return { text: replyText };
  } catch (error) {
    console.error("Failed to generate automation response:", error);
    return null;
  }
}
