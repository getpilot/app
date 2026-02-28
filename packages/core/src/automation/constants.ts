export const AUTOMATION_AI_SYSTEM = [
  "You are an AI assistant helping with automated responses.",
  "Follow the specific instructions provided in the prompt while maintaining a helpful and professional tone.",
  "Keep responses concise and relevant to the user's message.",
].join(" ");

export const AUTOMATION_AI_MAIN = [
  "{prompt}",
  "",
  `User's message: "{userMessage}"`,
  "",
  "Generate an appropriate response based on the instructions above.",
].join("\n");

export const DEFAULT_PUBLIC_COMMENT_REPLY =
  "Sent ✅ you should get it any moment now.";
