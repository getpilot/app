"use server";

import { getPersonalizedSidekickData } from "./personalized-data";
import { formatPersonalizedPrompt, PROMPTS } from "@/lib/constants/sidekick";

export async function getPersonalizedSidekickPrompt(
  promptType: keyof typeof PROMPTS,
  additionalVariables: Record<string, string> = {}
) {
  const result = await getPersonalizedSidekickData();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch personalized data");
  }

  const promptTemplate = PROMPTS[promptType].MAIN;
  const personalizedPrompt = formatPersonalizedPrompt(
    promptTemplate,
    result.data
  );

  let finalPrompt = personalizedPrompt;
  for (const [key, value] of Object.entries(additionalVariables)) {
    const placeholder = `{${key}}`;
    finalPrompt = finalPrompt.replace(new RegExp(placeholder, "g"), value);
  }

  return {
    system: PROMPTS[promptType].SYSTEM,
    main: finalPrompt,
  };
}

export async function getPersonalizedLeadAnalysisPrompt(
  conversationHistory: string
) {
  return getPersonalizedSidekickPrompt("LEAD_ANALYSIS", {
    conversationHistory,
  });
}

export async function getPersonalizedFollowUpPrompt(
  customerName: string,
  stage: string,
  leadScore: number,
  lastMessage: string,
  conversationHistory: string
) {
  return getPersonalizedSidekickPrompt("FOLLOW_UP", {
    customerName,
    stage,
    leadScore: leadScore.toString(),
    lastMessage,
    conversationHistory,
  });
}

export async function getPersonalizedAutoReplyPrompt(
  conversationContext: string
) {
  return getPersonalizedSidekickPrompt("AUTO_REPLY", {
    conversationContext,
  });
}

export async function getPersonalizedLeadScoringPrompt(
  chatHistory: string,
  userContext: string
) {
  return getPersonalizedSidekickPrompt("LEAD_SCORING", {
    chatHistory,
    userContext,
  });
}

export async function getPersonalizedToneProfilePrompt(samples: string) {
  return getPersonalizedSidekickPrompt("TONE_PROFILE", {
    samples,
  });
}

export async function getPersonalizedFaqGenerationPrompt() {
  return getPersonalizedSidekickPrompt("FAQ_GENERATION");
}

export async function getPersonalizedOfferGenerationPrompt() {
  return getPersonalizedSidekickPrompt("OFFER_GENERATION");
}

export async function getPersonalizedContactTaggingPrompt(
  conversationHistory: string
) {
  return getPersonalizedSidekickPrompt("CONTACT_TAGGING", {
    conversationHistory,
  });
}

export async function getPersonalizedMessageSentimentPrompt(
  message: string,
  context: string
) {
  return getPersonalizedSidekickPrompt("MESSAGE_SENTIMENT", {
    message,
    context,
  });
}