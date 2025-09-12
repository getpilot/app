export const AUTOMATION_PROMPTS = {
  AI_RESPONSE: {
    SYSTEM: `You are an AI assistant helping with automated responses. 
    Follow the specific instructions provided in the prompt while maintaining a helpful and professional tone.
    Keep responses concise and relevant to the user's message.`,

    MAIN: `{prompt}

User's message: "{userMessage}"

Generate an appropriate response based on the instructions above.`,
  },
} as const;

export function formatAutomationPrompt(
  promptTemplate: string,
  variables: Record<string, string>
): string {
  let formattedPrompt = promptTemplate;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    formattedPrompt = formattedPrompt.split(placeholder).join(String(value));
  }

  return formattedPrompt;
}

export const DEFAULT_PUBLIC_COMMENT_REPLY = "Sent ✅ you should get it any moment now.";